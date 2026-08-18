import { NextResponse } from 'next/server';
import { getSession, endSession } from '@/lib/exams/adaptive-session';
import { computeFinalScore } from '@/lib/exams/irt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface FinishRequestBody {
  sessionId: string;
  manual?: boolean; // true when user clicked "End Exam"
}

export async function POST(request: Request) {
  let body: FinishRequestBody;
  try {
    body = (await request.json()) as FinishRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  // If manual end, mark the session as terminated
  if (body.manual) {
    endSession(body.sessionId, 'Manually ended by user');
  }

  const session = getSession(body.sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const finalScore = computeFinalScore(session);

  return NextResponse.json({
    sessionId: session.sessionId,
    examId: session.examId,
    examName: session.examName,
    terminated: session.terminated,
    terminationReason: session.terminationReason,
    finalScore,
  });
}
