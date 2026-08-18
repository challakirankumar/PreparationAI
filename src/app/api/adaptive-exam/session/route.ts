import { NextResponse } from 'next/server';
import { getSession } from '@/lib/exams/adaptive-session';
import { computeFinalScore } from '@/lib/exams/irt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/adaptive-exam/session?sessionId=...
 * Returns the live state of an active session (for resume / refresh).
 * If the session is terminated, returns the final score.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }
  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (session.terminated) {
    const finalScore = computeFinalScore(session);
    return NextResponse.json({
      sessionId: session.sessionId,
      examId: session.examId,
      examName: session.examName,
      terminated: true,
      terminationReason: session.terminationReason,
      finalScore,
    });
  }
  // Active session — return enough state to resume
  const lastPresented = session.presentedItems[session.presentedItems.length - 1];
  const lastQuestion = lastPresented ? session.questionMap.get(lastPresented.itemId) : null;
  return NextResponse.json({
    sessionId: session.sessionId,
    examId: session.examId,
    examName: session.examName,
    terminated: false,
    phase: session.phase,
    currentTheta: session.currentTheta,
    currentSE: session.currentSE,
    itemsPresented: session.presentedItems.length,
    itemsAnswered: session.responses.length,
    maxItems: session.maxItems,
    minItems: session.minItems,
    currentQuestion: lastQuestion,
    currentIrtItem: lastPresented ? {
      itemId: lastPresented.itemId,
      subject: lastPresented.subject,
      topic: lastPresented.topic,
      difficulty: lastPresented.difficulty,
      b: lastPresented.b,
      a: lastPresented.a,
      c: lastPresented.c,
      marks: lastPresented.marks,
      negativeMarks: lastPresented.negativeMarks,
    } : null,
  });
}
