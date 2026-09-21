// ============================================================================
// Error Journal — Taxonomy + Classifier
// ----------------------------------------------------------------------------
// Tags every wrong answer by root cause. Four root causes:
//   1. CARELESS         — knew the concept, attention lapse (typos, misread options)
//   2. CONCEPTUAL       — wrong mental model, doesn't understand the underlying concept
//   3. TIME_PRESSURE    — ran out of time, guessed quickly or skipped
//   4. SILLY_ARITHMETIC — right concept, right setup, arithmetic slip
//
// Detection signals (heuristic, refined by LLM when available):
//   - timeTakenSec vs question difficulty → time-pressure flag
//   - answer near-correct value (within 5%) → silly-arithmetic flag
//   - student picked a "distractor" option → conceptual flag
//   - student selected "unanswered" → time-pressure or careless flag
//   - student has history of similar wrong answers in same topic → conceptual flag
// ============================================================================

export type ErrorRootCause =
  | 'careless'
  | 'conceptual'
  | 'time_pressure'
  | 'silly_arithmetic'
  | 'factual_recall'
  | 'unclassified';

export interface ErrorEntry {
  id: string;
  userId: string;
  // Source context
  source: 'mock-exam' | 'battle' | 'adaptive' | 'manual';
  sourceId?: string;             // battleId, attemptId, sessionId
  // Question context
  examId: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  questionId: string;
  options?: string[];
  correctOptions?: number[];
  correctNumeric?: number;
  // Student's wrong answer
  studentAnswer?: string;          // human-readable
  studentOptionIndex?: number;
  studentNumeric?: number;
  timeTakenSec: number;
  // Classification
  rootCause: ErrorRootCause;
  rootCauseConfidence: number;    // 0-1
  rootCauseEvidence: string;       // 1-sentence why this root cause was chosen
  // Optional: AI-generated explanation of the misconception
  aiExplanation?: string;
  // Metadata
  timestamp: string;               // when the mistake was made
  ingestedAt: string;              // when the journal entry was created
  // Tracking
  reviewed: boolean;               // student has marked this as reviewed
  resolved: boolean;               // student has demonstrated mastery (e.g. got similar question right later)
}

// ---------------------------------------------------------------------------
// Heuristic classifier — uses time taken, answer distance, and topic history
// ---------------------------------------------------------------------------

export interface ClassificationContext {
  timeTakenSec: number;
  timeLimitSec?: number;          // if from a timed context (battle, mock)
  difficulty: 'easy' | 'medium' | 'hard';
  correctOptions?: number[];
  correctNumeric?: number;
  studentOptionIndex?: number;
  studentNumeric?: number;
  options?: string[];
  // Has the student previously made similar errors in this topic?
  priorErrorsInTopic: number;
  // Has the student previously made similar errors of this type (any topic)?
  priorErrorsOfType: Partial<Record<ErrorRootCause, number>>;
}

interface ClassificationResult {
  rootCause: ErrorRootCause;
  confidence: number;
  evidence: string;
}

const NEAR_MISS_TOLERANCE = 0.05;  // 5% of correct value counts as "near-miss"

// "Distractor" options are typically those that look plausible but are wrong.
// Heuristic: if the chosen wrong option shares keywords with the correct option text.
function isDistractorChoice(
  options: string[] | undefined,
  correctIdx: number | undefined,
  studentIdx: number | undefined,
): boolean {
  if (!options || correctIdx === undefined || studentIdx === undefined) return false;
  if (correctIdx === studentIdx) return false;
  if (correctIdx >= options.length || studentIdx >= options.length) return false;
  const correctText = options[correctIdx].toLowerCase();
  const studentText = options[studentIdx].toLowerCase();
  // Check for shared significant words
  const correctWords = new Set(correctText.split(/\s+/).filter(w => w.length > 3));
  const studentWords = studentText.split(/\s+/).filter(w => w.length > 3);
  const overlap = studentWords.filter(w => correctWords.has(w)).length;
  return overlap >= 2;
}

function isNearMissArithmetic(
  correctNumeric: number | undefined,
  studentNumeric: number | undefined,
): boolean {
  if (correctNumeric === undefined || studentNumeric === undefined) return false;
  if (correctNumeric === 0) {
    // For zero, near-miss = exact match (so any non-zero is NOT near-miss)
    return studentNumeric === 0;
  }
  const relError = Math.abs((studentNumeric - correctNumeric) / correctNumeric);
  return relError > 0 && relError <= NEAR_MISS_TOLERANCE;
}

// ---------------------------------------------------------------------------
// Main classifier — runs heuristics in priority order
// ---------------------------------------------------------------------------

export function classifyError(ctx: ClassificationContext): ClassificationResult {
  const {
    timeTakenSec,
    timeLimitSec,
    difficulty,
    correctOptions,
    correctNumeric,
    studentOptionIndex,
    studentNumeric,
    options,
    priorErrorsInTopic,
    priorErrorsOfType,
  } = ctx;

  const candidates: { cause: ErrorRootCause; score: number; evidence: string }[] = [];

  // --- Signal 1: Time pressure ---
  // If timeLimitSec is set and student used < 30% of the time → time pressure / guessed quickly
  // OR if no timeLimit but time taken is < 10s for a medium/hard question → guessed
  if (timeLimitSec !== undefined) {
    const timeRatio = timeTakenSec / timeLimitSec;
    if (timeRatio < 0.2) {
      candidates.push({
        cause: 'time_pressure',
        score: 0.85,
        evidence: `Used only ${(timeRatio * 100).toFixed(0)}% of allotted time (${timeTakenSec.toFixed(1)}s of ${timeLimitSec}s) — likely guessed under pressure.`,
      });
    } else if (timeRatio < 0.4 && (difficulty === 'hard' || difficulty === 'medium')) {
      candidates.push({
        cause: 'time_pressure',
        score: 0.55,
        evidence: `Used ${(timeRatio * 100).toFixed(0)}% of allotted time — possibly rushed for a ${difficulty} question.`,
      });
    }
  } else {
    // No explicit time limit — use absolute threshold
    if (timeTakenSec < 8 && (difficulty === 'hard' || difficulty === 'medium')) {
      candidates.push({
        cause: 'time_pressure',
        score: 0.7,
        evidence: `Answered in ${timeTakenSec.toFixed(1)}s — too quick for a ${difficulty} question, likely a rushed guess.`,
      });
    }
  }

  // --- Signal 2: Skipped (unanswered) ---
  if (studentOptionIndex === undefined && studentNumeric === undefined) {
    candidates.push({
      cause: 'time_pressure',
      score: 0.9,
      evidence: 'Question was left unanswered — ran out of time or skipped.',
    });
  }

  // --- Signal 3: Near-miss arithmetic ---
  if (isNearMissArithmetic(correctNumeric, studentNumeric)) {
    candidates.push({
      cause: 'silly_arithmetic',
      score: 0.85,
      evidence: `Answer ${studentNumeric} is within ${NEAR_MISS_TOLERANCE * 100}% of correct ${correctNumeric} — likely an arithmetic slip (sign, decimal, multiplication).`,
    });
  }

  // --- Signal 4: Distractor choice ---
  if (correctOptions && correctOptions.length > 0 && studentOptionIndex !== undefined) {
    const correctIdx = correctOptions[0];
    if (isDistractorChoice(options, correctIdx, studentOptionIndex)) {
      candidates.push({
        cause: 'conceptual',
        score: 0.75,
        evidence: 'Chosen option looks plausible (shares keywords with correct option) — indicates a partial-but-incomplete conceptual model.',
      });
    }
  }

  // --- Signal 5: Recurring errors in same topic → conceptual ---
  if (priorErrorsInTopic >= 2) {
    candidates.push({
      cause: 'conceptual',
      score: 0.5 + Math.min(0.4, priorErrorsInTopic * 0.1),
      evidence: `Student has made ${priorErrorsInTopic} prior errors in this topic — recurring pattern indicates a conceptual gap, not a one-off slip.`,
    });
  }

  // --- Signal 6: Recurring errors of same type → amplify ---
  // If student has 3+ careless errors historically, lean toward careless
  const carelessHistory = priorErrorsOfType['careless'] ?? 0;
  if (carelessHistory >= 3 && timeTakenSec > 15 && difficulty !== 'hard') {
    candidates.push({
      cause: 'careless',
      score: 0.55,
      evidence: `No specific structural error detected, but student has ${carelessHistory} prior careless errors — pattern suggests attention lapse.`,
    });
  }

  // --- Signal 7: Easy question wrong → careless (default) ---
  if (difficulty === 'easy' && timeTakenSec > 10) {
    candidates.push({
      cause: 'careless',
      score: 0.5,
      evidence: `Easy question answered wrong with adequate time (${timeTakenSec.toFixed(1)}s) — likely attention lapse (misread option, typo).`,
    });
  }

  // --- Signal 8: Default → conceptual ---
  // If nothing else fired, default to conceptual (the student doesn't understand the concept)
  if (candidates.length === 0) {
    candidates.push({
      cause: 'conceptual',
      score: 0.4,
      evidence: 'No specific structural signal detected — defaulting to conceptual gap.',
    });
  }

  // Pick the highest-scoring candidate
  candidates.sort((a, b) => b.score - a.score);
  const winner = candidates[0];
  return {
    rootCause: winner.cause,
    confidence: winner.score,
    evidence: winner.evidence,
  };
}

// ---------------------------------------------------------------------------
// Root cause display metadata
// ---------------------------------------------------------------------------

export const ROOT_CAUSE_META: Record<ErrorRootCause, {
  label: string;
  color: string;
  bgClass: string;
  icon: string;
  description: string;
  recommendation: string;
}> = {
  careless: {
    label: 'Careless',
    color: 'text-amber-700',
    bgClass: 'bg-amber-50 border-amber-200',
    icon: '⚠',
    description: 'You knew the concept but made an attention lapse — misread option, typo, or skipped a step.',
    recommendation: 'Slow down on easy questions, double-check your selected option, and read the question stem twice before answering.',
  },
  conceptual: {
    label: 'Conceptual',
    color: 'text-rose-700',
    bgClass: 'bg-rose-50 border-rose-200',
    icon: '✗',
    description: 'Your mental model is incorrect or incomplete — the underlying concept isn\'t clear.',
    recommendation: 'Revisit the topic from NCERT/basics. Watch a concept video, then re-attempt similar problems until you can explain it in your own words.',
  },
  time_pressure: {
    label: 'Time Pressure',
    color: 'text-orange-700',
    bgClass: 'bg-orange-50 border-orange-200',
    icon: '⏱',
    description: 'You ran out of time — guessed quickly or skipped the question entirely.',
    recommendation: 'Practise timed mocks to build pace. Learn to flag and skip hard questions early, returning only if time permits.',
  },
  silly_arithmetic: {
    label: 'Silly Arithmetic',
    color: 'text-purple-700',
    bgClass: 'bg-purple-50 border-purple-200',
    icon: '∑',
    description: 'Right concept, right setup — but an arithmetic slip (sign error, decimal, multiplication).',
    recommendation: 'Show every calculation step on paper. Re-check sign and decimal placement before submitting. Drill mental-math basics daily.',
  },
  factual_recall: {
    label: 'Factual Recall',
    color: 'text-blue-700',
    bgClass: 'bg-blue-50 border-blue-200',
    icon: 'i',
    description: 'You forgot a key formula, constant, or definition.',
    recommendation: 'Make flashcards for formulas and constants. Use spaced repetition (Anki or similar) to lock them into long-term memory.',
  },
  unclassified: {
    label: 'Unclassified',
    color: 'text-stone-700',
    bgClass: 'bg-stone-50 border-stone-200',
    icon: '?',
    description: 'The engine could not confidently categorise this error. Review manually.',
    recommendation: 'Look at the question and your answer carefully — try to identify what went wrong. Mark as reviewed once you understand.',
  },
};

// ---------------------------------------------------------------------------
// Pattern aggregation — used to build the personal mistake-pattern report
// ---------------------------------------------------------------------------

export interface TopicPattern {
  subject: string;
  topic: string;
  totalErrors: number;
  byCause: Record<ErrorRootCause, number>;
  dominantCause: ErrorRootCause;
  lastErrorAt: string;
  // Has the student made progress (resolved some entries)?
  resolvedCount: number;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface ErrorPatternReport {
  userId: string;
  totalEntries: number;
  totalReviewed: number;
  totalResolved: number;
  byCause: Record<ErrorRootCause, { count: number; percentage: number }>;
  dominantCause: ErrorRootCause;
  topWeakTopics: TopicPattern[];          // top 5 by error count
  recurringErrors: ErrorEntry[];          // entries that match an unresolved prior error in same topic
  recentEntries: ErrorEntry[];            // last 10 entries
  // Weekly trend (last 8 weeks of error count)
  weeklyTrend: { weekStart: string; count: number; careless: number; conceptual: number; time_pressure: number; silly_arithmetic: number }[];
  // Estimated readiness impact: % of unresolved conceptual errors
  readinessImpact: number;
  generatedAt: string;
}

export function computePatternReport(
  userId: string,
  entries: ErrorEntry[],
): ErrorPatternReport {
  const totalEntries = entries.length;
  const totalReviewed = entries.filter(e => e.reviewed).length;
  const totalResolved = entries.filter(e => e.resolved).length;

  // By cause
  const causeCounts: Record<ErrorRootCause, number> = {
    careless: 0,
    conceptual: 0,
    time_pressure: 0,
    silly_arithmetic: 0,
    factual_recall: 0,
    unclassified: 0,
  };
  for (const e of entries) {
    causeCounts[e.rootCause]++;
  }
  const byCause: Record<ErrorRootCause, { count: number; percentage: number }> = {
    careless: { count: causeCounts.careless, percentage: totalEntries > 0 ? Math.round((causeCounts.careless / totalEntries) * 100) : 0 },
    conceptual: { count: causeCounts.conceptual, percentage: totalEntries > 0 ? Math.round((causeCounts.conceptual / totalEntries) * 100) : 0 },
    time_pressure: { count: causeCounts.time_pressure, percentage: totalEntries > 0 ? Math.round((causeCounts.time_pressure / totalEntries) * 100) : 0 },
    silly_arithmetic: { count: causeCounts.silly_arithmetic, percentage: totalEntries > 0 ? Math.round((causeCounts.silly_arithmetic / totalEntries) * 100) : 0 },
    factual_recall: { count: causeCounts.factual_recall, percentage: totalEntries > 0 ? Math.round((causeCounts.factual_recall / totalEntries) * 100) : 0 },
    unclassified: { count: causeCounts.unclassified, percentage: totalEntries > 0 ? Math.round((causeCounts.unclassified / totalEntries) * 100) : 0 },
  };
  const dominantCause = (Object.entries(causeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unclassified') as ErrorRootCause;

  // Topic patterns
  const topicMap = new Map<string, ErrorEntry[]>();
  for (const e of entries) {
    const key = `${e.subject}|${e.topic}`;
    if (!topicMap.has(key)) topicMap.set(key, []);
    topicMap.get(key)!.push(e);
  }
  const topicPatterns: TopicPattern[] = [];
  for (const [key, topicEntries] of topicMap.entries()) {
    const [subject, topic] = key.split('|');
    const byCause: Record<ErrorRootCause, number> = {
      careless: 0, conceptual: 0, time_pressure: 0, silly_arithmetic: 0, factual_recall: 0, unclassified: 0,
    };
    for (const e of topicEntries) byCause[e.rootCause]++;
    const dominant = (Object.entries(byCause).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unclassified') as ErrorRootCause;
    const resolvedCount = topicEntries.filter(e => e.resolved).length;
    // Trend: compare first-half vs second-half of entries
    const sortedByDate = [...topicEntries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const halfIdx = Math.floor(sortedByDate.length / 2);
    const firstHalf = sortedByDate.slice(0, halfIdx);
    const secondHalf = sortedByDate.slice(halfIdx);
    const firstRate = firstHalf.length > 0 ? firstHalf.filter(e => !e.resolved).length / firstHalf.length : 0;
    const secondRate = secondHalf.length > 0 ? secondHalf.filter(e => !e.resolved).length / secondHalf.length : 0;
    const trend: 'improving' | 'stable' | 'worsening' =
      secondRate < firstRate - 0.15 ? 'improving' :
      secondRate > firstRate + 0.15 ? 'worsening' : 'stable';
    topicPatterns.push({
      subject, topic,
      totalErrors: topicEntries.length,
      byCause,
      dominantCause: dominant,
      lastErrorAt: topicEntries[topicEntries.length - 1].timestamp,
      resolvedCount,
      trend,
    });
  }
  topicPatterns.sort((a, b) => b.totalErrors - a.totalErrors);
  const topWeakTopics = topicPatterns.slice(0, 5);

  // Recurring errors — entries that match an unresolved prior error in the same topic
  const recurringErrors: ErrorEntry[] = [];
  const byTopicDate = new Map<string, ErrorEntry[]>();
  for (const e of entries) {
    const key = `${e.subject}|${e.topic}`;
    if (!byTopicDate.has(key)) byTopicDate.set(key, []);
    byTopicDate.get(key)!.push(e);
  }
  for (const [key, topicEntries] of byTopicDate.entries()) {
    const sorted = [...topicEntries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    for (let i = 1; i < sorted.length; i++) {
      // If the prior entry is unresolved AND the current entry has the same root cause
      if (!sorted[i - 1].resolved && sorted[i].rootCause === sorted[i - 1].rootCause) {
        recurringErrors.push(sorted[i]);
      }
    }
  }

  // Recent entries (last 10)
  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  // Weekly trend (last 8 weeks)
  const weeklyTrend: { weekStart: string; count: number; careless: number; conceptual: number; time_pressure: number; silly_arithmetic: number }[] = [];
  const now = new Date();
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (w * 7 + now.getDay()));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const weekEntries = entries.filter(e => {
      const d = new Date(e.timestamp);
      return d >= weekStart && d < weekEnd;
    });
    weeklyTrend.push({
      weekStart: weekStart.toISOString().slice(0, 10),
      count: weekEntries.length,
      careless: weekEntries.filter(e => e.rootCause === 'careless').length,
      conceptual: weekEntries.filter(e => e.rootCause === 'conceptual').length,
      time_pressure: weekEntries.filter(e => e.rootCause === 'time_pressure').length,
      silly_arithmetic: weekEntries.filter(e => e.rootCause === 'silly_arithmetic').length,
    });
  }

  // Readiness impact: % of unresolved conceptual errors
  const unresolvedConceptual = entries.filter(e => !e.resolved && e.rootCause === 'conceptual').length;
  const readinessImpact = totalEntries > 0 ? Math.round((unresolvedConceptual / totalEntries) * 100) : 0;

  return {
    userId,
    totalEntries,
    totalReviewed,
    totalResolved,
    byCause,
    dominantCause,
    topWeakTopics,
    recurringErrors: recurringErrors.slice(0, 10),
    recentEntries,
    weeklyTrend,
    readinessImpact,
    generatedAt: new Date().toISOString(),
  };
}
