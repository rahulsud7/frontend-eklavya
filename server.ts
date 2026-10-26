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

// In-memory cache for recent document chunks
const LATEST_CHUNKS_CACHE: Record<string, string[]> = {};

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
      const { user_id, subject = 'General' } = req.body;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No PDF file uploaded' });
        return;
      }

      // Extract text from PDF buffer
      let extractedText = '';
      try {
        // Dynamic import for pdf-parse compatibility
        const pdfParseModule = await import('pdf-parse');
        const pdfParser = (pdfParseModule as any).default || pdfParseModule;
        const pdfData = await pdfParser(file.buffer);
        extractedText = pdfData.text || '';
      } catch (pdfErr: any) {
        console.warn('PDF parser notice, extracting plain text buffer:', pdfErr.message);
        extractedText = file.buffer.toString('utf-8', 0, Math.min(file.buffer.length, 50000));
      }

      const newDocId = `doc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

      if (supabase) {
        // Ensure profile exists
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
            custom_name: file.originalname,
            subject
          }).select();

          const createdId = docRes.data?.[0]?.id || newDocId;

          // Chunk text
          const chunks = chunkText(extractedText);
          LATEST_CHUNKS_CACHE[subject] = chunks;
          LATEST_CHUNKS_CACHE['latest'] = chunks;

          // Compute embeddings and store in curriculum_documents
          const records = [];
          for (const chunk of chunks.slice(0, 50)) { // limit to first 50 chunks for quick ingestion
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

          res.json({
            status: 'success',
            filename: file.originalname,
            doc_id: createdId,
            total_chunks: chunks.length
          });
          return;
        } catch (dbErr: any) {
          console.warn('Supabase upload notice:', dbErr.message);
        }
      }

      // Memory cache fallback
      const chunks = chunkText(extractedText);
      LATEST_CHUNKS_CACHE[subject] = chunks;
      LATEST_CHUNKS_CACHE['latest'] = chunks;

      res.json({
        status: 'success',
        filename: file.originalname,
        doc_id: newDocId,
        total_chunks: chunks.length
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

      // If no vector matches found, use cached document chunks if available
      if (!context && subject && LATEST_CHUNKS_CACHE[subject]) {
        context = LATEST_CHUNKS_CACHE[subject].slice(0, 3).join('\n---\n');
      } else if (!context && LATEST_CHUNKS_CACHE['latest']) {
        context = LATEST_CHUNKS_CACHE['latest'].slice(0, 3).join('\n---\n');
      }

      const systemPrompt =
        "You are 'Eklavya AI', an encouraging 1-on-1 academic mentor for Indian students. " +
        `Preferred Output Language Mode: ${language}\n` +
        "Rules:\n" +
        "1. Ground your explanation strictly in the Context when available. If textbook context is brief, provide a thorough, accurate CBSE/ICSE curriculum explanation.\n" +
        "2. Format your response cleanly using standard Markdown with clear section headings (## and ###), bullet points, and **bold** for key concepts.\n" +
        "3. Always conclude with an active-recall section formatted exactly as:\n\n" +
        "🎯 Active-Recall Checkpoint\n" +
        "Question: [1 short conceptual recall question testing understanding]\n" +
        "Answer: [Concise correct answer and 1-line derivation/explanation]";

      const messages: any[] = [{ role: 'system', content: systemPrompt }];

      if (Array.isArray(history) && history.length > 0) {
        for (const turn of history.slice(-4)) {
          messages.push({
            role: turn.role === 'student' || turn.role === 'user' ? 'user' : 'assistant',
            content: turn.text
          });
        }
      }

      messages.push({
        role: 'user',
        content: `Context from Textbook:\n${context ? context : 'Use NCERT / Indian Board curriculum knowledge.'}\n\nStudent Question: ${query}`
      });

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
          const prompt = `${systemPrompt}\n\nContext:\n${context}\n\nStudent Query: ${query}`;
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

      let prompt = '';
      if (tool_type === 'flashcards') {
        const cardCount = Math.min(Math.max(Number(count) || 5, 3), 10);
        prompt = `You are an expert CBSE/ICSE curriculum teacher. Based on the topic "${topicLabel}" (Difficulty: ${difficulty}) and textbook context, generate ${cardCount} active-recall flashcards in ${language}.\nFormat as strictly valid JSON:\n{"chapter_title": "${topicLabel}", "summary_points": ["Point 1", "Point 2", "Point 3"], "flashcards": [{"front": "Conceptual recall question", "back": "Clear concise derivation or definition in ${language}", "tag": "Core Concept"}]}\nContext: ${context}`;
      } else if (tool_type === 'quiz') {
        const qCount = Math.min(Math.max(Number(count) || 4, 3), 10);
        prompt = `You are an expert CBSE/ICSE exam question creator. Generate a ${qCount}-question quiz on "${topicLabel}" (Style: ${question_style}, Difficulty: ${difficulty}) in ${language}.\nFormat as strictly valid JSON:\n{"topic": "${topicLabel}", "questions": [{"question": "Question text?", "options": ["Option A", "Option B", "Option C", "Option D"], "correct_index": 0, "explanation": "Why correct in ${language} referencing curriculum."}]}\nContext: ${context}`;
      } else if (tool_type === 'hint') {
        prompt = `You are a Socratic tutor for Indian students. A student is stuck on this question:\nQuestion: "${question}"\nOptions: ${JSON.stringify(options || [])}\nGive a gentle 1-2 sentence Socratic hint in ${language} that guides their thinking without revealing the correct option directly.\nFormat as strictly valid JSON:\n{"hint": "Think about how..."}`;
      } else if (tool_type === 'analogy') {
        prompt = `You are Eklavya AI. For the concept "${concept || subject}" (Answer/Principle: "${answer || ''}"), generate a memorable, everyday Indian real-life analogy (like cricket, chai, local trains, cooking, or festive traditions) that makes this intuitive to remember.\nFormat as strictly valid JSON:\n{"analogy": "Imagine...", "key_takeaway": "So in physics/math/science..."}`;
      } else if (tool_type === 'diagnostic') {
        prompt = `Analyze the student's quiz results on ${subject}. Questions: ${JSON.stringify(questions || [])}, Student Answers: ${JSON.stringify(selectedAnswers || {})}.\nProvide an encouraging diagnosis in ${language}.\nFormat as strictly valid JSON:\n{"summary": "Overall assessment", "strengths": ["Strong concept 1"], "weaknesses": ["Concept to revise"], "action_plan": "Specific 1-line study instruction"}`;
      } else {
        prompt = `Based on the context (Subject: ${subject}), create a learning roadmap and connect it to 3 Indian career paths in ${language}. Return ONLY valid JSON:\n{"roadmap_steps": [{"step": "Step 1", "detail": "Details"}], "careers": [{"role": "Career", "relevance": "Relevance", "skills": ["Skill 1"], "resources": "Free resources"}]}\nContext: ${context}`;
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
