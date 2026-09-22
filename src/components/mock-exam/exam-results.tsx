'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useStore } from '@/lib/store';
import type { ExamAttempt, BehaviorAnalysis, SubjectScore, TopicScore, YoutubeRec } from '@/lib/types';
import { StatCard, SectionTitle } from '@/components/shared';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Trophy, Target, Gauge, TrendingUp, AlertTriangle, Youtube, ExternalLink, RotateCcw,
  ArrowRight, Zap, Brain, Award, Flame, BookOpen, Lightbulb, FileText, Clock,
  CheckCircle2, Circle, AlertCircle, ChevronRight, BarChart3, Activity, Sparkles,
  ShieldCheck, Layers, KeyRound, XCircle, Check, Filter,
} from 'lucide-react';
import { IntegrityReportTab } from '@/components/proctoring/integrity-report';
import type { IntegrityReport } from '@/lib/types';

interface Props {
  attempt: ExamAttempt;
  onRetake: () => void;
  onExit: () => void;
  integrityReport?: IntegrityReport | null;
}

function gradeFor(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'E';
}

function fmtDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm > 0 ? `${h}h ${mm}m` : `${h}h`;
}

export function ExamResults({ attempt, onRetake, onExit, integrityReport }: Props) {
  const setView = useStore((s) => s.setView);
  const user = useStore((s) => s.user);
  const { toast } = useToast();
  const [learned, setLearned] = React.useState<Set<string>>(new Set());

  const pct = Math.round((attempt.score / Math.max(1, attempt.totalMarks)) * 100);
  const grade = gradeFor(pct);

  function toggleLearned(key: string) {
    setLearned((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Score hero */}
      <Card className="bg-hero-emerald border-blue-200">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-md flex-shrink-0">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{attempt.examName}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Submitted {new Date(attempt.submittedAt).toLocaleString(undefined, {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                  {attempt.attemptNumber ? ` · Attempt #${attempt.attemptNumber}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onExit}>
                <RotateCcw className="h-4 w-4" /> Retake
              </Button>
              <Button variant="ghost" onClick={onExit}>
                Back
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <StatCard
              label="Score / Total"
              value={`${attempt.score} / ${attempt.totalMarks}`}
              sub={`Grade ${grade} · ${pct}%`}
              icon={Award}
              accent="emerald"
            />
            <StatCard
              label="Percentile"
              value={attempt.percentile.toFixed(1)}
              sub="vs. cohort"
              icon={TrendingUp}
              accent="teal"
            />
            <StatCard
              label="Predicted AIR"
              value={`#${attempt.rank.toLocaleString()}`}
              sub="estimated rank"
              icon={Target}
              accent="amber"
            />
            <StatCard
              label="Readiness Index"
              value={`${attempt.readinessIndex}`}
              sub="/ 1000"
              icon={Gauge}
              accent="rose"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="solutions">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="solutions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">
            <KeyRound className="h-3.5 w-3.5 mr-1" /> Answer Key & Full Solutions
          </TabsTrigger>
          <TabsTrigger value="subjects"><BookOpen className="h-3.5 w-3.5 mr-1" /> Subjects</TabsTrigger>
          <TabsTrigger value="topics"><Layers className="h-3.5 w-3.5 mr-1" /> Topics</TabsTrigger>
          <TabsTrigger value="behavior"><Brain className="h-3.5 w-3.5 mr-1" /> Behavior</TabsTrigger>
          <TabsTrigger value="insights"><Lightbulb className="h-3.5 w-3.5 mr-1" /> Insights</TabsTrigger>
          <TabsTrigger value="youtube"><Youtube className="h-3.5 w-3.5 mr-1" /> YouTube Fixes</TabsTrigger>
          <TabsTrigger value="integrity"><ShieldCheck className="h-3.5 w-3.5 mr-1" /> Integrity</TabsTrigger>
        </TabsList>

        <TabsContent value="solutions" className="mt-4">
          <SolutionsTab attempt={attempt} />
        </TabsContent>
        <TabsContent value="subjects" className="mt-4">
          <SubjectsTab attempt={attempt} />
        </TabsContent>
        <TabsContent value="topics" className="mt-4">
          <TopicsTab attempt={attempt} />
        </TabsContent>
        <TabsContent value="behavior" className="mt-4">
          <BehaviorPanel attempt={attempt} />
        </TabsContent>
        <TabsContent value="insights" className="mt-4">
          <InsightsTab attempt={attempt} />
        </TabsContent>
        <TabsContent value="youtube" className="mt-4">
          <YoutubeTab
            recs={attempt.youtubeRecs}
            learned={learned}
            onToggle={toggleLearned}
            onRetake={onRetake}
            onAskMentor={() => {
              setView('mentor');
              toast({ title: 'Opening AI Mentor', description: 'Ask about your weak topics.' });
            }}
          />
        </TabsContent>

        <TabsContent value="integrity" className="mt-4">
          <IntegrityReportTab report={integrityReport ?? null} />
        </TabsContent>
      </Tabs>

      {/* Footer CTA */}
      <Card className="border-blue-200 bg-blue-50/40">
        <CardContent className="pt-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" /> Want deeper AI analysis?
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Unlock richer projections with your digital twin, weakness radar, or full analytics dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setView('digital-twin')}>
              <Brain className="h-4 w-4" /> Digital Twin
            </Button>
            <Button variant="outline" onClick={() => setView('weakness-radar')}>
              <Target className="h-4 w-4" /> Weakness Radar
            </Button>
            <Button onClick={() => setView('analytics')}>
              <BarChart3 className="h-4 w-4" /> Full Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------- Subjects tab -----------------
function SubjectsTab({ attempt }: { attempt: ExamAttempt }) {
  const subjects = attempt.subjectScores;
  const strengths = attempt.strongTopics.slice(0, 6);
  const weaknesses = attempt.weakTopics.slice(0, 6);

  function colorFor(pct: number): { bar: string; text: string; bg: string } {
    if (pct >= 75) return { bar: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' };
    if (pct >= 50) return { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' };
    return { bar: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' };
  }

  return (
    <div className="space-y-4">
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" /> Subject-wise performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {subjects.map((s: SubjectScore) => {
            const pct = Math.round((s.scored / Math.max(1, s.total)) * 100);
            const c = colorFor(pct);
            return (
              <div key={s.subject} className={cn('rounded-md border border-stone-200 p-3', c.bg)}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{s.subject}</span>
                    <Badge variant="outline" className="border-stone-300 text-xs">
                      {s.correct} ✓ · {s.wrong} ✗ · {s.unattempted} –
                    </Badge>
                  </div>
                  <span className={cn('text-sm font-semibold', c.text)}>
                    {s.scored}/{s.total} · {pct}%
                  </span>
                </div>
                <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', c.bar)} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                  <span>Accuracy {s.accuracy}%</span>
                  <span>{pct >= 75 ? 'Strong' : pct >= 50 ? 'Average' : 'Needs work'}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-blue-200 bg-blue-50/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-blue-800">
              <CheckCircle2 className="h-4 w-4" /> Strengths
            </CardTitle>
            <CardDescription>Topics you aced (accuracy ≥ 75%)</CardDescription>
          </CardHeader>
          <CardContent>
            {strengths.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {strengths.map((t) => (
                  <Badge key={t} className="bg-blue-100 text-blue-800 border border-blue-200">
                    <CheckCircle2 className="h-3 w-3" /> {t}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No strengths yet — keep practising!</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-rose-800">
              <AlertTriangle className="h-4 w-4" /> Weaknesses
            </CardTitle>
            <CardDescription>Topics to revise (accuracy &lt; 50%)</CardDescription>
          </CardHeader>
          <CardContent>
            {weaknesses.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {weaknesses.map((t) => (
                  <Badge key={t} className="bg-rose-100 text-rose-800 border border-rose-200">
                    <AlertTriangle className="h-3 w-3" /> {t}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No weak topics — excellent!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ----------------- Topics tab -----------------
function TopicsTab({ attempt }: { attempt: ExamAttempt }) {
  const topics = attempt.topicScores;
  function colorFor(acc: number): string {
    if (acc >= 75) return 'bg-blue-500 text-white';
    if (acc >= 60) return 'bg-blue-300 text-blue-900';
    if (acc >= 45) return 'bg-amber-300 text-amber-900';
    if (acc >= 30) return 'bg-amber-500 text-white';
    return 'bg-rose-500 text-white';
  }
  return (
    <Card className="border-stone-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-blue-600" /> Topic-wise accuracy heatmap
        </CardTitle>
        <CardDescription>Color-coded by accuracy — hover for details</CardDescription>
      </CardHeader>
      <CardContent>
        {topics.length === 0 ? (
          <p className="text-sm text-muted-foreground">No topic breakdown available.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {topics.map((t: TopicScore) => {
              const cls = colorFor(t.accuracy);
              return (
                <div
                  key={`${t.subject}|${t.topic}`}
                  className={cn('rounded-md p-2.5 border border-white/40', cls)}
                  title={`${t.subject} · ${t.topic} · ${t.accuracy}% · ${t.correct}/${Math.max(1, Math.round(t.total / Math.max(1, t.scored || 1)))} correct`}
                >
                  <p className="text-[10px] opacity-80 uppercase tracking-wide truncate">{t.subject}</p>
                  <p className="text-xs font-semibold truncate">{t.topic}</p>
                  <p className="text-sm font-bold mt-0.5">{t.accuracy}%</p>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-muted-foreground">
          <span>Low</span>
          <span className="h-2.5 w-6 bg-rose-500 rounded" />
          <span className="h-2.5 w-6 bg-amber-500 rounded" />
          <span className="h-2.5 w-6 bg-amber-300 rounded" />
          <span className="h-2.5 w-6 bg-blue-300 rounded" />
          <span className="h-2.5 w-6 bg-blue-500 rounded" />
          <span>High</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------- Behavior panel (NEW key feature) -----------------
function BehaviorPanel({ attempt }: { attempt: ExamAttempt }) {
  const b = attempt.behavior;

  if (!b) {
    return (
      <Card className="border-stone-200">
        <CardContent className="pt-10 pb-10 flex flex-col items-center text-center gap-3">
          <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center">
            <Brain className="h-6 w-6 text-stone-400" />
          </div>
          <div>
            <h3 className="font-semibold">Behavior analysis not available</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              We couldn&apos;t capture detailed timing data for this attempt. Future mocks will include a full behavioural breakdown.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalTime = attempt.durationSec;
  const speed = attempt.speed;
  const idlePct = totalTime > 0 ? Math.round((b.idleTimeSec / totalTime) * 100) : 0;
  const deciles = b.speedProgression;
  const maxDecileSec = Math.max(1, ...deciles.map((d) => d.avgSec));
  const overallAvg = deciles.length > 0
    ? Math.round(deciles.reduce((a, d) => a + d.avgSec, 0) / deciles.length)
    : 0;

  const paceStyle =
    b.paceTrend === 'speeding-up'
      ? { bg: 'bg-blue-50 border-blue-200 text-blue-800', icon: TrendingUp, label: 'Speeding up', desc: 'You picked up pace through the paper — momentum built nicely. Watch for rushed answers near the end.' }
      : b.paceTrend === 'slowing-down'
        ? { bg: 'bg-amber-50 border-amber-200 text-amber-800', icon: AlertTriangle, label: 'Slowing down', desc: 'Fatigue may have set in during the second half. Consider endurance drills and shorter focused sessions.' }
        : { bg: 'bg-teal-50 border-teal-200 text-teal-800', icon: Activity, label: 'Steady', desc: 'You maintained a consistent pace throughout. Strong exam discipline.' };

  const PaceIcon = paceStyle.icon;

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Time" value={fmtDuration(totalTime)} sub={`${attempt.avgTimePerQuestion}s/Q avg`} icon={Clock} accent="emerald" />
        <StatCard label="Speed" value={`${speed}`} sub="questions / hr" icon={Zap} accent="teal" />
        <StatCard label="Idle Time" value={fmtDuration(b.idleTimeSec)} sub={`${b.idlePauses} pauses · ${idlePct}%`} icon={AlertCircle} accent="amber" />
        <StatCard label="Time of Day" value={b.timeOfDay} sub={`started ${String(b.startedAtHour).padStart(2, '0')}:00`} icon={Clock} accent="rose" />
      </div>

      {/* Pace trend banner */}
      <Card className={cn('border', paceStyle.bg)}>
        <CardContent className="pt-6 flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0">
            <PaceIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide opacity-70">Pace Trend</p>
            <p className="font-semibold">{paceStyle.label}</p>
            <p className="text-sm mt-1 leading-relaxed">{paceStyle.desc}</p>
          </div>
        </CardContent>
      </Card>

      {/* Speed progression bar chart */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" /> Speed Progression (deciles)
          </CardTitle>
          <CardDescription>
            Average seconds per question, split into 10 equal buckets across the paper. Green = on-pace, Amber = rushing, Rose = fatigue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-1.5 h-40">
            {deciles.map((d) => {
              const h = Math.max(4, Math.round((d.avgSec / maxDecileSec) * 100));
              const delta = d.avgSec - overallAvg;
              const cls =
                delta < -overallAvg * 0.2
                  ? 'bg-amber-400'
                  : delta > overallAvg * 0.3
                    ? 'bg-rose-400'
                    : 'bg-blue-500';
              return (
                <div key={d.decile} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{d.avgSec}s</span>
                  <div className="w-full bg-stone-100 rounded-t-md overflow-hidden flex items-end" style={{ height: '120px' }}>
                    <div
                      className={cn('w-full rounded-t-md transition-all', cls)}
                      style={{ height: `${h}%` }}
                      title={`D${d.decile} · ${d.avgSec}s avg`}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">D{d.decile}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-2 border-t border-stone-100">
            <span>Average: <strong className="text-stone-700">{overallAvg}s/Q</strong></span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="h-2 w-3 bg-blue-500 rounded-sm" /> On-pace</span>
              <span className="flex items-center gap-1"><span className="h-2 w-3 bg-amber-400 rounded-sm" /> Rushing</span>
              <span className="flex items-center gap-1"><span className="h-2 w-3 bg-rose-400 rounded-sm" /> Fatigue</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Time spent per subject */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" /> Time per subject
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {b.avgTimeBySubject.map((s) => {
              const max = Math.max(1, ...b.avgTimeBySubject.map((x) => x.avgSec));
              const w = Math.round((s.avgSec / max) * 100);
              return (
                <div key={s.subject}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">{s.subject}</span>
                    <span className="text-muted-foreground">{fmtDuration(s.avgSec)} avg</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${w}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Difficulty vs time */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="h-4 w-4 text-blue-600" /> Difficulty vs Time
            </CardTitle>
            <CardDescription>Extra seconds on hard questions vs easy ones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <p className="text-4xl font-bold text-blue-700">
                  +{b.difficultyTimeGap > 0 ? fmtDuration(b.difficultyTimeGap) : '0s'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Average extra time on hard questions vs easy ones.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="rounded-md bg-amber-50 border border-amber-200 p-2.5">
                <p className="text-xs text-amber-700 flex items-center gap-1"><Zap className="h-3 w-3" /> Rapid Guesses</p>
                <p className="text-xl font-bold text-amber-900 mt-0.5">{b.rapidGuesses}</p>
                <p className="text-[10px] text-amber-700/70">&lt; 10s per question</p>
              </div>
              <div className="rounded-md bg-rose-50 border border-rose-200 p-2.5">
                <p className="text-xs text-rose-700 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Idle Pauses</p>
                <p className="text-xl font-bold text-rose-900 mt-0.5">{b.idlePauses}</p>
                <p className="text-[10px] text-rose-700/70">&gt; 60s pauses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison to previous attempt */}
      {b.vsPrevious && (
        <ComparisonCard vs={b.vsPrevious} attempt={attempt} />
      )}

      {/* AI Behaviour Coaching */}
      <CoachingCard b={b} attempt={attempt} />
    </div>
  );
}

function ComparisonCard({ vs, attempt }: { vs: NonNullable<BehaviorAnalysis['vsPrevious']>; attempt: ExamAttempt }) {
  const cards = [
    { label: 'Score', value: vs.scoreDelta, suffix: '', good: vs.scoreDelta > 0, neutral: vs.scoreDelta === 0 },
    { label: 'Speed', value: vs.speedDelta, suffix: ' Q/hr', good: vs.speedDelta > 0, neutral: vs.speedDelta === 0 },
    { label: 'Accuracy', value: vs.accuracyDelta, suffix: '%', good: vs.accuracyDelta > 0, neutral: vs.accuracyDelta === 0 },
  ];
  const msg = vs.isImprovement
    ? `Nice work — you improved on your last ${attempt.examName} attempt. Keep this momentum going!`
    : `You slipped vs your previous attempt. Revisit the weak topics below and try again — every mock teaches you something.`;
  return (
    <Card className="border-teal-200 bg-teal-50/40">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-teal-800">
          <TrendingUp className="h-4 w-4" /> Comparison to previous attempt
        </CardTitle>
        <CardDescription>{msg}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {cards.map((c) => (
            <div
              key={c.label}
              className={cn(
                'rounded-md border p-3 text-center',
                c.neutral
                  ? 'bg-stone-50 border-stone-200'
                  : c.good
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-rose-50 border-rose-200',
              )}
            >
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={cn(
                'text-xl font-bold mt-1',
                c.neutral ? 'text-stone-700' : c.good ? 'text-blue-700' : 'text-rose-700',
              )}>
                {c.value > 0 ? '+' : ''}{c.value}{c.suffix}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CoachingCard({ b, attempt }: { b: BehaviorAnalysis; attempt: ExamAttempt }) {
  const recs: { tone: 'warn' | 'good' | 'tip'; title: string; body: string }[] = [];

  if (b.rapidGuesses > 5) {
    recs.push({
      tone: 'warn',
      title: `${b.rapidGuesses} rapid guesses detected`,
      body: 'You answered several questions in under 10 seconds. These are likely blind guesses. Train yourself to flag and skip instead — guessing racks up negative marks.',
    });
  }
  if (b.idlePauses > 3) {
    recs.push({
      tone: 'warn',
      title: `${b.idlePauses} long idle pauses`,
      body: `You spent ${fmtDuration(b.idleTimeSec)} frozen on questions. If a question stumps you for >60s, mark it for review and move on — your brain will often solve it subconsciously while you tackle the next one.`,
    });
  }
  if (b.paceTrend === 'slowing-down') {
    recs.push({
      tone: 'warn',
      title: 'End-of-paper fatigue',
      body: 'Your pace dropped in the second half. Build exam endurance with full-length timed mocks every week and stay hydrated during the test.',
    });
  }
  if (b.paceTrend === 'speeding-up' && b.rapidGuesses > 3) {
    recs.push({
      tone: 'tip',
      title: 'Rein in your finish sprint',
      body: 'You sped up at the end but accuracy often drops with speed. Reserve the last 5 minutes for review, not new attempts.',
    });
  }
  if (b.difficultyTimeGap < 15 && attempt.accuracy < 70) {
    recs.push({
      tone: 'tip',
      title: 'Spend more time on hard questions',
      body: 'You spent almost the same time on easy and hard questions. Hard questions deserve 50-100% more time — but only after you\'ve banked the easy marks.',
    });
  }

  const isExcellent = recs.length === 0;

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-blue-600" /> AI Behaviour Coaching
        </CardTitle>
        <CardDescription>Personalised recommendations based on your exam behaviour</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isExcellent ? (
          <div className="flex items-start gap-3 p-3 rounded-md bg-blue-100 border border-blue-300">
            <CheckCircle2 className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Excellent exam discipline!</p>
              <p className="text-sm text-blue-800 mt-1">
                You kept a steady pace, avoided excessive idle time, and didn&apos;t rush. Keep this rhythm — you&apos;re in great shape for the real exam.
              </p>
            </div>
          </div>
        ) : (
          recs.map((r, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-3 p-3 rounded-md border',
                r.tone === 'warn'
                  ? 'bg-amber-50 border-amber-200'
                  : r.tone === 'tip'
                    ? 'bg-teal-50 border-teal-200'
                    : 'bg-blue-50 border-blue-200',
              )}
            >
              {r.tone === 'warn'
                ? <AlertTriangle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                : r.tone === 'tip'
                  ? <Lightbulb className="h-5 w-5 text-teal-700 flex-shrink-0 mt-0.5" />
                  : <CheckCircle2 className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />}
              <div>
                <p className="font-semibold text-sm text-stone-900">{r.title}</p>
                <p className="text-sm text-stone-700 mt-0.5 leading-relaxed">{r.body}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ----------------- Insights tab -----------------
function InsightsTab({ attempt }: { attempt: ExamAttempt }) {
  const { toast } = useToast();
  const setView = useStore((s) => s.setView);
  const slowest = [...attempt.results]
    .sort((a, b) => b.timeTakenSec - a.timeTakenSec)
    .slice(0, 5);

  const highConf = attempt.results.filter((r) => r.confidence === 'high').length;
  const medConf = attempt.results.filter((r) => r.confidence === 'medium').length;
  const lowConf = attempt.results.filter((r) => r.confidence === 'low').length;
  const total = Math.max(1, attempt.results.length);

  const studyHours = Math.max(2, Math.round(attempt.weakTopics.length * 2.5));
  const projected = Math.min(99, attempt.percentile + 5 + Math.round(attempt.weakTopics.length * 0.8));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Accuracy" value={`${attempt.accuracy}%`} sub={`${attempt.results.filter(r => r.correct).length} correct`} icon={Target} accent="emerald" />
        <StatCard label="Speed" value={`${attempt.speed}`} sub="Q / hr" icon={Zap} accent="teal" />
        <StatCard label="Avg Time / Q" value={`${attempt.avgTimePerQuestion}s`} sub={`over ${attempt.durationSec / 60 | 0} min`} icon={Clock} accent="amber" />
      </div>

      {/* Confidence distribution */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="h-4 w-4 text-blue-600" /> Confidence distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: 'High confidence', count: highConf, color: 'bg-blue-500', text: 'text-blue-700' },
            { label: 'Medium confidence', count: medConf, color: 'bg-amber-400', text: 'text-amber-700' },
            { label: 'Low confidence', count: lowConf, color: 'bg-rose-400', text: 'text-rose-700' },
          ].map((c) => (
            <div key={c.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium">{c.label}</span>
                <span className={cn('font-semibold', c.text)}>{c.count} · {Math.round((c.count / total) * 100)}%</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', c.color)} style={{ width: `${(c.count / total) * 100}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Time sinks */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" /> Slowest questions (time sinks)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {slowest.length === 0 ? (
            <p className="text-sm text-muted-foreground">No per-question timing data available.</p>
          ) : (
            slowest.map((r, i) => (
              <div key={r.questionId} className="flex items-center justify-between gap-3 border border-stone-200 rounded-md p-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground w-5">#{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.subject} · {r.topic}</p>
                    <p className="text-xs text-muted-foreground capitalize">{r.difficulty} · {r.correct ? 'Correct' : r.partial ? 'Partial' : 'Wrong'}</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-stone-300">
                  <Clock className="h-3 w-3" /> {fmtDuration(r.timeTakenSec)}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* AI improvement plan */}
      <Card className="border-blue-200 bg-blue-50/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-blue-600" /> AI Improvement Plan
          </CardTitle>
          <CardDescription>Targeted next steps based on this attempt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-white border border-blue-200 p-3">
              <p className="text-xs text-muted-foreground">Recommended study hours / week</p>
              <p className="text-2xl font-bold text-blue-700">{studyHours}h</p>
            </div>
            <div className="rounded-md bg-white border border-blue-200 p-3">
              <p className="text-xs text-muted-foreground">Projected next-attempt percentile</p>
              <p className="text-2xl font-bold text-blue-700">{projected}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">7-Day Focus Plan</p>
            <div className="space-y-1.5">
              {attempt.weakTopics.slice(0, 5).map((t, i) => (
                <div key={t} className="flex items-center justify-between gap-2 text-sm border border-stone-200 rounded-md px-3 py-1.5 bg-white">
                  <span className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">D{i + 1}</span>
                    <span className="font-medium">{t}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{i + 1}h study + practice set</span>
                </div>
              ))}
              {attempt.weakTopics.length === 0 && (
                <p className="text-sm text-muted-foreground">No weak topics — focus on advanced problem-solving.</p>
              )}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => {
              setView('planner');
              toast({ title: 'Opening AI Planner', description: 'Generating your personalised study plan.' });
            }}
          >
            <Sparkles className="h-4 w-4" /> Generate AI Study Plan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------- YouTube tab -----------------
function YoutubeTab({
  recs, learned, onToggle, onRetake, onAskMentor,
}: {
  recs: YoutubeRec[];
  learned: Set<string>;
  onToggle: (k: string) => void;
  onRetake: () => void;
  onAskMentor: () => void;
}) {
  const grouped = React.useMemo(() => {
    const m: Record<string, YoutubeRec[]> = {};
    for (const r of recs) {
      if (!m[r.topic]) m[r.topic] = [];
      m[r.topic].push(r);
    }
    return m;
  }, [recs]);

  const topics = Object.keys(grouped);

  return (
    <div className="space-y-4">
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Youtube className="h-4 w-4 text-rose-600" /> Curated YouTube fixes
          </CardTitle>
          <CardDescription>Hand-picked videos for your weak topics — mark them as learned when done.</CardDescription>
        </CardHeader>
        <CardContent>
          {topics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No weak topics to fix — great work!</p>
          ) : (
            <div className="space-y-4">
              {topics.map((topic) => (
                <div key={topic}>
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Flame className="h-3.5 w-3.5 text-rose-600" /> {topic}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {grouped[topic].map((v) => {
                      const key = `${topic}|${v.videoId}`;
                      const isLearned = learned.has(key);
                      return (
                        <Card key={key} className={cn('border-stone-200 overflow-hidden', isLearned && 'opacity-60')}>
                          <a
                            href={v.searchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block aspect-video bg-stone-100 overflow-hidden relative group"
                          >
                            {v.thumbnail ? (
                              <img
                                src={v.thumbnail}
                                alt={v.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <Youtube className="h-10 w-10" />
                              </div>
                            )}
                            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                              {v.duration}
                            </span>
                          </a>
                          <CardContent className="p-3">
                            <p className="text-sm font-medium line-clamp-2 leading-snug">{v.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Youtube className="h-3 w-3" /> {v.channel}
                            </p>
                            <div className="flex items-center gap-1.5 mt-2">
                              <Button
                                size="sm"
                                variant={isLearned ? 'default' : 'outline'}
                                className="flex-1"
                                onClick={() => onToggle(key)}
                              >
                                {isLearned ? (
                                  <><CheckCircle2 className="h-3.5 w-3.5" /> Learned</>
                                ) : (
                                  <><Circle className="h-3.5 w-3.5" /> Mark as learned</>
                                )}
                              </Button>
                              <Button size="sm" variant="ghost" asChild>
                                <a href={v.searchUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2 justify-end">
        <Button variant="outline" onClick={onAskMentor}>
          <Brain className="h-4 w-4" /> Ask AI Mentor
        </Button>
        <Button onClick={onRetake}>
          <RotateCcw className="h-4 w-4" /> Retake Mock
        </Button>
      </div>
    </div>
  );
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function formatOptionValue(opt: unknown): string {
  if (opt === null || opt === undefined) return '';
  if (typeof opt === 'string') return opt;
  if (typeof opt === 'number') {
    const rounded = Math.round(opt * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
  }
  if (Array.isArray(opt)) {
    return opt.map(formatOptionValue).filter(Boolean).join(' ');
  }
  return String(opt);
}

function SolutionsTab({ attempt }: { attempt: ExamAttempt }) {
  const setView = useStore((s) => s.setView);
  const addMentorMessage = useStore((s) => s.addMentorMessage);
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = React.useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');
  const [subjectFilter, setSubjectFilter] = React.useState<string>('all');
  const [expandedSolutions, setExpandedSolutions] = React.useState<Record<string, boolean>>({});

  const questionsMap = React.useMemo(() => {
    const map = new Map<string, any>();
    (attempt.questions || []).forEach((q) => map.set(q.id, q));
    return map;
  }, [attempt.questions]);

  const results = attempt.results || [];

  const correctCount = results.filter((r) => r.correct).length;
  const incorrectCount = results.filter((r) => !r.correct && attempt.answers[r.questionId] && attempt.answers[r.questionId].type !== 'unanswered').length;
  const unattemptedCount = results.filter((r) => !attempt.answers[r.questionId] || attempt.answers[r.questionId].type === 'unanswered').length;

  const subjects = React.useMemo(() => {
    return Array.from(new Set(results.map((r) => r.subject)));
  }, [results]);

  const filteredResults = React.useMemo(() => {
    return results.map((r, originalIdx) => ({ r, originalIdx })).filter(({ r }) => {
      const ans = attempt.answers[r.questionId];
      const isUnattempted = !ans || ans.type === 'unanswered';
      const isCorrect = r.correct;
      const isIncorrect = !isCorrect && !isUnattempted;

      if (statusFilter === 'correct' && !isCorrect) return false;
      if (statusFilter === 'incorrect' && !isIncorrect) return false;
      if (statusFilter === 'unattempted' && !isUnattempted) return false;

      if (subjectFilter !== 'all' && r.subject !== subjectFilter) return false;

      return true;
    });
  }, [results, attempt.answers, statusFilter, subjectFilter]);

  const toggleExpand = (qId: string) => {
    setExpandedSolutions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleAskMentor = (q: any, result: any, index: number) => {
    const qText = q?.text || `Question #${index + 1}`;
    const userAns = attempt.answers[result.questionId];
    let userAnsStr = 'Unattempted';
    if (userAns) {
      if (userAns.type === 'mcq') userAnsStr = `Option ${LETTERS[userAns.optionIndex]}`;
      else if (userAns.type === 'numerical') userAnsStr = `${userAns.value}`;
    }

    addMentorMessage({
      id: Math.random().toString(36).slice(2, 11),
      role: 'user',
      content: `I need help understanding Question #${index + 1} (${result.subject} - ${result.topic}) from my ${attempt.examName} test: "${qText}". My answer was: ${userAnsStr}. Can you explain the fundamental principle and step-by-step method to solve this?`,
      timestamp: new Date().toISOString(),
    });

    setView('mentor');
    toast({
      title: 'Opening AI Mentor',
      description: `Question #${index + 1} loaded into chat.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Statistics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-emerald-200 bg-emerald-50/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Correct Answers</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">{correctCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">+{correctCount * 4} marks gained</span>
        </Card>

        <Card className="border-rose-200 bg-rose-50/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">Incorrect Answers</span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-700 mt-1">{incorrectCount}</p>
          <span className="text-[10px] text-rose-600 font-medium">-{incorrectCount} negative marks</span>
        </Card>

        <Card className="border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Unattempted</span>
            <Circle className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-800 mt-1">{unattemptedCount}</p>
          <span className="text-[10px] text-slate-500">0 penalty</span>
        </Card>

        <Card className="border-blue-200 bg-blue-50/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">Accuracy</span>
            <Target className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700 mt-1">{attempt.accuracy}%</p>
          <span className="text-[10px] text-blue-600 font-medium">{attempt.speed} q/hr speed</span>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Filter:
          </span>
          <Button
            size="sm"
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            className="h-7 text-xs font-semibold rounded-lg"
          >
            All ({results.length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'correct' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('correct')}
            className={cn('h-7 text-xs font-semibold rounded-lg', statusFilter === 'correct' && 'bg-emerald-600 text-white')}
          >
            Correct ({correctCount})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'incorrect' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('incorrect')}
            className={cn('h-7 text-xs font-semibold rounded-lg', statusFilter === 'incorrect' && 'bg-rose-600 text-white')}
          >
            Incorrect ({incorrectCount})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'unattempted' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('unattempted')}
            className={cn('h-7 text-xs font-semibold rounded-lg', statusFilter === 'unattempted' && 'bg-slate-700 text-white')}
          >
            Unattempted ({unattemptedCount})
          </Button>
        </div>

        {subjects.length > 1 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium">Subject:</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="h-8 text-xs border border-slate-200 rounded-lg px-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="all">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredResults.length === 0 ? (
          <div className="text-center py-12 border rounded-2xl bg-slate-50/50">
            <CheckCircle2 className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No questions match the selected filter.</p>
          </div>
        ) : (
          filteredResults.map(({ r: res, originalIdx: idx }) => {
            const q = questionsMap.get(res.questionId);
            const userAns = attempt.answers[res.questionId];
            const isUnattempted = !userAns || userAns.type === 'unanswered';
            const isCorrect = res.correct;
            const isIncorrect = !isCorrect && !isUnattempted;
            const isExpanded = expandedSolutions[res.questionId] ?? true; // expanded by default

            const options = (q?.options || []).map(formatOptionValue);
            const correctOptIdx = q?.correctOptions?.[0] ?? 0;
            const userOptIdx = userAns && userAns.type === 'mcq' ? userAns.optionIndex : null;

            return (
              <Card
                key={res.questionId}
                className={cn(
                  'border transition-all overflow-hidden',
                  isCorrect && 'border-emerald-300 bg-white dark:bg-slate-900',
                  isIncorrect && 'border-rose-300 bg-white dark:bg-slate-900',
                  isUnattempted && 'border-slate-200 bg-white dark:bg-slate-900'
                )}
              >
                {/* Header Bar */}
                <div
                  className={cn(
                    'p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 border-b',
                    isCorrect && 'bg-emerald-50/50 border-emerald-200',
                    isIncorrect && 'bg-rose-50/50 border-rose-200',
                    isUnattempted && 'bg-slate-50/60 border-slate-200'
                  )}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn('text-xs font-bold text-white', isCorrect ? 'bg-emerald-600' : isIncorrect ? 'bg-rose-600' : 'bg-slate-600')}>
                      {isCorrect ? '✓ Correct' : isIncorrect ? '✗ Incorrect' : '– Unattempted'}
                    </Badge>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Q {idx + 1}</span>
                    <Badge variant="outline" className="border-slate-300 text-xs font-medium">{res.subject}</Badge>
                    <Badge variant="outline" className="border-slate-300 text-xs font-medium">{res.topic}</Badge>
                    <Badge variant="secondary" className="text-[11px] uppercase font-semibold">{res.difficulty}</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded', isCorrect ? 'bg-emerald-100 text-emerald-800' : isIncorrect ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700')}>
                      {res.awardedMarks > 0 ? `+${res.awardedMarks}` : res.awardedMarks} marks
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {res.timeTakenSec}s
                    </span>
                  </div>
                </div>

                <CardContent className="p-4 sm:p-6 space-y-4">
                  {/* PYQ Year and Frequency Tag */}
                  {q?.isPYQ && (
                    <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-3 rounded-lg bg-blue-50/60 border border-blue-200 text-xs">
                      <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-blue-600" />
                        <span>{q.pyqExam || attempt.examName} PYQ: <strong>{q.pyqYear}</strong></span>
                      </span>
                      {q.repeatTag && (
                        <Badge variant="outline" className="text-[10px] font-extrabold bg-rose-100 text-rose-800 border-rose-300">
                          <Flame className="h-3 w-3 mr-1 fill-rose-500 text-rose-500" />
                          {q.repeatTag} {q.frequencyCount > 1 ? `(${q.frequencyCount}x)` : ''}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Question Text */}
                  <div>
                    {q?.passage && (
                      <div className="rounded-lg bg-teal-50 border border-teal-200 p-3 mb-3 text-xs text-teal-900 leading-relaxed">
                        <p className="font-bold uppercase tracking-wider mb-1">Passage</p>
                        {q.passage}
                      </div>
                    )}
                    <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                      {q?.text || `Problem from ${res.topic} in ${res.subject}.`}
                    </p>
                  </div>

                  {/* Options Comparison for MCQ */}
                  {options.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Answer Choices & Verification</p>
                      <div className="grid grid-cols-1 gap-2">
                        {options.map((opt, optIdx) => {
                          const isSelected = userOptIdx === optIdx;
                          const isRight = correctOptIdx === optIdx;

                          return (
                            <div
                              key={optIdx}
                              className={cn(
                                'flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm transition-all',
                                isRight && 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-semibold ring-1 ring-emerald-500/30',
                                isSelected && !isRight && 'border-rose-400 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100 font-medium',
                                !isSelected && !isRight && 'border-slate-200 dark:border-slate-800 bg-slate-50/50 text-slate-700 dark:text-slate-300'
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={cn(
                                  'h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0',
                                  isRight ? 'bg-emerald-600 text-white' : isSelected ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                                )}>
                                  {LETTERS[optIdx]}
                                </span>
                                <span className="truncate">{opt}</span>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isRight && (
                                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                                    ✓ Official Key
                                  </Badge>
                                )}
                                {isSelected && !isRight && (
                                  <Badge className="bg-rose-600 text-white text-[10px] font-bold">
                                    ✗ Your Answer
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Numerical Answer Comparison */}
                  {q?.type === 'numerical' && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs sm:text-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Your Submitted Value:</span>
                        <span className={cn('font-bold', isCorrect ? 'text-emerald-700' : 'text-rose-700')}>
                          {userAns && userAns.type === 'numerical' ? userAns.value : 'None (Skipped)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                        <span className="text-slate-900 font-semibold">Official Correct Answer Key:</span>
                        <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          {q.correctNumeric} {q.unit || ''} (tolerance ±{q.tolerance ?? 0.01})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Step-by-Step Explanation Card */}
                  <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/40 via-indigo-50/20 to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                        <Lightbulb className="h-4 w-4 text-blue-600" />
                        Complete Step-by-Step Solution & Concept
                      </h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleExpand(res.questionId)}
                        className="text-xs text-blue-700 hover:text-blue-800"
                      >
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed border-t border-blue-100 dark:border-blue-900/40 pt-3">
                        {q?.explanation ? (
                          <div className="whitespace-pre-wrap">{q.explanation}</div>
                        ) : (
                          <>
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900 dark:text-white">1. Governing Principle & Formula:</p>
                              <p className="text-slate-600 dark:text-slate-400">
                                This problem tests the core concept of <strong>{res.topic}</strong> in <strong>{res.subject}</strong>. Apply fundamental equations and identify all given constraints.
                              </p>
                            </div>

                            <div className="space-y-1">
                              <p className="font-bold text-slate-900 dark:text-white">2. Step-by-Step Derivation:</p>
                              <p className="text-slate-600 dark:text-slate-400">
                                • Set up the equilibrium / standard state equations.<br />
                                • Substitute the given numerical parameters with SI unit consistency.<br />
                                • Simplify algebraic terms to arrive at the unique solution: <strong className="text-emerald-700 dark:text-emerald-400">Option {LETTERS[correctOptIdx]} ({options[correctOptIdx] || q?.correctNumeric})</strong>.
                              </p>
                            </div>

                            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-900 dark:text-amber-200 text-xs">
                              <strong>💡 Pro Exam Tip:</strong> Always double check dimensional consistency and watch out for sign conventions in {res.topic}.
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Ask AI Mentor Button */}
                    <div className="pt-2 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAskMentor(q, res, idx)}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:hover:bg-slate-800 font-semibold text-xs"
                      >
                        <Brain className="h-3.5 w-3.5 mr-1 text-blue-600" />
                        Ask AI Mentor about this Question
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

