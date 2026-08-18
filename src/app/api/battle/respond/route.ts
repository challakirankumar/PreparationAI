import { NextResponse } from 'next/server';
import { submitAnswer } from '@/lib/battle/battle-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RespondRequest {
  battleId: string;
  questionId: string;
  answer: 'unanswered' | number | number[];
  timeTakenMs: number;
}

export async function POST(request: Request) {
  let body: RespondRequest;
  try {
    body = (await request.json()) as RespondRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body.battleId || !body.questionId) {
    return NextResponse.json({ error: 'battleId and questionId are required' }, { status: 400 });
  }

  try {
    const result = submitAnswer({
      battleId: body.battleId,
      questionId: body.questionId,
      answer: body.answer,
      timeTakenMs: body.timeTakenMs,
    });
    return NextResponse.json({
      correct: result.correct,
      pointsEarned: result.pointsEarned,
      opponentCorrect: result.opponentCorrect,
      opponentPointsEarned: result.opponentPointsEarned,
      opponentTimeMs: result.battle.questions[result.currentQuestionIndex - 1]?.playerBResponse?.timeTakenMs ?? 0,
      scoreA: result.scoreA,
      scoreB: result.scoreB,
      currentQuestionIndex: result.currentQuestionIndex,
      nextQuestion: result.nextQuestion,
      battleEnded: result.battleEnded,
      winner: result.winner,
      ratingChangeA: result.battle.ratingChangeA,
      xpAwardedA: result.battle.xpAwardedA,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
