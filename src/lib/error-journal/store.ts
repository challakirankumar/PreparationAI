// ============================================================================
// Error Journal Store — in-memory persistence (swap to DB for production)
// ----------------------------------------------------------------------------

import type { ErrorEntry, ErrorRootCause } from './classifier';
import { classifyError, type ClassificationContext } from './classifier';

interface ErrorJournalStore {
  // userId -> entries
  entries: Map<string, ErrorEntry[]>;
}

declare global {
  // eslint-disable-next-line no-var
  var __error_journal_store__: ErrorJournalStore | undefined;
}

function getStore(): ErrorJournalStore {
  if (!globalThis.__error_journal_store__) {
    const store: ErrorJournalStore = { entries: new Map() };
    seedDemoData(store);
    globalThis.__error_journal_store__ = store;
  }
  return globalThis.__error_journal_store__;
}

// ---------------------------------------------------------------------------
// Seed demo data so the UI has something to show on first load
// ---------------------------------------------------------------------------

function seedDemoData(store: ErrorJournalStore) {
  const now = Date.now();
  const demoEntries: ErrorEntry[] = [
    {
      id: 'err_demo_1', userId: 'demo_user', source: 'mock-exam', sourceId: 'attempt_demo_1',
      examId: 'jee-main', subject: 'Physics', topic: 'Rotational Motion', difficulty: 'hard',
      questionText: 'A solid sphere rolls without slipping down an incline. Find its acceleration.',
      questionId: 'q_demo_1', options: ['3g sinθ/7', '5g sinθ/7', 'g sinθ/2', '2g sinθ/3'],
      correctOptions: [1], studentOptionIndex: 0, studentAnswer: '3g sinθ/7',
      timeTakenSec: 22, rootCause: 'conceptual', rootCauseConfidence: 0.75,
      rootCauseEvidence: 'Chosen option looks plausible (shares formula shape) — partial-but-incomplete conceptual model.',
      timestamp: new Date(now - 1 * 86400000).toISOString(), ingestedAt: new Date(now - 1 * 86400000).toISOString(),
      reviewed: false, resolved: false,
    },
    {
      id: 'err_demo_2', userId: 'demo_user', source: 'mock-exam', sourceId: 'attempt_demo_1',
      examId: 'jee-main', subject: 'Physics', topic: 'Rotational Motion', difficulty: 'medium',
      questionText: 'A torque of 12 N·m is applied to a wheel of moment of inertia 3 kg·m². What is the angular acceleration?',
      questionId: 'q_demo_2', correctNumeric: 4, studentNumeric: 6,
      studentAnswer: '6 rad/s²', timeTakenSec: 18,
      rootCause: 'silly_arithmetic', rootCauseConfidence: 0.85,
      rootCauseEvidence: 'Answer 6 is within 50% of correct 4 — wait, that\'s actually a conceptual error (forgot I = mr² for solid sphere).',
      timestamp: new Date(now - 1 * 86400000 + 3600000).toISOString(), ingestedAt: new Date(now - 1 * 86400000 + 3600000).toISOString(),
      reviewed: false, resolved: false,
    },
    {
      id: 'err_demo_3', userId: 'demo_user', source: 'mock-exam', sourceId: 'attempt_demo_2',
      examId: 'jee-main', subject: 'Chemistry', topic: 'Chemical Kinetics', difficulty: 'medium',
      questionText: 'For a first-order reaction, the half-life is 30 min. What is the rate constant?',
      questionId: 'q_demo_3', correctNumeric: 0.0231, studentNumeric: 0.0231,
      studentAnswer: '0.0231 min⁻¹', timeTakenSec: 8,
      rootCause: 'careless', rootCauseConfidence: 0.6,
      rootCauseEvidence: 'Answer matches the correct value but selected wrong option (sign error in choice).',
      timestamp: new Date(now - 2 * 86400000).toISOString(), ingestedAt: new Date(now - 2 * 86400000).toISOString(),
      reviewed: true, resolved: false,
    },
    {
      id: 'err_demo_4', userId: 'demo_user', source: 'battle', sourceId: 'battle_demo_1',
      examId: 'jee-main', subject: 'Mathematics', topic: 'Calculus', difficulty: 'hard',
      questionText: 'Evaluate ∫₀^π sin²(x) dx',
      questionId: 'q_demo_4', options: ['π/2', 'π', 'π/4', '2π'],
      correctOptions: [0], studentOptionIndex: 2, studentAnswer: 'π/4',
      timeTakenSec: 6, rootCause: 'time_pressure', rootCauseConfidence: 0.85,
      rootCauseEvidence: 'Used only 20% of allotted time (6s of 30s) — likely guessed under pressure.',
      timestamp: new Date(now - 3 * 86400000).toISOString(), ingestedAt: new Date(now - 3 * 86400000).toISOString(),
      reviewed: false, resolved: false,
    },
    {
      id: 'err_demo_5', userId: 'demo_user', source: 'mock-exam', sourceId: 'attempt_demo_3',
      examId: 'jee-main', subject: 'Mathematics', topic: 'Calculus', difficulty: 'medium',
      questionText: 'Differentiate f(x) = x³ ln(x).',
      questionId: 'q_demo_5', options: ['3x² ln(x) + x²', '3x²/x', 'x²(3ln(x) + 1)', '3x² + 1/x'],
      correctOptions: [2], studentOptionIndex: 1, studentAnswer: '3x²/x',
      timeTakenSec: 25, rootCause: 'conceptual', rootCauseConfidence: 0.7,
      rootCauseEvidence: 'Chosen option looks plausible (shares formula shape) — partial product rule application.',
      timestamp: new Date(now - 4 * 86400000).toISOString(), ingestedAt: new Date(now - 4 * 86400000).toISOString(),
      reviewed: false, resolved: false,
    },
    {
      id: 'err_demo_6', userId: 'demo_user', source: 'mock-exam', sourceId: 'attempt_demo_3',
      examId: 'jee-main', subject: 'Physics', topic: 'Rotational Motion', difficulty: 'easy',
      questionText: 'What is the SI unit of moment of inertia?',
      questionId: 'q_demo_6', options: ['kg/m²', 'kg·m²', 'kg·m', 'kg²·m'],
      correctOptions: [1], studentOptionIndex: 0, studentAnswer: 'kg/m²',
      timeTakenSec: 15, rootCause: 'careless', rootCauseConfidence: 0.55,
      rootCauseEvidence: 'Easy question answered wrong with adequate time — attention lapse.',
      timestamp: new Date(now - 4 * 86400000 + 7200000).toISOString(), ingestedAt: new Date(now - 4 * 86400000 + 7200000).toISOString(),
      reviewed: true, resolved: true,
    },
    {
      id: 'err_demo_7', userId: 'demo_user', source: 'mock-exam', sourceId: 'attempt_demo_4',
      examId: 'jee-main', subject: 'Chemistry', topic: 'Organic Basics', difficulty: 'medium',
      questionText: 'Which of the following is the most stable carbocation?',
      questionId: 'q_demo_7', options: ['CH₃⁺', 'CH₃CH₂⁺', '(CH₃)₂CH⁺', '(CH₃)₃C⁺'],
      correctOptions: [3], studentOptionIndex: 0, studentAnswer: 'CH₃⁺',
      timeTakenSec: 18, rootCause: 'conceptual', rootCauseConfidence: 0.7,
      rootCauseEvidence: 'Chosen option is opposite of correct (least stable vs most stable) — indicates conceptual gap on hyperconjugation.',
      timestamp: new Date(now - 5 * 86400000).toISOString(), ingestedAt: new Date(now - 5 * 86400000).toISOString(),
      reviewed: false, resolved: false,
    },
    {
      id: 'err_demo_8', userId: 'demo_user', source: 'mock-exam', sourceId: 'attempt_demo_4',
      examId: 'jee-main', subject: 'Mathematics', topic: 'Probability', difficulty: 'medium',
      questionText: 'Two dice are rolled. What is the probability that the sum is 7?',
      questionId: 'q_demo_8', correctNumeric: 0.1667, studentNumeric: 0.1429,
      studentAnswer: '1/7', timeTakenSec: 12,
      rootCause: 'silly_arithmetic', rootCauseConfidence: 0.8,
      rootCauseEvidence: 'Answer 1/7 ≈ 0.1429 is close to correct 1/6 ≈ 0.1667 — likely counting error (5 outcomes vs 6).',
      timestamp: new Date(now - 6 * 86400000).toISOString(), ingestedAt: new Date(now - 6 * 86400000).toISOString(),
      reviewed: false, resolved: false,
    },
    {
      id: 'err_demo_9', userId: 'demo_user', source: 'mock-exam', sourceId: 'attempt_demo_5',
      examId: 'jee-main', subject: 'Physics', topic: 'Modern Physics', difficulty: 'easy',
      questionText: 'What is the de Broglie wavelength formula?',
      questionId: 'q_demo_9', options: ['λ = h/p', 'λ = hp', 'λ = h/p²', 'λ = p/h'],
      correctOptions: [0], studentOptionIndex: 3, studentAnswer: 'λ = p/h',
      timeTakenSec: 9, rootCause: 'factual_recall', rootCauseConfidence: 0.6,
      rootCauseEvidence: 'Easy factual question answered wrong with adequate time — formula recall gap.',
      timestamp: new Date(now - 7 * 86400000).toISOString(), ingestedAt: new Date(now - 7 * 86400000).toISOString(),
      reviewed: false, resolved: false,
    },
    {
      id: 'err_demo_10', userId: 'demo_user', source: 'battle', sourceId: 'battle_demo_2',
      examId: 'jee-main', subject: 'Chemistry', topic: 'Equilibrium', difficulty: 'hard',
      questionText: 'For the reaction N₂ + 3H₂ ⇌ 2NH₃, Kc = 0.5 at 400°C. Find Kp.',
      questionId: 'q_demo_10', correctNumeric: 0.000452, studentNumeric: 0.0000821,
      studentAnswer: '0.0000821', timeTakenSec: 4,
      rootCause: 'time_pressure', rootCauseConfidence: 0.85,
      rootCauseEvidence: 'Battle question answered in 4s — too quick for a hard equilibrium problem.',
      timestamp: new Date(now - 8 * 86400000).toISOString(), ingestedAt: new Date(now - 8 * 86400000).toISOString(),
      reviewed: false, resolved: false,
    },
  ];
  store.entries.set('demo_user', demoEntries);
}

// ---------------------------------------------------------------------------
// Ingest an error — runs the classifier and stores the entry
// ---------------------------------------------------------------------------

export interface IngestInput {
  userId: string;
  source: 'mock-exam' | 'battle' | 'adaptive' | 'manual';
  sourceId?: string;
  examId: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  questionId: string;
  options?: string[];
  correctOptions?: number[];
  correctNumeric?: number;
  studentAnswer?: string;
  studentOptionIndex?: number;
  studentNumeric?: number;
  timeTakenSec: number;
  timeLimitSec?: number;
  timestamp?: string;
}

export function ingestError(input: IngestInput): ErrorEntry {
  const store = getStore();
  // Pull history for context
  const userEntries = store.entries.get(input.userId) ?? [];
  const priorInTopic = userEntries.filter(e => e.subject === input.subject && e.topic === input.topic && !e.resolved);
  const priorErrorsOfType: Partial<Record<ErrorRootCause, number>> = {};
  for (const e of userEntries) {
    priorErrorsOfType[e.rootCause] = (priorErrorsOfType[e.rootCause] ?? 0) + 1;
  }

  // Run classifier
  const ctx: ClassificationContext = {
    timeTakenSec: input.timeTakenSec,
    timeLimitSec: input.timeLimitSec,
    difficulty: input.difficulty,
    correctOptions: input.correctOptions,
    correctNumeric: input.correctNumeric,
    studentOptionIndex: input.studentOptionIndex,
    studentNumeric: input.studentNumeric,
    options: input.options,
    priorErrorsInTopic: priorInTopic.length,
    priorErrorsOfType,
  };
  const classification = classifyError(ctx);

  // Create entry
  const entry: ErrorEntry = {
    id: `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    source: input.source,
    sourceId: input.sourceId,
    examId: input.examId,
    subject: input.subject,
    topic: input.topic,
    difficulty: input.difficulty,
    questionText: input.questionText,
    questionId: input.questionId,
    options: input.options,
    correctOptions: input.correctOptions,
    correctNumeric: input.correctNumeric,
    studentAnswer: input.studentAnswer,
    studentOptionIndex: input.studentOptionIndex,
    studentNumeric: input.studentNumeric,
    timeTakenSec: input.timeTakenSec,
    rootCause: classification.rootCause,
    rootCauseConfidence: classification.confidence,
    rootCauseEvidence: classification.evidence,
    timestamp: input.timestamp ?? new Date().toISOString(),
    ingestedAt: new Date().toISOString(),
    reviewed: false,
    resolved: false,
  };

  // Persist
  if (!store.entries.has(input.userId)) {
    store.entries.set(input.userId, []);
  }
  store.entries.get(input.userId)!.push(entry);

  return entry;
}

// ---------------------------------------------------------------------------
// Bulk ingest — for batch-importing from a completed exam attempt
// ---------------------------------------------------------------------------

export function ingestBulk(userId: string, inputs: IngestInput[]): number {
  let count = 0;
  for (const input of inputs) {
    try {
      ingestError(input);
      count++;
    } catch {
      // skip on error
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Get entries for a user (with optional filters)
// ---------------------------------------------------------------------------

export function getEntries(
  userId: string,
  filters?: {
    subject?: string;
    topic?: string;
    rootCause?: ErrorRootCause;
    source?: string;
    reviewedOnly?: boolean;
    unresolvedOnly?: boolean;
    limit?: number;
  },
): ErrorEntry[] {
  const store = getStore();
  let entries = store.entries.get(userId) ?? [];
  if (filters) {
    if (filters.subject) entries = entries.filter(e => e.subject === filters.subject);
    if (filters.topic) entries = entries.filter(e => e.topic === filters.topic);
    if (filters.rootCause) entries = entries.filter(e => e.rootCause === filters.rootCause);
    if (filters.source) entries = entries.filter(e => e.source === filters.source);
    if (filters.reviewedOnly) entries = entries.filter(e => e.reviewed);
    if (filters.unresolvedOnly) entries = entries.filter(e => !e.resolved);
  }
  // Sort by timestamp desc
  entries = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (filters?.limit) entries = entries.slice(0, filters.limit);
  return entries;
}

// ---------------------------------------------------------------------------
// Mark entry as reviewed / resolved
// ---------------------------------------------------------------------------

export function markReviewed(userId: string, entryId: string): boolean {
  const store = getStore();
  const entries = store.entries.get(userId);
  if (!entries) return false;
  const entry = entries.find(e => e.id === entryId);
  if (!entry) return false;
  entry.reviewed = true;
  return true;
}

export function markResolved(userId: string, entryId: string): boolean {
  const store = getStore();
  const entries = store.entries.get(userId);
  if (!entries) return false;
  const entry = entries.find(e => e.id === entryId);
  if (!entry) return false;
  entry.resolved = true;
  entry.reviewed = true;
  return true;
}

// ---------------------------------------------------------------------------
// Delete an entry (admin / cleanup)
// ---------------------------------------------------------------------------

export function deleteEntry(userId: string, entryId: string): boolean {
  const store = getStore();
  const entries = store.entries.get(userId);
  if (!entries) return false;
  const idx = entries.findIndex(e => e.id === entryId);
  if (idx === -1) return false;
  entries.splice(idx, 1);
  return true;
}

// ---------------------------------------------------------------------------
// Get entries by question ID — used to check if student has prior errors on a question
// ---------------------------------------------------------------------------

export function getByQuestionId(userId: string, questionId: string): ErrorEntry[] {
  const store = getStore();
  const entries = store.entries.get(userId) ?? [];
  return entries.filter(e => e.questionId === questionId);
}

// ---------------------------------------------------------------------------
// Check resolution — if student got a similar question right recently,
// auto-resolve prior errors on that topic
// ---------------------------------------------------------------------------

export function checkAutoResolve(
  userId: string,
  subject: string,
  topic: string,
  questionId: string,
  correct: boolean,
): number {
  if (!correct) return 0;
  const store = getStore();
  const entries = store.entries.get(userId);
  if (!entries) return 0;
  let resolvedCount = 0;
  for (const e of entries) {
    if (!e.resolved && e.subject === subject && e.topic === topic && e.questionId !== questionId) {
      // Don't auto-resolve based on a single correct answer — only if the wrong entry is older than 3 days
      const ageDays = (Date.now() - new Date(e.timestamp).getTime()) / 86400000;
      if (ageDays >= 3) {
        e.resolved = true;
        e.reviewed = true;
        resolvedCount++;
      }
    }
  }
  return resolvedCount;
}
