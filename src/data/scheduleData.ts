import { ScheduledSession } from '../types';

export const INITIAL_SCHEDULED_SESSIONS: ScheduledSession[] = [
  {
    id: 'sched-1',
    docId: 'doc-math-ch1',
    chapterTitle: 'Real Numbers & Fundamental Theorem',
    subject: 'Mathematics',
    dayOfWeek: 'Monday',
    timeSlot: 'morning',
    durationMinutes: 45,
    isCompleted: true,
    notes: 'Review Euclid’s division lemma & prime factorization'
  },
  {
    id: 'sched-2',
    docId: 'doc-sci-ch10',
    chapterTitle: 'Light: Reflection, Refraction & Lens Formula',
    subject: 'Science',
    dayOfWeek: 'Monday',
    timeSlot: 'evening',
    durationMinutes: 50,
    isCompleted: true,
    notes: 'Master Snell’s Law and lens magnification sign conventions'
  },
  {
    id: 'sched-3',
    docId: 'doc-sci-ch1',
    chapterTitle: 'Chemical Reactions & Balancing Equations',
    subject: 'Science',
    dayOfWeek: 'Tuesday',
    timeSlot: 'afternoon',
    durationMinutes: 45,
    isCompleted: true,
    notes: 'Practice thermal decomposition & displacement reactions'
  },
  {
    id: 'sched-4',
    docId: 'doc-math-ch8',
    chapterTitle: 'Introduction to Trigonometry & Ratios',
    subject: 'Mathematics',
    dayOfWeek: 'Wednesday',
    timeSlot: 'morning',
    durationMinutes: 45,
    isCompleted: false,
    notes: 'Memorize sin/cos/tan values and derive sin²θ + cos²θ = 1'
  },
  {
    id: 'sched-5',
    docId: 'doc-sst-ch1',
    chapterTitle: 'The Rise of Nationalism in Europe',
    subject: 'Social Science',
    dayOfWeek: 'Wednesday',
    timeSlot: 'evening',
    durationMinutes: 30,
    isCompleted: false,
    notes: 'Focus on 1834 Zollverein customs union and Giuseppe Mazzini'
  },
  {
    id: 'sched-6',
    docId: 'doc-sci-ch10',
    chapterTitle: 'Total Internal Reflection & Fiber Optics',
    subject: 'Science',
    dayOfWeek: 'Thursday',
    timeSlot: 'afternoon',
    durationMinutes: 40,
    isCompleted: false,
    notes: 'Understand critical angle boundary conditions in optical fibers'
  },
  {
    id: 'sched-7',
    docId: 'doc-math-ch1',
    chapterTitle: 'Irrationality Proofs (√2, √3, √5)',
    subject: 'Mathematics',
    dayOfWeek: 'Friday',
    timeSlot: 'morning',
    durationMinutes: 35,
    isCompleted: false,
    notes: 'Master standard board exam contradiction proof step-by-step'
  },
  {
    id: 'sched-8',
    docId: 'doc-sci-ch1',
    chapterTitle: 'Weekly Assessment: 4-MCQ Quiz Arena',
    subject: 'Science',
    dayOfWeek: 'Saturday',
    timeSlot: 'morning',
    durationMinutes: 30,
    isCompleted: false,
    notes: 'Self-test retention with instant solutions and explanation review'
  }
];
