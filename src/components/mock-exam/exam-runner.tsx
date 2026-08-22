'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useStore } from '@/lib/store';
import type { AnswerValue, ExamAttempt, ProctoringEvent, IntegrityReport } from '@/lib/types';
import { QuestionCard } from './question-card';
import { ExamResults } from './exam-results';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ProctoringConsentDialog } from '@/components/proctoring/consent-dialog';
import { ProctoringIndicator } from '@/components/proctoring/status-indicator';
import { ProctoringSDK } from '@/lib/proctoring/sdk';
import { getProfile } from '@/lib/proctoring/profiles';
import {
  Clock, Flag, ChevronLeft, ChevronRight, X, CheckCircle2, Circle, AlertCircle,
  Loader2, Send, BookOpen, Layers, Lightbulb, ShieldCheck,
} from 'lucide-react';

interface Props {
  onExit: () => void;
}

const UNANSWERED: AnswerValue = { type: 'unanswered' };

function fmtTime(sec: number): string {
  if (sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function ExamRunner({ onExit }: Props) {
  const currentExam = useStore((s) => s.currentExam);
  const endExam = useStore((s) => s.endExam);
  const addAttempt = useStore((s) => s.addAttempt);
  const user = useStore((s) => s.user);
  const attempts = useStore((s) => s.attempts);
  const { toast } = useToast();

  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, AnswerValue>>({});
  const [marked, setMarked] = React.useState<Set<number>>(new Set());
  const [visited, setVisited] = React.useState<Set<number>>(new Set([0]));
  const [timeLeft, setTimeLeft] = React.useState(currentExam?.durationSec ?? 0);
  const [evaluating, setEvaluating] = React.useState(false);
  const [result, setResult] = React.useState<ExamAttempt | null>(null);

  // Proctoring state
  const [showConsent, setShowConsent] = React.useState(false);
  const [proctoringActive, setProctoringActive] = React.useState(false);
  const [proctoringDegraded, setProctoringDegraded] = React.useState(false);
  const [proctoringEvents, setProctoringEvents] = React.useState<ProctoringEvent[]>([]);
  const [integrityReport, setIntegrityReport] = React.useState<IntegrityReport | null>(null);
  const proctoringSDKRef = React.useRef<ProctoringSDK | null>(null);
  const proctoringSessionIdRef = React.useRef<string>('');
  const examStartTimeRef = React.useRef<number>(0);

  // Refs for accurate time tracking — avoids stale closure/state issues on submit
  const questionStartRef = React.useRef<number>(Date.now());
  const timeTakenRef = React.useRef<Record<string, number>>({});
  const answersRef = React.useRef<Record<string, AnswerValue>>({});
  const examStartRef = React.useRef<number>(Date.now());
  const submittedRef = React.useRef<boolean>(false);

  // Sync timer when currentExam changes
  React.useEffect(() => {
    if (currentExam) {
      setTimeLeft(currentExam.durationSec);
      setCurrentIdx(0);
      setAnswers({});
      setMarked(new Set());
      setVisited(new Set([0]));
      setResult(null);
      // NOTE: examStartRef and questionStartRef are intentionally NOT reset here.
      // They are set when the user actually starts the exam (clicks "Enable AI
      // Proctoring" or "Skip Proctoring"), not when the page first loads —
      // otherwise the consent-screen time gets incorrectly counted as exam time.
      timeTakenRef.current = {};
      answersRef.current = {};
      submittedRef.current = false;
    }
  }, [currentExam?.id]);

  // Start the exam timer the moment the user actually begins the exam
  // (after consent dialog or skip). This is the only place examStartRef and
  // questionStartRef are set — they drive the duration reported on submit.
  React.useEffect(() => {
    if (proctoringActive && !result) {
      const now = Date.now();
      examStartRef.current = now;
      questionStartRef.current = now;
    }
  }, [proctoringActive, result]);

  // Countdown
  React.useEffect(() => {
    if (!currentExam || result) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [currentExam?.id, result]);

  if (!currentExam) {
    return (
      <Card className="border-stone-200">
        <CardContent className="pt-10 pb-10 flex flex-col items-center text-center gap-3">
          <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">No active exam</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You have no exam in progress. Pick a mock to begin.
            </p>
          </div>
          <Button onClick={onExit}>Back to Mock Engine</Button>
        </CardContent>
      </Card>
    );
  }

  if (result) {
    return <ExamResults attempt={result} onRetake={onExit} onExit={onExit} integrityReport={integrityReport} />;
  }

  // Proctoring consent gate — show before exam starts if not yet active
  if (!proctoringActive && !showConsent && !result) {
    return (
      <Card className="border-stone-200">
        <CardContent className="pt-10 pb-10 flex flex-col items-center text-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Ready to start your {currentExam.examName} mock?</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Enable AI Proctoring to simulate real exam conditions. The system monitors your
              environment using your camera and browser activity — all processing happens on your device.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onExit}>Cancel</Button>
            <Button variant="ghost" onClick={() => { setProctoringActive(true); examStartTimeRef.current = Date.now(); }}>Skip Proctoring</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowConsent(true)}>
              <ShieldCheck className="h-4 w-4 mr-2" /> Enable AI Proctoring
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const questions = currentExam.questions;
  const total = questions.length;
  const q = questions[currentIdx];
  const section = currentExam.sections.find((s) => s.questionIds.includes(q.id));

  // Start exam without proctoring
  function startExamWithoutProctoring() {
    setProctoringActive(true);
    examStartTimeRef.current = Date.now();
  }

  // Start exam with proctoring after consent
  async function startExamWithProctoring(cameraEnabled: boolean, micEnabled: boolean) {
    if (!currentExam) return;
    setShowConsent(false);

    // Create proctoring session via API
    const sessionId = `ps_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    proctoringSessionIdRef.current = sessionId;

    try {
      await fetch('/api/proctoring/session?XTransformPort=3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_session',
          userId: user?.id || 'unknown',
          examType: currentExam.examId,
          mockAttemptId: currentExam.id,
          cameraEnabled,
          micEnabled,
        }),
      });
    } catch { /* non-blocking */ }

    // Initialize SDK
    const profile = getProfile(currentExam.examId);
    const sdk = new ProctoringSDK({
      sessionId,
      profile,
      onEvent: (event) => {
        setProctoringEvents(prev => [...prev, event]);
        // Show real-time coaching toast for high/critical
        if (event.severity === 'high' || event.severity === 'critical') {
          toast({
            title: event.severity === 'critical' ? '⚠️ Critical flag' : 'Proctoring alert',
            description: event.eventType.replace(/_/g, ' '),
            variant: 'destructive',
          });
        }
      },
    });
    
    const granted = await sdk.start(cameraEnabled, micEnabled);
    proctoringSDKRef.current = sdk;
    setProctoringDegraded(!granted);
    setProctoringActive(true);
    examStartTimeRef.current = Date.now();
  }

  function recordCurrentTime() {
    const now = Date.now();
    const elapsed = Math.max(0, Math.round((now - questionStartRef.current) / 1000));
    const currentQuestion = questions[currentIdx];
    if (!currentQuestion) return;
    timeTakenRef.current[currentQuestion.id] = (timeTakenRef.current[currentQuestion.id] || 0) + elapsed;
    questionStartRef.current = now;
  }

  function goTo(idx: number) {
    if (idx < 0 || idx >= total) return;
    recordCurrentTime();
    setCurrentIdx(idx);
    setVisited((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  }

  function setAnswer(v: AnswerValue) {
    const currentQuestion = questions[currentIdx];
    if (!currentQuestion) return;
    const newAnswers = { ...answersRef.current, [currentQuestion.id]: v };
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
  }

  function clearAnswer() {
    const currentQuestion = questions[currentIdx];
    if (!currentQuestion) return;
    const newAnswers = { ...answersRef.current };
    delete newAnswers[currentQuestion.id];
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
  }

  function toggleMark() {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(currentIdx)) next.delete(currentIdx);
      else next.add(currentIdx);
      return next;
    });
  }

  async function handleSubmit(auto: boolean = false) {
    if (evaluating || !currentExam) return;
    recordCurrentTime();
    setEvaluating(true);

    try {
      const priorAttempts = attempts.filter((a) => a.examId === currentExam.examId);
      const previousAttempt = priorAttempts.length > 0
        ? [...priorAttempts].sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt))[0]
        : null;
      const attemptNumber = priorAttempts.length + 1;

      // Use refs for accurate data (avoids stale state on async submit)
      const finalAnswers = { ...answersRef.current };
      const finalTimeTaken = { ...timeTakenRef.current };
      const totalDurationSec = Math.round((Date.now() - examStartRef.current) / 1000);

      const resp = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam: currentExam,
          answers: finalAnswers,
          timeTaken: finalTimeTaken,
          attemptNumber,
          previousAttempt,
          totalDurationSec,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Evaluation failed');
      }

      const data = await resp.json();
      const attempt: ExamAttempt = data.attempt;

      // Patch vsPrevious with accurate percentage-based deltas
      if (previousAttempt && attempt.behavior) {
        const prevPct = (previousAttempt.score / Math.max(1, previousAttempt.totalMarks)) * 100;
        const currPct = (attempt.score / Math.max(1, attempt.totalMarks)) * 100;
        const scoreDelta = currPct - prevPct;
        attempt.behavior.vsPrevious = {
          scoreDelta: Math.round(scoreDelta * 10) / 10,
          speedDelta: Math.round((attempt.speed - previousAttempt.speed) * 10) / 10,
          accuracyDelta: Math.round((attempt.accuracy - previousAttempt.accuracy) * 10) / 10,
          isImprovement: scoreDelta >= 0,
        };
      }

      addAttempt(attempt);
      setResult(attempt);
      
      // Close proctoring session and generate integrity report
      if (proctoringSDKRef.current) {
        proctoringSDKRef.current.stop();
        const allEvents = [...proctoringEvents, ...proctoringSDKRef.current.getBufferedEvents()];
        
        try {
          const reportResp = await fetch('/api/proctoring/session?XTransformPort=3000', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'close_session',
              sessionId: proctoringSessionIdRef.current,
              events: allEvents,
              examType: currentExam.examId,
              userId: user?.id || 'unknown',
              startedAt: new Date(examStartRef.current).toISOString(),
              proctoringDegraded,
              cameraEnabled: !proctoringDegraded,
              micEnabled: false,
            }),
          });
          const reportData = await reportResp.json();
          if (reportData.report) {
            setIntegrityReport(reportData.report);
          }
        } catch { /* non-blocking */ }
      }
      
      toast({
        title: auto ? 'Time up — auto-submitted' : 'Exam submitted',
        description: `Score: ${attempt.score}/${attempt.totalMarks} · ${Math.round((attempt.score / Math.max(1, attempt.totalMarks)) * 100)}% · ${fmtTime(totalDurationSec)} total`,
      });
    } catch (e) {
      toast({
        title: 'Evaluation failed',
        description: (e as Error).message,
        variant: 'destructive',
      });
    } finally {
      setEvaluating(false);
    }
  }

  // Palette state per question
  function paletteState(idx: number): 'answered' | 'marked' | 'visited' | 'not-visited' {
    const qd = questions[idx];
    const ans = answers[qd.id];
    const answered = ans && ans.type !== 'unanswered';
    if (answered && marked.has(idx)) return 'answered';
    if (answered) return 'answered';
    if (marked.has(idx)) return 'marked';
    if (visited.has(idx)) return 'visited';
    return 'not-visited';
  }

  const answeredCount = questions.filter((qd) => {
    const a = answers[qd.id];
    return a && a.type !== 'unanswered';
  }).length;
  const overallPct = Math.round((answeredCount / total) * 100);

  const timerColor = timeLeft > 1800
    ? 'text-blue-700 bg-blue-50 border-blue-200'
    : timeLeft > 600
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-rose-700 bg-rose-50 border-rose-200 timer-critical';

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <Card className="border-stone-200">
        <CardContent className="py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={onExit} title="Exit exam">
              <X className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <p className="font-semibold truncate">{currentExam.examName}</p>
              {section && (
                <p className="text-xs text-muted-foreground">{section.name} · Q {currentIdx + 1} of {total}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ProctoringIndicator active={proctoringActive} degraded={proctoringDegraded} />
            <Badge variant="outline" className={cn('border font-mono', timerColor)}>
              <Clock className="h-3 w-3" /> {fmtTime(timeLeft)}
            </Badge>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={evaluating}>
                  {evaluating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit exam?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have answered <strong>{answeredCount}</strong> of <strong>{total}</strong> questions.
                    {answeredCount < total && ` ${total - answeredCount} will be marked unanswered.`}
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep working</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleSubmit(false)}>Submit now</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* Question area */}
        <div className="space-y-3 min-w-0">
          <QuestionCard
            question={q}
            index={currentIdx}
            total={total}
            value={answers[q.id] || UNANSWERED}
            onChange={setAnswer}
          />

          {/* Action bar */}
          <Card className="border-stone-200">
            <CardContent className="py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant={marked.has(currentIdx) ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleMark}
                >
                  <Flag className="h-3.5 w-3.5" />
                  {marked.has(currentIdx) ? 'Unmark' : 'Mark for review'}
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAnswer}>
                  <X className="h-3.5 w-3.5" /> Clear
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goTo(currentIdx - 1)}
                  disabled={currentIdx === 0}
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                {currentIdx === total - 1 ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" disabled={evaluating}>
                        {evaluating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        Save &amp; Submit
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Submit exam?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This is the last question. Submit now to evaluate your paper.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep working</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleSubmit(false)}>Submit</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button size="sm" onClick={() => goTo(currentIdx + 1)}>
                    Save &amp; Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Palette sidebar */}
        <div className="space-y-4">
          <Card className="border-stone-200">
            <CardHeader className="pb-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" /> Question Palette
              </p>
              <Progress value={overallPct} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {answeredCount} answered · {total - answeredCount} left
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-5 gap-1.5">
                {questions.map((qd, idx) => {
                  const state = paletteState(idx);
                  const isCurrent = idx === currentIdx;
                  const cls =
                    state === 'answered'
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : state === 'marked'
                        ? 'bg-amber-400 hover:bg-amber-500 text-white'
                        : state === 'visited'
                          ? 'bg-stone-300 hover:bg-stone-400 text-stone-800'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200';
                  return (
                    <button
                      key={qd.id}
                      onClick={() => goTo(idx)}
                      className={cn(
                        'palette-btn h-8 rounded-md text-xs font-semibold flex items-center justify-center',
                        cls,
                        isCurrent && 'ring-2 ring-offset-1 ring-blue-600',
                      )}
                      title={`Q${idx + 1} · ${state}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-3 grid grid-cols-2 gap-1.5 text-[10px] text-muted-foreground">
                <LegendDot color="bg-blue-500" label="Answered" />
                <LegendDot color="bg-amber-400" label="Marked" />
                <LegendDot color="bg-stone-300" label="Visited" />
                <LegendDot color="bg-stone-100 border border-stone-200" label="Not visited" />
              </div>
            </CardContent>
          </Card>

          {/* Section progress */}
          <Card className="border-stone-200">
            <CardHeader className="pb-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600" /> Sections
              </p>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {currentExam.sections.map((s) => {
                const qIds = s.questionIds;
                const answeredInSec = qIds.filter((qid) => {
                  const a = answers[qid];
                  return a && a.type !== 'unanswered';
                }).length;
                const pct = qIds.length > 0 ? Math.round((answeredInSec / qIds.length) * 100) : 0;
                return (
                  <div key={s.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground">{answeredInSec}/{qIds.length}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Tip */}
          <div className="rounded-md bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-blue-700 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900">
              Mark tough questions for review and move on — you can revisit any question from the palette before submitting.
            </p>
          </div>
        </div>
      </div>

      {/* Proctoring consent dialog */}
      <ProctoringConsentDialog
        open={showConsent}
        onOpenChange={setShowConsent}
        onAccept={startExamWithProctoring}
        examName={currentExam.examName}
      />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('h-3 w-3 rounded', color)} />
      <span>{label}</span>
    </div>
  );
}
