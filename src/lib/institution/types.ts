// ============================================================================
// Institutional / B2B Layer — Types
// ----------------------------------------------------------------------------
// Coaching institutes deploy Preparation AI for batches of students. Teachers
// get a dashboard showing cohort performance, weak topics, and individual
// student drills. Institute admins can manage batches, invite teachers, and
// view cross-cohort analytics.
// ============================================================================

export type InstitutionRole = 'admin' | 'teacher' | 'student';

export type CohortTier = 'foundation' | 'basic' | 'advanced' | 'crash' | 'test-series';

export interface Institution {
  id: string;
  name: string;
  slug: string;
  city?: string;
  country?: string;
  establishedYear?: number;
  primaryExams: string[]; // e.g. ['jee-main', 'neet']
  logoUrl?: string;
  adminUserId: string;
  createdAt: string;
}

export interface Batch {
  id: string;
  institutionId: string;
  name: string;          // e.g. "JEE 2026 Riser Batch A"
  cohortTier: CohortTier;
  targetExam: string;    // exam id
  startDate: string;
  endDate: string;
  teacherIds: string[];  // User ids of teachers assigned to this batch
  studentIds: string[];   // User ids of students enrolled
  capacity: number;
  createdAt: string;
}

export interface Teacher {
  id: string;            // == User.id
  institutionId: string;
  displayName: string;
  email: string;
  subjects: string[];    // ['Physics', 'Chemistry']
  batchIds: string[];
  joinedAt: string;
}

export interface BatchAssignment {
  id: string;
  batchId: string;
  teacherId: string;
  title: string;
  description: string;
  type: 'mock' | 'practice' | 'dpp' | 'revision'; // DPP = Daily Practice Problem
  examId?: string;
  dueDate: string;
  studentIds: string[]; // empty => all batch students
  createdAt: string;
}

export interface CohortMetrics {
  batchId: string;
  batchName: string;
  totalStudents: number;
  activeStudents: number;       // took >=1 mock in last 7 days
  avgScorePct: number;          // 0-100
  avgAccuracy: number;          // 0-100
  avgTimePerQuestionSec: number;
  totalMocksTaken: number;
  // Aggregated weak topics across the cohort (top 5 by frequency)
  topWeakTopics: { topic: string; subject: string; affectedStudents: number }[];
  // Engagement trend (last 7 days, 0=Sun)
  engagementTrend: { date: string; mocksTaken: number; activeStudents: number }[];
  // Score distribution buckets
  scoreDistribution: { bucket: string; count: number }[];
  // Top performers
  topPerformers: { studentId: string; studentName: string; avgScorePct: number; mocksTaken: number }[];
  // At-risk students (avg score < 35% OR mocks taken < 2)
  atRiskStudents: { studentId: string; studentName: string; avgScorePct: number; mocksTaken: number; reason: string }[];
}

export interface InstitutionSummary {
  institution: Institution;
  totalBatches: number;
  totalStudents: number;
  totalTeachers: number;
  totalMocksTaken: number;
  avgScorePct: number;
  // Per-batch mini-stats (used in institute admin dashboard)
  batchSummaries: {
    batchId: string;
    batchName: string;
    cohortTier: CohortTier;
    studentCount: number;
    avgScorePct: number;
    activeStudents: number;
  }[];
}
