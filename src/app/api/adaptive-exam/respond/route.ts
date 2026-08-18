import { NextResponse } from 'next/server';
import { submitResponse, getSession } from '@/lib/exams/adaptive-session';
import type { AnswerValue, Question } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ---------------------------------------------------------------------------
// Evaluate a single answer against a Question's correctOptions / correctNumeric
// ---------------------------------------------------------------------------

function gradeAnswer(question: Question | undefined, answer: AnswerValue): { correct: boolean; attempted: boolean; partial?: number } {
  if (!question) {
    return { correct: false, attempted: false };
  }
  if (answer.type === 'unanswered') {
    return { correct: false, attempted: false };
  }

  switch (answer.type) {
    case 'mcq':
    case 'reading':
    case 'listening': {
      const correct = question.correctOptions?.includes(answer.optionIndex) ?? false;
      return { correct, attempted: true };
    }
    case 'msq': {
      const correctSet = new Set(question.correctOptions ?? []);
      const studentSet = new Set(answer.optionIndices);
      if (studentSet.size === 0) return { correct: false, attempted: false };
      // MSQ correct iff exact match
      const isCorrect = correctSet.size === studentSet.size &&
        [...studentSet].every(idx => correctSet.has(idx));
      // Partial credit: fraction of correct options selected minus fraction of wrong ones
      const correctSelected = [...studentSet].filter(idx => correctSet.has(idx)).length;
      const wrongSelected = studentSet.size - correctSelected;
      const partial = Math.max(0, correctSet.size > 0 ? (correctSelected - wrongSelected) / correctSet.size : 0);
      return { correct: isCorrect, attempted: true, partial };
    }
    case 'numerical': {
      if (typeof question.correctNumeric !== 'number') {
        return { correct: false, attempted: true };
      }
      const tol = question.tolerance ?? 0.01;
      const diff = Math.abs(answer.value - question.correctNumeric);
      const correct = diff <= tol;
      return { correct, attempted: true };
    }
    case 'descriptive':
    case 'writing':
    case 'speaking': {
      // For descriptive answers in adaptive mode, treat any non-empty submission as "attempted"
      // but mark as "correct" only if length >= 50 chars (placeholder heuristic — real
      // subjective grading is handled by a separate grading route).
      const correct = (answer.text?.trim().length ?? 0) >= 50;
      return { correct, attempted: true, partial: correct ? 1 : 0.3 };
    }
    default:
      return { correct: false, attempted: false };
  }
}

interface RespondRequestBody {
  sessionId: string;
  questionId: string;
  answer: AnswerValue;
  timeTakenSec: number;
}

export async function POST(request: Request) {
  let body: RespondRequestBody;
  try {
    body = (await request.json()) as RespondRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.sessionId || !body.questionId) {
    return NextResponse.json(
      { error: 'sessionId and questionId are required' },
      { status: 400 }
    );
  }

  const session = getSession(body.sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (session.terminated) {
    return NextResponse.json({
      error: 'Session is terminated',
      sessionId: session.sessionId,
      terminated: true,
      terminationReason: session.terminationReason,
    }, { status: 410 });
  }

  // Find the question being answered
  const question = session.questionMap.get(body.questionId);
  const grading = gradeAnswer(question, body.answer);

  try {
    const result = submitResponse({
      sessionId: body.sessionId,
      questionId: body.questionId,
      correct: grading.correct,
      attempted: grading.attempted,
      timeTakenSec: body.timeTakenSec,
      partial: grading.partial,
    });

    const updatedSession = result.session;
    return NextResponse.json({
      sessionId: updatedSession.sessionId,
      acknowledged: true,
      lastCorrect: grading.correct,
      lastAttempted: grading.attempted,
      lastPartial: grading.partial,
      currentTheta: updatedSession.currentTheta,
      currentSE: updatedSession.currentSE,
      phase: updatedSession.phase,
      itemsPresented: updatedSession.presentedItems.length,
      nextQuestion: result.nextQuestion,
      terminated: result.terminated,
      terminationReason: result.terminationReason,
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || 'Failed to process response' },
      { status: 500 }
    );
  }
}
