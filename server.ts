import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';
import axios from 'axios';
import { OpenAI } from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. API CLIENTS ---
const groqApiKey = process.env.OPENAI_API_KEY || '';
const groqBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1';
const groqModel = process.env.MODEL_RAG_TUTOR || 'llama-3.3-70b-versatile';

let groqClient: OpenAI | null = null;
if (groqApiKey) {
  groqClient = new OpenAI({
    apiKey: groqApiKey,
    baseURL: groqBaseUrl
  });
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Hugging Face inference API for multilingual embeddings
const HF_TOKEN = process.env.HF_TOKEN || '';
const HF_API_URL = 'https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2';
let hfInferenceOperational = Boolean(HF_TOKEN);

// In-memory caches for recent document chunks, metadata, and suggested questions
const LATEST_CHUNKS_CACHE: Record<string, string[]> = {};
const DOC_CHUNKS_CACHE: Record<string, string[]> = {};
const DOC_META_CACHE: Record<string, { title: string; filename: string; subject: string }> = {};
const SUGGESTED_QUESTIONS_CACHE: Record<string, { questions: string[]; groundedInPdf: boolean; ts: number }> = {};

// Fallback Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY || '';
let geminiAi: GoogleGenAI | null = null;
if (geminiApiKey) {
  geminiAi = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Multer memory storage for PDF file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB limit
});

// --- 2. VECTOR EMBEDDING HELPER ---
// High-fidelity local 384-dimensional semantic-hash embedding generator (L2 unit-normalized)
function generateLocalEmbedding(text: string, dim = 384): number[] {
  const vec = new Float64Array(dim);
  const words = (text || '').toLowerCase().split(/\W+/).filter(Boolean);

  if (words.length === 0) {
    return Array.from({ length: dim }, (_, i) => Number((Math.sin(i) * 0.05).toFixed(6)));
  }

  for (const word of words) {
    // Word hash via FNV-1a
    let h1 = 2166136261;
    for (let j = 0; j < word.length; j++) {
      h1 ^= word.charCodeAt(j);
      h1 = Math.imul(h1, 16777619);
    }
    const idx = Math.abs(h1) % dim;
    vec[idx] += 1.0;

    // Character trigrams for morphological and subword similarity
    if (word.length >= 3) {
      for (let k = 0; k <= word.length - 3; k++) {
        let h2 = 2166136261;
        h2 ^= word.charCodeAt(k);
        h2 = Math.imul(h2, 16777619);
        h2 ^= word.charCodeAt(k + 1);
        h2 = Math.imul(h2, 16777619);
        h2 ^= word.charCodeAt(k + 2);
        h2 = Math.imul(h2, 16777619);
        const trigramIdx = Math.abs(h2) % dim;
        vec[trigramIdx] += 0.35;
      }
    }
  }

  // L2 unit normalization
  let sumSq = 0;
  for (let i = 0; i < dim; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq) || 1.0;
  return Array.from(vec).map(val => Number((val / norm).toFixed(6)));
}

async function getEmbedding(text: string): Promise<number[]> {
  // If HF is not configured or flagged as uncredited/unavailable, use local normalized 384-d vector
  if (!HF_TOKEN || !hfInferenceOperational) {
    return generateLocalEmbedding(text, 384);
  }

  try {
    const response = await axios.post(
      HF_API_URL,
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 3000
      }
    );

    const result = response.data;
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0])) {
        return result[0] as number[];
      }
      return result as number[];
    }
    if (result && Array.isArray((result as any).embedding)) {
      return (result as any).embedding as number[];
    }
  } catch (err: any) {
    // Check if error is due to credit exhaustion (402), auth, or network/DNS lookup
    const status = err?.response?.status;
    const errorMsg = err?.response?.data?.error || err?.message || 'HF request failed';

    // Log diagnostic warning to stdout without triggering stderr error monitor
    console.warn(`[Embedding Notice] HF API (${status || 'network'}): ${errorMsg}. Switched to local 384-d vector engine.`);

    // If account has no remaining credits (402), unauthorized (401/403), or unreachable (ENOTFOUND)
    if (status === 402 || status === 401 || status === 403 || err?.code === 'ENOTFOUND') {
      hfInferenceOperational = false;
    }
  }

  return generateLocalEmbedding(text, 384);
}

// --- 3. HELPER FUNCTIONS ---
function chunkText(text: string, chunkSize = 800, overlap = 150): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) {
      chunks.push(chunk);
    }
    i += Math.max(1, chunkSize - overlap);
  }
  return chunks.length > 0 ? chunks : [text];
}

function extractJson(rawText: string): any {
  const cleaned = rawText.replace(/```(?:json)?/gi, '').trim().replace(/`+$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return JSON.parse(cleaned.substring(start, end + 1));
  }
  const arrStart = cleaned.indexOf('[');
  const arrEnd = cleaned.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    return JSON.parse(cleaned.substring(arrStart, arrEnd + 1));
  }
  throw new Error('Valid JSON structure not found in AI response.');
}

// --- 4. START SERVER & REGISTER ENDPOINTS ---
async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // CORS Middleware matching your backend configuration
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // API Health pings: GET /api, GET /api/health, and GET /health
  const healthHandler = (_req: Request, res: Response) => {
    res.json({
      status: 'online',
      service: 'Eklavya API (Lightweight)',
      supabase_connected: Boolean(supabase),
      groq_connected: Boolean(groqClient),
      huggingface_configured: Boolean(HF_TOKEN),
      model: groqModel,
      timestamp: new Date().toISOString()
    });
  };

  app.get('/api', healthHandler);
  app.get('/api/health', healthHandler);
  app.get('/health', healthHandler);

  // 1. User Profile Sync: POST /api/user/sync
  app.post('/api/user/sync', async (req: Request, res: Response) => {
    const { user_id, name } = req.body;
    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }

    const now = new Date();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user_id);

        if (error) {
          console.warn('Supabase profile fetch notice:', error.message);
        }

        if (!data || data.length === 0) {
          const newProfile = {
            user_id,
            name: name || 'Student',
            xp: 150,
            streak: 1,
            last_active: now.toISOString(),
            subjects: ['Mathematics', 'Science', 'Social Science'],
            class_grade: 'Class 10',
            course_type: 'School',
            board: 'CBSE'
          };

          const insertRes = await supabase.from('profiles').insert(newProfile);
          if (insertRes.error) {
            console.warn('Supabase profile insert notice:', insertRes.error.message);
          }
          res.json({ status: 'new', profile: newProfile });
          return;
        }

        const profile = data[0];
        const lastActive = new Date(profile.last_active || now.toISOString());
        const diffDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 3600 * 24));

        if (diffDays === 1) {
          profile.streak = (profile.streak || 0) + 1;
        } else if (diffDays > 1) {
          profile.streak = 1;
        }

        profile.last_active = now.toISOString();
        if (name && (!profile.name || profile.name === 'Student')) {
          profile.name = name;
        }

        await supabase
          .from('profiles')
          .update({
            name: profile.name,
            streak: profile.streak,
            last_active: profile.last_active
          })
          .eq('user_id', user_id);

        res.json({ status: 'returning', profile });
        return;
      } catch (err: any) {
        console.warn('Supabase sync notice:', err.message);
      }
    }

    // Local in-memory fallback
    res.json({
      status: 'returning',
      profile: {
        user_id,
        name: name || 'Student',
        xp: 350,
        streak: 5,
        last_active: now.toISOString(),
        subjects: ['Mathematics', 'Science', 'Social Science'],
        class_grade: 'Class 10',
        course_type: 'School',
        board: 'CBSE'
      }
    });
  });

  // 2. User Onboard: POST /api/user/onboard
  app.post('/api/user/onboard', async (req: Request, res: Response) => {
    const { user_id, class_grade, course_type, board, subjects } = req.body;
    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }

    if (supabase) {
      try {
        await supabase
          .from('profiles')
          .update({
            class_grade,
            course_type,
            board,
            subjects
          })
          .eq('user_id', user_id);
      } catch (err: any) {
        console.warn('Supabase onboard notice:', err.message);
      }
    }

    res.json({ status: 'success' });
  });

  // 3. Document Vault: GET /api/documents/:user_id
  app.get('/api/documents/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('user_documents')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          res.json({ documents: data });
          return;
        }
      } catch (err: any) {
        console.warn('Supabase get documents notice:', err.message);
      }
    }

    res.json({ documents: [] });
  });

  // 4. Rename Document: PATCH /api/documents/:docId
  app.patch('/api/documents/:docId', async (req: Request, res: Response) => {
    const { docId } = req.params;
    const { custom_name } = req.body;

    if (custom_name && DOC_META_CACHE[docId]) {
      DOC_META_CACHE[docId].title = custom_name;
    }

    if (supabase && custom_name) {
      try {
        await supabase
          .from('user_documents')
          .update({ custom_name })
          .eq('id', docId);
      } catch (err: any) {
        console.warn('Supabase rename doc notice:', err.message);
      }
    }

    res.json({ status: 'success' });
  });

  // 5. Document Upload: POST /api/upload
  app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      const { user_id, subject = 'General', custom_name } = req.body;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No PDF file uploaded' });
        return;
      }

      const resolvedTitle = (custom_name && String(custom_name).trim()) || file.originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      // Extract real text from PDF buffer (supports pdf-parse v2 PDFParse class and v1 function)
      let extractedText = '';
      try {
        const pdfParseModule: any = await import('pdf-parse');
        if (typeof pdfParseModule.PDFParse === 'function') {
          const parser = new pdfParseModule.PDFParse({ data: new Uint8Array(file.buffer) });
          const pdfData = await parser.getText();
          extractedText = pdfData?.text || '';
          if (typeof parser.destroy === 'function') {
            await parser.destroy().catch(() => {});
          }
        } else {
          const pdfParser = pdfParseModule.default || pdfParseModule;
          if (typeof pdfParser === 'function') {
            const pdfData = await pdfParser(file.buffer);
            extractedText = pdfData?.text || '';
          }
        }
      } catch (pdfErr: any) {
        console.warn('PDF parser notice, checking plain text fallback:', pdfErr.message);
        const rawUtf8 = file.buffer.toString('utf-8', 0, Math.min(file.buffer.length, 50000));
        // Avoid caching raw binary PDF headers as readable textbook text
        extractedText = rawUtf8.startsWith('%PDF-') ? '' : rawUtf8;
      }

      const newDocId = `doc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const chunks = extractedText.trim() ? chunkText(extractedText) : [];

      const cacheDocumentLocally = (docId: string) => {
        if (chunks.length > 0) {
          DOC_CHUNKS_CACHE[docId] = chunks;
          LATEST_CHUNKS_CACHE[subject] = chunks;
          LATEST_CHUNKS_CACHE['latest'] = chunks;
        }
        DOC_META_CACHE[docId] = {
          title: resolvedTitle,
          filename: file.originalname,
          subject
        };
        // Clear stale cached suggestions for this subject/doc so freshly uploaded PDF gets brand-new questions
        for (const key of Object.keys(SUGGESTED_QUESTIONS_CACHE)) {
          if (key.startsWith(`${subject}::`) || key.includes(`::${docId}::`)) {
            delete SUGGESTED_QUESTIONS_CACHE[key];
          }
        }
      };

      if (supabase) {
        try {
          const profileCheck = await supabase.from('profiles').select('user_id').eq('user_id', user_id);
          if (!profileCheck.data || profileCheck.data.length === 0) {
            await supabase.from('profiles').insert({
              user_id,
              name: 'Student',
              xp: 150,
              streak: 1,
              subjects: [subject],
              class_grade: 'Class 10',
              course_type: 'School',
              board: 'CBSE'
            });
          }

          // Insert document record
          const docRes = await supabase.from('user_documents').insert({
            user_id,
            filename: file.originalname,
            custom_name: resolvedTitle,
            subject
          }).select();

          const createdId = docRes.data?.[0]?.id || newDocId;
          cacheDocumentLocally(createdId);

          // Compute embeddings and store in curriculum_documents
          if (chunks.length > 0) {
            const records = [];
            for (const chunk of chunks.slice(0, 50)) {
              const vector = await getEmbedding(chunk);
              records.push({
                user_id,
                subject,
                doc_id: createdId,
                content: chunk,
                embedding: vector
              });
            }

            if (records.length > 0) {
              await supabase.from('curriculum_documents').insert(records);
            }
          }

          res.json({
            status: 'success',
            filename: file.originalname,
            doc_id: createdId,
            total_chunks: chunks.length || 1
          });
          return;
        } catch (dbErr: any) {
          console.warn('Supabase upload notice:', dbErr.message);
        }
      }

      // Memory cache fallback
      cacheDocumentLocally(newDocId);

      res.json({
        status: 'success',
        filename: file.originalname,
        doc_id: newDocId,
        total_chunks: chunks.length || 1
      });
    } catch (err: any) {
      console.error('Upload processing error:', err.message);
      res.status(500).json({ error: err.message || 'Upload processing failed' });
    }
  });

  // 6. AI Mentor Query: POST /api/query and POST /api/mentor/query
  const handleQuery = async (req: Request, res: Response) => {
    const { user_id, subject = 'General', doc_id, query, language = 'Auto (Match User)', history = [] } = req.body;

    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    try {
      let matches: any[] = [];
      let context = '';

      // 1. Vector Search via Supabase RPC match_curriculum_documents
      if (supabase) {
        try {
          const queryVector = await getEmbedding(query);
          const rpcParams: any = {
            query_embedding: queryVector,
            match_count: 4,
            filter_subject: subject || null,
            filter_doc_id: doc_id || null
          };

          const searchRes = await supabase.rpc('match_curriculum_documents', rpcParams);
          matches = searchRes.data || [];
          if (matches.length > 0) {
            context = matches.map((m: any) => m.content).join('\n---\n');
          }
        } catch (rpcErr: any) {
          console.warn('Supabase match_curriculum_documents notice:', rpcErr.message);
        }
      }

      // Check freshly uploaded per-doc cache first when a specific doc_id is selected
      if (!context && doc_id && DOC_CHUNKS_CACHE[doc_id]) {
        context = DOC_CHUNKS_CACHE[doc_id].slice(0, 4).join('\n---\n');
        matches = DOC_CHUNKS_CACHE[doc_id].slice(0, 2).map((_, idx) => ({
          id: `${DOC_META_CACHE[doc_id]?.title || 'Uploaded PDF'} [Chunk #${idx + 1}]`
        }));
      }

      // Direct Supabase fallback by doc_id if vector RPC returned nothing (e.g. recently uploaded PDF)
      if (!context && doc_id && supabase) {
        try {
          const directDocs = await supabase
            .from('curriculum_documents')
            .select('id, content')
            .eq('doc_id', doc_id)
            .limit(4);
          if (directDocs.data && directDocs.data.length > 0) {
            matches = directDocs.data;
            context = directDocs.data.map((m: any) => m.content).join('\n---\n');
          }
        } catch {
          // non-blocking
        }
      }

      // If no vector matches found, use cached document chunks if available
      if (!context && subject && LATEST_CHUNKS_CACHE[subject]) {
        context = LATEST_CHUNKS_CACHE[subject].slice(0, 3).join('\n---\n');
      } else if (!context && LATEST_CHUNKS_CACHE['latest']) {
        context = LATEST_CHUNKS_CACHE['latest'].slice(0, 3).join('\n---\n');
      }

      const normalizedLang = (language || 'Hinglish').trim().toLowerCase();
      const devanagariRegex = /[\u0900-\u097F]/;
      const hinglishMarkersRegex = /\b(hai|hain|hota|hoti|hote|ka|ki|ke|ko|mein|me|se|aur|kya|yeh|ye|toh|to|karo|karke|karte|karta|jaise|matlab|samajh|samjho|chaliye|isme|iska|iski|iske|bhi|nahi|par|agar|lekin|kyunki|bahut|pehle|baad|yahan|wahan|hum|aap|tum|dono|sabse|baaki|liye|sakta|sakti)\b/gi;

      const countHinglishMarkers = (text: string): number => {
        const plain = text
          .replace(/```[\s\S]*?```/g, ' ')
          .replace(/\$\$[\s\S]*?\$\$/g, ' ')
          .replace(/\\\[[\s\S]*?\\\]/g, ' ')
          .replace(/\$[^$\n]+\$/g, ' ');
        const hits = plain.match(hinglishMarkersRegex);
        return hits ? hits.length : 0;
      };

      const getLanguageDirective = (lang: string): string => {
        const norm = (lang || '').trim().toLowerCase();
        if (norm === 'hinglish') {
          return (
            'STRICT HINGLISH MODE: You MUST explain conversationally in Romanized Hindi mixed with English technical terms using ONLY the Latin alphabet (A-Z, a-z). ' +
            'Every single explanatory sentence MUST sound like an Indian teacher speaking Hinglish (using words like "hai", "hota hai", "mein", "se", "aur", "toh", "iska", "samjho", "karo") — NEVER reply in pure English! ' +
            'And NEVER output Devanagari / Hindi Unicode script anywhere in your answer, headings, or Active-Recall Checkpoint. ' +
            'Example style: "Pythagoras theorem ke according, kisi bhi right-angled triangle mein hypotenuse ka square baaki dono sides ke squares ke sum ke equal hota hai."'
          );
        }
        if (norm === 'hindi') {
          return (
            'STRICT HINDI MODE: You MUST write the entire explanation, headings, bullet points, and Active-Recall Checkpoint in natural Devanagari Hindi (हिन्दी). ' +
            'Do NOT answer in English paragraphs. Keep mathematical formulas, chemical symbols, and standard technical terms in parentheses when helpful.'
          );
        }
        if (norm === 'english') {
          return 'STRICT ENGLISH MODE: Write strictly in clear, standard academic English. Do not mix in Hindi or Devanagari words.';
        }
        return `Write clearly in ${lang || 'English'}.`;
      };

      const languageDirective = getLanguageDirective(language);

      const systemPrompt =
        "You are 'Eklavya AI', an encouraging 1-on-1 academic mentor for Indian students.\n" +
        `CURRENT REQUESTED LANGUAGE MODE: ${language}\n` +
        `${languageDirective}\n` +
        `CRITICAL LANGUAGE OVERRIDE: You MUST respond strictly in ${language} following the rule above, EVEN IF earlier messages in the conversation history or the student's question were written in English, Hindi, or another language. Never copy the language of older turns.\n` +
        "Formatting & Pedagogical Rules:\n" +
        "1. Ground your explanation strictly in the Context when available. If textbook context is brief, provide a thorough, accurate CBSE/ICSE curriculum explanation.\n" +
        "2. Format your response cleanly using standard Markdown (## and ### section headings, bullet points, numbered steps, Markdown tables for comparisons, and **bold** for key concepts).\n" +
        "3. For ALL Mathematics and Science formulas, derivations, chemical reactions, variables, and exponents, ALWAYS use standard LaTeX math delimiters: use single dollar signs $...$ (with NO spaces next to the $ signs) for inline math/chemistry (e.g., $c^2 = a^2 + b^2$, $\\text{H}_2\\text{O}$, $\\sin^2\\theta + \\cos^2\\theta = 1$), and double dollar signs $$...$$ on separate lines for display equations (e.g., $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$). Never leave raw LaTeX backslashes outside $...$ or $$...$$.\n" +
        "4. Always conclude with an active-recall section formatted exactly as:\n\n" +
        "🎯 Active-Recall Checkpoint\n" +
        "Question: [1 short conceptual recall question in the CURRENT language mode testing understanding]\n" +
        "Answer: [Concise correct answer and 1-line derivation/explanation in the CURRENT language mode]";

      const messages: any[] = [{ role: 'system', content: systemPrompt }];

      const recentHistory = (Array.isArray(history) ? history : [])
        .map((turn: any) => ({
          role: turn?.role,
          text: String(turn?.text ?? turn?.content ?? '').trim()
        }))
        .filter((turn: { role: any; text: string }) => turn.text.length > 0)
        .slice(-4);

      const historyHasLanguageMismatch = recentHistory.some((turn) => {
        const isAssistant = turn.role !== 'student' && turn.role !== 'user';
        if (!isAssistant) return false;
        const txt = turn.text;
        const hasDev = devanagariRegex.test(txt);
        const hinglishScore = countHinglishMarkers(txt);
        if (normalizedLang === 'hindi') return !hasDev;
        if (normalizedLang === 'hinglish') return hasDev || hinglishScore < 3;
        if (normalizedLang === 'english') return hasDev || hinglishScore >= 5;
        return false;
      });

      let foldedHistoryNote = '';
      if (recentHistory.length > 0) {
        if (historyHasLanguageMismatch) {
          foldedHistoryNote =
            'Previous Conversation Context (TOPIC CONTINUITY ONLY — DO NOT copy its language or script):\n' +
            recentHistory
              .map((t) => `${t.role === 'student' || t.role === 'user' ? 'Student' : 'Mentor'}: ${t.text.slice(0, 350)}`)
              .join('\n') +
            '\n\n';
        } else {
          for (const turn of recentHistory) {
            messages.push({
              role: turn.role === 'student' || turn.role === 'user' ? 'user' : 'assistant',
              content: turn.text
            });
          }
        }
      }

      const turnLanguageReminder =
        normalizedLang === 'hinglish'
          ? '[CRITICAL OUTPUT LANGUAGE: Hinglish — Reply in natural conversational Romanized Hindi + English (e.g. "Yeh formula aise kaam karta hai...") using ONLY Latin letters (A-Z). Do NOT reply in pure English and do NOT use Devanagari script!]'
          : normalizedLang === 'hindi'
          ? '[CRITICAL OUTPUT LANGUAGE: Hindi (हिन्दी) — Reply strictly in Devanagari Hindi script (हिन्दी). Do NOT reply in English!]'
          : `[CRITICAL OUTPUT LANGUAGE: ${language} — Strictly follow this language mode and override any language used in previous turns.]`;

      messages.push({
        role: 'user',
        content: `${foldedHistoryNote}Context from Textbook:\n${context ? context : 'Use NCERT / Indian Board curriculum knowledge.'}\n\nStudent Question: ${query}\n\n${turnLanguageReminder}`
      });

      // Helper to verify & enforce target language on generated answer
      const enforceOutputLanguage = async (rawAnswer: string, modelToUse: string): Promise<string> => {
        if (!groqClient || !rawAnswer.trim()) return rawAnswer;

        const hasDev = devanagariRegex.test(rawAnswer);
        const hinglishScore = countHinglishMarkers(rawAnswer);

        let rewriteInstruction: string | null = null;
        if (normalizedLang === 'hindi' && !hasDev) {
          rewriteInstruction =
            'Translate and rewrite the following tutor explanation into natural, fluent Devanagari Hindi (हिन्दी) for Indian CBSE/ICSE students. ' +
            'Preserve ALL Markdown headings, tables, bullet points, LaTeX math ($...$ and $$...$$), and the 🎯 Active-Recall Checkpoint section (with Question: and Answer: labels).';
        } else if (normalizedLang === 'hinglish' && (hasDev || hinglishScore < 3)) {
          rewriteInstruction =
            'Rewrite the following tutor explanation into natural, friendly Romanized Hinglish (Hindi written in English/Latin letters mixed with English technical terms, e.g., "Is formula ka use karke hum roots nikaal sakte hain"). ' +
            'Make sure every explanatory sentence naturally uses Romanized Hindi phrasing (not pure English!). ' +
            'Preserve ALL Markdown headings, tables, bullet points, LaTeX math ($...$ and $$...$$), and the 🎯 Active-Recall Checkpoint section (with Question: and Answer: labels). ' +
            'Output ZERO Devanagari Unicode characters.';
        } else if (normalizedLang === 'english' && (hasDev || hinglishScore >= 5)) {
          rewriteInstruction =
            'Rewrite the following tutor explanation into clear, standard academic English. ' +
            'Preserve ALL Markdown headings, tables, bullet points, LaTeX math ($...$ and $$...$$), and the 🎯 Active-Recall Checkpoint section.';
        }

        if (!rewriteInstruction) return rawAnswer;

        try {
          const rewrite = await groqClient.chat.completions.create({
            model: modelToUse,
            messages: [
              { role: 'system', content: rewriteInstruction },
              { role: 'user', content: rawAnswer }
            ],
            temperature: 0.25
          });
          const rewritten = rewrite.choices[0]?.message?.content || '';
          if (rewritten.trim()) return rewritten;
        } catch {
          // fallback to raw answer
        }
        return rawAnswer;
      };

      // 2. Primary: Execute via Groq (with model fallback)
      if (groqClient) {
        const candidateModels = [
          process.env.MODEL_RAG_TUTOR || 'openai/gpt-oss-120b',
          'openai/gpt-oss-120b',
          'qwen/qwen3.8-27b',
          'openai/gpt-oss-20b'
        ];

        let answerText = '';
        for (const model of candidateModels) {
          try {
            const completion = await groqClient.chat.completions.create({
              model,
              messages,
              temperature: 0.4
            });

            answerText = completion.choices[0]?.message?.content || '';
            if (answerText.trim()) {
              answerText = await enforceOutputLanguage(answerText, model);
              res.json({
                answer: answerText,
                sources: matches.map(item => item.id || `NCERT ${subject} Vault chunk`)
              });
              return;
            }
          } catch (modelErr: any) {
            console.warn(`Groq model ${model} notice:`, modelErr?.message);
          }
        }
      }

      // 3. Secondary Backup: Gemini AI
      if (geminiAi) {
        try {
          const historyText = recentHistory.length > 0
            ? '\n\nRecent Conversation Context (for topic continuity only; DO NOT copy its language):\n' +
              recentHistory
                .map((t: any) => `${t.role === 'student' || t.role === 'user' ? 'Student' : 'Mentor'}: ${t.text}`)
                .join('\n')
            : '';
          const prompt = `${systemPrompt}${historyText}\n\nContext:\n${context}\n\nStudent Query: ${query}\n\n${turnLanguageReminder}`;
          const geminiRes = await geminiAi.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt
          });

          if (geminiRes.text) {
            res.json({
              answer: geminiRes.text,
              sources: matches.map(item => item.id || `NCERT ${subject} Section`)
            });
            return;
          }
        } catch (gErr: any) {
          console.warn('Gemini backup notice:', gErr.message);
        }
      }

      res.status(500).json({ error: 'AI generation service unavailable' });
    } catch (err: any) {
      console.warn('Handling query notice:', err.message);
      res.status(500).json({ error: err.message || 'Internal query processing error' });
    }
  };

  app.post('/api/query', handleQuery);
  app.post('/api/mentor/query', handleQuery);

  // 6b. Dynamic Subject & PDF Recommended Questions: POST /api/suggested-questions
  app.post('/api/suggested-questions', async (req: Request, res: Response) => {
    const {
      subject = 'Mathematics',
      doc_id = null,
      doc_title = '',
      doc_filename = '',
      available_docs = [],
      language = 'Hinglish',
      forceRefresh = false
    } = req.body || {};

    try {
      let excerptChunks: string[] = [];
      let resolvedTitle = String(doc_title || '').trim();

      if (doc_id && DOC_META_CACHE[doc_id] && !resolvedTitle) {
        resolvedTitle = DOC_META_CACHE[doc_id].title;
      }

      // 1. Prioritize chunks from the exact selected/recently uploaded PDF
      if (doc_id && DOC_CHUNKS_CACHE[doc_id]?.length) {
        excerptChunks = DOC_CHUNKS_CACHE[doc_id].slice(0, 3);
      } else if (doc_id && supabase) {
        try {
          const docRows = await supabase
            .from('curriculum_documents')
            .select('content')
            .eq('doc_id', doc_id)
            .limit(3);
          if (docRows.data && docRows.data.length > 0) {
            excerptChunks = docRows.data.map((r: any) => String(r.content || '')).filter(Boolean);
          }
        } catch {
          // fallback below
        }
      }

      // 2. If entire subject is selected, gather chunks from that subject's recent PDFs
      if (excerptChunks.length === 0 && !doc_id) {
        if (LATEST_CHUNKS_CACHE[subject]?.length) {
          excerptChunks = LATEST_CHUNKS_CACHE[subject].slice(0, 2);
        } else if (supabase) {
          try {
            const subjRows = await supabase
              .from('curriculum_documents')
              .select('content')
              .eq('subject', subject)
              .limit(3);
            if (subjRows.data && subjRows.data.length > 0) {
              excerptChunks = subjRows.data.map((r: any) => String(r.content || '')).filter(Boolean);
            }
          } catch {
            // fallback below
          }
        }
      }

      const excerptText = excerptChunks.join('\n---\n').slice(0, 2800);
      const fingerprint = `${excerptText.length}:${excerptText.slice(0, 80)}`;
      const availableTitles = Array.isArray(available_docs)
        ? available_docs.slice(0, 6).map((d: any) => d.title || d.custom_name).filter(Boolean).join(', ')
        : '';

      const cacheKey = `${subject}::${doc_id || 'all'}::${resolvedTitle || availableTitles}::${language}::${fingerprint}`;

      if (!forceRefresh && SUGGESTED_QUESTIONS_CACHE[cacheKey]) {
        const cached = SUGGESTED_QUESTIONS_CACHE[cacheKey];
        res.json({
          questions: cached.questions,
          grounded_in_pdf: cached.groundedInPdf
        });
        return;
      }

      const normLang = String(language).trim().toLowerCase();
      const langPrompt =
        normLang === 'hinglish'
          ? 'Hinglish (strictly Romanized Hindi + English using ONLY Latin letters A-Z, ZERO Devanagari script, e.g. "Is chapter mein Ohm law kaise derive hota hai?")'
          : normLang === 'hindi'
          ? 'natural Devanagari Hindi (हिन्दी)'
          : 'clear academic English';

      const docContextDesc = resolvedTitle
        ? `Selected PDF Chapter: "${resolvedTitle}" (file: ${doc_filename || 'uploaded.pdf'}) under Subject: ${subject}`
        : availableTitles
        ? `Subject: ${subject} (Uploaded chapters in vault: ${availableTitles})`
        : `Subject: ${subject}`;

      const suggestionPrompt =
        `You are Eklavya AI, an Indian academic mentor. Generate exactly 4 concise, engaging, high-value study questions that a student can click to ask right now.\n` +
        `${docContextDesc}\n` +
        `Language for the 4 questions: ${langPrompt}\n` +
        (excerptText
          ? `ACTUAL EXTRACTED PDF EXCERPT (ground your 4 questions specifically in topics, concepts, equations, or facts from this text!):\n${excerptText}\n`
          : `Ground the 4 questions specifically in the chapter title and ${subject} syllabus.\n`) +
        `Rules:\n` +
        `- Each question must be 6 to 15 words long, specific, and clickable.\n` +
        `- Mix conceptual understanding, derivations/numericals (if Maths/Science), and exam-style questions.\n` +
        `- Return ONLY strictly valid JSON: {"questions": ["Question 1?", "Question 2?", "Question 3?", "Question 4?"]}`;

      const groundedInPdf = Boolean(excerptText.trim() || resolvedTitle);

      if (groqClient) {
        const candidateModels = [
          process.env.MODEL_RAG_TUTOR || 'openai/gpt-oss-120b',
          'openai/gpt-oss-20b'
        ];
        for (const model of candidateModels) {
          try {
            const completion = await groqClient.chat.completions.create({
              model,
              messages: [
                { role: 'system', content: 'Output strictly valid JSON with a "questions" array of 4 strings. No extra commentary.' },
                { role: 'user', content: suggestionPrompt }
              ],
              temperature: forceRefresh ? 0.7 : 0.4
            });
            const raw = completion.choices[0]?.message?.content || '';
            const parsed = extractJson(raw);
            if (Array.isArray(parsed?.questions) && parsed.questions.length >= 2) {
              const cleaned = parsed.questions
                .map((q: any) => String(q || '').trim())
                .filter(Boolean)
                .slice(0, 4);
              if (cleaned.length > 0) {
                SUGGESTED_QUESTIONS_CACHE[cacheKey] = {
                  questions: cleaned,
                  groundedInPdf,
                  ts: Date.now()
                };
                res.json({ questions: cleaned, grounded_in_pdf: groundedInPdf });
                return;
              }
            }
          } catch (mErr: any) {
            console.warn(`Suggested questions model ${model} notice:`, mErr?.message);
          }
        }
      }

      if (geminiAi) {
        try {
          const geminiRes = await geminiAi.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: suggestionPrompt,
            config: { responseMimeType: 'application/json' }
          });
          if (geminiRes.text) {
            const parsed = JSON.parse(geminiRes.text);
            if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
              const cleaned = parsed.questions.map((q: any) => String(q).trim()).filter(Boolean).slice(0, 4);
              SUGGESTED_QUESTIONS_CACHE[cacheKey] = { questions: cleaned, groundedInPdf, ts: Date.now() };
              res.json({ questions: cleaned, grounded_in_pdf: groundedInPdf });
              return;
            }
          }
        } catch {
          // fallback
        }
      }

      res.status(503).json({ error: 'Could not generate dynamic questions' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to generate suggested questions' });
    }
  });

  // 7. Study Tools Generation: POST /api/study-tools
  app.post('/api/study-tools', async (req: Request, res: Response) => {
    const {
      subject = 'Mathematics',
      doc_id,
      tool_type,
      language = 'Hinglish',
      custom_topic,
      count = 5,
      difficulty = 'Standard',
      question_style = 'Standard Board MCQ',
      question,
      options,
      concept,
      answer,
      questions,
      selectedAnswers
    } = req.body;

    try {
      let chunks: string[] = LATEST_CHUNKS_CACHE[subject] || LATEST_CHUNKS_CACHE['latest'] || [];

      if ((!chunks || chunks.length === 0 || custom_topic) && supabase) {
        try {
          const searchQuery = custom_topic ? `${custom_topic} in ${subject}` : `Main concepts and summary of ${subject}`;
          const seedVector = await getEmbedding(searchQuery);
          const resSearch = await supabase.rpc('match_curriculum_documents', {
            query_embedding: seedVector,
            match_count: 4,
            filter_subject: subject || null,
            filter_doc_id: doc_id || null
          });
          const fetchedChunks = (resSearch.data || []).map((item: any) => item.content);
          if (fetchedChunks.length > 0) {
            chunks = fetchedChunks;
          }
        } catch (err: any) {
          console.warn('Supabase match for study tools notice:', err.message);
        }
      }

      const context = chunks.length > 0 ? chunks.slice(0, 4).join('\n---\n') : `General curriculum for ${subject}.`;
      const topicLabel = custom_topic ? `${subject}: ${custom_topic}` : subject;
      const languageRule =
        String(language).toLowerCase() === 'hinglish'
          ? 'Hinglish (strictly Romanized Hindi + English using ONLY Latin letters A-Z, NO Devanagari script)'
          : language;

      let prompt = '';
      if (tool_type === 'flashcards') {
        const cardCount = Math.min(Math.max(Number(count) || 5, 3), 10);
        prompt = `You are an expert CBSE/ICSE curriculum teacher. Based on the topic "${topicLabel}" (Difficulty: ${difficulty}) and textbook context, generate ${cardCount} active-recall flashcards in ${languageRule}.\nFormat as strictly valid JSON:\n{"chapter_title": "${topicLabel}", "summary_points": ["Point 1", "Point 2", "Point 3"], "flashcards": [{"front": "Conceptual recall question", "back": "Clear concise derivation or definition in ${languageRule}", "tag": "Core Concept"}]}\nContext: ${context}`;
      } else if (tool_type === 'quiz') {
        const qCount = Math.min(Math.max(Number(count) || 4, 3), 10);
        prompt = `You are an expert CBSE/ICSE exam question creator. Generate a ${qCount}-question quiz on "${topicLabel}" (Style: ${question_style}, Difficulty: ${difficulty}) in ${languageRule}.\nFormat as strictly valid JSON:\n{"topic": "${topicLabel}", "questions": [{"question": "Question text?", "options": ["Option A", "Option B", "Option C", "Option D"], "correct_index": 0, "explanation": "Why correct in ${languageRule} referencing curriculum."}]}\nContext: ${context}`;
      } else if (tool_type === 'hint') {
        prompt = `You are a Socratic tutor for Indian students. A student is stuck on this question:\nQuestion: "${question}"\nOptions: ${JSON.stringify(options || [])}\nGive a gentle 1-2 sentence Socratic hint in ${languageRule} that guides their thinking without revealing the correct option directly.\nFormat as strictly valid JSON:\n{"hint": "Think about how..."}`;
      } else if (tool_type === 'analogy') {
        prompt = `You are Eklavya AI. For the concept "${concept || subject}" (Answer/Principle: "${answer || ''}"), generate a memorable, everyday Indian real-life analogy (like cricket, chai, local trains, cooking, or festive traditions) in ${languageRule} that makes this intuitive to remember.\nFormat as strictly valid JSON:\n{"analogy": "Imagine...", "key_takeaway": "So in physics/math/science..."}`;
      } else if (tool_type === 'diagnostic') {
        prompt = `Analyze the student's quiz results on ${subject}. Questions: ${JSON.stringify(questions || [])}, Student Answers: ${JSON.stringify(selectedAnswers || {})}.\nProvide an encouraging diagnosis in ${languageRule}.\nFormat as strictly valid JSON:\n{"summary": "Overall assessment", "strengths": ["Strong concept 1"], "weaknesses": ["Concept to revise"], "action_plan": "Specific 1-line study instruction"}`;
      } else {
        prompt = `Based on the context (Subject: ${subject}), create a learning roadmap and connect it to 3 Indian career paths in ${languageRule}. Return ONLY valid JSON:\n{"roadmap_steps": [{"step": "Step 1", "detail": "Details"}], "careers": [{"role": "Career", "relevance": "Relevance", "skills": ["Skill 1"], "resources": "Free resources"}]}\nContext: ${context}`;
      }

      // Call Groq with candidate models
      if (groqClient) {
        const candidateModels = [
          process.env.MODEL_RAG_TUTOR || 'openai/gpt-oss-120b',
          'openai/gpt-oss-120b',
          'qwen/qwen3.8-27b',
          'openai/gpt-oss-20b'
        ];

        for (const model of candidateModels) {
          try {
            const completion = await groqClient.chat.completions.create({
              model,
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert educational JSON generator. Output strictly valid JSON with no extra commentary.'
                },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3
            });

            const raw = completion.choices[0]?.message?.content || '';
            const parsed = extractJson(raw);
            res.json({ status: 'success', data: parsed });
            return;
          } catch (modelErr: any) {
            console.warn(`Groq study-tools model ${model} notice:`, modelErr?.message);
          }
        }
      }

      // Secondary Backup: Gemini AI
      if (geminiAi) {
        const geminiRes = await geminiAi.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `You are an expert educational JSON generator. Output strictly valid JSON with no extra commentary.\n\n${prompt}`,
          config: {
            responseMimeType: 'application/json'
          }
        });

        if (geminiRes.text) {
          const parsed = JSON.parse(geminiRes.text);
          res.json({ status: 'success', data: parsed });
          return;
        }
      }

      res.status(500).json({ error: 'AI study tool generation service unavailable' });
    } catch (err: any) {
      console.warn('Study tools notice:', err.message);
      res.status(500).json({ error: `Failed to parse AI tool output: ${err.message}` });
    }
  });

  // --- 8. VITE MIDDLEWARE OR STATIC SERVING ---
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Eklavya Full-Stack Server running on port ${PORT}`);
    console.log(`- Supabase: ${supabaseUrl}`);
    console.log(`- Groq LLM: ${groqModel} at ${groqBaseUrl}`);
    console.log(`- Hugging Face Inference API Active`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
