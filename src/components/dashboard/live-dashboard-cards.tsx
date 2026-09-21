'use client';

import * as React from 'react';
import {
  Clock,
  Calendar,
  Timer,
  Flame,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Newspaper,
  TrendingDown,
  Target,
  Zap,
  Radar as RadarIcon,
  LifeBuoy,
  Megaphone,
  Share2,
  Lightbulb,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { getPattern } from '@/lib/exams/patterns';
import type { ExamAttempt } from '@/lib/types';

/* ------------------------------------------------------------------ */
/* Shared types                                                        */
/* ------------------------------------------------------------------ */

type Urgency = 'high' | 'medium' | 'low';

interface Recommendation {
  text: string;
  urgency: Urgency;
}

interface NewsItem {
  title: string;
  summary: string;
  source: string;          // human-readable source name (e.g. "NTA", "Vedantu")
  sourceUrl?: string;      // the actual URL the user will click (preferred over `url`)
  category: 'Official' | 'News' | 'Social Media' | 'Tips';
  date: string;
  url: string;              // alias kept for backwards compat with the API
  priority: 'urgent' | 'high' | 'normal' | 'low';
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function useCountdown(targetIso: string) {
  const [now, setNow] = React.useState<number>(() => Date.now());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const target = new Date(targetIso).getTime();
  const diff = Math.max(0, target - now);
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, totalSec, isPast: diff === 0 };
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'recently';
  const diffMs = Date.now() - d.getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.floor(day / 365);
  return `${yr}y ago`;
}

/* ------------------------------------------------------------------ */
/* 1. LiveCountdownCard                                                */
/* ------------------------------------------------------------------ */

export function LiveCountdownCard({
  examId,
  examDate,
  examName,
}: {
  examId: string;
  examDate: string;
  examName?: string;
}) {
  const setView = useStore((s) => s.setView);
  const pattern = getPattern(examId);
  const { days, hours, minutes, seconds, isPast } = useCountdown(examDate);

  const tier: 'blue' | 'amber' | 'rose' = isPast
    ? 'rose'
    : days <= 7
    ? 'rose'
    : days <= 30
    ? 'amber'
    : 'blue';

  const tierStyles = {
    blue: {
      tile: 'bg-blue-600/10 border-blue-500/30 text-blue-700 dark:text-blue-300',
      glow: 'from-blue-600/20 via-indigo-500/10 to-transparent',
      badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
      label: 'On Track',
    },
    amber: {
      tile: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
      glow: 'from-amber-500/20 via-orange-500/10 to-transparent',
      badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
      label: 'Final Stretch',
    },
    rose: {
      tile: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300',
      glow: 'from-rose-500/20 via-pink-500/10 to-transparent',
      badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
      label: isPast ? 'Exam Day' : 'Crunch Time',
    },
  };

  const ts = tierStyles[tier];

  const display = [
    { v: days, label: 'DAYS' },
    { v: hours, label: 'HOURS' },
    { v: minutes, label: 'MINS' },
    { v: seconds, label: 'SECS' },
  ];

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-white/60 dark:border-white/10 bg-gradient-to-br from-white/80 via-blue-50/40 to-white/90 dark:from-slate-900/85 dark:via-slate-800/80 dark:to-slate-950/90 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04),0_1px_3px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_12px_40px_rgba(15,76,129,0.12)]">
      {/* Glossy top highlight & glass ambient glow */}
      <div className={cn('absolute -top-16 -right-16 h-36 w-36 rounded-full blur-3xl pointer-events-none bg-gradient-to-br', ts.glow)} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent pointer-events-none" />

      <div className="relative">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Live Countdown</span>
                <span className={cn('text-[9px] font-semibold px-1.5 py-0.2 rounded-full border', ts.badge)}>
                  {ts.label}
                </span>
              </div>
              <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {examName || pattern?.name || 'Target Exam'}
              </h3>
            </div>
          </div>
          <Badge variant="outline" className="border-slate-200/80 bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-[11px] font-medium flex-shrink-0">
            {pattern ? `${Math.round(pattern.durationSec / 60)}m` : '—'}
          </Badge>
        </div>

        {/* Professional Boxed Countdown Grid — Single Clean Display (No Duplicate Counter) */}
        <div className="grid grid-cols-4 gap-2 my-2.5">
          {display.map((t, i) => (
            <div
              key={t.label}
              className={cn(
                'relative rounded-xl border p-2 text-center overflow-hidden transition-all duration-200',
                'bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-sm',
                ts.tile,
                i === 3 && 'ring-1 ring-blue-400/40'
              )}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
              <p className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white leading-none mb-1">
                {pad(t.v)}
              </p>
              <p className="text-[9px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                {t.label}
              </p>
            </div>
          ))}
        </div>

        {/* Date & Exam Info Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px]">
          <span className="text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
            <Calendar className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            {(() => {
              const d = new Date(examDate);
              return Number.isNaN(d.getTime())
                ? 'Date not set'
                : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            })()}
          </span>
          <button
            onClick={() => setView('planner')}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1 flex-shrink-0"
          >
            Planner <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* 2. WeakAreaTriggerCard                                              */
/* ------------------------------------------------------------------ */

function buildRecommendations(latest: ExamAttempt): Recommendation[] {
  const recs: Recommendation[] = [];

  const weakTopics = latest.weakTopics ?? [];
  if (weakTopics.length > 0) {
    for (const t of weakTopics.slice(0, 2)) {
      recs.push({
        text: `Drill "${t}" with 20+ targeted practice problems and revision this week.`,
        urgency: 'high',
      });
    }
  }

  const subj = [...(latest.subjectScores ?? [])].sort((a, b) => {
    const aPct = a.total > 0 ? a.scored / a.total : 0;
    const bPct = b.total > 0 ? b.scored / b.total : 0;
    return aPct - bPct;
  })[0];
  if (subj && subj.total > 0) {
    const pct = Math.round((subj.scored / subj.total) * 100);
    recs.push({
      text:
        pct < 40
          ? `"${subj.subject}" is low at ${pct}% — review key formulas and solved examples.`
          : `Lift "${subj.subject}" from ${pct}% — solve 10 mixed problems daily.`,
      urgency: pct < 40 ? 'high' : 'medium',
    });
  }

  if (typeof latest.accuracy === 'number') {
    if (latest.accuracy < 50) {
      recs.push({
        text: `Accuracy at ${latest.accuracy}% — focus on high-confidence questions first.`,
        urgency: 'high',
      });
    } else if (latest.accuracy < 70) {
      recs.push({
        text: `Accuracy at ${latest.accuracy}% — do timed topic drills before full mocks.`,
        urgency: 'medium',
      });
    } else {
      recs.push({
        text: `Accuracy at ${latest.accuracy}% is solid — boost attempt speed safely.`,
        urgency: 'low',
      });
    }
  }

  if (recs.length === 0) {
    recs.push({
      text: 'Take a mock exam to generate instant AI weak-area triggers and targeted drills.',
      urgency: 'low',
    });
  }

  return recs.slice(0, 3);
}

function urgencyBadge(u: Urgency): string {
  switch (u) {
    case 'high':
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
    case 'medium':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
    case 'low':
    default:
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
  }
}

function urgencyDot(u: Urgency): string {
  switch (u) {
    case 'high':
      return 'bg-rose-500';
    case 'medium':
      return 'bg-amber-500';
    case 'low':
    default:
      return 'bg-emerald-500';
  }
}

export function WeakAreaTriggerCard({ attempts }: { attempts: ExamAttempt[] }) {
  const setView = useStore((s) => s.setView);
  const latest = attempts?.[0];

  const recs = React.useMemo(() => (latest ? buildRecommendations(latest) : []), [latest]);
  const highCount = recs.filter((r) => r.urgency === 'high').length;

  if (!latest) {
    return (
      <Card className="relative overflow-hidden rounded-2xl border border-white/60 dark:border-white/10 bg-gradient-to-br from-white/80 via-blue-50/40 to-white/90 dark:from-slate-900/85 dark:via-slate-800/80 dark:to-slate-950/90 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 flex flex-col justify-between">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent pointer-events-none" />
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Diagnostic Radar</span>
                <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Weak Area Triggers</h3>
              </div>
            </div>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-[10px]">
              Ready
            </Badge>
          </div>
          <div className="text-center py-4 px-2 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
            <RadarIcon className="h-7 w-7 mx-auto text-blue-500/70 mb-1.5 animate-pulse" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">No mock attempts logged yet</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Take your first mock to surface blind spots.</p>
          </div>
        </div>
        <Button size="sm" className="mt-3 w-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-sm" onClick={() => setView('mock-exam')}>
          Start First Mock Exam
        </Button>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-white/60 dark:border-white/10 bg-gradient-to-br from-white/80 via-blue-50/40 to-white/90 dark:from-slate-900/85 dark:via-slate-800/80 dark:to-slate-950/90 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04),0_1px_3px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_12px_40px_rgba(15,76,129,0.12)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent pointer-events-none" />

      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
              <Zap className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">AI Triggers</span>
                {highCount > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                    {highCount} High Priority
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">Weak Area Triggers</h3>
            </div>
          </div>
          <Badge variant="outline" className="border-slate-200 bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-[11px] font-medium flex-shrink-0">
            {latest.accuracy}% acc
          </Badge>
        </div>

        {/* Compact, tightly aligned list of recommendations */}
        <div className="space-y-1.5 my-2">
          {recs.slice(0, 2).map((r, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-xl border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-800/70 p-2 text-left"
            >
              <span className={cn('mt-0.5 h-2 w-2 rounded-full flex-shrink-0', urgencyDot(r.urgency))} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">
                  {r.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px] mt-1">
        <button
          onClick={() => setView('weakness-radar')}
          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
        >
          Weakness Radar <ChevronRight className="h-3 w-3" />
        </button>
        <button
          onClick={() => setView('mentor')}
          className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium inline-flex items-center gap-1"
        >
          Ask AI Mentor <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* 3. ExamNewsFeed                                                     */
/* ------------------------------------------------------------------ */

function categoryStyle(cat: NewsItem['category']): { badge: string; icon: React.ReactNode } {
  switch (cat) {
    case 'Official':
      return {
        badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
        icon: <Megaphone className="h-2.5 w-2.5" />,
      };
    case 'News':
      return {
        badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
        icon: <Newspaper className="h-2.5 w-2.5" />,
      };
    case 'Social Media':
      return {
        badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
        icon: <Share2 className="h-2.5 w-2.5" />,
      };
    case 'Tips':
    default:
      return {
        badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
        icon: <Lightbulb className="h-2.5 w-2.5" />,
      };
  }
}

function priorityTag(priority: NewsItem['priority']): { tag: string; cls: string } | null {
  if (priority === 'urgent') {
    return { tag: 'URGENT', cls: 'bg-rose-600 text-white' };
  }
  if (priority === 'high') {
    return { tag: 'HOT', cls: 'bg-amber-500 text-white' };
  }
  return null;
}

export function ExamNewsFeed({
  examId,
  examName,
  country,
}: {
  examId: string;
  examName?: string;
  country?: string;
}) {
  const [items, setItems] = React.useState<NewsItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<'web' | 'ai' | 'fallback' | null>(null);
  const [refreshKey, setRefreshKey] = React.useState<number>(0);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const abortRef = React.useRef<AbortController | null>(null);

  const displayName = examName || getPattern(examId)?.name || examId;

  React.useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch('/api/exam-news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examId, examName: displayName, country }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }
        const data = await res.json();
        const parsed: NewsItem[] = Array.isArray(data?.items) ? data.items : [];
        setItems(parsed);
        setSource(data?.source === 'web' ? 'web' : data?.source === 'ai' ? 'ai' : 'fallback');
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setError((e as Error).message || 'Failed to load news');
        setItems([]);
        setSource(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    })();

    return () => ctrl.abort();
  }, [examId, displayName, country, refreshKey]);

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
  };

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-white/60 dark:border-white/10 bg-gradient-to-br from-white/80 via-blue-50/40 to-white/90 dark:from-slate-900/85 dark:via-slate-800/80 dark:to-slate-950/90 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04),0_1px_3px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_12px_40px_rgba(15,76,129,0.12)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent pointer-events-none" />

      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
              <Newspaper className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Live Updates</span>
                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                  {displayName}
                </span>
              </div>
              <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">Exam News Feed</h3>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            title="Refresh news feed"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', (loading || refreshing) && 'animate-spin')} />
          </Button>
        </div>

        {/* Compact scroll area for news items */}
        <ScrollArea className="max-h-[140px] pr-1.5 -mr-1.5">
          {error ? (
            <div className="rounded-xl border border-rose-200/60 bg-rose-50/60 p-2.5 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Unable to fetch live feed.</span>
            </div>
          ) : loading ? (
            <div className="space-y-1.5">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No updates available currently.</p>
          ) : (
            <div className="space-y-1.5">
              {items.slice(0, 3).map((item, i) => {
                const cat = categoryStyle(item.category);
                const prio = priorityTag(item.priority);
                const clickUrl = item.sourceUrl || item.url;
                return (
                  <a
                    key={`${i}-${item.title.slice(0, 20)}`}
                    href={clickUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-800/70 p-2 hover:border-blue-400/50 hover:bg-blue-50/30 dark:hover:bg-slate-800/90 transition group text-left"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold border', cat.badge)}>
                        {cat.icon}
                        {item.category}
                      </span>
                      {prio && (
                        <span className={cn('inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold', prio.cls)}>
                          {prio.tag}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 ml-auto flex items-center gap-0.5">
                        {item.source || 'Web'} <ExternalLink className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100" />
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {item.title}
                    </p>
                  </a>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px] mt-1">
        <span className="text-slate-400 text-[10px]">Real-time NTA & Education Updates</span>
        <button
          onClick={handleRefresh}
          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
        >
          Latest Feed <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </Card>
  );
}

