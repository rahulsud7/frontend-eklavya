import React, { useState, useEffect } from 'react';
import {
  Layers,
  Rotate3d,
  Check,
  Sparkles,
  Volume2,
  ArrowRight,
  Plus,
  CheckCircle2,
  SlidersHorizontal,
  RefreshCw,
  Lightbulb,
  BookOpen,
  Filter,
  X,
  Target,
  Brain
} from 'lucide-react';
import { FlashcardItem, LanguageMode, DocumentItem } from '../../types';
import { getStudyToolsApi, getConceptAnalogyApi } from '../../services/api';

interface FlashcardsTabProps {
  userId: string;
  activeSubject: string;
  activeDocId: string | null;
  documents: DocumentItem[];
  language: LanguageMode;
  onGrantXp: (amount: number) => void;
}

export const FlashcardsTab: React.FC<FlashcardsTabProps> = ({
  userId,
  activeSubject,
  activeDocId,
  documents,
  language,
  onGrantXp
}) => {
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [reviewedCards, setReviewedCards] = useState<Record<string, 'again' | 'hard' | 'good' | 'easy'>>({});
  const [isLoading, setIsLoading] = useState(true);

  // AI Flashcard Customizer
  const [showAiCustomizer, setShowAiCustomizer] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [customCount, setCustomCount] = useState<number>(5);
  const [customDifficulty, setCustomDifficulty] = useState<string>('Standard');

  // AI Analogy per card
  const [analogies, setAnalogies] = useState<Record<string, { analogy: string; key_takeaway?: string }>>({});
  const [loadingAnalogyId, setLoadingAnalogyId] = useState<string | null>(null);

  // Card filter
  const [filterMode, setFilterMode] = useState<'all' | 'needs_review' | 'mastered'>('all');

  // New manual flashcard modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newTopic, setNewTopic] = useState('');

  const activeDoc = documents.find(d => d.id === activeDocId);

  // Subtle audio flip sound using Web Audio
  const playCardFlipSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // AudioContext policy
    }
  };

  const loadFlashcards = async (topicOverride?: string) => {
    setIsLoading(true);
    setFlippedCards({});
    setAnalogies({});

    try {
      const res = await getStudyToolsApi({
        user_id: userId,
        subject: activeSubject,
        doc_id: activeDocId,
        tool_type: 'flashcards',
        language: language,
        custom_topic: topicOverride !== undefined ? topicOverride : customTopic.trim() || undefined,
        count: customCount,
        difficulty: customDifficulty
      });

      if (res.data?.flashcards && Array.isArray(res.data.flashcards)) {
        const normalized: FlashcardItem[] = res.data.flashcards.map((f: any, i: number) => ({
          id: f.id || `fc-${Date.now()}-${i}`,
          subject: activeSubject,
          topic: f.tag || customTopic.trim() || activeSubject,
          question: f.front || f.question || 'Concept Question',
          answer: f.back || f.answer || 'Concept Answer'
        }));
        setFlashcards(normalized);
      }
    } catch {
      // Fallback in API
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlashcards('');
  }, [activeSubject, activeDocId, language]);

  const toggleFlip = (id: string) => {
    playCardFlipSound();
    setFlippedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleRate = (e: React.MouseEvent, id: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
    e.stopPropagation();
    setReviewedCards(prev => ({ ...prev, [id]: rating }));
    onGrantXp(rating === 'easy' ? 20 : rating === 'good' ? 15 : 10);
  };

  const speakText = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (language === 'Hindi') utterance.lang = 'hi-IN';
    window.speechSynthesis.speak(utterance);
  };

  // AI Feature: Real-world Indian Analogy
  const handleRequestAnalogy = async (e: React.MouseEvent, card: FlashcardItem) => {
    e.stopPropagation();
    if (analogies[card.id]) return;
    setLoadingAnalogyId(card.id);

    try {
      const analogyRes = await getConceptAnalogyApi({
        concept: card.topic || card.question,
        answer: card.answer,
        subject: activeSubject,
        language
      });
      setAnalogies(prev => ({ ...prev, [card.id]: analogyRes }));
    } catch {
      setAnalogies(prev => ({
        ...prev,
        [card.id]: {
          analogy: `Imagine this like bowling in cricket: momentum depends on both the bowler's runup speed and the ball weight!`,
          key_takeaway: 'Grounds the equation back to primary definitions.'
        }
      }));
    } finally {
      setLoadingAnalogyId(null);
    }
  };

  const handleAddCustomCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    const newCard: FlashcardItem = {
      id: `fc-custom-${Date.now()}`,
      subject: activeSubject,
      topic: newTopic.trim() || activeSubject,
      question: newQuestion.trim(),
      answer: newAnswer.trim()
    };

    setFlashcards(prev => [newCard, ...prev]);
    setShowAddModal(false);
    setNewQuestion('');
    setNewAnswer('');
    setNewTopic('');
  };

  // Filtered flashcards
  const filteredFlashcards = flashcards.filter(card => {
    const rating = reviewedCards[card.id];
    if (filterMode === 'needs_review') return rating === 'again' || rating === 'hard';
    if (filterMode === 'mastered') return rating === 'good' || rating === 'easy';
    return true;
  });

  const masteredCount = Object.values(reviewedCards).filter(r => r === 'good' || r === 'easy').length;

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header Banner & AI Customizer */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#8C6D23]/20 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8C6D23] mb-1">
              <Layers className="w-4 h-4 text-[#B85C38]" />
              3D Spaced-Repetition Deck
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#284E38]">
              {activeSubject} Active Retrieval
            </h2>
            <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-[#8C6D23]" />
              Grounding: <strong className="text-stone-700">{activeDoc ? activeDoc.custom_name : `${activeSubject} NCERT Chapters`}</strong>
              <span className="mx-1 text-stone-300">·</span>
              <span className="text-emerald-700 font-bold">{masteredCount}/{flashcards.length} Mastered</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAiCustomizer(!showAiCustomizer)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-[#8C6D23] hover:bg-amber-100 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B85C38]" />
              <span>{showAiCustomizer ? 'Close Customizer' : '✨ AI Deck Generator'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Card</span>
            </button>

            <button
              type="button"
              onClick={() => loadFlashcards()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#284E38] text-white text-xs font-bold hover:bg-[#1E3B2A] transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>New AI Cards</span>
            </button>
          </div>
        </div>

        {/* AI Customizer Panel */}
        {showAiCustomizer && (
          <div className="mt-5 pt-5 border-t border-stone-200/80 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-[#284E38] uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#8C6D23]" />
              <span>Generate AI Flashcards for Any Topic</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                  Specific Topic or Formula
                </label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                  placeholder="e.g. Lens Formula, Reactivity Series, Fundamental Rights..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:border-[#284E38] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                  Card Count
                </label>
                <select
                  value={customCount}
                  onChange={e => setCustomCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 outline-none"
                >
                  <option value={3}>3 Cards (Fast Drill)</option>
                  <option value={5}>5 Cards (Standard)</option>
                  <option value={8}>8 Cards (Deep Mastery)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-stone-500 font-medium">
                Uses Groq Llama 3 to formulate high-yield active-recall prompts grounded in NCERT.
              </span>
              <button
                type="button"
                onClick={() => { setShowAiCustomizer(false); loadFlashcards(); }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#284E38] to-[#1E3B2A] text-white text-xs font-bold shadow-xs hover:from-[#1E3B2A] hover:to-[#14281C] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Generate Flashcard Set</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-stone-100 text-xs font-medium">
          <span className="text-stone-500 font-bold uppercase tracking-wider text-[11px]">Filter:</span>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              filterMode === 'all' ? 'bg-[#284E38] text-white font-bold' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            All Cards ({flashcards.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('needs_review')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              filterMode === 'needs_review' ? 'bg-amber-600 text-white font-bold' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Needs Review ({Object.values(reviewedCards).filter(r => r === 'again' || r === 'hard').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('mastered')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              filterMode === 'mastered' ? 'bg-emerald-700 text-white font-bold' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Mastered ({masteredCount})
          </button>
        </div>
      </div>

      {/* 2. Loading state */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3 bg-white/70 backdrop-blur-md rounded-3xl border border-stone-200">
          <Sparkles className="w-8 h-8 text-[#8C6D23] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#284E38]">
            Synthesizing 3D flashcards with curriculum grounding...
          </p>
        </div>
      ) : filteredFlashcards.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white/70 backdrop-blur-md rounded-3xl border border-stone-200">
          <p className="text-sm font-bold text-stone-700">No flashcards matching the current filter.</p>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className="px-4 py-2 rounded-xl bg-[#284E38] text-white text-xs font-bold cursor-pointer"
          >
            Show All Cards
          </button>
        </div>
      ) : (
        /* 3. Grid of 3D Flip Flashcards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFlashcards.map(card => {
            const isFlipped = Boolean(flippedCards[card.id]);
            const reviewStatus = reviewedCards[card.id];
            const analogyData = analogies[card.id];
            const isAnalogyLoading = loadingAnalogyId === card.id;

            return (
              <div
                key={card.id}
                className="h-[360px] cursor-pointer group"
                style={{ perspective: '1200px' }}
                onClick={() => toggleFlip(card.id)}
              >
                <div
                  className="relative w-full h-full rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500"
                  style={{
                    transformStyle: 'preserve-3d',
                    WebkitTransformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {/* FRONT: Question Prompt */}
                  <div
                    className="absolute inset-0 bg-white/95 backdrop-blur-md border border-[#8C6D23]/25 rounded-3xl p-6 flex flex-col justify-between text-left shadow-xs"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(0deg)',
                      zIndex: isFlipped ? 1 : 10,
                      opacity: isFlipped ? 0 : 1,
                      pointerEvents: isFlipped ? 'none' : 'auto',
                      transition: 'opacity 0.2s ease, z-index 0.2s step-end'
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-[#8C6D23] bg-[#FCECD4] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {card.topic || activeSubject}
                        </span>
                        <span className="text-[11px] text-[#8C6D23] font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                          <Rotate3d className="w-3.5 h-3.5 text-[#B85C38]" />
                          <span>Click to Flip 🔄</span>
                        </span>
                      </div>

                      <div className="mt-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                          Question Prompt:
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-[#1E2922] leading-snug mt-1">
                          {card.question}
                        </h3>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-xs text-stone-500 flex items-center gap-1.5 font-medium">
                        <Brain className="w-4 h-4 text-[#8C6D23]" />
                        <span>Formulate mental derivation</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFlip(card.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#284E38] text-white text-xs font-bold hover:bg-[#1E3B2A] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <span>Reveal Answer</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* BACK: Verified Derivation + AI Analogy */}
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-[#FAF9F5] via-white to-[#FDF4EE] border-2 border-[#284E38]/40 rounded-3xl p-5 flex flex-col justify-between text-left shadow-lg overflow-y-auto"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      zIndex: isFlipped ? 10 : 1,
                      opacity: isFlipped ? 1 : 0,
                      pointerEvents: isFlipped ? 'auto' : 'none',
                      transition: 'opacity 0.2s ease, z-index 0.2s step-start'
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#284E38] flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Curriculum Answer</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={e => speakText(e, card.answer)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-[#284E38] transition-colors"
                            title="Read aloud"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFlip(card.id);
                            }}
                            className="text-[10px] font-bold text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-md transition-colors"
                          >
                            ↩ Question
                          </button>
                        </div>
                      </div>

                      {/* Verified Answer Text */}
                      <div className="bg-white/80 p-3 rounded-2xl border border-stone-200/80 shadow-2xs">
                        <p className="text-xs sm:text-sm text-[#1E2922] font-semibold leading-relaxed">
                          {card.answer}
                        </p>
                      </div>

                      {/* AI Analogy Section */}
                      {analogyData ? (
                        <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-1 animate-in fade-in">
                          <div className="flex items-center gap-1 font-bold text-[#8C6D23] text-[11px] uppercase tracking-wide">
                            <Lightbulb className="w-3.5 h-3.5 text-[#B85C38]" />
                            <span>Guru Real-World Indian Analogy</span>
                          </div>
                          <p className="leading-relaxed font-medium">{analogyData.analogy}</p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={e => handleRequestAnalogy(e, card)}
                          disabled={isAnalogyLoading}
                          className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-[#8C6D23] border border-amber-200/70 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className={`w-3.5 h-3.5 text-[#B85C38] ${isAnalogyLoading ? 'animate-spin' : ''}`} />
                          <span>{isAnalogyLoading ? 'Generating Analogy...' : '✨ Explain with Real-World Indian Analogy'}</span>
                        </button>
                      )}
                    </div>

                    {/* Spaced Repetition Rating Buttons */}
                    <div
                      className="pt-3 border-t border-stone-200"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 mb-1.5 uppercase tracking-wider">
                        <span>How well did you know this?</span>
                        {reviewStatus && (
                          <span className="text-[#284E38] font-extrabold capitalize">
                            Current: {reviewStatus}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={e => handleRate(e, card.id, 'again')}
                          className={`py-1.5 px-1 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer ${
                            reviewStatus === 'again' ? 'bg-red-600 text-white shadow-xs' : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200/50'
                          }`}
                        >
                          Again
                        </button>
                        <button
                          type="button"
                          onClick={e => handleRate(e, card.id, 'hard')}
                          className={`py-1.5 px-1 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer ${
                            reviewStatus === 'hard' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/50'
                          }`}
                        >
                          Hard
                        </button>
                        <button
                          type="button"
                          onClick={e => handleRate(e, card.id, 'good')}
                          className={`py-1.5 px-1 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer ${
                            reviewStatus === 'good' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/50'
                          }`}
                        >
                          Good
                        </button>
                        <button
                          type="button"
                          onClick={e => handleRate(e, card.id, 'easy')}
                          className={`py-1.5 px-1 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer ${
                            reviewStatus === 'easy' ? 'bg-[#284E38] text-white shadow-xs' : 'bg-emerald-100 text-[#284E38] hover:bg-emerald-200/80 border border-emerald-300/50'
                          }`}
                        >
                          Easy (+20)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Custom Flashcard Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-[#284E38] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#8C6D23]" />
                <span>Create Custom Flashcard</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomCard} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Topic / Sub-Concept
                </label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  placeholder={`e.g. ${activeSubject} Chapter 1`}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 outline-none focus:border-[#284E38]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Front: Retrieval Question *
                </label>
                <textarea
                  rows={2}
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  placeholder="e.g. What is the physical significance of the negative sign in Lenz's Law?"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 outline-none focus:border-[#284E38]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Back: Verified Solution / Derivation *
                </label>
                <textarea
                  rows={3}
                  value={newAnswer}
                  onChange={e => setNewAnswer(e.target.value)}
                  placeholder="e.g. The negative sign signifies that the induced electromotive force opposes the change in magnetic flux..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 outline-none focus:border-[#284E38]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Save Card to Set
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
