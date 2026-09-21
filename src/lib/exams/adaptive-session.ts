// ============================================================================
// Adaptive Mock Session Manager
// ----------------------------------------------------------------------------
// In-memory stateful session store. Survives across API calls within the same
// server process (dev mode) — for production, swap to Redis or DB-backed.
// ============================================================================

import type { ExamPattern, Question, QuestionType } from '@/lib/types';
import { getPattern } from './patterns';
import { GENERATORS, signature } from './generator';
import {
  type IrtItem,
  type IrtResponse,
  type AdaptiveSessionState,
  type AdaptivePhase,
  difficultyToB,
  estimateDiscrimination,
  estimateGuessing,
  pickNextItem,
  estimateTheta,
  standardError,
  computePhase,
  shouldTerminate,
  effectiveTheta,
} from './irt';

// ---------------------------------------------------------------------------
// Convert a generated Question to an IrtItem
// ---------------------------------------------------------------------------

function questionToIrtItem(q: Question): IrtItem {
  const qType = ((): 'mcq' | 'msq' | 'numerical' | 'reading' | 'descriptive' => {
    if (q.type === 'mcq') return 'mcq';
    if (q.type === 'msq') return 'msq';
    if (q.type === 'numerical') return 'numerical';
    if (q.type === 'reading' || q.type === 'listening') return 'reading';
    if (q.type === 'descriptive' || q.type === 'writing' || q.type === 'speaking') return 'descriptive';
    return 'mcq';
  })();

  const nOptions = q.options?.length ?? 4;

  return {
    itemId: q.id,
    subject: q.subject,
    topic: q.topic,
    difficulty: q.difficulty,
    a: estimateDiscrimination(q.topic, qType),
    b: difficultyToB(q.difficulty),
    c: estimateGuessing(qType, nOptions),
    marks: q.marks,
    negativeMarks: q.negativeMarks,
  };
}

// ---------------------------------------------------------------------------
// Generate a large pool of items for an exam pattern
// Each difficulty level generates 3x items so the engine has enough to
// pick from across the θ range.
// ---------------------------------------------------------------------------

export function generateItemPool(
  pattern: ExamPattern,
  seenSignatures?: Set<string>,
): { questions: Question[]; items: IrtItem[] } {
  const allQuestions: Question[] = [];
  const usedSignatures = new Set<string>(seenSignatures ?? []);
  const usedTexts = new Set<string>();

  // For each subject's syllabus, generate items across all topics and difficulties
  for (const section of pattern.sections) {
    const syllabus = pattern.syllabus.find(s => s.subject === section.subject);
    if (!syllabus) continue;

    for (const tw of syllabus.topics) {
      const key = `${section.subject}|${tw.topic}`;
      const gen = GENERATORS[key];
      if (!gen) continue;

      // Generate 3 items per difficulty (easy/medium/hard) for this topic
      for (const difficulty of ['easy', 'medium', 'hard'] as const) {
        for (let i = 0; i < 3; i++) {
          const meta = {
            subject: section.subject,
            topic: tw.topic,
            difficulty,
            marks: section.marksPerQuestion,
            negativeMarks: section.negativeMarks,
          };
          try {
            let q: Question | null = null;
            for (let retry = 0; retry < 5; retry++) {
              const candidate = gen(meta, usedTexts);
              const sig = signature(candidate.text);
              if (!usedSignatures.has(sig) && !usedTexts.has(candidate.text)) {
                usedSignatures.add(sig);
                usedTexts.add(candidate.text);
                q = candidate;
                break;
              }
            }
            if (q) allQuestions.push(q);
          } catch {
            // skip on generation error
          }
        }
      }
    }
  }

  const items = allQuestions.map(questionToIrtItem);
  // Propagate newly-seen signatures back to the caller's set (if provided)
  if (seenSignatures) {
    for (const sig of usedSignatures) seenSignatures.add(sig);
  }
  return { questions: allQuestions, items };
}

// ---------------------------------------------------------------------------
// Build a question lookup map for the session
// ---------------------------------------------------------------------------

export interface AdaptiveSession extends AdaptiveSessionState {
  // Question objects keyed by itemId — used to return the actual question to the UI
  questionMap: Map<string, Question>;
}

// ---------------------------------------------------------------------------
// Session manager — singleton, in-memory
// ---------------------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var
  var __adaptive_sessions__: Map<string, AdaptiveSession> | undefined;
}

function getSessions(): Map<string, AdaptiveSession> {
  if (!globalThis.__adaptive_sessions__) {
    globalThis.__adaptive_sessions__ = new Map();
  }
  return globalThis.__adaptive_sessions__;
}

// ---------------------------------------------------------------------------
// Start a new adaptive session
// ---------------------------------------------------------------------------

export interface StartSessionInput {
  examId: string;
  userId?: string;
  maxItems?: number;       // default 20
  minItems?: number;        // default 8
  seThreshold?: number;    // default 0.4 (lower = more items needed)
  seenSignatures?: Set<string>;
}

export function startAdaptiveSession(input: StartSessionInput): AdaptiveSession {
  const pattern = getPattern(input.examId);
  if (!pattern) {
    throw new Error(`Unknown exam pattern: ${input.examId}`);
  }

  const { questions, items } = generateItemPool(pattern, input.seenSignatures);
  if (items.length === 0) {
    throw new Error(`No items could be generated for exam: ${input.examId}`);
  }

  const questionMap = new Map<string, Question>();
  for (const q of questions) questionMap.set(q.id, q);

  const sessionId = `adapt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const session: AdaptiveSession = {
    sessionId,
    userId: input.userId,
    examId: input.examId,
    examName: pattern.fullName,
    startedAt: now,
    lastActivityAt: now,
    itemPool: items,
    presentedItems: [],
    responses: [],
    currentTheta: 0,
    currentSE: 1.5,
    phase: 'warmup',
    maxItems: input.maxItems ?? 20,
    minItems: input.minItems ?? 8,
    seTerminationThreshold: input.seThreshold ?? 0.4,
    topicUsage: {},
    subjectUsage: {},
    thetaHistory: [],
    terminated: false,
    questionMap,
  };

  getSessions().set(sessionId, session);
  return session;
}

// ---------------------------------------------------------------------------
// Get a session by id
// ---------------------------------------------------------------------------

export function getSession(sessionId: string): AdaptiveSession | undefined {
  return getSessions().get(sessionId);
}

// ---------------------------------------------------------------------------
// Get the next item to present (without recording a response — used at start)
// ---------------------------------------------------------------------------

export function getNextQuestion(session: AdaptiveSession): { question: Question | null; irtItem: IrtItem | null; terminated: boolean; reason?: string } {
  if (session.terminated) {
    return { question: null, irtItem: null, terminated: true, reason: session.terminationReason };
  }
  const termCheck = shouldTerminate(session);
  if (termCheck.terminate) {
    session.terminated = true;
    session.terminationReason = termCheck.reason;
    return { question: null, irtItem: null, terminated: true, reason: termCheck.reason };
  }

  const seenItemIds = new Set(session.presentedItems.map(i => i.itemId));
  const topicUsageMap = new Map(Object.entries(session.topicUsage));
  const theta = effectiveTheta(session);

  // Prefer topics not yet seen to ensure coverage
  const seenTopics = new Set(session.presentedItems.map(i => i.topic));
  const preferTopics = session.itemPool
    .filter(i => !seenTopics.has(i.topic))
    .map(i => i.topic)
    .slice(0, 3);

  const nextItem = pickNextItem(theta, session.itemPool, {
    seenItemIds,
    topicUsage: topicUsageMap,
    preferTopics: preferTopics.length > 0 ? preferTopics : undefined,
    maxPerTopic: 3,
    topicImbalancePenalty: 0.5,
  });

  if (!nextItem) {
    session.terminated = true;
    session.terminationReason = 'Item pool exhausted';
    return { question: null, irtItem: null, terminated: true, reason: session.terminationReason };
  }

  const question = session.questionMap.get(nextItem.itemId);
  if (!question) {
    session.terminated = true;
    session.terminationReason = 'Question not found for IRT item';
    return { question: null, irtItem: null, terminated: true, reason: session.terminationReason };
  }

  // Mark as presented (don't record response yet)
  session.presentedItems.push(nextItem);
  session.topicUsage[nextItem.topic] = (session.topicUsage[nextItem.topic] ?? 0) + 1;
  session.subjectUsage[nextItem.subject] = (session.subjectUsage[nextItem.subject] ?? 0) + 1;
  session.lastActivityAt = new Date().toISOString();

  return { question, irtItem: nextItem, terminated: false };
}

// ---------------------------------------------------------------------------
// Submit a response — updates theta, SE, phase, and returns next question
// ---------------------------------------------------------------------------

export interface SubmitResponseInput {
  sessionId: string;
  questionId: string;
  correct: boolean;
  attempted: boolean;
  timeTakenSec: number;
  partial?: number;
}

export interface SubmitResponseResult {
  session: AdaptiveSession;
  nextQuestion: Question | null;
  nextIrtItem: IrtItem | null;
  terminated: boolean;
  terminationReason?: string;
}

export function submitResponse(input: SubmitResponseInput): SubmitResponseResult {
  const session = getSession(input.sessionId);
  if (!session) {
    throw new Error(`Session not found: ${input.sessionId}`);
  }
  if (session.terminated) {
    return { session, nextQuestion: null, nextIrtItem: null, terminated: true, terminationReason: session.terminationReason };
  }

  // Verify the question being responded to is the latest presented
  const lastPresented = session.presentedItems[session.presentedItems.length - 1];
  if (!lastPresented || lastPresented.itemId !== input.questionId) {
    throw new Error(`Question ${input.questionId} is not the current question for session ${input.sessionId}`);
  }

  // Record the response
  const response: IrtResponse = {
    itemId: input.questionId,
    correct: input.correct,
    attempted: input.attempted,
    timeTakenSec: input.timeTakenSec,
    partial: input.partial,
  };
  session.responses.push(response);

  // Build an items map for theta estimation
  const itemsMap = new Map<string, IrtItem>();
  for (const item of session.presentedItems) itemsMap.set(item.itemId, item);

  // Update theta and SE
  session.currentTheta = estimateTheta(session.responses, itemsMap);
  session.currentSE = standardError(session.currentTheta, Array.from(itemsMap.values()));

  // Record theta history
  session.thetaHistory.push({
    itemIndex: session.presentedItems.length,
    theta: session.currentTheta,
    se: session.currentSE,
  });

  // Update phase
  session.phase = computePhase(
    session.presentedItems.length,
    session.currentSE,
    session.minItems,
    session.maxItems,
    session.seTerminationThreshold,
  );

  session.lastActivityAt = new Date().toISOString();

  // Check termination
  const termCheck = shouldTerminate(session);
  if (termCheck.terminate) {
    session.terminated = true;
    session.terminationReason = termCheck.reason;
    return { session, nextQuestion: null, nextIrtItem: null, terminated: true, terminationReason: termCheck.reason };
  }

  // Get next question
  const next = getNextQuestion(session);
  return {
    session,
    nextQuestion: next.question,
    nextIrtItem: next.irtItem,
    terminated: next.terminated,
    terminationReason: next.reason,
  };
}

// ---------------------------------------------------------------------------
// Manually end a session (e.g. student clicked "End Exam")
// ---------------------------------------------------------------------------

export function endSession(sessionId: string, reason = 'Manually ended by user'): AdaptiveSession | null {
  const session = getSession(sessionId);
  if (!session) return null;
  if (session.terminated) return session;
  session.terminated = true;
  session.terminationReason = reason;
  session.lastActivityAt = new Date().toISOString();
  return session;
}

// ---------------------------------------------------------------------------
// Garbage collect old sessions — call periodically (e.g. every 5 min)
// Removes sessions older than 2 hours OR already terminated > 30 min ago.
// ---------------------------------------------------------------------------

export function gcSessions(): number {
  const sessions = getSessions();
  const now = Date.now();
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const THIRTY_MIN = 30 * 60 * 1000;
  let removed = 0;
  for (const [id, s] of sessions.entries()) {
    const age = now - new Date(s.lastActivityAt).getTime();
    if (age > TWO_HOURS) {
      sessions.delete(id);
      removed++;
    } else if (s.terminated && age > THIRTY_MIN) {
      sessions.delete(id);
      removed++;
    }
  }
  return removed;
}

// ---------------------------------------------------------------------------
// Public re-exports for the API layer
// ---------------------------------------------------------------------------

export { computeFinalScore } from './irt';
export type { AdaptiveFinalScore } from './irt';
