import React, { useState } from 'react';
import { User, Flame, Trophy, Save, CheckCircle2, Shield, Sparkles } from 'lucide-react';
import { UserProfile } from '../../types';
import { onboardUserApi } from '../../services/api';
import { ActivityLogTimeline } from '../ActivityLogTimeline';
import { Badges } from '../Badges';
import { LearningActivityChart } from '../LearningActivityChart';

interface ProfileTabProps {
  user: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onGrantXp: (amount: number) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  onUpdateProfile,
  onGrantXp
}) => {
  const [courseType, setCourseType] = useState(user.course_type || 'School');
  const [board, setBoard] = useState(user.board || 'CBSE');
  const [classGrade, setClassGrade] = useState(user.class_grade || 'Class 10');
  const [name, setName] = useState(user.name || 'Rahul Sud');
  const [subjectsString, setSubjectsString] = useState(user.subjects.join(', '));
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    const parsedSubjects = subjectsString
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      await onboardUserApi({
        user_id: user.user_id,
        class_grade: classGrade,
        course_type: courseType,
        board: board,
        subjects: parsedSubjects
      });

      const updated: UserProfile = {
        ...user,
        name: name.trim(),
        class_grade: classGrade,
        course_type: courseType,
        board: board,
        subjects: parsedSubjects
      };

      onUpdateProfile(updated);
      onGrantXp(25);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateLevel = (xp: number) => {
    return Math.floor(xp / 100) + 1;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Gamification Summary Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-stone-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#B85C38] to-amber-600 text-white flex items-center justify-center font-bold shadow-sm">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">Daily Streak</div>
            <div className="text-2xl font-extrabold text-[#284E38] tabular-nums font-mono">
              {user.streak} Days
            </div>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-stone-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8C6D23] to-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total XP Earned</div>
            <div className="text-2xl font-extrabold text-[#8C6D23] tabular-nums font-mono">
              {user.xp} XP
            </div>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-stone-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#284E38] text-white flex items-center justify-center font-bold shadow-sm">
            <Shield className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">Mastery Tier</div>
            <div className="text-base font-extrabold text-[#284E38]">
              Level {calculateLevel(user.xp)} Scholar
            </div>
          </div>
        </div>
      </div>

      {/* Visual Learning Activity Chart (recharts) showing daily XP growth over the past week */}
      <LearningActivityChart user={user} />

      {/* Earned Badges & Achievements Component */}
      <Badges user={user} onGrantXp={onGrantXp} />

      {/* Main Form */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#8C6D23]/20 shadow-md">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-stone-100">
          <div className="w-10 h-10 rounded-2xl bg-[#284E38]/10 text-[#284E38] flex items-center justify-center">
            <User className="w-5 h-5 text-[#284E38]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#284E38]">Academic Profile & Onboarding</h2>
            <p className="text-xs text-stone-500">
              Configure your curriculum board, grade, and subjects to tailor all AI prompts and study tools.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Student Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#284E38]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Course Type
              </label>
              <select
                value={courseType}
                onChange={e => setCourseType(e.target.value)}
                className="w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#284E38]"
              >
                <option value="School">School (Secondary / Higher Secondary)</option>
                <option value="College">College / Undergraduate</option>
                <option value="Competitive Entrance">Competitive Exam (JEE / NEET / CUET)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Academic Board
              </label>
              <select
                value={board}
                onChange={e => setBoard(e.target.value)}
                className="w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#284E38]"
              >
                <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                <option value="ICSE">ICSE / ISC (CISCE Board)</option>
                <option value="State Board">State Board (Maharashtra, Karnataka, UP, etc.)</option>
                <option value="IB">IB (International Baccalaureate)</option>
                <option value="Cambridge">Cambridge / IGCSE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Class / Grade Level
              </label>
              <select
                value={classGrade}
                onChange={e => setClassGrade(e.target.value)}
                className="w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#284E38]"
              >
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10 (Board Exam Focus)</option>
                <option value="Class 11">Class 11 (Senior Secondary)</option>
                <option value="Class 12">Class 12 (Board & Entrance Focus)</option>
                <option value="Undergraduate Year 1">Undergraduate Year 1</option>
                <option value="Undergraduate Year 2">Undergraduate Year 2</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Active Subjects (Comma-separated)
            </label>
            <input
              type="text"
              required
              value={subjectsString}
              onChange={e => setSubjectsString(e.target.value)}
              placeholder="e.g. Mathematics, Science, Social Science, Computer Applications"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#284E38]"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              These subjects populate your global subject selector and Vault filters.
            </p>
          </div>

          {savedSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Academic profile updated & synchronized with backend (+25 XP awarded)!</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <span className="text-xs text-stone-400 font-mono">
              User ID: {user.user_id}
            </span>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Academic Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Activity Log Timeline */}
      <ActivityLogTimeline onGrantXp={onGrantXp} />
    </div>
  );
};
