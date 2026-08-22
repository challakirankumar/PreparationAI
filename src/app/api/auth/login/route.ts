import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { User, ExamAttempt, ChatMessage } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ----------------------------------------------------------------------------
// POST /api/auth/login
// Body: { email, password }
// Returns the user, attempts, seenSignatures, and mentorMessages if the
// password matches. Used by the store to hydrate from the backend on login.
// ----------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').toLowerCase().trim();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }

    const row = await db.user.findUnique({
      where: { email },
      include: {
        attempts: { orderBy: { submittedAt: 'desc' } },
        mentorMessages: { orderBy: { createdAt: 'asc' } },
        seenSignatures: true,
      },
    });

    if (!row) {
      return NextResponse.json({ error: 'No account found with this email. Please sign up first.' }, { status: 404 });
    }
    if (row.passwordHash !== password) {
      return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
    }

    const user: User = {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? undefined,
      country: row.country ?? undefined,
      type: row.userType as User['type'],
      examGoal: row.examGoal,
      examGoals: safeParse<string[]>(row.examGoals, []),
      examDates: safeParse<Record<string, string>>(row.examDates, {}),
      examDate: row.examDate ?? '',
      targetScore: row.targetScore ?? undefined,
      avatar: row.avatar ?? undefined,
      darkMode: row.darkMode,
      emailVerified: row.emailVerified,
      joinedAt: row.joinedAt.toISOString(),
    };

    const attempts: ExamAttempt[] = row.attempts.map(deserializeAttempt);
    const mentorMessages: ChatMessage[] = row.mentorMessages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: m.createdAt.toISOString(),
    }));
    const seenSignatures: string[] = row.seenSignatures.map((s) => s.signature);

    return NextResponse.json({ user, attempts, seenSignatures, mentorMessages });
  } catch (e) {
    console.error('[auth/login]', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
function safeParse<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

function deserializeAttempt(a: any): ExamAttempt {
  return {
    id: a.id,
    examId: a.examId,
    examName: a.examName,
    startedAt: a.startedAt instanceof Date ? a.startedAt.toISOString() : String(a.startedAt),
    submittedAt: a.submittedAt instanceof Date ? a.submittedAt.toISOString() : String(a.submittedAt),
    durationSec: a.durationSec,
    score: a.score,
    totalMarks: a.totalMarks,
    percentile: a.percentile,
    rank: a.rank,
    accuracy: a.accuracy,
    speed: a.speed,
    avgTimePerQuestion: a.avgTimePerQuestion,
    readinessIndex: a.readinessIndex,
    attemptNumber: a.attemptNumber,
    answers: safeParse(a.answers, {}),
    subjectScores: safeParse(a.subjectScores, []),
    topicScores: safeParse(a.topicScores, []),
    results: safeParse(a.results, []),
    youtubeRecs: safeParse(a.youtubeRecs, []),
    weakTopics: safeParse(a.weakTopics, []),
    strongTopics: safeParse(a.strongTopics, []),
    behavior: a.behavior ? safeParse(a.behavior, undefined) : undefined,
  };
}
