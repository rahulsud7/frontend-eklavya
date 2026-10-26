import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  GripVertical,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  Brain,
  Award,
  RotateCcw,
  Sun,
  Sunset,
  Moon,
  Search,
  Check,
  Zap,
  Play,
  Pause,
  Timer,
  Flame,
  Target,
  ChevronRight,
  X,
  Volume2,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DocumentItem, ScheduledSession, DayOfWeek, TimeSlot } from '../../types';
import { INITIAL_SCHEDULED_SESSIONS } from '../../data/scheduleData';

interface ScheduleTabProps {
  documents: DocumentItem[];
  onSelectDocId?: (docId: string | null, subject: string) => void;
  onNavigateToTab?: (tab: string) => void;
  onGrantXp: (amount: number) => void;
}

const STORAGE_KEY = 'eklavya_study_schedule';
const TARGET_HOURS_KEY = 'eklavya_target_hours';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

interface ExamTarget {
  name: string;
  date: string;
  badge: string;
}

const EXAM_PRESETS: ExamTarget[] = [
  { name: 'CBSE Class 10 Board Exam', date: '2027-02-15T09:00:00', badge: 'Class 10 CBSE' },
  { name: 'CBSE Class 12 Board Exam', date: '2027-02-15T09:00:00', badge: 'Class 12 Boards' },
  { name: 'JEE Main 2027 (Session 1)', date: '2027-01-24T09:00:00', badge: 'JEE Engineering' },
  { name: 'NEET-UG 2027 Medical', date: '2027-05-02T14:00:00', badge: 'NEET Medical' }
];

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  documents,
  onSelectDocId,
  onNavigateToTab,
  onGrantXp
}) => {
  const [sessions, setSessions] = useState<ScheduledSession[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_SCHEDULED_SESSIONS;
  });

  const [targetWeeklyHours, setTargetWeeklyHours] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(TARGET_HOURS_KEY);
      if (saved) return Number(saved) || 14;
    }
    return 14;
  });

  const [selectedExamIndex, setSelectedExamIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'today'>('grid');
  const [isVaultDrawerOpen, setIsVaultDrawerOpen] = useState<boolean>(true);
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('All');
  const [chapterSearch, setChapterSearch] = useState<string>('');
  const [draggedDoc, setDraggedDoc] = useState<DocumentItem | null>(null);
  const [dragOverDay, setDragOverDay] = useState<DayOfWeek | null>(null);

  // Manual Add Modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [manualDay, setManualDay] = useState<DayOfWeek>('Monday');
  const [manualDocId, setManualDocId] = useState<string>('');
  const [manualTimeSlot, setManualTimeSlot] = useState<TimeSlot>('morning');
  const [manualDuration, setManualDuration] = useState<number>(45);
  const [isConfirmingClear, setIsConfirmingClear] = useState<boolean>(false);

  // AI Revision Planner Modal state
  const [showAiPlannerModal, setShowAiPlannerModal] = useState<boolean>(false);
  const [aiPlanIntensity, setAiPlanIntensity] = useState<'balanced' | 'intensive' | 'exam_sprint'>('balanced');
  const [aiPlanFocusSubject, setAiPlanFocusSubject] = useState<string>('All');

  // Pomodoro Focus Sprint State
  const [showPomodoroModal, setShowPomodoroModal] = useState<boolean>(false);
  const [pomodoroActiveSession, setPomodoroActiveSession] = useState<ScheduledSession | null>(null);
  const [pomodoroSecondsLeft, setPomodoroSecondsLeft] = useState<number>(25 * 60);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState<boolean>(false);

  // Current day
  const todayDayName = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;
  }, []);

  // Sync to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TARGET_HOURS_KEY, targetWeeklyHours.toString());
    }
  }, [targetWeeklyHours]);

  // Exam Countdown calculation
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number; secs: number }>({
    days: 0,
    hours: 0,
    mins: 0,
    secs: 0
  });

  useEffect(() => {
    const targetDate = new Date(EXAM_PRESETS[selectedExamIndex].date).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, targetDate - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, mins, secs });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [selectedExamIndex]);

  // Pomodoro Timer Interval
  useEffect(() => {
    let interval: any = null;
    if (isPomodoroRunning && pomodoroSecondsLeft > 0) {
      interval = setInterval(() => {
        setPomodoroSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (isPomodoroRunning && pomodoroSecondsLeft === 0) {
      setIsPomodoroRunning(false);
      onGrantXp(35);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      if (pomodoroActiveSession) {
        toggleComplete(pomodoroActiveSession.id, true);
      }
    }
    return () => clearInterval(interval);
  }, [isPomodoroRunning, pomodoroSecondsLeft, pomodoroActiveSession]);

  const startPomodoro = (session?: ScheduledSession) => {
    if (session) {
      setPomodoroActiveSession(session);
    } else if (sessions.length > 0) {
      const incomplete = sessions.find(s => !s.isCompleted && s.dayOfWeek === todayDayName) || sessions[0];
      setPomodoroActiveSession(incomplete);
    }
    setPomodoroSecondsLeft(25 * 60);
    setIsPomodoroRunning(true);
    setShowPomodoroModal(true);
  };

  // Filter vault chapters for left drawer
  const filteredDocs = documents.filter(doc => {
    const matchesSubj =
      activeSubjectFilter === 'All' || doc.subject.toLowerCase() === activeSubjectFilter.toLowerCase();
    const matchesSearch =
      doc.custom_name.toLowerCase().includes(chapterSearch.toLowerCase()) ||
      doc.filename.toLowerCase().includes(chapterSearch.toLowerCase());
    return matchesSubj && matchesSearch;
  });

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, doc: DocumentItem) => {
    setDraggedDoc(doc);
    e.dataTransfer.setData('text/plain', JSON.stringify(doc));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent, day: DayOfWeek) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverDay !== day) {
      setDragOverDay(day);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDay(null);
  };

  const handleDrop = (e: React.DragEvent, day: DayOfWeek) => {
    e.preventDefault();
    setDragOverDay(null);

    let docToAdd: DocumentItem | null = draggedDoc;
    if (!docToAdd) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) docToAdd = JSON.parse(raw);
      } catch {
        // fallback
      }
    }

    if (!docToAdd) return;

    const existingForDay = sessions.filter(s => s.dayOfWeek === day);
    const slot: TimeSlot =
      existingForDay.length === 0 ? 'morning' : existingForDay.length === 1 ? 'afternoon' : 'evening';

    const newSession: ScheduledSession = {
      id: `sched-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      docId: docToAdd.id,
      chapterTitle: docToAdd.custom_name,
      subject: docToAdd.subject,
      dayOfWeek: day,
      timeSlot: slot,
      durationMinutes: 45,
      isCompleted: false,
      notes: `Dedicated focus study on ${docToAdd.custom_name}`
    };

    setSessions(prev => [...prev, newSession]);
    setDraggedDoc(null);
    onGrantXp(15);
  };

  // Toggle completion of a session
  const toggleComplete = (sessionId: string, forceComplete?: boolean) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          const nextCompleted = forceComplete !== undefined ? forceComplete : !s.isCompleted;
          if (nextCompleted && !s.isCompleted) {
            onGrantXp(35);
            confetti({
              particleCount: 70,
              spread: 60,
              origin: { y: 0.6 }
            });
          }
          return { ...s, isCompleted: nextCompleted };
        }
        return s;
      })
    );
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleStudyWithMentor = (session: ScheduledSession) => {
    if (onSelectDocId) {
      onSelectDocId(session.docId, session.subject);
    }
    if (onNavigateToTab) {
      onNavigateToTab('mentor');
    }
  };

  const handleTakeQuiz = (session: ScheduledSession) => {
    if (onSelectDocId) {
      onSelectDocId(session.docId, session.subject);
    }
    if (onNavigateToTab) {
      onNavigateToTab('quiz');
    }
  };

  // Auto-distribute syllabus evenly across the week
  const handleAutoDistribute = () => {
    if (documents.length === 0) return;

    const newDistributed: ScheduledSession[] = [];
    let docIdx = 0;

    DAYS_OF_WEEK.forEach((day, dayIndex) => {
      const slots: TimeSlot[] = ['morning', 'evening'];
      slots.forEach((slot) => {
        const doc = documents[docIdx % documents.length];
        newDistributed.push({
          id: `auto-${Date.now()}-${dayIndex}-${slot}`,
          docId: doc.id,
          chapterTitle: doc.custom_name,
          subject: doc.subject,
          dayOfWeek: day,
          timeSlot: slot,
          durationMinutes: slot === 'morning' ? 60 : 45,
          isCompleted: false,
          notes: slot === 'morning' ? 'Deep conceptual derivation & theory' : 'Active recall & practice problems'
        });
        docIdx++;
      });
    });

    setSessions(newDistributed);
    onGrantXp(40);
    confetti({ particleCount: 50, spread: 50 });
  };

  // Generate customized AI study plan based on user settings
  const handleGenerateAiPlan = () => {
    if (documents.length === 0) {
      setShowAiPlannerModal(false);
      return;
    }

    const filtered = aiPlanFocusSubject === 'All'
      ? documents
      : documents.filter(d => d.subject.toLowerCase() === aiPlanFocusSubject.toLowerCase());

    const pool = filtered.length > 0 ? filtered : documents;
    const sessionsPerDay = aiPlanIntensity === 'balanced' ? 2 : aiPlanIntensity === 'intensive' ? 3 : 4;
    const duration = aiPlanIntensity === 'balanced' ? 45 : 60;

    const generated: ScheduledSession[] = [];
    let pIdx = 0;

    DAYS_OF_WEEK.forEach((day, dayIdx) => {
      const slots: TimeSlot[] = ['morning', 'afternoon', 'evening'];
      for (let i = 0; i < Math.min(sessionsPerDay, slots.length); i++) {
        const doc = pool[pIdx % pool.length];
        const slot = slots[i];
        generated.push({
          id: `ai-plan-${Date.now()}-${dayIdx}-${i}`,
          docId: doc.id,
          chapterTitle: doc.custom_name,
          subject: doc.subject,
          dayOfWeek: day,
          timeSlot: slot,
          durationMinutes: duration,
          isCompleted: false,
          notes: i === 0 ? '🌅 High-cognitive theory block' : i === 1 ? '☀️ Numerical practice block' : '🌙 Active retrieval & test review'
        });
        pIdx++;
      }
    });

    setSessions(generated);
    setShowAiPlannerModal(false);
    onGrantXp(50);
    confetti({ particleCount: 80, spread: 60 });
  };

  const handleClearWeek = () => {
    setIsConfirmingClear(false);
    setSessions([]);
  };

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = documents.find(d => d.id === manualDocId) || documents[0];
    if (!doc) return;

    const newSession: ScheduledSession = {
      id: `manual-${Date.now()}`,
      docId: doc.id,
      chapterTitle: doc.custom_name,
      subject: doc.subject,
      dayOfWeek: manualDay,
      timeSlot: manualTimeSlot,
      durationMinutes: manualDuration,
      isCompleted: false,
      notes: `Structured focus session on ${doc.custom_name}`
    };

    setSessions(prev => [...prev, newSession]);
    setShowAddModal(false);
    onGrantXp(15);
  };

  // Calculated Progress Analytics
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.isCompleted);
  const completedCount = completedSessions.length;
  const progressPercent = totalSessions > 0 ? (completedCount / totalSessions) * 100 : 0;
  const totalWeeklyMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const completedMinutes = completedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const completedHours = (completedMinutes / 60).toFixed(1);
  const targetPercent = Math.min(100, Math.round(((completedMinutes / 60) / targetWeeklyHours) * 100));

  const getSubjectColor = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'mathematics':
        return 'border-[#284E38]/30 dark:border-emerald-700/50 bg-emerald-50/70 dark:bg-emerald-950/40 text-[#284E38] dark:text-emerald-300';
      case 'science':
        return 'border-teal-300 dark:border-teal-700/50 bg-teal-50/70 dark:bg-teal-950/40 text-teal-900 dark:text-teal-300';
      case 'social science':
        return 'border-[#B85C38]/30 dark:border-orange-700/50 bg-orange-50/70 dark:bg-orange-950/40 text-[#B85C38] dark:text-[#E07048]';
      default:
        return 'border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200';
    }
  };

  const getTimeSlotIcon = (slot: TimeSlot) => {
    switch (slot) {
      case 'morning':
        return <Sun className="w-3.5 h-3.5 text-amber-500" />;
      case 'afternoon':
        return <Sun className="w-3.5 h-3.5 text-orange-500" />;
      case 'evening':
        return <Moon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />;
    }
  };

  const todaySessions = sessions.filter(s => s.dayOfWeek === todayDayName);

  return (
    <div className="space-y-6 text-left">
      {/* 1. National Board Exam Countdown & Focus Banner (Full Dark Mode Adaptation) */}
      <div className="bg-gradient-to-br from-[#FAF9F5] via-white to-[#FDF4EE] dark:from-[#18211C] dark:via-[#1B2520] dark:to-[#18211C] rounded-3xl p-6 sm:p-7 border border-[#8C6D23]/30 dark:border-[#8C6D23]/50 shadow-md transition-colors duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#B85C38] dark:text-[#E07048] bg-[#FCECD4] dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-[#8C6D23]/20 dark:border-[#8C6D23]/40">
                <Target className="w-3.5 h-3.5" />
                <span>Target Board Examination</span>
              </span>
              <span className="text-xs font-bold text-stone-400">·</span>
              <div className="flex items-center gap-1">
                {EXAM_PRESETS.map((exam, i) => (
                  <button
                    key={exam.name}
                    type="button"
                    onClick={() => setSelectedExamIndex(i)}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      selectedExamIndex === i
                        ? 'bg-[#284E38] dark:bg-[#346E4C] text-white shadow-xs'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#151D18]'
                    }`}
                  >
                    {exam.badge}
                  </button>
                ))}
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[#284E38] dark:text-emerald-400 flex items-center gap-2">
              <span>{EXAM_PRESETS[selectedExamIndex].name}</span>
            </h2>

            <p className="text-xs text-stone-600 dark:text-stone-300 max-w-2xl leading-relaxed">
              Maintain consistent spaced repetition across NCERT chapters. Active retrieval builds long-term neural recall far superior to last-minute cramming.
            </p>
          </div>

          {/* Real-time Countdown Tiles */}
          <div className="flex items-center gap-2 sm:gap-3 bg-white/90 dark:bg-[#141C17] p-3 sm:p-4 rounded-2xl border border-[#8C6D23]/25 dark:border-[#8C6D23]/40 shadow-xs">
            <div className="text-center px-2">
              <div className="text-xl sm:text-2xl font-black text-[#284E38] dark:text-emerald-400 font-mono leading-none">
                {timeLeft.days}
              </div>
              <div className="text-[10px] font-bold text-stone-400 uppercase mt-1">Days</div>
            </div>
            <span className="text-lg font-bold text-stone-300 dark:text-stone-600">:</span>
            <div className="text-center px-2">
              <div className="text-xl sm:text-2xl font-black text-[#8C6D23] dark:text-[#E6B34A] font-mono leading-none">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-[10px] font-bold text-stone-400 uppercase mt-1">Hours</div>
            </div>
            <span className="text-lg font-bold text-stone-300 dark:text-stone-600">:</span>
            <div className="text-center px-2">
              <div className="text-xl sm:text-2xl font-black text-[#B85C38] dark:text-[#E07048] font-mono leading-none">
                {String(timeLeft.mins).padStart(2, '0')}
              </div>
              <div className="text-[10px] font-bold text-stone-400 uppercase mt-1">Mins</div>
            </div>
            <span className="text-lg font-bold text-stone-300 dark:text-stone-600">:</span>
            <div className="text-center px-2">
              <div className="text-xl sm:text-2xl font-black text-stone-600 dark:text-stone-300 font-mono leading-none">
                {String(timeLeft.secs).padStart(2, '0')}
              </div>
              <div className="text-[10px] font-bold text-stone-400 uppercase mt-1">Secs</div>
            </div>
          </div>
        </div>

        {/* Weekly Target Progress & Quick Controls Bar */}
        <div className="mt-5 pt-4 border-t border-stone-200/80 dark:border-[#2C3B30] flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Target Hours Progress */}
          <div className="flex-1 max-w-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-[#284E38] dark:text-emerald-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#B85C38] dark:text-[#E07048]" />
                <span>Weekly Study Target: <strong>{completedHours}</strong> of <strong>{targetWeeklyHours}h</strong> completed ({targetPercent}%)</span>
              </span>
              <span className="text-stone-500 dark:text-stone-400 font-bold text-[11px]">
                {completedCount}/{totalSessions} sessions
              </span>
            </div>
            <div className="w-full h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden border border-stone-200 dark:border-stone-700">
              <div
                className="h-full bg-gradient-to-r from-[#284E38] via-[#8C6D23] to-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(5, targetPercent))}%` }}
              />
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pomodoro Quick Sprint */}
            <button
              type="button"
              onClick={() => startPomodoro()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF9F5] dark:bg-[#1A221E] border border-[#8C6D23]/30 dark:border-[#8C6D23]/50 hover:border-[#8C6D23] text-xs font-bold text-[#8C6D23] dark:text-[#E6B34A] hover:bg-[#FCECD4]/60 dark:hover:bg-amber-950/40 transition-all cursor-pointer shadow-2xs"
            >
              <Timer className="w-3.5 h-3.5 text-[#B85C38] dark:text-[#E07048]" />
              <span>25m Focus Sprint</span>
            </button>

            {/* AI Revision Planner */}
            <button
              type="button"
              onClick={() => setShowAiPlannerModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100/80 dark:hover:bg-amber-900/40 text-xs font-bold text-[#8C6D23] dark:text-[#E6B34A] transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B85C38] dark:text-[#E07048]" />
              <span>✨ AI Revision Planner</span>
            </button>

            {/* Add Session */}
            <button
              type="button"
              onClick={() => {
                if (documents.length > 0) setManualDocId(documents[0].id);
                setManualDay(todayDayName);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] dark:bg-[#346E4C] dark:hover:bg-[#28553B] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Session</span>
            </button>

            {/* Clear Week */}
            {isConfirmingClear ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
                <span className="text-[11px] font-bold text-red-700 dark:text-red-300">Clear All?</span>
                <button
                  type="button"
                  onClick={handleClearWeek}
                  className="px-2 py-0.5 rounded text-[11px] font-extrabold text-white bg-red-600 hover:bg-red-700 cursor-pointer"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingClear(false)}
                  className="px-1.5 py-0.5 rounded text-[11px] font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                title="Clear weekly schedule"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* View Switcher: 7-Day Grid vs Today's Deep Work Flow + Vault Drawer Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* View Mode Pills */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-[#141B17] p-1 rounded-2xl border border-stone-200 dark:border-[#2C3B30]">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#1E2922] text-[#284E38] dark:text-emerald-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Full Week (7 Days)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'today'
                  ? 'bg-[#284E38] dark:bg-[#346E4C] text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <span>Today's Focus Flow</span>
              <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                {todaySessions.length}
              </span>
            </button>
          </div>

          {/* Toggle Vault Drawer Button (frees up 100% width for calendar) */}
          {viewMode === 'grid' && (
            <button
              type="button"
              onClick={() => setIsVaultDrawerOpen(!isVaultDrawerOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#18211C] border border-stone-200 dark:border-[#2C3B30] text-stone-700 dark:text-stone-300 hover:text-[#284E38] dark:hover:text-emerald-400 transition-all cursor-pointer shadow-2xs"
              title={isVaultDrawerOpen ? 'Collapse Vault to give Calendar full width' : 'Expand Vault Chapters'}
            >
              {isVaultDrawerOpen ? <PanelLeftClose className="w-3.5 h-3.5 text-[#8C6D23]" /> : <PanelLeftOpen className="w-3.5 h-3.5 text-[#8C6D23]" />}
              <span>{isVaultDrawerOpen ? 'Hide Vault' : 'Show Vault Chapters'}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleAutoDistribute}
          className="text-xs font-bold text-[#8C6D23] dark:text-[#E6B34A] hover:text-[#284E38] dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Auto-Distribute All Chapters</span>
        </button>
      </div>

      {/* Main Workspace Layout */}
      {viewMode === 'today' ? (
        /* TODAY'S DEEP WORK SPRINT VIEW */
        <div className="bg-white/95 dark:bg-[#18211C] backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-[#2C3B30] shadow-sm space-y-6 transition-colors duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#B85C38] dark:text-[#E07048]">
                Daily Routine · {todayDayName}
              </div>
              <h3 className="text-xl font-black text-[#284E38] dark:text-emerald-400 mt-0.5">
                Today's Curriculum Focus Sprints
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                if (documents.length > 0) setManualDocId(documents[0].id);
                setManualDay(todayDayName);
                setShowAddModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] dark:bg-[#346E4C] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule More Today</span>
            </button>
          </div>

          {todaySessions.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-[#FAF9F5] dark:bg-[#141B17] rounded-3xl border border-dashed border-stone-200 dark:border-stone-700">
              <CalendarIcon className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
              <h4 className="text-sm font-bold text-stone-700 dark:text-stone-300">No study blocks planned for today yet!</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                Add chapters from your vault or auto-distribute your syllabus to build your high-impact daily routine.
              </p>
              <button
                type="button"
                onClick={handleAutoDistribute}
                className="px-4 py-2 rounded-xl bg-[#284E38] dark:bg-[#346E4C] text-white text-xs font-bold cursor-pointer"
              >
                Auto-Schedule Today
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {todaySessions.map(session => (
                <div
                  key={session.id}
                  className={`p-5 rounded-3xl border transition-all text-left flex flex-col justify-between ${
                    session.isCompleted
                      ? 'bg-stone-50/90 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 opacity-70'
                      : 'bg-white dark:bg-[#1A221E] border-[#8C6D23]/30 dark:border-[#8C6D23]/50 shadow-md hover:shadow-lg'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#FCECD4] dark:bg-amber-950/60 text-[#8C6D23] dark:text-[#E6B34A]">
                        {session.subject}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-stone-500 dark:text-stone-400">
                        {getTimeSlotIcon(session.timeSlot)}
                        <span className="capitalize">{session.timeSlot}</span>
                        <span className="text-stone-300 dark:text-stone-600">·</span>
                        <span className="font-mono text-stone-600 dark:text-stone-300">{session.durationMinutes}m</span>
                      </div>
                    </div>

                    <h4 className={`text-base font-bold leading-snug ${session.isCompleted ? 'line-through text-stone-400 dark:text-stone-500' : 'text-[#1E2922] dark:text-[#EAE8E3]'}`}>
                      {session.chapterTitle}
                    </h4>

                    {session.notes && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed bg-[#FAF9F5] dark:bg-[#141B17] p-2.5 rounded-xl border border-stone-100 dark:border-stone-800">
                        {session.notes}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleComplete(session.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          session.isCompleted
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                            : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{session.isCompleted ? 'Completed (+35 XP)' : 'Mark as Done'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => startPomodoro(session)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-[#8C6D23] dark:text-[#E6B34A] text-xs font-bold border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 text-[#B85C38] dark:text-[#E07048]" />
                        <span>Sprint 25m</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => handleStudyWithMentor(session)}
                        className="py-1 px-2 rounded-lg bg-stone-50 dark:bg-[#141B17] hover:bg-stone-100 dark:hover:bg-stone-800 text-[#284E38] dark:text-emerald-400 font-bold border border-stone-200 dark:border-stone-700 text-center flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Brain className="w-3.5 h-3.5" />
                        <span>Ask Mentor</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTakeQuiz(session)}
                        className="py-1 px-2 rounded-lg bg-stone-50 dark:bg-[#141B17] hover:bg-stone-100 dark:hover:bg-stone-800 text-[#8C6D23] dark:text-[#E6B34A] font-bold border border-stone-200 dark:border-stone-700 text-center flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Take Quiz</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* FULL 7-DAY GRID WORKSPACE (With Dark Mode + Adequate Breathing Room) */
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Collapsible Left Column: Draggable Vault Chapters */}
          {isVaultDrawerOpen && (
            <div className="w-full lg:w-72 shrink-0 bg-white/95 dark:bg-[#18211C] backdrop-blur-md rounded-3xl p-5 border border-stone-200 dark:border-[#2C3B30] shadow-sm space-y-4 transition-colors duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                <div>
                  <h3 className="text-sm font-bold text-[#284E38] dark:text-emerald-400 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#8C6D23] dark:text-[#E6B34A]" />
                    Curriculum Vault
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Drag onto any day or tap +
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-[#FCECD4] dark:bg-amber-950/60 text-[#8C6D23] dark:text-[#E6B34A] px-2 py-0.5 rounded-full">
                  {filteredDocs.length} Chapters
                </span>
              </div>

              {/* Subject Filter Pills */}
              <div className="flex flex-wrap gap-1">
                {['All', 'Math', 'Science', 'Social'].map(subj => {
                  const fullSubj =
                    subj === 'Math'
                      ? 'Mathematics'
                      : subj === 'Science'
                      ? 'Science'
                      : subj === 'Social'
                      ? 'Social Science'
                      : 'All';

                  return (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setActiveSubjectFilter(fullSubj)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer ${
                        activeSubjectFilter === fullSubj
                          ? 'bg-[#284E38] dark:bg-[#346E4C] text-white shadow-2xs'
                          : 'bg-stone-100 dark:bg-[#141B17] text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'
                      }`}
                    >
                      {subj}
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={chapterSearch}
                  onChange={e => setChapterSearch(e.target.value)}
                  placeholder="Search chapters..."
                  className="w-full pl-8 pr-2 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#141B17] text-stone-800 dark:text-stone-200 focus:bg-white dark:focus:bg-[#1A221E] focus:outline-none focus:ring-1 focus:ring-[#284E38]"
                />
              </div>

              {/* List of Draggable Chapters */}
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {filteredDocs.length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center">No chapters found</p>
                ) : (
                  filteredDocs.map(doc => (
                    <div
                      key={doc.id}
                      draggable={true}
                      onDragStart={e => handleDragStart(e, doc)}
                      className="group relative bg-[#FAF9F5] dark:bg-[#141B17] hover:bg-white dark:hover:bg-[#1C2620] p-3 rounded-2xl border border-stone-200 dark:border-[#2C3B30] hover:border-[#8C6D23]/60 dark:hover:border-[#8C6D23] shadow-2xs hover:shadow-md cursor-grab active:cursor-grabbing transition-all select-none"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-stone-400 group-hover:text-[#8C6D23] shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                            {doc.subject}
                          </span>
                          <h4 className="text-xs font-bold text-[#1E2922] dark:text-[#EAE8E3] truncate group-hover:text-[#284E38] dark:group-hover:text-emerald-400">
                            {doc.custom_name}
                          </h4>
                          <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">
                            {doc.total_chunks || 35} vector chunks
                          </span>
                        </div>
                      </div>

                      {/* Quick Add Button */}
                      <div className="mt-2 pt-2 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between text-[10px]">
                        <span className="text-stone-400">Drag to calendar</span>
                        <button
                          type="button"
                          onClick={() => {
                            setManualDocId(doc.id);
                            setManualDay(todayDayName);
                            setShowAddModal(true);
                          }}
                          className="font-bold text-[#8C6D23] dark:text-[#E6B34A] hover:text-[#284E38] flex items-center gap-0.5"
                        >
                          <span>+ Add</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Right Main 7-Day Weekly Calendar Grid (Horizontal scrollable with generous min-width) */}
          <div className="flex-1 min-w-0 w-full overflow-x-auto pb-4">
            <div className="grid grid-flow-col auto-cols-[minmax(180px,1fr)] sm:auto-cols-[minmax(200px,1fr)] gap-3.5 min-w-[700px]">
              {DAYS_OF_WEEK.map(day => {
                const daySessions = sessions.filter(s => s.dayOfWeek === day);
                const isToday = day === todayDayName;
                const isOver = dragOverDay === day;
                const dayTotalMinutes = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

                return (
                  <div
                    key={day}
                    onDragOver={e => handleDragOver(e, day)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, day)}
                    className={`rounded-3xl p-3.5 flex flex-col justify-between transition-all min-h-[460px] ${
                      isOver
                        ? 'bg-amber-50/90 dark:bg-amber-950/60 border-2 border-dashed border-[#8C6D23] scale-[1.02] shadow-lg'
                        : isToday
                        ? 'bg-white dark:bg-[#1B2720] border-2 border-[#284E38] dark:border-emerald-500 shadow-md ring-2 ring-[#284E38]/20 dark:ring-emerald-500/20'
                        : 'bg-white/90 dark:bg-[#18211C] border border-stone-200/90 dark:border-[#2C3B30] hover:border-stone-300 dark:hover:border-stone-600 shadow-2xs'
                    }`}
                  >
                    {/* Day Header */}
                    <div className="pb-2.5 mb-2.5 border-b border-stone-100 dark:border-stone-800">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-black uppercase tracking-tight ${
                            isToday ? 'text-[#284E38] dark:text-emerald-400' : 'text-stone-700 dark:text-stone-200'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </span>
                        {isToday && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 bg-[#284E38] dark:bg-emerald-600 text-white rounded-full">
                            TODAY
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-400 font-semibold mt-0.5">
                        {daySessions.length} blocks · {dayTotalMinutes}m
                      </div>
                    </div>

                    {/* Scheduled Session Cards (No ugly text truncation) */}
                    <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[500px] pr-0.5">
                      {daySessions.length === 0 ? (
                        <div className="h-44 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl flex flex-col items-center justify-center text-center p-3 text-stone-400 text-[11px]">
                          <CalendarIcon className="w-5 h-5 mb-1.5 opacity-40" />
                          <span>Drop chapters here</span>
                        </div>
                      ) : (
                        daySessions.map(session => (
                          <div
                            key={session.id}
                            className={`group relative p-3 rounded-2xl border text-left transition-all ${
                              session.isCompleted
                                ? 'bg-stone-50/90 dark:bg-stone-900/50 border-stone-200 dark:border-stone-800 opacity-65'
                                : `${getSubjectColor(session.subject)} shadow-2xs hover:shadow-xs`
                            }`}
                          >
                            {/* Session Top Bar: Complete Checkbox + Time Slot */}
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <button
                                type="button"
                                onClick={() => toggleComplete(session.id)}
                                className="flex items-center gap-1.5 text-[10px] font-bold cursor-pointer"
                                title={session.isCompleted ? 'Mark incomplete' : 'Mark completed (+35 XP)'}
                              >
                                <span
                                  className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border transition-all ${
                                    session.isCompleted
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-stone-400 bg-white dark:bg-[#141B17] hover:border-[#284E38]'
                                  }`}
                                >
                                  {session.isCompleted && <Check className="w-2.5 h-2.5" />}
                                </span>
                                <span className={session.isCompleted ? 'line-through text-stone-400 dark:text-stone-500' : ''}>
                                  {session.isCompleted ? 'Done' : 'Mark Done'}
                                </span>
                              </button>

                              <div className="flex items-center gap-1 text-[10px] font-semibold text-stone-500 dark:text-stone-400">
                                {getTimeSlotIcon(session.timeSlot)}
                                <span className="capitalize">{session.timeSlot.slice(0, 4)}</span>
                              </div>
                            </div>

                            {/* Chapter Title with clean multi-line display */}
                            <h4
                              className={`text-xs font-bold leading-snug line-clamp-2 my-1 ${
                                session.isCompleted ? 'line-through text-stone-400 dark:text-stone-500' : 'text-[#1E2922] dark:text-[#EAE8E3]'
                              }`}
                              title={session.chapterTitle}
                            >
                              {session.chapterTitle}
                            </h4>

                            {/* Duration & Quick Actions Bar */}
                            <div className="flex items-center justify-between pt-1.5 border-t border-black/5 dark:border-white/5 text-[10px] text-stone-500 dark:text-stone-400 mt-2">
                              <span className="font-mono font-bold">{session.durationMinutes}m</span>

                              <div className="flex items-center gap-1">
                                {/* Pomodoro Sprint */}
                                <button
                                  type="button"
                                  onClick={() => startPomodoro(session)}
                                  className="p-1 rounded-md text-stone-500 dark:text-stone-400 hover:text-[#B85C38] dark:hover:text-[#E07048] hover:bg-white dark:hover:bg-stone-800 transition-colors"
                                  title="Start 25m Focus Sprint"
                                >
                                  <Play className="w-3 h-3" />
                                </button>

                                {/* Study with AI Mentor */}
                                <button
                                  type="button"
                                  onClick={() => handleStudyWithMentor(session)}
                                  className="p-1 rounded-md text-stone-500 dark:text-stone-400 hover:text-[#284E38] dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-stone-800 transition-colors"
                                  title="Study with AI Mentor"
                                >
                                  <Brain className="w-3 h-3" />
                                </button>

                                {/* Take Quiz */}
                                <button
                                  type="button"
                                  onClick={() => handleTakeQuiz(session)}
                                  className="p-1 rounded-md text-stone-500 dark:text-stone-400 hover:text-[#8C6D23] dark:hover:text-[#E6B34A] hover:bg-white dark:hover:bg-stone-800 transition-colors"
                                  title="Take Chapter Quiz"
                                >
                                  <Award className="w-3 h-3" />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => deleteSession(session.id)}
                                  className="p-1 rounded-md text-stone-400 hover:text-red-600 hover:bg-white dark:hover:bg-stone-800 opacity-60 hover:opacity-100 transition-opacity"
                                  title="Remove session"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Day Footer Quick Add */}
                    <div className="pt-2 mt-2 border-t border-stone-100 dark:border-stone-800">
                      <button
                        type="button"
                        onClick={() => {
                          if (documents.length > 0) setManualDocId(documents[0].id);
                          setManualDay(day);
                          setShowAddModal(true);
                        }}
                        className="w-full py-1 text-center text-[10px] font-bold text-stone-400 hover:text-[#284E38] dark:hover:text-emerald-400 hover:bg-stone-50 dark:hover:bg-[#141B17] rounded-lg transition-colors cursor-pointer"
                      >
                        + Add Block
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Pomodoro Focus Sprint Modal */}
      {showPomodoroModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-[#1A221E] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-stone-200 dark:border-[#2C3B30] shadow-2xl text-center space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B85C38] dark:text-[#E07048]">
                <Timer className="w-4 h-4 text-[#B85C38] dark:text-[#E07048]" />
                <span>Deep Work Focus Sprint</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPomodoroModal(false)}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Active Chapter Sprint
              </span>
              <h3 className="text-base font-extrabold text-[#284E38] dark:text-emerald-400 mt-0.5 line-clamp-1">
                {pomodoroActiveSession?.chapterTitle || 'NCERT Curriculum Mastery'}
              </h3>
            </div>

            {/* Big Countdown Clock */}
            <div className="py-6 px-4 bg-gradient-to-br from-[#FAF9F5] to-[#FCECD4]/30 dark:from-[#141B17] dark:to-amber-950/20 rounded-3xl border border-[#8C6D23]/20 dark:border-[#8C6D23]/40 flex flex-col items-center justify-center shadow-inner">
              <div className="text-5xl font-black font-mono text-[#284E38] dark:text-emerald-400 tracking-tight">
                {String(Math.floor(pomodoroSecondsLeft / 60)).padStart(2, '0')}:
                {String(pomodoroSecondsLeft % 60).padStart(2, '0')}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-2">
                {isPomodoroRunning ? '🔥 High cognitive focus active · Zero distractions' : 'Paused · Ready when you are'}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsPomodoroRunning(!isPomodoroRunning)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-xs ${
                  isPomodoroRunning
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-[#284E38] dark:bg-[#346E4C] text-white hover:bg-[#1E3B2A]'
                }`}
              >
                {isPomodoroRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPomodoroRunning ? 'Pause Sprint' : 'Start Focus'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPomodoroRunning(false);
                  setPomodoroSecondsLeft(25 * 60);
                }}
                className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs cursor-pointer transition-colors"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPomodoroRunning(false);
                  if (pomodoroActiveSession) {
                    toggleComplete(pomodoroActiveSession.id, true);
                  }
                  setShowPomodoroModal(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 cursor-pointer transition-colors"
              >
                Complete Early (+35 XP)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ✨ AI Revision Planner Modal */}
      {showAiPlannerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-[#1A221E] rounded-3xl p-6 sm:p-7 max-w-md w-full border border-stone-200 dark:border-[#2C3B30] shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#8C6D23] dark:text-[#E6B34A]" />
                <h3 className="text-base font-bold text-[#284E38] dark:text-emerald-400">
                  AI Cognitive Revision Planner
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiPlannerModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Our pedagogical algorithm distributes your syllabus across 7 days. High-cognitive theory sessions are scheduled in the morning, followed by numerical drills in the afternoon and active flashcard retrieval in the evening.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Daily Study Intensity
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'balanced', label: 'Balanced', desc: '2 hrs / day' },
                    { id: 'intensive', label: 'Focused', desc: '3.5 hrs / day' },
                    { id: 'exam_sprint', label: 'Exam Sprint', desc: '5+ hrs / day' }
                  ].map(lvl => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setAiPlanIntensity(lvl.id as any)}
                      className={`p-2.5 rounded-2xl border text-center cursor-pointer transition-all ${
                        aiPlanIntensity === lvl.id
                          ? 'border-[#284E38] dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/60 text-[#284E38] dark:text-emerald-300 font-extrabold shadow-2xs'
                          : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#141B17] text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <div className="text-xs">{lvl.label}</div>
                      <div className="text-[10px] text-stone-400 font-normal">{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                  Subject Priority
                </label>
                <select
                  value={aiPlanFocusSubject}
                  onChange={e => setAiPlanFocusSubject(e.target.value)}
                  className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#141B17] text-stone-800 dark:text-stone-200 px-3 py-2 font-medium focus:bg-white dark:focus:bg-[#1A221E] focus:outline-none focus:ring-1 focus:ring-[#284E38]"
                >
                  <option value="All">All Subjects (Evenly Balanced)</option>
                  <option value="Mathematics">Focus on Mathematics</option>
                  <option value="Science">Focus on Science (Physics, Chem, Bio)</option>
                  <option value="Social Science">Focus on Social Science</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAiPlannerModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateAiPlan}
                className="px-4 py-2 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] dark:bg-[#346E4C] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Generate Weekly Plan (+50 XP)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Manual Add Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-[#1A221E] rounded-3xl p-6 sm:p-7 max-w-md w-full border border-stone-200 dark:border-[#2C3B30] shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-base font-bold text-[#284E38] dark:text-emerald-400 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#8C6D23] dark:text-[#E6B34A]" />
                <span>Add Study Session</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Select Chapter
                </label>
                <select
                  value={manualDocId}
                  onChange={e => setManualDocId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#141B17] text-stone-800 dark:text-stone-200 px-3 py-2 font-medium focus:bg-white dark:focus:bg-[#1A221E] focus:outline-none focus:ring-1 focus:ring-[#284E38]"
                >
                  {documents.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      [{doc.subject}] {doc.custom_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Day of Week
                  </label>
                  <select
                    value={manualDay}
                    onChange={e => setManualDay(e.target.value as DayOfWeek)}
                    className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#141B17] text-stone-800 dark:text-stone-200 px-3 py-2 font-medium focus:bg-white dark:focus:bg-[#1A221E] focus:outline-none focus:ring-1 focus:ring-[#284E38]"
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Time Slot
                  </label>
                  <select
                    value={manualTimeSlot}
                    onChange={e => setManualTimeSlot(e.target.value as TimeSlot)}
                    className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#141B17] text-stone-800 dark:text-stone-200 px-3 py-2 font-medium focus:bg-white dark:focus:bg-[#1A221E] focus:outline-none focus:ring-1 focus:ring-[#284E38]"
                  >
                    <option value="morning">🌅 Morning (Theory)</option>
                    <option value="afternoon">☀️ Afternoon (Drill)</option>
                    <option value="evening">🌙 Evening (Recall)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Duration (Minutes)
                </label>
                <div className="flex items-center gap-2">
                  {[30, 45, 60, 90].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setManualDuration(mins)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        manualDuration === mins
                          ? 'bg-[#284E38] dark:bg-[#346E4C] text-white shadow-2xs'
                          : 'bg-stone-100 dark:bg-[#141B17] text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] dark:bg-[#346E4C] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Schedule Session (+15 XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
