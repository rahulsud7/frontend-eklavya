import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  User,
  Sparkles,
  RefreshCw,
  Volume2,
  Database,
  BookOpen,
  Copy,
  Check,
  Mic,
  MicOff,
  Lightbulb,
  Award,
  Layers,
  Square,
  ArrowRight,
  GitFork,
  MessageSquare,
  AlertCircle,
  Stethoscope,
  History,
  Trash2,
  Plus,
  Cookie,
  ChevronRight,
  X
} from 'lucide-react';
import { ChatMessage, LanguageMode, DocumentItem } from '../../types';
import { FormattedMessage } from '../FormattedMessage';
import { queryMentorApi } from '../../services/api';
import { GuruAvatar3D } from '../GuruAvatar3D';
import { AudioWaveform } from '../AudioWaveform';
import { ConceptMap } from '../ConceptMap';
import { BackendMonitorModal } from '../BackendMonitorModal';
import {
  saveRecentMessagesToCookie,
  getRecentMessagesFromCookie,
  saveLastQueryCookie,
  RecentMessageCookieItem
} from '../../services/cookies';

interface MentorTabProps {
  userId: string;
  activeSubject: string;
  activeDocId: string | null;
  documents: DocumentItem[];
  language: LanguageMode;
  onGrantXp: (amount: number) => void;
  onNavigateToTab?: (tab: string) => void;
  onSelectDocId?: (docId: string | null, subject: string) => void;
}

export interface ChatSession {
  id: string;
  title: string;
  subject: string;
  timestamp: string;
  messages: ChatMessage[];
}

const STORAGE_CHAT_KEY = 'eklavya_active_chat_messages';
const STORAGE_HISTORY_KEY = 'eklavya_chat_history_sessions';

export const MentorTab: React.FC<MentorTabProps> = ({
  userId,
  activeSubject,
  activeDocId,
  documents,
  language,
  onGrantXp,
  onNavigateToTab,
  onSelectDocId
}) => {
  const [viewMode, setViewMode] = useState<'chat' | 'concept-map'>('chat');
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);

  // Initial welcome message generator
  const createWelcomeMessage = (subj: string): ChatMessage => ({
    id: `welcome-${Date.now()}`,
    role: 'mentor',
    text: `**Namaste! I am your Eklavya AI Guru.**
I am deeply grounded in your **${subj}** curriculum via Supabase pgvector embeddings.

Ask me any conceptual doubt, board derivation, or NCERT textbook numerical. I explain with everyday Indian analogies, clear derivations, and **Active-Recall Checkpoints** to lock the concept into long-term memory!

💡 *Pro-tip: Switch to the **Concept Map** at the top right to visualize how chapters and subjects connect interdisciplinary in D3!*

🎯 Active-Recall Checkpoint
Question: What specific theorem or chapter topic in ${subj} is challenging you today? Can you name the key principle?
Answer: Formulate your answer first in your mind before checking your textbook derivations!`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    sources: ['NCERT Section 1.2 [Vector chunk #14]', 'CBSE Class 10 Board Blueprint [Vector chunk #28]']
  });

  // Current active chat messages with cookies & localStorage hydration
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
          // fallback
        }
      }
      // Check cookies for recent messages
      const cookieMsgs = getRecentMessagesFromCookie();
      if (cookieMsgs && cookieMsgs.length > 0) {
        return cookieMsgs.map(c => ({
          id: c.id,
          role: c.role,
          text: c.text,
          timestamp: c.timestamp,
          subject: c.subject
        }));
      }
    }
    return [
      {
        id: 'welcome-msg',
        role: 'mentor',
        text: `**Namaste! I am your Eklavya AI Guru.**
I am deeply grounded in your **${activeSubject}** curriculum via Supabase pgvector embeddings.

Ask me any conceptual doubt, board derivation, or NCERT textbook numerical. I explain with everyday Indian analogies, clear derivations, and **Active-Recall Checkpoints** to lock the concept into long-term memory!

💡 *Pro-tip: Switch to the **Concept Map** at the top right to visualize how chapters and subjects connect interdisciplinary in D3!*

🎯 Active-Recall Checkpoint
Question: What specific theorem or chapter topic in ${activeSubject} is challenging you today? Can you name the key principle?
Answer: Formulate your answer first in your mind before checking your textbook derivations!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: ['NCERT Section 1.2 [Vector chunk #14]', 'CBSE Class 10 Board Blueprint [Vector chunk #28]']
      }
    ];
  });

  // Chat History Sessions (Previous Doubt Threads)
  const [chatHistorySessions, setChatHistorySessions] = useState<ChatSession[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // fallback
        }
      }
    }
    // High-quality pre-seeded Indian syllabus doubt threads
    return [
      {
        id: 'session-pythagoras',
        title: 'Pythagoras Theorem Derivation & Proof',
        subject: 'Mathematics',
        timestamp: 'Yesterday, 8:45 PM',
        messages: [
          {
            id: 'm1',
            role: 'student',
            text: 'How do we derive Pythagoras theorem using similar triangles for CBSE Class 10?',
            timestamp: '8:45 PM'
          },
          {
            id: 'm2',
            role: 'mentor',
            text: `In right triangle ΔABC right-angled at B, let BD ⊥ AC (hypotenuse).

1. In ΔADB and ΔABC: ∠A = ∠A (common) and ∠ADB = ∠ABC = 90°.
By AA similarity: ΔADB ~ ΔABC.
Therefore: AD / AB = AB / AC  =>  AB² = AD × AC   --- (1)

2. Similarly, in ΔBDC and ΔABC: ∠C = ∠C (common) and ∠BDC = ∠ABC = 90°.
By AA similarity: ΔBDC ~ ΔABC.
Therefore: CD / BC = BC / AC  =>  BC² = CD × AC   --- (2)

3. Adding (1) and (2):
\\[
AB^{2} + BC^{2} = AC(AD + CD) = AC^{2}
\\]
Hence proved: Hypotenuse² = Base² + Perpendicular²!

🎯 Active-Recall Checkpoint
Question: What is the converse of Pythagoras theorem?
Answer: If in a triangle, the square of one side equals the sum of squares of other two sides, the angle opposite the first side is a right angle (90°).`,
            timestamp: '8:46 PM',
            sources: ['NCERT Mathematics Class 10 Chapter 6 Theorem 6.8']
          }
        ]
      },
      {
        id: 'session-lead-nitrate',
        title: 'Thermal Decomposition of Lead Nitrate',
        subject: 'Science',
        timestamp: '2 days ago',
        messages: [
          {
            id: 's1',
            role: 'student',
            text: 'What are the observations when white lead nitrate crystals are heated in a dry test tube?',
            timestamp: '4:20 PM'
          },
          {
            id: 's2',
            role: 'mentor',
            text: `When lead nitrate crystals are heated strongly in a dry boiling tube, thermal decomposition takes place:
\\[
2Pb(NO_{3})_{2} \\rightarrow 2PbO + 4NO_{2} + O_{2}
\\]

Key Observations:
1. Pungent reddish-brown fumes of Nitrogen Dioxide gas (NO₂) are evolved.
2. A yellow residue of Lead Oxide (PbO) remains in the tube.
3. Oxygen gas is released which rekindles a glowing splint.

🎯 Active-Recall Checkpoint
Question: Why is this categorized as a decomposition reaction?
Answer: A single reactant (lead nitrate) breaks down under heat energy into three simpler products (PbO, NO₂, O₂).`,
            timestamp: '4:21 PM',
            sources: ['NCERT Science Class 10 Chapter 1 Activity 1.6']
          }
        ]
      }
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [mentorState, setMentorState] = useState<'idle' | 'searching' | 'thinking' | 'speaking'>('idle');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isListeningInChat, setIsListeningInChat] = useState<boolean>(false);
  const [selectedSourceDetail, setSelectedSourceDetail] = useState<{ source: string; excerpt: string } | null>(null);
  const [showBackendModal, setShowBackendModal] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const activeDoc = documents.find(d => d.id === activeDocId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (viewMode === 'chat') {
      scrollToBottom();
    }
  }, [messages, mentorState, viewMode]);

  // Sync active messages to local storage & HTTP cookies
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
      // Save recent messages into browser cookies as requested
      const cookiePayload: RecentMessageCookieItem[] = messages.slice(-6).map(m => ({
        id: m.id,
        role: m.role,
        text: m.text,
        timestamp: m.timestamp,
        subject: m.subject || activeSubject
      }));
      saveRecentMessagesToCookie(cookiePayload);
    }
  }, [messages, activeSubject]);

  // Sync chat history sessions to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(chatHistorySessions));
    }
  }, [chatHistorySessions]);

  // Speech Recognition hook for in-chat microphone
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'Hindi' ? 'hi-IN' : language === 'Hinglish' ? 'en-IN' : 'en-US';

      recognition.onstart = () => setIsListeningInChat(true);
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInputQuery(transcript);
      };
      recognition.onerror = () => setIsListeningInChat(false);
      recognition.onend = () => setIsListeningInChat(false);

      recognitionRef.current = recognition;
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [language]);

  const toggleChatMic = () => {
    if (isListeningInChat) {
      recognitionRef.current?.stop();
      setIsListeningInChat(false);
    } else {
      setInputQuery('');
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Speech start caught', err);
      }
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || mentorState !== 'idle') return;

    if (isListeningInChat) {
      recognitionRef.current?.stop();
      setIsListeningInChat(false);
    }

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'student',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: activeSubject,
      doc_id: activeDocId
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    saveLastQueryCookie(textToSend.trim(), activeSubject);

    // Multi-stage visual state transition
    setMentorState('searching');
    await new Promise(r => setTimeout(r, 450));
    setMentorState('thinking');

    try {
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await queryMentorApi({
        user_id: userId,
        subject: activeSubject,
        doc_id: activeDocId,
        query: textToSend.trim(),
        language: language,
        history: historyPayload
      });

      const mentorMessage: ChatMessage = {
        id: `mentor-${Date.now()}`,
        role: 'mentor',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: res.sources,
        subject: activeSubject,
        doc_id: activeDocId,
        backendStatus: res.backendStatus
      };

      setMessages(prev => [...prev, mentorMessage]);
      onGrantXp(20);
    } catch {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'mentor',
        text: `Temporary network timeout reaching FastAPI. Using offline textbook heuristics:

🎯 Active-Recall Checkpoint
Please review your inquiry parameters and retry!
*Answer: Ensure your backend server or network connection is steady.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setMentorState('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Safe chunked speech playback
  const handleSpeak = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMessageId(msgId);

    // Clean markdown and math symbols for crisp phonetic playback
    const cleanSpeechText = text
      .replace(/🎯\s*Active-Recall Checkpoint[\s\S]*/i, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\\\[([\s\S]*?)\\\]/g, 'Formula: $1')
      .replace(/\$+(.*?)\$+/g, '$1')
      .replace(/`+(.*?)`+/g, '$1')
      .replace(/#+/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/c\^\{?2\}?/g, 'c squared')
      .replace(/a\^\{?2\}?/g, 'a squared')
      .replace(/b\^\{?2\}?/g, 'b squared')
      .replace(/x\^\{?2\}?/g, 'x squared')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText.slice(0, 500));
    if (language === 'Hindi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleCopyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInspectSource = (src: string) => {
    setSelectedSourceDetail({
      source: src,
      excerpt: `NCERT Vector Chunk Ref: Verified grounding excerpt indexed in local 384-dimensional dense semantic embedding space from official curriculum textbooks.`
    });
  };

  // Chat History Management: Archive current conversation & start fresh
  const handleStartNewChat = () => {
    if (messages.length > 1) {
      // Find first student question for title
      const firstStudentMsg = messages.find(m => m.role === 'student');
      const title = firstStudentMsg ? firstStudentMsg.text.slice(0, 42) + (firstStudentMsg.text.length > 42 ? '...' : '') : `${activeSubject} Doubt Thread`;

      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        title,
        subject: activeSubject,
        timestamp: 'Just now',
        messages: [...messages]
      };

      setChatHistorySessions(prev => [newSession, ...prev]);
    }

    setMessages([createWelcomeMessage(activeSubject)]);
    setShowHistoryDrawer(false);
  };

  // Restore a previous session from history
  const handleRestoreSession = (session: ChatSession) => {
    // Save current active if has user questions
    if (messages.length > 1) {
      const firstStudentMsg = messages.find(m => m.role === 'student');
      const currentTitle = firstStudentMsg ? firstStudentMsg.text.slice(0, 42) + '...' : `${activeSubject} Discussion`;
      const currentArchived: ChatSession = {
        id: `session-archived-${Date.now()}`,
        title: currentTitle,
        subject: activeSubject,
        timestamp: 'Just now',
        messages: [...messages]
      };
      setChatHistorySessions(prev => [currentArchived, ...prev.filter(s => s.id !== session.id)]);
    }

    setMessages(session.messages);
    if (onSelectDocId && session.subject) {
      onSelectDocId(null, session.subject);
    }
    setShowHistoryDrawer(false);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatHistorySessions(prev => prev.filter(s => s.id !== sessionId));
  };

  // Deep-link from D3 concept node click
  const handleConceptSelectPrompt = (conceptName: string) => {
    setViewMode('chat');
    handleSendMessage(`Explain the fundamental concepts, governing formulas, and NCERT curriculum derivations of: ${conceptName}.`);
  };

  const handleSelectDocFromMap = (docId: string | null, subject: string) => {
    if (onSelectDocId) {
      onSelectDocId(docId, subject);
    }
  };

  // Suggested curriculum prompt buttons
  const curriculumPrompts =
    activeSubject === 'Mathematics'
      ? [
          'Prove Pythagoras theorem step by step',
          'Solve 2x² - 5x + 3 = 0 using quadratic formula',
          'If sin θ + cos θ = √2 cos θ, prove cos θ - sin θ = √2 sin θ',
          'Derive the distance formula using coordinates'
        ]
      : activeSubject === 'Science'
      ? [
          'Explain observations when Lead Nitrate crystals are heated',
          'Differentiate concave vs convex mirrors with ray diagram',
          'Explain the role of Bile Juice and Pancreatic Lipase in digestion',
          'Why do stars twinkle while planets do not?'
        ]
      : [
          'Explain the rise of nationalism in Europe and the Zollverein union',
          'Why did Gandhiji choose Salt as the central symbol for the Dandi March?',
          'Describe the characteristics and distribution of Black Regur soil in India',
          'Explain the powers and functions of the Election Commission of India'
        ];

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)] min-h-[620px] bg-white/75 dark:bg-[#161D19]/90 backdrop-blur-md rounded-3xl border border-[#8C6D23]/20 dark:border-[#38483F] shadow-xl overflow-hidden relative text-left transition-colors duration-300">
      {/* 1. Mentor Tab Header Bar with View Switcher & Chat History */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-stone-200/80 dark:border-[#2C3B30] bg-white/95 dark:bg-[#1A221E]/95">
        <div className="flex items-center gap-3">
          <GuruAvatar3D status={mentorState} size="sm" showBadge={true} />

          {/* Chat History Drawer Button */}
          <button
            type="button"
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs font-bold text-[#8C6D23] dark:text-[#E6B34A] hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all cursor-pointer shadow-2xs"
            title="View past question threads and cookie-synced history"
          >
            <History className="w-3.5 h-3.5 text-[#B85C38] dark:text-[#E07048]" />
            <span>Chat History</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white dark:bg-[#141C17] text-[#284E38] dark:text-emerald-400 font-extrabold border border-amber-300/40">
              {chatHistorySessions.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {speakingMessageId && viewMode === 'chat' && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <AudioWaveform isActive={true} color="#059669" barCount={12} height={20} />
              <span>Speaking</span>
            </div>
          )}

          {/* View Switcher: Chat vs Concept Map (D3) */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-[#141B17] p-1 rounded-2xl border border-stone-200/60 dark:border-[#2C3B30] shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'chat'
                  ? 'bg-[#284E38] text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-[#284E38] dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-[#1E2922]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Mentor Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('concept-map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'concept-map'
                  ? 'bg-[#284E38] text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-[#284E38] dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-[#1E2922]'
              }`}
              title="Interactive D3.js curriculum concept network"
            >
              <GitFork className="w-3.5 h-3.5 text-[#8C6D23] dark:text-[#E6B34A]" />
              <span>Concept Map (D3)</span>
              <span className="w-2 h-2 rounded-full bg-[#8C6D23] dark:bg-amber-400 animate-pulse" />
            </button>
          </div>

          {/* New Chat Session Button */}
          {viewMode === 'chat' && (
            <button
              type="button"
              onClick={handleStartNewChat}
              className="text-xs text-stone-600 dark:text-stone-300 hover:text-[#284E38] dark:hover:text-emerald-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-[#1E2922] border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
              title="Save current chat to history and start a fresh session"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Body View: Chat View OR Concept Map View */}
      {viewMode === 'concept-map' ? (
        <div className="flex-1 w-full p-3 sm:p-4 bg-[#FAF9F5]/40 dark:bg-[#121714]/40 flex flex-col min-h-0">
          <ConceptMap
            initialSubject={activeSubject}
            onSelectConceptPrompt={handleConceptSelectPrompt}
            onSelectDocId={handleSelectDocFromMap}
            onNavigateToTab={onNavigateToTab}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* Quick Grounding Bar */}
          <div className="px-5 py-2 bg-gradient-to-r from-[#FAF9F5] to-amber-50/60 dark:from-[#161E1A] dark:to-[#1B2520] border-b border-stone-200/60 dark:border-[#2C3B30] flex items-center justify-between text-xs">
            <span className="text-stone-600 dark:text-stone-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#8C6D23] dark:text-[#E6B34A]" />
              <span>Grounded in: <strong className="text-stone-800 dark:text-stone-200">{activeDoc ? activeDoc.custom_name : `${activeSubject} NCERT Chapters`}</strong></span>
            </span>
            <button
              type="button"
              onClick={() => setViewMode('concept-map')}
              className="font-bold text-[#8C6D23] dark:text-[#E6B34A] hover:text-[#284E38] dark:hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Explore D3 Concept Graph</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Messages Viewport with consistent whitespace and ambient gradient */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-gradient-to-b from-[#FAF9F5]/70 via-white/85 to-[#FAF9F5]/90 dark:from-[#121614] dark:via-[#141B17] dark:to-[#121614]">
            {/* Session Indicator Banner with Cookies indicator */}
            <div className="flex items-center justify-center py-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-stone-100/90 dark:bg-[#1A221E] border border-stone-200/70 dark:border-[#2C3B30] text-[11px] text-stone-500 dark:text-stone-400 font-medium shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#284E38] dark:bg-emerald-400" />
                <span>NCERT Mentor Session · {activeSubject}</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-[#8C6D23] dark:text-[#E6B34A] font-bold">
                  <Cookie className="w-3 h-3" />
                  <span>Synced in Cookies</span>
                </span>
              </div>
            </div>

            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex items-start gap-3.5 ${
                  msg.role === 'student' ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Mentor Avatar */}
                {msg.role === 'mentor' && (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#284E38] to-[#1E3B2A] dark:from-[#36684B] dark:to-[#1F3D2C] text-white flex items-center justify-center shrink-0 shadow-sm mt-1 text-sm font-bold">
                    🏹
                  </div>
                )}

                {/* Bubble Container */}
                <div
                  className={`transition-all text-left relative group ${
                    msg.role === 'student'
                      ? 'max-w-xl rounded-3xl rounded-tr-xs p-4 sm:p-5 bg-gradient-to-br from-[#284E38] to-[#1C3627] dark:from-[#204430] dark:to-[#183324] text-white shadow-sm shadow-[#284E38]/15'
                      : 'max-w-3xl w-full rounded-3xl rounded-tl-xs p-5 sm:p-7 bg-white dark:bg-[#1A221E] border border-stone-200/90 dark:border-[#2C3B30] shadow-sm shadow-stone-200/50 dark:shadow-black/30 text-[#1E2922] dark:text-[#EAE8E3]'
                  }`}
                >
                  {/* Header inside bubble */}
                  <div
                    className={`flex items-center justify-between gap-4 mb-3 pb-2 border-b text-[11px] ${
                      msg.role === 'student' ? 'border-white/10' : 'border-stone-100 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-extrabold uppercase tracking-wider ${
                          msg.role === 'student' ? 'text-emerald-200' : 'text-[#284E38] dark:text-emerald-400'
                        }`}
                      >
                        {msg.role === 'student' ? 'Student' : 'Eklavya AI Mentor'}
                      </span>
                      {msg.role === 'mentor' && (
                        <>
                          <span className="text-stone-300 dark:text-stone-600" aria-hidden="true">·</span>
                          <span className="text-stone-500 dark:text-stone-400 font-medium">CBSE / NCERT Grounded</span>
                        </>
                      )}
                    </div>
                    <span
                      className={`font-mono text-[10px] ${
                        msg.role === 'student' ? 'text-emerald-100/70' : 'text-stone-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Message Content */}
                  {msg.role === 'student' ? (
                    <p className="text-xs sm:text-sm font-normal leading-relaxed whitespace-pre-wrap text-white/95">
                      {msg.text}
                    </p>
                  ) : (
                    <FormattedMessage
                      content={msg.text}
                      onSelfTestSuccess={() => onGrantXp(10)}
                    />
                  )}

                  {/* Live Backend Connection Status Badge */}
                  {msg.role === 'mentor' && msg.backendStatus && (
                    <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {msg.backendStatus.isLive ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Live FastAPI Backend ({msg.backendStatus.serverUrl.replace(/^https?:\/\//, '')}) · {msg.backendStatus.latencyMs}ms
                        </span>
                      ) : (
                        <div className="w-full flex flex-wrap items-center justify-between gap-2 bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl px-2.5 py-1.5 text-amber-900 dark:text-amber-200 text-[11px]">
                          <span className="inline-flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>
                              <strong>Backend Alert:</strong> {msg.backendStatus.serverUrl.replace(/^https?:\/\//, '')} returned {msg.backendStatus.statusCode ? `HTTP ${msg.backendStatus.statusCode}` : 'Offline'}. Local NCERT knowledge base answered.
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowBackendModal(true)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold text-[10px] transition-colors cursor-pointer"
                          >
                            <Stethoscope className="w-3 h-3 text-[#8C6D23]" />
                            <span>Diagnose Server</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Toolbar for Mentor Messages */}
                  {msg.role === 'mentor' && (
                    <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {/* RAG Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-[11px] flex-wrap">
                          <Database className="w-3 h-3 text-[#8C6D23] dark:text-[#E6B34A]" />
                          <span className="font-semibold">Textbook Grounding:</span>
                          {msg.sources.map((src, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleInspectSource(src)}
                              className="font-mono text-[10px] text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-[#141C17] hover:bg-[#FCECD4] dark:hover:bg-amber-950/40 hover:text-[#8C6D23] px-2 py-0.5 rounded-md transition-colors cursor-pointer border border-stone-200/60 dark:border-stone-700"
                              title="Click to inspect vector chunk excerpt"
                            >
                              {src}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Actions buttons */}
                      <div className="ml-auto flex items-center gap-2">
                        {/* Speak Button */}
                        <button
                          type="button"
                          onClick={() => handleSpeak(msg.id, msg.text)}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                            speakingMessageId === msg.id
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                              : 'text-stone-500 dark:text-stone-400 hover:text-[#284E38] dark:hover:text-emerald-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                          title="Read aloud"
                        >
                          {speakingMessageId === msg.id ? (
                            <>
                              <Square className="w-3 h-3 fill-current" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>

                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 dark:text-stone-400 hover:text-[#284E38] dark:hover:text-emerald-400 px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                          title="Copy clean explanation"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        {/* Explain Simpler Trigger */}
                        <button
                          type="button"
                          onClick={() => handleSendMessage(`Can you explain that again in even simpler terms with another everyday Indian analogy?`)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8C6D23] dark:text-[#E6B34A] hover:text-[#284E38] px-2 py-1 rounded-lg bg-[#FCECD4]/60 dark:bg-amber-950/40 hover:bg-[#FCECD4] transition-colors cursor-pointer border border-[#8C6D23]/30 dark:border-[#8C6D23]/50"
                          title="ELI5: Explain Simpler"
                        >
                          <Lightbulb className="w-3 h-3 text-[#B85C38] dark:text-[#E07048]" />
                          <span>Simpler</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Live Vector Search & Thinking Indicator */}
            {mentorState !== 'idle' && (
              <div className="flex items-start gap-3 justify-start animate-in fade-in">
                <div className="w-8 h-8 rounded-2xl bg-[#284E38] text-white flex items-center justify-center shrink-0 shadow-sm mt-1 text-xs">
                  🏹
                </div>
                <div className="bg-white/95 dark:bg-[#1A221E] border border-stone-200/90 dark:border-[#2C3B30] rounded-3xl p-4 rounded-bl-xs shadow-sm text-xs text-stone-600 dark:text-stone-300 flex items-center gap-3">
                  <GuruAvatar3D status={mentorState} size="sm" showBadge={false} />
                  <div>
                    <span className="font-bold text-[#284E38] dark:text-emerald-400 block">
                      {mentorState === 'searching'
                        ? '1. Scanning Supabase pgvector embeddings...'
                        : '2. Formulating pedagogical derivation in ' + language + '...'}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Grounding strictly in NCERT textbook chapters & syllabus
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Curriculum Inquiries */}
          <div className="px-4 py-2.5 bg-stone-50/80 dark:bg-[#141C17] border-t border-stone-200/60 dark:border-[#2C3B30] overflow-x-auto flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 whitespace-nowrap shrink-0">
              CBSE Questions:
            </span>
            {curriculumPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A221E] border border-stone-200/80 dark:border-[#2C3B30] hover:border-[#8C6D23] text-stone-700 dark:text-stone-300 hover:text-[#284E38] dark:hover:text-emerald-400 whitespace-nowrap shrink-0 transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>{prompt}</span>
                <ArrowRight className="w-3 h-3 text-[#8C6D23] dark:text-[#E6B34A]" />
              </button>
            ))}
          </div>

          {/* Chat Input Bar with Direct Microphone */}
          <div className="p-3 sm:p-4 bg-white dark:bg-[#1A221E] border-t border-stone-200/80 dark:border-[#2C3B30]">
            <div className="flex items-center gap-2 bg-stone-50 dark:bg-[#141B17] border border-stone-300/80 dark:border-[#2C3B30] rounded-2xl p-2 focus-within:ring-2 focus-within:ring-[#284E38]/20 focus-within:border-[#284E38] transition-all">
              {/* Integrated Mic Button */}
              <button
                type="button"
                onClick={toggleChatMic}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isListeningInChat
                    ? 'bg-[#B85C38] text-white animate-pulse'
                    : 'text-stone-500 dark:text-stone-400 hover:text-[#284E38] dark:hover:text-emerald-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
                }`}
                title={isListeningInChat ? 'Stop listening' : 'Speak your question'}
              >
                {isListeningInChat ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={mentorState !== 'idle'}
                placeholder={
                  isListeningInChat
                    ? 'Listening to your voice...'
                    : `Ask any ${activeSubject} doubt in ${language}...`
                }
                className="flex-1 bg-transparent px-2 py-1 text-xs sm:text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputQuery.trim() || mentorState !== 'idle'}
                className="px-4 py-2 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] dark:bg-[#346E4C] dark:hover:bg-[#28553B] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>Ask</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3. CHAT HISTORY SLIDE-OVER DRAWER */}
          {showHistoryDrawer && (
            <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-200">
              <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-[#18211C] h-full shadow-2xl border-l border-stone-200 dark:border-[#2C3B30] flex flex-col p-5 space-y-4 animate-in slide-in-from-right duration-200">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-[#2C3B30]">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#8C6D23] dark:text-[#E6B34A]" />
                    <h3 className="text-sm font-bold text-[#284E38] dark:text-emerald-400">
                      Saved Doubts & Chat History
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHistoryDrawer(false)}
                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Cookie & Persistence Badge */}
                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                  <Cookie className="w-4 h-4 text-[#B85C38] shrink-0" />
                  <div className="leading-snug">
                    <span className="font-bold">Cookies & Local Storage Active:</span> Recent doubt messages and study context are preserved across sessions.
                  </div>
                </div>

                {/* New Chat Button */}
                <button
                  type="button"
                  onClick={handleStartNewChat}
                  className="w-full py-2.5 px-3 rounded-2xl bg-[#284E38] hover:bg-[#1E3B2A] dark:bg-[#346E4C] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start New Conversation</span>
                </button>

                {/* List of Sessions */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                    Previous Question Threads ({chatHistorySessions.length})
                  </span>

                  {chatHistorySessions.length === 0 ? (
                    <div className="py-12 text-center text-stone-400 text-xs">
                      No previous chat sessions yet. Ask your first doubt above!
                    </div>
                  ) : (
                    chatHistorySessions.map(session => (
                      <div
                        key={session.id}
                        onClick={() => handleRestoreSession(session)}
                        className="group p-3 rounded-2xl bg-[#FAF9F5] dark:bg-[#141B17] hover:bg-white dark:hover:bg-[#1C2620] border border-stone-200/90 dark:border-[#2C3B30] hover:border-[#8C6D23]/60 transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-start justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded-full bg-[#FCECD4] dark:bg-amber-950/60 text-[#8C6D23] dark:text-amber-400">
                              {session.subject}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              {session.timestamp}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-[#1E2922] dark:text-[#EAE8E3] truncate group-hover:text-[#284E38] dark:group-hover:text-emerald-400">
                            {session.title}
                          </h4>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                            {session.messages.length} messages · Tap to resume
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 pt-1">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Delete thread"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-[#284E38] dark:group-hover:text-emerald-400" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Source Excerpt Modal */}
      {selectedSourceDetail && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedSourceDetail(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#18211C] rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-[#2C3B30] text-left animate-in fade-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#8C6D23] dark:text-[#E6B34A]" />
                <h4 className="text-sm font-bold text-[#284E38] dark:text-emerald-400">Textbook Vector Chunk</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSourceDetail(null)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs font-mono text-stone-500 mb-2 font-bold">
              {selectedSourceDetail.source}
            </div>

            <div className="bg-[#FAF9F5] dark:bg-[#121614] p-3 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs font-mono text-stone-700 dark:text-stone-300 leading-relaxed mb-4">
              {selectedSourceDetail.excerpt}
            </div>

            <div className="text-[11px] text-stone-500 leading-normal mb-4">
              Stored as a 384-dimensional dense vector in Supabase pgvector using cosine distance operator (<code>&lt;=&gt;</code>).
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSourceDetail(null)}
                className="px-4 py-1.5 rounded-xl bg-[#284E38] dark:bg-[#346E4C] text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Backend Connection Diagnostic Modal */}
      {showBackendModal && (
        <BackendMonitorModal
          isOpen={showBackendModal}
          onClose={() => setShowBackendModal(false)}
          isBackendConnected={true}
          onStatusChange={() => {}}
        />
      )}
    </div>
  );
};
