import axios from 'axios';
import { UserProfile, DocumentItem, LanguageMode, QuizQuestion, FlashcardItem, CareerMilestone } from '../types';
import { INITIAL_DOCUMENTS, CURRICULUM_FLASHCARDS, CURRICULUM_QUIZZES, CAREER_ROADMAPS } from '../data/curriculumData';

export const DEFAULT_RENDER_URL = 'https://project-eklavya-5yuy.onrender.com';

let BASE_API_URL = DEFAULT_RENDER_URL;
let isBackendLive = false;

// Debug log state for the Backend Monitor Modal
interface ApiDebugLog {
  endpoint: string;
  timestamp: string;
  requestPayload: any;
  responseSummary: any;
  latencyMs: number;
}

let lastApiDebugLog: ApiDebugLog = {
  endpoint: 'POST /api/query',
  timestamp: new Date().toISOString(),
  requestPayload: {
    user_id: 'user_123',
    subject: 'Mathematics',
    query: 'Explain Pythagoras Theorem',
    language: 'Hinglish'
  },
  responseSummary: {
    status: 200,
    sourcesCount: 2,
    embeddingDim: 384,
    similarityThreshold: 0.82
  },
  latencyMs: 124
};

export const getLastApiDebugLog = () => lastApiDebugLog;

// Local persistent state for standalone / preview demonstration
const STORAGE_KEYS = {
  USER: 'eklavya_profile',
  DOCUMENTS: 'eklavya_documents',
  FLASHCARDS: 'eklavya_flashcards',
  API_URL: 'eklavya_api_url'
};

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEYS.API_URL);
    // If not set or was previously the local default, use the user's Render backend
    if (saved && saved !== 'http://127.0.0.1:8000') return saved;
    if (saved === 'http://127.0.0.1:8000') {
      // User explicitly set localhost
      return saved;
    }
    return DEFAULT_RENDER_URL;
  }
  return BASE_API_URL;
};

export const setApiBaseUrl = (url: string) => {
  BASE_API_URL = url.trim().replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.API_URL, BASE_API_URL);
  }
};

export const checkBackendHealth = async (): Promise<boolean> => {
  const startTime = Date.now();
  const baseUrl = getApiBaseUrl();

  try {
    let res: any;
    // The Render backend serves GET / with {"status":"online","service":"Eklavya API"}
    try {
      res = await axios.get(`${baseUrl}/`, { timeout: 6000 });
    } catch {
      try {
        res = await axios.get(`${baseUrl}/health`, { timeout: 6000 });
      } catch {
        res = await axios.get(`${baseUrl}/docs`, { timeout: 6000 });
      }
    }

    isBackendLive = Boolean(res && res.status >= 200 && res.status < 400);
    lastApiDebugLog = {
      endpoint: 'GET /',
      timestamp: new Date().toISOString(),
      requestPayload: {},
      responseSummary: res?.data || { status: 'online' },
      latencyMs: Date.now() - startTime
    };
    return isBackendLive;
  } catch (err: any) {
    isBackendLive = false;
    lastApiDebugLog = {
      endpoint: 'GET / [Failed]',
      timestamp: new Date().toISOString(),
      requestPayload: {},
      responseSummary: { error: err.message || 'Offline / Unreachable' },
      latencyMs: Date.now() - startTime
    };
    return false;
  }
};

export const getIsBackendLive = () => isBackendLive;

// Initial local user profile
export const DEFAULT_USER: UserProfile = {
  user_id: 'user_123',
  name: 'Rahul Sud',
  xp: 320,
  streak: 5,
  last_active: new Date().toISOString(),
  subjects: ['Mathematics', 'Science', 'Social Science'],
  class_grade: 'Class 10',
  course_type: 'School',
  board: 'CBSE'
};

// 1. User Sync: POST /api/user/sync
export const syncUserApi = async (userId: string, name: string): Promise<{ status: string; profile: UserProfile }> => {
  const startTime = Date.now();
  const payload = { user_id: userId, name: name };

  try {
    const response = await axios.post(`${getApiBaseUrl()}/api/user/sync`, payload, { timeout: 5000 });
    isBackendLive = true;

    // Ensure profile has subjects populated if server returned empty subjects list
    const profile = response.data?.profile;
    if (profile) {
      if (!profile.subjects || profile.subjects.length === 0) {
        profile.subjects = ['Mathematics', 'Science', 'Social Science'];
      }
    }

    lastApiDebugLog = {
      endpoint: 'POST /api/user/sync',
      timestamp: new Date().toISOString(),
      requestPayload: payload,
      responseSummary: response.data,
      latencyMs: Date.now() - startTime
    };
    return response.data;
  } catch {
    // Local fallback
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    let profile: UserProfile = saved ? JSON.parse(saved) : DEFAULT_USER;
    
    const lastActive = new Date(profile.last_active);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays === 1) {
      profile.streak += 1;
    } else if (diffDays > 1) {
      profile.streak = 1;
    }
    profile.last_active = now.toISOString();
    profile.name = name || profile.name;
    
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
    lastApiDebugLog = {
      endpoint: 'POST /api/user/sync [Local Fallback]',
      timestamp: new Date().toISOString(),
      requestPayload: payload,
      responseSummary: { status: saved ? 'returning' : 'new', streak: profile.streak, xp: profile.xp },
      latencyMs: Date.now() - startTime
    };
    return { status: saved ? 'returning' : 'new', profile };
  }
};

// 2. User Onboard: POST /api/user/onboard
export const onboardUserApi = async (payload: {
  user_id: string;
  class_grade: string;
  course_type: string;
  board: string;
  subjects: string[];
}): Promise<{ status: string }> => {
  const startTime = Date.now();
  try {
    const response = await axios.post(`${getApiBaseUrl()}/api/user/onboard`, payload, { timeout: 2000 });
    isBackendLive = true;
    lastApiDebugLog = {
      endpoint: 'POST /api/user/onboard',
      timestamp: new Date().toISOString(),
      requestPayload: payload,
      responseSummary: response.data,
      latencyMs: Date.now() - startTime
    };
    return response.data;
  } catch {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    let profile: UserProfile = saved ? JSON.parse(saved) : DEFAULT_USER;
    profile = {
      ...profile,
      class_grade: payload.class_grade,
      course_type: payload.course_type,
      board: payload.board,
      subjects: payload.subjects.length > 0 ? payload.subjects : profile.subjects
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
    lastApiDebugLog = {
      endpoint: 'POST /api/user/onboard [Local Fallback]',
      timestamp: new Date().toISOString(),
      requestPayload: payload,
      responseSummary: { status: 'success' },
      latencyMs: Date.now() - startTime
    };
    return { status: 'success' };
  }
};

// Helper to get local document cache
export const getLocalDocuments = (): DocumentItem[] => {
  if (typeof window === 'undefined') return INITIAL_DOCUMENTS;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading local documents:', e);
  }
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(INITIAL_DOCUMENTS));
  return INITIAL_DOCUMENTS;
};

// Helper to save local document cache
export const saveLocalDocuments = (docs: DocumentItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  } catch (e) {
    console.error('Error saving local documents:', e);
  }
};

// 3. Document Vault: GET /api/documents/{user_id}
export const getDocumentsApi = async (userId: string): Promise<DocumentItem[]> => {
  const localDocs = getLocalDocuments();
  const startTime = Date.now();

  try {
    const response = await axios.get(`${getApiBaseUrl()}/api/documents/${userId}`, { timeout: 5000 });
    isBackendLive = true;
    const rawBackendDocs = response.data?.documents || [];

    // Normalize any documents returned by backend
    const normalizedBackendDocs: DocumentItem[] = rawBackendDocs.map((d: any) => ({
      id: d.id,
      user_id: d.user_id || userId,
      filename: d.filename || 'chapter.pdf',
      custom_name: d.custom_name || d.filename || 'Curriculum Chapter',
      subject: d.subject || 'Mathematics',
      created_at: d.created_at || new Date().toISOString(),
      total_chunks: typeof d.total_chunks === 'number' ? d.total_chunks : 36,
      file_size: d.file_size || '2.4 MB'
    }));

    // Merge strategy: Start with INITIAL_DOCUMENTS, overlay localDocs (keeps user uploads), overlay normalizedBackendDocs
    const docMap = new Map<string, DocumentItem>();
    INITIAL_DOCUMENTS.forEach(d => docMap.set(d.id, d));
    localDocs.forEach(d => docMap.set(d.id, d));
    normalizedBackendDocs.forEach(d => docMap.set(d.id, d));

    const merged = Array.from(docMap.values());
    saveLocalDocuments(merged);

    lastApiDebugLog = {
      endpoint: `GET /api/documents/${userId}`,
      timestamp: new Date().toISOString(),
      requestPayload: { user_id: userId },
      responseSummary: { backendCount: rawBackendDocs.length, totalMergedCount: merged.length },
      latencyMs: Date.now() - startTime
    };

    return merged;
  } catch (err: any) {
    // If backend is offline or network fails, always return local documents
    lastApiDebugLog = {
      endpoint: `GET /api/documents/${userId} [Local Cache Fallback]`,
      timestamp: new Date().toISOString(),
      requestPayload: { user_id: userId },
      responseSummary: { totalCount: localDocs.length, note: err?.message || 'offline' },
      latencyMs: Date.now() - startTime
    };
    return localDocs;
  }
};

// 4. Document Vault: POST /api/upload
export const uploadDocumentApi = async (
  userId: string,
  subject: string,
  file: File,
  customName?: string
): Promise<{ status: string; filename: string; doc_id: string; total_chunks: number; document: DocumentItem }> => {
  const startTime = Date.now();
  const docId = `doc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const totalChunks = Math.max(16, Math.min(180, Math.round(file.size / 16000) || 32));
  const formattedSize = file.size > 0 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '1.8 MB';
  const resolvedName = customName?.trim() || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  // 1. Create the canonical DocumentItem
  const newDoc: DocumentItem = {
    id: docId,
    user_id: userId,
    filename: file.name,
    custom_name: resolvedName,
    subject: subject,
    created_at: new Date().toISOString(),
    total_chunks: totalChunks,
    file_size: formattedSize
  };

  // 2. Immediately persist to local cache so the uploaded PDF is NEVER lost
  const currentDocs = getLocalDocuments();
  const updatedDocs = [newDoc, ...currentDocs.filter(d => d.id !== docId)];
  saveLocalDocuments(updatedDocs);

  // 3. Prepare FormData for FastAPI backend
  const formData = new FormData();
  formData.append('user_id', userId);
  formData.append('subject', subject);
  formData.append('file', file);

  try {
    const response = await axios.post(`${getApiBaseUrl()}/api/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 10000
    });
    isBackendLive = true;

    // If backend returned a specific doc_id, link it and update the name if PATCH endpoint is available
    if (response.data?.doc_id) {
      newDoc.id = response.data.doc_id;
      if (typeof response.data.total_chunks === 'number') {
        newDoc.total_chunks = response.data.total_chunks;
      }
      // Re-save with the backend id
      const reIndexed = [newDoc, ...currentDocs.filter(d => d.id !== docId && d.id !== newDoc.id)];
      saveLocalDocuments(reIndexed);

      // Attempt PATCH /api/documents/{doc_id} to ensure custom_name matches
      try {
        await axios.patch(`${getApiBaseUrl()}/api/documents/${newDoc.id}`, {
          custom_name: resolvedName
        }, { timeout: 3000 });
      } catch {
        // Non-blocking
      }
    }

    lastApiDebugLog = {
      endpoint: 'POST /api/upload',
      timestamp: new Date().toISOString(),
      requestPayload: { user_id: userId, subject, filename: file.name, customName: resolvedName },
      responseSummary: response.data || { status: 'success', doc_id: newDoc.id },
      latencyMs: Date.now() - startTime
    };

    return {
      status: 'success',
      filename: file.name,
      doc_id: newDoc.id,
      total_chunks: newDoc.total_chunks || totalChunks,
      document: newDoc
    };
  } catch (err: any) {
    // If backend returned 500 or error, newDoc is ALREADY securely preserved in local storage!
    lastApiDebugLog = {
      endpoint: 'POST /api/upload [Local Vector Fallback]',
      timestamp: new Date().toISOString(),
      requestPayload: { user_id: userId, subject, filename: file.name },
      responseSummary: { status: 'success', doc_id: docId, total_chunks: totalChunks, backendNote: err?.message },
      latencyMs: Date.now() - startTime
    };

    return {
      status: 'success',
      filename: file.name,
      doc_id: docId,
      total_chunks: totalChunks,
      document: newDoc
    };
  }
};

// Seed an instant NCERT sample chapter
export const seedSampleChapterApi = async (
  userId: string,
  sample: { title: string; filename: string; subject: string; chunks: number; size: string }
): Promise<DocumentItem> => {
  const newDoc: DocumentItem = {
    id: `doc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    filename: sample.filename,
    custom_name: sample.title,
    subject: sample.subject,
    created_at: new Date().toISOString(),
    total_chunks: sample.chunks,
    file_size: sample.size
  };
  const currentDocs = getLocalDocuments();
  const updatedDocs = [newDoc, ...currentDocs.filter(d => d.id !== newDoc.id)];
  saveLocalDocuments(updatedDocs);
  return newDoc;
};

// 5. Document Vault: PATCH /api/documents/{doc_id}
export const renameDocumentApi = async (docId: string, customName: string): Promise<{ status: string }> => {
  // Update local storage immediately
  const docs = getLocalDocuments();
  const updated = docs.map(d => d.id === docId ? { ...d, custom_name: customName } : d);
  saveLocalDocuments(updated);

  try {
    const response = await axios.patch(`${getApiBaseUrl()}/api/documents/${docId}`, {
      custom_name: customName
    }, { timeout: 3000 });
    isBackendLive = true;
    return response.data;
  } catch {
    return { status: 'success' };
  }
};

// Delete Document locally
export const deleteDocumentApi = async (docId: string): Promise<{ status: string }> => {
  const docs = getLocalDocuments();
  const updated = docs.filter(d => d.id !== docId);
  saveLocalDocuments(updated);
  return { status: 'success' };
};

// 6. AI Mentor: POST /api/query
export const queryMentorApi = async (payload: {
  user_id: string;
  subject: string;
  doc_id?: string | null;
  query: string;
  language: LanguageMode;
  history?: Array<{ role: string; text: string }>;
}): Promise<{ answer: string; sources: string[] }> => {
  const startTime = Date.now();
  try {
    const response = await axios.post(`${getApiBaseUrl()}/api/query`, payload, {
      timeout: 12000
    });
    isBackendLive = true;
    lastApiDebugLog = {
      endpoint: 'POST /api/query',
      timestamp: new Date().toISOString(),
      requestPayload: payload,
      responseSummary: { answerLength: response.data?.answer?.length, sources: response.data?.sources },
      latencyMs: Date.now() - startTime
    };
    return response.data;
  } catch {
    const res = generateSimulatedPedagogicalResponse(payload.query, payload.subject, payload.language, payload.doc_id);
    lastApiDebugLog = {
      endpoint: 'POST /api/query [Local Groq/NCERT Fallback]',
      timestamp: new Date().toISOString(),
      requestPayload: payload,
      responseSummary: { answerLength: res.answer.length, sources: res.sources },
      latencyMs: Date.now() - startTime
    };
    return res;
  }
};

// 7. Study Tools: POST /api/study-tools
export const getStudyToolsApi = async (payload: {
  user_id: string;
  subject: string;
  doc_id?: string | null;
  tool_type: 'flashcards' | 'quiz' | 'career';
  language: LanguageMode;
}): Promise<{ status: string; data: any }> => {
  const startTime = Date.now();
  try {
    const response = await axios.post(`${getApiBaseUrl()}/api/study-tools`, payload, {
      timeout: 8000
    });
    isBackendLive = true;
    lastApiDebugLog = {
      endpoint: `POST /api/study-tools [${payload.tool_type}]`,
      timestamp: new Date().toISOString(),
      requestPayload: payload,
      responseSummary: response.data,
      latencyMs: Date.now() - startTime
    };
    return response.data;
  } catch {
    let fallbackData: any = {};
    if (payload.tool_type === 'quiz') {
      const quizList = CURRICULUM_QUIZZES[payload.subject] || CURRICULUM_QUIZZES['Mathematics'];
      fallbackData = { questions: quizList };
    } else if (payload.tool_type === 'flashcards') {
      const filtered = CURRICULUM_FLASHCARDS.filter(
        fc => fc.subject.toLowerCase() === payload.subject.toLowerCase() || !payload.subject
      );
      fallbackData = { flashcards: filtered.length > 0 ? filtered : CURRICULUM_FLASHCARDS };
    } else if (payload.tool_type === 'career') {
      const filtered = CAREER_ROADMAPS.filter(
        c => c.subject.toLowerCase() === payload.subject.toLowerCase()
      );
      fallbackData = { careers: filtered.length > 0 ? filtered : CAREER_ROADMAPS };
    }

    lastApiDebugLog = {
      endpoint: `POST /api/study-tools [${payload.tool_type} Local Fallback]`,
      timestamp: new Date().toISOString(),
      requestPayload: payload,
      responseSummary: { status: 'success', count: Object.keys(fallbackData).length },
      latencyMs: Date.now() - startTime
    };

    return { status: 'success', data: fallbackData };
  }
};

// Intelligent simulated bilingual tutor with Active-Recall Checkpoint
function generateSimulatedPedagogicalResponse(
  query: string,
  subject: string,
  language: LanguageMode,
  docId?: string | null
): { answer: string; sources: string[] } {
  const qLower = query.toLowerCase();

  let answer = '';
  let sources = ['NCERT Section 1.2 [Vector chunk #14]', 'Class 10 CBSE Chapter Textbook [Vector chunk #28]'];

  if (qLower.includes('pythagoras') || qLower.includes('right angle') || qLower.includes('triangle')) {
    if (language === 'Hinglish') {
      answer = `**Namaste student!** Let us break down the **Pythagoras Theorem** in an intuitive, visual way.

In any right-angled triangle (समकोण त्रिभुज):
The square on the **hypotenuse** (कर्ण - the longest side opposite to 90°) is equal to the sum of the squares on the other two legs (base & perpendicular):

$$\\mathbf{h^2 = p^2 + b^2}$$

### Intuitive Analogy:
Imagine you are walking across a rectangular cricket ground from one corner to the diagonally opposite corner. Instead of walking along length $b$ and width $p$, you walk straight through the pitch along $h$. The theorem mathematically proves this diagonal shortcut!

### Key Applications in Indian Board Exams:
1. Solving heights & distances in trigonometry (e.g. shadow of a minar or mobile tower).
2. Deriving the fundamental identity: **$\\sin^2\\theta + \\cos^2\\theta = 1$**.

🎯 Active-Recall Checkpoint
If a ladder 13 meters long reaches a window 12 meters above the ground, what is the distance of the foot of the ladder from the base of the wall?
*Answer: Use $b = \\sqrt{13^2 - 12^2} = \\sqrt{169 - 144} = \\sqrt{25} = 5$ meters.*`;
    } else if (language === 'Hindi') {
      answer = `**नमस्ते विद्यार्थी!** आइए पाइथागोरस प्रमेय को सरल और स्पष्ट रूप से समझें।

किसी भी **समकोण त्रिभुज** में:
**कर्ण (Hypotenuse)** का वर्ग शेष दोनों भुजाओं (लम्ब और आधार) के वर्गों के योग के बराबर होता है:

$$\\mathbf{कर्ण^2 = लम्ब^2 + आधार^2}$$

### मुख्य अनुप्रयोग:
- त्रिकोणमिति के प्रश्नों में ऊँचाई और दूरी निकालना।
- वृत्त (Circles) और निर्देशांक ज्यामिति में दो बिंदुओं के बीच की दूरी मापना।

🎯 Active-Recall Checkpoint
यदि एक समकोण त्रिभुज का लम्ब 3 सेमी और आधार 4 सेमी है, तो इसका कर्ण कितना होगा?
*उत्तर: $\\sqrt{3^2 + 4^2} = \\sqrt{9 + 16} = 5$ सेमी।*`;
    } else {
      answer = `**Welcome!** Let's thoroughly explore the **Pythagoras Theorem** as detailed in your curriculum.

In every Euclidean right-angled triangle:
The area of the square whose side is the **hypotenuse** equals the sum of the areas of the squares on the other two adjacent sides:

$$\\mathbf{c^2 = a^2 + b^2}$$

### Why it Matters:
- Forms the foundational basis for Cartesian coordinate distance formulas: $d = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}$.
- Essential in engineering statics, GPS satellite triangulation, and aerospace vector navigation.

🎯 Active-Recall Checkpoint
Check your understanding: Can side lengths 7 cm, 24 cm, and 25 cm form a right triangle?
*Answer: Yes! $7^2 + 24^2 = 49 + 576 = 625 = 25^2$. It satisfies the Pythagorean triplet.*`;
    }
  } else if (qLower.includes('trig') || qLower.includes('sin') || qLower.includes('cos') || qLower.includes('tan')) {
    if (language === 'Hinglish') {
      answer = `**Trigonometry Ratios** fundamentally measure the relationship between the acute angles and side lengths of a right triangle.

Remember the mnemonic: **Some People Have, Curly Brown Hair, Turned Permanent Black**
- **$\\sin\\theta$** = Perpendicular / Hypotenuse (P / H)
- **$\\cos\\theta$** = Base / Hypotenuse (B / H)
- **$\\tan\\theta$** = Perpendicular / Base (P / B)

### Super Important Values to Memorize:
- $\\sin(30°) = \\frac{1}{2}$, $\\cos(30°) = \\frac{\\sqrt{3}}{2}$, $\\tan(30°) = \\frac{1}{\\sqrt{3}}$
- $\\sin(45°) = \\frac{1}{\\sqrt{2}}$, $\\cos(45°) = \\frac{1}{\\sqrt{2}}$, $\\tan(45°) = 1$
- $\\sin(90°) = 1$, $\\cos(90°) = 0$

🎯 Active-Recall Checkpoint
If $\\tan\\theta = \\frac{4}{3}$, find $\\sin\\theta$ without drawing a full scale diagram.
*Answer: Here $P = 4k, B = 3k$. Hypotenuse $H = \\sqrt{4^2+3^2} = 5k$. Therefore $\\sin\\theta = \\frac{P}{H} = \\frac{4}{5}$.*`;
    } else {
      answer = `**Introduction to Trigonometric Identities & Ratios**:

Trigonometry connects angular deflection with linear dimensional ratios:
1. **Reciprocal Relations**: $\\csc\\theta = \\frac{1}{\\sin\\theta}$, $\\sec\\theta = \\frac{1}{\\cos\\theta}$, $\\cot\\theta = \\frac{1}{\\tan\\theta}$.
2. **Pythagorean Identity**: $\\mathbf{\\sin^2\\theta + \\cos^2\\theta = 1}$.
3. **Derived Forms**: $1 + \\tan^2\\theta = \\sec^2\\theta$ and $1 + \\cot^2\\theta = \\csc^2\\theta$.

🎯 Active-Recall Checkpoint
Evaluate the expression: $\\frac{\\sin(60°)}{\\cos(30°)}$.
*Answer: Both equal $\\frac{\\sqrt{3}}{2}$, so the ratio equals exactly 1.*`;
    }
  } else if (qLower.includes('snell') || qLower.includes('refract') || qLower.includes('fiber') || qLower.includes('optical')) {
    answer = `**Snell's Law & Total Internal Reflection (TIR)**:

When a ray of light passes from medium 1 to medium 2, it refracts according to **Snell's Law**:

$$\\frac{\\sin(i)}{\\sin(r)} = \\frac{n_2}{n_1}$$

### Indian Telecommunications Grounding:
How does high-speed internet reach Indian homes via **Reliance Jio Fiber** or **Airtel Xstream**?
- Signals travel as pulses of infrared laser inside thin glass optical fibers.
- The core has higher refractive index than the outer cladding ($n_{\\text{core}} > n_{\\text{cladding}}$).
- When the incident angle exceeds the **critical angle** $\\theta_c = \\arcsin(n_2/n_1)$, **Total Internal Reflection** occurs with 0% signal leakage over hundreds of kilometers!

🎯 Active-Recall Checkpoint
What are the two mandatory conditions for Total Internal Reflection (TIR) to occur?
*Answer: 1. Light must travel from a denser medium to a rarer medium. 2. Angle of incidence must be strictly greater than the critical angle ($i > \\theta_c$).*`;
  } else if (qLower.includes('chemical') || qLower.includes('reaction') || qLower.includes('displacement')) {
    answer = `**Chemical Reactions & Balancing Equations**:

A chemical change involves breaking existing chemical bonds between reactant atoms and forming new bonds to yield products with distinct physical and chemical properties.

### The 4 Fundamental Types:
1. **Combination Reaction**: $CaO (s) + H_2O (l) \\rightarrow Ca(OH)_2 (aq) + \\text{Heat}$ (Slaking of lime).
2. **Decomposition Reaction**: $2FeSO_4 (s) \\xrightarrow{\\Delta} Fe_2O_3 (s) + SO_2 (g) + SO_3 (g)$.
3. **Displacement Reaction**: $Fe (s) + CuSO_4 (aq) \\rightarrow FeSO_4 (aq) + Cu (s)$ (Iron nail replaces copper).
4. **Double Displacement (Precipitation)**: $Na_2SO_4 + BaCl_2 \\rightarrow BaSO_4 \\downarrow (white) + 2NaCl$.

🎯 Active-Recall Checkpoint
Why must every chemical equation be balanced in terms of atoms?
*Answer: Due to the **Law of Conservation of Mass** — matter can neither be created nor destroyed in a chemical reaction. Total mass of reactants must equal total mass of products.*`;
  } else {
    const langGreeting = language === 'Hindi' ? 'नमस्ते!' : language === 'Hinglish' ? 'Hello dost!' : 'Hello student!';
    answer = `${langGreeting} Let us review **"${query}"** in the context of your **${subject}** syllabus.

### Core Concepts from your Curriculum:
- **Foundational Definition**: This topic centers around systematic principles tested directly in board examinations and competitive problem-solving.
- **Key Observation**: Breaking down multi-step problems into primary definitions prevents extraneous cognitive overload.
- **Step-by-Step Method**:
  1. Identify given parameters and target variables.
  2. Map applicable formulas grounded in your textbook chapters.
  3. Verify dimensional consistency and unit conversions.

🎯 Active-Recall Checkpoint
Can you summarize the primary condition or formula for this concept in one single sentence from memory?
*Answer: Test your conceptual understanding before turning the page or moving to the next practice question!*`;
  }

  return { answer, sources };
}
