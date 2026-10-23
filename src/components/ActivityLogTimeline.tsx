import React, { useState, useEffect } from 'react';
import {
  Timer,
  Award,
  GraduationCap,
  Layers,
  Database,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  X,
  Filter,
  Flame,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { ActivityLogItem, ActivityType } from '../types';
import { INITIAL_ACTIVITY_LOG } from '../data/activityLogData';

interface ActivityLogTimelineProps {
  onGrantXp?: (amount: number) => void;
}

const STORAGE_KEY = 'eklavya_activity_log';

export const ActivityLogTimeline: React.FC<ActivityLogTimelineProps> = ({ onGrantXp }) => {
  const [activities, setActivities] = useState<ActivityLogItem[]>(() => {
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
    return INITIAL_ACTIVITY_LOG;
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'study_session' | 'quiz_completed' | 'topic_mastered'>('all');
  const [showLogModal, setShowLogModal] = useState(false);

  // Form states for manual activity logging
  const [logType, setLogType] = useState<ActivityType>('study_session');
  const [logTitle, setLogTitle] = useState('');
  const [logSubject, setLogSubject] = useState('Mathematics');
  const [logDuration, setLogDuration] = useState('25 mins Focus');
  const [logDetails, setLogDetails] = useState('');

  // Persist to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    }
  }, [activities]);

  // Filtered timeline entries
  const filteredActivities = activities.filter(item => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  // Calculate summary metrics
  const totalStudyMinutes = activities.reduce((acc, curr) => {
    if (curr.duration) {
      const match = curr.duration.match(/(\d+)\s*mins?/i);
      if (match) return acc + parseInt(match[1], 10);
    }
    return acc;
  }, 0);

  const completedQuizzesCount = activities.filter(a => a.type === 'quiz_completed').length;
  const masteredTopicsCount = activities.filter(a => a.type === 'topic_mastered').length;
  const totalLoggedXp = activities.reduce((acc, curr) => acc + (curr.xpEarned || 0), 0);

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTitle.trim()) return;

    const xp = logType === 'topic_mastered' ? 80 : logType === 'quiz_completed' ? 75 : 50;

    const newActivity: ActivityLogItem = {
      id: `act-${Date.now()}`,
      type: logType,
      title: logTitle.trim(),
      subject: logSubject,
      timestamp: 'Just now',
      duration: logType === 'study_session' ? logDuration : undefined,
      xpEarned: xp,
      score: logType === 'quiz_completed' ? '4/4 (100%)' : undefined,
      topicTag: logSubject,
      details: logDetails.trim() || `Completed self-directed study session on ${logSubject}.`
    };

    setActivities(prev => [newActivity, ...prev]);
    setShowLogModal(false);
    setLogTitle('');
    setLogDetails('');

    if (onGrantXp) {
      onGrantXp(xp);
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'study_session':
        return <Timer className="w-4 h-4 text-white" />;
      case 'quiz_completed':
        return <Award className="w-4 h-4 text-white" />;
      case 'topic_mastered':
        return <GraduationCap className="w-4 h-4 text-white" />;
      case 'flashcard_review':
        return <Layers className="w-4 h-4 text-white" />;
      case 'document_ingested':
        return <Database className="w-4 h-4 text-white" />;
      default:
        return <Clock className="w-4 h-4 text-white" />;
    }
  };

  const getActivityBadgeColor = (type: ActivityType) => {
    switch (type) {
      case 'study_session':
        return 'bg-[#284E38]';
      case 'quiz_completed':
        return 'bg-[#8C6D23]';
      case 'topic_mastered':
        return 'bg-emerald-600';
      case 'flashcard_review':
        return 'bg-blue-600';
      case 'document_ingested':
        return 'bg-[#B85C38]';
      default:
        return 'bg-stone-600';
    }
  };

  const getSubjectBadgeStyle = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'mathematics':
        return 'bg-[#284E38]/10 text-[#284E38] border-[#284E38]/20';
      case 'science':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'social science':
        return 'bg-[#B85C38]/10 text-[#B85C38] border-[#B85C38]/20';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#8C6D23]/20 shadow-md text-left space-y-6">
      {/* Header with Title & Quick Log Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#284E38]/10 text-[#284E38] flex items-center justify-center font-bold">
            <Clock className="w-5 h-5 text-[#284E38]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#284E38] flex items-center gap-2">
              Academic Activity Timeline
              <span className="text-[11px] font-bold text-[#8C6D23] bg-[#FCECD4] px-2.5 py-0.5 rounded-full border border-[#8C6D23]/15">
                {activities.length} Recorded Milestones
              </span>
            </h2>
            <p className="text-xs text-stone-500">
              Chronological log of your deep work study sessions, completed quizzes, and mastered topics.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowLogModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white font-bold text-xs shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Activity</span>
        </button>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-stone-200/90 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Timer className="w-3.5 h-3.5 text-[#284E38]" />
            Total Focus Time
          </span>
          <span className="text-lg font-extrabold text-[#284E38] font-mono tabular-nums mt-1">
            {(totalStudyMinutes / 60).toFixed(1)} Hours
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-stone-200/90 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-[#8C6D23]" />
            Quizzes Passed
          </span>
          <span className="text-lg font-extrabold text-[#8C6D23] font-mono tabular-nums mt-1">
            {completedQuizzesCount} Assessments
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-stone-200/90 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
            Topics Mastered
          </span>
          <span className="text-lg font-extrabold text-emerald-700 font-mono tabular-nums mt-1">
            {masteredTopicsCount} Units
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-stone-200/90 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            Milestone XP
          </span>
          <span className="text-lg font-extrabold text-[#8C6D23] font-mono tabular-nums mt-1">
            +{totalLoggedXp} XP
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-2xl border border-stone-200/60 max-w-fit">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-[#284E38] text-white shadow-xs'
              : 'text-stone-600 hover:text-[#284E38]'
          }`}
        >
          All Activities ({activities.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('study_session')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'study_session'
              ? 'bg-[#284E38] text-white shadow-xs'
              : 'text-stone-600 hover:text-[#284E38]'
          }`}
        >
          Study Sessions
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('quiz_completed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'quiz_completed'
              ? 'bg-[#284E38] text-white shadow-xs'
              : 'text-stone-600 hover:text-[#284E38]'
          }`}
        >
          Quizzes Completed
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('topic_mastered')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'topic_mastered'
              ? 'bg-[#284E38] text-white shadow-xs'
              : 'text-stone-600 hover:text-[#284E38]'
          }`}
        >
          Topics Mastered
        </button>
      </div>

      {/* Vertical Scrollable Timeline */}
      <div className="relative max-h-[500px] overflow-y-auto pr-2 pt-2 pb-4">
        {/* Continuous Vertical Timeline Line */}
        <div className="absolute top-4 bottom-4 left-[21px] w-0.5 bg-gradient-to-b from-[#284E38]/30 via-[#8C6D23]/25 to-stone-200" />

        <div className="space-y-6">
          {filteredActivities.map(item => (
            <div key={item.id} className="relative flex items-start gap-4 group">
              {/* Timeline Node Bead with Icon */}
              <div
                className={`relative z-10 w-11 h-11 rounded-2xl ${getActivityBadgeColor(
                  item.type
                )} shadow-md flex items-center justify-center shrink-0 ring-4 ring-white group-hover:scale-105 transition-transform`}
              >
                {getActivityIcon(item.type)}
              </div>

              {/* Activity Card */}
              <div className="flex-1 bg-[#FAF9F5]/70 hover:bg-[#FAF9F5] p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-all">
                {/* Header row with Title and Timestamp */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1E2922] group-hover:text-[#284E38] transition-colors">
                      {item.title}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getSubjectBadgeStyle(
                        item.subject
                      )}`}
                    >
                      {item.subject}
                    </span>
                  </div>

                  <span className="text-[11px] font-semibold text-stone-500 whitespace-nowrap">
                    {item.timestamp}
                  </span>
                </div>

                {/* Details Description */}
                <p className="text-xs text-stone-600 leading-relaxed mb-3">
                  {item.details}
                </p>

                {/* Footer Metadata Chips */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200/60 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.duration && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                        <Clock className="w-3 h-3 text-[#284E38]" />
                        {item.duration}
                      </span>
                    )}

                    {item.score && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Score: {item.score}
                      </span>
                    )}

                    {item.topicTag && (
                      <span className="text-[11px] text-stone-500 italic">
                        #{item.topicTag}
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-bold text-[#8C6D23] bg-[#FCECD4] px-2 py-0.5 rounded-md border border-[#8C6D23]/20">
                    +{item.xpEarned} XP
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log Activity Modal */}
      {showLogModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowLogModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="text-base font-bold text-[#284E38] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#8C6D23]" />
                Log Learning Milestone
              </h3>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Activity Type
                </label>
                <select
                  value={logType}
                  onChange={e => setLogType(e.target.value as ActivityType)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#284E38]"
                >
                  <option value="study_session">Deep Work Study Session</option>
                  <option value="quiz_completed">Quiz Assessment Completed</option>
                  <option value="topic_mastered">Topic / Chapter Mastered</option>
                  <option value="flashcard_review">Flashcards Repetition Session</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Subject
                </label>
                <select
                  value={logSubject}
                  onChange={e => setLogSubject(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#284E38]"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="Social Science">Social Science</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Milestone Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mastered Quadratic Equations & Parabolic Roots"
                  value={logTitle}
                  onChange={e => setLogTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#284E38]"
                />
              </div>

              {logType === 'study_session' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Duration
                  </label>
                  <select
                    value={logDuration}
                    onChange={e => setLogDuration(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#284E38]"
                  >
                    <option value="25 mins Focus">25 mins Focus</option>
                    <option value="50 mins Focus">50 mins Focus</option>
                    <option value="75 mins Focus">75 mins Focus</option>
                    <option value="15 mins Quick Review">15 mins Quick Review</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Study Notes & Takeaways
                </label>
                <textarea
                  rows={2}
                  placeholder="What key formula, proof or concept did you conquer?"
                  value={logDetails}
                  onChange={e => setLogDetails(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#284E38]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#284E38] text-white font-bold text-xs hover:bg-[#1E3B2A] shadow-xs"
                >
                  Record Milestone (+XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
