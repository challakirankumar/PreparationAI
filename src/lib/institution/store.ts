// ============================================================================
// Institution store — in-memory + persisted via globalThis (survives HMR).
// In production, swap to Prisma-backed routes (see /api/institution/*).
// ----------------------------------------------------------------------------

import type {
  Institution,
  Batch,
  Teacher,
  BatchAssignment,
} from './types';
import type { ExamAttempt, User } from '@/lib/types';

// ---------------------------------------------------------------------------
// Seed data — one demo institution with two batches
// ---------------------------------------------------------------------------

const NOW = new Date().toISOString();
const ISO_FUTURE = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const SEED_INSTITUTION: Institution = {
  id: 'inst_demo001',
  name: 'VidyaMandir Excellence Academy',
  slug: 'vidyamandir',
  city: 'Bengaluru',
  country: 'India',
  establishedYear: 2008,
  primaryExams: ['jee-main', 'neet'],
  adminUserId: 'inst_admin_demo',
  createdAt: NOW,
};

const SEED_BATCHES: Batch[] = [
  {
    id: 'batch_jee2026a',
    institutionId: 'inst_demo001',
    name: 'JEE 2026 Riser — Batch A',
    cohortTier: 'advanced',
    targetExam: 'jee-main',
    startDate: ISO_FUTURE(-30),
    endDate: ISO_FUTURE(180),
    teacherIds: ['teacher_demo_01'],
    studentIds: [],
    capacity: 60,
    createdAt: NOW,
  },
  {
    id: 'batch_neet2026b',
    institutionId: 'inst_demo001',
    name: 'NEET 2026 Foundation — Batch B',
    cohortTier: 'foundation',
    targetExam: 'neet',
    startDate: ISO_FUTURE(-15),
    endDate: ISO_FUTURE(280),
    teacherIds: ['teacher_demo_01'],
    studentIds: [],
    capacity: 50,
    createdAt: NOW,
  },
];

const SEED_TEACHERS: Teacher[] = [
  {
    id: 'teacher_demo_01',
    institutionId: 'inst_demo001',
    displayName: 'Prof. Anjali Deshpande',
    email: 'anjali.d@vidyamandir.edu',
    subjects: ['Physics', 'Chemistry'],
    batchIds: ['batch_jee2026a', 'batch_neet2026b'],
    joinedAt: NOW,
  },
];

const SEED_ASSIGNMENTS: BatchAssignment[] = [
  {
    id: 'asg_demo01',
    batchId: 'batch_jee2026a',
    teacherId: 'teacher_demo_01',
    title: 'Kinematics — DPP Set 3',
    description: '10 problems on uniformly accelerated motion and graphs. Submit by Sunday 11 PM.',
    type: 'dpp',
    examId: 'jee-main',
    dueDate: ISO_FUTURE(3),
    studentIds: [],
    createdAt: NOW,
  },
  {
    id: 'asg_demo02',
    batchId: 'batch_jee2026a',
    teacherId: 'teacher_demo_01',
    title: 'Rotational Motion — Full Mock',
    description: '30-question section test mirroring JEE Main pattern. Auto-evaluated.',
    type: 'mock',
    examId: 'jee-main',
    dueDate: ISO_FUTURE(7),
    studentIds: [],
    createdAt: NOW,
  },
  {
    id: 'asg_demo03',
    batchId: 'batch_neet2026b',
    teacherId: 'teacher_demo_01',
    title: 'Cell Biology — Practice Set',
    description: '20 NEET-style MCQs on cell structure and organelles.',
    type: 'practice',
    examId: 'neet',
    dueDate: ISO_FUTURE(5),
    studentIds: [],
    createdAt: NOW,
  },
];

// ---------------------------------------------------------------------------
// Persisted store
// ---------------------------------------------------------------------------

interface InstitutionStore {
  institutions: Institution[];
  batches: Batch[];
  teachers: Teacher[];
  assignments: BatchAssignment[];
  /** Map of studentUserId -> batchId[] */
  studentBatchEnrolment: Record<string, string[]>;
}

declare global {
  // eslint-disable-next-line no-var
  var __institution_store__: InstitutionStore | undefined;
}

function getStore(): InstitutionStore {
  if (!globalThis.__institution_store__) {
    globalThis.__institution_store__ = {
      institutions: [SEED_INSTITUTION],
      batches: [...SEED_BATCHES],
      teachers: [...SEED_TEACHERS],
      assignments: [...SEED_ASSIGNMENTS],
      studentBatchEnrolment: {},
    };
  }
  return globalThis.__institution_store__;
}

// ---------------------------------------------------------------------------
// Public read API
// ---------------------------------------------------------------------------

export function listInstitutions(): Institution[] {
  return getStore().institutions;
}

export function getInstitution(id: string): Institution | undefined {
  return getStore().institutions.find(i => i.id === id);
}

export function getInstitutionBySlug(slug: string): Institution | undefined {
  return getStore().institutions.find(i => i.slug === slug);
}

export function listBatches(institutionId: string): Batch[] {
  return getStore().batches.filter(b => b.institutionId === institutionId);
}

export function getBatch(id: string): Batch | undefined {
  return getStore().batches.find(b => b.id === id);
}

export function listTeachers(institutionId: string): Teacher[] {
  return getStore().teachers.filter(t => t.institutionId === institutionId);
}

export function getTeacherByUserId(userId: string): Teacher | undefined {
  return getStore().teachers.find(t => t.id === userId);
}

export function listAssignmentsForBatch(batchId: string): BatchAssignment[] {
  return getStore().assignments.filter(a => a.batchId === batchId);
}

export function listAssignmentsForTeacher(teacherId: string): BatchAssignment[] {
  return getStore().assignments.filter(a => a.teacherId === teacherId);
}

export function listBatchesForStudent(userId: string): Batch[] {
  const store = getStore();
  const batchIds = store.studentBatchEnrolment[userId] ?? [];
  return store.batches.filter(b => batchIds.includes(b.id));
}

export function listStudentsInBatch(batchId: string): string[] {
  const store = getStore();
  return Object.entries(store.studentBatchEnrolment)
    .filter(([, ids]) => ids.includes(batchId))
    .map(([userId]) => userId);
}

// ---------------------------------------------------------------------------
// Public write API
// ---------------------------------------------------------------------------

export function createBatch(input: Omit<Batch, 'id' | 'createdAt' | 'studentIds' | 'teacherIds'> & { teacherIds?: string[] }): Batch {
  const store = getStore();
  const batch: Batch = {
    ...input,
    id: `batch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    teacherIds: input.teacherIds ?? [],
    studentIds: [],
    createdAt: new Date().toISOString(),
  };
  store.batches.push(batch);
  return batch;
}

export function enrollStudentInBatch(userId: string, batchId: string): void {
  const store = getStore();
  const batch = store.batches.find(b => b.id === batchId);
  if (!batch) return;
  if (batch.studentIds.includes(userId)) return;
  if (batch.studentIds.length >= batch.capacity) return;
  batch.studentIds.push(userId);
  if (!store.studentBatchEnrolment[userId]) store.studentBatchEnrolment[userId] = [];
  if (!store.studentBatchEnrolment[userId].includes(batchId)) {
    store.studentBatchEnrolment[userId].push(batchId);
  }
}

export function unenrollStudentFromBatch(userId: string, batchId: string): void {
  const store = getStore();
  const batch = store.batches.find(b => b.id === batchId);
  if (!batch) return;
  batch.studentIds = batch.studentIds.filter(id => id !== userId);
  if (store.studentBatchEnrolment[userId]) {
    store.studentBatchEnrolment[userId] = store.studentBatchEnrolment[userId].filter(id => id !== batchId);
  }
}

export function createAssignment(input: Omit<BatchAssignment, 'id' | 'createdAt'>): BatchAssignment {
  const store = getStore();
  const assignment: BatchAssignment = {
    ...input,
    id: `asg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  store.assignments.push(assignment);
  return assignment;
}

export function addTeacher(teacher: Omit<Teacher, 'joinedAt'>): Teacher {
  const store = getStore();
  const t: Teacher = { ...teacher, joinedAt: new Date().toISOString() };
  store.teachers.push(t);
  // Also link to batches
  for (const batchId of t.batchIds) {
    const batch = store.batches.find(b => b.id === batchId);
    if (batch && !batch.teacherIds.includes(t.id)) batch.teacherIds.push(t.id);
  }
  return t;
}

// ---------------------------------------------------------------------------
// Cohort metrics computation — pulls ExamAttempt history from registeredUsers
// ---------------------------------------------------------------------------

import type { CohortMetrics, InstitutionSummary } from './types';
import { getPattern } from '@/lib/exams/patterns';

export function computeBatchMetrics(
  batchId: string,
  attemptsByStudent: Record<string, ExamAttempt[]>,
  usersById: Record<string, User>
): CohortMetrics | null {
  const batch = getBatch(batchId);
  if (!batch) return null;
  const studentIds = batch.studentIds;
  const totalStudents = studentIds.length;

  if (totalStudents === 0) {
    return {
      batchId,
      batchName: batch.name,
      totalStudents: 0,
      activeStudents: 0,
      avgScorePct: 0,
      avgAccuracy: 0,
      avgTimePerQuestionSec: 0,
      totalMocksTaken: 0,
      topWeakTopics: [],
      engagementTrend: [],
      scoreDistribution: [],
      topPerformers: [],
      atRiskStudents: [],
    };
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let activeStudents = 0;
  let totalScorePct = 0;
  let totalAccuracy = 0;
  let totalTimePerQ = 0;
  let totalMocksTaken = 0;
  let consideredStudents = 0;
  const topPerformers: CohortMetrics['topPerformers'] = [];
  const atRiskStudents: CohortMetrics['atRiskStudents'] = [];
  const weakTopicCounts: Record<string, { subject: string; count: number }> = {};

  // Engagement trend (last 7 days)
  const trend: { date: string; mocksTaken: number; activeStudents: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    trend.push({ date: d.toISOString().slice(0, 10), mocksTaken: 0, activeStudents: 0 });
  }
  const trendSet = new Set<string>(); // student ids who appeared in trend

  for (const sid of studentIds) {
    const attempts = attemptsByStudent[sid] ?? [];
    const user = usersById[sid];
    const studentName = user?.name ?? 'Unknown';
    if (attempts.length === 0) {
      atRiskStudents.push({
        studentId: sid,
        studentName,
        avgScorePct: 0,
        mocksTaken: 0,
        reason: 'No mocks attempted yet',
      });
      continue;
    }

    const recentAttempts = attempts.filter(a => new Date(a.submittedAt).getTime() >= weekAgo);
    if (recentAttempts.length > 0) activeStudents++;

    const avgScorePct = attempts.reduce((sum, a) => sum + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / attempts.length;
    const avgAccuracy = attempts.reduce((sum, a) => sum + a.accuracy, 0) / attempts.length;
    const avgTimePerQ = attempts.reduce((sum, a) => sum + a.avgTimePerQuestion, 0) / attempts.length;
    const pattern = getPattern(attempts[0]?.examId);
    const totalMarks = pattern?.totalMarks ?? 100;
    void totalMarks;

    totalScorePct += avgScorePct;
    totalAccuracy += avgAccuracy;
    totalTimePerQ += avgTimePerQ;
    totalMocksTaken += attempts.length;
    consideredStudents++;

    // Weak topics aggregation
    for (const a of attempts) {
      for (const t of a.weakTopics) {
        const key = `${t}|${a.subjectScores[0]?.subject ?? 'Unknown'}`;
        const [topic, subject] = key.split('|');
        if (!weakTopicCounts[topic]) weakTopicCounts[topic] = { subject: subject ?? 'Unknown', count: 0 };
        weakTopicCounts[topic].count++;
      }
    }

    // Trend aggregation
    for (const a of recentAttempts) {
      const dateStr = new Date(a.submittedAt).toISOString().slice(0, 10);
      const entry = trend.find(t => t.date === dateStr);
      if (entry) {
        entry.mocksTaken++;
        if (!trendSet.has(sid)) {
          trendSet.add(sid);
          entry.activeStudents++;
        }
      }
    }

    // Top performers / at-risk classification
    if (avgScorePct >= 60 && attempts.length >= 3) {
      topPerformers.push({ studentId: sid, studentName, avgScorePct: Math.round(avgScorePct), mocksTaken: attempts.length });
    } else if (avgScorePct < 35 || attempts.length < 2) {
      atRiskStudents.push({
        studentId: sid,
        studentName,
        avgScorePct: Math.round(avgScorePct),
        mocksTaken: attempts.length,
        reason: avgScorePct < 35 ? 'Low average score' : 'Insufficient mock practice',
      });
    }
  }

  // Score distribution buckets
  const buckets = [
    { bucket: '0-25%', count: 0 },
    { bucket: '25-50%', count: 0 },
    { bucket: '50-75%', count: 0 },
    { bucket: '75-100%', count: 0 },
  ];
  for (const sid of studentIds) {
    const attempts = attemptsByStudent[sid] ?? [];
    if (attempts.length === 0) continue;
    const avg = attempts.reduce((s, a) => s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / attempts.length;
    if (avg < 25) buckets[0].count++;
    else if (avg < 50) buckets[1].count++;
    else if (avg < 75) buckets[2].count++;
    else buckets[3].count++;
  }

  // Top weak topics (by frequency across cohort)
  const topWeakTopics = Object.entries(weakTopicCounts)
    .map(([topic, { subject, count }]) => ({ topic, subject, affectedStudents: count }))
    .sort((a, b) => b.affectedStudents - a.affectedStudents)
    .slice(0, 5);

  return {
    batchId,
    batchName: batch.name,
    totalStudents,
    activeStudents,
    avgScorePct: consideredStudents > 0 ? Math.round(totalScorePct / consideredStudents) : 0,
    avgAccuracy: consideredStudents > 0 ? Math.round(totalAccuracy / consideredStudents) : 0,
    avgTimePerQuestionSec: consideredStudents > 0 ? Math.round(totalTimePerQ / consideredStudents) : 0,
    totalMocksTaken,
    topWeakTopics,
    engagementTrend: trend,
    scoreDistribution: buckets,
    topPerformers: topPerformers.sort((a, b) => b.avgScorePct - a.avgScorePct).slice(0, 5),
    atRiskStudents,
  };
}

export function computeInstitutionSummary(
  institutionId: string,
  attemptsByStudent: Record<string, ExamAttempt[]>,
  usersById: Record<string, User>
): InstitutionSummary | null {
  const institution = getInstitution(institutionId);
  if (!institution) return null;
  const batches = listBatches(institutionId);
  const teachers = listTeachers(institutionId);
  let totalStudents = 0;
  let totalMocksTaken = 0;
  let totalScoreSum = 0;
  let consideredStudents = 0;
  const batchSummaries: InstitutionSummary['batchSummaries'] = [];

  for (const batch of batches) {
    totalStudents += batch.studentIds.length;
    const metrics = computeBatchMetrics(batch.id, attemptsByStudent, usersById);
    if (metrics) {
      batchSummaries.push({
        batchId: batch.id,
        batchName: batch.name,
        cohortTier: batch.cohortTier,
        studentCount: metrics.totalStudents,
        avgScorePct: metrics.avgScorePct,
        activeStudents: metrics.activeStudents,
      });
      totalMocksTaken += metrics.totalMocksTaken;
      totalScoreSum += metrics.avgScorePct * metrics.totalStudents;
      consideredStudents += metrics.totalStudents;
    }
  }

  return {
    institution,
    totalBatches: batches.length,
    totalStudents,
    totalTeachers: teachers.length,
    totalMocksTaken,
    avgScorePct: consideredStudents > 0 ? Math.round(totalScoreSum / consideredStudents) : 0,
    batchSummaries,
  };
}

// ---------------------------------------------------------------------------
// Demo enrolment helper — auto-enrol current user into a demo batch
// ---------------------------------------------------------------------------

export function autoEnrollDemoStudent(userId: string): void {
  const store = getStore();
  // Pick the first batch whose targetExam matches the user's examGoal
  // Otherwise just enrol in the first batch.
  void store;
}
