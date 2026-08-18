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
  source: string;
  category: 'Official' | 'News' | 'Social Media' | 'Tips';
  date: string;
  url: string;
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

  // Color tiers per spec: blue >30d, amber <30d, rose <7d.
  const tier: 'blue' | 'amber' | 'rose' = isPast
    ? 'rose'
    : days <= 7
    ? 'rose'
    : days <= 30
    ? 'amber'
    : 'blue';

  const tierStyles: Record<'blue' | 'amber' | 'rose', { tile: string; text: string; ring: string; label: string }> = {
    blue: {
      tile: 'bg-blue-50 border-blue-200',
      text: 'text-blue-700',
      ring: 'ring-blue-300',
      label: 'Plenty of time',
    },
    amber: {
      tile: 'bg-amber-50 border-amber-200',
      text: 'text-amber-700',
      ring: 'ring-amber-300',
      label: 'Final stretch',
    },
    rose: {
      tile: 'bg-rose-50 border-rose-200',
      text: 'text-rose-700',
      ring: 'ring-rose-300',
      label: isPast ? 'Exam day has arrived' : 'Crunch time',
    },
  };

  const ts = tierStyles[tier];

  const display = [
    { v: days, label: 'DAYS' },
    { v: hours, label: 'HRS' },
    { v: minutes, label: 'MIN' },
    { v: seconds, label: 'SEC' },
  ];

  return (
    <Card className="p-5 border-blue-200 bg-gradient-to-br from-blue-50 to-white relative overflow-hidden">
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-blue-100/60 blur-2xl" />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Live Countdown
            </p>
            <h3 className="text-lg font-bold text-stone-900 mt-0.5">
              {examName || pattern?.name || 'Target Exam'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {(() => {
                const d = new Date(examDate);
                return Number.isNaN(d.getTime())
                  ? 'Set your exam date to begin the countdown'
                  : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
              })()}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={cn('bg-white border', ts.tile, ts.text)}>
              {pattern ? `${Math.round(pattern.durationSec / 60)} min` : '—'}
            </Badge>
            <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full bg-white border', ts.tile, ts.text)}>
              {ts.label}
            </span>
          </div>
        </div>

        {/* Ticking countdown */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {display.map((t, i) => (
            <div
              key={t.label}
              className={cn(
                'rounded-lg border p-2.5 text-center tabular-nums',
                ts.tile,
                ts.text,
                i === 3 && 'animate-pulse'
              )}
            >
              <p className={cn('text-2xl font-bold tabular-nums', ts.text)}>
                {pad(t.v)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t.label}</p>
            </div>
          ))}
        </div>

        {/* Colon-separated readout */}
        <div className={cn('text-center font-mono text-sm tabular-nums mb-3', ts.text)}>
          {pad(days)} : {pad(hours)} : {pad(minutes)} : {pad(seconds)}
        </div>

        {/* Pattern info chips */}
        <div className="flex flex-wrap items-center gap-2">
          {pattern && (
            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
              <Target className="h-3 w-3" /> {pattern.totalQuestions} Qs
            </Badge>
          )}
          {pattern && (
            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
              <Timer className="h-3 w-3" /> {pattern.totalMarks} marks
            </Badge>
          )}
          {pattern && (
            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
              <Flame className="h-3 w-3" /> {pattern.marking}
            </Badge>
          )}
          <button
            onClick={() => setView('planner')}
            className="ml-auto text-[11px] font-medium text-blue-700 hover:text-blue-800 inline-flex items-center gap-1"
          >
            <Calendar className="h-3 w-3" /> Open planner
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

  // Weak topics -> high urgency drill recommendations.
  const weakTopics = latest.weakTopics ?? [];
  if (weakTopics.length > 0) {
    for (const t of weakTopics.slice(0, 2)) {
      recs.push({
        text: `Drill "${t}" with 20+ targeted practice problems and one full concept revision this week.`,
        urgency: 'high',
      });
    }
  }

  // Lowest-scoring subject -> high or medium based on margin.
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
          ? `"${subj.subject}" is critically low at ${pct}% — schedule a deep-review session before the next mock.`
          : `Lift "${subj.subject}" from ${pct}% — practise 15 mixed-difficulty problems daily.`,
      urgency: pct < 40 ? 'high' : 'medium',
    });
  }

  // Accuracy guardrail.
  if (typeof latest.accuracy === 'number') {
    if (latest.accuracy < 50) {
      recs.push({
        text: `Accuracy at ${latest.accuracy}% is hurting your score. Switch to "accuracy-first" mode: attempt only questions you are 70%+ sure about.`,
        urgency: 'high',
      });
    } else if (latest.accuracy < 70) {
      recs.push({
        text: `Accuracy at ${latest.accuracy}% can be improved with timed drills (45s/question) before adding volume.`,
        urgency: 'medium',
      });
    } else {
      recs.push({
        text: `Accuracy at ${latest.accuracy}% is solid — push attempt volume next mock to raise your ceiling.`,
        urgency: 'low',
      });
    }
  }

  // Behaviour signals.
  const b = latest.behavior;
  if (b) {
    if (b.rapidGuesses > 5) {
      recs.push({
        text: `${b.rapidGuesses} rapid guesses (<10s each) detected. Slow down — read every stem fully before locking an answer.`,
        urgency: 'high',
      });
    }
    if (b.paceTrend === 'slowing-down') {
      recs.push({
        text: 'Your pace slowed toward the end of the paper. Build stamina with back-to-back timed sections.',
        urgency: 'medium',
      });
    } else if (b.paceTrend === 'speeding-up') {
      recs.push({
        text: 'You rushed early then recovered. Spend the first 2 minutes scanning the paper to pace calmly.',
        urgency: 'medium',
      });
    }
    if (b.idleTimeSec > 300) {
      recs.push({
        text: `${Math.round(b.idleTimeSec / 60)} min of idle time logged. Use the question palette to skip and revisit, don\'t freeze on any one item.`,
        urgency: 'medium',
      });
    }
    if (b.vsPrevious && !b.vsPrevious.isImprovement) {
      recs.push({
        text: `You slipped ${Math.abs(b.vsPrevious.scoreDelta)} pts vs your previous attempt. Revisit your last 7 days of prep and remove one distraction.`,
        urgency: 'high',
      });
    } else if (b.vsPrevious && b.vsPrevious.isImprovement) {
      recs.push({
        text: 'You improved on the last attempt — keep the same routine and increment difficulty, not hours.',
        urgency: 'low',
      });
    }
  }

  // Fallback when nothing meaningful surfaced.
  if (recs.length === 0) {
    recs.push({
      text: 'Take a full-length mock to surface your weak areas — the radar needs at least one attempt to work with.',
      urgency: 'low',
    });
  }

  return recs.slice(0, 5);
}

function urgencyBadge(u: Urgency): string {
  switch (u) {
    case 'high':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'low':
    default:
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
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
      <Card className="p-5 border-blue-200 bg-gradient-to-br from-blue-50 to-white h-full">
        <div className="flex items-center gap-1.5 mb-3">
          <Zap className="h-4 w-4 text-blue-600" />
          <h3 className="font-semibold text-stone-900">Weak Area Triggers</h3>
        </div>
        <div className="text-center py-6">
          <RadarIcon className="h-8 w-8 mx-auto text-blue-200 mb-2" />
          <p className="text-sm text-muted-foreground">
            Take a mock exam to unlock personalised weak-area recommendations.
          </p>
          <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700" onClick={() => setView('mock-exam')}>
            Start first mock
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 border-blue-200 bg-gradient-to-br from-blue-50 to-white h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-blue-600" />
          <h3 className="font-semibold text-stone-900">Weak Area Triggers</h3>
        </div>
        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
          <TrendingDown className="h-3 w-3" /> {highCount} high priority
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        From your latest attempt · {latest.examName} · {latest.accuracy}% accuracy
      </p>

      <ol className="space-y-2">
        {recs.map((r, i) => (
          <li
            key={i}
            className="flex items-start gap-2 rounded-lg border border-blue-100 bg-white p-2.5"
          >
            <span className="flex-shrink-0 h-6 w-6 rounded-md bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase border',
                    urgencyBadge(r.urgency)
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', urgencyDot(r.urgency))} />
                  {r.urgency}
                </span>
              </div>
              <p className="text-sm text-stone-800 leading-snug">{r.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2 mt-4">
        <Button
          size="sm"
          variant="default"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setView('weakness-radar')}
        >
          <RadarIcon className="h-3.5 w-3.5" /> View radar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-blue-300 text-blue-700 hover:bg-blue-50"
          onClick={() => setView('mentor')}
        >
          <LifeBuoy className="h-3.5 w-3.5" /> Get help
        </Button>
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
        badge: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: <Megaphone className="h-3 w-3" />,
      };
    case 'News':
      return {
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: <Newspaper className="h-3 w-3" />,
      };
    case 'Social Media':
      return {
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: <Share2 className="h-3 w-3" />,
      };
    case 'Tips':
    default:
      return {
        badge: 'bg-teal-100 text-teal-700 border-teal-200',
        icon: <Lightbulb className="h-3 w-3" />,
      };
  }
}

function priorityTag(priority: NewsItem['priority']): { tag: string; cls: string } | null {
  if (priority === 'urgent') {
    return { tag: 'URGENT', cls: 'bg-rose-600 text-white' };
  }
  if (priority === 'high') {
    return { tag: 'HIGH', cls: 'bg-amber-500 text-white' };
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
  const [source, setSource] = React.useState<'ai' | 'fallback' | null>(null);
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
        setSource(data?.source === 'ai' ? 'ai' : 'fallback');
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
    <Card className="p-5 border-blue-200 bg-gradient-to-br from-blue-50 to-white h-full flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <Newspaper className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-stone-900">Exam News Feed</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Latest updates for {displayName}
            {source && (
              <span className="ml-1 text-[10px] uppercase tracking-wider text-blue-500">
                · {source === 'ai' ? 'AI-curated' : 'curated feed'}
              </span>
            )}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-blue-300 text-blue-700 hover:bg-blue-50"
          onClick={handleRefresh}
          disabled={loading || refreshing}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', (loading || refreshing) && 'animate-spin')} />
          {loading || refreshing ? 'Loading' : 'Refresh'}
        </Button>
      </div>

      {/* Scrollable news list */}
      <ScrollArea className="flex-1 min-h-0 max-h-[460px] -mx-1 px-1">
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Couldn&apos;t load news</p>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 border-rose-300 text-rose-700 hover:bg-rose-50"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-blue-100 bg-white p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12 ml-auto" />
                </div>
                <Skeleton className="h-4 w-11/12 mb-1.5" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-blue-100 bg-white p-6 text-center">
            <Newspaper className="h-8 w-8 mx-auto text-blue-200 mb-2" />
            <p className="text-sm text-muted-foreground">No news items available right now.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item, i) => {
              const cat = categoryStyle(item.category);
              const prio = priorityTag(item.priority);
              return (
                <li key={`${i}-${item.title.slice(0, 24)}`}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-blue-100 bg-white p-3 hover:border-blue-300 hover:shadow-sm transition group"
                  >
                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border',
                          cat.badge
                        )}
                      >
                        {cat.icon}
                        {item.category}
                      </span>
                      {prio && (
                        <span
                          className={cn(
                            'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide',
                            prio.cls
                          )}
                        >
                          {prio.tag}
                        </span>
                      )}
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {relativeDate(item.date)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-stone-900 leading-snug group-hover:text-blue-700 transition">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {item.summary}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-blue-600 font-medium">{item.source}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 group-hover:underline">
                        Read more <ExternalLink className="h-3 w-3" />
                      </span>
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </Card>
  );
}
