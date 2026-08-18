'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/shared';
import { useStore, userExamGoals } from '@/lib/store';
import { EXAM_PATTERNS } from '@/lib/exams/patterns';
import type { Question } from '@/lib/types';
import {
  Swords, Trophy, Users, Zap, Clock, Target, Crown, Award,
  Loader2, RefreshCw, Plus, CheckCircle2, XCircle, Activity,
  Flame, Star, TrendingUp, Shield, Sparkles, Brain, Heart,
} from 'lucide-react';

// ============================================================================
// Types matching API responses
// ============================================================================

interface StartBattleResponse {
  battleId: string;
  mode: string;
  examId: string;
  examName: string;
  status: string;
  playerA: { userId: string; displayName: string; rating: number };
  playerB: { userId: string; displayName: string; rating: number; isBot: boolean; avatarEmoji?: string };
  questionCount: number;
  timePerQuestionSec: number;
  totalDurationSec: number;
  startedAt: string;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  playerAScore: number;
  playerBScore: number;
}

interface RespondResponse {
  correct: boolean;
  pointsEarned: number;
  opponentCorrect: boolean;
  opponentPointsEarned: number;
  opponentTimeMs: number;
  scoreA: number;
  scoreB: number;
  currentQuestionIndex: number;
  nextQuestion: Question | null;
  battleEnded: boolean;
  winner?: 'A' | 'B' | 'draw';
  ratingChangeA?: number;
  xpAwardedA?: number;
}

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  rating: number;
  battlesWon: number;
  battlesLost: number;
  battlesDraw: number;
  totalBattles: number;
  winRate: number;
  totalXp: number;
  weeklyXp: number;
  monthlyXp: number;
  rank: number;
}

interface StudySquad {
  id: string;
  name: string;
  description: string;
  examGoal: string;
  createdByUserId: string;
  createdAt: string;
  memberIds: string[];
  totalXp: number;
  weeklyXp: number;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  color: string;
  weeklyWins: number;
  weeklyLosses: number;
}

interface SquadMember {
  userId: string;
  displayName: string;
  joinedAt: string;
  contributionXp: number;
  weeklyContributionXp: number;
}

// ============================================================================
// Main view
// ============================================================================

export function BattleArenaView() {
  const user = useStore(s => s.user);
  const [tab, setTab] = useState<'arena' | 'leaderboard' | 'squads'>('arena');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Peer Battle Arena"
        subtitle="1v1 timed duels, live leaderboards, and study squads — compete, climb, and learn together"
        accent="blue"
        icon={Swords}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="arena"><Swords className="h-4 w-4 mr-1 inline" />Battle Arena</TabsTrigger>
          <TabsTrigger value="leaderboard"><Trophy className="h-4 w-4 mr-1 inline" />Leaderboard</TabsTrigger>
          <TabsTrigger value="squads"><Users className="h-4 w-4 mr-1 inline" />Study Squads</TabsTrigger>
        </TabsList>

        <TabsContent value="arena" className="space-y-4">
          <BattleArenaTab userId={user?.id ?? 'guest'} displayName={user?.name ?? 'Aspirant'} examGoals={userExamGoals(user)} />
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <LeaderboardTab userId={user?.id ?? 'guest'} />
        </TabsContent>

        <TabsContent value="squads" className="space-y-4">
          <SquadsTab userId={user?.id ?? 'guest'} displayName={user?.name ?? 'Aspirant'} examGoal={user?.examGoal ?? 'jee-main'} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// Battle Arena tab
// ============================================================================

function BattleArenaTab({ userId, displayName, examGoals }: { userId: string; displayName: string; examGoals: string[] }) {
  const availableExams = EXAM_PATTERNS.filter(p => examGoals.includes(p.id) || examGoals.length === 0);
  const [examId, setExamId] = useState(examGoals[0] ?? 'jee-main');
  const [questionCount, setQuestionCount] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [battle, setBattle] = useState<StartBattleResponse | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | number[] | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [lastResult, setLastResult] = useState<RespondResponse | null>(null);
  const [finalResult, setFinalResult] = useState<RespondResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start battle
  const startBattle = async () => {
    setLoading(true);
    setError(null);
    setBattle(null);
    setFinalResult(null);
    setLastResult(null);
    try {
      const r = await fetch('/api/battle/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          userId,
          displayName,
          mode: 'solo-bot',
          questionCount,
          timePerQuestionSec: timePerQuestion,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to start battle');
      }
      const j: StartBattleResponse = await r.json();
      setBattle(j);
      setCurrentQuestion(j.currentQuestion);
      setSelectedAnswer(null);
      setQuestionStartTime(Date.now());
      setTimeLeft(j.timePerQuestionSec);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Submit answer
  const submitAnswer = async () => {
    if (!battle || !currentQuestion || selectedAnswer === null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(true);
    const timeTakenMs = Date.now() - questionStartTime;
    try {
      const r = await fetch('/api/battle/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battleId: battle.battleId,
          questionId: currentQuestion.id,
          answer: selectedAnswer,
          timeTakenMs,
        }),
      });
      if (!r.ok) throw new Error('Failed to submit answer');
      const j: RespondResponse = await r.json();
      setLastResult(j);
      if (j.battleEnded) {
        setFinalResult(j);
        setCurrentQuestion(null);
      } else {
        // Wait 1.5s so the user can see the result, then move to next question
        setTimeout(() => {
          setCurrentQuestion(j.nextQuestion);
          setSelectedAnswer(null);
          setQuestionStartTime(Date.now());
          setTimeLeft(battle.timePerQuestionSec);
          setLastResult(null);
        }, 1800);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Skip question (treat as unanswered)
  const skipQuestion = async () => {
    if (!battle || !currentQuestion) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(true);
    const timeTakenMs = Date.now() - questionStartTime;
    try {
      const r = await fetch('/api/battle/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battleId: battle.battleId,
          questionId: currentQuestion.id,
          answer: 'unanswered',
          timeTakenMs,
        }),
      });
      if (!r.ok) throw new Error('Failed to skip question');
      const j: RespondResponse = await r.json();
      setLastResult(j);
      if (j.battleEnded) {
        setFinalResult(j);
        setCurrentQuestion(null);
      } else {
        setTimeout(() => {
          setCurrentQuestion(j.nextQuestion);
          setSelectedAnswer(null);
          setQuestionStartTime(Date.now());
          setTimeLeft(battle.timePerQuestionSec);
          setLastResult(null);
        }, 1800);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (!battle || !currentQuestion || lastResult) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Auto-submit as unanswered when time runs out
          skipQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle, currentQuestion, lastResult]);

  // ---- Pre-battle setup screen ----
  if (!battle) {
    return (
      <Card className="p-6 border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <Swords className="h-5 w-5 text-blue-500" />
              Battle Setup
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-stone-500">Exam</Label>
                <Select value={examId} onValueChange={setExamId}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableExams.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                    {availableExams.length === 0 && (
                      <>
                        <SelectItem value="jee-main">JEE Main</SelectItem>
                        <SelectItem value="neet">NEET</SelectItem>
                        <SelectItem value="gre">GRE</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-stone-500">Questions ({questionCount})</Label>
                <input
                  type="range"
                  min={5}
                  max={15}
                  value={questionCount}
                  onChange={e => setQuestionCount(Number(e.target.value))}
                  className="w-full mt-2"
                />
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>5 (quick)</span>
                  <span>10 (standard)</span>
                  <span>15 (marathon)</span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-stone-500">Time per question ({timePerQuestion}s)</Label>
                <input
                  type="range"
                  min={15}
                  max={60}
                  step={5}
                  value={timePerQuestion}
                  onChange={e => setTimePerQuestion(Number(e.target.value))}
                  className="w-full mt-2"
                />
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>15s (blitz)</span>
                  <span>30s (standard)</span>
                  <span>60s (relaxed)</span>
                </div>
              </div>
              <Button onClick={startBattle} disabled={loading} className="w-full">
                {loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Starting…</> : <><Swords className="h-4 w-4 mr-1" />Find Opponent & Start</>}
              </Button>
              {error && <p className="text-sm text-rose-600">{error}</p>}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-5 border border-blue-100">
            <h4 className="font-semibold text-stone-800 mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              How battles work
            </h4>
            <ul className="text-sm text-stone-700 space-y-2 list-disc list-inside">
              <li>Match against a bot opponent at your skill level — perfect for solo practice.</li>
              <li>Each correct answer earns <strong>100 base points + up to 50 speed bonus</strong>.</li>
              <li>The bot answers questions on its own schedule — you'll see its result after each question.</li>
              <li>Win to gain <strong>XP and Elo rating</strong>; lose and your rating drops slightly.</li>
              <li>Battle XP feeds your leaderboard rank + your study squad's weekly total.</li>
            </ul>
          </div>
        </div>
      </Card>
    );
  }

  // ---- Final result screen ----
  if (finalResult) {
    return <BattleResultView battle={battle} result={finalResult} onExit={() => { setBattle(null); setFinalResult(null); }} />;
  }

  // ---- Active battle screen ----
  const progressPct = ((battle.currentQuestionIndex) / battle.questionCount) * 100;
  const timeLeftPct = (timeLeft / battle.timePerQuestionSec) * 100;
  const scoreDiff = (lastResult?.scoreA ?? battle.playerAScore) - (lastResult?.scoreB ?? battle.playerBScore);

  return (
    <div className="space-y-4">
      {/* Top score bar */}
      <Card className="p-4 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Player A */}
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg mx-auto">
              {displayName.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <p className="font-semibold text-stone-800 mt-1 truncate">{displayName}</p>
            <p className="text-xs text-stone-500">Rating {battle.playerA.rating}</p>
            <p className="text-2xl font-bold tabular-nums text-blue-700 mt-1">{lastResult?.scoreA ?? battle.playerAScore}</p>
          </div>

          {/* VS + question progress */}
          <div className="text-center">
            <Badge variant="outline" className="bg-white text-stone-700 border-stone-300 mb-2">
              Question {battle.currentQuestionIndex + (currentQuestion ? 1 : 0)} / {battle.questionCount}
            </Badge>
            <Progress value={progressPct} className="h-1.5" />
            <p className="text-3xl font-black text-stone-400 mt-2">VS</p>
            {scoreDiff !== 0 && (
              <p className={`text-xs mt-1 ${scoreDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {scoreDiff > 0 ? `+${scoreDiff} you` : `${scoreDiff} opponent`}
              </p>
            )}
          </div>

          {/* Player B (bot) */}
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-amber-400 text-white flex items-center justify-center text-2xl mx-auto">
              🤖
            </div>
            <p className="font-semibold text-stone-800 mt-1 truncate">{battle.playerB.displayName}</p>
            <p className="text-xs text-stone-500">Rating {battle.playerB.rating} · Bot</p>
            <p className="text-2xl font-bold tabular-nums text-amber-700 mt-1">{lastResult?.scoreB ?? battle.playerBScore}</p>
          </div>
        </div>
      </Card>

      {/* Question card */}
      {currentQuestion && (
        <Card className="p-5 border-blue-200">
          {/* Timer */}
          <div className="flex items-center justify-between mb-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Brain className="h-3 w-3 mr-1" />
              {currentQuestion.subject} · {currentQuestion.topic}
            </Badge>
            <div className="flex items-center gap-2">
              <Clock className={`h-4 w-4 ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-stone-400'}`} />
              <span className={`font-mono tabular-nums font-bold ${timeLeft <= 5 ? 'text-rose-600' : 'text-stone-700'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>
          <div className="h-1 bg-stone-100 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full transition-all ${timeLeft <= 5 ? 'bg-rose-500' : 'bg-blue-500'}`}
              style={{ width: `${timeLeftPct}%` }}
            />
          </div>

          <h3 className="font-semibold text-stone-800 mb-3 text-lg leading-relaxed">{currentQuestion.text}</h3>

          {/* Options */}
          {currentQuestion.options && currentQuestion.options.length > 0 && (
            <div className="space-y-2">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = Array.isArray(selectedAnswer)
                  ? selectedAnswer.includes(idx)
                  : selectedAnswer === idx;
                const showCorrect = lastResult && currentQuestion.correctOptions?.includes(idx);
                const showWrong = lastResult && isSelected && !currentQuestion.correctOptions?.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => !lastResult && !loading && setSelectedAnswer(idx)}
                    disabled={!!lastResult || loading}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      showCorrect ? 'border-emerald-500 bg-emerald-50' :
                      showWrong ? 'border-rose-500 bg-rose-50' :
                      isSelected ? 'border-blue-500 bg-blue-50' :
                      'border-stone-200 hover:border-blue-300 hover:bg-blue-50/30'
                    } ${lastResult ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-7 w-7 rounded-full flex items-center justify-center font-semibold text-sm ${
                        showCorrect ? 'bg-emerald-500 text-white' :
                        showWrong ? 'bg-rose-500 text-white' :
                        isSelected ? 'bg-blue-500 text-white' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 text-sm text-stone-800">{opt}</span>
                      {showCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      {showWrong && <XCircle className="h-4 w-4 text-rose-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Result overlay */}
          {lastResult && (
            <div className={`mt-4 p-3 rounded-lg border-2 ${
              lastResult.correct ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {lastResult.correct ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-600" />
                )}
                <p className={`font-semibold ${lastResult.correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {lastResult.correct ? `Correct! +${lastResult.pointsEarned} points` : 'Incorrect — 0 points'}
                </p>
              </div>
              <p className="text-xs text-stone-600">
                Opponent: {lastResult.opponentCorrect ? `✓ correct (+${lastResult.opponentPointsEarned} pts in ${(lastResult.opponentTimeMs / 1000).toFixed(1)}s)` : '✗ incorrect'}
              </p>
            </div>
          )}

          {/* Action buttons */}
          {!lastResult && (
            <div className="flex items-center gap-2 mt-4">
              <Button onClick={submitAnswer} disabled={loading || selectedAnswer === null} className="flex-1">
                {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
                Submit Answer
              </Button>
              <Button variant="outline" onClick={skipQuestion} disabled={loading}>
                Skip
              </Button>
            </div>
          )}
        </Card>
      )}

      {error && (
        <Card className="p-4 border-rose-200 bg-rose-50">
          <p className="text-sm text-rose-700">{error}</p>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Battle Result View
// ============================================================================

function BattleResultView({ battle, result, onExit }: { battle: StartBattleResponse; result: RespondResponse; onExit: () => void }) {
  const won = result.winner === 'A';
  const draw = result.winner === 'draw';
  const tier = won ? 'win' : draw ? 'draw' : 'loss';
  const tierMeta = {
    win: { label: 'Victory!', color: 'from-emerald-400 to-teal-500', icon: <Crown className="h-10 w-10 text-white" />, msg: 'Outstanding! You out-thought your opponent.' },
    draw: { label: 'Draw', color: 'from-blue-400 to-cyan-500', icon: <Activity className="h-10 w-10 text-white" />, msg: 'Evenly matched — well played on both sides.' },
    loss: { label: 'Defeat', color: 'from-rose-400 to-red-500', icon: <Heart className="h-10 w-10 text-white" />, msg: 'Tough one. Learn from this and come back stronger.' },
  }[tier];

  return (
    <div className="space-y-4">
      <Card className={`p-6 border-2 border-blue-300 bg-gradient-to-br ${tierMeta.color}`}>
        <div className="text-center text-white">
          <div className="h-16 w-16 mx-auto mb-2">{tierMeta.icon}</div>
          <h2 className="text-3xl font-bold">{tierMeta.label}</h2>
          <p className="text-sm opacity-90 mt-1">{tierMeta.msg}</p>
        </div>
      </Card>

      {/* Final scores */}
      <Card className="p-5 border-blue-200">
        <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Final Score
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg text-center ${won ? 'bg-emerald-50 border-2 border-emerald-300' : 'bg-stone-50 border-2 border-stone-200'}`}>
            <p className="text-xs font-semibold text-stone-500 uppercase">You</p>
            <p className="text-3xl font-bold text-stone-800 tabular-nums mt-1">{result.scoreA}</p>
            {won && <Badge className="mt-2 bg-emerald-100 text-emerald-700 border-emerald-300"><Crown className="h-3 w-3 mr-1" />Winner</Badge>}
          </div>
          <div className={`p-4 rounded-lg text-center ${!won && !draw ? 'bg-emerald-50 border-2 border-emerald-300' : 'bg-stone-50 border-2 border-stone-200'}`}>
            <p className="text-xs font-semibold text-stone-500 uppercase">{battle.playerB.displayName}</p>
            <p className="text-3xl font-bold text-stone-800 tabular-nums mt-1">{result.scoreB}</p>
            {!won && !draw && <Badge className="mt-2 bg-emerald-100 text-emerald-700 border-emerald-300"><Crown className="h-3 w-3 mr-1" />Winner</Badge>}
          </div>
        </div>
      </Card>

      {/* Rewards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-5 w-5 text-amber-500" />
            <span className="text-xs font-semibold text-stone-500 uppercase">XP Earned</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">+{result.xpAwardedA ?? 0} XP</p>
        </Card>
        <Card className="p-4 border-purple-200 bg-purple-50/50">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <span className="text-xs font-semibold text-stone-500 uppercase">Rating Change</span>
          </div>
          <p className={`text-2xl font-bold ${(result.ratingChangeA ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {(result.ratingChangeA ?? 0) >= 0 ? '+' : ''}{result.ratingChangeA ?? 0}
          </p>
        </Card>
      </div>

      <Button onClick={onExit} className="w-full">
        <Swords className="h-4 w-4 mr-1" />
        Battle Again
      </Button>
    </div>
  );
}

// ============================================================================
// Leaderboard Tab
// ============================================================================

function LeaderboardTab({ userId }: { userId: string }) {
  const [data, setData] = useState<{ leaderboard: LeaderboardEntry[]; myEntry: LeaderboardEntry | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/battle/leaderboard?userId=${encodeURIComponent(userId)}`);
      if (r.ok) {
        const j = await r.json();
        setData({ leaderboard: j.leaderboard, myEntry: j.myEntry });
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <Card className="p-12 text-center"><Loader2 className="h-8 w-8 text-blue-500 mx-auto animate-spin" /></Card>;
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* My stats */}
      {data.myEntry && (
        <Card className="p-4 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
              #{data.myEntry.rank || '?'}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-stone-800">Your Stats</p>
              <div className="grid grid-cols-4 gap-3 mt-1">
                <Stat label="Rating" value={data.myEntry.rating} icon={<Target className="h-3 w-3" />} />
                <Stat label="Win Rate" value={`${data.myEntry.winRate}%`} icon={<Trophy className="h-3 w-3" />} />
                <Stat label="Total XP" value={data.myEntry.totalXp} icon={<Star className="h-3 w-3" />} />
                <Stat label="Weekly XP" value={`+${data.myEntry.weeklyXp}`} icon={<Flame className="h-3 w-3" />} />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Leaderboard list */}
      <Card className="p-4 border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-stone-800 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            Global Leaderboard
          </h3>
          <Button variant="ghost" size="sm" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
        </div>
        <div className="space-y-1">
          {data.leaderboard.map((entry, idx) => {
            const isMe = entry.userId === userId;
            const rankColor = idx === 0 ? 'bg-amber-100 text-amber-700' :
              idx === 1 ? 'bg-stone-200 text-stone-700' :
              idx === 2 ? 'bg-orange-100 text-orange-700' :
              'bg-stone-50 text-stone-600';
            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-3 p-2 rounded-lg ${isMe ? 'bg-blue-50 border border-blue-300' : 'hover:bg-stone-50'}`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${rankColor}`}>
                  {entry.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 truncate">
                    {entry.displayName} {isMe && <span className="text-xs text-blue-600">(you)</span>}
                  </p>
                  <p className="text-xs text-stone-500">
                    {entry.battlesWon}W · {entry.battlesLost}L · {entry.battlesDraw}D · {entry.winRate}% win rate
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold tabular-nums text-stone-800">{entry.rating}</p>
                  <p className="text-[10px] text-stone-500">rating</p>
                </div>
                <div className="text-right w-20">
                  <p className="font-bold tabular-nums text-amber-700">{entry.totalXp}</p>
                  <p className="text-[10px] text-stone-500">XP</p>
                </div>
                {idx < 3 && <Award className="h-4 w-4 text-amber-500" />}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-stone-500">{icon}<span className="text-[10px] uppercase font-semibold">{label}</span></div>
      <p className="font-bold tabular-nums text-stone-800 text-sm">{value}</p>
    </div>
  );
}

// ============================================================================
// Squads Tab
// ============================================================================

function SquadsTab({ userId, displayName, examGoal }: { userId: string; displayName: string; examGoal: string }) {
  const [squads, setSquads] = useState<StudySquad[]>([]);
  const [mySquad, setMySquad] = useState<StudySquad | null>(null);
  const [mySquadMembers, setMySquadMembers] = useState<SquadMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadDesc, setNewSquadDesc] = useState('');
  const [newSquadExam, setNewSquadExam] = useState(examGoal);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/battle/squads?userId=${encodeURIComponent(userId)}`);
      if (r.ok) {
        const j = await r.json();
        setSquads(j.squads ?? []);
        setMySquad(j.mySquad ?? null);
        setMySquadMembers(j.mySquadMembers ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const createSquad = async () => {
    if (!newSquadName.trim()) return;
    await fetch('/api/battle/squads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        name: newSquadName,
        description: newSquadDesc,
        examGoal: newSquadExam,
        userId,
        displayName,
      }),
    });
    setShowCreate(false);
    setNewSquadName('');
    setNewSquadDesc('');
    load();
  };

  const joinSquad = async (squadId: string) => {
    await fetch('/api/battle/squads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', squadId, userId, displayName }),
    });
    load();
  };

  const leaveMySquad = async () => {
    await fetch('/api/battle/squads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'leave', userId }),
    });
    load();
  };

  if (loading) {
    return <Card className="p-12 text-center"><Loader2 className="h-8 w-8 text-blue-500 mx-auto animate-spin" /></Card>;
  }

  return (
    <div className="space-y-4">
      {/* My squad */}
      {mySquad && (
        <Card className="p-5 border-2" style={{ borderColor: mySquad.color }}>
          <div className="flex items-start gap-4">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${mySquad.color}30` }}
            >
              <Shield className="h-7 w-7" style={{ color: mySquad.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-stone-800">{mySquad.name}</h3>
                <Badge
                  variant="outline"
                  className="capitalize"
                  style={{ background: `${mySquad.color}20`, color: mySquad.color, borderColor: mySquad.color }}
                >
                  {mySquad.tier}
                </Badge>
                <Badge variant="outline" className="bg-stone-50 text-stone-700 border-stone-200">
                  {mySquad.examGoal}
                </Badge>
              </div>
              <p className="text-sm text-stone-600 mt-1">{mySquad.description}</p>
              <div className="grid grid-cols-4 gap-3 mt-3">
                <Stat label="Members" value={mySquad.memberIds.length} icon={<Users className="h-3 w-3" />} />
                <Stat label="Total XP" value={mySquad.totalXp} icon={<Star className="h-3 w-3" />} />
                <Stat label="Weekly XP" value={`+${mySquad.weeklyXp}`} icon={<Flame className="h-3 w-3" />} />
                <Stat label="Weekly W/L" value={`${mySquad.weeklyWins}/${mySquad.weeklyLosses}`} icon={<Trophy className="h-3 w-3" />} />
              </div>
            </div>
          </div>

          {/* Member list */}
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-xs font-semibold text-stone-500 uppercase mb-2">Members</p>
            <div className="space-y-1">
              {mySquadMembers.map(m => (
                <div key={m.userId} className="flex items-center gap-2 p-2 rounded bg-stone-50">
                  <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                    {m.displayName.split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </div>
                  <span className="flex-1 text-sm text-stone-700">{m.displayName}</span>
                  <span className="text-xs text-stone-500">{m.contributionXp} XP</span>
                  <span className="text-xs text-emerald-600">+{m.weeklyContributionXp}</span>
                </div>
              ))}
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={leaveMySquad} className="mt-3 text-rose-600 hover:text-rose-700">
            Leave Squad
          </Button>
        </Card>
      )}

      {/* Create new squad */}
      {!mySquad && (
        <>
          {!showCreate ? (
            <Button onClick={() => setShowCreate(true)} className="w-full">
              <Plus className="h-4 w-4 mr-1" />
              Create a New Squad
            </Button>
          ) : (
            <Card className="p-4 border-blue-300 space-y-3">
              <h4 className="font-semibold text-stone-800">Create Study Squad</h4>
              <div>
                <Label className="text-xs text-stone-500">Squad name</Label>
                <Input value={newSquadName} onChange={e => setNewSquadName(e.target.value)} placeholder="e.g. Physics Phantoms" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-stone-500">Description</Label>
                <Textarea value={newSquadDesc} onChange={e => setNewSquadDesc(e.target.value)} placeholder="What's your squad about?" rows={2} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-stone-500">Target exam</Label>
                <Select value={newSquadExam} onValueChange={setNewSquadExam}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jee-main">JEE Main</SelectItem>
                    <SelectItem value="neet">NEET</SelectItem>
                    <SelectItem value="gate">GATE</SelectItem>
                    <SelectItem value="cat">CAT</SelectItem>
                    <SelectItem value="upsc">UPSC</SelectItem>
                    <SelectItem value="gre">GRE</SelectItem>
                    <SelectItem value="gmat">GMAT</SelectItem>
                    <SelectItem value="sat">SAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={createSquad} disabled={!newSquadName.trim()}>Create Squad</Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Browse squads */}
      <Card className="p-4 border-blue-200">
        <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" />
          {mySquad ? 'Other Squads' : 'Browse Squads'}
        </h3>
        {squads.length === 0 ? (
          <p className="text-sm text-stone-500 text-center py-4">No squads yet. Be the first to create one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {squads.filter(s => s.id !== mySquad?.id).map(squad => (
              <Card key={squad.id} className="p-3 border-stone-200 hover:border-blue-300 transition-colors">
                <div className="flex items-start gap-3">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${squad.color}30` }}
                  >
                    <Shield className="h-5 w-5" style={{ color: squad.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-stone-800 truncate">{squad.name}</p>
                      <Badge variant="outline" className="capitalize text-xs" style={{ color: squad.color, borderColor: squad.color }}>
                        {squad.tier}
                      </Badge>
                    </div>
                    <p className="text-xs text-stone-500 line-clamp-2 mt-0.5">{squad.description || 'No description'}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-stone-600">
                      <span><Users className="inline h-3 w-3 mr-1" />{squad.memberIds.length}</span>
                      <span><Star className="inline h-3 w-3 mr-1" />{squad.totalXp} XP</span>
                      <Badge variant="outline" className="text-xs bg-stone-50">{squad.examGoal}</Badge>
                    </div>
                  </div>
                </div>
                {!mySquad && (
                  <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => joinSquad(squad.id)}>
                    Join Squad
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
