import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ============================================================================
// POST /api/semantic-search
// Body: { query, userExam?, userCountry?, num? }
// ----------------------------------------------------------------------------
// AI-powered semantic search for educational content. The flow is:
//
//   1. Use GLM-4.6 to expand the user's raw query into 3–5 semantic
//      variations, tuned to the user's exam + country context. This makes
//      the search "understand intent" rather than just keyword-matching.
//      Example: "rotational motion problems" + exam=JEE Main →
//        ["JEE Main rotational motion problems with solutions",
//         "moment of inertia numericals JEE Main",
//         "torque and angular momentum JEE Main previous year questions",
//         ...]
//
//   2. Run web_search on each variation in parallel via the z-ai SDK.
//      This pulls real, current results from across the web — news sites,
//      YouTube, NCERT, Khan Academy, official exam portals, prep blogs, etc.
//
//   3. Deduplicate by URL, classify each result into a category (Official,
//      Video, Article, Practice, Forum), and rank by a relevance score
//      computed from keyword overlap with the original query.
//
//   4. Use GLM-4.6 again to write a 1–2 sentence AI summary of what the
//      results collectively say — so the user sees both an answer AND the
//      sources to click through to.
//
// Every result includes the real URL so the user can verify and read the
// original source. No fabricated links.
// ============================================================================

interface RawSearchResult {
  url: string;
  name: string;
  snippet: string;
  host_name: string;
  rank: number;
  date: string;
}

interface SearchHit {
  title: string;
  snippet: string;
  url: string;
  host: string;
  sourceName: string;
  category: 'Official' | 'Video' | 'Article' | 'Practice' | 'Forum';
  date: string;
  relevance: number; // 0–1
}

interface SearchResponse {
  query: string;
  expandedQueries: string[];
  aiSummary: string;
  hits: SearchHit[];
  source: 'web' | 'fallback';
  reason?: string;
  error?: string;
}

// ----------------------------------------------------------------------------
// Domain classifier
// ----------------------------------------------------------------------------
const VIDEO_DOMAINS = ['youtube.com', 'youtu.be', 'vimeo.com'];
const OFFICIAL_DOMAINS = [
  'nic.in', 'ac.in', 'gov.in', 'nta.ac.in', 'jeemain.nta.nic.in', 'neet.nta.nic.in',
  'upsc.gov.in', 'gate.iisc.ac.in', 'iimcat.ac.in', 'collegeboard.org', 'ets.org',
  'mba.com', 'ielts.org', 'britishcouncil.org', 'toefl.org', 'cbse.gov.in',
];
const PRACTICE_DOMAINS = [
  'vedantu.com', 'unacademy.com', 'byjus.com', 'toppr.com', 'doubtnut.com',
  'testbook.com', 'gradeup.co', 'physicswallah.com', 'questions.examside.com',
  'mathonlava.com', 'indiabix.com', 'geeksforgeeks.org',
];
const FORUM_DOMAINS = [
  'reddit.com', 'quora.com', 'stackoverflow.com', 'medium.com',
  'telegram.me', 't.me', 'discourse.org',
];

function classifyHost(host: string): SearchHit['category'] {
  const h = host.toLowerCase().replace(/^www\./, '');
  if (VIDEO_DOMAINS.some(d => h === d || h.endsWith('.' + d))) return 'Video';
  if (OFFICIAL_DOMAINS.some(d => h === d || h.endsWith('.' + d))) return 'Official';
  if (FORUM_DOMAINS.some(d => h === d || h.endsWith('.' + d))) return 'Forum';
  if (PRACTICE_DOMAINS.some(d => h === d || h.endsWith('.' + d))) return 'Practice';
  return 'Article';
}

function sourceNameFromHost(host: string): string {
  const h = host.toLowerCase().replace(/^www\./, '');
  const parts = h.split('.');
  if (parts.length >= 2) {
    const n = parts[parts.length - 2];
    return n.charAt(0).toUpperCase() + n.slice(1);
  }
  return host;
}

// Relevance score: count how many of the original query's keywords appear in
// the result's title + snippet, normalized to [0, 1].
function relevanceScore(query: string, title: string, snippet: string): number {
  const q = query.toLowerCase();
  const qTokens = q.split(/\W+/).filter(t => t.length > 2);
  if (qTokens.length === 0) return 0.5;
  const haystack = (title + ' ' + snippet).toLowerCase();
  let hits = 0;
  for (const t of qTokens) {
    if (haystack.includes(t)) hits += 1;
  }
  return Math.min(1, hits / qTokens.length);
}

// ----------------------------------------------------------------------------
// Step 1 — expand the query into semantic variations using GLM-4.6
// ----------------------------------------------------------------------------
async function expandQuery(
  zai: any,
  query: string,
  exam?: string,
  country?: string,
): Promise<string[]> {
  const ctx = [
    exam ? `Target exam: ${exam}` : null,
    country ? `Country: ${country}` : null,
  ].filter(Boolean).join(' · ');

  const prompt = `You are a semantic search assistant for an exam-prep platform called PreparationAI.
A student typed this search query: "${query}"
${ctx ? `Context: ${ctx}` : ''}

Generate 4 search-engine query variations that would help the student find the most relevant
study material, video lessons, practice problems, or official documentation for that query.
Each variation should target a different angle:
  1. Official documentation / syllabus
  2. Video lessons (YouTube)
  3. Practice problems / previous-year questions
  4. Conceptual explanation / article

Output rules:
- Respond with ONLY a JSON array of 4 strings. No prose, no markdown.
- Each string is a short search query (max 60 chars).
- Make queries specific to the context above (mention the exam name if known).
- Do NOT include the angle labels in the strings.`;

  try {
    const completion = await zai.chat.completions.create({
      model: 'glm-4.6',
      stream: false,
      messages: [
        { role: 'system', content: 'You expand search queries into semantic variations. Output only JSON arrays of strings.' },
        { role: 'user', content: prompt },
      ],
    });
    const content = completion?.choices?.[0]?.message?.content || '';
    // Try to extract a JSON array
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return [query];
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr) || arr.length === 0) return [query];
    return arr.slice(0, 4).map(s => String(s)).filter(s => s.length > 0);
  } catch (e) {
    console.error('[semantic-search] expand failed:', (e as Error).message);
    return [query];
  }
}

// ----------------------------------------------------------------------------
// Step 2 — run web_search for each expanded query in parallel
// ----------------------------------------------------------------------------
async function runSearch(zai: any, query: string, num: number): Promise<RawSearchResult[]> {
  try {
    const results = await zai.functions.invoke('web_search', { query, num });
    if (!Array.isArray(results)) return [];
    return results as RawSearchResult[];
  } catch (e) {
    console.error('[semantic-search] search failed:', query, (e as Error).message);
    return [];
  }
}

// ----------------------------------------------------------------------------
// Step 3 — AI summary of the top results
// ----------------------------------------------------------------------------
async function summarizeResults(
  zai: any,
  query: string,
  hits: SearchHit[],
): Promise<string> {
  if (hits.length === 0) return '';
  const top = hits.slice(0, 6);
  const summaries = top.map((h, i) => `${i + 1}. ${h.title} — ${h.snippet.slice(0, 180)}`).join('\n');
  const prompt = `A student searched for: "${query}" on an exam-prep platform.

Here are the top ${top.length} web results:
${summaries}

Write a 1–2 sentence answer that synthesises what these results collectively say about the query.
Be concise and helpful. If the results don't directly answer the query, say so and suggest what the student should look at next.
Do NOT mention the source numbers. Just write the answer in plain prose.`;

  try {
    const completion = await zai.chat.completions.create({
      model: 'glm-4.6',
      stream: false,
      messages: [
        { role: 'system', content: 'You synthesise search results into a concise answer for a student.' },
        { role: 'user', content: prompt },
      ],
    });
    return (completion?.choices?.[0]?.message?.content || '').trim();
  } catch {
    return '';
  }
}

// ----------------------------------------------------------------------------
// POST handler
// ----------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query: string = String(body?.query || '').trim();
    const exam: string = String(body?.exam || '').trim();
    const country: string = String(body?.country || '').trim();
    const num: number = Math.min(8, Math.max(2, Number(body?.num) || 4));

    if (query.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    const zai = await ZAI.create();

    // Step 1 — expand the query
    const expandedQueries = await expandQuery(zai, query, exam, country);

    // Step 2 — run searches in parallel
    const searchPromises = expandedQueries.map(q => runSearch(zai, q, num));
    const searchResults = await Promise.all(searchPromises);

    // Step 3 — dedupe + classify + score
    const seenUrls = new Set<string>();
    const hits: SearchHit[] = [];
    for (const results of searchResults) {
      for (const raw of results) {
        if (!raw?.url || !raw?.name) continue;
        const lowerUrl = raw.url.toLowerCase();
        if (lowerUrl.includes('google.com/search?')) continue;
        if (seenUrls.has(raw.url)) continue;
        seenUrls.add(raw.url);
        const host = raw.host_name || (() => { try { return new URL(raw.url).hostname; } catch { return 'unknown'; } })();
        hits.push({
          title: raw.name,
          snippet: (raw.snippet || '').trim().slice(0, 240),
          url: raw.url,
          host,
          sourceName: sourceNameFromHost(host),
          category: classifyHost(host),
          date: raw.date || '',
          relevance: relevanceScore(query, raw.name, raw.snippet),
        });
      }
    }

    if (hits.length === 0) {
      return NextResponse.json({
        query,
        expandedQueries,
        aiSummary: '',
        hits: [],
        source: 'fallback',
        reason: 'no-results',
      } satisfies SearchResponse);
    }

    // Sort by relevance (desc), then by category priority (Official first)
    const catPriority: Record<SearchHit['category'], number> = {
      Official: 0, Video: 1, Practice: 2, Article: 3, Forum: 4,
    };
    hits.sort((a, b) => {
      if (Math.abs(a.relevance - b.relevance) > 0.1) return b.relevance - a.relevance;
      return catPriority[a.category] - catPriority[b.category];
    });

    const capped = hits.slice(0, 10);

    // Step 4 — AI summary
    const aiSummary = await summarizeResults(zai, query, capped);

    return NextResponse.json({
      query,
      expandedQueries,
      aiSummary,
      hits: capped,
      source: 'web',
    } satisfies SearchResponse);
  } catch (e) {
    console.error('[semantic-search]', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
