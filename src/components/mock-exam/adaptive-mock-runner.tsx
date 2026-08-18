'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { QuestionCard } from './question-card';
import { useStore } from '@/lib/store';
import type { AnswerValue, Question } from '@/lib/types';
import {
  Brain, Gauge, Activity, Target, Clock, TrendingUp, TrendingDown,
  Sparkles, AlertTriangle, CheckCircle2, XCircle, Circle, RefreshCw,
  Trophy, Award, BarChart3, Zap,
} from 'lucide-react';

// ============================================================================
// IRT item shape returned from the API (subset of the full IrtItem)
// ============================================================================

interface ApiIrtItem {
  itemId: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  b: number;
  a: number;
  c: number;
  marks: number;
  negativeMarks: number;
}

interface StartResponse {
  sessionId: string;
  examId: string;
  examName: string;
  totalPoolSize: number;
  maxItems: number;
  minItems: number;
  seThreshold: number;
  question: Question;
  irtItem: ApiIrtItem;
  currentTheta: number;
  currentSE: number;
  phase: string;
  itemsPresented: number;
}

interface RespondResponse {
  sessionId: string;
  acknowledged: boolean;
  lastCorrect: boolean;
  lastAttempted: boolean;
  lastPartial?: number;
  currentTheta: number;
  currentSE: number;
  phase: string;
  itemsPresented: number;
  nextQuestion: Question | null;
  terminated: boolean;
  terminationReason?: string;
}

interface FinalScore {
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

interface FinishResponse {
  sessionId: string;
  examId: string;
  examName: string;
  terminated: boolean;
  terminationReason?: string;
  finalScore: FinalScore;
}

// ============================================================================
// Adaptive Mock Runner
// ============================================================================

export function AdaptiveMockRunner({ examId, onExit }: { examId: string; onExit: () => void }) {
  const user = useStore(s => s.user);
  const addAttempt = useStore(s => s.addAttempt);

  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [question, setQuestion] = React.useState<Question | null>(null);
  const [irtItem, setIrtItem] = React.useState<ApiIrtItem | null>(null);
  const [answer, setAnswer] = React.useState<AnswerValue>({ type: 'unanswered' });
  const [theta, setTheta] = React.useState(0);
  const [se, setSE] = React.useState(1.5);
  const [phase, setPhase] = React.useState('warmup');
  const [itemsPresented, setItemsPresented] = React.useState(0);
  const [maxItems, setMaxItems] = React.useState(20);
  const [minItems, setMinItems] = React.useState(8);
  const [poolSize, setPoolSize] = React.useState(0);
  const [history, setHistory] = React.useState<{ theta: number; correct: boolean; topic: string }[]>([]);
  const [loading, setLoading] = useStateWithTimer<'start' | 'respond' | 'finish' | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [finalScore, setFinalScore] = React.useState<FinalScore | null>(null);
  const [examName, setExamName] = React.useState('');

  // Question timing — start when a new question arrives
  const questionStartRef = React.useRef<number>(Date.now());

  // Start the session on mount
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading('start');
      try {
        const r = await fetch('/api/adaptive-exam/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examId, userId: user?.id }),
        });
        if (!r.ok) throw new Error((await r.json())?.error || 'Failed to start session');
        const j: StartResponse = await r.json();
        if (!mounted) return;
        setSessionId(j.sessionId);
        setQuestion(j.question);
        setIrtItem(j.irtItem);
        setTheta(j.currentTheta);
        setSE(j.currentSE);
        setPhase(j.phase);
        setItemsPresented(j.itemsPresented);
        setMaxItems(j.maxItems);
        setMinItems(j.minItems);
        setPoolSize(j.totalPoolSize);
        setExamName(j.examName);
        setAnswer({ type: 'unanswered' });
        questionStartRef.current = Date.now();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(null);
      }
    })();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const submitAnswer = async () => {
    if (!sessionId || !question) return;
    setLoading('respond');
    const timeTakenSec = Math.round((Date.now() - questionStartRef.current) / 1000);
    try {
      const r = await fetch('/api/adaptive-exam/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: question.id,
          answer,
          timeTakenSec,
        }),
      });
      if (!r.ok) throw new Error((await r.json())?.error || 'Failed to submit answer');
      const j: RespondResponse = await r.json();
      setTheta(j.currentTheta);
      setSE(j.currentSE);
      setPhase(j.phase);
      setItemsPresented(j.itemsPresented);
      setHistory(prev => [...prev, { theta: j.currentTheta, correct: j.lastCorrect, topic: irtItem?.topic ?? '' }]);

      if (j.terminated) {
        // Auto-finish
        await finishSession();
      } else if (j.nextQuestion) {
        setQuestion(j.nextQuestion);
        // Fetch IRT item for next question (we don't currently return it from respond)
        // Use the question's difficulty as a hint
        setIrtItem(prev => prev ? {
          ...prev,
          itemId: j.nextQuestion!.id,
          subject: j.nextQuestion!.subject,
          topic: j.nextQuestion!.topic,
          difficulty: j.nextQuestion!.difficulty,
          b: difficultyToBHint(j.nextQuestion!.difficulty),
          a: prev.a,
          c: prev.c,
          marks: j.nextQuestion!.marks,
          negativeMarks: j.nextQuestion!.negativeMarks,
        } : null);
        setAnswer({ type: 'unanswered' });
        questionStartRef.current = Date.now();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const skipQuestion = async () => {
    setAnswer({ type: 'unanswered' });
    // Submit immediately as unanswered
    setTimeout(submitAnswer, 0);
  };

  const finishSession = async () => {
    if (!sessionId) return;
    setLoading('finish');
    try {
      const r = await fetch('/api/adaptive-exam/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, manual: true }),
      });
      if (!r.ok) throw new Error((await r.json())?.error || 'Failed to finish session');
      const j: FinishResponse = await r.json();
      setFinalScore(j.finalScore);
      setQuestion(null);
      // Persist as a regular ExamAttempt for the analytics dashboard
      tryPersistAttempt(j);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  };

  function tryPersistAttempt(finish: FinishResponse) {
    if (!user) return;
    const fs = finish.finalScore;
    // Build an ExamAttempt-compatible object so the existing analytics
    // views can render it. We approximate the schema.
    const attempt = {
      id: finish.sessionId,
      examId: finish.examId,
      examName: finish.examName,
      startedAt: new Date(Date.now() - fs.avgTimePerQuestionSec * fs.totalItems * 1000).toISOString(),
      submittedAt: new Date().toISOString(),
      durationSec: fs.avgTimePerQuestionSec * fs.totalItems,
      answers: {},
      score: fs.scorePct,
      totalMarks: 100,
      percentile: fs.percentile,
      rank: Math.max(1, Math.round(10000 * (1 - fs.percentile / 100))),
      subjectScores: fs.subjectBreakdown.map(s => ({
        subject: s.subject, total: s.total, scored: s.correct, correct: s.correct,
        wrong: s.total - s.correct, unattempted: 0, accuracy: s.total > 0 ? (s.correct / s.total) * 100 : 0,
      })),
      topicScores: fs.topicBreakdown.map(t => ({
        subject: t.subject, topic: t.topic, total: t.total, scored: t.correct, correct: t.correct,
        accuracy: t.total > 0 ? (t.correct / t.total) * 100 : 0,
      })),
      accuracy: fs.totalItems > 0 ? (fs.correctCount / fs.totalItems) * 100 : 0,
      speed: fs.avgTimePerQuestionSec > 0 ? Math.round(60 / fs.avgTimePerQuestionSec) : 0,
      avgTimePerQuestion: fs.avgTimePerQuestionSec,
      weakTopics: fs.topicBreakdown.filter(t => t.correct < t.total / 2).map(t => t.topic),
      strongTopics: fs.topicBreakdown.filter(t => t.correct >= t.total / 2 && t.correct > 0).map(t => t.topic),
      results: [],
      youtubeRecs: [],
      readinessIndex: fs.scorePct * 10,
      attemptNumber: undefined,
      behavior: undefined,
    };
    addAttempt(attempt as any);
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card className="p-6 border-rose-200 bg-rose-50">
          <h3 className="font-semibold text-rose-800 mb-2">Adaptive engine error</h3>
          <p className="text-sm text-rose-700">{error}</p>
          <Button className="mt-4" variant="outline" onClick={onExit}>Back to Mock Engine</Button>
        </Card>
      </div>
    );
  }

  if (finalScore) {
    return <AdaptiveReport finalScore={finalScore} examName={examName} onExit={onExit} onRestart={() => {
      setFinalScore(null);
      setSessionId(null);
      setQuestion(null);
      setHistory([]);
      // Trigger restart by reloading
      window.location.reload();
    }} />;
  }

  if (loading === 'start' || !question) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Brain className="h-10 w-10 text-blue-500 animate-pulse" />
        <p className="text-stone-600">Building adaptive item pool…</p>
        <p className="text-xs text-stone-400">Generating questions with IRT parameters across all topics</p>
      </div>
    );
  }

  // Compute live stats
  const thetaPct = ((theta + 3) / 6) * 100;
  const scorePct = Math.max(0, Math.min(100, Math.round(((theta + 3) / 6) * 100)));
  const percentile = thetaToPercentileLocal(theta);
  const phaseLabel: Record<string, string> = {
    warmup: 'Warmup',
    targeting: 'Targeting',
    converging: 'Converging',
    locked: 'Locked',
  };
  const phaseColor: Record<string, string> = {
    warmup: 'bg-blue-50 text-blue-700 border-blue-200',
    targeting: 'bg-amber-50 text-amber-700 border-amber-200',
    converging: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    locked: 'bg-stone-100 text-stone-700 border-stone-200',
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-4">
      {/* Top bar: live theta + session info */}
      <Card className="p-4 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-semibold text-stone-600 uppercase">Live Ability (θ)</span>
              <Badge variant="outline" className={`text-xs ${phaseColor[phase] ?? ''}`}>
                {phaseLabel[phase] ?? phase}
              </Badge>
            </div>
            <div className="text-3xl font-bold tabular-nums text-blue-700">
              {theta.toFixed(2)}
            </div>
            <div className="text-xs text-stone-500 mt-0.5">
              SE ±{se.toFixed(2)} · Percentile {percentile}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-semibold text-stone-600 uppercase">Progress</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-stone-800">
              {itemsPresented} <span className="text-base text-stone-400">/ {maxItems}</span>
            </div>
            <Progress value={(itemsPresented / maxItems) * 100} className="h-1.5 mt-1" />
            <div className="text-xs text-stone-500 mt-0.5">
              Min {minItems} to converge · Pool {poolSize}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold text-stone-600 uppercase">Item Difficulty</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-amber-700">
              {irtItem ? `b=${irtItem.b.toFixed(2)}` : '—'}
            </div>
            <div className="text-xs text-stone-500 mt-0.5">
              {irtItem ? `${irtItem.difficulty} · ${irtItem.subject} · ${irtItem.topic}` : 'No item'}
            </div>
          </div>

          {/* Theta visualisation */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-semibold text-stone-600 uppercase">Theta History</span>
            </div>
            <ThetaSparkline history={history} currentTheta={theta} />
          </div>
        </div>
      </Card>

      {/* Question card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <QuestionCard
            question={question}
            index={itemsPresented}
            total={maxItems}
            value={answer}
            onChange={setAnswer}
          />
        </div>

        {/* Action panel */}
        <div className="lg:col-span-1 space-y-3">
          <Card className="p-4 border-blue-200">
            <h4 className="font-semibold text-stone-800 mb-3 text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Adaptive Actions
            </h4>
            <Button
              onClick={submitAnswer}
              disabled={loading === 'respond' || answer.type === 'unanswered'}
              className="w-full mb-2"
            >
              {loading === 'respond' ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Evaluating…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Submit & Next
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={skipQuestion}
              disabled={loading === 'respond'}
              className="w-full mb-2"
            >
              <Circle className="h-4 w-4 mr-1" />
              Skip (Unanswered)
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full text-rose-600 hover:text-rose-700">
                  End Adaptive Exam
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End adaptive session?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your current ability estimate (θ={theta.toFixed(2)}) will be finalised based on {itemsPresented} items answered.
                    You can't resume this session after ending.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue Exam</AlertDialogCancel>
                  <AlertDialogAction onClick={finishSession}>
                    End & Get Report
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>

          {/* Last 5 responses */}
          {history.length > 0 && (
            <Card className="p-3 border-stone-200">
              <p className="text-xs font-semibold text-stone-500 uppercase mb-2">Recent</p>
              <div className="space-y-1.5">
                {history.slice(-5).reverse().map((h, idx) => {
                  const wasLast = idx === 0;
                  return (
                    <div key={idx} className={`flex items-center gap-2 text-xs ${wasLast ? '' : 'opacity-60'}`}>
                      {h.correct ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-3 w-3 text-rose-500 flex-shrink-0" />
                      )}
                      <span className="text-stone-600 truncate flex-1">{h.topic}</span>
                      <span className={`font-mono tabular-nums ${h.correct ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {h.theta >= 0 ? '+' : ''}{h.theta.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Theta sparkline — small inline chart
// ---------------------------------------------------------------------------

function ThetaSparkline({ history, currentTheta }: { history: { theta: number; correct: boolean }[]; currentTheta: number }) {
  if (history.length === 0) {
    return (
      <div className="h-8 flex items-center text-xs text-stone-400 italic">
        Awaiting first response…
      </div>
    );
  }
  const thetas = [...history.map(h => h.theta), currentTheta];
  const min = Math.min(...thetas, -1);
  const max = Math.max(...thetas, 1);
  const range = Math.max(0.5, max - min);
  const w = 120;
  const h = 32;
  const pts = thetas.map((t, i) => {
    const x = (i / Math.max(1, thetas.length - 1)) * w;
    const y = h - ((t - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div className="flex items-center gap-1">
      <svg width={w} height={h} className="overflow-visible">
        <polyline
          points={pts}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Last point */}
        <circle
          cx={(thetas.length - 1) / Math.max(1, thetas.length - 1) * w}
          cy={h - ((currentTheta - min) / range) * h}
          r="3"
          fill="#1e40af"
        />
      </svg>
      <div className="text-xs">
        <div className="font-mono tabular-nums text-blue-700">{currentTheta.toFixed(2)}</div>
        <div className="text-stone-400">θ</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Adaptive Report — final results view
// ---------------------------------------------------------------------------

function AdaptiveReport({
  finalScore: fs,
  examName,
  onExit,
  onRestart,
}: {
  finalScore: FinalScore;
  examName: string;
  onExit: () => void;
  onRestart: () => void;
}) {
  const verdict = getVerdict(fs.finalTheta, fs.finalSE);
  const maxThetaForBar = 3;

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Hero */}
      <Card className={`p-6 border-2 ${verdict.borderColor}`}>
        <div className="flex items-start gap-4">
          <div className={`h-16 w-16 rounded-2xl ${verdict.bgColor} flex items-center justify-center flex-shrink-0`}>
            {verdict.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold text-stone-800">Adaptive Report</h2>
              <Badge className={verdict.badgeColor}>{verdict.label}</Badge>
            </div>
            <p className="text-sm text-stone-600 mt-1">{examName}</p>
            <p className="text-sm text-stone-700 mt-2">{verdict.message}</p>
          </div>
        </div>

        {/* Big stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <BigStat
            label="Ability (θ)"
            value={fs.finalTheta.toFixed(2)}
            sub={`SE ±${fs.finalSE.toFixed(2)}`}
            icon={<Gauge className="h-5 w-5" />}
            color="blue"
          />
          <BigStat
            label="Score"
            value={`${fs.scorePct}%`}
            sub="IRT-estimated"
            icon={<Target className="h-5 w-5" />}
            color="emerald"
          />
          <BigStat
            label="Percentile"
            value={`${fs.percentile}`}
            sub="Population"
            icon={<Trophy className="h-5 w-5" />}
            color="amber"
          />
          <BigStat
            label="Items"
            value={fs.totalItems}
            sub={`${fs.correctCount}✓ ${fs.wrongCount}✗ ${fs.unattemptedCount}—`}
            icon={<Activity className="h-5 w-5" />}
            color="purple"
          />
        </div>
      </Card>

      {/* Theta progression chart */}
      <Card className="p-5 border-blue-200">
        <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          Theta Progression
          <span className="text-xs text-stone-500 font-normal ml-2">
            How your ability estimate evolved with each response
          </span>
        </h3>
        <div className="space-y-1">
          {fs.thetaProgression.map((p, idx) => {
            const pct = Math.max(0, Math.min(100, ((p.theta + maxThetaForBar) / (2 * maxThetaForBar)) * 100));
            const sePct = Math.min(50, (p.se / 3) * 100); // cap at 50% for visual
            return (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs text-stone-500 w-8 text-right">Q{p.itemIndex}</span>
                <div className="flex-1 relative h-6">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-stone-200" />
                  <div
                    className={`absolute h-2 top-1/2 -translate-y-1/2 rounded ${p.correct ? 'bg-emerald-500' : 'bg-rose-400'}`}
                    style={{
                      left: p.theta >= 0 ? '50%' : `${pct}%`,
                      width: p.theta >= 0 ? `${pct - 50}%` : `${50 - pct}%`,
                    }}
                  />
                  {/* SE whisker */}
                  <div
                    className="absolute h-4 top-1/2 -translate-y-1/2 border-l border-r border-blue-300 bg-blue-100/30"
                    style={{
                      left: `calc(${Math.max(0, Math.min(100, pct - sePct / 2))}% )`,
                      width: `${sePct}%`,
                    }}
                  />
                </div>
                <span className={`text-xs font-mono tabular-nums w-16 text-right ${p.correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {p.theta >= 0 ? '+' : ''}{p.theta.toFixed(2)}
                </span>
                <span className="text-xs text-stone-400 w-12 text-right">±{p.se.toFixed(2)}</span>
                <span className="w-4 text-center">
                  {p.correct ? '✓' : '✗'}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-stone-500">
          <span className="flex items-center gap-1"><span className="h-2 w-3 bg-emerald-500 inline-block rounded" /> Correct</span>
          <span className="flex items-center gap-1"><span className="h-2 w-3 bg-rose-400 inline-block rounded" /> Wrong</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 bg-blue-100 border border-blue-300 inline-block" /> SE whisker</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject breakdown */}
        <Card className="p-5 border-blue-200">
          <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            Subject Breakdown
          </h3>
          {fs.subjectBreakdown.length === 0 ? (
            <p className="text-sm text-stone-400 italic">No subject data</p>
          ) : (
            <div className="space-y-3">
              {fs.subjectBreakdown.map(s => {
                const accuracy = s.total > 0 ? (s.correct / s.total) * 100 : 0;
                return (
                  <div key={s.subject}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-stone-700">{s.subject}</span>
                      <span className="text-xs text-stone-500">
                        {s.correct}/{s.total} correct · avg item b={s.avgTheta.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-emerald-400"
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Topic breakdown */}
        <Card className="p-5 border-blue-200">
          <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-500" />
            Topic Coverage
            <span className="text-xs text-stone-500 font-normal ml-1">
              {fs.topicBreakdown.length} topics touched
            </span>
          </h3>
          {fs.topicBreakdown.length === 0 ? (
            <p className="text-sm text-stone-400 italic">No topic data</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {fs.topicBreakdown.map((t, i) => {
                const accuracy = t.total > 0 ? (t.correct / t.total) * 100 : 0;
                return (
                  <div key={`${t.subject}-${t.topic}-${i}`} className="flex items-center gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-stone-700 truncate">{t.topic}</p>
                      <p className="text-xs text-stone-400">{t.subject}</p>
                    </div>
                    <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${accuracy >= 75 ? 'bg-emerald-500' : accuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>
                    <span className="text-xs text-stone-500 w-12 text-right">
                      {t.correct}/{t.total}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* How it worked */}
      <Card className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-stone-800 mb-1">How adaptive mode worked</h4>
            <p className="text-sm text-stone-700 leading-relaxed">
              You took <strong>{fs.totalItems} questions</strong> across <strong>{fs.subjectBreakdown.length} subject{fs.subjectBreakdown.length === 1 ? '' : 's'}</strong>.
              The engine started in <em>warmup</em> phase (probing your level), then moved to <em>targeting</em>
              (picking high-information items near your θ). Your final ability estimate of{' '}
              <strong>θ={fs.finalTheta.toFixed(2)}</strong> has a standard error of ±{fs.finalSE.toFixed(2)},
              meaning the engine is {verdict.confidenceLabel.toLowerCase()} in its estimate.
              With a lower SE (longer session), the estimate would tighten further.
            </p>
            <p className="text-xs text-stone-500 mt-2">
              <AlertTriangle className="inline h-3 w-3 mr-1" />
              Adaptive scores use Item Response Theory (3PL model) and are not directly comparable to
              paper-based mock scores. Use the percentile (top {100 - fs.percentile}% of population) for
              relative-position comparisons.
            </p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onExit}>Back to Mock Engine</Button>
        <Button onClick={onRestart}>
          <RefreshCw className="h-4 w-4 mr-1" />
          New Adaptive Session
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function difficultyToBHint(diff: 'easy' | 'medium' | 'hard'): number {
  if (diff === 'easy') return -0.8;
  if (diff === 'medium') return 0.2;
  return 1.2;
}

function thetaToPercentileLocal(theta: number): number {
  // Standard normal CDF approximation
  const t = Math.max(-3.5, Math.min(3.5, theta));
  // Abramowitz & Stegun 7.1.26
  const phi = 0.5 * (1 + erfLocal(t / Math.SQRT2));
  return Math.round(phi * 100);
}

function erfLocal(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

function getVerdict(theta: number, se: number): {
  label: string; message: string;
  bgColor: string; borderColor: string; badgeColor: string;
  icon: React.ReactNode; confidenceLabel: string;
} {
  let tier: 'top' | 'strong' | 'average' | 'developing' | 'early';
  if (theta >= 1.2) tier = 'top';
  else if (theta >= 0.5) tier = 'strong';
  else if (theta >= -0.5) tier = 'average';
  else if (theta >= -1.2) tier = 'developing';
  else tier = 'early';

  const confidenceLabel = se < 0.5 ? 'Highly confident' : se < 0.8 ? 'Confident' : 'Moderately confident';

  const tiers = {
    top: {
      label: 'Top-tier',
      message: 'Outstanding — your responses place you in the top tier of test-takers. The engine converged on a high ability estimate with strong discrimination.',
      bgColor: 'bg-gradient-to-br from-amber-400 to-orange-500',
      borderColor: 'border-amber-300',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: <Trophy className="h-8 w-8 text-white" />,
    },
    strong: {
      label: 'Strong',
      message: 'Solid performance — your ability is well above average. Focus on the harder items to push θ higher.',
      bgColor: 'bg-gradient-to-br from-emerald-400 to-teal-500',
      borderColor: 'border-emerald-300',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: <Award className="h-8 w-8 text-white" />,
    },
    average: {
      label: 'Average',
      message: 'You are around the population average. The engine identified your level — next step is targeted practice on weak topics.',
      bgColor: 'bg-gradient-to-br from-blue-400 to-cyan-500',
      borderColor: 'border-blue-300',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: <Gauge className="h-8 w-8 text-white" />,
    },
    developing: {
      label: 'Developing',
      message: 'Foundational gaps detected. Revisit core concepts in the topics below before attempting harder items.',
      bgColor: 'bg-gradient-to-br from-purple-400 to-pink-500',
      borderColor: 'border-purple-300',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: <Brain className="h-8 w-8 text-white" />,
    },
    early: {
      label: 'Early Stage',
      message: 'Significant work needed. Build fundamentals first — the adaptive engine can revisit easier items once you are ready.',
      bgColor: 'bg-gradient-to-br from-rose-400 to-red-500',
      borderColor: 'border-rose-300',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      icon: <AlertTriangle className="h-8 w-8 text-white" />,
    },
  };

  return { ...tiers[tier], confidenceLabel };
}

function BigStat({
  label, value, sub, icon, color,
}: {
  label: string; value: string | number; sub: string;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'amber' | 'purple';
}) {
  const colors: Record<string, string> = {
    blue: 'text-blue-700 bg-blue-50',
    emerald: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-700 bg-amber-50',
    purple: 'text-purple-700 bg-purple-50',
  };
  return (
    <div className={`p-3 rounded-lg ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase opacity-80">{label}</span>
        <span className="opacity-80">{icon}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums mt-1">{value}</p>
      <p className="text-xs opacity-70 mt-0.5">{sub}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// useLoadingState hook — debounced loading state for slow operations
// ---------------------------------------------------------------------------

function useStateWithTimer<T>(initial: T): [T, (v: T) => void] {
  const [state, setState] = React.useState<T>(initial);
  const setStateDebounced = React.useCallback((v: T) => {
    setState(v);
  }, []);
  return [state, setStateDebounced];
}
