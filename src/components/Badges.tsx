import React, { useState } from 'react';
import {
  Award,
  Flame,
  Sparkles,
  Trophy,
  BookOpen,
  Brain,
  Target,
  Sunrise,
  Lock,
  CheckCircle2,
  Share2,
  X,
  Zap,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, BadgeCategory } from '../types';
import { computeBadgesStatus, BadgeStatus } from '../data/badgesData';

interface BadgesProps {
  user: UserProfile;
  onGrantXp?: (amount: number) => void;
}

export const Badges: React.FC<BadgesProps> = ({ user, onGrantXp }) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked' | 'streak' | 'subject' | 'xp'>('all');
  const [selectedBadge, setSelectedBadge] = useState<BadgeStatus | null>(null);

  const allStatuses = computeBadgesStatus(user);

  const unlockedCount = allStatuses.filter(s => s.isUnlocked).length;
  const totalCount = allStatuses.length;
  const totalClaimedXp = allStatuses
    .filter(s => s.isUnlocked)
    .reduce((acc, s) => acc + s.badge.xpReward, 0);

  const filteredStatuses = allStatuses.filter(status => {
    if (filter === 'unlocked') return status.isUnlocked;
    if (filter === 'locked') return !status.isUnlocked;
    if (filter === 'streak') return status.badge.category === 'streak';
    if (filter === 'subject') return status.badge.category === 'subject';
    if (filter === 'xp') return status.badge.category === 'xp';
    return true;
  });

  const getIcon = (name: string, className: string = 'w-5 h-5') => {
    switch (name) {
      case 'Sunrise':
        return <Sunrise className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Trophy':
        return <Trophy className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Brain':
        return <Brain className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Target':
        return <Target className={className} />;
      default:
        return <Award className={className} />;
    }
  };

  const getColorStyles = (colorScheme: string, isUnlocked: boolean) => {
    if (!isUnlocked) {
      return {
        cardBg: 'bg-stone-50/80 border-stone-200/80 text-stone-400',
        iconBg: 'bg-stone-200 text-stone-400',
        badgePill: 'bg-stone-100 text-stone-500 border-stone-200',
        progressBar: 'bg-stone-400'
      };
    }

    switch (colorScheme) {
      case 'amber':
        return {
          cardBg: 'bg-gradient-to-br from-white to-amber-50/70 border-amber-300/80 text-stone-900 shadow-xs hover:shadow-md',
          iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-xs',
          badgePill: 'bg-amber-100 text-amber-900 border-amber-300',
          progressBar: 'bg-amber-500'
        };
      case 'terracotta':
        return {
          cardBg: 'bg-gradient-to-br from-white to-orange-50/70 border-[#B85C38]/40 text-stone-900 shadow-xs hover:shadow-md',
          iconBg: 'bg-gradient-to-br from-[#B85C38] to-orange-600 text-white shadow-xs',
          badgePill: 'bg-orange-100 text-orange-950 border-orange-300',
          progressBar: 'bg-[#B85C38]'
        };
      case 'emerald':
        return {
          cardBg: 'bg-gradient-to-br from-white to-emerald-50/70 border-emerald-300/80 text-stone-900 shadow-xs hover:shadow-md',
          iconBg: 'bg-gradient-to-br from-[#284E38] to-emerald-600 text-white shadow-xs',
          badgePill: 'bg-emerald-100 text-emerald-950 border-emerald-300',
          progressBar: 'bg-emerald-600'
        };
      case 'indigo':
        return {
          cardBg: 'bg-gradient-to-br from-white to-indigo-50/70 border-indigo-300/80 text-stone-900 shadow-xs hover:shadow-md',
          iconBg: 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-xs',
          badgePill: 'bg-indigo-100 text-indigo-950 border-indigo-300',
          progressBar: 'bg-indigo-600'
        };
      case 'purple':
        return {
          cardBg: 'bg-gradient-to-br from-white to-purple-50/70 border-purple-300/80 text-stone-900 shadow-xs hover:shadow-md',
          iconBg: 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-xs',
          badgePill: 'bg-purple-100 text-purple-950 border-purple-300',
          progressBar: 'bg-purple-600'
        };
      case 'gold':
      default:
        return {
          cardBg: 'bg-gradient-to-br from-white to-yellow-50/70 border-[#8C6D23]/40 text-stone-900 shadow-xs hover:shadow-md',
          iconBg: 'bg-gradient-to-br from-[#8C6D23] to-amber-500 text-white shadow-xs',
          badgePill: 'bg-[#FCECD4] text-[#8C6D23] border-[#8C6D23]/30',
          progressBar: 'bg-[#8C6D23]'
        };
    }
  };

  const handleBadgeClick = (status: BadgeStatus) => {
    setSelectedBadge(status);
    if (status.isUnlocked) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#8C6D23]/20 shadow-md space-y-6 text-left">
      {/* Header with Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8C6D23] mb-1">
            <Trophy className="w-4 h-4 text-[#8C6D23]" />
            Gamification & Mastery Milestones
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-[#284E38]">
            Academic Badges & Achievements
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Earn distinctive honors through daily streaks, subject mastery, and active recall.
          </p>
        </div>

        {/* Aggregate Unlocked Progress */}
        <div className="flex items-center gap-4 bg-[#FAF9F5] p-3 rounded-2xl border border-stone-200 shrink-0">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              Unlocked
            </span>
            <span className="text-base font-extrabold text-[#284E38] font-mono">
              {unlockedCount} / {totalCount}
            </span>
          </div>

          <div className="h-8 w-px bg-stone-200" />

          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              Bonus XP
            </span>
            <span className="text-base font-extrabold text-[#8C6D23] font-mono">
              +{totalClaimedXp} XP
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { id: 'all', label: `All (${totalCount})` },
          { id: 'unlocked', label: `Earned (${unlockedCount})` },
          { id: 'locked', label: `In Progress (${totalCount - unlockedCount})` },
          { id: 'streak', label: 'Streaks' },
          { id: 'subject', label: 'Subjects' },
          { id: 'xp', label: 'XP Milestones' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as any)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filter === tab.id
                ? 'bg-[#284E38] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredStatuses.map(status => {
          const { badge, isUnlocked, currentProgress, progressPercent } = status;
          const styles = getColorStyles(badge.colorScheme, isUnlocked);

          return (
            <div
              key={badge.id}
              onClick={() => handleBadgeClick(status)}
              className={`group relative p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                styles.cardBg
              } ${!isUnlocked ? 'opacity-70 hover:opacity-100' : ''}`}
            >
              <div>
                {/* Top Row: Icon + Status Pill */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
                      styles.iconBg
                    } group-hover:scale-105 transition-transform`}
                  >
                    {getIcon(badge.iconName, 'w-5 h-5')}
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      styles.badgePill
                    }`}
                  >
                    {isUnlocked ? '✓ EARNED' : 'LOCKED'}
                  </span>
                </div>

                {/* Badge Title & Reward */}
                <div className="flex items-baseline justify-between gap-1 mb-1">
                  <h4 className="text-sm font-extrabold text-[#1E2922] group-hover:text-[#284E38] transition-colors">
                    {badge.title}
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-[#8C6D23] shrink-0">
                    +{badge.xpReward} XP
                  </span>
                </div>

                {/* Description */}
                <p className="text-[11px] text-stone-600 leading-snug line-clamp-2 mb-3">
                  {badge.description}
                </p>
              </div>

              {/* Progress Bar / Footer */}
              <div className="pt-2 border-t border-black/5 mt-auto">
                <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
                  <span className="text-stone-500">
                    {isUnlocked ? 'Requirement Met' : badge.requirement}
                  </span>
                  <span className="font-mono text-stone-700">
                    {currentProgress} / {badge.targetProgress} {badge.unit}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${styles.progressBar}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 font-bold p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pt-2">
              <div
                className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center font-bold text-white shadow-lg mb-4 ${
                  getColorStyles(selectedBadge.badge.colorScheme, selectedBadge.isUnlocked).iconBg
                }`}
              >
                {getIcon(selectedBadge.badge.iconName, 'w-10 h-10')}
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 bg-[#FCECD4] text-[#8C6D23]">
                <ShieldCheck className="w-3.5 h-3.5" />
                {selectedBadge.isUnlocked ? 'Official Achievement Earned' : 'Achievement In Progress'}
              </div>

              <h3 className="text-xl font-extrabold text-[#284E38]">
                {selectedBadge.badge.title}
              </h3>
              <p className="text-xs text-stone-600 mt-2 max-w-sm mx-auto leading-relaxed">
                {selectedBadge.badge.description}
              </p>

              {/* Reward & Progress Box */}
              <div className="my-5 p-4 rounded-2xl bg-[#FAF9F5] border border-stone-200 text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-600">Requirement:</span>
                  <span className="font-bold text-[#1E2922]">{selectedBadge.badge.requirement}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-600">XP Reward:</span>
                  <span className="font-bold text-[#8C6D23]">+{selectedBadge.badge.xpReward} XP</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-600">Current Progress:</span>
                  <span className="font-mono font-bold text-[#284E38]">
                    {selectedBadge.currentProgress} / {selectedBadge.badge.targetProgress} ({selectedBadge.progressPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-[#284E38] to-[#8C6D23] rounded-full"
                    style={{ width: `${selectedBadge.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3">
                {selectedBadge.isUnlocked ? (
                  <button
                    type="button"
                    onClick={() => {
                      confetti({
                        particleCount: 80,
                        spread: 70,
                        origin: { y: 0.5 }
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#284E38] text-white font-bold text-xs hover:bg-[#1E3B2A] shadow-xs cursor-pointer transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Celebrate Achievement</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedBadge(null)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200 cursor-pointer transition-all"
                  >
                    <span>Keep Studying</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
