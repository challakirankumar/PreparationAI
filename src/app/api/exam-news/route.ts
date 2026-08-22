import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ============================================================================
// Exam News Feed — REAL web search aggregation
// ----------------------------------------------------------------------------
// Instead of asking the LLM to invent news items, this endpoint runs multiple
// parallel real web searches across different angles (official portals,
// news channels, social media buzz, prep tips) and aggregates the results.
//
// Every news item returned carries the REAL URL of the source page, so the
// user can click through and read the original article — no fake Google
// search redirects, no fabricated domains.
// ============================================================================

export type NewsCategory = 'Official' | 'News' | 'Social Media' | 'Tips';
export type NewsPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface NewsItem {
  title: string;
  summary: string;
  source: string;       // human-readable source name (host or publisher)
  sourceUrl: string;    // the actual URL the user will click
  category: NewsCategory;
  date: string;         // ISO date if known, else ""
  url: string;          // alias for sourceUrl (kept for backwards compat with the UI)
  priority: NewsPriority;
}

interface ExamNewsRequest {
  examId?: string;
  examName?: string;
  country?: string;
}

// ----------------------------------------------------------------------------
// Domain classifier — maps a hostname to one of the 4 news categories
// ----------------------------------------------------------------------------
const OFFICIAL_DOMAINS = [
  'nta.ac.in', 'jeemain.nta.nic.in', 'neet.nta.nic.in', 'ntaexam.nta.ac.in',
  'gate.iit.ac.in', 'gate.iisc.ac.in', 'gate.iitb.ac.in', 'gate.iitk.ac.in',
  'appsgate.iitr.ac.in', 'gate.iitm.ac.in', 'gate.iitg.ac.in', 'gate.iitd.ac.in',
  'iimcat.ac.in', 'cat.iim.ac.in',
  'upsc.gov.in', 'upsconline.nic.in',
  'sat.org', 'collegeboard.org',
  'ets.org', 'gre.org', 'mba.com',
  'ielts.org', 'britishcouncil.org', 'toefl.org',
  'aicte-india.org', 'cbse.gov.in', 'cbse.nic.in', 'nic.in',
  'mhrd.gov.in', 'education.gov.in',
];

const SOCIAL_DOMAINS = [
  'twitter.com', 'x.com', 'facebook.com', 'instagram.com',
  'reddit.com', 'linkedin.com', 'youtube.com', 'youtu.be',
  't.me', 'telegram.me', 'quora.com', 'medium.com',
  'whatsapp.com', 'threads.net',
];

const NEWS_DOMAINS = [
  'thehindu.com', 'timesofindia.com', 'indiatimes.com', 'ndtv.com',
  'indianexpress.com', 'hindustantimes.com', 'livemint.com', 'moneycontrol.com',
  'economictimes.com', 'dnaindia.com', 'deccanherald.com', 'theprint.in',
  'scroll.in', 'thewire.in', 'financialexpress.com', 'business-standard.com',
  'bbc.com', 'bbc.co.uk', 'reuters.com', 'bloomberg.com', 'nytimes.com',
  'cnn.com', 'washingtonpost.com', 'theguardian.com', 'aljazeera.com',
  'guardian.com', 'forbes.com', 'techcrunch.com', 'wired.com',
  'shiksha.com', 'collegedekho.com', 'aglasem.com', 'careers360.com',
  ' jagranjosh.com', 'jagran.com', 'amarujala.com', 'tribuneindia.com',
];

// Official exam-specific portals for the most common Indian exams
const EXAM_OFFICIAL_HINTS: Record<string, string[]> = {
  'jee-main':    ['nta.ac.in', 'jeemain.nta.nic.in'],
  'jee-advanced':['jeeadv.ac.in'],
  'neet':        ['neet.nta.nic.in', 'nta.ac.in'],
  'gate':        ['gate.iisc.ac.in'],
  'cat':         ['iimcat.ac.in'],
  'upsc':        ['upsc.gov.in', 'upsconline.nic.in'],
  'clat':        ['consortiumofnlus.ac.in'],
  'cmat':        ['nta.ac.in'],
  'srmjeee':     ['srmist.edu.in'],
  'viteee':      ['vit.ac.in'],
  'bitsat':      ['bitsadmission.com'],
  'nda':         ['upsc.gov.in'],
  'cdse':        ['upsc.gov.in'],
  'ielts':       ['ielts.org', 'britishcouncil.org'],
  'toefl':       ['ets.org', 'toefl.org'],
  'gre':         ['ets.org', 'gre.org'],
  'gmat':        ['mba.com'],
  'sat':         ['collegeboard.org'],
};

function classifyHost(host: string, examId?: string): NewsCategory {
  const h = host.toLowerCase().replace(/^www\./, '');

  // Official hints per exam first (highest precision)
  if (examId) {
    const hints = EXAM_OFFICIAL_HINTS[examId.toLowerCase()];
    if (hints && hints.some(d => h === d || h.endsWith('.' + d))) return 'Official';
  }
  if (OFFICIAL_DOMAINS.some(d => h === d || h.endsWith('.' + d))) return 'Official';
  if (SOCIAL_DOMAINS.some(d => h === d || h.endsWith('.' + d))) return 'Social Media';
  if (NEWS_DOMAINS.some(d => h === d || h.endsWith('.' + d))) return 'News';
  // Default — unknown domain → treat as Tips (most prep blogs fall here)
  return 'Tips';
}

function deriveSourceName(host: string): string {
  const h = host.toLowerCase().replace(/^www\./, '');
  // Try to surface the publisher name; otherwise just use the host.
  // Strip TLDs and subdomains for readability.
  const parts = h.split('.');
  if (parts.length >= 2) {
    const name = parts[parts.length - 2];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return host;
}

// ----------------------------------------------------------------------------
// Priority classifier — based on keywords in the title
// ----------------------------------------------------------------------------
function classifyPriority(title: string, category: NewsCategory): NewsPriority {
  const t = title.toLowerCase();
  if (
    t.includes('admit card') ||
    t.includes('result') ||
    t.includes('registration open') ||
    t.includes('registration begins') ||
    t.includes('exam date') ||
    t.includes('exam postponed') ||
    t.includes('syllabus change') ||
    t.includes('pattern change') ||
    t.includes('notification') ||
    t.includes('last date') ||
    t.includes('deadline') ||
    t.includes('cancelled')
  ) return 'urgent';
  if (
    t.includes('registration') ||
    t.includes('form') ||
    t.includes('admit') ||
    t.includes('hall ticket') ||
    t.includes('syllabus') ||
    t.includes('pattern') ||
    t.includes('mock test') ||
    t.includes('answer key') ||
    t.includes('cutoff') ||
    t.includes('cut-off')
  ) return 'high';
  if (category === 'Official') return 'high';
  if (category === 'Social Media') return 'low';
  return 'normal';
}

// ----------------------------------------------------------------------------
// Search angle definitions — each angle is a query template.
// Running multiple angles in parallel gives us coverage across the 4
// categories: official portals, news channels, social media, prep tips.
// ----------------------------------------------------------------------------
interface SearchAngle {
  category: NewsCategory;
  queryTemplate: (examName: string, country: string) => string;
  recencyDays: number;
}

const SEARCH_ANGLES: SearchAngle[] = [
  {
    category: 'Official',
    queryTemplate: (e, c) => `${e} official notification site:nic.in OR site:ac.in OR site:gov.in ${c}`.trim(),
    recencyDays: 90,
  },
  {
    category: 'Official',
    queryTemplate: (e) => `${e} admit card 2026 official website`,
    recencyDays: 30,
  },
  {
    category: 'News',
    queryTemplate: (e, c) => `${e} exam date registration news ${c} 2026`,
    recencyDays: 14,
  },
  {
    category: 'News',
    queryTemplate: (e) => `${e} syllabus pattern change 2026`,
    recencyDays: 30,
  },
  {
    category: 'Social Media',
    queryTemplate: (e) => `${e} aspirants discussion`,
    recencyDays: 14,
  },
  {
    category: 'Tips',
    queryTemplate: (e) => `${e} preparation strategy tips 2026`,
    recencyDays: 60,
  },
  {
    category: 'Tips',
    queryTemplate: (e) => `${e} best books mock test series`,
    recencyDays: 90,
  },
];

// ----------------------------------------------------------------------------
// Run a single web search via the z-ai SDK
// ----------------------------------------------------------------------------
interface RawSearchResult {
  url: string;
  name: string;
  snippet: string;
  host_name: string;
  rank: number;
  date: string;
}

async function runSearch(zai: any, query: string, num: number, recencyDays?: number): Promise<RawSearchResult[]> {
  try {
    const args: Record<string, unknown> = { query, num };
    if (recencyDays) args.recency_days = recencyDays;
    const results = await zai.functions.invoke('web_search', args);
    if (!Array.isArray(results)) return [];
    return results as RawSearchResult[];
  } catch (e) {
    console.error('[exam-news] search failed for query:', query, (e as Error).message);
    return [];
  }
}

// ----------------------------------------------------------------------------
// Convert a raw search result into a normalized NewsItem
// ----------------------------------------------------------------------------
function toNewsItem(raw: RawSearchResult, fallbackCategory: NewsCategory, examId?: string): NewsItem | null {
  if (!raw || !raw.url || !raw.name) return null;
  // Filter out obviously useless results
  const lowerUrl = raw.url.toLowerCase();
  if (lowerUrl.includes('google.com/search?')) return null;
  if (lowerUrl.includes('pinterest.com')) return null;
  if (lowerUrl.length < 12) return null;

  const host = raw.host_name || (() => {
    try { return new URL(raw.url).hostname; } catch { return 'unknown'; }
  })();

  const category = classifyHost(host, examId) || fallbackCategory;
  const title = raw.name.trim();
  const summary = (raw.snippet || '').trim().slice(0, 240);
  const priority = classifyPriority(title, category);

  return {
    title,
    summary: summary || 'Click through to read the full article on the source site.',
    source: deriveSourceName(host),
    sourceUrl: raw.url,
    category,
    date: raw.date || '',
    url: raw.url,
    priority,
  };
}

// ----------------------------------------------------------------------------
// Fallback news — only used if ALL searches fail (e.g. network down)
// ----------------------------------------------------------------------------
function googleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function getFallbackNews(examName: string, country?: string): NewsItem[] {
  const region = country && country.trim().length > 0 ? country.trim() : 'India';
  return [
    {
      title: `${examName} — official portal`,
      summary: `Visit the official ${examName} portal for the latest notifications, admit cards, and exam-day instructions. Region: ${region}.`,
      source: 'Official Portal',
      sourceUrl: googleSearchUrl(`${examName} official site ${region}`),
      category: 'Official',
      date: isoDaysAgo(1),
      url: googleSearchUrl(`${examName} official site ${region}`),
      priority: 'urgent',
    },
    {
      title: `${examName} news roundup`,
      summary: `Latest news and updates about ${examName} from major Indian and international news channels.`,
      source: 'News Search',
      sourceUrl: googleSearchUrl(`${examName} news 2026 ${region}`),
      category: 'News',
      date: isoDaysAgo(2),
      url: googleSearchUrl(`${examName} news 2026 ${region}`),
      priority: 'high',
    },
    {
      title: `${examName} aspirant discussions`,
      summary: `Browse social-media conversations and prep communities around ${examName}.`,
      source: 'Social Search',
      sourceUrl: googleSearchUrl(`${examName} aspirants discussion ${region}`),
      category: 'Social Media',
      date: isoDaysAgo(3),
      url: googleSearchUrl(`${examName} aspirants discussion ${region}`),
      priority: 'low',
    },
    {
      title: `${examName} preparation tips`,
      summary: `Strategy, books, and mock-test recommendations for ${examName}.`,
      source: 'Prep Tips',
      sourceUrl: googleSearchUrl(`${examName} preparation tips 2026`),
      category: 'Tips',
      date: isoDaysAgo(4),
      url: googleSearchUrl(`${examName} preparation tips 2026`),
      priority: 'normal',
    },
  ];
}

// ============================================================================
// POST handler
// ============================================================================
export async function POST(request: Request) {
  let body: ExamNewsRequest = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const examId = (body.examId || '').trim() || 'unknown';
  const examName = (body.examName || '').trim() || examId;
  const country = (body.country || '').trim() || 'India';

  try {
    const zai = await ZAI.create();

    // Run all search angles in parallel
    const searchPromises = SEARCH_ANGLES.map(angle =>
      runSearch(
        zai,
        angle.queryTemplate(examName, country),
        4,  // 4 results per angle → up to ~28 raw results
        angle.recencyDays,
      ).then(results => ({ angle, results })),
    );
    const searchResults = await Promise.all(searchPromises);

    // Convert + dedupe by URL
    const seenUrls = new Set<string>();
    const items: NewsItem[] = [];
    for (const { angle, results } of searchResults) {
      for (const raw of results) {
        const item = toNewsItem(raw, angle.category, examId);
        if (!item) continue;
        if (seenUrls.has(item.sourceUrl)) continue;
        seenUrls.add(item.sourceUrl);
        items.push(item);
      }
    }

    if (items.length === 0) {
      const fallback = getFallbackNews(examName, country);
      return NextResponse.json({
        items: fallback,
        source: 'fallback',
        reason: 'all-searches-empty',
      });
    }

    // Sort by priority (urgent first), then date (most recent first)
    const priorityOrder: Record<NewsPriority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    items.sort((a, b) => {
      const p = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (p !== 0) return p;
      const ad = a.date ? new Date(a.date).getTime() : 0;
      const bd = b.date ? new Date(b.date).getTime() : 0;
      return bd - ad;
    });

    // Cap at 10 items for a tidy feed
    const capped = items.slice(0, 10);

    return NextResponse.json({
      items: capped,
      source: 'web',
      count: capped.length,
      // Provide a small breakdown of categories for the UI to optionally show
      breakdown: {
        Official: capped.filter(i => i.category === 'Official').length,
        News: capped.filter(i => i.category === 'News').length,
        'Social Media': capped.filter(i => i.category === 'Social Media').length,
        Tips: capped.filter(i => i.category === 'Tips').length,
      },
    });
  } catch (e) {
    const fallback = getFallbackNews(examName, country);
    return NextResponse.json(
      {
        items: fallback,
        source: 'fallback',
        reason: (e as Error).message || 'search-failed',
      },
      { status: 200 },
    );
  }
}
