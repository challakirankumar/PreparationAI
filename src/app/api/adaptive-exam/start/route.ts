import { NextResponse } from 'next/server';
import { startAdaptiveSession } from '@/lib/exams/adaptive-session';
import { getEduScope } from '@/lib/ai-guards/eduscope';
import { getPattern } from '@/lib/exams/patterns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface StartRequestBody {
  examId: string;
  userId?: string;
  maxItems?: number;
  minItems?: number;
  seThreshold?: number;
  seenSignatures?: string[];
}

export async function POST(request: Request) {
  let body: StartRequestBody;
  try {
    body = (await request.json()) as StartRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.examId) {
    return NextResponse.json({ error: 'examId is required' }, { status: 400 });
  }

  const pattern = getPattern(body.examId);
  if (!pattern) {
    return NextResponse.json({ error: `Unknown exam: ${body.examId}` }, { status: 404 });
  }

  // EduScope audit (this is a non-AI endpoint, but we still log it for the audit trail)
  getEduScope().evaluate({
    userPrompt: `Start adaptive exam: ${body.examId}`,
    context: { agent: 'mock-generator', userId: body.userId },
  });

  try {
    const seenSet = body.seenSignatures ? new Set(body.seenSignatures) : undefined;
    const session = startAdaptiveSession({
      examId: body.examId,
      userId: body.userId,
      maxItems: body.maxItems ?? 20,
      minItems: body.minItems ?? 8,
      seThreshold: body.seThreshold ?? 0.4,
      seenSignatures: seenSet,
    });

    // Get the first question
    const next = getNextQuestionFromSession(session);
    if (next.terminated) {
      return NextResponse.json({
        error: 'Could not generate any items for this exam',
        sessionId: session.sessionId,
        terminated: true,
      }, { status: 500 });
    }

    return NextResponse.json({
      sessionId: session.sessionId,
      examId: session.examId,
      examName: session.examName,
      totalPoolSize: session.itemPool.length,
      maxItems: session.maxItems,
      minItems: session.minItems,
      seThreshold: session.seTerminationThreshold,
      question: next.question,
      irtItem: sanitizeIrtItem(next.irtItem),
      currentTheta: session.currentTheta,
      currentSE: session.currentSE,
      phase: session.phase,
      itemsPresented: session.presentedItems.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || 'Failed to start adaptive session' },
      { status: 500 }
    );
  }
}

// Local helper imports
import { getNextQuestion } from '@/lib/exams/adaptive-session';
import type { IrtItem } from '@/lib/exams/irt';

function getNextQuestionFromSession(session: ReturnType<typeof startAdaptiveSession>) {
  return getNextQuestion(session);
}

function sanitizeIrtItem(item: IrtItem | null) {
  if (!item) return null;
  // Return IRT params to the client (useful for the UI to show difficulty)
  return {
    itemId: item.itemId,
    subject: item.subject,
    topic: item.topic,
    difficulty: item.difficulty,
    b: item.b,
    a: item.a,
    c: item.c,
    marks: item.marks,
    negativeMarks: item.negativeMarks,
  };
}
