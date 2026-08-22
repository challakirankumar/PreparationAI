import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { ExamAttempt } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ----------------------------------------------------------------------------
// POST /api/auth/attempts
// Body: { userId, attempt: ExamAttempt }
// Persists a single mock-exam attempt to the database. Called by the store
// after each submit. The attempt's nested objects (answers, results, etc.)
// are JSON-encoded into text columns to keep the schema migration-light.
// ----------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId: string = body.userId;
    const a: ExamAttempt = body.attempt;

    if (!userId || !a || !a.id) {
      return NextResponse.json({ error: 'userId and attempt.id are required' }, { status: 400 });
    }

    await db.examAttempt.upsert({
      where: { id: a.id },
      create: {
        id: a.id,
        userId,
        examId: a.examId,
        examName: a.examName,
        startedAt: new Date(a.startedAt),
        submittedAt: new Date(a.submittedAt),
        durationSec: a.durationSec,
        score: a.score,
        totalMarks: a.totalMarks,
        percentile: a.percentile,
        rank: a.rank,
        accuracy: a.accuracy,
        speed: a.speed,
        avgTimePerQuestion: a.avgTimePerQuestion,
        readinessIndex: a.readinessIndex,
        attemptNumber: a.attemptNumber ?? 1,
        answers: JSON.stringify(a.answers ?? {}),
        subjectScores: JSON.stringify(a.subjectScores ?? []),
        topicScores: JSON.stringify(a.topicScores ?? []),
        results: JSON.stringify(a.results ?? []),
        youtubeRecs: JSON.stringify(a.youtubeRecs ?? []),
        weakTopics: JSON.stringify(a.weakTopics ?? []),
        strongTopics: JSON.stringify(a.strongTopics ?? []),
        behavior: a.behavior ? JSON.stringify(a.behavior) : null,
      },
      update: {
        // The attempt is immutable after creation — re-submits with the same
        // id are no-ops. This protects against accidental overwrites.
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[auth/attempts]', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
