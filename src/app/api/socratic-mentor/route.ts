import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { getEduScope, buildContext } from '@/lib/ai-guards/eduscope';
import {
  detectMisconception,
  transitionSocratic,
  INITIAL_SOCRATIC_STATE,
  STRATEGY_DESCRIPTIONS,
  type SocraticState,
  type MisconceptionDetection,
  type SocraticStrategy,
} from '@/lib/ai-guards/socratic-engine';
import type { User } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Session state (in-memory; survives HMR via globalThis)
// ---------------------------------------------------------------------------

interface SocraticSession {
  sessionId: string;
  userId?: string;
  examGoal?: string;
  state: SocraticState;
  // Conversation history (for LLM context)
  history: { role: 'user' | 'assistant'; content: string }[];
  // Last detection surfaced to UI (cached for /state endpoint)
  lastDetection?: MisconceptionDetection;
  createdAt: string;
  lastActivityAt: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __socratic_sessions__: Map<string, SocraticSession> | undefined;
}

function getSessions(): Map<string, SocraticSession> {
  if (!globalThis.__socratic_sessions__) {
    globalThis.__socratic_sessions__ = new Map();
  }
  return globalThis.__socratic_sessions__;
}

// ---------------------------------------------------------------------------
// Request / response types
// ---------------------------------------------------------------------------

interface SocraticRequest {
  action: 'start' | 'respond' | 'reset' | 'state';
  sessionId?: string;
  userId?: string;
  examGoal?: string;
  user?: Pick<User, 'id' | 'type' | 'examGoal'>;
  language?: string;
  // For 'respond': the student's latest message/attempt
  message?: string;
  // Context for detection: the original problem being discussed
  questionContext?: string;
  correctAnswer?: string;
  subject?: string;
  topic?: string;
  // Whether the student explicitly asked for the direct answer
  asksForAnswer?: boolean;
  // Whether the student's attempt was correct (set by client after grading)
  isCorrect?: boolean;
}

interface SocraticResponse {
  sessionId: string;
  reply: string;
  phase: string;
  hintCount: number;
  misconception?: MisconceptionDetection;
  misconceptionHistory: string[];
  allowDirectAnswer: boolean;
  directAnswerRevealed: boolean;
  auditId?: string;
  blocked?: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

function newSession(input: SocraticRequest): SocraticSession {
  const id = `socr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  return {
    sessionId: id,
    userId: input.userId,
    examGoal: input.examGoal ?? input.user?.examGoal,
    state: { ...INITIAL_SOCRATIC_STATE },
    history: [],
    createdAt: now,
    lastActivityAt: now,
  };
}

// ---------------------------------------------------------------------------
// Build the system prompt — emphasises Socratic discipline
// ---------------------------------------------------------------------------

function buildSystemPrompt(state: SocraticState, misconception: MisconceptionDetection | undefined, ctx: { examGoal?: string }): string {
  const examGoal = ctx.examGoal ?? 'competitive exam';
  let prompt = `You are "Socratic Mentor v2" inside Preparation AI, helping a student prepare for ${examGoal}.

ABSOLUTE RULES (non-negotiable):
1. NEVER reveal the final answer directly. The student must reach it themselves.
2. Give AT MOST one hint per response. Do not pile hints.
3. After giving a hint, ASK a guiding question and wait for the student's next attempt.
4. Use the diagnosed misconception to tailor your hint — don't just repeat the question.
5. If the student asks for the answer: acknowledge, give ONE more scaffolded hint, and tell them you'll walk through the full solution if they're still stuck after that.
6. After 3 hints have been given AND the student is still stuck, you may reveal the full worked solution — but frame each step explicitly against the misconception that was blocking them.
7. When the student reaches the correct answer, don't just say "correct" — ask them to articulate WHY their approach worked.
8. Stay within ${examGoal} preparation scope. Politely refuse off-topic requests.

CURRENT DIALOGUE STATE:
- Phase: ${state.phase}
- Hints given so far: ${state.hintCount} / 3 max
- Misconception history: ${state.misconceptionHistory.length > 0 ? state.misconceptionHistory.join(', ') : 'none yet'}
- Direct answer requested: ${state.directAnswerRequested ? 'yes' : 'no'}
- Attempts since last hint: ${state.attemptsSinceLastHint}`;

  if (misconception) {
    prompt += `

LATEST DIAGNOSIS:
- Type: ${misconception.type}
- Confidence: ${(misconception.confidence * 100).toFixed(0)}%
- Diagnosis: ${misconception.diagnosis}
- Evidence: ${misconception.evidence}
- Suggested strategy: ${misconception.suggestedStrategy}
- Strategy description: ${STRATEGY_DESCRIPTIONS[misconception.suggestedStrategy]}`;
  }

  prompt += `

Tone: warm, curious, patient. Use plain English. Avoid lecturing. 200 words max per response.`;
  return prompt;
}

// ---------------------------------------------------------------------------
// Extract JSON object from possibly-fenced LLM response
// ---------------------------------------------------------------------------

function extractJsonObject(text: string): unknown {
  let t = (text || '').trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  let body: SocraticRequest;
  try {
    body = (await request.json()) as SocraticRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // -------- Action: start --------
  if (body.action === 'start') {
    const session = newSession(body);
    getSessions().set(session.sessionId, session);
    return NextResponse.json({
      sessionId: session.sessionId,
      reply: "Hi! I'm your Socratic Mentor. I won't just hand you answers — instead, I'll guide you to discover them yourself. Share a problem you're stuck on, or tell me a concept you'd like to explore.",
      phase: session.state.phase,
      hintCount: 0,
      misconceptionHistory: [],
      allowDirectAnswer: false,
      directAnswerRevealed: false,
    } satisfies SocraticResponse);
  }

  // -------- Action: state --------
  if (body.action === 'state') {
    if (!body.sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }
    const session = getSessions().get(body.sessionId);
    if (!session) {
      return NextResponse.json({ error: 'session not found' }, { status: 404 });
    }
    return NextResponse.json({
      sessionId: session.sessionId,
      reply: '',
      phase: session.state.phase,
      hintCount: session.state.hintCount,
      misconception: session.lastDetection,
      misconceptionHistory: session.state.misconceptionHistory,
      allowDirectAnswer: session.state.hintCount >= 3,
      directAnswerRevealed: session.state.phase === 'closed',
    } satisfies SocraticResponse);
  }

  // -------- Action: reset --------
  if (body.action === 'reset') {
    if (!body.sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }
    const session = getSessions().get(body.sessionId);
    if (!session) {
      return NextResponse.json({ error: 'session not found' }, { status: 404 });
    }
    session.state = { ...INITIAL_SOCRATIC_STATE };
    session.history = [];
    session.lastDetection = undefined;
    session.lastActivityAt = new Date().toISOString();
    return NextResponse.json({
      sessionId: session.sessionId,
      reply: "Fresh start. What problem are we working on?",
      phase: session.state.phase,
      hintCount: 0,
      misconceptionHistory: [],
      allowDirectAnswer: false,
      directAnswerRevealed: false,
    } satisfies SocraticResponse);
  }

  // -------- Action: respond --------
  if (body.action === 'respond') {
    if (!body.sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }
    const session = getSessions().get(body.sessionId);
    if (!session) {
      return NextResponse.json({ error: 'session not found' }, { status: 404 });
    }

    const message = (body.message ?? '').trim();
    if (!message) {
      return NextResponse.json({ error: 'message is required for respond action' }, { status: 400 });
    }

    // -------- EduScope guardrail --------
    const guard = getEduScope();
    const ctx = buildContext('mentor', (body.user as User | undefined) ?? null, undefined, body.language);
    const baseSystem = buildSystemPrompt(session.state, session.lastDetection, { examGoal: session.examGoal });
    const decision = guard.evaluate({
      userPrompt: message,
      systemPrompt: baseSystem,
      context: ctx,
    });

    // Hard blocks
    if (decision.verdict === 'blocked-unsafe') {
      return NextResponse.json({
        sessionId: session.sessionId,
        reply: "I can't help with that. I'm here to guide you through exam problems using the Socratic method. If you're feeling overwhelmed, please reach out to a parent, teacher, or a helpline such as iCall (9152987821 in India).",
        phase: session.state.phase,
        hintCount: session.state.hintCount,
        misconceptionHistory: session.state.misconceptionHistory,
        allowDirectAnswer: false,
        directAnswerRevealed: false,
        auditId: decision.auditId,
        blocked: true,
        reason: decision.reason,
      } satisfies SocraticResponse);
    }

    if (decision.verdict === 'blocked-off-topic') {
      return NextResponse.json({
        sessionId: session.sessionId,
        reply: "That's outside my scope — I focus strictly on competitive-exam preparation. Share a problem from your textbook, notes, or a mock test, and I'll guide you through it step by step.",
        phase: session.state.phase,
        hintCount: session.state.hintCount,
        misconceptionHistory: session.state.misconceptionHistory,
        allowDirectAnswer: false,
        directAnswerRevealed: false,
        auditId: decision.auditId,
        blocked: true,
        reason: decision.reason,
      } satisfies SocraticResponse);
    }

    // -------- Misconception detection --------
    const detection = detectMisconception({
      question: body.questionContext ?? '',
      studentAnswer: message,
      correctAnswer: body.correctAnswer,
      subject: body.subject,
      topic: body.topic,
      priorMisconceptions: session.state.misconceptionHistory,
    });
    session.lastDetection = detection;

    // -------- State machine transition --------
    let transition;
    let allowDirectAnswer = false;
    let directAnswerRevealed = false;

    if (body.asksForAnswer) {
      transition = transitionSocratic(session.state, { type: 'student_asks_for_answer' });
      allowDirectAnswer = transition.allowDirectAnswer;
      if (allowDirectAnswer) directAnswerRevealed = true;
    } else if (body.isCorrect === true) {
      transition = transitionSocratic(session.state, { type: 'student_correct' });
    } else {
      // Student attempted — pass the detection
      transition = transitionSocratic(session.state, {
        type: 'student_attempted',
        misconception: detection,
      });
      allowDirectAnswer = transition.allowDirectAnswer;
      if (allowDirectAnswer) directAnswerRevealed = true;
    }

    session.state = transition.newState;
    session.lastActivityAt = new Date().toISOString();

    // -------- Build the LLM prompt --------
    const userPromptForLLM = decision.socraticReframe ?? decision.sanitizedPrompt;
    // The instruction from the state machine guides the LLM's behaviour
    const instructionClause = `\n\n[INTERNAL INSTRUCTION TO MENTOR]: ${transition.instruction}`;
    const finalUserPrompt = `${userPromptForLLM}${instructionClause}`;

    // Update history
    session.history.push({ role: 'user', content: message });
    if (session.history.length > 12) session.history = session.history.slice(-12);

    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        model: 'glm-4.6',
        stream: false,
        messages: [
          { role: 'system', content: decision.rewrittenSystemPrompt },
          ...session.history.slice(-6),
          { role: 'user', content: finalUserPrompt },
        ],
      });

      let reply = completion?.choices?.[0]?.message?.content || "Let me think about that. Could you walk me through how you arrived at your answer?";

      // Inspect response for safety / PII
      const inspection = guard.inspectResponse(reply, decision.auditId);
      if (!inspection.safe) {
        reply = "I can't share that — let's refocus on the problem. What concept are you most unsure about?";
      } else {
        reply = inspection.cleaned;
      }

      // Record assistant reply in history
      session.history.push({ role: 'assistant', content: reply });
      if (session.history.length > 12) session.history = session.history.slice(-12);

      // Mark hint given if the response includes a hint-like phrase
      const hintRegex = /(hint|try this|consider|what if|notice that|think about)/i;
      if (hintRegex.test(reply) && session.state.attemptsSinceLastHint === 0) {
        const hintTransition = transitionSocratic(session.state, { type: 'hint_given' });
        session.state = hintTransition.newState;
      }

      const response: SocraticResponse = {
        sessionId: session.sessionId,
        reply,
        phase: session.state.phase,
        hintCount: session.state.hintCount,
        misconception: detection,
        misconceptionHistory: session.state.misconceptionHistory,
        allowDirectAnswer,
        directAnswerRevealed,
        auditId: decision.auditId,
        blocked: false,
      };
      return NextResponse.json(response);
    } catch (e) {
      // LLM failure — return a deterministic fallback reply based on the state machine
      const fallbackReply = buildFallbackReply(session.state, detection, body.asksForAnswer === true);
      session.history.push({ role: 'assistant', content: fallbackReply });
      return NextResponse.json({
        sessionId: session.sessionId,
        reply: fallbackReply,
        phase: session.state.phase,
        hintCount: session.state.hintCount,
        misconception: detection,
        misconceptionHistory: session.state.misconceptionHistory,
        allowDirectAnswer,
        directAnswerRevealed,
        auditId: decision.auditId,
        blocked: false,
      } satisfies SocraticResponse);
    }
  }

  return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
}

// ---------------------------------------------------------------------------
// Deterministic fallback reply — used when GLM-4.6 is unavailable
// ---------------------------------------------------------------------------

function buildFallbackReply(state: SocraticState, detection: MisconceptionDetection | undefined, asksForAnswer: boolean): string {
  if (asksForAnswer && state.hintCount >= 3) {
    return "OK, since we've explored this together with several hints, here's the worked solution: walk through each step explicitly. (Detailed worked solution would be here in production — for now, please revisit the steps we've covered and try assembling them.)";
  }
  if (asksForAnswer) {
    return "I hear that you'd like the answer. Let me give you one more nudge instead — try this: identify the key concept the problem is testing, then write down what you know about it. If you're still stuck after that, I'll walk you through the full solution.";
  }
  if (!detection || detection.type === 'unclassified') {
    return "Interesting. Walk me through your reasoning — what steps did you take to arrive at that answer?";
  }
  const strategyHint: Record<SocraticStrategy, string> = {
    'probe-understanding': 'Walk me through your reasoning step by step — what was your first thought when you read the problem?',
    'confront-contradiction': `Quick check: if your reasoning were right, what would happen in the simple case where the value is zero (or infinity)? Does that match what we'd expect?`,
    'scaffold-steps': "Let's break this into smaller pieces. What's the first sub-step we'd need to figure out?",
    'analogical-prompt': 'Think of an everyday situation where this same concept applies. What does your intuition tell you there?',
    'limit-case': 'What if we took this to the extreme — zero, or infinity? Does your formula still give a sensible answer?',
    'review-definition': 'Pause and revisit the formal definition of the key term in the question. What does it actually mean?',
    'redraw-diagram': 'Can you redraw the setup and label every quantity? Sometimes seeing it on paper reveals the issue.',
    'verify-calculation': 'Re-check your arithmetic one line at a time — without changing the method. Where does the value first look off?',
    'try-alternative': 'Try solving this a different way — say, using energy instead of forces. Do you get the same answer?',
  };
  return `${detection.diagnosis}\n\n${strategyHint[detection.suggestedStrategy]}`;
}
