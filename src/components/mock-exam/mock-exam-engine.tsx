'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { useStore, userExamGoals } from '@/lib/store';
import { EXAM_PATTERNS, getPattern } from '@/lib/exams/patterns';
import type { ExamAttempt, ExamPattern, GeneratedExam } from '@/lib/types';
import { ManageExamsDialog } from '@/components/dashboard/manage-exams-dialog';
import { ContestFormDialog } from '@/components/shared/dialogs';
import { PremiumHeader } from '@/components/shared/premium-header';
import { useToast } from '@/hooks/use-toast';
import {
  Atom, Clock, FileText, Settings2, Sparkles, Trophy, Target,
  TrendingUp, Info, ShieldCheck, GraduationCap,
  HeartPulse, BookOpen, Briefcase, Cpu, Languages, Landmark, Brain, Search,
  BarChart3, Zap, Scale
} from 'lucide-react';
import { AdaptiveMockRunner } from './adaptive-mock-runner';
import { cn } from '@/lib/utils';

interface Props {
  onStart?: () => void;
}

export function MockExamEngine({ onStart }: Props = {}) {
  const user = useStore((s) => s.user);
  const attempts = useStore((s) => s.attempts);
  const startExam = useStore((s) => s.startExam);
  const seenSignatures = useStore((s) => s.seenSignatures);
  const { toast } = useToast();

  const goals = userExamGoals(user);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');
  const [manageOpen, setManageOpen] = React.useState(false);
  const [configFor, setConfigFor] = React.useState<ExamPattern | null>(null);
  const [syllabusFor, setSyllabusFor] = React.useState<ExamPattern | null>(null);
  const [contestFor, setContestFor] = React.useState<ExamPattern | null>(null);
  const [difficulty, setDifficulty] = React.useState<'balanced' | 'easy' | 'hard'>('balanced');
  const [durationOverride, setDurationOverride] = React.useState<string>('default');
  const [generating, setGenerating] = React.useState(false);
  const [adaptiveFor, setAdaptiveFor] = React.useState<ExamPattern | null>(null);

  // Derive all distinct domain categories across the entire exam catalog
  const categoriesList = React.useMemo(() => {
    const set = new Set<string>();
    EXAM_PATTERNS.forEach((p) => {
      if (p.domainCategory) set.add(p.domainCategory);
    });
    return [
      'All',
      'My Target Goals',
      ...Array.from(set).sort((a, b) => {
        // Put UPSC & State PSC at the front
        if (a.includes('UPSC')) return -1;
        if (b.includes('UPSC')) return 1;
        if (a.includes('State PSC')) return -1;
        if (b.includes('State PSC')) return 1;
        return a.localeCompare(b);
      })
    ];
  }, []);

  // Filtered list based on search and category
  const filteredExams = React.useMemo(() => {
    return EXAM_PATTERNS.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.fullName.toLowerCase().includes(q) ||
        (p.state && p.state.toLowerCase().includes(q)) ||
        (p.domainCategory && p.domainCategory.toLowerCase().includes(q)) ||
        (p.conductingBody && p.conductingBody.toLowerCase().includes(q)) ||
        (p.postOrCourse && p.postOrCourse.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (selectedCategory === 'All') return true;
      if (selectedCategory === 'My Target Goals') return goals.includes(p.id);
      if (p.domainCategory === selectedCategory) return true;
      return false;
    });
  }, [searchQuery, selectedCategory, goals]);

  const recentAttempts = React.useMemo(() => {
    return [...attempts]
      .sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt))
      .slice(0, 4);
  }, [attempts]);

  function examAttempts(examId: string): ExamAttempt[] {
    return attempts.filter((a) => a.examId === examId);
  }

  function bestScore(examId: string): { score: number; total: number; pct: number } | null {
    const list = examAttempts(examId);
    if (list.length === 0) return null;
    let best = list[0];
    for (const a of list) {
      if (a.score / Math.max(1, a.totalMarks) > best.score / Math.max(1, best.totalMarks)) best = a;
    }
    const pct = Math.round((best.score / Math.max(1, best.totalMarks)) * 100);
    return { score: best.score, total: best.totalMarks, pct };
  }

  // Aggregate stats
  const totalAttempts = attempts.length;
  const avgAccuracy = totalAttempts > 0
    ? Math.round(attempts.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) / totalAttempts)
    : 0;

  async function handleGenerate(pattern: ExamPattern) {
    setGenerating(true);
    try {
      const { seenSignatures, recordSeenSignatures } = useStore.getState();
      const priorAttempts = examAttempts(pattern.id);
      const attemptNumber = priorAttempts.length + 1;
      const resp = await fetch('/api/mock-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: pattern.id,
          attemptNumber,
          seenSignatures: seenSignatures.slice(-2000),
          difficulty,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate exam');
      }
      const payload = await resp.json();
      const newSigs: string[] = Array.isArray(payload._newSignatures) ? payload._newSignatures : [];
      recordSeenSignatures(newSigs);

      const exam: GeneratedExam = {
        id: payload.id,
        examId: payload.examId,
        examName: payload.examName,
        durationSec: durationOverride === 'default'
          ? payload.durationSec
          : parseInt(durationOverride, 10) * 60,
        totalMarks: payload.totalMarks,
        startedAt: payload.startedAt,
        questions: payload.questions,
        sections: payload.sections,
      };

      startExam(exam, pattern.id);
      toast({
        title: `Attempt #${attemptNumber} started`,
        description: `Fresh paper loaded · ${exam.questions.length} questions ready`,
      });
    } catch (e) {
      toast({ title: 'Generation failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setGenerating(false);
      setConfigFor(null);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Adaptive mode — replaces the engine UI when active */}
      {adaptiveFor && (
        <AdaptiveMockRunner
          examId={adaptiveFor.id}
          onExit={() => setAdaptiveFor(null)}
        />
      )}
      {!adaptiveFor && (
        <>
          {/* Premium gradient header */}
          <PremiumHeader
            title="AI Mock Exam Engine"
            subtitle="Full exam catalog across UPSC, 28 State PSCs, Engineering, Medical, Banking, Defense & Management with 3PL psychometric deduplication."
            icon={Atom}
            variant="sapphire"
            actions={
              <Button
                size="sm"
                variant="outline"
                className="bg-white/15 text-white border-white/30 backdrop-blur-sm hover:bg-white/25 shadow-sm"
                onClick={() => setManageOpen(true)}
              >
                <Settings2 className="h-4 w-4 mr-1.5" /> Manage My Goals ({goals.length})
              </Button>
            }
          />

          {/* Real-time Telemetry & Engine Overview Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card className="border-stone-200/80 bg-white/90 shadow-sm backdrop-blur-sm hover:border-blue-300 transition">
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 ring-1 ring-blue-100">
                  <Target className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Target Goals</p>
                    <button
                      onClick={() => setManageOpen(true)}
                      className="text-[10px] text-blue-600 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-lg font-bold text-stone-900 truncate">
                    {goals.length} Exam{goals.length === 1 ? '' : 's'} Active
                  </p>
                  <p className="text-[11px] text-blue-700 font-medium truncate">
                    Primary: {getPattern(user?.examGoal || '')?.name ?? 'UPSC CSE'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-stone-200/80 bg-white/90 shadow-sm backdrop-blur-sm hover:border-emerald-300 transition">
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 ring-1 ring-emerald-100">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Exam Catalog</p>
                  <p className="text-lg font-bold text-stone-900">{EXAM_PATTERNS.length} National &amp; State</p>
                  <p className="text-[11px] text-emerald-700 font-medium truncate">
                    All 28 States &amp; Central Exams
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-stone-200/80 bg-white/90 shadow-sm backdrop-blur-sm hover:border-indigo-300 transition">
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0 ring-1 ring-indigo-100">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Mock Attempts</p>
                  <p className="text-lg font-bold text-stone-900">{totalAttempts} Completed</p>
                  <p className="text-[11px] text-indigo-700 font-medium">
                    {avgAccuracy > 0 ? `${avgAccuracy}% Avg Accuracy` : 'No attempts logged'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-stone-200/80 bg-white/90 shadow-sm backdrop-blur-sm hover:border-purple-300 transition">
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0 ring-1 ring-purple-100">
                  <Brain className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Psychometrics</p>
                  <p className="text-lg font-bold text-stone-900">3PL Adaptive IRT</p>
                  <p className="text-[11px] text-purple-700 font-medium">
                    {seenSignatures.length} Unique Qs Tracked
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
                {categoriesList.map((cat) => {
                  const count = cat === 'All'
                    ? EXAM_PATTERNS.length
                    : cat === 'My Target Goals'
                    ? goals.length
                    : EXAM_PATTERNS.filter((p) => p.domainCategory === cat).length;

                  const isSelected = selectedCategory === cat;

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5',
                        isSelected
                          ? 'bg-blue-700 text-white shadow-sm'
                          : 'text-stone-600 hover:bg-stone-100 bg-stone-50 border border-stone-200/60'
                      )}
                    >
                      <span>{cat}</span>
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                        isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative min-w-[240px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search 40+ exams, state PSCs, GATE, UPSC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-stone-50 border-stone-200"
                />
              </div>
            </div>

            {/* Results count & status */}
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-stone-500 font-medium">
                Showing <strong className="text-stone-900">{filteredExams.length}</strong> exam paper blueprints
                {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
              </p>
              {goals.length > 0 && (
                <p className="text-xs text-blue-700 font-medium hidden sm:block">
                  💡 {goals.length} target exams marked in your study planner
                </p>
              )}
            </div>

            {/* Empty state when search yields no result */}
            {filteredExams.length === 0 ? (
              <Card className="border-dashed border-2 border-stone-300 bg-white/60 p-8 text-center">
                <CardContent className="flex flex-col items-center gap-3.5 max-w-md mx-auto">
                  <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center ring-1 ring-amber-200">
                    <Target className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-stone-900">No exams match your search</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Try clearing the search query or selecting a different category from the filter strip.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                    className="text-xs"
                  >
                    Reset all filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Exam Cards Grid — 3 Column Responsive, Perfectly Aligned */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
                {filteredExams.map((p) => {
                  const best = bestScore(p.id);
                  const count = examAttempts(p.id).length;
                  const isPrimary = user?.examGoal === p.id;
                  const isTarget = goals.includes(p.id);

                  return (
                    <Card
                      key={p.id}
                      className="border-stone-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between bg-white overflow-hidden group"
                    >
                      {/* Card Header */}
                      <CardHeader className="p-4 pb-3 border-b border-stone-100/80">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition shadow-xs">
                              <IconFor name={p.icon} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-sm text-stone-900 leading-tight">
                                  {p.name}
                                </span>
                                {isPrimary && (
                                  <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] px-1.5 py-0 font-bold shrink-0">
                                    <Trophy className="h-2.5 w-2.5 mr-0.5 text-amber-600" /> Primary
                                  </Badge>
                                )}
                                {isTarget && !isPrimary && (
                                  <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] px-1.5 py-0 font-semibold shrink-0">
                                    <Target className="h-2.5 w-2.5 mr-0.5 text-blue-600" /> Target
                                  </Badge>
                                )}
                                {p.state && p.state !== 'All-India' && (
                                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 px-1.5 py-0 font-medium shrink-0">
                                    📍 {p.state}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-stone-700 line-clamp-1 mt-0.5" title={p.fullName}>
                                {p.fullName}
                              </p>
                              <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5" title={p.conductingBody ? `${p.conductingBody} · ${p.postOrCourse || p.domainCategory}` : p.domainCategory}>
                                {p.conductingBody ? `${p.conductingBody} · ` : ''}{p.postOrCourse || p.domainCategory}
                              </p>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSyllabusFor(p)}
                            className="text-[11px] h-7 px-2 text-stone-500 hover:text-blue-700 hover:bg-blue-50 shrink-0"
                            title="View official syllabus and exam blueprint"
                          >
                            <Info className="h-3.5 w-3.5 mr-1" /> Blueprint
                          </Button>
                        </div>
                      </CardHeader>

                      {/* Card Content with structured metrics and section pills */}
                      <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        {/* Blueprint Badges Grid */}
                        <div className="grid grid-cols-4 gap-1.5 text-center">
                          <div className="bg-stone-50 border border-stone-200/80 rounded-lg py-1 px-1">
                            <p className="text-[10px] uppercase text-muted-foreground font-medium">Questions</p>
                            <p className="text-xs font-bold text-stone-800">{p.totalQuestions} Q</p>
                          </div>
                          <div className="bg-stone-50 border border-stone-200/80 rounded-lg py-1 px-1">
                            <p className="text-[10px] uppercase text-muted-foreground font-medium">Time</p>
                            <p className="text-xs font-bold text-stone-800">{Math.round(p.durationSec / 60)} m</p>
                          </div>
                          <div className="bg-stone-50 border border-stone-200/80 rounded-lg py-1 px-1">
                            <p className="text-[10px] uppercase text-muted-foreground font-medium">Marks</p>
                            <p className="text-xs font-bold text-stone-800">{p.totalMarks}</p>
                          </div>
                          <div className="bg-blue-50/50 border border-blue-200/80 rounded-lg py-1 px-1">
                            <p className="text-[10px] uppercase text-blue-700 font-medium">Marking</p>
                            <p className="text-[11px] font-bold text-blue-800 truncate" title={p.marking}>{p.marking}</p>
                          </div>
                        </div>

                        {/* Section Pills — Clean limited display with +N more indicator */}
                        <div className="min-h-[26px] flex items-center gap-1.5 flex-wrap">
                          {p.sections.slice(0, 3).map((s) => (
                            <span
                              key={s.name}
                              className="text-[10px] font-medium bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md truncate max-w-[130px]"
                              title={`${s.name} (${s.questionCount} Questions)`}
                            >
                              {s.name} ({s.questionCount}Q)
                            </span>
                          ))}
                          {p.sections.length > 3 && (
                            <span
                              className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md border border-blue-200"
                              title={p.sections.slice(3).map(s => `${s.name} (${s.questionCount}Q)`).join(', ')}
                            >
                              +{p.sections.length - 3} more
                            </span>
                          )}
                        </div>

                        {/* Performance & Attempt Meter */}
                        <div className="min-h-[46px] flex flex-col justify-center">
                          {count > 0 ? (
                            <div className="bg-stone-50 border border-stone-200/80 rounded-lg p-2 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-stone-600 font-medium flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3 text-blue-600" />
                                  {count} attempt{count > 1 ? 's' : ''} logged
                                </span>
                                <span className="font-bold text-blue-700">
                                  Best: {best?.score}/{best?.total} ({best?.pct}%)
                                </span>
                              </div>
                              <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all"
                                  style={{ width: `${Math.min(100, best?.pct ?? 0)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-stone-500 bg-stone-50/70 border border-dashed border-stone-200 rounded-lg p-2 flex items-center gap-1.5">
                              <Sparkles className="h-3 w-3 text-blue-500 flex-shrink-0" />
                              <span className="truncate">No attempts recorded. Ready for baseline test.</span>
                            </div>
                          )}
                        </div>
                      </CardContent>

                      {/* Card Footer with balanced action buttons */}
                      <CardFooter className="p-3 pt-2.5 border-t border-stone-100 bg-stone-50/40 grid grid-cols-2 gap-2">
                        <Button
                          className="w-full bg-blue-700 hover:bg-blue-800 text-xs font-semibold shadow-xs h-8"
                          onClick={() => setConfigFor(p)}
                        >
                          <Zap className="h-3.5 w-3.5 mr-1" /> Start Mock
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-semibold h-8"
                          onClick={() => setAdaptiveFor(p)}
                        >
                          <Brain className="h-3.5 w-3.5 mr-1 text-blue-600" /> Adaptive
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent attempts log */}
          {recentAttempts.length > 0 && (
            <Card className="border-stone-200 shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-stone-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-stone-900">
                    <Clock className="h-4 w-4 text-blue-600" /> Recent Mock Attempts History
                  </CardTitle>
                  <span className="text-xs text-muted-foreground font-medium">
                    {attempts.length} total saved in cloud DB
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-stone-100">
                {recentAttempts.map((a) => {
                  const pct = Math.round((a.score / Math.max(1, a.totalMarks)) * 100);
                  return (
                    <div key={a.id} className="flex items-center justify-between gap-3 p-3.5 hover:bg-stone-50/70 transition text-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 ring-1 ring-blue-100">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900 truncate">{a.examName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(a.submittedAt).toLocaleDateString(undefined, {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                            {a.attemptNumber ? ` · Attempt #${a.attemptNumber}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-blue-700">{a.score} / {a.totalMarks} marks</p>
                        <p className="text-xs text-stone-500 font-medium">{pct}% Score · {a.accuracy}% Accuracy</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Configure & Launch Dialog */}
          <Dialog open={!!configFor} onOpenChange={(v) => !generating && setConfigFor(v ? configFor : null)}>
            <DialogContent className="sm:max-w-lg">
              {configFor && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-stone-900">
                      <IconFor name={configFor.icon} /> Configure {configFor.name} Mock
                    </DialogTitle>
                    <DialogDescription>{configFor.fullName}</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Pattern summary */}
                    <div className="grid grid-cols-3 gap-2">
                      <SummaryTile label="Questions" value={String(configFor.totalQuestions)} icon={FileText} />
                      <SummaryTile label="Minutes" value={String(Math.round(configFor.durationSec / 60))} icon={Clock} />
                      <SummaryTile label="Total Marks" value={String(configFor.totalMarks)} icon={Trophy} />
                    </div>

                    {/* Section breakdown */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Sections</p>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {configFor.sections.map((s) => (
                          <div key={s.name} className="flex items-center justify-between text-xs border border-stone-200 rounded-md px-3 py-2 bg-stone-50/50">
                            <span className="font-semibold text-stone-800">{s.name}</span>
                            <span className="text-muted-foreground font-medium">
                              {s.questionCount} Qs · +{s.marksPerQuestion} / {s.negativeMarks > 0 ? `-${s.negativeMarks}` : '0'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Difficulty mode</label>
                      <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="balanced">Balanced (Official syllabus distribution)</SelectItem>
                          <SelectItem value="easy">Easy drill (Foundational speed building)</SelectItem>
                          <SelectItem value="hard">Hard focus (High percentile challenge)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Duration override */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Exam Duration</label>
                      <Select value={durationOverride} onValueChange={setDurationOverride}>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Full Standard ({Math.round(configFor.durationSec / 60)} min)</SelectItem>
                          <SelectItem value="30">Speed Drill (30 min)</SelectItem>
                          <SelectItem value="60">1-Hour Practice (60 min)</SelectItem>
                          <SelectItem value="90">Extended Drill (90 min)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-start gap-2 text-xs bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-3">
                      <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-700" />
                      <span>
                        The engine dynamically compiles questions according to official weightages and eliminates previously seen questions using <strong>{seenSignatures.length}</strong> recorded signatures.
                      </span>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setConfigFor(null)} disabled={generating}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (configFor) {
                          setContestFor(configFor);
                          setConfigFor(null);
                        }
                      }}
                      disabled={generating}
                      className="bg-blue-700 hover:bg-blue-800"
                    >
                      <ShieldCheck className="h-4 w-4 mr-1.5" /> Proceed to Proctoring Rules
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Syllabus & Blueprint Dialog */}
          <Dialog open={!!syllabusFor} onOpenChange={(v) => !v && setSyllabusFor(null)}>
            <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
              {syllabusFor && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-stone-900">
                      <IconFor name={syllabusFor.icon} /> {syllabusFor.name} Syllabus &amp; Blueprint
                    </DialogTitle>
                    <DialogDescription>{syllabusFor.fullName} · {syllabusFor.description}</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 text-xs">
                    {/* Key metrics */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                        <p className="font-bold text-sm text-stone-900">{syllabusFor.totalQuestions}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Questions</p>
                      </div>
                      <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                        <p className="font-bold text-sm text-stone-900">{Math.round(syllabusFor.durationSec / 60)} min</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
                      </div>
                      <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                        <p className="font-bold text-sm text-stone-900">{syllabusFor.totalMarks}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Total Marks</p>
                      </div>
                      <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                        <p className="font-bold text-sm text-blue-700">{syllabusFor.marking}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Marking</p>
                      </div>
                    </div>

                    {/* Section Breakdown */}
                    <div>
                      <h4 className="font-bold text-stone-900 uppercase tracking-wide text-[11px] mb-2">Sectional Breakdown</h4>
                      <div className="space-y-1.5">
                        {syllabusFor.sections.map((sec) => (
                          <div key={sec.name} className="flex items-center justify-between p-2 rounded-lg border border-stone-200 bg-stone-50/50">
                            <div>
                              <span className="font-semibold text-stone-900">{sec.name}</span>
                              <span className="text-muted-foreground ml-2">({sec.subject})</span>
                            </div>
                            <span className="font-medium text-stone-700">
                              {sec.questionCount} Questions · +{sec.marksPerQuestion} / -{sec.negativeMarks}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Syllabus Topic Weights */}
                    <div>
                      <h4 className="font-bold text-stone-900 uppercase tracking-wide text-[11px] mb-2">Official Syllabus Topic Distribution</h4>
                      <div className="space-y-3">
                        {syllabusFor.syllabus.map((sub) => (
                          <div key={sub.subject} className="border border-stone-200 rounded-lg p-3 bg-white">
                            <p className="font-bold text-blue-700 mb-2">{sub.subject}</p>
                            <div className="grid grid-cols-2 gap-2">
                              {sub.topics.map((t) => (
                                <div key={t.topic} className="flex items-center justify-between bg-stone-50 px-2.5 py-1.5 rounded text-[11px]">
                                  <span className="truncate text-stone-800">{t.topic}</span>
                                  <span className="font-bold text-stone-600 ml-1">
                                    {Math.round(t.weight * 100)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSyllabusFor(null)}>
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        const target = syllabusFor;
                        setSyllabusFor(null);
                        setConfigFor(target);
                      }}
                      className="bg-blue-700 hover:bg-blue-800"
                    >
                      <Zap className="h-4 w-4 mr-1.5" /> Start Mock
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>

          <ManageExamsDialog open={manageOpen} onOpenChange={setManageOpen} />

          <ContestFormDialog
            open={!!contestFor}
            onOpenChange={(v) => !v && setContestFor(null)}
            pattern={contestFor}
            onAccept={() => {
              if (contestFor) {
                const p = contestFor;
                setContestFor(null);
                handleGenerate(p);
              }
            }}
          />
        </>
      )}
    </div>
  );
}

function SummaryTile({ label, value, icon: Icon }: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="border border-stone-200 rounded-lg p-2.5 text-center bg-stone-50/50">
      <Icon className="h-4 w-4 text-blue-700 mx-auto mb-1" />
      <p className="text-base font-bold text-stone-900 leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}

function IconFor({ name }: { name: string }) {
  const map: Record<string, React.ComponentType<{ className?: string }>> = {
    Atom, HeartPulse, GraduationCap, BookOpen, Trophy, Briefcase, Cpu, Languages, Landmark, ShieldCheck, Scale, Sparkles, Zap, FileText, Brain,
  };
  const Cmp = map[name] || FileText;
  return <Cmp className="h-5 w-5" />;
}
