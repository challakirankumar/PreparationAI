// ============================================================================
// PYQ Trend Engine — computes appearance probability and trend signals
// ----------------------------------------------------------------------------
// For each (subject, topic) in an exam's PYQ history, computes:
//
//   - appearanceProb    : 0-100% predicted probability for upcoming exam
//   - recentFrequency   : avg questions/year over last 3 years
//   - lifetimeFrequency : avg questions/year over all years
//   - momentum          : 'rising' | 'stable' | 'declining' | 'emerging'
//   - weightTrend       : recent weight % vs lifetime weight %
//   - lastAppearedYear  : most recent year appeared
//   - yearCount         : distinct years appeared
//   - sessionsCount     : total sessions appeared in
//   - predictedNextCount: predicted question count for next exam (integer)
//   - predictedWeight   : predicted weight %
//   - confidenceScore   : 0-1 how confident we are in the prediction
//   - difficultyTrend   : 'easier' | 'same' | 'harder' compared to historical
// ============================================================================

import type { PyqRecord, PyqExamData, DifficultyBand } from './pyq-data';

export type TrendMomentum = 'rising' | 'stable' | 'declining' | 'emerging' | 'dormant';

export interface TopicTrend {
  examId: string;
  subject: string;
  topic: string;
  // Yearly question counts (sorted ascending by year)
  yearlyData: { year: number; totalQuestions: number; sessions: number; avgWeightPct: number; avgDifficulty: DifficultyBand }[];
  // Computed signals
  appearanceProb: number;          // 0-100
  predictedNextCount: number;
  predictedWeightPct: number;
  recentFrequency: number;         // avg Q/year over last 3 years
  lifetimeFrequency: number;       // avg Q/year over all years
  momentum: TrendMomentum;
  momentumScore: number;            // -1 (steep decline) to +1 (steep rise)
  weightTrend: number;             // recentWeight - lifetimeWeight (pct points)
  lastAppearedYear: number | null;
  firstAppearedYear: number | null;
  yearCount: number;               // distinct years with ≥1 question
  sessionsCount: number;           // total sessions with ≥1 question
  confidenceScore: number;         // 0-1
  difficultyTrend: 'easier' | 'same' | 'harder';
  // Heatmap row: years × appearance count
  heatmap: { year: number; questionCount: number }[];
}

export interface ExamTrendReport {
  examId: string;
  examName: string;
  yearsCovered: [number, number];
  totalPapers: number;
  topicTrends: TopicTrend[];
  // Aggregated views
  hotTopics: TopicTrend[];          // top 10 by appearanceProb
  watchList: TopicTrend[];         // declining topics with >0 historical weight
  emergingTopics: TopicTrend[];    // rising or emerging
  subjectBreakdown: {
    subject: string;
    totalTopics: number;
    avgAppearanceProb: number;
    totalPredictedQuestions: number;
  }[];
}

// ---------------------------------------------------------------------------
// Difficulty scoring — easier=1, medium=2, hard=3, mixed=2 (numeric scale)
// ---------------------------------------------------------------------------

function difficultyScore(d: DifficultyBand): number {
  switch (d) {
    case 'easy': return 1;
    case 'medium': return 2;
    case 'hard': return 3;
    case 'mixed': return 2;
  }
}

// ---------------------------------------------------------------------------
// Linear regression slope — used to detect trend direction
// Returns slope (per year). Positive = rising, negative = declining.
// ---------------------------------------------------------------------------

function linearRegressionSlope(ys: number[], xs: number[]): number {
  if (ys.length < 2) return 0;
  const n = ys.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumXX = xs.reduce((s, x) => s + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

// ---------------------------------------------------------------------------
// Exponential weighted moving average — recent observations count more
// ---------------------------------------------------------------------------

function ewma(values: number[], alpha = 0.4): number {
  if (values.length === 0) return 0;
  let acc = values[0];
  for (let i = 1; i < values.length; i++) {
    acc = alpha * values[i] + (1 - alpha) * acc;
  }
  return acc;
}

// ---------------------------------------------------------------------------
// Compute trends for one topic
// ---------------------------------------------------------------------------

function computeTopicTrend(examId: string, subject: string, topic: string, records: PyqRecord[], yearsCovered: [number, number]): TopicTrend {
  // Aggregate per year
  const [startYear, endYear] = yearsCovered;
  const yearlyMap = new Map<number, { totalQuestions: number; sessions: Set<string>; weights: number[]; difficulties: DifficultyBand[] }>();

  for (const r of records) {
    if (r.subject !== subject || r.topic !== topic) continue;
    if (!yearlyMap.has(r.year)) {
      yearlyMap.set(r.year, { totalQuestions: 0, sessions: new Set(), weights: [], difficulties: [] });
    }
    const entry = yearlyMap.get(r.year)!;
    entry.totalQuestions += r.questionCount;
    entry.sessions.add(r.session);
    entry.weights.push(r.weightPct);
    entry.difficulties.push(r.avgDifficulty);
  }

  // Build yearly data array (sorted ascending)
  const yearlyData = Array.from(yearlyMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, e]) => {
      const avgDifficulty = e.difficulties.length > 0
        ? modeDifficulty(e.difficulties)
        : 'medium';
      return {
        year,
        totalQuestions: e.totalQuestions,
        sessions: e.sessions.size,
        avgWeightPct: e.weights.reduce((a, b) => a + b, 0) / Math.max(1, e.weights.length),
        avgDifficulty,
      };
    });

  // Build full heatmap (years not present have 0)
  const heatmap: { year: number; questionCount: number }[] = [];
  for (let y = startYear; y <= endYear; y++) {
    const entry = yearlyData.find(d => d.year === y);
    heatmap.push({ year: y, questionCount: entry?.totalQuestions ?? 0 });
  }

  // Compute signals
  const allYears = heatmap.map(h => h.year);
  const allCounts = heatmap.map(h => h.questionCount);
  const nonzeroCounts = allCounts.filter(c => c > 0);

  // Lifetime frequency (per year)
  const lifetimeFrequency = allCounts.reduce((a, b) => a + b, 0) / Math.max(1, allCounts.length);

  // Recent frequency (last 3 years)
  const recent3 = allCounts.slice(-3);
  const recentFrequency = recent3.reduce((a, b) => a + b, 0) / Math.max(1, recent3.length);

  // Slope via linear regression
  const slope = linearRegressionSlope(allCounts, allYears);
  const normalizedSlope = Math.max(-1, Math.min(1, slope / Math.max(0.1, lifetimeFrequency)));

  // EWMA prediction — gives more weight to recent years
  const ewmaValue = ewma(allCounts, 0.4);
  const predictedNextCount = Math.max(0, Math.round(ewmaValue));

  // Weight trend
  const recentWeight = recent3.length > 0 ? yearlyData.slice(-3).reduce((s, d) => s + d.avgWeightPct, 0) / recent3.length : 0;
  const lifetimeWeight = yearlyData.length > 0 ? yearlyData.reduce((s, d) => s + d.avgWeightPct, 0) / yearlyData.length : 0;
  const weightTrend = recentWeight - lifetimeWeight;

  // Predicted weight %
  const predictedWeightPct = Math.round(predictedNextCount * (lifetimeWeight / Math.max(0.1, lifetimeFrequency)) * 10) / 10;

  // Last / first appeared
  const lastAppearedYear = nonzeroCounts.length > 0
    ? allYears[allYears.length - 1 - recent3.reverse().findIndex(c => c > 0)]
    : null;
  // Simpler: find latest year with count > 0
  const lastNonzeroIdx = allCounts.reduce((lastIdx: number | null, c, idx) => c > 0 ? idx : lastIdx, null);
  const firstNonzeroIdx = allCounts.findIndex(c => c > 0);
  const lastYear = lastNonzeroIdx !== null ? allYears[lastNonzeroIdx] : null;
  const firstYear = firstNonzeroIdx >= 0 ? allYears[firstNonzeroIdx] : null;
  void lastAppearedYear;

  // Year count and sessions count
  const yearCount = nonzeroCounts.length;
  const sessionsCount = yearlyData.reduce((s, d) => s + d.sessions, 0);

  // Momentum classification
  let momentum: TrendMomentum;
  if (yearCount === 0) {
    momentum = 'dormant';
  } else if (yearCount === 1 && lastYear !== null && lastYear >= endYear - 1) {
    momentum = 'emerging';
  } else if (slope > 0.3 && recentFrequency > lifetimeFrequency * 1.15) {
    momentum = 'rising';
  } else if (slope < -0.3 && recentFrequency < lifetimeFrequency * 0.7) {
    momentum = 'declining';
  } else {
    momentum = 'stable';
  }

  // Appearance probability — blend of:
  //   - lifetime presence rate (% of years topic appeared)
  //   - recent presence rate (last 3 years)
  //   - momentum bonus (rising +10, declining -15, emerging +20 if recent)
  const lifetimePresenceRate = yearCount / allYears.length;
  const recentPresenceRate = recent3.filter(c => c > 0).length / recent3.length;
  let prob = (lifetimePresenceRate * 0.35 + recentPresenceRate * 0.65) * 100;
  const momentumBonus: Record<TrendMomentum, number> = {
    rising: 12,
    emerging: 18,
    stable: 0,
    declining: -15,
    dormant: -25,
  };
  prob += momentumBonus[momentum];
  // Clamp to 0-95 (we never predict 100% — there's always surprise potential)
  const appearanceProb = Math.max(0, Math.min(95, Math.round(prob)));

  // Confidence — based on sample size and consistency
  //   More sessions × lower variance = higher confidence
  const mean = lifetimeFrequency;
  const variance = allCounts.length > 0
    ? allCounts.reduce((s, c) => s + (c - mean) ** 2, 0) / allCounts.length
    : 0;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1; // coefficient of variation
  const sampleScore = Math.min(1, sessionsCount / 15); // 15+ sessions = full sample score
  const consistencyScore = Math.max(0, 1 - cv);
  const confidenceScore = Math.round((0.5 * sampleScore + 0.5 * consistencyScore) * 100) / 100;

  // Difficulty trend
  const recentDiffs = yearlyData.slice(-3).map(d => difficultyScore(d.avgDifficulty));
  const lifetimeDiffs = yearlyData.map(d => difficultyScore(d.avgDifficulty));
  const recentAvg = recentDiffs.length > 0 ? recentDiffs.reduce((a, b) => a + b, 0) / recentDiffs.length : 2;
  const lifetimeAvg = lifetimeDiffs.length > 0 ? lifetimeDiffs.reduce((a, b) => a + b, 0) / lifetimeDiffs.length : 2;
  const difficultyTrend: 'easier' | 'same' | 'harder' =
    recentAvg < lifetimeAvg - 0.3 ? 'easier' :
    recentAvg > lifetimeAvg + 0.3 ? 'harder' : 'same';

  return {
    examId,
    subject,
    topic,
    yearlyData,
    appearanceProb,
    predictedNextCount,
    predictedWeightPct: predictedWeightPct || 0,
    recentFrequency: Math.round(recentFrequency * 10) / 10,
    lifetimeFrequency: Math.round(lifetimeFrequency * 10) / 10,
    momentum,
    momentumScore: Math.round(normalizedSlope * 100) / 100,
    weightTrend: Math.round(weightTrend * 10) / 10,
    lastAppearedYear: lastYear,
    firstAppearedYear: firstYear,
    yearCount,
    sessionsCount,
    confidenceScore,
    difficultyTrend,
    heatmap,
  };
}

function modeDifficulty(diffs: DifficultyBand[]): DifficultyBand {
  const counts: Record<DifficultyBand, number> = { easy: 0, medium: 0, hard: 0, mixed: 0 };
  for (const d of diffs) counts[d]++;
  let best: DifficultyBand = 'medium';
  let bestCount = 0;
  for (const k of Object.keys(counts) as DifficultyBand[]) {
    if (counts[k] > bestCount) {
      bestCount = counts[k];
      best = k;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Compute the full trend report for an exam
// ---------------------------------------------------------------------------

export function computeExamTrendReport(examId: string, examData: PyqExamData): ExamTrendReport {
  // Group records by (subject, topic)
  const topicGroups = new Map<string, PyqRecord[]>();
  for (const r of examData.records) {
    const key = `${r.subject}|${r.topic}`;
    if (!topicGroups.has(key)) topicGroups.set(key, []);
    topicGroups.get(key)!.push(r);
  }

  const topicTrends: TopicTrend[] = [];
  for (const [key, records] of topicGroups.entries()) {
    const [subject, topic] = key.split('|');
    const trend = computeTopicTrend(examId, subject, topic, records, examData.yearsCovered);
    topicTrends.push(trend);
  }

  // Sort by appearance prob desc
  topicTrends.sort((a, b) => b.appearanceProb - a.appearanceProb);

  const hotTopics = topicTrends
    .filter(t => t.appearanceProb >= 60)
    .sort((a, b) => b.appearanceProb - a.appearanceProb)
    .slice(0, 10);

  const watchList = topicTrends
    .filter(t => t.momentum === 'declining' && t.lifetimeFrequency > 1)
    .sort((a, b) => a.momentumScore - b.momentumScore)
    .slice(0, 5);

  const emergingTopics = topicTrends
    .filter(t => t.momentum === 'rising' || t.momentum === 'emerging')
    .sort((a, b) => b.momentumScore - a.momentumScore)
    .slice(0, 10);

  // Subject breakdown
  const subjectMap = new Map<string, TopicTrend[]>();
  for (const t of topicTrends) {
    if (!subjectMap.has(t.subject)) subjectMap.set(t.subject, []);
    subjectMap.get(t.subject)!.push(t);
  }
  const subjectBreakdown = Array.from(subjectMap.entries()).map(([subject, ts]) => ({
    subject,
    totalTopics: ts.length,
    avgAppearanceProb: Math.round(ts.reduce((s, t) => s + t.appearanceProb, 0) / Math.max(1, ts.length)),
    totalPredictedQuestions: ts.reduce((s, t) => s + t.predictedNextCount, 0),
  }));

  return {
    examId,
    examName: examData.examName,
    yearsCovered: examData.yearsCovered,
    totalPapers: examData.totalPapers,
    topicTrends,
    hotTopics,
    watchList,
    emergingTopics,
    subjectBreakdown,
  };
}

// ---------------------------------------------------------------------------
// Per-subject heatmap data — for the UI matrix
// Returns a flat array of (subject, topic, year, count) entries
// ---------------------------------------------------------------------------

export interface HeatmapCell {
  subject: string;
  topic: string;
  year: number;
  count: number;
  weightPct: number;
}

export function buildHeatmap(examData: PyqExamData): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  const [startYear, endYear] = examData.yearsCovered;
  for (const r of examData.records) {
    cells.push({
      subject: r.subject,
      topic: r.topic,
      year: r.year,
      count: r.questionCount,
      weightPct: r.weightPct,
    });
  }
  // Sort by year asc, then subject, then topic
  cells.sort((a, b) => a.year - b.year || a.subject.localeCompare(b.subject) || a.topic.localeCompare(b.topic));
  void startYear; void endYear;
  return cells;
}
