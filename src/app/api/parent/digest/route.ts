import { NextResponse } from 'next/server';
import { getParent, buildWeeklyDigest, buildStudentSnapshot, getLinkedStudents } from '@/lib/parent/store';
import { getEntries } from '@/lib/error-journal/store';
import { getEduScope } from '@/lib/ai-guards/eduscope';
import type { ExamAttempt, User } from '@/lib/types';
import { useStore } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/parent/digest?parentId=...&studentId=...
 * Returns the weekly digest for a specific student.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parentId = url.searchParams.get('parentId');
  const studentId = url.searchParams.get('studentId');

  if (!parentId || !studentId) {
    return NextResponse.json({ error: 'parentId and studentId are required' }, { status: 400 });
  }

  const parent = getParent(parentId);
  if (!parent) {
    return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
  }

  // Verify the parent is linked to this student
  const links = getLinkedStudents(parentId);
  const isLinked = links.some(l => l.studentUserId === studentId);
  if (!isLinked) {
    return NextResponse.json({ error: 'Parent is not linked to this student' }, { status: 403 });
  }

  getEduScope().evaluate({
    userPrompt: `Weekly digest generation for student ${studentId}`,
    context: { agent: 'mock-generator', userId: parentId },
  });

  // Build snapshot
  const studentUser = lookupStudentUser(studentId) ?? getDemoStudent(studentId);
  if (!studentUser) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }
  const attempts = lookupStudentAttempts(studentId) ?? getDemoAttempts(studentId);
  const errorEntries = studentId.startsWith('student_demo') ? getDemoErrors(studentId) : getEntries(studentId);

  const snapshot = buildStudentSnapshot({
    studentUser,
    attempts,
    academicRecords: studentUser.academicRecords ?? [],
    errorEntries,
  });

  const digest = buildWeeklyDigest(parent, snapshot);
  return NextResponse.json({ digest, snapshot });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function lookupStudentUser(studentUserId: string): User | null {
  try {
    const store = useStore.getState();
    for (const saved of Object.values(store.registeredUsers)) {
      if (saved.user?.id === studentUserId) {
        return saved.user;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function lookupStudentAttempts(studentUserId: string): ExamAttempt[] | null {
  try {
    const store = useStore.getState();
    for (const saved of Object.values(store.registeredUsers)) {
      if (saved.user?.id === studentUserId) {
        return saved.attempts ?? [];
      }
    }
    return null;
  } catch {
    return null;
  }
}

function getDemoStudent(studentId: string): User | null {
  if (!studentId.startsWith('student_demo')) return null;
  const isDemo1 = studentId === 'student_demo_1';
  return {
    id: studentId,
    name: isDemo1 ? 'Aarav Sharma' : 'Diya Sharma',
    email: isDemo1 ? 'aarav@demo.com' : 'diya@demo.com',
    emailVerified: true,
    type: 'school-12',
    examGoal: 'jee-main',
    examGoals: ['jee-main'],
    examDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
    examDates: { 'jee-main': new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString() },
    joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    country: 'India',
  };
}

function getDemoAttempts(studentId: string): ExamAttempt[] {
  const isDemo1 = studentId === 'student_demo_1';
  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
  const baseScore = isDemo1 ? 55 : 60;
  const attempts: ExamAttempt[] = [];
  for (let i = 0; i < 8; i++) {
    const submittedAt = daysAgo(i * 7 + 2);
    const score = baseScore + Math.round(Math.sin(i) * 8) + (i > 4 ? 5 : 0);
    attempts.push({
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
  return attempts;
}

function getDemoErrors(studentId: string): any[] {
  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
  return [
    { id: 'e1', userId: studentId, source: 'mock-exam', examId: 'jee-main', subject: 'Physics', topic: 'Rotational Motion', difficulty: 'hard', questionText: 'A solid sphere rolls without slipping...', questionId: 'q1', timeTakenSec: 25, rootCause: 'conceptual', rootCauseConfidence: 0.75, rootCauseEvidence: 'distractor', timestamp: daysAgo(3), ingestedAt: daysAgo(3), reviewed: false, resolved: false },
    { id: 'e2', userId: studentId, source: 'mock-exam', examId: 'jee-main', subject: 'Chemistry', topic: 'Organic Basics', difficulty: 'medium', questionText: 'Which carbocation is most stable?', questionId: 'q2', timeTakenSec: 18, rootCause: 'conceptual', rootCauseConfidence: 0.7, rootCauseEvidence: 'opposite', timestamp: daysAgo(5), ingestedAt: daysAgo(5), reviewed: false, resolved: false },
  ];
}
