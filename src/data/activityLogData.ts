import { ActivityLogItem } from '../types';

export const INITIAL_ACTIVITY_LOG: ActivityLogItem[] = [
  {
    id: 'act-1',
    type: 'quiz_completed',
    title: 'Completed Class 10 Trigonometry Quiz',
    subject: 'Mathematics',
    timestamp: 'Today, 10:30 AM',
    score: '4/4 (100%)',
    xpEarned: 100,
    topicTag: 'Trigonometry Ratios',
    details: 'Answered all 4 questions correctly on sin²θ + cos²θ = 1 and Pythagorean distance triplets.'
  },
  {
    id: 'act-2',
    type: 'study_session',
    title: 'Deep Focus Sprint: Snell’s Law & Fiber Optics',
    subject: 'Science',
    timestamp: 'Today, 09:45 AM',
    duration: '25 mins Focus',
    xpEarned: 50,
    topicTag: 'Light: Optics',
    details: 'Completed full Pomodoro cycle reviewing total internal reflection in Reliance Jio optical fiber backbones.'
  },
  {
    id: 'act-3',
    type: 'topic_mastered',
    title: 'Topic Mastered: Fundamental Theorem of Arithmetic',
    subject: 'Mathematics',
    timestamp: 'Today, 09:10 AM',
    xpEarned: 75,
    topicTag: 'Real Numbers',
    details: 'Achieved 95% retention accuracy across 5 spaced review cycles on Euclid’s lemma and prime factorization.'
  },
  {
    id: 'act-4',
    type: 'flashcard_review',
    title: 'Reviewed 3D Flashcards: Chemical Reactions',
    subject: 'Science',
    timestamp: 'Yesterday, 05:15 PM',
    duration: '14 mins',
    xpEarned: 35,
    topicTag: 'Chemical Reactions',
    details: 'Practiced 6 cards on displacement reactions (Fe + CuSO₄), endothermic limestone decomposition, and redox.'
  },
  {
    id: 'act-5',
    type: 'study_session',
    title: 'Focus Study Sprint: Heights & Distances',
    subject: 'Mathematics',
    timestamp: 'Yesterday, 03:40 PM',
    duration: '50 mins Focus',
    xpEarned: 100,
    topicTag: 'Trigonometry Applications',
    details: 'Solved NCERT Chapter 9 multi-step heights problems with 30° and 60° angles of elevation.'
  },
  {
    id: 'act-6',
    type: 'quiz_completed',
    title: 'Completed Class 10 Chemical Reactions Assessment',
    subject: 'Science',
    timestamp: 'Yesterday, 02:00 PM',
    score: '3/4 (75%)',
    xpEarned: 75,
    topicTag: 'Chemical Reactions',
    details: 'Scored 3 out of 4 on thermal decomposition of lead nitrate and precipitation reactions.'
  },
  {
    id: 'act-7',
    type: 'topic_mastered',
    title: 'Topic Mastered: Ohm’s Law & Circuit Analysis',
    subject: 'Science',
    timestamp: 'Oct 20, 2026',
    xpEarned: 80,
    topicTag: 'Electricity',
    details: 'Mastered V = IR linear voltage-current coordinate plots, equivalent series-parallel resistance, and Joule heating.'
  },
  {
    id: 'act-8',
    type: 'document_ingested',
    title: 'Vectorized Document: Class 10 Light Optics PDF',
    subject: 'Science',
    timestamp: 'Oct 20, 2026',
    xpEarned: 50,
    topicTag: 'Curriculum Vault',
    details: 'Extracted 64 semantic chunks and generated 384-d vector embeddings in Supabase pgvector.'
  },
  {
    id: 'act-9',
    type: 'topic_mastered',
    title: 'Topic Mastered: The Rise of Nationalism & Zollverein',
    subject: 'Social Science',
    timestamp: 'Oct 19, 2026',
    xpEarned: 70,
    topicTag: 'European History',
    details: 'Mastered 1834 Prussian customs union reforms, Mazzini’s Young Italy movement, and Napoleonic civil codes.'
  },
  {
    id: 'act-10',
    type: 'study_session',
    title: 'Bilingual Voice Mentorship: Indian Freedom Struggle',
    subject: 'Social Science',
    timestamp: 'Oct 19, 2026',
    duration: '20 mins Talk Live',
    xpEarned: 40,
    topicTag: 'Nationalism in India',
    details: 'Conversed with Eklavya AI on why salt was chosen by Mahatma Gandhi for the 1930 Dandi Salt March.'
  }
];
