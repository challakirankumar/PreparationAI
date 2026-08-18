import { NextResponse } from 'next/server';
import {
  authenticateParent,
  getParent,
  getLinkedStudents,
  buildStudentSnapshot,
  buildWeeklyDigest,
  createParentAccount,
  type SnapshotInput,
} from '@/lib/parent/store';
import type { StudentSnapshot } from '@/lib/parent/types';
import type { ExamAttempt, AcademicRecord, User } from '@/lib/types';
import { getEntries } from '@/lib/error-journal/store';
import { getEduScope } from '@/lib/ai-guards/eduscope';
import { useStore } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/parent/dashboard?parentId=...
 * Returns the parent's account info + linked students with full snapshots.
 *
 * NOTE: In production this would be authenticated via session token.
 * For dev: parentId is passed as a query param.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parentId = url.searchParams.get('parentId');
  if (!parentId) {
    return NextResponse.json({ error: 'parentId is required' }, { status: 400 });
  }
  const parent = getParent(parentId);
  if (!parent) {
    return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
  }

  // EduScope audit (read-only access — log for audit trail)
  getEduScope().evaluate({
    userPrompt: `Parent dashboard access by ${parent.displayName} (${parent.email})`,
    context: { agent: 'mock-generator', userId: parent.id },
  });

  // Build snapshots for each linked student
  const links = getLinkedStudents(parent.id);
  const studentSnapshots: { link: any; snapshot: StudentSnapshot }[] = [];

  for (const link of links) {
    // Look up student user + attempts from the global Zustand store
    // (in production this would come from the DB)
    const studentUser = lookupStudentUser(link.studentUserId);
    if (!studentUser) {
      // Demo student data for seeded IDs
      if (link.studentUserId.startsWith('student_demo')) {
        studentSnapshots.push(buildDemoSnapshot(link.studentUserId, parent));
      }
      continue;
    }
    const attempts = lookupStudentAttempts(link.studentUserId);
    const academicRecords = studentUser.academicRecords ?? [];
    const errorEntries = getEntries(link.studentUserId);
    const snapshot = buildStudentSnapshot({
      studentUser,
      attempts,
      academicRecords,
      errorEntries,
    });
    studentSnapshots.push({
      link,
      snapshot,
    });
  }

  return NextResponse.json({
    parent: {
      id: parent.id,
      displayName: parent.displayName,
      email: parent.email,
      phone: parent.phone,
      weeklyDigestEnabled: parent.weeklyDigestEnabled,
      digestDay: parent.digestDay,
      digestEmail: parent.digestEmail,
      createdAt: parent.createdAt,
      lastLoginAt: parent.lastLoginAt,
    },
    linkedStudents: studentSnapshots,
    pendingLinks: [], // pending links would be surfaced separately
  });
}

/**
 * POST /api/parent/dashboard
 * Body: { action: 'login' | 'signup', email, password, displayName? }
 * Authenticates a parent and returns the parent record (no session token in dev).
 */
export async function POST(request: Request) {
  let body: { action?: string; email?: string; password?: string; displayName?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.action || !body.email || !body.password) {
    return NextResponse.json({ error: 'action, email, password are required' }, { status: 400 });
  }

  getEduScope().evaluate({
    userPrompt: `Parent ${body.action} for ${body.email}`,
    context: { agent: 'mock-generator' },
  });

  if (body.action === 'login') {
    const parent = authenticateParent(body.email, body.password);
    if (!parent) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    return NextResponse.json({ parent });
  }
  if (body.action === 'signup') {
    if (!body.displayName) {
      return NextResponse.json({ error: 'displayName is required for signup' }, { status: 400 });
    }
    const parent = createParentAccount({
      displayName: body.displayName,
      email: body.email,
      password: body.password,
      phone: body.phone,
    });
    return NextResponse.json({ parent }, { status: 201 });
  }
  return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
}

// ---------------------------------------------------------------------------
// Helpers — look up student user/attempts from the Zustand store
// ---------------------------------------------------------------------------

function lookupStudentUser(studentUserId: string): User | null {
  try {
    // Use the same Zustand store that the client uses
    const store = useStore.getState();
    const registered = store.registeredUsers;
    for (const saved of Object.values(registered)) {
      if (saved.user?.id === studentUserId) {
        return saved.user;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function lookupStudentAttempts(studentUserId: string): ExamAttempt[] {
  try {
    const store = useStore.getState();
    const registered = store.registeredUsers;
    for (const saved of Object.values(registered)) {
      if (saved.user?.id === studentUserId) {
        return saved.attempts ?? [];
      }
    }
    return [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Demo snapshot builder — for seeded student_demo_1 / student_demo_2
// ---------------------------------------------------------------------------

function buildDemoSnapshot(studentId: string, parent: { displayName: string }) {
  const isDemo1 = studentId === 'student_demo_1';
  const now = new Date();
  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

  const demoUser: User = {
    id: studentId,
    name: isDemo1 ? 'Aarav Sharma' : 'Diya Sharma',
    email: isDemo1 ? 'aarav@demo.com' : 'diya@demo.com',
    emailVerified: true,
    type: 'school-12',
    examGoal: 'jee-main',
    examGoals: ['jee-main'],
    examDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
    examDates: { 'jee-main': new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString() },
    joinedAt: daysAgo(60),
    country: 'India',
  };

  // Generate demo attempts across last 8 weeks
  const demoAttempts: ExamAttempt[] = [];
  const baseScore = isDemo1 ? 55 : 60;
  for (let i = 0; i < 8; i++) {
    const submittedAt = daysAgo(i * 7 + 2);
    const score = baseScore + Math.round(Math.sin(i) * 8) + (i > 4 ? 5 : 0);
    demoAttempts.push({
      id: `attempt_demo_${studentId}_${i}`,
      examId: 'jee-main',
      examName: 'JEE Main',
      startedAt: new Date(new Date(submittedAt).getTime() - 60 * 60 * 1000).toISOString(),
      submittedAt,
      durationSec: 60 * 60,
      answers: {},
      score: Math.round((score / 100) * 300),
      totalMarks: 300,
      percentile: 85 + Math.round(Math.random() * 10),
      rank: 5000 + Math.round(Math.random() * 2000),
      subjectScores: [
        { subject: 'Physics', total: 100, scored: Math.round((score + 5) / 100 * 100), correct: 20, wrong: 5, unattempted: 5, accuracy: score + 5 },
        { subject: 'Chemistry', total: 100, scored: Math.round((score - 5) / 100 * 100), correct: 18, wrong: 7, unattempted: 5, accuracy: score - 5 },
        { subject: 'Mathematics', total: 100, scored: Math.round((score) / 100 * 100), correct: 19, wrong: 6, unattempted: 5, accuracy: score },
      ],
      topicScores: [
        { subject: 'Physics', topic: 'Rotational Motion', total: 5, scored: 3, correct: 3, accuracy: 60 },
        { subject: 'Physics', topic: 'Kinematics', total: 5, scored: 4, correct: 4, accuracy: 80 },
        { subject: 'Chemistry', topic: 'Organic Basics', total: 5, scored: 2, correct: 2, accuracy: 40 },
      ],
      accuracy: score,
      speed: 2,
      avgTimePerQuestion: 90,
      weakTopics: ['Rotational Motion', 'Organic Basics'],
      strongTopics: ['Kinematics'],
      results: [],
      youtubeRecs: [],
      readinessIndex: score * 10,
      attemptNumber: i + 1,
    });
  }

  const errorEntries = isDemo1 ? [
    { id: 'e1', userId: studentId, source: 'mock-exam' as const, examId: 'jee-main', subject: 'Physics', topic: 'Rotational Motion', difficulty: 'hard' as const, questionText: 'A solid sphere rolls without slipping...', questionId: 'q1', timeTakenSec: 25, rootCause: 'conceptual' as const, rootCauseConfidence: 0.75, rootCauseEvidence: 'distractor', timestamp: daysAgo(3), ingestedAt: daysAgo(3), reviewed: false, resolved: false },
    { id: 'e2', userId: studentId, source: 'mock-exam' as const, examId: 'jee-main', subject: 'Chemistry', topic: 'Organic Basics', difficulty: 'medium' as const, questionText: 'Which carbocation is most stable?', questionId: 'q2', timeTakenSec: 18, rootCause: 'conceptual' as const, rootCauseConfidence: 0.7, rootCauseEvidence: 'opposite', timestamp: daysAgo(5), ingestedAt: daysAgo(5), reviewed: false, resolved: false },
  ] : [];

  const snapshot = buildStudentSnapshot({
    studentUser: demoUser,
    attempts: demoAttempts,
    academicRecords: [],
    errorEntries,
  });

  return { link: { parentUserId: parent.displayName, studentUserId: studentId, relationship: 'parent' as const, approvalStatus: 'approved' as const, approvedAt: daysAgo(50), createdAt: daysAgo(55), invitationMethod: 'email' as const }, snapshot };
}
