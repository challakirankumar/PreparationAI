'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { PremiumHeader } from '@/components/shared/premium-header';
import { useStore } from '@/lib/store';
import {
  DEFAULT_PYQ_VOLUMES, DEFAULT_PYQ_QUESTIONS, getPYQVolumes, getPYQQuestions, getPYQYears, getPYQSubjects
} from '@/lib/pyq/volume-bank';
import type { PYQFilter, PYQQuestion, PYQVolume } from '@/lib/types';
import {
  BookOpen, Clock, FileText, Sparkles, CheckCircle2, XCircle, ChevronRight,
  Search, Filter, Bookmark, BookmarkCheck, Brain, ArrowRight, Layers,
  RotateCcw, Trophy, Award, Zap, HelpCircle, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function PYQArchiveView() {
  const user = useStore((s) => s.user);
  const customVolumes = useStore((s) => s.customPYQVolumes);
  const customQuestions = useStore((s) => s.customPYQQuestions);
  const setView = useStore((s) => s.setView);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState<'volumes' | 'practice' | 'simulation'>('volumes');
  const [selectedExam, setSelectedExam] = React.useState<string>('all');
  const [selectedVolume, setSelectedVolume] = React.useState<string>('all');
  const [selectedYear, setSelectedYear] = React.useState<string>('all');
  const [selectedSubject, setSelectedSubject] = React.useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  // Interactive practice state
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<string, number>>({});
  const [revealedSolutions, setRevealedSolutions] = React.useState<Record<string, boolean>>({});
  const [bookmarkedIds, setBookmarkedIds] = React.useState<string[]>([]);
  const [aiHints, setAiHints] = React.useState<Record<string, string>>({});
  const [loadingAiHint, setLoadingAiHint] = React.useState<Record<string, boolean>>({});

  // Simulation timer state
  const [simActive, setSimActive] = React.useState(false);
  const [simTimeRemaining, setSimTimeRemaining] = React.useState(1800); // 30 min
  const [simScore, setSimScore] = React.useState<{ correct: number; total: number } | null>(null);

  const allVolumes = React.useMemo(() => {
    return getPYQVolumes(selectedExam, customVolumes);
  }, [selectedExam, customVolumes]);

  const filteredQuestions = React.useMemo(() => {
    const filter: PYQFilter = {
      examId: selectedExam,
      year: selectedYear !== 'all' ? parseInt(selectedYear, 10) : undefined,
      volumeId: selectedVolume,
      subject: selectedSubject,
      difficulty: selectedDifficulty as any,
      searchQuery,
    };
    return getPYQQuestions(filter, customQuestions);
  }, [selectedExam, selectedYear, selectedVolume, selectedSubject, selectedDifficulty, searchQuery, customQuestions]);

  const years = getPYQYears();
  const subjects = getPYQSubjects(selectedExam);

  // Toggle option selection
  function handleSelectOption(questionId: string, optionIdx: number) {
    if (selectedAnswers[questionId] !== undefined && !simActive) return; // locked once answered in practice
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
    setRevealedSolutions((prev) => ({ ...prev, [questionId]: true }));
  }

  // Toggle bookmark
  function toggleBookmark(questionId: string) {
    setBookmarkedIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  }

  // Request AI Socratic hint
  async function handleAskAi(q: PYQQuestion) {
    setLoadingAiHint((prev) => ({ ...prev, [q.id]: true }));
    try {
      const resp = await fetch('/api/socratic-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Give me a concise conceptual hint and key principle for this previous year question without giving away the direct answer: "${q.question}"`,
          examGoal: q.examId,
        }),
      });
      const data = await resp.json();
      setAiHints((prev) => ({
        ...prev,
        [q.id]: data.reply || data.hint || `Key Principle: ${q.topic} relates to the core mechanism of ${q.subject}. Review ${q.subtopic || q.topic} formulas.`,
      }));
    } catch {
      setAiHints((prev) => ({
        ...prev,
        [q.id]: `💡 Conceptual Hint: Recall the foundational rule for ${q.topic} in ${q.subject}. Pay close attention to exceptions and boundary conditions.`,
      }));
    } finally {
      setLoadingAiHint((prev) => ({ ...prev, [q.id]: false }));
    }
  }

  // Timer tick for simulation mode
  React.useEffect(() => {
    let interval: any;
    if (simActive && simTimeRemaining > 0) {
      interval = setInterval(() => setSimTimeRemaining((t) => t - 1), 1000);
    } else if (simActive && simTimeRemaining <= 0) {
      handleFinishSimulation();
    }
    return () => clearInterval(interval);
  }, [simActive, simTimeRemaining]);

  function handleStartSimulation(vol: PYQVolume) {
    setSelectedVolume(vol.id);
    setSelectedAnswers({});
    setRevealedSolutions({});
    setSimTimeRemaining(vol.totalQuestions > 30 ? 3600 : 1800);
    setSimScore(null);
    setSimActive(true);
    setActiveTab('practice');
    toast({
      title: `Timed Volume Simulation Started: ${vol.title}`,
      description: `Official timer ticking · Complete all questions and submit`,
    });
  }

  function handleFinishSimulation() {
    setSimActive(false);
    let correct = 0;
    filteredQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    setSimScore({ correct, total: filteredQuestions.length });
    setRevealedSolutions(
      filteredQuestions.reduce((acc, q) => ({ ...acc, [q.id]: true }), {})
    );
    toast({
      title: 'Simulation Completed!',
      description: `You scored ${correct} / ${filteredQuestions.length} correct.`,
    });
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <PremiumHeader
        title="10-Year PYQ Multi-Volume Archive (2015 – 2025)"
        subtitle="Master 10 consecutive years of actual question papers organized into curated volumes across UPSC, GATE, JEE, NEET, SSC, and State PSCs."
        icon={BookOpen}
        variant="sapphire"
        actions={
          user?.role === 'superadmin' || user?.role === 'admin' ? (
            <Button
              size="sm"
              onClick={() => setView('superadmin')}
              className="bg-white/15 text-white border-white/30 backdrop-blur hover:bg-white/25 shadow-sm"
            >
              <Zap className="h-4 w-4 mr-1.5 text-amber-400" /> SuperAdmin Volume Manager
            </Button>
          ) : undefined
        }
      />

      {/* Tabs & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-stone-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => { setActiveTab('volumes'); setSimActive(false); }}
            className={cn(
              'flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2',
              activeTab === 'volumes'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800'
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Multi-Volume Library ({allVolumes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={cn(
              'flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2',
              activeTab === 'practice'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800'
            )}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Practice &amp; Solve ({filteredQuestions.length} Qs)</span>
          </button>
        </div>

        {/* Sim timer status */}
        {simActive && (
          <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-lg">
            <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
              Time Left: {Math.floor(simTimeRemaining / 60)}:{(simTimeRemaining % 60).toString().padStart(2, '0')}
            </span>
            <Button size="sm" onClick={handleFinishSimulation} className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white">
              Submit Test
            </Button>
          </div>
        )}
      </div>

      {/* Filter Matrix */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-stone-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Exam */}
          <div>
            <label className="text-[10px] uppercase font-bold text-stone-500 dark:text-slate-400">Exam</label>
            <Select value={selectedExam} onValueChange={(v) => { setSelectedExam(v); setSelectedVolume('all'); }}>
              <SelectTrigger className="w-full mt-1 h-8 text-xs">
                <SelectValue placeholder="All Exams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                <SelectItem value="upsc">UPSC CSE</SelectItem>
                <SelectItem value="gate-cs">GATE CS</SelectItem>
                <SelectItem value="jee-main">JEE Main</SelectItem>
                <SelectItem value="neet-ug">NEET UG</SelectItem>
                <SelectItem value="ssc-cgl">SSC CGL</SelectItem>
                <SelectItem value="mpsc">State PSCs (28 States)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Volume */}
          <div>
            <label className="text-[10px] uppercase font-bold text-stone-500 dark:text-slate-400">Volume</label>
            <Select value={selectedVolume} onValueChange={setSelectedVolume}>
              <SelectTrigger className="w-full mt-1 h-8 text-xs">
                <SelectValue placeholder="All Volumes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Volumes ({allVolumes.length})</SelectItem>
                {allVolumes.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    Vol {v.volumeNumber}: {v.yearRange}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year */}
          <div>
            <label className="text-[10px] uppercase font-bold text-stone-500 dark:text-slate-400">Year (2015-2025)</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full mt-1 h-8 text-xs">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All 10 Years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div>
            <label className="text-[10px] uppercase font-bold text-stone-500 dark:text-slate-400">Subject</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full mt-1 h-8 text-xs">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-[10px] uppercase font-bold text-stone-500 dark:text-slate-400">Difficulty</label>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-full mt-1 h-8 text-xs">
                <SelectValue placeholder="All Difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div>
            <label className="text-[10px] uppercase font-bold text-stone-500 dark:text-slate-400">Keyword Search</label>
            <div className="relative mt-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Topic, concept, law..."
                className="h-8 pl-7 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: MULTI-VOLUME LIBRARY */}
      {activeTab === 'volumes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              Curated Multi-Volume Master Banks ({allVolumes.length} Volumes Available)
            </h3>
            <span className="text-xs text-stone-500 dark:text-slate-400">
              Covers 10 Years (2015 - 2025)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {allVolumes.map((vol) => (
              <Card
                key={vol.id}
                className="border-stone-200 dark:border-slate-800 dark:bg-slate-900 hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between overflow-hidden group"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800 text-[10px] font-bold">
                        {vol.examName}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-medium text-stone-600 dark:text-slate-400">
                        {vol.yearRange}
                      </Badge>
                    </div>
                    {vol.badge && (
                      <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800 text-[10px] font-semibold">
                        {vol.badge}
                      </Badge>
                    )}
                    {vol.isCustom && (
                      <Badge className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 border-purple-200 text-[10px]">
                        Custom Volume
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base font-bold text-stone-900 dark:text-white mt-2 leading-snug">
                    {vol.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-stone-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {vol.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-3 flex-1 flex flex-col justify-between">
                  {/* Stats strip */}
                  <div className="grid grid-cols-2 gap-2 bg-stone-50 dark:bg-slate-800/60 p-2 rounded-lg border border-stone-200/80 dark:border-slate-750 text-center text-xs">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground font-medium">Questions</p>
                      <p className="font-bold text-stone-800 dark:text-slate-100">{vol.totalQuestions} Qs</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground font-medium">Papers / Sets</p>
                      <p className="font-bold text-stone-800 dark:text-slate-100">{vol.papersCount} Sets</p>
                    </div>
                  </div>

                  {/* Subjects pill wrap */}
                  <div className="flex flex-wrap gap-1">
                    {vol.subjects?.map((sub) => (
                      <span
                        key={sub}
                        className="text-[10px] px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 font-medium"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-2.5 border-t border-stone-100 dark:border-slate-800 bg-stone-50/40 dark:bg-slate-850/40 grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      setSelectedVolume(vol.id);
                      setActiveTab('practice');
                    }}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-xs font-semibold h-8"
                  >
                    <BookOpen className="h-3.5 w-3.5 mr-1" /> Practice
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStartSimulation(vol)}
                    className="w-full border-blue-200 dark:border-slate-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 text-xs font-semibold h-8"
                  >
                    <Clock className="h-3.5 w-3.5 mr-1 text-blue-600 dark:text-blue-400" /> Timed Run
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PRACTICE & SOLVE MODE */}
      {activeTab === 'practice' && (
        <div className="space-y-4">
          {/* Result banner if sim score available */}
          {simScore && (
            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 dark:text-white">Simulation Completed</h4>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                      You answered {simScore.correct} correctly out of {simScore.total} questions ({Math.round((simScore.correct / simScore.total) * 100)}% Accuracy)
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setSimScore(null)} className="text-xs">
                  Dismiss
                </Button>
              </div>
            </Card>
          )}

          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">
              Showing <strong className="text-stone-900 dark:text-white">{filteredQuestions.length}</strong> previous year questions
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedAnswers({});
                  setRevealedSolutions({});
                }}
                className="h-7 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" /> Reset Answers
              </Button>
            </div>
          </div>

          {filteredQuestions.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-2 border-stone-300 dark:border-slate-800">
              <CardContent className="flex flex-col items-center gap-2">
                <FileText className="h-10 w-10 text-stone-400" />
                <h4 className="font-bold text-stone-800 dark:text-white">No questions match current filters</h4>
                <p className="text-xs text-muted-foreground">Try clearing your search query or selecting &quot;All Years / All Volumes&quot;.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q, idx) => {
                const selectedIdx = selectedAnswers[q.id];
                const isRevealed = revealedSolutions[q.id];
                const isBookmarked = bookmarkedIds.includes(q.id);
                const isCorrect = selectedIdx === q.correctAnswer;
                const hasHint = aiHints[q.id];
                const isHintLoading = loadingAiHint[q.id];

                return (
                  <Card
                    key={q.id}
                    className={cn(
                      'border-stone-200 dark:border-slate-800 dark:bg-slate-900 transition-all',
                      isRevealed && isCorrect && 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/10',
                      isRevealed && !isCorrect && 'border-rose-300 dark:border-rose-800/80 bg-rose-50/10'
                    )}
                  >
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-200 text-xs font-bold">
                            Q{idx + 1} · {q.year}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] font-semibold text-stone-700 dark:text-slate-300">
                            {q.examName}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] text-stone-600 dark:text-slate-400">
                            {q.subject} · {q.topic}
                          </Badge>
                          <Badge
                            className={cn(
                              'text-[10px] font-medium',
                              q.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              q.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                              'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            )}
                          >
                            {q.difficulty}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleBookmark(q.id)}
                            className="h-8 w-8 text-stone-400 hover:text-amber-500"
                            title="Bookmark question"
                          >
                            {isBookmarked ? (
                              <BookmarkCheck className="h-4 w-4 text-amber-500 fill-amber-500" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {q.citation && (
                        <p className="text-[11px] font-medium text-stone-500 dark:text-slate-400 mt-1">
                          Source: {q.citation} {q.historicalFrequency ? `· (${q.historicalFrequency})` : ''}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-4">
                      {/* Question Statement */}
                      <p className="text-sm font-medium text-stone-900 dark:text-white whitespace-pre-line leading-relaxed">
                        {q.question}
                      </p>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, oIdx) => {
                          const isOptionSelected = selectedIdx === oIdx;
                          const isOptionCorrect = q.correctAnswer === oIdx;

                          let stateClasses = 'border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-blue-300 dark:hover:border-slate-700';

                          if (isRevealed) {
                            if (isOptionCorrect) {
                              stateClasses = 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-400';
                            } else if (isOptionSelected) {
                              stateClasses = 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 ring-1 ring-rose-400';
                            }
                          } else if (isOptionSelected) {
                            stateClasses = 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-white ring-1 ring-blue-500 font-semibold';
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleSelectOption(q.id, oIdx)}
                              className={cn(
                                'text-left p-3 rounded-xl border text-xs transition-all flex items-start gap-2.5',
                                stateClasses
                              )}
                            >
                              <span className={cn(
                                'h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5',
                                isRevealed && isOptionCorrect ? 'bg-emerald-600 text-white' :
                                isRevealed && isOptionSelected ? 'bg-rose-600 text-white' :
                                isOptionSelected ? 'bg-blue-600 text-white' :
                                'bg-stone-100 dark:bg-slate-700 text-stone-700 dark:text-slate-300'
                              )}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="flex-1 leading-snug">{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Worked Solution & AI Hint Box */}
                      {isRevealed && (
                        <div className="bg-stone-50 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-750 p-4 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                              {isCorrect ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-rose-600" />
                              )}
                              Official Answer: {typeof q.correctAnswer === 'number' ? `Option ${String.fromCharCode(65 + q.correctAnswer)} (${q.options[q.correctAnswer] ?? ''})` : 'Provided in solution'}
                            </span>
                            <span className="text-[11px] font-medium text-stone-500 dark:text-slate-400">
                              +{q.marks ?? 1} / -{q.negativeMarks ?? 0} Marks
                            </span>
                          </div>

                          <div className="text-stone-700 dark:text-slate-200 whitespace-pre-line leading-relaxed pt-1 border-t border-stone-200/60 dark:border-slate-700">
                            <strong>Step-by-Step Worked Explanation:</strong>
                            <p className="mt-1">{q.explanation}</p>
                          </div>
                        </div>
                      )}

                      {/* AI Hint Section */}
                      {hasHint && (
                        <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-3 rounded-lg text-xs space-y-1">
                          <p className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                            <Brain className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Socratic AI Conceptual Hint
                          </p>
                          <p className="text-stone-700 dark:text-slate-300 leading-relaxed">{hasHint}</p>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="p-4 pt-0 flex items-center justify-between border-t border-stone-100 dark:border-slate-800">
                      <div className="flex items-center gap-1">
                        {!isRevealed ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRevealedSolutions((prev) => ({ ...prev, [q.id]: true }))}
                            className="text-xs h-7 text-stone-600 dark:text-slate-400 hover:text-blue-600"
                          >
                            Reveal Answer
                          </Button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="h-3 w-3" /> Answer Checked
                          </span>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAskAi(q)}
                        disabled={isHintLoading}
                        className="h-7 text-xs border-blue-200 dark:border-slate-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800"
                      >
                        <Brain className="h-3 w-3 mr-1 text-blue-600" />
                        {isHintLoading ? 'Generating Hint...' : 'Explain with AI'}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PYQArchiveView;
