import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  BookOpen,
  ChevronRight,
  Zap,
  HelpCircle,
  Lightbulb,
  SlidersHorizontal,
  Brain,
  TrendingUp,
  Target,
  RefreshCw,
  Check,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizQuestion, LanguageMode, DocumentItem } from '../../types';
import { getStudyToolsApi, getQuestionHintApi, getQuizDiagnosticApi } from '../../services/api';

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

  // AI Quiz Customizer states
  const [showCustomizer, setShowCustomizer] = useState<boolean>(false);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [customCount, setCustomCount] = useState<number>(4);
  const [customDifficulty, setCustomDifficulty] = useState<string>('Standard');
  const [customStyle, setCustomStyle] = useState<string>('Standard Board MCQ');

  // AI Hint per question
  const [hints, setHints] = useState<Record<number, string>>({});
  const [loadingHintId, setLoadingHintId] = useState<number | null>(null);

  // AI Post-Quiz Diagnostic
  const [diagnostic, setDiagnostic] = useState<{
    summary: string;
    strengths: string[];
    weaknesses: string[];
    action_plan: string;
  } | null>(null);
  const [isLoadingDiagnostic, setIsLoadingDiagnostic] = useState<boolean>(false);

  // Filter to retry missed questions
  const [retryOnlyIncorrect, setRetryOnlyIncorrect] = useState<boolean>(false);

  const activeDoc = documents.find(d => d.id === activeDocId);

  const loadQuiz = async (topicOverride?: string) => {
    setIsLoading(true);
    setIsSubmitted(false);
    setShowIncompleteWarning(false);
    setSelectedAnswers({});
    setHints({});
    setDiagnostic(null);
    setRetryOnlyIncorrect(false);

    try {
      const res = await getStudyToolsApi({
        user_id: userId,
        subject: activeSubject,
        doc_id: activeDocId,
        tool_type: 'quiz',
        language: language,
        custom_topic: topicOverride !== undefined ? topicOverride : customTopic.trim() || undefined,
        count: customCount,
        difficulty: customDifficulty,
        question_style: customStyle
      });

      if (res.data?.questions && Array.isArray(res.data.questions)) {
        // Normalize questions with stable unique IDs
        const normalized: QuizQuestion[] = res.data.questions.map((q: any, i: number) => ({
          id: i + 1,
          topic: q.topic || customTopic.trim() || activeSubject,
          question: q.question,
          options: q.options || [],
          correctAnswerIndex: typeof q.correct_index === 'number' ? q.correct_index : (q.correctAnswerIndex ?? 0),
          explanation: q.explanation || `Core principle grounded in ${activeSubject} curriculum.`
        }));
        setQuestions(normalized);
      }
    } catch {
      // Fallback handled in API
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz('');
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

  // AI Feature 1: Socratic Hint Generator
  const handleRequestHint = async (q: QuizQuestion) => {
    if (hints[q.id]) return; // already revealed
    setLoadingHintId(q.id);

    try {
      const hintText = await getQuestionHintApi({
        question: q.question,
        options: q.options,
        subject: activeSubject,
        language
      });
      setHints(prev => ({ ...prev, [q.id]: hintText }));
    } catch {
      setHints(prev => ({
        ...prev,
        [q.id]: `Hint: Focus on the fundamental definition in ${activeSubject} and eliminate options with incorrect mathematical or chemical signs.`
      }));
    } finally {
      setLoadingHintId(null);
    }
  };

  // AI Feature 2: Post-Quiz Diagnostic
  const handleRunDiagnostic = async () => {
    setIsLoadingDiagnostic(true);
    try {
      const diag = await getQuizDiagnosticApi({
        questions,
        selectedAnswers,
        subject: activeSubject,
        language
      });
      setDiagnostic(diag);
    } catch {
      setDiagnostic({
        summary: `You scored ${calculateScore()}/${questions.length}. Solid comprehension of definitions with specific application derivations to review.`,
        strengths: ['Primary concept identification'],
        weaknesses: ['Complex step derivations'],
        action_plan: 'Review your vault textbook notes and re-attempt missed questions.'
      });
    } finally {
      setIsLoadingDiagnostic(false);
    }
  };

  // Filtered questions for active retry
  const displayedQuestions = retryOnlyIncorrect
    ? questions.filter(q => selectedAnswers[q.id] !== q.correctAnswerIndex)
    : questions;

  const score = calculateScore();

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header Banner & AI Customizer Toggle */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#8C6D23]/20 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#B85C38] mb-1">
              <Award className="w-4 h-4" />
              Adaptive Assessment Arena
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#284E38]">
              {activeSubject} Quiz &amp; Active Recall
            </h2>
            <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-[#8C6D23]" />
              Grounded in: <strong className="text-stone-700">{activeDoc ? activeDoc.custom_name : `${activeSubject} NCERT Curriculum`}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowCustomizer(!showCustomizer)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-[#8C6D23] hover:bg-amber-100 transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#B85C38]" />
              <span>{showCustomizer ? 'Close Customizer' : '✨ AI Quiz Generator'}</span>
            </button>

            <button
              type="button"
              onClick={() => loadQuiz()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#284E38] text-white text-xs font-bold hover:bg-[#1E3B2A] transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>New AI Quiz</span>
            </button>
          </div>
        </div>

        {/* AI Customizer Panel */}
        {showCustomizer && (
          <div className="mt-5 pt-5 border-t border-stone-200/80 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-[#284E38] uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#8C6D23]" />
              <span>Customize On-Demand AI Quiz</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                  Custom Topic / Sub-Chapter
                </label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                  placeholder="e.g. Quadratic Roots, Snell's Law, Dandi March..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:border-[#284E38] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                  Question Style
                </label>
                <select
                  value={customStyle}
                  onChange={e => setCustomStyle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 outline-none"
                >
                  <option value="Standard Board MCQ">Standard Board MCQ</option>
                  <option value="Assertion-Reasoning">Assertion-Reasoning (CBSE)</option>
                  <option value="Application & Numerical">Application &amp; Numerical</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                  Questions Count
                </label>
                <select
                  value={customCount}
                  onChange={e => setCustomCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 outline-none"
                >
                  <option value={4}>4 Questions (Quick Check)</option>
                  <option value={6}>6 Questions (Standard Test)</option>
                  <option value={8}>8 Questions (Deep Practice)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-stone-500 font-medium">
                Generates instant questions via Groq LPU grounded in your curriculum context.
              </span>
              <button
                type="button"
                onClick={() => { setShowCustomizer(false); loadQuiz(); }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#284E38] to-[#1E3B2A] text-white text-xs font-bold shadow-xs hover:from-[#1E3B2A] hover:to-[#14281C] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Generate Customized Quiz</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3 bg-white/70 backdrop-blur-md rounded-3xl border border-stone-200 shadow-sm">
          <Sparkles className="w-8 h-8 text-[#8C6D23] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#284E38]">
            Synthesizing board-style curriculum questions from vector chunks...
          </p>
          <p className="text-xs text-stone-500">
            Formulating distractor options and step-by-step NCERT explanations
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Retry Incorrect Banner if active */}
          {retryOnlyIncorrect && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
              <span className="font-semibold">
                🎯 Retrying {displayedQuestions.length} missed question(s). Re-test your active retrieval!
              </span>
              <button
                type="button"
                onClick={() => setRetryOnlyIncorrect(false)}
                className="font-bold underline text-amber-950 cursor-pointer"
              >
                Show All Questions
              </button>
            </div>
          )}

          {/* Question Cards */}
          {displayedQuestions.map((q, idx) => {
            const selectedOpt = selectedAnswers[q.id];
            const hasHint = Boolean(hints[q.id]);
            const isHintLoading = loadingHintId === q.id;

            return (
              <div
                key={q.id}
                className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D23] bg-[#FCECD4] px-2.5 py-0.5 rounded-full border border-[#8C6D23]/15">
                    Question {idx + 1} of {displayedQuestions.length} · {q.topic || activeSubject}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Socratic Hint Button (Before submitting) */}
                    {!isSubmitted && (
                      <button
                        type="button"
                        onClick={() => handleRequestHint(q)}
                        disabled={isHintLoading}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          hasHint
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-stone-100 text-stone-600 hover:bg-amber-50 hover:text-amber-800'
                        }`}
                        title="Get Socratic hint from Eklavya AI"
                      >
                        <Lightbulb className={`w-3 h-3 ${isHintLoading ? 'animate-bounce text-[#B85C38]' : 'text-[#8C6D23]'}`} />
                        <span>{isHintLoading ? 'Consulting Guru...' : hasHint ? 'Hint Revealed' : 'Ask Guru for Hint'}</span>
                      </button>
                    )}

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
                </div>

                {/* Socratic Hint Callout */}
                {hasHint && !isSubmitted && (
                  <div className="mb-3.5 p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-950 flex items-start gap-2 animate-in fade-in">
                    <Lightbulb className="w-4 h-4 text-[#B85C38] shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-[#8C6D23]">Guru Clue: </strong>
                      <span>{hints[q.id]}</span>
                    </div>
                  </div>
                )}

                {/* Question Title */}
                <h3 className="text-base font-bold text-[#1E2922] mb-4 leading-relaxed">
                  {q.question}
                </h3>

                {/* 4 Options */}
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
                      <div
                        key={optIdx}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${optionStyle}`}
                      >
                        <span className="w-6 h-6 rounded-lg bg-white/80 border border-stone-300/80 flex items-center justify-center text-xs font-bold shrink-0 font-mono">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="text-xs sm:text-sm font-medium leading-relaxed">
                          {opt}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Card after submission */}
                {isSubmitted && q.explanation && (
                  <div className="mt-3.5 p-4 rounded-2xl bg-[#FAF9F5] border border-[#8C6D23]/25 text-xs text-stone-800 leading-relaxed space-y-1">
                    <span className="font-bold text-[#284E38] uppercase tracking-wider block text-[11px]">
                      NCERT Verification &amp; Derivation:
                    </span>
                    <p>{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Warning for unselected options */}
          {showIncompleteWarning && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center justify-between">
              <span>You have unanswered questions. Complete all questions or click Submit again to proceed.</span>
              <button
                type="button"
                onClick={executeSubmit}
                className="px-3 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 font-bold text-amber-950 cursor-pointer ml-3 shrink-0"
              >
                Submit Anyway
              </button>
            </div>
          )}

          {/* Action Bar */}
          {!isSubmitted ? (
            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                className="px-8 py-3.5 rounded-2xl bg-[#284E38] hover:bg-[#1E3B2A] text-white font-bold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>Submit &amp; Evaluate (+XP)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Score summary banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-[#284E38] to-[#1E3B2A] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                <div>
                  <h3 className="text-lg font-bold">Assessment Complete!</h3>
                  <p className="text-xs text-emerald-200/90 mt-1">
                    Score: <strong>{score}</strong> / {questions.length} correct ({Math.round((score / questions.length) * 100)}%) · Earned <strong>+{score * 25} XP</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* AI Diagnostic Trigger */}
                  <button
                    type="button"
                    onClick={handleRunDiagnostic}
                    disabled={isLoadingDiagnostic}
                    className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Brain className={`w-4 h-4 ${isLoadingDiagnostic ? 'animate-spin' : ''}`} />
                    <span>{isLoadingDiagnostic ? 'Analyzing Mistakes...' : '✨ AI Performance Diagnostic'}</span>
                  </button>

                  {/* Retry Missed Only */}
                  {score < questions.length && (
                    <button
                      type="button"
                      onClick={() => {
                        setRetryOnlyIncorrect(true);
                        setIsSubmitted(false);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      <span>Retry Missed Only</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => loadQuiz()}
                    className="px-4 py-2.5 rounded-xl bg-white text-[#284E38] font-bold text-xs transition-all shadow-sm cursor-pointer"
                  >
                    <span>New Quiz Arena</span>
                  </button>
                </div>
              </div>

              {/* AI Diagnostic Report Card */}
              {diagnostic && (
                <div className="p-6 rounded-3xl bg-white border-2 border-[#8C6D23]/30 shadow-md space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#284E38]">
                      <Brain className="w-5 h-5 text-[#8C6D23]" />
                      <span>Eklavya AI Conceptual Diagnostic</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#8C6D23] bg-[#FCECD4] px-2.5 py-0.5 rounded-full font-bold">
                      Personalized Feedback
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                    {diagnostic.summary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                        ✅ Demonstrated Strengths
                      </span>
                      <ul className="text-xs text-emerald-950 space-y-1 list-disc list-inside">
                        {diagnostic.strengths.map((s, si) => (
                          <li key={si}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                      <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block mb-1">
                        🎯 Concepts to Revisit
                      </span>
                      <ul className="text-xs text-amber-950 space-y-1 list-disc list-inside">
                        {diagnostic.weaknesses.map((w, wi) => (
                          <li key={wi}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-2.5 text-xs text-stone-800">
                    <Target className="w-4 h-4 text-[#B85C38] shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-[#B85C38]">Prescribed Action Plan: </strong>
                      <span>{diagnostic.action_plan}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
