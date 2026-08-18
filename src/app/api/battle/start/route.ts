import { NextResponse } from 'next/server';
import { startBattle } from '@/lib/battle/battle-manager';
import { getEduScope } from '@/lib/ai-guards/eduscope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface StartRequest {
  examId: string;
  userId: string;
  displayName: string;
  mode?: 'solo-bot' | 'async-duel';
  questionCount?: number;
  timePerQuestionSec?: number;
}

export async function POST(request: Request) {
  let body: StartRequest;
  try {
    body = (await request.json()) as StartRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body.examId || !body.userId || !body.displayName) {
    return NextResponse.json({ error: 'examId, userId, displayName are required' }, { status: 400 });
  }

  // EduScope audit (battle mode doesn't call LLM, but we still log for completeness)
  getEduScope().evaluate({
    userPrompt: `Start battle: examId=${body.examId}, mode=${body.mode ?? 'solo-bot'}`,
    context: { agent: 'mock-generator', userId: body.userId },
  });

  try {
    const battle = startBattle({
      mode: body.mode ?? 'solo-bot',
      examId: body.examId,
      userId: body.userId,
      displayName: body.displayName,
      questionCount: body.questionCount ?? 10,
      timePerQuestionSec: body.timePerQuestionSec ?? 30,
    });
    // Return only the first question + non-sensitive state to the client
    const firstQuestion = battle.questions[0]?.question ?? null;
    return NextResponse.json({
      battleId: battle.id,
      mode: battle.mode,
      examId: battle.examId,
      examName: battle.examName,
      status: battle.status,
      playerA: {
        userId: battle.playerA.userId,
        displayName: battle.playerA.displayName,
        rating: battle.playerA.rating,
      },
      playerB: {
        userId: battle.playerB.userId,
        displayName: battle.playerB.displayName,
        rating: battle.playerB.rating,
        isBot: battle.playerB.isBot,
        avatarEmoji: battle.playerB.isBot ? (battle.playerB as any).displayName : undefined,
      },
      questionCount: battle.questionCount,
      timePerQuestionSec: battle.timePerQuestionSec,
      totalDurationSec: battle.totalDurationSec,
      startedAt: battle.startedAt,
      currentQuestionIndex: 0,
      currentQuestion: firstQuestion,
      playerAScore: 0,
      playerBScore: battle.playerBScore, // bot's pre-computed total (we reveal per-question as player progresses)
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
