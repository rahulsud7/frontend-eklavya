export type LanguageMode = 'Hinglish' | 'Hindi' | 'English';

export interface UserProfile {
  user_id: string;
  name: string;
  xp: number;
  streak: number;
  last_active: string;
  subjects: string[];
  class_grade: string;
  course_type: string;
  board: string;
}

export interface DocumentItem {
  id: string;
  user_id: string;
  filename: string;
  custom_name: string;
  subject: string;
  created_at: string;
  total_chunks?: number;
  file_size?: string;
}

export interface ChatMessage {
  id: string;
  role: 'student' | 'mentor';
  text: string;
  timestamp: string;
  sources?: string[];
  doc_id?: string | null;
  subject?: string;
  backendStatus?: {
    isLive: boolean;
    serverUrl: string;
    statusCode?: number;
    latencyMs?: number;
    errorNote?: string;
  };
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  topic?: string;
}

export interface FlashcardItem {
  id: string;
  question: string;
  answer: string;
  subject: string;
  topic: string;
  doc_id?: string;
  isFlipped?: boolean;
  difficulty?: 'again' | 'hard' | 'good' | 'easy';
}

export interface CareerRoadmapStep {
  step: number;
  stageName: string;
  timeframe: string;
  title: string;
  description: string;
  keyMilestones: string[];
}

export interface CareerMilestone {
  id: string;
  subject: string;
  academicConcept: string;
  indianJobRole: string;
  industryDomain: string;
  organizationExamples: string[];
  salaryRange: string;
  keySkills: string[];
  premierColleges: string[];
  practicalApplication: string;
  domainTrack?: string;
  targetExams?: string[];
  ncertChapters?: string[];
  roadmapSteps?: CareerRoadmapStep[];
}

export interface ConceptNode {
  id: string;
  name: string;
  type: 'subject' | 'chapter' | 'concept';
  subject: string;
  doc_id?: string;
  description: string;
  keyFormulas?: string[];
  connectionsCount?: number;
  val?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface ConceptLink {
  source: string | ConceptNode;
  target: string | ConceptNode;
  relation: string;
  isCrossSubject?: boolean;
}

export type ActivityType =
  | 'study_session'
  | 'quiz_completed'
  | 'topic_mastered'
  | 'flashcard_review'
  | 'document_ingested';

export interface ActivityLogItem {
  id: string;
  type: ActivityType;
  title: string;
  subject: string;
  timestamp: string;
  duration?: string;
  xpEarned: number;
  score?: string;
  details: string;
  topicTag?: string;
}

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface ScheduledSession {
  id: string;
  docId: string;
  chapterTitle: string;
  subject: string;
  dayOfWeek: DayOfWeek;
  timeSlot: TimeSlot;
  durationMinutes: number;
  isCompleted: boolean;
  notes?: string;
}

export type BadgeCategory = 'xp' | 'streak' | 'subject' | 'activity' | 'mastery';

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  category: BadgeCategory;
  iconName: string;
  colorScheme: 'gold' | 'emerald' | 'amber' | 'terracotta' | 'indigo' | 'purple';
  requirement: string;
  xpReward: number;
  targetProgress: number;
  unit: string;
  unlockedAt?: string;
}
