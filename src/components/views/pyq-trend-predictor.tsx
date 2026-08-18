'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/shared';
import { useStore, userExamGoals } from '@/lib/store';
import {
  TrendingUp, TrendingDown, Flame, Eye, AlertTriangle, Sparkles,
  RefreshCw, Brain, Target, Award, Activity, BookOpen, BarChart3,
  Loader2, Lightbulb, Clock, Layers,
} from 'lucide-react';

// ============================================================================
// Types matching the API responses
// ============================================================================

interface ExamListItem {
  examId: string;
  examName: string;
  yearsCovered: [number, number];
  totalPapers: number;
  topicCount: number;
}

interface TopicTrend {
  examId: string;
  subject: string;
  topic: string;
  yearlyData: { year: number; totalQuestions: number; sessions: number; avgWeightPct: number; avgDifficulty: string }[];
  appearanceProb: number;
  predictedNextCount: number;
  predictedWeightPct: number;
  recentFrequency: number;
  lifetimeFrequency: number;
  momentum: 'rising' | 'stable' | 'declining' | 'emerging' | 'dormant';
  momentumScore: number;
  weightTrend: number;
  lastAppearedYear: number | null;
  firstAppearedYear: number | null;
  yearCount: number;
  sessionsCount: number;
  confidenceScore: number;
  difficultyTrend: 'easier' | 'same' | 'harder';
  heatmap: { year: number; questionCount: number }[];
}

interface ExamTrendReport {
  examId: string;
  examName: string;
  yearsCovered: [number, number];
  totalPapers: number;
  topicTrends: TopicTrend[];
  hotTopics: TopicTrend[];
  watchList: TopicTrend[];
  emergingTopics: TopicTrend[];
  subjectBreakdown: { subject: string; totalTopics: number; avgAppearanceProb: number; totalPredictedQuestions: number }[];
}

interface HeatmapCell {
  subject: string;
  topic: string;
  year: number;
  count: number;
  weightPct: number;
}

interface PyqAnalysis {
  highPriorityTopics: { topic: string; subject: string; reason: string; predictedCount: number }[];
  surpriseCandidates: { topic: string; subject: string; reason: string }[];
  decliningAreas: { topic: string; subject: string; reason: string }[];
  focusStrategy: string;
  timeAllocation: { subject: string; percentage: number; rationale: string }[];
  keyInsight: string;
  generatedAt: string;
}

// ============================================================================
// Main view
// ============================================================================

export function PyqTrendPredictorView() {
  const user = useStore(s => s.user);
  const goals = userExamGoals(user);
  const [examList, setExamList] = useState<ExamListItem[]>([]);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [report, setReport] = useState<ExamTrendReport | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<PyqAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisFallback, setAnalysisFallback] = useState(false);

  // Load exam list
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/pyq-trends');
        if (r.ok) {
          const j = await r.json();
          setExamList(j.exams ?? []);
          // Default to first user goal that has PYQ data, else first exam
          const defaultExam = goals.find(g => j.exams.some((e: ExamListItem) => e.examId === g)) ?? j.exams[0]?.examId;
          if (defaultExam) setSelectedExam(defaultExam);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [goals]);

  // Load report when exam changes
  const loadReport = useCallback(async () => {
    if (!selectedExam) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const r = await fetch(`/api/pyq-trends?examId=${selectedExam}`);
      if (r.ok) {
        const j = await r.json();
        setReport(j.report);
        setHeatmap(j.heatmap);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedExam]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const runAnalysis = async () => {
    if (!selectedExam) return;
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const r = await fetch('/api/pyq-trends/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExam,
          userExamGoal: user?.examGoal,
          userId: user?.id,
        }),
      });
      if (r.ok) {
        const j = await r.json();
        setAnalysis(j.analysis);
        setAnalysisFallback(j.fallback === true);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="PYQ Trend Predictor"
        subtitle="AI-mined patterns from 10+ years of past papers — predicts which topics are most likely to appear in your upcoming exam"
        accent="blue"
        icon={TrendingUp}
      />

      {/* Exam selector + AI analysis CTA */}
      <Card className="p-4 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-stone-500 uppercase font-semibold">Select exam</p>
              <Select value={selectedExam ?? ''} onValueChange={setSelectedExam}>
                <SelectTrigger className="mt-1 w-full md:w-72">
                  <SelectValue placeholder="Choose an exam…" />
                </SelectTrigger>
                <SelectContent>
                  {examList.map(e => (
                    <SelectItem key={e.examId} value={e.examId}>
                      {e.examName} · {e.yearsCovered[0]}–{e.yearsCovered[1]} · {e.topicCount} topics
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={runAnalysis} disabled={analyzing || !report}>
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Analysing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1" />
                Run AI Analysis
              </>
            )}
          </Button>
        </div>
      </Card>

      {loading ? (
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 text-blue-500 mx-auto animate-spin mb-2" />
          <p className="text-stone-500">Mining {selectedExam ?? 'exam'} trends…</p>
        </Card>
      ) : report ? (
        <>
          {/* Top KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Topics Tracked"
              value={report.topicTrends.length}
              icon={<Layers className="h-5 w-5" />}
              color="blue"
              sub={`Across ${report.subjectBreakdown.length} subject${report.subjectBreakdown.length === 1 ? '' : 's'}`}
            />
            <KpiCard
              label="Past Papers"
              value={report.totalPapers}
              icon={<BookOpen className="h-5 w-5" />}
              color="cyan"
              sub={`${report.yearsCovered[0]}–${report.yearsCovered[1]}`}
            />
            <KpiCard
              label="Hot Topics"
              value={report.hotTopics.length}
              icon={<Flame className="h-5 w-5" />}
              color="amber"
              sub="≥60% appearance prob"
            />
            <KpiCard
              label="Predicted Questions"
              value={report.subjectBreakdown.reduce((s, x) => s + x.totalPredictedQuestions, 0)}
              icon={<Target className="h-5 w-5" />}
              color="emerald"
              sub="In upcoming exam"
            />
          </div>

          {/* AI Analysis card (when available) */}
          {analysis && (
            <AnalysisCard analysis={analysis} isFallback={analysisFallback} />
          )}

          <Tabs defaultValue="hot">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="hot"><Flame className="h-4 w-4 mr-1 inline" />Hot Topics</TabsTrigger>
              <TabsTrigger value="emerging"><TrendingUp className="h-4 w-4 mr-1 inline" />Emerging</TabsTrigger>
              <TabsTrigger value="declining"><TrendingDown className="h-4 w-4 mr-1 inline" />Watch List</TabsTrigger>
              <TabsTrigger value="heatmap"><BarChart3 className="h-4 w-4 mr-1 inline" />Heatmap</TabsTrigger>
            </TabsList>

            {/* Hot Topics tab */}
            <TabsContent value="hot" className="space-y-3">
              <p className="text-sm text-stone-600">
                Topics with the highest predicted appearance probability for the next exam.
                Prioritise these in your revision plan.
              </p>
              {report.hotTopics.length === 0 ? (
                <Card className="p-6 text-center text-stone-500">No high-probability topics found.</Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {report.hotTopics.map(t => (
                    <TopicTrendCard key={`${t.subject}-${t.topic}`} trend={t} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Emerging tab */}
            <TabsContent value="emerging" className="space-y-3">
              <p className="text-sm text-stone-600">
                Topics with rising momentum — they're appearing more frequently in recent papers.
                Brush through these once to avoid surprises.
              </p>
              {report.emergingTopics.length === 0 ? (
                <Card className="p-6 text-center text-stone-500">No emerging topics detected.</Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {report.emergingTopics.map(t => (
                    <TopicTrendCard key={`${t.subject}-${t.topic}`} trend={t} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Declining tab */}
            <TabsContent value="declining" className="space-y-3">
              <p className="text-sm text-stone-600">
                Topics with declining frequency. Don't waste time on these unless they're a known weak spot.
              </p>
              {report.watchList.length === 0 ? (
                <Card className="p-6 text-center text-stone-500">No declining topics detected.</Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {report.watchList.map(t => (
                    <TopicTrendCard key={`${t.subject}-${t.topic}`} trend={t} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Heatmap tab */}
            <TabsContent value="heatmap" className="space-y-3">
              <p className="text-sm text-stone-600">
                Year-by-year topic appearance matrix. Darker cells = more questions on that topic that year.
              </p>
              <HeatmapMatrix report={report} heatmap={heatmap} />
            </TabsContent>
          </Tabs>

          {/* Subject breakdown */}
          <Card className="p-5 border-blue-200">
            <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Subject-Level Breakdown
            </h3>
            <div className="space-y-3">
              {report.subjectBreakdown.map(s => {
                const totalPredicted = report.subjectBreakdown.reduce((sum, x) => sum + x.totalPredictedQuestions, 0) || 1;
                const pct = Math.round((s.totalPredictedQuestions / totalPredicted) * 100);
                return (
                  <div key={s.subject}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-stone-700">{s.subject}</span>
                      <span className="text-xs text-stone-500">
                        {s.totalTopics} topics · {s.totalPredictedQuestions} predicted Qs · avg {s.avgAppearanceProb}% prob
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-cyan-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-stone-500 w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Explainer */}
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Brain className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-stone-800 mb-1">How trend prediction works</h4>
                <p className="text-sm text-stone-700 leading-relaxed">
                  For each topic, we aggregate question counts across {report.totalPapers} past papers spanning{' '}
                  {report.yearsCovered[0]}–{report.yearsCovered[1]}. The appearance probability blends:
                  <strong> lifetime presence rate (35%)</strong>, <strong>recent 3-year presence rate (65%)</strong>,
                  and a <strong>momentum bonus</strong> (+12 rising, +18 emerging, -15 declining).
                  Predicted counts use an EWMA (α=0.4) for recency weighting.
                </p>
                <p className="text-xs text-stone-500 mt-2">
                  <AlertTriangle className="inline h-3 w-3 mr-1" />
                  Predictions are statistical, not oracular. Exam setters can always surprise —
                  cover the entire syllabus if time permits.
                </p>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center text-stone-500">
          No trend data available. Select an exam above.
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------

function KpiCard({
  label, value, icon, color, sub,
}: {
  label: string; value: number | string; icon: React.ReactNode;
  color: 'blue' | 'cyan' | 'amber' | 'emerald'; sub?: string;
}) {
  const colors: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
  return (
    <Card className={`p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase opacity-80">{label}</span>
        <div className="opacity-80">{icon}</div>
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs opacity-70 mt-1">{sub}</div>}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Topic trend card — shows a single topic's full trend
// ---------------------------------------------------------------------------

function TopicTrendCard({ trend: t }: { trend: TopicTrend }) {
  const momentumColor: Record<string, string> = {
    rising: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    emerging: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    stable: 'bg-blue-100 text-blue-700 border-blue-300',
    declining: 'bg-amber-100 text-amber-700 border-amber-300',
    dormant: 'bg-stone-100 text-stone-700 border-stone-300',
  };
  const momentumIcon: Record<string, React.ReactNode> = {
    rising: <TrendingUp className="h-3 w-3" />,
    emerging: <Sparkles className="h-3 w-3" />,
    stable: <Activity className="h-3 w-3" />,
    declining: <TrendingDown className="h-3 w-3" />,
    dormant: <Clock className="h-3 w-3" />,
  };
  const probColor =
    t.appearanceProb >= 75 ? 'text-emerald-600' :
    t.appearanceProb >= 50 ? 'text-blue-600' :
    t.appearanceProb >= 30 ? 'text-amber-600' : 'text-stone-500';

  // Mini sparkline of yearly counts
  const maxCount = Math.max(...t.heatmap.map(h => h.questionCount), 1);

  return (
    <Card className="p-4 border-blue-100 hover:border-blue-300 transition-colors card-lift">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {t.subject}
            </Badge>
            <Badge variant="outline" className={`text-xs ${momentumColor[t.momentum]}`}>
              {momentumIcon[t.momentum]}
              <span className="ml-1 capitalize">{t.momentum}</span>
            </Badge>
            {t.difficultyTrend !== 'same' && (
              <Badge variant="outline" className={`text-xs ${t.difficultyTrend === 'harder' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                {t.difficultyTrend === 'harder' ? '↑ Harder' : '↓ Easier'}
              </Badge>
            )}
          </div>
          <p className="font-semibold text-stone-800 mt-1">{t.topic}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold tabular-nums ${probColor}`}>{t.appearanceProb}%</p>
          <p className="text-[10px] text-stone-500 uppercase">appearance prob</p>
        </div>
      </div>

      {/* Mini sparkline */}
      <div className="flex items-end justify-between h-12 gap-px mt-3">
        {t.heatmap.map((h, idx) => (
          <div
            key={idx}
            className="flex-1 group relative"
            title={`${h.year}: ${h.questionCount} questions`}
          >
            <div
              className={`w-full rounded-sm transition-colors ${
                h.questionCount === 0 ? 'bg-stone-100' :
                h.questionCount <= 1 ? 'bg-blue-200' :
                h.questionCount <= 3 ? 'bg-blue-400' :
                'bg-blue-600'
              }`}
              style={{ height: `${(h.questionCount / maxCount) * 100}%` }}
            />
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {h.year.toString().slice(-2)}
            </span>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
        <div>
          <p className="text-stone-500">Predicted</p>
          <p className="font-semibold text-stone-800 tabular-nums">{t.predictedNextCount} Q</p>
        </div>
        <div>
          <p className="text-stone-500">Recent freq</p>
          <p className="font-semibold text-stone-800 tabular-nums">{t.recentFrequency}/yr</p>
        </div>
        <div>
          <p className="text-stone-500">Lifetime</p>
          <p className="font-semibold text-stone-800 tabular-nums">{t.lifetimeFrequency}/yr</p>
        </div>
        <div>
          <p className="text-stone-500">Confidence</p>
          <p className="font-semibold text-stone-800 tabular-nums">{Math.round(t.confidenceScore * 100)}%</p>
        </div>
      </div>

      {t.lastAppearedYear && (
        <p className="text-[10px] text-stone-400 mt-2">
          Last appeared: {t.lastAppearedYear} · {t.sessionsCount} sessions · slope {t.momentumScore >= 0 ? '+' : ''}{t.momentumScore.toFixed(2)}/yr
        </p>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Heatmap matrix
// ---------------------------------------------------------------------------

function HeatmapMatrix({ report, heatmap }: { report: ExamTrendReport; heatmap: HeatmapCell[] }) {
  // Group cells by (subject, topic) row
  const rows = useMemo(() => {
    // Get sorted unique (subject, topic) pairs by hot-topics-first ordering
    const seen = new Map<string, { subject: string; topic: string }>();
    for (const t of report.topicTrends) {
      seen.set(`${t.subject}|${t.topic}`, { subject: t.subject, topic: t.topic });
    }
    const years: number[] = [];
    for (let y = report.yearsCovered[0]; y <= report.yearsCovered[1]; y++) years.push(y);

    const rowList = Array.from(seen.values()).map(({ subject, topic }) => {
      const cells = years.map(year => {
        const cell = heatmap.find(c => c.subject === subject && c.topic === topic && c.year === year);
        return cell ?? { subject, topic, year, count: 0, weightPct: 0 };
      });
      const total = cells.reduce((s, c) => s + c.count, 0);
      return { subject, topic, cells, total };
    });
    // Sort rows by total descending
    rowList.sort((a, b) => b.total - a.total);
    return { rowList, years };
  }, [report, heatmap]);

  const maxCellCount = Math.max(...heatmap.map(c => c.count), 1);

  return (
    <Card className="p-4 border-blue-200 overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Year headers */}
        <div className="flex items-center sticky top-0 bg-white z-10 pb-2 border-b border-stone-100">
          <div className="w-56 flex-shrink-0 text-xs font-semibold text-stone-500 uppercase">
            Subject · Topic
          </div>
          <div className="flex-1 grid gap-px" style={{ gridTemplateColumns: `repeat(${rows.years.length}, minmax(0, 1fr))` }}>
            {rows.years.map(y => (
              <div key={y} className="text-[10px] text-center text-stone-500 font-mono">
                {y.toString().slice(-2)}
              </div>
            ))}
          </div>
          <div className="w-12 flex-shrink-0 text-xs font-semibold text-stone-500 text-right uppercase">
            Total
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-px mt-2 max-h-[600px] overflow-y-auto">
          {rows.rowList.map(row => (
            <div key={`${row.subject}-${row.topic}`} className="flex items-center hover:bg-blue-50/30 group">
              <div className="w-56 flex-shrink-0 pr-2 py-1 truncate">
                <p className="text-xs font-medium text-stone-700 truncate">{row.topic}</p>
                <p className="text-[10px] text-stone-400 truncate">{row.subject}</p>
              </div>
              <div className="flex-1 grid gap-px" style={{ gridTemplateColumns: `repeat(${rows.years.length}, minmax(0, 1fr))` }}>
                {row.cells.map((c, idx) => {
                  const intensity = c.count / maxCellCount;
                  const bg =
                    c.count === 0 ? 'bg-stone-50' :
                    intensity < 0.25 ? 'bg-blue-200' :
                    intensity < 0.5 ? 'bg-blue-400' :
                    intensity < 0.75 ? 'bg-blue-600' : 'bg-blue-800';
                  const text = c.count === 0 ? '' : c.count >= 4 ? 'text-white' : 'text-stone-700';
                  return (
                    <div
                      key={idx}
                      className={`h-7 flex items-center justify-center text-[10px] font-mono ${bg} ${text} group-hover:ring-1 group-hover:ring-blue-300`}
                      title={`${c.year} · ${row.subject} / ${row.topic} · ${c.count} questions`}
                    >
                      {c.count > 0 ? c.count : ''}
                    </div>
                  );
                })}
              </div>
              <div className="w-12 flex-shrink-0 text-right text-xs font-semibold text-stone-700 tabular-nums">
                {row.total}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 text-xs text-stone-500">
          <span>Intensity:</span>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 bg-stone-50 border border-stone-200" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 bg-blue-200" />
            <span>1-2</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 bg-blue-400" />
            <span>3-4</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 bg-blue-600" />
            <span>5-6</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 bg-blue-800" />
            <span>7+</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// AI Analysis Card
// ---------------------------------------------------------------------------

function AnalysisCard({ analysis, isFallback }: { analysis: PyqAnalysis; isFallback: boolean }) {
  return (
    <Card className={`p-5 border-2 ${isFallback ? 'border-amber-300 bg-amber-50/30' : 'border-blue-300 bg-gradient-to-br from-blue-50/50 to-cyan-50/30'}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isFallback ? 'bg-amber-100' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
            {isFallback ? <AlertTriangle className="h-5 w-5 text-amber-600" /> : <Brain className="h-5 w-5 text-white" />}
          </div>
          <div>
            <h3 className="font-semibold text-stone-800 flex items-center gap-2">
              AI Trend Analysis
              {isFallback && <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">Statistical fallback</Badge>}
            </h3>
            <p className="text-xs text-stone-500">
              Generated {new Date(analysis.generatedAt).toLocaleString()}
              {isFallback && ' · GLM-4.6 unavailable, using deterministic analysis'}
            </p>
          </div>
        </div>
      </div>

      {/* Key insight */}
      <div className="p-3 rounded-lg bg-white/60 border border-blue-100 mb-4">
        <p className="text-xs font-semibold text-blue-700 uppercase mb-1 flex items-center gap-1">
          <Lightbulb className="h-3 w-3" /> Key Insight
        </p>
        <p className="text-sm text-stone-800 leading-relaxed">{analysis.keyInsight}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* High priority */}
        <div>
          <h4 className="text-sm font-semibold text-stone-700 mb-2 flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-500" />
            High Priority
          </h4>
          <div className="space-y-2">
            {analysis.highPriorityTopics.map((t, i) => (
              <div key={i} className="p-2 rounded bg-amber-50 border border-amber-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-stone-800">{t.topic}</p>
                  <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                    ~{t.predictedCount} Q
                  </Badge>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">{t.subject}</p>
                <p className="text-xs text-stone-600 mt-1">{t.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Surprise candidates */}
        <div>
          <h4 className="text-sm font-semibold text-stone-700 mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-500" />
            Surprise Candidates
          </h4>
          <div className="space-y-2">
            {analysis.surpriseCandidates.map((t, i) => (
              <div key={i} className="p-2 rounded bg-cyan-50 border border-cyan-100">
                <p className="text-sm font-medium text-stone-800">{t.topic}</p>
                <p className="text-xs text-stone-500 mt-0.5">{t.subject}</p>
                <p className="text-xs text-stone-600 mt-1">{t.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Declining */}
        <div>
          <h4 className="text-sm font-semibold text-stone-700 mb-2 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-rose-500" />
            Deprioritise
          </h4>
          <div className="space-y-2">
            {analysis.decliningAreas.map((t, i) => (
              <div key={i} className="p-2 rounded bg-rose-50 border border-rose-100">
                <p className="text-sm font-medium text-stone-800">{t.topic}</p>
                <p className="text-xs text-stone-500 mt-0.5">{t.subject}</p>
                <p className="text-xs text-stone-600 mt-1">{t.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time allocation */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-stone-700 mb-2 flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-500" />
          Recommended Time Allocation
        </h4>
        <div className="space-y-1.5">
          {analysis.timeAllocation.map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-32 truncate text-stone-700">{t.subject}</span>
              <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-cyan-500"
                  style={{ width: `${t.percentage}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs font-mono text-stone-600">{t.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy */}
      <div className="mt-4 p-3 rounded-lg bg-white/60 border border-blue-100">
        <p className="text-xs font-semibold text-blue-700 uppercase mb-1 flex items-center gap-1">
          <Award className="h-3 w-3" /> Focus Strategy
        </p>
        <p className="text-sm text-stone-800 leading-relaxed">{analysis.focusStrategy}</p>
      </div>
    </Card>
  );
}
