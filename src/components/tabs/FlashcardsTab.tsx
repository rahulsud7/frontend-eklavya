import React, { useState, useEffect } from 'react';
import { Layers, Rotate3d, Check, Sparkles, Volume2, ArrowRight, Plus, CheckCircle2 } from 'lucide-react';
import { FlashcardItem, LanguageMode, DocumentItem } from '../../types';
import { getStudyToolsApi } from '../../services/api';

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

  // New flashcard modal
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

  const loadFlashcards = async () => {
    setIsLoading(true);
    setFlippedCards({});
    try {
      const res = await getStudyToolsApi({
        user_id: userId,
        subject: activeSubject,
        doc_id: activeDocId,
        tool_type: 'flashcards',
        language: language
      });
      if (res.data?.flashcards) {
        setFlashcards(res.data.flashcards);
      }
    } catch {
      // Fallback in API
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlashcards();
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
    onGrantXp(25);
  };

  const reviewedCount = Object.keys(reviewedCards).length;
  const progressPercent = flashcards.length > 0 ? (reviewedCount / flashcards.length) * 100 : 0;

  return (
    <div className="space-y-6 text-left">
      {/* Banner */}
      <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#8C6D23]/20 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8C6D23] mb-1">
            <Layers className="w-4 h-4 text-[#8C6D23]" />
            Spaced Repetition System (SRS)
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#284E38]">
            3D Active-Recall Flashcards
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Grounded in {activeDoc ? activeDoc.custom_name : `${activeSubject} Curriculum`}. Tap to flip in 3D.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Card</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 border border-stone-200 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#284E38]">Mastery Progress:</span>
          <span className="text-xs font-mono font-bold text-[#8C6D23]">
            {reviewedCount} of {flashcards.length} cards reviewed
          </span>
        </div>
        <div className="w-48 sm:w-64 h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
          <div
            className="h-full bg-gradient-to-r from-[#284E38] to-[#8C6D23] transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center space-y-3 bg-white/70 backdrop-blur-md rounded-3xl border border-stone-200">
          <Sparkles className="w-8 h-8 text-[#8C6D23] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#284E38]">
            Generating spaced repetition flashcards from curriculum vectors...
          </p>
        </div>
      ) : flashcards.length === 0 ? (
        <div className="py-16 text-center bg-white/70 backdrop-blur-md rounded-3xl border border-stone-200 p-8">
          <Layers className="w-10 h-10 text-stone-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-stone-700">No Flashcards Generated Yet</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Upload a chapter to the Curriculum Vault or click &ldquo;Add Custom Card&rdquo; to create your first flashcard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashcards.map(card => {
            const isFlipped = !!flippedCards[card.id];
            const rating = reviewedCards[card.id];

            return (
              <div
                key={card.id}
                onClick={() => toggleFlip(card.id)}
                className="perspective-1000 h-80 cursor-pointer group"
              >
                <div
                  className={`relative w-full h-full preserve-3d transition-transform duration-500 rounded-3xl shadow-md ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* FRONT FACE (Question) */}
                  <div className="absolute inset-0 backface-hidden bg-white/95 backdrop-blur-md rounded-3xl p-6 border-2 border-stone-200 group-hover:border-[#8C6D23]/60 group-hover:shadow-xl flex flex-col justify-between transition-all">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-bold text-[#8C6D23] uppercase tracking-wider bg-[#FCECD4] px-2.5 py-0.5 rounded-full">
                          {card.topic || card.subject}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={e => speakText(e, card.question)}
                            className="p-1 rounded-lg text-stone-400 hover:text-[#284E38] hover:bg-stone-100"
                            title="Listen"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
                            <Rotate3d className="w-3.5 h-3.5" /> 3D Flip
                          </span>
                        </div>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-[#1E2922] mt-4 leading-relaxed">
                        {card.question}
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                      <span className="text-[11px] text-stone-400">Click to reveal textbook answer</span>
                      <ArrowRight className="w-4 h-4 text-[#8C6D23] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* BACK FACE (Answer & SRS Rating) */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-[#FFF9F5] to-[#FDF4EE] rounded-3xl p-6 border-2 border-[#B85C38]/40 flex flex-col justify-between shadow-lg">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#B85C38]/20">
                        <span className="text-[11px] font-bold text-[#B85C38] uppercase tracking-wider flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Curriculum Answer
                        </span>
                        <button
                          type="button"
                          onClick={e => speakText(e, card.answer)}
                          className="p-1 rounded-lg text-stone-500 hover:text-[#284E38]"
                          title="Listen to explanation"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm text-[#284E38] font-semibold leading-relaxed mt-2 overflow-y-auto max-h-36 pr-1">
                        {card.answer}
                      </p>
                    </div>

                    {/* SRS Retention Rating Bar */}
                    <div className="pt-3 border-t border-[#B85C38]/15">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5 text-center">
                        Rate Your Retention:
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        <button
                          type="button"
                          onClick={e => handleRate(e, card.id, 'again')}
                          className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                            rating === 'again'
                              ? 'bg-red-500 text-white'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          Again
                        </button>
                        <button
                          type="button"
                          onClick={e => handleRate(e, card.id, 'hard')}
                          className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                            rating === 'hard'
                              ? 'bg-amber-500 text-white'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                        >
                          Hard
                        </button>
                        <button
                          type="button"
                          onClick={e => handleRate(e, card.id, 'good')}
                          className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                            rating === 'good'
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          }`}
                        >
                          Good
                        </button>
                        <button
                          type="button"
                          onClick={e => handleRate(e, card.id, 'easy')}
                          className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                            rating === 'easy'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          Easy
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

      {/* Add Custom Flashcard Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h4 className="text-sm font-bold text-[#284E38] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#8C6D23]" />
                Create New Flashcard
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomCard} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Chapter / Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Heights and Distances"
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#284E38]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Front Prompt (Question / Formula)</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. What is the formula for the angle of elevation?"
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#284E38]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Back Solution (Detailed Answer)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. tan(θ) = height / distance. If observer is d meters away..."
                  value={newAnswer}
                  onChange={e => setNewAnswer(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#284E38]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#284E38] text-white font-bold text-xs hover:bg-[#1E3B2A] shadow-xs"
                >
                  Save Flashcard (+25 XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
