// Core types for Preparation AI

export type View =
  | 'auth'
  | 'dashboard'
  | 'mock-exam'
  | 'analytics'
  | 'ai-agents'
  | 'explore'
  | 'mentor'
  | 'career'
  | 'university'
  | 'scholarship'
  | 'planner'
  | 'counsellor'
  | 'digital-twin'
  | 'success-simulator'
  | 'readiness'
  | 'rank-predictor'
  | 'university-predictor'
  | 'weakness-radar'
  | 'study-material'
  | 'settings'
  | 'guardrail'
  | 'institution'
  | 'teacher'
  | 'doubt-solver'
  | 'pyq-trends'
  | 'socratic-mentor'
  | 'handwritten-grader'
  | 'battle-arena'
  | 'error-journal'
  | 'parent-dashboard'
  | 'nudge-bot'
  | 'league'
  | 'voice-mentor'
  | 'rag-tutor';

export type UserType = 'school-11' | 'school-12' | 'ug' | 'grad';

export type ClockFace = 'digital' | 'analog';
export type ClockTheme = 'day' | 'dark';

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  type: UserType;
  examGoal: string;
  examGoals: string[];
  examDate: string;
  examDates?: Record<string, string>;
  targetScore?: number;
  joinedAt: string;
  phone?: string;
  avatar?: string;
  country?: string;
  institution?: string;            // school / college / university name
  darkMode?: boolean;
  // Clock widget preferences
  clockTimezone?: string;          // IANA timezone name (e.g. "Asia/Kolkata")
  clockFace?: ClockFace;           // "digital" | "analog"
  clockTheme?: ClockTheme;         // "day" | "dark"
  academicRecords?: AcademicRecord[];
}

export interface AcademicRecord {
  id: string;
  examName: string;
  institution?: string;
  subjects: { name: string; marks: number; maxMarks: number; grade?: string }[];
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  rank?: string;
  date: string;
  uploadedAt: string;
  aiAnalysis?: AcademicAnalysis;
}

export interface AcademicAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  subjectInsights: { subject: string; insight: string; recommendation: string }[];
  predictedReadiness: number;
  predictedScoreRange: string;
  studyPlan: { phase: string; duration: string; focus: string; tasks: string[] }[];
  recommendedResources: string[];
  generatedAt: string;
}

export type QuestionType = 'mcq' | 'msq' | 'numerical' | 'descriptive' | 'reading' | 'listening' | 'speaking' | 'writing';

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  passage?: string;
  mediaLabel?: string;
  options?: string[];
  correctOptions?: number[];
  correctNumeric?: number;
  tolerance?: number;
  answerKeys?: string[];
  marks: number;
  negativeMarks: number;
  unit?: string;
}

export type Question = BaseQuestion;

export interface QuestionMeta {
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negativeMarks: number;
}

export type GenFn = (m: QuestionMeta, usedTexts?: Set<string>) => Question;

export interface ExamSection {
  name: string;
  subject: string;
  questionCount: number;
  marksPerQuestion: number;
  negativeMarks: number;
}

export interface ExamPattern {
  id: string;
  name: string;
  fullName: string;
  category: 'school' | 'ug' | 'grad';
  totalQuestions: number;
  durationSec: number;
  totalMarks: number;
  marking: string;
  description: string;
  sections: ExamSection[];
  syllabus: { subject: string; topics: { topic: string; weight: number }[] }[];
  icon: string;
  color: string;
}

export interface GeneratedExam {
  id: string;
  examId: string;
  examName: string;
  durationSec: number;
  totalMarks: number;
  startedAt: string;
  questions: Question[];
  sections: { name: string; subject: string; questionIds: string[] }[];
}

export type AnswerValue =
  | { type: 'mcq'; optionIndex: number }
  | { type: 'msq'; optionIndices: number[] }
  | { type: 'numerical'; value: number }
  | { type: 'descriptive'; text: string }
  | { type: 'reading'; optionIndex: number }
  | { type: 'listening'; optionIndex: number }
  | { type: 'speaking'; text: string }
  | { type: 'writing'; text: string }
  | { type: 'unanswered' };

export interface QuestionResult {
  questionId: string;
  subject: string;
  topic: string;
  difficulty: string;
  correct: boolean;
  partial: boolean;
  awardedMarks: number;
  timeTakenSec: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface SubjectScore {
  subject: string;
  total: number;
  scored: number;
  correct: number;
  wrong: number;
  unattempted: number;
  accuracy: number;
}

export interface TopicScore {
  subject: string;
  topic: string;
  total: number;
  scored: number;
  correct: number;
  accuracy: number;
}

export interface YoutubeRec {
  topic: string;
  videoId: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  searchUrl: string;
}

export interface BehaviorAnalysis {
  avgTimeBySubject: { subject: string; avgSec: number }[];
  speedProgression: { decile: number; avgSec: number }[];
  idleTimeSec: number;
  idlePauses: number;
  startedAtHour: number;
  timeOfDay: 'Early Morning' | 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  paceTrend: 'speeding-up' | 'slowing-down' | 'steady';
  difficultyTimeGap: number;
  rapidGuesses: number;
  answerChanges: number;
  vsPrevious?: {
    scoreDelta: number;
    speedDelta: number;
    accuracyDelta: number;
    isImprovement: boolean;
  };
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examName: string;
  startedAt: string;
  submittedAt: string;
  durationSec: number;
  answers: Record<string, AnswerValue>;
  score: number;
  totalMarks: number;
  percentile: number;
  rank: number;
  subjectScores: SubjectScore[];
  topicScores: TopicScore[];
  accuracy: number;
  speed: number;
  avgTimePerQuestion: number;
  weakTopics: string[];
  strongTopics: string[];
  results: QuestionResult[];
  youtubeRecs: YoutubeRec[];
  readinessIndex: number;
  attemptNumber?: number;
  behavior?: BehaviorAnalysis;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface DailyPlan {
  date: string;
  tasks: { id: string; title: string; type: 'mock' | 'revision' | 'study' | 'practice'; duration: string; done: boolean }[];
  mockScheduled: boolean;
  motivationalQuote: string;
  studyHoursTarget: number;
}

export interface Course {
  id: string;
  name: string;
  category: string;
  overview: string;
  futureScope: string;
  averageSalary: string;
  demandForecast: string;
  industryGrowth: string;
  skillRequirements: string[];
  workLifeBalance: string;
  careerProgression: string;
  topRecruiters: string[];
  icon: string;
}

export interface University {
  id: string;
  name: string;
  country: string;
  ranking: number;
  acceptanceRate: string;
  tuitionFees: string;
  scholarships: string[];
  livingCost: string;
  accommodation: string;
  visaDetails: string;
  employmentRate: string;
  popularCourses: string[];
}

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  amount: string;
  eligibility: string;
  deadline: string;
  countries: string[];
  level: string;
  link: string;
}

export interface StudyPlan {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'revision' | 'mock' | 'priority';
  title: string;
  description: string;
  blocks: { time: string; task: string; subject: string; duration: string }[];
  aiGenerated?: boolean;
}

// ============================================================================
// AI PROCTORING TYPES — based on NTA's Unfair Means (UFM) taxonomy
// ============================================================================

export type ProctoringEventType =
  | 'face_absent'
  | 'multiple_faces_detected'
  | 'gaze_away_sustained'
  | 'prohibited_object_suspected'
  | 'audio_anomaly'
  | 'tab_switch'
  | 'fullscreen_exited'
  | 'input_restriction_bypass_attempt'
  | 'devtools_suspected'
  | 'multi_monitor_detected'
  | 'identity_mismatch_at_start'
  | 'identity_mismatch_midexam'
  | 'session_abandoned'
  | 'connection_gap';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type SessionStatus = 'pending' | 'active' | 'completed' | 'terminated';

export type VerdictTier = 'clean' | 'minor_flags' | 'flagged_for_review' | 'simulated_invalid';

// NTA UFM category mapping
export type UFACategory =
  | 'Candidate Conduct — Attention'
  | 'Communication / Assistance'
  | 'Identity Verification'
  | 'Prohibited Items'
  | 'Exam Environment Integrity'
  | 'Session Continuity';

export interface ProctoringEvent {
  id: string;
  sessionId: string;
  eventType: ProctoringEventType;
  severity: Severity;
  confidenceScore: number; // 0-1
  timestamp: number; // ms into exam
  metadata?: Record<string, unknown>;
  evidenceSnapshotUrl?: string;
}

export interface ProctoringSession {
  id: string;
  mockAttemptId?: string;
  userId: string;
  examType: string;
  status: SessionStatus;
  startedAt: string;
  endedAt?: string;
  consentGivenAt?: string;
  referenceSelfieUrl?: string;
  proctoringDegraded: boolean;
  cameraEnabled: boolean;
  micEnabled: boolean;
}

export interface ProctoringProfile {
  examType: string;
  version: number;
  modules: {
    facePresence: { enabled: boolean; thresholdSec: number; severity: Severity };
    multipleFaces: { enabled: boolean; severity: Severity };
    gazeAway: { enabled: boolean; thresholdSec: number; severity: Severity };
    objectDetection: { enabled: boolean; severity: Severity };
    audioAnomaly: { enabled: boolean; severity: Severity };
    browserLockdown: { enabled: boolean; severity: Severity };
    identityVerification: { enabled: boolean; severity: Severity };
  };
  scoring: {
    lowDeduction: number;
    mediumDeduction: number;
    highDeduction: number;
    criticalDeduction: number;
    lowCategoryCap: number; // max total deduction from any single low-severity category
  };
}

export interface CategoryBreakdown {
  category: UFACategory;
  eventCount: number;
  maxSeverity: Severity;
  totalDeduction: number;
  events: ProctoringEvent[];
}

export interface SessionVerdict {
  sessionId: string;
  integrityScore: number; // 0-100
  verdictTier: VerdictTier;
  categoryBreakdown: CategoryBreakdown[];
  totalEvents: number;
  computedAt: string;
}

export interface ConsentRecord {
  userId: string;
  consentType: 'camera' | 'mic' | 'guardian_approval';
  grantedAt: string;
  revokedAt?: string;
  guardianUserId?: string;
}

export interface IntegrityReport {
  session: ProctoringSession;
  verdict: SessionVerdict;
  disclaimer: string;
  coachingText: string;
  evidenceTimeline: {
    timestamp: number;
    formattedTime: string;
    eventType: ProctoringEventType;
    category: UFACategory;
    severity: Severity;
    description: string;
    evidenceUrl?: string;
  }[];
}
