import React, { useState, useEffect } from 'react';
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
  Zap
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

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
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

  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('All');
  const [chapterSearch, setChapterSearch] = useState<string>('');
  const [draggedDoc, setDraggedDoc] = useState<DocumentItem | null>(null);
  const [dragOverDay, setDragOverDay] = useState<DayOfWeek | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [manualDay, setManualDay] = useState<DayOfWeek>('Monday');
  const [manualDocId, setManualDocId] = useState<string>('');
  const [manualTimeSlot, setManualTimeSlot] = useState<TimeSlot>('morning');
  const [manualDuration, setManualDuration] = useState<number>(45);
  const [isConfirmingClear, setIsConfirmingClear] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  // Determine current day of week
  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

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

    // Default time slot based on number of items in that day
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
  const toggleComplete = (sessionId: string) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          const nextCompleted = !s.isCompleted;
          if (nextCompleted) {
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

    const newDistributed: ScheduledSession[] = documents.slice(0, 7).map((doc, idx) => {
      const day = DAYS_OF_WEEK[idx % DAYS_OF_WEEK.length];
      const slot: TimeSlot = idx % 2 === 0 ? 'morning' : 'evening';
      return {
        id: `auto-${Date.now()}-${idx}`,
        docId: doc.id,
        chapterTitle: doc.custom_name,
        subject: doc.subject,
        dayOfWeek: day,
        timeSlot: slot,
        durationMinutes: 45,
        isCompleted: false,
        notes: `AI-scheduled spaced session for ${doc.custom_name}`
      };
    });

    setSessions(newDistributed);
    onGrantXp(40);
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

  // Calculated Progress
  const totalSessions = sessions.length;
  const completedCount = sessions.filter(s => s.isCompleted).length;
  const progressPercent = totalSessions > 0 ? (completedCount / totalSessions) * 100 : 0;
  const totalWeeklyMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  const getSubjectColor = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'mathematics':
        return 'border-[#284E38]/30 bg-emerald-50/60 text-[#284E38]';
      case 'science':
        return 'border-teal-300 bg-teal-50/60 text-teal-900';
      case 'social science':
        return 'border-[#B85C38]/30 bg-orange-50/60 text-[#B85C38]';
      default:
        return 'border-stone-300 bg-stone-50 text-stone-800';
    }
  };

  const getTimeSlotIcon = (slot: TimeSlot) => {
    switch (slot) {
      case 'morning':
        return <Sun className="w-3 h-3 text-amber-500" />;
      case 'afternoon':
        return <Sun className="w-3 h-3 text-orange-500" />;
      case 'evening':
        return <Moon className="w-3 h-3 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner with Progress & Quick Utilities */}
      <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#8C6D23]/20 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#B85C38] mb-1">
              <CalendarIcon className="w-4 h-4 text-[#B85C38]" />
              Cognitive Spaced Repetition Planner
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#284E38]">
              Weekly Curriculum Study Schedule
            </h2>
            <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
              Drag and drop chapters from your Vault into each day. Structure your deep work focus sprints, check off completed milestones, and launch AI Mentor chats directly from your calendar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleAutoDistribute}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF9F5] border border-[#8C6D23]/30 hover:border-[#8C6D23] text-xs font-bold text-[#284E38] shadow-2xs transition-all cursor-pointer"
              title="Automatically distribute vault chapters across the week"
            >
              <Zap className="w-3.5 h-3.5 text-[#8C6D23]" />
              <span>Auto-Distribute Syllabus</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (documents.length > 0) setManualDocId(documents[0].id);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Session</span>
            </button>

            {isConfirmingClear ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-50 border border-red-200">
                <span className="text-[11px] font-bold text-red-700">Clear All?</span>
                <button
                  type="button"
                  onClick={handleClearWeek}
                  className="px-2 py-0.5 rounded text-[11px] font-extrabold text-white bg-red-600 hover:bg-red-700 cursor-pointer"
                >
                  Yes, Clear
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingClear(false)}
                  className="px-1.5 py-0.5 rounded text-[11px] font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 border border-stone-200 transition-colors cursor-pointer"
                title="Clear weekly schedule"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Weekly Completion Progress */}
        <div className="mt-6 pt-5 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#284E38]">Weekly Target Progress:</span>
            <span className="font-mono font-bold text-[#8C6D23]">
              {completedCount} of {totalSessions} Sessions Completed ({Math.round(progressPercent)}%)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-44 sm:w-60 h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
              <div
                className="h-full bg-gradient-to-r from-[#284E38] to-[#8C6D23] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-bold text-stone-500 whitespace-nowrap">
              {(totalWeeklyMinutes / 60).toFixed(1)} hrs planned
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Zone Workspace: Left Vault Chapters, Right 7-Day Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Draggable Vault Chapters */}
        <div className="lg:col-span-1 bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold text-[#284E38] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#8C6D23]" />
                Curriculum Vault
              </h3>
              <p className="text-[11px] text-stone-500">
                Drag onto any day or tap +
              </p>
            </div>
            <span className="text-[10px] font-bold bg-[#FCECD4] text-[#8C6D23] px-2 py-0.5 rounded-full">
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
                      ? 'bg-[#284E38] text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
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
              className="w-full pl-8 pr-2 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#284E38]"
            />
          </div>

          {/* List of Draggable Chapters */}
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                draggable={true}
                onDragStart={e => handleDragStart(e, doc)}
                className="group relative bg-[#FAF9F5] hover:bg-white p-3 rounded-2xl border border-stone-200 hover:border-[#8C6D23]/60 shadow-2xs hover:shadow-md cursor-grab active:cursor-grabbing transition-all select-none"
              >
                <div className="flex items-start gap-2">
                  <GripVertical className="w-4 h-4 text-stone-400 group-hover:text-[#8C6D23] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      {doc.subject}
                    </span>
                    <h4 className="text-xs font-bold text-[#1E2922] truncate group-hover:text-[#284E38]">
                      {doc.custom_name}
                    </h4>
                    <span className="text-[10px] font-mono text-stone-500">
                      {doc.total_chunks || 35} vector chunks
                    </span>
                  </div>
                </div>

                {/* Quick Add Button (for touch/mobile accessibility) */}
                <div className="mt-2 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px]">
                  <span className="text-stone-400">Drag to calendar</span>
                  <button
                    type="button"
                    onClick={() => {
                      setManualDocId(doc.id);
                      setManualDay(todayDayName);
                      setShowAddModal(true);
                    }}
                    className="font-bold text-[#8C6D23] hover:text-[#284E38] flex items-center gap-0.5"
                  >
                    <span>+ Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 3 Columns: 7-Day Weekly Calendar Grid */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
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
                className={`rounded-3xl p-3.5 flex flex-col justify-between transition-all min-h-[360px] ${
                  isOver
                    ? 'bg-amber-50/90 border-2 border-dashed border-[#8C6D23] scale-[1.02] shadow-lg'
                    : isToday
                    ? 'bg-white/95 border-2 border-[#284E38] shadow-md'
                    : 'bg-white/80 border border-stone-200/90 hover:border-stone-300 shadow-2xs'
                }`}
              >
                {/* Day Header */}
                <div className="pb-2 mb-2 border-b border-stone-100">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-extrabold uppercase tracking-tight ${
                        isToday ? 'text-[#284E38]' : 'text-stone-700'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-[#284E38] text-white rounded-full">
                        TODAY
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-stone-400 font-semibold mt-0.5">
                    {daySessions.length} sessions · {dayTotalMinutes}m
                  </div>
                </div>

                {/* Scheduled Session Cards */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[420px] pr-0.5">
                  {daySessions.length === 0 ? (
                    <div className="h-44 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center text-center p-3 text-stone-400 text-[11px]">
                      <CalendarIcon className="w-5 h-5 mb-1.5 opacity-40" />
                      <span>Drop chapters here to schedule</span>
                    </div>
                  ) : (
                    daySessions.map(session => (
                      <div
                        key={session.id}
                        className={`group relative p-2.5 rounded-2xl border text-left transition-all ${
                          session.isCompleted
                            ? 'bg-stone-50 border-stone-200 opacity-65'
                            : `${getSubjectColor(session.subject)} shadow-2xs hover:shadow-xs`
                        }`}
                      >
                        {/* Session Top Bar: Complete Checkbox + Time Slot */}
                        <div className="flex items-center justify-between gap-1 mb-1">
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
                                  : 'border-stone-400 bg-white hover:border-[#284E38]'
                              }`}
                            >
                              {session.isCompleted && <Check className="w-2.5 h-2.5" />}
                            </span>
                            <span className={session.isCompleted ? 'line-through text-stone-400' : ''}>
                              {session.isCompleted ? 'Done (+35 XP)' : 'Mark Done'}
                            </span>
                          </button>

                          <div className="flex items-center gap-1 text-[10px] font-semibold text-stone-500">
                            {getTimeSlotIcon(session.timeSlot)}
                            <span className="capitalize">{session.timeSlot.slice(0, 4)}</span>
                          </div>
                        </div>

                        {/* Chapter Title */}
                        <h4
                          className={`text-xs font-bold leading-snug line-clamp-2 my-1 ${
                            session.isCompleted ? 'line-through text-stone-400' : 'text-[#1E2922]'
                          }`}
                        >
                          {session.chapterTitle}
                        </h4>

                        {/* Duration & Quick Actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-black/5 text-[10px] text-stone-500 mt-1.5">
                          <span className="font-mono">{session.durationMinutes}m</span>

                          <div className="flex items-center gap-1">
                            {/* Study with AI Mentor */}
                            <button
                              type="button"
                              onClick={() => handleStudyWithMentor(session)}
                              className="p-1 rounded-md text-stone-500 hover:text-[#284E38] hover:bg-white"
                              title="Study with AI Mentor"
                            >
                              <Brain className="w-3 h-3" />
                            </button>

                            {/* Take Quiz */}
                            <button
                              type="button"
                              onClick={() => handleTakeQuiz(session)}
                              className="p-1 rounded-md text-stone-500 hover:text-[#8C6D23] hover:bg-white"
                              title="Take Chapter Quiz"
                            >
                              <Award className="w-3 h-3" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => deleteSession(session.id)}
                              className="p-1 rounded-md text-stone-400 hover:text-red-600 hover:bg-white"
                              title="Delete from schedule"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Day Footer Drop Hint */}
                <div className="pt-2 border-t border-stone-100 text-center text-[10px] text-stone-400">
                  + Drop to add
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Add Session Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="text-base font-bold text-[#284E38] flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#8C6D23]" />
                Schedule Study Session
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Select Chapter from Vault
                </label>
                <select
                  value={manualDocId}
                  onChange={e => setManualDocId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#284E38]"
                >
                  {documents.map(d => (
                    <option key={d.id} value={d.id}>
                      [{d.subject}] {d.custom_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Day of Week</label>
                  <select
                    value={manualDay}
                    onChange={e => setManualDay(e.target.value as DayOfWeek)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#284E38]"
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Time Slot</label>
                  <select
                    value={manualTimeSlot}
                    onChange={e => setManualTimeSlot(e.target.value as TimeSlot)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#284E38]"
                  >
                    <option value="morning">Morning Sprint</option>
                    <option value="afternoon">Afternoon Focus</option>
                    <option value="evening">Evening Revision</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Duration</label>
                <select
                  value={manualDuration}
                  onChange={e => setManualDuration(parseInt(e.target.value, 10))}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#284E38]"
                >
                  <option value={25}>25 mins (Single Pomodoro)</option>
                  <option value={45}>45 mins (Deep Work)</option>
                  <option value={60}>60 mins (Extended Sprint)</option>
                  <option value={90}>90 mins (Double Block)</option>
                </select>
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
                  Add to Calendar (+15 XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
