import { NextResponse } from 'next/server';
import { getBattle } from '@/lib/battle/battle-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/battle/finish?battleId=...
 * Returns the final battle state + per-question breakdown
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const battleId = url.searchParams.get('battleId');
  if (!battleId) {
    return NextResponse.json({ error: 'battleId is required' }, { status: 400 });
  }
  const battle = getBattle(battleId);
  if (!battle) {
    return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
  }
  // Strip the actual question objects' correctOptions? No — keep them so the UI can show them.
  return NextResponse.json({
    battleId: battle.id,
    status: battle.status,
    mode: battle.mode,
    examName: battle.examName,
    playerA: battle.playerA,
    playerB: battle.playerB,
    questionCount: battle.questionCount,
    startedAt: battle.startedAt,
    endedAt: battle.endedAt,
    winner: battle.winner,
    playerAScore: battle.playerAScore,
    playerBScore: battle.playerBScore,
    xpAwardedA: battle.xpAwardedA,
    xpAwardedB: battle.xpAwardedB,
    ratingChangeA: battle.ratingChangeA,
    ratingChangeB: battle.ratingChangeB,
    questions: battle.questions.map(bq => ({
      index: bq.index,
      questionId: bq.question.id,
      questionText: bq.question.text,
      subject: bq.question.subject,
      topic: bq.question.topic,
      difficulty: bq.question.difficulty,
      correctOptions: bq.question.correctOptions,
      options: bq.question.options,
      playerAResponse: bq.playerAResponse,
      playerBResponse: bq.playerBResponse,
    })),
  });
}
