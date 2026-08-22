'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover, PopoverTrigger, PopoverContent,
} from '@/components/ui/popover';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  Search, Loader2, Sparkles, ExternalLink, Megaphone, Video,
  FileText, PencilRuler, MessageCircle, AlertCircle, X,
} from 'lucide-react';

// ============================================================================
// AISearchBar — topbar search bar with AI-powered semantic search.
// ----------------------------------------------------------------------------
// When the user types and hits Enter (or stops typing for 600ms), we call
// /api/semantic-search which:
//   1. Uses GLM-4.6 to expand the query into 4 semantic variations
//   2. Runs real web_search on each variation in parallel
//   3. Classifies + ranks the results
//   4. Returns an AI summary + 10 clickable source URLs
//
// The popover shows the AI summary at the top, then the categorized list of
// results. Clicking any result opens the real source URL in a new tab.
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

export function AISearchBar() {
  const user = useStore((s) => s.user);
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<SearchResponse | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const exam = user?.examGoal || '';
  const country = user?.country || '';

  async function runSearch(q: string) {
    if (q.trim().length < 2) {
      setOpen(false);
      setResult(null);
      return;
    }
    // Cancel any in-flight request
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setOpen(true);
    try {
      const resp = await fetch('/api/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, exam, country, num: 4 }),
        signal: ctrl.signal,
      });
      const data = await resp.json();
      if (!ctrl.signal.aborted) {
        setResult(data as SearchResponse);
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setResult({
        query: q,
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

  function handleChange(v: string) {
    setQuery(v);
    // Debounce — wait 600ms after the user stops typing before searching.
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(v);
    }, 600);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      runSearch(query);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function clear() {
    setQuery('');
    setResult(null);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative flex-1 max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (query.trim().length >= 2) setOpen(true); }}
            placeholder="Search study material, concepts, videos…"
            className="pl-9 pr-9 bg-white/70 backdrop-blur-sm border-stone-200 focus-visible:ring-blue-300"
            aria-label="AI semantic search"
          />
          {query && (
            <button
              onClick={clear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {/* Tiny "AI" indicator on the left of the input */}
          <span className="absolute right-9 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider text-blue-600 pointer-events-none">
            AI
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[520px] max-w-[92vw] p-0 max-h-[520px] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 bg-gradient-to-r from-white to-blue-50/30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-blue-700 text-white flex items-center justify-center">
              <Sparkles className="h-3 w-3" />
            </div>
            <div>
              <p className="text-xs font-semibold leading-tight">AI Semantic Search</p>
              <p className="text-[10px] text-muted-foreground">
                {loading ? 'Searching the web…' : `${result?.hits.length ?? 0} results`}
              </p>
            </div>
          </div>
          {result?.expandedQueries && result.expandedQueries.length > 0 && (
            <Badge variant="outline" className="text-[9px] border-blue-200 text-blue-700 bg-blue-50">
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
            </div>
          ) : !result || result.hits.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Search className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-stone-700">No results found</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Try rephrasing your query or be more specific.
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
          <p className="text-[10px] text-muted-foreground">
            Real-time web search via GLM-4.6 + z-ai SDK
          </p>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
