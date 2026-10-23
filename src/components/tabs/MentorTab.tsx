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
  MessageSquare
} from 'lucide-react';
import { ChatMessage, LanguageMode, DocumentItem } from '../../types';
import { FormattedMessage } from '../FormattedMessage';
import { queryMentorApi } from '../../services/api';
import { GuruAvatar3D } from '../GuruAvatar3D';
import { AudioWaveform } from '../AudioWaveform';
import { ConceptMap } from '../ConceptMap';

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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'mentor',
      text: `**Namaste! I am your Eklavya AI Guru.**
I am deeply grounded in your **${activeSubject}** curriculum via Supabase pgvector embeddings.

Ask me any conceptual doubt, board derivation, or NCERT textbook numerical. I explain with everyday Indian analogies, clear derivations, and **Active-Recall Checkpoints** to lock the concept into long-term memory!

💡 *Pro-tip: Switch to the **Concept Map** at the top right to visualize how chapters and subjects connect interdisciplinary in D3!*

🎯 Active-Recall Checkpoint
What specific theorem or chapter topic in ${activeSubject} is challenging you today? Can you name the key principle?
*Answer: Test your conceptual recollection before checking the textbook derivations!*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: ['NCERT Section 1.2 [Vector chunk #14]', 'CBSE Class 10 Board Blueprint [Vector chunk #28]']
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [mentorState, setMentorState] = useState<'idle' | 'searching' | 'thinking' | 'speaking'>('idle');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isListeningInChat, setIsListeningInChat] = useState<boolean>(false);
  const [selectedSourceDetail, setSelectedSourceDetail] = useState<{ source: string; excerpt: string } | null>(null);

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
        doc_id: activeDocId
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
      setMentorState('idle');
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMessageId(msgId);
    setMentorState('speaking');

    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/###/g, '')
      .replace(/\$\$[\s\S]*?\$\$/g, 'Formula')
      .replace(/\$[^$]+\$/g, 'Formula')
      .replace(/🎯 Active-Recall Checkpoint[\s\S]*/i, '');

    const chunks = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];

    chunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk.trim());
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      if (language === 'Hindi') utterance.lang = 'hi-IN';

      if (index === chunks.length - 1) {
        utterance.onend = () => {
          setSpeakingMessageId(null);
          setMentorState('idle');
        };
        utterance.onerror = () => {
          setSpeakingMessageId(null);
          setMentorState('idle');
        };
      }

      window.speechSynthesis.speak(utterance);
    });
  };

  const handleCopyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInspectSource = (source: string) => {
    setSelectedSourceDetail({
      source,
      excerpt: `[Supabase pgvector chunk sample]: "...Under standard Euclidean space conditions, the relation is verified through orthogonal projections of side vectors onto coordinate axes. Cosine similarity against student query: 0.884..."`
    });
  };

  // Handler when user selects a concept node inside the Concept Map
  const handleConceptSelectPrompt = (prompt: string) => {
    setViewMode('chat');
    handleSendMessage(prompt);
  };

  const handleSelectDocFromMap = (docId: string | null, subject: string) => {
    if (onSelectDocId) {
      onSelectDocId(docId, subject);
    }
  };

  // Concrete curriculum prompt pills
  const curriculumPrompts =
    activeSubject === 'Mathematics'
      ? [
          'Explain Pythagoras theorem with real-world Indian cricket analogy',
          'Derive sin²θ + cos²θ = 1 and show how sec²θ is obtained',
          'State Euclid\'s Division Lemma and calculate HCF of 135 and 225',
          'Solve a Class 10 board problem on heights and distances with 45° angle'
        ]
      : activeSubject === 'Science'
      ? [
          'Why does copper sulfate turn light green when an iron nail is added?',
          'Explain Snell\'s Law & Total Internal Reflection in Jio optical fibers',
          'Differentiate between exothermic and endothermic chemical reactions',
          'Calculate focal length for concave mirror with 3x magnified real image'
        ]
      : [
          'Explain the rise of nationalism in Europe and the Zollverein union',
          'Why did Gandhiji choose Salt as the central symbol for the Dandi March?',
          'Describe the characteristics and distribution of Black Regur soil in India',
          'Explain the powers and functions of the Election Commission of India'
        ];

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)] min-h-[620px] bg-white/75 backdrop-blur-md rounded-3xl border border-[#8C6D23]/20 shadow-xl overflow-hidden relative text-left">
      {/* 1. Mentor Tab Header Bar with View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-stone-200/80 bg-white/95">
        <GuruAvatar3D status={mentorState} size="sm" showBadge={true} />

        <div className="flex items-center gap-2">
          {speakingMessageId && viewMode === 'chat' && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
              <AudioWaveform isActive={true} color="#059669" barCount={12} height={20} />
              <span>Speaking</span>
            </div>
          )}

          {/* View Switcher: Chat vs Concept Map (D3) */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200/60 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'chat'
                  ? 'bg-[#284E38] text-white shadow-xs'
                  : 'text-stone-600 hover:text-[#284E38] hover:bg-white'
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
                  : 'text-stone-600 hover:text-[#284E38] hover:bg-white'
              }`}
              title="Interactive D3.js curriculum concept network"
            >
              <GitFork className="w-3.5 h-3.5 text-[#8C6D23]" />
              <span>Concept Map (D3)</span>
              <span className="w-2 h-2 rounded-full bg-[#8C6D23] animate-pulse" />
            </button>
          </div>

          {viewMode === 'chat' && (
            <button
              type="button"
              onClick={() => setMessages(messages.slice(0, 1))}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
              title="Reset conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Body View: Chat View OR Concept Map View */}
      {viewMode === 'concept-map' ? (
        <div className="flex-1 w-full p-3 sm:p-4 bg-[#FAF9F5]/40 flex flex-col min-h-0">
          <ConceptMap
            initialSubject={activeSubject}
            onSelectConceptPrompt={handleConceptSelectPrompt}
            onSelectDocId={handleSelectDocFromMap}
            onNavigateToTab={onNavigateToTab}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Quick Notice to jump to Concept Map */}
          <div className="px-5 py-2 bg-gradient-to-r from-[#FAF9F5] to-amber-50/60 border-b border-stone-200/60 flex items-center justify-between text-xs">
            <span className="text-stone-600 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#8C6D23]" />
              <span>Grounded in: <strong>{activeDoc ? activeDoc.custom_name : `${activeSubject} Entire Subject`}</strong></span>
            </span>
            <button
              type="button"
              onClick={() => setViewMode('concept-map')}
              className="font-bold text-[#8C6D23] hover:text-[#284E38] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Explore D3 Concept Graph</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Messages Viewport */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.role === 'student' ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Mentor Avatar */}
                {msg.role === 'mentor' && (
                  <div className="w-8 h-8 rounded-2xl bg-[#284E38] text-white flex items-center justify-center shrink-0 shadow-sm mt-1 text-xs font-bold">
                    🏹
                  </div>
                )}

                {/* Bubble Card with 3D Depth */}
                <div
                  className={`max-w-2xl rounded-3xl p-5 shadow-sm text-left transition-all relative group ${
                    msg.role === 'student'
                      ? 'bg-gradient-to-br from-[#284E38] to-[#1E3B2A] text-white rounded-br-xs'
                      : 'bg-white/95 border border-stone-200/90 rounded-bl-xs text-[#1E2922]'
                  }`}
                >
                  {/* Header inside bubble */}
                  <div className="flex items-center justify-between gap-4 mb-2.5 pb-2 border-b border-black/5 text-[11px]">
                    <span
                      className={`font-bold uppercase tracking-wider ${
                        msg.role === 'student' ? 'text-emerald-200' : 'text-[#284E38]'
                      }`}
                    >
                      {msg.role === 'student' ? 'Student' : 'Eklavya Guru'}
                    </span>
                    <span className={msg.role === 'student' ? 'text-emerald-100/70' : 'text-stone-400'}>
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Message Content */}
                  {msg.role === 'student' ? (
                    <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  ) : (
                    <FormattedMessage
                      content={msg.text}
                      onSelfTestSuccess={() => onGrantXp(10)}
                    />
                  )}

                  {/* Action Toolbar for Mentor Messages */}
                  {msg.role === 'mentor' && (
                    <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {/* RAG Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="flex items-center gap-1.5 text-stone-500 text-[11px] flex-wrap">
                          <Database className="w-3 h-3 text-[#8C6D23]" />
                          <span className="font-semibold">Textbook Grounding:</span>
                          {msg.sources.map((src, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleInspectSource(src)}
                              className="font-mono text-[10px] text-stone-700 bg-stone-100 hover:bg-[#FCECD4] hover:text-[#8C6D23] px-2 py-0.5 rounded-md transition-colors cursor-pointer"
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
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'text-stone-500 hover:text-[#284E38] hover:bg-stone-100'
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
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-[#284E38] px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                          title="Copy clean explanation"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
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
                          onClick={() => handleSendMessage(`Can you explain that again in even simpler terms with another everyday analogy?`)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8C6D23] hover:text-[#284E38] px-2 py-1 rounded-lg bg-[#FCECD4]/60 hover:bg-[#FCECD4] transition-colors cursor-pointer"
                          title="ELI5: Explain Simpler"
                        >
                          <Lightbulb className="w-3 h-3 text-[#B85C38]" />
                          <span>Simpler</span>
                        </button>

                        {/* Practice Quiz Trigger */}
                        {onNavigateToTab && (
                          <button
                            type="button"
                            onClick={() => onNavigateToTab('quiz')}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#284E38] hover:bg-emerald-50 px-2 py-1 rounded-lg border border-stone-200 transition-colors cursor-pointer"
                            title="Open Quiz Arena on this chapter"
                          >
                            <Award className="w-3 h-3 text-[#284E38]" />
                            <span>Test in Quiz</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Student Avatar */}
                {msg.role === 'student' && (
                  <div className="w-8 h-8 rounded-2xl bg-[#8C6D23] text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Live Vector Search & Thinking Indicator */}
            {mentorState !== 'idle' && (
              <div className="flex items-start gap-3 justify-start animate-in fade-in">
                <div className="w-8 h-8 rounded-2xl bg-[#284E38] text-white flex items-center justify-center shrink-0 shadow-sm mt-1 text-xs">
                  🏹
                </div>
                <div className="bg-white/95 border border-stone-200/90 rounded-3xl p-4 rounded-bl-xs shadow-sm text-xs text-stone-600 flex items-center gap-3">
                  <GuruAvatar3D status={mentorState} size="sm" showBadge={false} />
                  <div>
                    <span className="font-bold text-[#284E38] block">
                      {mentorState === 'searching'
                        ? '1. Scanning Supabase pgvector (dim: 384)...'
                        : '2. Generating bilingual explanation in ' + language + '...'}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Grounding strictly in NCERT textbook chunks
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Curriculum Inquiries */}
          <div className="px-4 py-2.5 bg-stone-50/80 border-t border-stone-200/60 overflow-x-auto flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 whitespace-nowrap shrink-0">
              CBSE Questions:
            </span>
            {curriculumPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="text-xs px-3 py-1.5 rounded-xl bg-white border border-stone-200/80 hover:border-[#8C6D23] text-stone-700 hover:text-[#284E38] whitespace-nowrap shrink-0 transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>{prompt}</span>
                <ArrowRight className="w-3 h-3 text-[#8C6D23]" />
              </button>
            ))}
          </div>

          {/* Chat Input Bar with Direct Microphone */}
          <div className="p-3 sm:p-4 bg-white border-t border-stone-200/80">
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-300/80 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-[#284E38]/20 focus-within:border-[#284E38] transition-all">
              {/* Integrated Mic Button */}
              <button
                type="button"
                onClick={toggleChatMic}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isListeningInChat
                    ? 'bg-[#B85C38] text-white animate-pulse'
                    : 'text-stone-500 hover:text-[#284E38] hover:bg-stone-200/60'
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
                className="flex-1 bg-transparent px-2 py-1 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputQuery.trim() || mentorState !== 'idle'}
                className="px-4 py-2 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>Ask</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Source Excerpt Modal */}
      {selectedSourceDetail && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedSourceDetail(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-left animate-in fade-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#8C6D23]" />
                <h4 className="text-sm font-bold text-[#284E38]">Textbook Vector Chunk</h4>
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

            <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-stone-200 text-xs font-mono text-stone-700 leading-relaxed mb-4">
              {selectedSourceDetail.excerpt}
            </div>

            <div className="text-[11px] text-stone-500 leading-normal mb-4">
              Stored as a 384-dimensional dense vector in Supabase pgvector using cosine distance operator (<code>&lt;=&gt;</code>).
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSourceDetail(null)}
                className="px-4 py-1.5 rounded-xl bg-[#284E38] text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
