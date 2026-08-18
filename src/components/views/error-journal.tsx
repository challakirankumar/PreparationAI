'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/shared';
import { useStore } from '@/lib/store';
import {
  BookX, TrendingDown, AlertTriangle, Brain, Clock, Sigma, RefreshCw,
  CheckCircle2, Eye, Loader2, Target, Award, Lightbulb, Filter,
  ChevronRight, Activity, Flame,
} from 'lucide-react';

// ============================================================================
// Types matching the API
// ============================================================================

type ErrorRootCause = 'careless' | 'conceptual' | 'time_pressure' | 'silly_arithmetic' | 'factual_recall' | 'unclassified';

interface ErrorEntry {
  id: string;
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
  rootCause: ErrorRootCause;
  rootCauseConfidence: number;
  rootCauseEvidence: string;
  aiExplanation?: string;
  timestamp: string;
  ingestedAt: string;
  reviewed: boolean;
  resolved: boolean;
}

interface TopicPattern {
  subject: string;
  topic: string;
  totalErrors: number;
  byCause: Record<ErrorRootCause, number>;
  dominantCause: ErrorRootCause;
  lastErrorAt: string;
  resolvedCount: number;
  trend: 'improving' | 'stable' | 'worsening';
}

interface ErrorPatternReport {
  userId: string;
  totalEntries: number;
  totalReviewed: number;
  totalResolved: number;
  byCause: Record<ErrorRootCause, { count: number; percentage: number }>;
  dominantCause: ErrorRootCause;
  topWeakTopics: TopicPattern[];
  recurringErrors: ErrorEntry[];
  recentEntries: ErrorEntry[];
  weeklyTrend: { weekStart: string; count: number; careless: number; conceptual: number; time_pressure: number; silly_arithmetic: number }[];
  readinessImpact: number;
  generatedAt: string;
}

// ============================================================================
// Root cause display metadata
// ============================================================================

const ROOT_CAUSE_META: Record<ErrorRootCause, {
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  icon: React.ReactNode;
  description: string;
  recommendation: string;
}> = {
  careless: {
    label: 'Careless',
    color: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    icon: <AlertTriangle className="h-3 w-3" />,
    description: 'Attention lapse — knew the concept but misread option, typo, or skipped a step.',
    recommendation: 'Slow down on easy questions. Double-check your selected option, and read the question stem twice before answering.',
  },
  conceptual: {
    label: 'Conceptual',
    color: 'text-rose-700',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
    icon: <Brain className="h-3 w-3" />,
    description: 'Wrong mental model — the underlying concept isn\'t clear.',
    recommendation: 'Revisit the topic from NCERT/basics. Watch a concept video, then re-attempt similar problems until you can explain it in your own words.',
  },
  time_pressure: {
    label: 'Time Pressure',
    color: 'text-orange-700',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
    icon: <Clock className="h-3 w-3" />,
    description: 'Ran out of time — guessed quickly or skipped the question.',
    recommendation: 'Practise timed mocks to build pace. Learn to flag and skip hard questions early, returning only if time permits.',
  },
  silly_arithmetic: {
    label: 'Silly Arithmetic',
    color: 'text-purple-700',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    icon: <Sigma className="h-3 w-3" />,
    description: 'Right concept, right setup — but an arithmetic slip (sign, decimal, multiplication).',
    recommendation: 'Show every calculation step on paper. Re-check sign and decimal placement before submitting.',
  },
  factual_recall: {
    label: 'Factual Recall',
    color: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    icon: <BookX className="h-3 w-3" />,
    description: 'Forgot a key formula, constant, or definition.',
    recommendation: 'Make flashcards for formulas and constants. Use spaced repetition to lock them into long-term memory.',
  },
  unclassified: {
    label: 'Unclassified',
    color: 'text-stone-700',
    bgClass: 'bg-stone-50',
    borderClass: 'border-stone-200',
    icon: <AlertTriangle className="h-3 w-3" />,
    description: 'Engine couldn\'t confidently categorise this error.',
    recommendation: 'Review the question and your answer carefully — identify what went wrong, then mark as resolved.',
  },
};

const TREND_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  improving: { label: 'Improving', color: 'text-emerald-600', icon: <TrendingDown className="h-3 w-3 rotate-180" /> },
  stable: { label: 'Stable', color: 'text-stone-500', icon: <Activity className="h-3 w-3" /> },
  worsening: { label: 'Worsening', color: 'text-rose-600', icon: <TrendingDown className="h-3 w-3" /> },
};

// ============================================================================
// Main view
// ============================================================================

export function ErrorJournalView() {
  const user = useStore(s => s.user);
  const userId = user?.id ?? 'demo_user';  // default to demo_user so the UI shows seed data
  const [report, setReport] = useState<ErrorPatternReport | null>(null);
  const [entries, setEntries] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCause, setFilterCause] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [patternsR, entriesR] = await Promise.all([
        fetch(`/api/error-journal/patterns?userId=${encodeURIComponent(userId)}`),
        fetch(`/api/error-journal/entries?userId=${encodeURIComponent(userId)}&limit=100`),
      ]);
      if (patternsR.ok) setReport(await patternsR.json());
      if (entriesR.ok) {
        const j = await entriesR.json();
        setEntries(j.entries ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const patchEntry = async (entryId: string, action: 'review' | 'resolve' | 'delete') => {
    await fetch('/api/error-journal/entries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, entryId, action }),
    });
    load();
  };

  // Filter entries
  const filteredEntries = entries.filter(e => {
    if (filterCause !== 'all' && e.rootCause !== filterCause) return false;
    if (filterSubject !== 'all' && e.subject !== filterSubject) return false;
    return true;
  });

  const subjects = Array.from(new Set(entries.map(e => e.subject)));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-stone-600">Loading your error journal…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Error Journal"
        subtitle="AI tags every wrong answer by root cause — build a personal mistake-pattern report and target your weak spots"
        accent="blue"
        icon={BookX}
      />

      {report && report.totalEntries === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <BookX className="h-12 w-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-semibold text-stone-700">No errors logged yet</h3>
          <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
            Take a mock exam, battle, or adaptive session — your wrong answers will be auto-classified and shown here with root-cause analysis.
          </p>
        </Card>
      ) : report ? (
        <>
          {/* Top KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Total Errors"
              value={report.totalEntries}
              icon={<BookX className="h-5 w-5" />}
              color="blue"
              sub={`${report.totalReviewed} reviewed`}
            />
            <KpiCard
              label="Resolved"
              value={report.totalResolved}
              icon={<CheckCircle2 className="h-5 w-5" />}
              color="emerald"
              sub={`${report.totalEntries > 0 ? Math.round((report.totalResolved / report.totalEntries) * 100) : 0}% resolution rate`}
            />
            <KpiCard
              label="Dominant Cause"
              value={ROOT_CAUSE_META[report.dominantCause].label}
              icon={ROOT_CAUSE_META[report.dominantCause].icon}
              color="amber"
              sub={`${report.byCause[report.dominantCause].percentage}% of errors`}
            />
            <KpiCard
              label="Readiness Impact"
              value={`${report.readinessImpact}%`}
              icon={<Target className="h-5 w-5" />}
              color="rose"
              sub="From unresolved conceptual errors"
            />
          </div>

          <Tabs defaultValue="patterns">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
              <TabsTrigger value="patterns"><Brain className="h-4 w-4 mr-1 inline" />Pattern Report</TabsTrigger>
              <TabsTrigger value="entries"><BookX className="h-4 w-4 mr-1 inline" />All Entries</TabsTrigger>
              <TabsTrigger value="recurring"><Flame className="h-4 w-4 mr-1 inline" />Recurring Errors</TabsTrigger>
            </TabsList>

            {/* Pattern report tab */}
            <TabsContent value="patterns" className="space-y-4">
              {/* By-cause breakdown */}
              <Card className="p-5 border-blue-200">
                <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  Error Breakdown by Root Cause
                </h3>
                <div className="space-y-3">
                  {(Object.entries(report.byCause) as [ErrorRootCause, { count: number; percentage: number }][])
                    .sort((a, b) => b[1].count - a[1].count)
                    .filter(([, v]) => v.count > 0)
                    .map(([cause, data]) => {
                      const meta = ROOT_CAUSE_META[cause];
                      return (
                        <div key={cause} className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg ${meta.bgClass} ${meta.borderClass} border flex items-center justify-center flex-shrink-0`}>
                            <span className={meta.color}>{meta.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
                              <span className="text-xs text-stone-500 tabular-nums">{data.count} errors · {data.percentage}%</span>
                            </div>
                            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${meta.bgClass.replace('bg-', 'bg-').replace('-50', '-500')}`}
                                style={{ width: `${data.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                {report.dominantCause && (
                  <div className={`mt-4 p-3 rounded-lg ${ROOT_CAUSE_META[report.dominantCause].bgClass} ${ROOT_CAUSE_META[report.dominantCause].borderClass} border`}>
                    <p className="text-xs font-semibold text-stone-600 uppercase mb-1">Your dominant mistake pattern</p>
                    <p className="text-sm text-stone-800">{ROOT_CAUSE_META[report.dominantCause].description}</p>
                    <div className="mt-2 flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-stone-700">{ROOT_CAUSE_META[report.dominantCause].recommendation}</p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Top weak topics */}
              <Card className="p-5 border-blue-200">
                <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                  Top Weak Topics
                </h3>
                {report.topWeakTopics.length === 0 ? (
                  <p className="text-sm text-stone-400 italic">No weak topics identified.</p>
                ) : (
                  <div className="space-y-3">
                    {report.topWeakTopics.map(t => {
                      const meta = ROOT_CAUSE_META[t.dominantCause];
                      const trendMeta = TREND_META[t.trend];
                      const resolveRate = t.totalErrors > 0 ? Math.round((t.resolvedCount / t.totalErrors) * 100) : 0;
                      return (
                        <div key={`${t.subject}-${t.topic}`} className="p-3 rounded-lg border border-stone-200">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-stone-800">{t.topic}</p>
                              <p className="text-xs text-stone-500">{t.subject}</p>
                            </div>
                            <Badge variant="outline" className={`text-xs ${meta.bgClass} ${meta.borderClass} ${meta.color} border`}>
                              {meta.icon}
                              <span className="ml-1">{meta.label}</span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-stone-600">
                            <span>{t.totalErrors} errors</span>
                            <span>{t.resolvedCount} resolved ({resolveRate}%)</span>
                            <span className={`flex items-center gap-1 ${trendMeta.color}`}>
                              {trendMeta.icon}
                              {trendMeta.label}
                            </span>
                          </div>
                          {/* Per-cause mini bar */}
                          <div className="flex items-center gap-1 mt-2 h-1.5">
                            {(['careless', 'conceptual', 'time_pressure', 'silly_arithmetic', 'factual_recall'] as ErrorRootCause[])
                              .filter(c => t.byCause[c] > 0)
                              .map(c => {
                                const m = ROOT_CAUSE_META[c];
                                const pct = (t.byCause[c] / t.totalErrors) * 100;
                                return (
                                  <div
                                    key={c}
                                    className={`h-full ${m.bgClass.replace('-50', '-500')}`}
                                    style={{ width: `${pct}%` }}
                                    title={`${m.label}: ${t.byCause[c]}`}
                                  />
                                );
                              })}
                          </div>
                          <p className="text-[10px] text-stone-400 mt-1">
                            Last error: {new Date(t.lastErrorAt).toLocaleDateString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Weekly trend */}
              <Card className="p-5 border-blue-200">
                <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  Weekly Error Trend (Last 8 Weeks)
                </h3>
                <div className="flex items-end justify-between h-32 gap-1">
                  {report.weeklyTrend.map((w, idx) => {
                    const maxCount = Math.max(...report.weeklyTrend.map(x => x.count), 1);
                    const heightPct = (w.count / maxCount) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full h-full flex flex-col justify-end relative">
                          {/* Stacked causes */}
                          <div className="w-full flex flex-col-reverse" style={{ height: `${heightPct}%` }}>
                            {w.count > 0 && (
                              <>
                                <div className="bg-rose-500" style={{ height: `${(w.conceptual / w.count) * 100}%` }} title={`Conceptual: ${w.conceptual}`} />
                                <div className="bg-amber-500" style={{ height: `${(w.careless / w.count) * 100}%` }} title={`Careless: ${w.careless}`} />
                                <div className="bg-orange-500" style={{ height: `${(w.time_pressure / w.count) * 100}%` }} title={`Time: ${w.time_pressure}`} />
                                <div className="bg-purple-500" style={{ height: `${(w.silly_arithmetic / w.count) * 100}%` }} title={`Arith: ${w.silly_arithmetic}`} />
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-stone-500">{w.weekStart.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-3 mt-3 text-xs text-stone-500 flex-wrap">
                  <span className="flex items-center gap-1"><span className="h-2 w-3 bg-rose-500 inline-block" />Conceptual</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-3 bg-amber-500 inline-block" />Careless</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-3 bg-orange-500 inline-block" />Time Pressure</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-3 bg-purple-500 inline-block" />Silly Arithmetic</span>
                </div>
              </Card>
            </TabsContent>

            {/* All entries tab */}
            <TabsContent value="entries" className="space-y-4">
              {/* Filters */}
              <Card className="p-3 border-blue-200">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-stone-500 flex items-center gap-1">
                    <Filter className="h-3 w-3" /> Filters:
                  </span>
                  <Select value={filterCause} onValueChange={setFilterCause}>
                    <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All causes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All causes</SelectItem>
                      <SelectItem value="careless">Careless</SelectItem>
                      <SelectItem value="conceptual">Conceptual</SelectItem>
                      <SelectItem value="time_pressure">Time Pressure</SelectItem>
                      <SelectItem value="silly_arithmetic">Silly Arithmetic</SelectItem>
                      <SelectItem value="factual_recall">Factual Recall</SelectItem>
                      <SelectItem value="unclassified">Unclassified</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterSubject} onValueChange={setFilterSubject}>
                    <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All subjects" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All subjects</SelectItem>
                      {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" onClick={load} className="ml-auto">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>

              {filteredEntries.length === 0 ? (
                <Card className="p-6 text-center text-stone-500">
                  No entries match these filters.
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredEntries.slice(0, 50).map(entry => (
                    <ErrorEntryCard
                      key={entry.id}
                      entry={entry}
                      onReview={() => patchEntry(entry.id, 'review')}
                      onResolve={() => patchEntry(entry.id, 'resolve')}
                      onDelete={() => patchEntry(entry.id, 'delete')}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Recurring errors tab */}
            <TabsContent value="recurring" className="space-y-4">
              <Card className="p-5 border-amber-200 bg-amber-50/30">
                <h3 className="font-semibold text-stone-800 mb-1 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-500" />
                  Recurring Errors
                </h3>
                <p className="text-sm text-stone-600 mb-3">
                  These are mistakes you keep making — the same root cause, same topic, multiple times. Tackle these first.
                </p>
                {report.recurringErrors.length === 0 ? (
                  <p className="text-sm text-stone-400 italic">No recurring errors detected — nice work!</p>
                ) : (
                  <div className="space-y-3">
                    {report.recurringErrors.map(entry => (
                      <ErrorEntryCard
                        key={entry.id}
                        entry={entry}
                        onReview={() => patchEntry(entry.id, 'review')}
                        onResolve={() => patchEntry(entry.id, 'resolve')}
                        onDelete={() => patchEntry(entry.id, 'delete')}
                      />
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------

function KpiCard({
  label, value, icon, color, sub,
}: {
  label: string; value: string | number; icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'amber' | 'rose'; sub?: string;
}) {
  const colors: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
  };
  return (
    <Card className={`p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase opacity-80">{label}</span>
        <div className="opacity-80">{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs opacity-70 mt-1">{sub}</div>}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Error entry card
// ---------------------------------------------------------------------------

function ErrorEntryCard({
  entry, onReview, onResolve, onDelete,
}: {
  entry: ErrorEntry;
  onReview: () => void;
  onResolve: () => void;
  onDelete: () => void;
}) {
  const meta = ROOT_CAUSE_META[entry.rootCause];
  const [expanded, setExpanded] = useState(false);
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <Card className={`p-4 border-2 ${meta.borderClass} ${meta.bgClass}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline" className={`text-xs ${meta.bgClass} ${meta.color} ${meta.borderClass} border`}>
              {meta.icon}
              <span className="ml-1">{meta.label}</span>
            </Badge>
            <Badge variant="outline" className="text-xs bg-stone-50 text-stone-700 border-stone-200">
              {entry.subject}
            </Badge>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {entry.topic}
            </Badge>
            <Badge variant="outline" className={`text-xs ${entry.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : entry.difficulty === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
              {entry.difficulty}
            </Badge>
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 capitalize">
              {entry.source.replace('-', ' ')}
            </Badge>
            {entry.resolved && (
              <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-700 border-emerald-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />Resolved
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium text-stone-800 line-clamp-2">{entry.questionText}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-stone-500">{new Date(entry.timestamp).toLocaleDateString()}</p>
          <p className="text-xs text-stone-400">{entry.timeTakenSec}s</p>
        </div>
      </div>

      {/* Evidence */}
      <div className="text-xs text-stone-600 italic mb-2 p-2 rounded bg-white/60 border border-stone-200">
        <span className="font-semibold not-italic">Why {meta.label}:</span> {entry.rootCauseEvidence}
      </div>

      {/* Options (if MCQ) */}
      {entry.options && entry.options.length > 0 && (
        <div className="space-y-1 mb-2">
          {entry.options.slice(0, 4).map((opt, idx) => {
            const isCorrect = entry.correctOptions?.includes(idx);
            const isStudent = entry.studentOptionIndex === idx;
            return (
              <div
                key={idx}
                className={`text-xs p-1.5 rounded flex items-center gap-2 ${
                  isCorrect ? 'bg-emerald-100 border border-emerald-300' :
                  isStudent ? 'bg-rose-100 border border-rose-300' :
                  'bg-stone-50 border border-stone-200'
                }`}
              >
                <span className={`h-5 w-5 rounded-full flex items-center justify-center font-semibold text-[10px] ${
                  isCorrect ? 'bg-emerald-500 text-white' :
                  isStudent ? 'bg-rose-500 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {LETTERS[idx]}
                </span>
                <span className="flex-1 text-stone-700">{opt}</span>
                {isCorrect && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                {isStudent && !isCorrect && <span className="text-rose-600">your answer</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Numeric answer (if numerical) */}
      {entry.correctNumeric !== undefined && (
        <div className="text-xs p-2 rounded bg-stone-50 border border-stone-200 mb-2">
          <span className="text-stone-500">Correct: </span>
          <span className="font-mono font-semibold text-emerald-700">{entry.correctNumeric}</span>
          {entry.studentNumeric !== undefined && (
            <>
              <span className="text-stone-500 ml-3">Your answer: </span>
              <span className="font-mono font-semibold text-rose-700">{entry.studentNumeric}</span>
            </>
          )}
        </div>
      )}

      {/* Recommendation */}
      <div className="flex items-start gap-2 text-xs text-stone-700 mb-3">
        <Lightbulb className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
        <span>{meta.recommendation}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {!entry.reviewed && (
          <Button size="sm" variant="outline" onClick={onReview}>
            <Eye className="h-3 w-3 mr-1" />Mark Reviewed
          </Button>
        )}
        {!entry.resolved && (
          <Button size="sm" variant="outline" onClick={onResolve} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
            <CheckCircle2 className="h-3 w-3 mr-1" />Mark Resolved
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onDelete} className="text-rose-600 hover:text-rose-700 ml-auto">
          Delete
        </Button>
      </div>
    </Card>
  );
}
