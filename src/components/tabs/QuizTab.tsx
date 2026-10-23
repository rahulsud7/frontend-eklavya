import React, { useState, useEffect } from 'react';
import { Award, CheckCircle, XCircle, RotateCcw, Sparkles, BookOpen, ChevronRight, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizQuestion, LanguageMode, DocumentItem } from '../../types';
import { getStudyToolsApi } from '../../services/api';

interface QuizTabProps {
  userId: string;
  activeSubject: string;
  activeDocId: string | null;
  documents: DocumentItem[];
  language: LanguageMode;
  onGrantXp: (amount: number) => void;
}

export const QuizTab: React.FC<QuizTabProps> = ({
  userId,
  activeSubject,
  activeDocId,
  documents,
  language,
  onGrantXp
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState<boolean>(false);

  const activeDoc = documents.find(d => d.id === activeDocId);

  const loadQuiz = async () => {
    setIsLoading(true);
    setIsSubmitted(false);
    setShowIncompleteWarning(false);
    setSelectedAnswers({});
    try {
      const res = await getStudyToolsApi({
        user_id: userId,
        subject: activeSubject,
        doc_id: activeDocId,
        tool_type: 'quiz',
        language: language
      });
      if (res.data?.questions) {
        setQuestions(res.data.questions);
      }
    } catch {
      // Fallback handled in API
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
  }, [activeSubject, activeDocId, language]);

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    if (isSubmitted) return;
    setShowIncompleteWarning(false);
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const executeSubmit = () => {
    setShowIncompleteWarning(false);
    setIsSubmitted(true);

    let score = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) {
        score++;
      }
    });

    const earnedXp = score * 25;
    if (earnedXp > 0) {
      onGrantXp(earnedXp);
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleSubmit = () => {
    if (Object.keys(selectedAnswers).length < questions.length && !showIncompleteWarning) {
      setShowIncompleteWarning(true);
      return;
    }
    executeSubmit();
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) {
        score++;
      }
    });
    return score;
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#8C6D23]/20 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#B85C38] mb-1">
            <Award className="w-4 h-4" />
            Adaptive Assessment Arena
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#284E38]">
            {activeSubject} Knowledge Check
          </h2>
          <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[#8C6D23]" />
            Grounded in: <strong className="text-stone-700">{activeDoc ? activeDoc.custom_name : 'Entire Subject Curriculum'}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={loadQuiz}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAF9F5] border border-[#8C6D23]/30 text-xs font-bold text-[#284E38] hover:bg-stone-100 transition-all cursor-pointer"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Generate New Quiz
        </button>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3 bg-white/70 backdrop-blur-md rounded-3xl border border-stone-200">
          <Sparkles className="w-8 h-8 text-[#8C6D23] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#284E38]">
            Synthesizing 4 board-style questions from textbook vector chunks...
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Question Cards with 3D Depth */}
          {questions.map((q, idx) => {
            const selectedOpt = selectedAnswers[q.id];

            return (
              <div
                key={q.id}
                className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-stone-200 shadow-sm hover:shadow-md transition-all text-left"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D23] bg-[#FCECD4] px-2.5 py-0.5 rounded-full border border-[#8C6D23]/15">
                    Question {idx + 1} of 4 · {q.topic || activeSubject}
                  </span>
                  {isSubmitted && (
                    <span className="text-xs font-bold">
                      {selectedOpt === q.correctAnswerIndex ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Correct (+25 XP)
                        </span>
                      ) : (
                        <span className="text-red-700 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Incorrect
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* Question Title */}
                <h3 className="text-base font-bold text-[#1E2922] mb-4 leading-relaxed">
                  {q.question}
                </h3>

                {/* 4 Options Grid with 3D Elevation */}
                <div className="space-y-2.5 mb-4">
                  {q.options.map((opt, optIdx) => {
                    const isOptionSelected = selectedOpt === optIdx;
                    const isOptionCorrect = q.correctAnswerIndex === optIdx;

                    let optionStyle =
                      'bg-stone-50 border-stone-200 text-stone-700 hover:border-[#284E38]/50 hover:bg-white hover:-translate-y-0.5 hover:shadow-xs';

                    if (isSubmitted) {
                      if (isOptionCorrect) {
                        optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/20';
                      } else if (isOptionSelected && !isOptionCorrect) {
                        optionStyle = 'bg-red-50 border-red-500 text-red-950 font-bold ring-2 ring-red-500/20';
                      } else {
                        optionStyle = 'bg-stone-50/60 border-stone-200 text-stone-400 opacity-60';
                      }
                    } else if (isOptionSelected) {
                      optionStyle = 'bg-[#FCECD4] border-[#8C6D23] text-[#284E38] font-bold shadow-xs';
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        disabled={isSubmitted}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs sm:text-sm text-left transition-all cursor-pointer ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-white/80 border border-current flex items-center justify-center text-xs font-bold shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </div>

                        {isSubmitted && isOptionCorrect && (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        {isSubmitted && isOptionSelected && !isOptionCorrect && (
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Pedagogical Explanation Reveal */}
                {isSubmitted && (
                  <div className="mt-3 p-4 rounded-2xl bg-amber-50/60 border border-[#8C6D23]/25 animate-in fade-in duration-200">
                    <span className="text-xs font-bold text-[#8C6D23] uppercase tracking-wider block mb-1">
                      Textbook Solution & Rationale:
                    </span>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Incomplete Warning Banner */}
          {showIncompleteWarning && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  You have answered {Object.keys(selectedAnswers).length} of {questions.length} questions. Submit anyway?
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={executeSubmit}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Yes, Submit
                </button>
                <button
                  type="button"
                  onClick={() => setShowIncompleteWarning(false)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 cursor-pointer"
                >
                  Keep Reviewing
                </button>
              </div>
            </div>
          )}

          {/* Submission / Score Footer */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#8C6D23]/20 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            {isSubmitted ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#284E38] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {calculateScore()}/4
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#284E38]">
                    Assessment Complete!
                  </h4>
                  <p className="text-xs text-stone-600">
                    You earned <span className="font-bold text-[#8C6D23]">+{calculateScore() * 25} XP</span> towards your streak.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-stone-600 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#8C6D23]" />
                <span>Answer all 4 questions grounded in {activeSubject} before submitting for XP evaluation.</span>
              </div>
            )}

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isSubmitted ? (
                <button
                  type="button"
                  onClick={loadQuiz}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#284E38] hover:bg-[#1E3B2A] text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Another Quiz
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#B85C38] hover:bg-[#A04E2E] text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Submit Answers</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
