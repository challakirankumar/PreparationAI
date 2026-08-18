// ============================================================================
// Item Response Theory (IRT) — Adaptive Mock Engine math core
// ----------------------------------------------------------------------------
// Implements the 3-parameter logistic (3PL) model:
//
//   P(correct | θ) = c + (1 - c) * 1 / (1 + exp(-a * (θ - b)))
//
// where:
//   θ (theta)   = student's latent ability, typically N(0,1) scaled
//   a           = item discrimination (slope at θ=b); higher = more discriminating
//   b           = item difficulty (location); matches θ scale (-3 to +3)
//   c           = pseudo-guessing parameter (lower asymptote); 0 for numerical,
//                 1/n_options for MCQ, ~0.1 for MSQ
//
// Fisher information:
//   I(θ) = a^2 * (1-P) / P * ((P - c) / (1 - c))^2
//
// Theta estimation: maximum likelihood via Newton-Raphson iteration
// (with simple prior smoothing for the first 2-3 responses).
// ============================================================================

export interface IrtItem {
  itemId: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  a: number; // discrimination (0.4 - 2.0 typical)
  b: number; // difficulty (-3 to +3, 0 = average)
  c: number; // guessing parameter (0 - 0.5)
  marks: number;
  negativeMarks: number;
}

export interface IrtResponse {
  itemId: string;
  correct: boolean;
  timeTakenSec: number;
  // Partial credit for MSQ-style questions (0..1)
  partial?: number;
  // Whether the student actually attempted (vs left blank)
  attempted: boolean;
}

// ---------------------------------------------------------------------------
// 3PL probability of correct response
// ---------------------------------------------------------------------------

export function pCorrect(theta: number, item: Pick<IrtItem, 'a' | 'b' | 'c'>): number {
  const { a, b, c } = item;
  // Numerical stability: clamp theta-item to ±35
  const z = Math.max(-35, Math.min(35, -a * (theta - b)));
  const p = c + (1 - c) / (1 + Math.exp(z));
  return Math.max(c, Math.min(1, p));
}

// ---------------------------------------------------------------------------
// Fisher information — how much an item tells us about θ
// ---------------------------------------------------------------------------

export function fisherInformation(theta: number, item: Pick<IrtItem, 'a' | 'b' | 'c'>): number {
  const { a, c } = item;
  const p = pCorrect(theta, item);
  if (p <= 0 || p >= 1) return 0;
  const q = 1 - p;
  // Standard 3PL Fisher info:
  //   I(θ) = a^2 * (1-p)/p * ((p-c)/(1-c))^2
  const ratio = (p - c) / (1 - c);
  return (a * a) * (q / p) * (ratio * ratio);
}

// ---------------------------------------------------------------------------
// Maximum likelihood theta estimation via Newton-Raphson
// Returns the most likely ability given the response pattern.
// Falls back to a Bayesian-like prior when responses are too few or all
// correct / all wrong (MLE diverges in those cases).
// ---------------------------------------------------------------------------

const THETA_PRIOR_MEAN = 0;
const THETA_PRIOR_SD = 1.5;
const THETA_MIN = -3;
const THETA_MAX = 3;

export function estimateTheta(responses: IrtResponse[], items: Map<string, IrtItem>): number {
  if (responses.length === 0) return THETA_PRIOR_MEAN;

  // Collect matched (response, item) pairs
  const pairs: { r: IrtResponse; i: IrtItem }[] = [];
  for (const r of responses) {
    const item = items.get(r.itemId);
    if (item) pairs.push({ r, i: item });
  }
  if (pairs.length === 0) return THETA_PRIOR_MEAN;

  // Edge case: all-correct or all-wrong → MLE diverges. Use a smoothed estimate.
  const allCorrect = pairs.every(p => p.r.correct);
  const allWrong = pairs.every(p => !p.r.correct);

  if (allCorrect || allWrong) {
    // Average item difficulties ± a fixed push
    const avgB = pairs.reduce((s, p) => s + p.i.b, 0) / pairs.length;
    const push = allCorrect ? 0.5 : -0.5;
    const smoothed = avgB + push * Math.sqrt(pairs.length);
    return clampTheta(smoothed);
  }

  // Newton-Raphson with prior smoothing (MAP-like)
  let theta = 0; // start at the prior mean
  const learnRate = 1.0;
  const iterations = 25;
  const eps = 1e-4;

  for (let iter = 0; iter < iterations; iter++) {
    let gradient = 0;
    let hessian = 0;
    for (const { r, i } of pairs) {
      const p = pCorrect(theta, i);
      if (p <= 0 || p >= 1) continue;
      const u = r.correct ? 1 : 0;
      // First derivative of log-likelihood for 3PL
      // dL/dθ = a * (u - p) * (p - c) / ((1 - c) * p)
      const dl = i.a * (u - p) * (p - i.c) / ((1 - i.c) * p);
      // Second derivative (approximate via Fisher)
      const info = fisherInformation(theta, i);
      gradient += dl;
      hessian -= info; // expected second derivative is negative Fisher
    }

    // Prior smoothing (Bayesian MAP): pull θ toward 0
    const priorGrad = -(theta - THETA_PRIOR_MEAN) / (THETA_PRIOR_SD * THETA_PRIOR_SD);
    const priorHess = -1 / (THETA_PRIOR_SD * THETA_PRIOR_SD);
    gradient += priorGrad;
    hessian += priorHess;

    if (Math.abs(hessian) < eps) break;
    const step = learnRate * (gradient / -hessian);
    const newTheta = clampTheta(theta + step);
    if (Math.abs(newTheta - theta) < eps) {
      theta = newTheta;
      break;
    }
    theta = newTheta;
  }
  return theta;
}

function clampTheta(t: number): number {
  return Math.max(THETA_MIN, Math.min(THETA_MAX, t));
}

// ---------------------------------------------------------------------------
// Standard Error of Measurement at current θ
//   SE(θ) = 1 / sqrt(Σ Fisher_info_i(θ))
// ---------------------------------------------------------------------------

export function standardError(theta: number, items: IrtItem[]): number {
  const totalInfo = items.reduce((s, i) => s + fisherInformation(theta, i), 0);
  if (totalInfo <= 0) return THETA_PRIOR_SD;
  return 1 / Math.sqrt(totalInfo);
}

// ---------------------------------------------------------------------------
// Next-item selection — maximum information criterion with topic-coverage
// constraint. Returns the item with the highest Fisher information at the
// student's current θ, among items they haven't seen yet.
// ---------------------------------------------------------------------------

export interface NextItemOptions {
  // Force the next item to come from one of these topics (if any remain).
  // Used to ensure topic coverage across the session.
  preferTopics?: string[];
  // Penalty weight applied to items whose topic has been over-represented.
  topicImbalancePenalty?: number;
  // Items already presented (skip these)
  seenItemIds?: Set<string>;
  // Topic-usage map: { topic: count } — used to balance coverage
  topicUsage?: Map<string, number>;
  // Maximum items from a single topic before forcing a switch
  maxPerTopic?: number;
}

export function pickNextItem(
  theta: number,
  pool: IrtItem[],
  opts: NextItemOptions = {},
): IrtItem | null {
  const seen = opts.seenItemIds ?? new Set<string>();
  const topicUsage = opts.topicUsage ?? new Map<string, number>();
  const maxPerTopic = opts.maxPerTopic ?? 3;

  const candidates = pool.filter(i => !seen.has(i.itemId));
  if (candidates.length === 0) return null;

  // Filter to preferred topics if specified AND there are candidates left
  let eligible = candidates;
  if (opts.preferTopics && opts.preferTopics.length > 0) {
    const preferred = candidates.filter(i => opts.preferTopics!.includes(i.topic));
    if (preferred.length > 0) eligible = preferred;
  }

  // Score each candidate: info minus imbalance penalty
  let best: IrtItem | null = null;
  let bestScore = -Infinity;
  for (const item of eligible) {
    const info = fisherInformation(theta, item);
    const usedCount = topicUsage.get(item.topic) ?? 0;
    // Soft penalty: if a topic has been used > maxPerTopic times, strongly demote it
    const penalty = usedCount > maxPerTopic
      ? (usedCount - maxPerTopic) * (opts.topicImbalancePenalty ?? 0.5)
      : 0;
    const score = info - penalty;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// IRT parameter estimation from existing question difficulty labels
// Maps the {easy, medium, hard} difficulty to b values on the standard scale.
// ---------------------------------------------------------------------------

const DIFFICULTY_TO_B: Record<string, number> = {
  easy: -1.0,
  medium: 0.0,
  hard: 1.2,
};

const DIFFICULTY_TO_B_JITTER: Record<string, [number, number]> = {
  easy: [-1.5, -0.5],
  medium: [-0.4, 0.6],
  hard: [0.7, 2.0],
};

export function difficultyToB(difficulty: 'easy' | 'medium' | 'hard'): number {
  const range = DIFFICULTY_TO_B_JITTER[difficulty];
  // Pseudo-random but deterministic-ish: use Math.random (fine for question gen)
  return range[0] + Math.random() * (range[1] - range[0]);
}

export function difficultyLabel(b: number): 'easy' | 'medium' | 'hard' {
  if (b < -0.3) return 'easy';
  if (b < 0.6) return 'medium';
  return 'hard';
}

// ---------------------------------------------------------------------------
// Discrimination estimation — conceptual / calculation-heavy topics get
// higher discrimination than recall-heavy ones.
// ---------------------------------------------------------------------------

const HIGH_DISCRIM_TOPICS = [
  'Calculus', 'Probability', 'Combinatorics', 'Coordinate Geometry',
  'Rotational Motion', 'Electromagnetism', 'Modern Physics', 'Thermodynamics',
  'Chemical Kinetics', 'Electrochemistry', 'Equilibrium',
  'Genetics', 'Human Physiology', 'Biotechnology',
  'Critical Reasoning', 'Reading Comprehension',
];

const LOW_DISCRIM_TOPICS = [
  'Number System', 'Geometry', 'Vocabulary', 'Grammar',
  'Plant Anatomy', 'Animal Kingdom', 'Biodiversity',
];

export function estimateDiscrimination(topic: string, qType: 'mcq' | 'msq' | 'numerical' | 'reading' | 'descriptive'): number {
  let base = 1.0; // default moderate discrimination
  if (HIGH_DISCRIM_TOPICS.includes(topic)) base = 1.4;
  else if (LOW_DISCRIM_TOPICS.includes(topic)) base = 0.7;
  // Numerical and MSQ are intrinsically more discriminating (less guessing)
  if (qType === 'numerical' || qType === 'msq') base *= 1.15;
  // Reading comprehension has more variance per item
  if (qType === 'reading') base *= 0.9;
  // Add small jitter to avoid identical a values
  return Math.max(0.4, Math.min(2.0, base + (Math.random() - 0.5) * 0.2));
}

// ---------------------------------------------------------------------------
// Guessing parameter estimation based on question type
// ---------------------------------------------------------------------------

export function estimateGuessing(qType: 'mcq' | 'msq' | 'numerical' | 'reading' | 'descriptive', nOptions = 4): number {
  switch (qType) {
    case 'mcq': return 1 / Math.max(2, nOptions);     // typical: 0.25 for 4-option MCQ
    case 'reading': return 1 / Math.max(2, nOptions);
    case 'msq': return 0.08;                            // MSQ much harder to guess
    case 'numerical': return 0;                         // effectively 0
    case 'descriptive': return 0;
    default: return 0.25;
  }
}

// ---------------------------------------------------------------------------
// Conversion utilities — map θ (IRT scale) to human-friendly scale (0-100)
// and to percentile (assuming θ ~ N(0,1) in the population)
// ---------------------------------------------------------------------------

export function thetaToScorePct(theta: number): number {
  // Linear map: θ=-3 → 0%, θ=0 → 50%, θ=+3 → 100%
  const pct = ((theta + 3) / 6) * 100;
  return Math.round(Math.max(0, Math.min(100, pct)));
}

export function thetaToPercentile(theta: number): number {
  // Standard normal CDF approximation (Abramowitz & Stegun 26.2.17)
  const t = Math.max(-3.5, Math.min(3.5, theta));
  const phi = 0.5 * (1 + erf(t / Math.SQRT2));
  return Math.round(phi * 100);
}

function erf(x: number): number {
  // Abramowitz & Stegun 7.1.26 approximation
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

// ---------------------------------------------------------------------------
// Adaptive session state — used by the session manager + API
// ---------------------------------------------------------------------------

export type AdaptivePhase = 'warmup' | 'targeting' | 'converging' | 'locked';

export interface AdaptiveSessionState {
  sessionId: string;
  userId?: string;
  examId: string;
  examName: string;
  startedAt: string;
  lastActivityAt: string;
  // All items in the pool (large)
  itemPool: IrtItem[];
  // Items already presented (in order)
  presentedItems: IrtItem[];
  // Student responses (matched by itemId)
  responses: IrtResponse[];
  // Current theta estimate (updated after each response)
  currentTheta: number;
  // Standard error at current theta
  currentSE: number;
  // Adaptive phase (drives max-items policy)
  phase: AdaptivePhase;
  // Max items the session will present before forcing termination
  maxItems: number;
  // Min items before early-termination is allowed
  minItems: number;
  // Termination threshold: if SE falls below this, session is done
  seTerminationThreshold: number;
  // Topic usage map (for coverage balancing)
  topicUsage: Record<string, number>;
  // Subject usage map (for cross-subject balance)
  subjectUsage: Record<string, number>;
  // Theta history (snapshot after each response) for the final report
  thetaHistory: { itemIndex: number; theta: number; se: number }[];
  // Whether the session has been terminated (manually or by SE threshold)
  terminated: boolean;
  terminationReason?: string;
}

// ---------------------------------------------------------------------------
// Phase policy — drives what the engine prioritises at each stage
// ---------------------------------------------------------------------------

export function computePhase(
  itemsPresented: number,
  currentSE: number,
  minItems: number,
  maxItems: number,
  seThreshold: number,
): AdaptivePhase {
  if (itemsPresented >= maxItems) return 'locked';
  if (itemsPresented < 3) return 'warmup';
  if (itemsPresented >= minItems && currentSE < seThreshold) return 'converging';
  return 'targeting';
}

export function shouldTerminate(state: AdaptiveSessionState): { terminate: boolean; reason?: string } {
  if (state.terminated) return { terminate: true, reason: state.terminationReason ?? 'Already terminated' };
  if (state.presentedItems.length >= state.maxItems) {
    return { terminate: true, reason: `Reached max items (${state.maxItems})` };
  }
  if (state.presentedItems.length >= state.minItems && state.currentSE < state.seTerminationThreshold) {
    return { terminate: true, reason: `Converged — SE ${state.currentSE.toFixed(2)} < ${state.seTerminationThreshold}` };
  }
  return { terminate: false };
}

// ---------------------------------------------------------------------------
// Difficulty bias — in the warmup phase we want items near θ=0 (broad search);
// in targeting we want items near current θ; in converging we want high-info
// items at θ regardless of topic.
// ---------------------------------------------------------------------------

export function effectiveTheta(state: AdaptiveSessionState): number {
  switch (state.phase) {
    case 'warmup': return 0;                       // probe average difficulty
    case 'targeting': return state.currentTheta;   // zero-in on student's level
    case 'converging': return state.currentTheta;  // tighten SE
    case 'locked': return state.currentTheta;
    default: return state.currentTheta;
  }
}

// ---------------------------------------------------------------------------
// Final adaptive score computation
// ---------------------------------------------------------------------------

export interface AdaptiveFinalScore {
  finalTheta: number;
  finalSE: number;
  scorePct: number;
  percentile: number;
  totalItems: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  avgTimePerQuestionSec: number;
  thetaProgression: { itemIndex: number; theta: number; se: number; correct: boolean }[];
  subjectBreakdown: { subject: string; total: number; correct: number; avgTheta: number }[];
  topicBreakdown: { subject: string; topic: string; total: number; correct: number; avgB: number }[];
}

export function computeFinalScore(state: AdaptiveSessionState): AdaptiveFinalScore {
  const itemsById = new Map(state.itemPool.map(i => [i.itemId, i]));
  const finalTheta = state.currentTheta;
  const finalSE = state.currentSE;
  const scorePct = thetaToScorePct(finalTheta);
  const percentile = thetaToPercentile(finalTheta);

  const correctCount = state.responses.filter(r => r.correct).length;
  const wrongCount = state.responses.filter(r => r.attempted && !r.correct).length;
  const unattemptedCount = state.responses.filter(r => !r.attempted).length;
  const totalItems = state.presentedItems.length;
  const avgTimePerQuestionSec = totalItems > 0
    ? Math.round(state.responses.reduce((s, r) => s + r.timeTakenSec, 0) / totalItems)
    : 0;

  const thetaProgression = state.presentedItems.map((item, idx) => {
    const resp = state.responses.find(r => r.itemId === item.itemId);
    const h = state.thetaHistory[idx];
    return {
      itemIndex: idx + 1,
      theta: h?.theta ?? finalTheta,
      se: h?.se ?? finalSE,
      correct: resp?.correct ?? false,
    };
  });

  // Subject breakdown
  const subjectMap: Record<string, { total: number; correct: number; sumTheta: number }> = {};
  for (const item of state.presentedItems) {
    if (!subjectMap[item.subject]) subjectMap[item.subject] = { total: 0, correct: 0, sumTheta: 0 };
    subjectMap[item.subject].total++;
    const resp = state.responses.find(r => r.itemId === item.itemId);
    if (resp?.correct) subjectMap[item.subject].correct++;
    subjectMap[item.subject].sumTheta += item.b; // average difficulty of items in this subject
  }
  const subjectBreakdown = Object.entries(subjectMap).map(([subject, s]) => ({
    subject,
    total: s.total,
    correct: s.correct,
    avgTheta: s.total > 0 ? s.sumTheta / s.total : 0,
  }));

  // Topic breakdown
  const topicMap: Record<string, { subject: string; topic: string; total: number; correct: number; sumB: number }> = {};
  for (const item of state.presentedItems) {
    const key = `${item.subject}|${item.topic}`;
    if (!topicMap[key]) topicMap[key] = { subject: item.subject, topic: item.topic, total: 0, correct: 0, sumB: 0 };
    topicMap[key].total++;
    const resp = state.responses.find(r => r.itemId === item.itemId);
    if (resp?.correct) topicMap[key].correct++;
    topicMap[key].sumB += item.b;
  }
  const topicBreakdown = Object.values(topicMap).map(t => ({
    subject: t.subject,
    topic: t.topic,
    total: t.total,
    correct: t.correct,
    avgB: t.total > 0 ? t.sumB / t.total : 0,
  }));

  return {
    finalTheta,
    finalSE,
    scorePct,
    percentile,
    totalItems,
    correctCount,
    wrongCount,
    unattemptedCount,
    avgTimePerQuestionSec,
    thetaProgression,
    subjectBreakdown,
    topicBreakdown,
  };
}
