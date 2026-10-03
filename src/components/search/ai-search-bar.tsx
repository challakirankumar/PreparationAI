'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover, PopoverTrigger, PopoverContent,
} from '@/components/ui/popover';
import { useStore } from '@/lib/store';
import { getPattern } from '@/lib/exams/patterns';
import { cn } from '@/lib/utils';
import {
  Search, Loader2, Sparkles, ExternalLink, Megaphone, Video,
  FileText, PencilRuler, MessageCircle, AlertCircle, X,
  GraduationCap, ArrowRight,
} from 'lucide-react';

// ============================================================================
// AISearchBar — AI-powered educational search in the topbar
// ----------------------------------------------------------------------------
// BEHAVIOR:
//   1. User types a query → NO auto-search fires.
//   2. User presses Enter or clicks the "Search" button → search fires.
//   3. Before the user types anything, exam-aware suggestions appear based
//      on the user's target exam (from the Zustand store).
//   4. Each suggestion is clickable → auto-fills + searches immediately.
//
// BACKEND: /api/semantic-search uses GLM-4.6 to expand the query into
// 4 semantic variations, runs real web_search on each, classifies + ranks
// results, and returns an AI summary + 10 clickable source URLs.
// Every result has a REAL URL — no fake/dummy data.
// ============================================================================

interface SearchHit {
  title: string;
  snippet: string;
  url: string;
  host: string;
  sourceName: string;
  category: 'Official' | 'Video' | 'Article' | 'Practice' | 'Forum';
  date: string;
  relevance: number;
}

interface SearchResponse {
  query: string;
  expandedQueries: string[];
  aiSummary: string;
  hits: SearchHit[];
  source: 'web' | 'fallback';
  error?: string;
}

const CATEGORY_META: Record<SearchHit['category'], {
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  Official: { badge: 'bg-blue-100 text-blue-700 border-blue-200', icon: Megaphone },
  Video:    { badge: 'bg-rose-100 text-rose-700 border-rose-200', icon: Video },
  Article:  { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: FileText },
  Practice: { badge: 'bg-amber-100 text-amber-700 border-amber-200', icon: PencilRuler },
  Forum:    { badge: 'bg-slate-100 text-slate-700 border-slate-200', icon: MessageCircle },
};

// ============================================================================
// Exam-aware suggestions — dynamically built from the user's target exam
// ============================================================================
function buildExamAwareSuggestions(examGoal: string | undefined): string[] {
  if (!examGoal) {
    return [
      'Best books for competitive exam preparation',
      'How to improve study focus and concentration',
      'Time management strategy for exams',
      'Previous year question papers with solutions',
      'How to deal with exam anxiety',
    ];
  }
  const pattern = getPattern(examGoal);
  const examName = pattern?.name ?? examGoal.toUpperCase();
  const subjects = pattern?.sections?.map(s => s.name) ?? [];

  const suggestions: string[] = [];
  // Best books for the first subject
  if (subjects.length > 0) {
    suggestions.push(`Best books for ${examName} ${subjects[0]}`);
  } else {
    suggestions.push(`Best books for ${examName}`);
  }
  // Previous year papers
  suggestions.push(`${examName} previous year question papers with solutions`);
  // Syllabus + important topics
  suggestions.push(`${examName} syllabus and important topics to focus on`);
  // Study strategy
  suggestions.push(`Study strategy and time management for ${examName}`);
  // Mock test practice
  suggestions.push(`${examName} mock test practice — free online resources`);
  // Subject-specific shortcut if multiple subjects
  if (subjects.length > 1) {
    suggestions.push(`${examName} ${subjects[1]} — shortcuts and tricks`);
  }
  return suggestions.slice(0, 6);
}

export function AISearchBar() {
  const user = useStore((s) => s.user);
  const examGoal = user?.examGoal;
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<SearchResponse | null>(null);
  const [hasSearched, setHasSearched] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Build exam-aware suggestions
  const suggestions = React.useMemo(() => buildExamAwareSuggestions(examGoal), [examGoal]);
  const exam = examGoal || '';
  const country = user?.country || '';

  // ===== SEARCH: only fires on Enter or button click — NOT on every keystroke =====
  async function runSearch(q: string) {
    const trimmed = q.trim();
    if (trimmed.length < 3) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setOpen(true);
    setHasSearched(true);
    setResult(null);

    try {
      const resp = await fetch('/api/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, exam, country, num: 4 }),
        signal: ctrl.signal,
      });
      const data = await resp.json();
      if (!ctrl.signal.aborted) {
        setResult(data as SearchResponse);
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setResult({
        query: trimmed,
        expandedQueries: [],
        aiSummary: '',
        hits: [],
        source: 'fallback',
        error: (e as Error).message,
      });
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      runSearch(query);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function handleSuggestion(s: string) {
    setQuery(s);
    runSearch(s);
  }

  function clear() {
    setQuery('');
    setResult(null);
    setOpen(false);
    setHasSearched(false);
    inputRef.current?.focus();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-[260px] lg:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            placeholder="Search study material, concepts, videos…"
            className="pl-9 pr-20 bg-white/70 backdrop-blur-sm border-stone-200 focus-visible:ring-blue-300 h-9 text-sm font-medium"
            aria-label="AI semantic search"
          />
          {/* Search button — visible on the right side of the input */}
          <button
            onClick={() => runSearch(query)}
            disabled={loading || query.trim().length < 3}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 px-2.5 rounded-md bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-semibold flex items-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Search"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
            <span className="hidden sm:inline">Search</span>
          </button>
          {query && !loading && (
            <button
              onClick={clear}
              className="absolute right-[68px] top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              aria-label="Clear"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[520px] max-w-[92vw] p-0 max-h-[520px] flex flex-col"
      >
        {/* Header — Royal Blue Gradient */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-blue-900/20 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-white/15 backdrop-blur ring-1 ring-white/25 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight text-white">AI Semantic Search</p>
              <p className="text-[10px] text-blue-100/80">
                {loading ? 'Searching the web…' : result ? `${result.hits.length} results` : 'Press Enter to search'}
              </p>
            </div>
          </div>
          {result?.expandedQueries && result.expandedQueries.length > 0 && (
            <Badge variant="outline" className="text-[9px] border-white/30 text-blue-100 bg-white/10">
              {result.expandedQueries.length} query angles
            </Badge>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scroll-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-3" />
              <p className="text-xs text-muted-foreground">
                Expanding your query and searching the web…
              </p>
            </div>
          ) : result?.error ? (
            <div className="px-4 py-8 text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-rose-400 mb-2" />
              <p className="text-sm font-medium text-stone-700">Search failed</p>
              <p className="text-[11px] text-muted-foreground mt-1">{result.error}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => runSearch(query)}>Try again</Button>
            </div>
          ) : !hasSearched ? (
            // ===== Exam-aware suggestions screen =====
            <div className="p-4">
              {examGoal && (
                <div className="mb-3 p-3 rounded-lg bg-blue-50/60 border border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-6 w-6 rounded-md bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center">
                      <GraduationCap className="h-3 w-3 text-white" />
                    </div>
                    <p className="text-xs font-semibold text-blue-900">
                      Personalized for your target exam
                    </p>
                  </div>
                  <p className="text-[11px] text-blue-700">
                    You're preparing for <span className="font-semibold">{getPattern(examGoal)?.name ?? examGoal}</span> — here are some searches that might help:
                  </p>
                </div>
              )}
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2 px-1">
                Try searching for
              </p>
              <div className="space-y-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm text-stone-700 hover:text-blue-900 flex items-center gap-2 group"
                  >
                    <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                    <span className="flex-1">{s}</span>
                    <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-blue-600 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : !result || result.hits.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Search className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-stone-700">No results found</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Try rephrasing your query or being more specific.
              </p>
            </div>
          ) : (
            <>
              {/* AI summary */}
              {result.aiSummary && (
                <div className="m-3 rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI Answer
                  </p>
                  <p className="text-xs text-stone-800 leading-relaxed">{result.aiSummary}</p>
                </div>
              )}

              {/* Results list */}
              <ul className="divide-y divide-stone-100">
                {result.hits.map((hit, i) => {
                  const meta = CATEGORY_META[hit.category];
                  const Icon = meta.icon;
                  return (
                    <li key={`${i}-${hit.url}`}>
                      <a
                        href={hit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2.5 hover:bg-blue-50/40 transition group"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={cn(
                            'h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5',
                            meta.badge,
                          )}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                                {hit.category}
                              </span>
                              {hit.relevance > 0.6 && (
                                <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1 py-0.5 rounded">
                                  Best match
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-stone-900 leading-snug group-hover:text-blue-700 transition line-clamp-2">
                              {hit.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                              {hit.snippet}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(hit.host)}&sz=32`}
                                alt=""
                                className="h-3 w-3 rounded-sm"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                              />
                              <span className="text-[10px] text-blue-700 font-medium truncate">
                                {hit.sourceName} · {hit.host}
                              </span>
                              <ExternalLink className="h-3 w-3 text-blue-700 ml-auto flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-100 px-3 py-2 flex items-center justify-between flex-shrink-0 bg-stone-50/40">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" />
            Real-time web search · GLM-4.6 + z-ai SDK
          </p>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
