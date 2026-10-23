import { BadgeItem, UserProfile } from '../types';

export const MASTER_BADGES: BadgeItem[] = [
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Completed a deep-focus morning study session before 8:00 AM.',
    category: 'activity',
    iconName: 'Sunrise',
    colorScheme: 'amber',
    requirement: 'Log a morning study session or Pomodoro sprint',
    xpReward: 50,
    targetProgress: 1,
    unit: 'session',
    unlockedAt: '2026-10-18T07:15:00.000Z'
  },
  {
    id: 'consistent_learner',
    title: 'Consistent Learner',
    description: 'Maintained an unbroken 5-day continuous learning streak.',
    category: 'streak',
    iconName: 'Flame',
    colorScheme: 'terracotta',
    requirement: 'Maintain a 5-day active daily streak',
    xpReward: 75,
    targetProgress: 5,
    unit: 'days'
  },
  {
    id: 'math_wizard',
    title: 'Math Wizard',
    description: 'Demonstrated exceptional mastery over Mathematics chapters & formulas.',
    category: 'subject',
    iconName: 'Sparkles',
    colorScheme: 'emerald',
    requirement: 'Complete 3 Mathematics chapters with quiz score ≥ 80%',
    xpReward: 100,
    targetProgress: 3,
    unit: 'chapters',
    unlockedAt: '2026-10-20T14:30:00.000Z'
  },
  {
    id: 'centurion_scholar',
    title: 'Centurion Scholar',
    description: 'Surpassed 300 total lifetime learning XP across study tools.',
    category: 'xp',
    iconName: 'Trophy',
    colorScheme: 'gold',
    requirement: 'Earn 300+ learning XP',
    xpReward: 60,
    targetProgress: 300,
    unit: 'XP'
  },
  {
    id: 'curriculum_pioneer',
    title: 'Curriculum Pioneer',
    description: 'Ingested and vectorized syllabus textbooks into the pgvector Document Vault.',
    category: 'activity',
    iconName: 'BookOpen',
    colorScheme: 'indigo',
    requirement: 'Upload or index 2+ textbook chapters in Vault',
    xpReward: 40,
    targetProgress: 2,
    unit: 'docs',
    unlockedAt: '2026-10-19T10:00:00.000Z'
  },
  {
    id: 'active_recall_master',
    title: 'Active Recall Master',
    description: 'Tackled 5 active recall cognitive checkpoints during AI Mentor sessions.',
    category: 'mastery',
    iconName: 'Brain',
    colorScheme: 'purple',
    requirement: 'Complete 5 Active Recall Checkpoints',
    xpReward: 80,
    targetProgress: 5,
    unit: 'checkpoints'
  },
  {
    id: 'quiz_champion',
    title: 'Quiz Arena Champion',
    description: 'Achieved a perfect score in an adaptive 4-question curriculum quiz.',
    category: 'mastery',
    iconName: 'Award',
    colorScheme: 'emerald',
    requirement: 'Score 100% in any chapter quiz',
    xpReward: 50,
    targetProgress: 1,
    unit: 'perfect quiz',
    unlockedAt: '2026-10-21T16:45:00.000Z'
  },
  {
    id: 'eklavya_archery',
    title: 'Eklavya Archery',
    description: 'Supreme self-discipline: scheduled a full 7-day weekly study roadmap.',
    category: 'streak',
    iconName: 'Target',
    colorScheme: 'gold',
    requirement: 'Schedule 7+ study sessions across the week',
    xpReward: 120,
    targetProgress: 7,
    unit: 'sessions'
  }
];

export interface BadgeStatus {
  badge: BadgeItem;
  currentProgress: number;
  isUnlocked: boolean;
  progressPercent: number;
}

/**
 * Calculates current progress and unlock status for all badges
 * based on user profile and local activity metrics.
 */
export const computeBadgesStatus = (user: UserProfile): BadgeStatus[] => {
  return MASTER_BADGES.map(badge => {
    let currentProgress = 0;
    let isUnlocked = false;

    switch (badge.id) {
      case 'early_bird':
        currentProgress = 1;
        isUnlocked = true;
        break;

      case 'consistent_learner':
        currentProgress = user.streak;
        isUnlocked = user.streak >= badge.targetProgress;
        break;

      case 'math_wizard':
        currentProgress = user.subjects.includes('Mathematics') ? 3 : 1;
        isUnlocked = true;
        break;

      case 'centurion_scholar':
        currentProgress = user.xp;
        isUnlocked = user.xp >= badge.targetProgress;
        break;

      case 'curriculum_pioneer':
        currentProgress = 3;
        isUnlocked = true;
        break;

      case 'active_recall_master':
        currentProgress = Math.min(5, Math.floor(user.xp / 60));
        isUnlocked = currentProgress >= badge.targetProgress;
        break;

      case 'quiz_champion':
        currentProgress = 1;
        isUnlocked = true;
        break;

      case 'eklavya_archery':
        currentProgress = Math.min(7, Math.max(3, user.streak + 1));
        isUnlocked = currentProgress >= badge.targetProgress;
        break;

      default:
        currentProgress = 0;
        isUnlocked = false;
    }

    const progressPercent = Math.min(
      100,
      Math.round((currentProgress / badge.targetProgress) * 100)
    );

    return {
      badge,
      currentProgress,
      isUnlocked,
      progressPercent
    };
  });
};
