'use client';

import { useState, useMemo } from 'react';
import {
  BarChart3,
  Target,
  Zap,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Brain,
  Sparkles,
  Trophy,
  Clock,
  Gauge,
  KeyRound,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader, StatCard } from '@/components/shared';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { ExamResults } from '@/components/mock-exam/exam-results';
import type { ExamAttempt } from '@/lib/types';

export function PerformanceAnalytics() {
  const attempts = useStore((s) => s.attempts);
  const setView = useStore((s) => s.setView);
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null);
  const [regionTracker, setRegionTracker] = useState<'India' | 'GCC'>('India');

  if (selectedAttempt) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSelectedAttempt(null)} className="text-slate-600">
            ← Back to Analytics Overview
          </Button>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            Viewing Past Mock Solutions
          </Badge>
        </div>
        <ExamResults
          attempt={selectedAttempt}
          onRetake={() => {
            setSelectedAttempt(null);
            setView('mock-exam');
          }}
          onExit={() => setSelectedAttempt(null)}
        />
      </div>
    );
  }

  // Empty state
  if (attempts.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={BarChart3}
          title="Performance Analytics"
          subtitle="Track your score, accuracy, speed, and topic mastery over time"
          accent="emerald"
          right={
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setView('mock-exam')}>
              <Trophy className="h-4 w-4" /> Take a mock
            </Button>
          }
        />
        <Card className="p-10 border-stone-200 text-center">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-stone-100 flex items-center justify-center mb-3">
            <BarChart3 className="h-7 w-7 text-stone-400" />
          </div>
          <h3 className="font-semibold text-stone-800">No attempts yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Take your first mock test to unlock score trends, accuracy analysis, weak-topic insights, and more.
          </p>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setView('mock-exam')}>
            Take first mock
          </Button>
        </Card>
      </div>
    );
  }

  const sorted = [...attempts].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );
  const reversed = [...attempts]; // most-recent first

  const avgScorePct = sorted.reduce((sum, a) => sum + a.score / a.totalMarks, 0) / sorted.length;
  const avgAccuracy = sorted.reduce((sum, a) => sum + a.accuracy, 0) / sorted.length;
  const avgSpeed = sorted.reduce((sum, a) => sum + a.speed, 0) / sorted.length;
  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  const trendDelta = (latest.score / latest.totalMarks) - (first.score / first.totalMarks);

  // Subject mastery aggregation
  const subjectMap = new Map<string, { total: number; scored: number }>();
  for (const a of sorted) {
    for (const s of a.subjectScores) {
      const cur = subjectMap.get(s.subject) || { total: 0, scored: 0 };
      cur.total += s.total;
      cur.scored += s.scored;
      subjectMap.set(s.subject, cur);
    }
  }
  const subjectMastery = Array.from(subjectMap.entries()).map(([subject, v]) => ({
    subject,
    pct: Math.round((v.scored / v.total) * 100),
  }));

  // Strengths / Weaknesses from recurring topics
  const weakCounts = new Map<string, number>();
  const strongCounts = new Map<string, number>();
  for (const a of attempts) {
    for (const t of a.weakTopics) weakCounts.set(t, (weakCounts.get(t) || 0) + 1);
    for (const t of a.strongTopics) strongCounts.set(t, (strongCounts.get(t) || 0) + 1);
  }
  const weaknesses = Array.from(weakCounts.entries()).filter(([, c]) => c >= 1).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const strengths = Array.from(strongCounts.entries()).filter(([, c]) => c >= 1).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Line chart points for score trend
  const maxScorePct = 1;
  const lineW = 600;
  const lineH = 200;
  const pad = 20;
  const pts = sorted.map((a, i) => {
    const x = pad + (i * (lineW - 2 * pad)) / Math.max(1, sorted.length - 1);
    const y = lineH - pad - ((a.score / a.totalMarks) * (lineH - 2 * pad)) / maxScorePct;
    return { x, y, score: a.score, total: a.totalMarks, pct: a.score / a.totalMarks, accuracy: a.accuracy, label: a.examName };
  });
  const accPts = sorted.map((a, i) => {
    const x = pad + (i * (lineW - 2 * pad)) / Math.max(1, sorted.length - 1);
    const y = lineH - pad - (a.accuracy / 100) * (lineH - 2 * pad);
    return { x, y };
  });
  const linePath = pts.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');
  const accPath = accPts.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');

  // Radar chart for subject mastery
  const radarSize = 240;
  const cx = radarSize / 2;
  const cy = radarSize / 2;
  const radarR = 80;
  const subjects = subjectMastery.length > 0 ? subjectMastery : [{ subject: 'All', pct: avgAccuracy }];
  const radarPts = subjects.map((s, i) => {
    const angle = (Math.PI * 2 * i) / subjects.length - Math.PI / 2;
    const r = (s.pct / 100) * radarR;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, ...s };
  });
  const radarPath = radarPts.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ') + ' Z';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Performance Analytics"
        subtitle={`${attempts.length} attempts · ${latest.examName} · Latest ${(latest.score / latest.totalMarks * 100).toFixed(1)}%`}
        accent="emerald"
        right={
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setView('mock-exam')}>
            <Trophy className="h-4 w-4" /> Take another mock
          </Button>
        }
      />

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Avg Score"
          value={`${(avgScorePct * 100).toFixed(1)}%`}
          sub={`${attempts.length} attempts`}
          icon={Target}
          accent="emerald"
        />
        <StatCard
          label="Avg Accuracy"
          value={`${avgAccuracy.toFixed(0)}%`}
          sub="correct / attempted"
          icon={CheckCircle2}
          accent="teal"
        />
        <StatCard
          label="Avg Speed"
          value={`${avgSpeed.toFixed(0)}`}
          sub="questions / hr"
          icon={Zap}
          accent="amber"
        />
        <StatCard
          label="Trend"
          value={`${trendDelta >= 0 ? '+' : ''}${(trendDelta * 100).toFixed(1)}%`}
          sub={trendDelta >= 0 ? 'improving' : 'declining'}
          icon={trendDelta >= 0 ? TrendingUp : TrendingDown}
          accent={trendDelta >= 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* 2-col grid: trend + radar */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Score & Accuracy Trend */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-blue-600" /> Score & Accuracy Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <svg viewBox={`0 0 ${lineW} ${lineH}`} className="w-full h-auto">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((g) => {
                const y = lineH - pad - g * (lineH - 2 * pad);
                return (
                  <g key={g}>
                    <line x1={pad} y1={y} x2={lineW - pad} y2={y} stroke="#e7e5e4" strokeWidth={1} />
                    <text x={4} y={y + 3} fontSize={9} fill="#a8a29e">{g * 100}%</text>
                  </g>
                );
              })}
              {/* Accuracy line (dashed amber) */}
              <path d={accPath} stroke="#f59e0b" strokeWidth={2} fill="none" strokeDasharray="4 3" />
              {/* Score line (solid emerald) */}
              <path d={linePath} stroke="#059669" strokeWidth={2.5} fill="none" />
              {/* Points */}
              {pts.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r={3.5} fill="#059669" stroke="white" strokeWidth={1.5} />
                  <text x={p.x} y={lineH - 6} fontSize={9} fill="#78716c" textAnchor="middle">#{sorted.length - i}</text>
                </g>
              ))}
              {/* Legend */}
              <g>
                <line x1={lineW - 120} y1={12} x2={lineW - 100} y2={12} stroke="#059669" strokeWidth={2.5} />
                <text x={lineW - 95} y={15} fontSize={10} fill="#44403c">Score %</text>
                <line x1={lineW - 60} y1={12} x2={lineW - 40} y2={12} stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 3" />
                <text x={lineW - 35} y={15} fontSize={10} fill="#44403c">Accuracy</text>
              </g>
            </svg>
          </CardContent>
        </Card>

        {/* Subject Mastery Radar */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-4 w-4 text-amber-600" /> Subject Mastery Radar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <svg viewBox={`0 0 ${radarSize} ${radarSize}`} className="w-full max-w-[260px] h-auto">
                {/* Grid rings */}
                {[0.25, 0.5, 0.75, 1].map((r) => {
                  const ringPts = subjects.map((_, i) => {
                    const angle = (Math.PI * 2 * i) / subjects.length - Math.PI / 2;
                    return `${cx + Math.cos(angle) * r * radarR},${cy + Math.sin(angle) * r * radarR}`;
                  }).join(' ');
                  return <polygon key={r} points={ringPts} fill="none" stroke="#e7e5e4" strokeWidth={1} />;
                })}
                {/* Axes */}
                {subjects.map((s, i) => {
                  const angle = (Math.PI * 2 * i) / subjects.length - Math.PI / 2;
                  const x2 = cx + Math.cos(angle) * radarR;
                  const y2 = cy + Math.sin(angle) * radarR;
                  const lx = cx + Math.cos(angle) * (radarR + 14);
                  const ly = cy + Math.sin(angle) * (radarR + 14) + 3;
                  return (
                    <g key={i}>
                      <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="#e7e5e4" strokeWidth={1} />
                      <text x={lx} y={ly} fontSize={9} fill="#78716c" textAnchor="middle">{s.subject}</text>
                    </g>
                  );
                })}
                {/* Filled radar */}
                <path d={radarPath} fill="rgba(5, 150, 105, 0.25)" stroke="#059669" strokeWidth={2} />
                {radarPts.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={3} fill="#059669" />
                ))}
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-blue-800">
              <CheckCircle2 className="h-4 w-4" /> Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {strengths.length === 0 ? (
              <p className="text-sm text-muted-foreground">No strengths tracked yet — they appear after 1+ attempts.</p>
            ) : (
              strengths.map(([topic, count]) => (
                <div key={topic} className="flex items-center justify-between p-2 rounded-lg bg-white border border-emerald-100">
                  <span className="text-sm font-medium text-stone-800">{topic}</span>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">{count}×</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-rose-800">
              <XCircle className="h-4 w-4" /> Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {weaknesses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No weak topics tracked yet — take mocks to identify them.</p>
            ) : (
              weaknesses.map(([topic, count]) => (
                <div key={topic} className="flex items-center justify-between p-2 rounded-lg bg-white border border-rose-100">
                  <span className="text-sm font-medium text-stone-800">{topic}</span>
                  <Badge className="bg-rose-100 text-rose-700 border-rose-200">{count}×</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Regional Cohort & Cutoff Tracker */}
      <Card className="border-indigo-200/80 bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/30">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                <Globe className="h-4 w-4 text-indigo-600" />
                Regional Benchmark & Cutoff Tracker
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Compare your percentile, rank, and seat eligibility against India National or GCC NRI applicant pools.
              </p>
            </div>

            {/* Region Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setRegionTracker('India')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  regionTracker === 'India'
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span>🇮🇳 India Cohort</span>
              </button>
              <button
                type="button"
                onClick={() => setRegionTracker('GCC')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  regionTracker === 'GCC'
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span>🇦🇪 GCC Cohort (NRI/DASA)</span>
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {regionTracker === 'India' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-white shadow-2xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">India National AIR Projection</span>
                <p className="text-xl font-black text-slate-900">#{latest.rank ? latest.rank.toLocaleString() : '1,420'}</p>
                <p className="text-xs text-slate-500">Based on {(avgScorePct * 100).toFixed(1)}% avg score across India cohort</p>
              </div>

              <div className="p-3.5 rounded-xl border border-blue-200 bg-white shadow-2xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">All-India Percentile</span>
                <p className="text-xl font-black text-slate-900">{latest.percentile ? latest.percentile.toFixed(1) : (avgAccuracy).toFixed(1)}%ile</p>
                <p className="text-xs text-slate-500">Exceeds General Cutoff for Tier-1 Institutes</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Home State / National Quota</span>
                <p className="text-xl font-black text-emerald-600">High Probability</p>
                <p className="text-xs text-slate-500">85% State Quota & All-India Seat Allocation</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-xl border border-amber-200 bg-white shadow-2xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">GCC NRI Centers Percentile</span>
                <p className="text-xl font-black text-slate-900">
                  {Math.min(99.9, ((latest.percentile || avgAccuracy) + 2.4)).toFixed(1)}%ile
                </p>
                <p className="text-xs text-slate-500">Benchmarked against Dubai, Abu Dhabi, Doha & Riyadh centers</p>
              </div>

              <div className="p-3.5 rounded-xl border border-indigo-200 bg-white shadow-2xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">DASA Scheme Eligibility</span>
                <p className="text-xl font-black text-indigo-700">Top 5% Band</p>
                <p className="text-xs text-slate-500">Direct Admission of Students Abroad for NITs/IIITs</p>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-200 bg-white shadow-2xs space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">CIWG Quota Status</span>
                <p className="text-xl font-black text-emerald-600">Qualified (5% Quota)</p>
                <p className="text-xs text-slate-500">Children of Indian Workers in Gulf (Indian fee structure)</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attempt history */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-stone-600" /> Attempt History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {reversed.map((a, idx) => {
              const scorePct = a.score / a.totalMarks;
              const accent = scorePct >= 0.7 ? 'emerald' : scorePct >= 0.5 ? 'amber' : 'rose';
              return (
                <div key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-stone-200 bg-white">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0',
                      accent === 'emerald' ? 'bg-blue-100 text-blue-700' : accent === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    )}>
                      {attempts.length - idx}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">{a.examName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.submittedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="bg-stone-50 text-stone-700 border-stone-200">
                      {a.score}/{a.totalMarks}
                    </Badge>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      P{a.percentile}
                    </Badge>
                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                      {a.accuracy}% acc
                    </Badge>
                    {a.weakTopics[0] && (
                      <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
                        Weak: {a.weakTopics[0]}
                      </Badge>
                    )}
                    {a.strongTopics[0] && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                        Strong: {a.strongTopics[0]}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50 ml-auto"
                      onClick={() => setSelectedAttempt(a)}
                    >
                      <KeyRound className="h-3 w-3 mr-1" /> View Key & Solutions
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="border-stone-200 bg-gradient-to-r from-emerald-50 to-amber-50">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-stone-900">Push for your target score</h4>
              <p className="text-sm text-muted-foreground mt-0.5">
                Use AI tools to predict your trajectory and get a personalised improvement plan.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setView('digital-twin')}>
              <Sparkles className="h-4 w-4" /> Digital Twin
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setView('planner')}>
              <Brain className="h-4 w-4" /> Get plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
