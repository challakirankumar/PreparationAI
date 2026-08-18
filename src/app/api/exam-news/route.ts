import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export type NewsCategory = 'Official' | 'News' | 'Social Media' | 'Tips';
export type NewsPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  category: NewsCategory;
  date: string; // ISO yyyy-mm-dd
  url: string;
  priority: NewsPriority;
}

interface ExamNewsRequest {
  examId?: string;
  examName?: string;
  country?: string;
}

const VALID_CATEGORIES: NewsCategory[] = ['Official', 'News', 'Social Media', 'Tips'];
const VALID_PRIORITIES: NewsPriority[] = ['urgent', 'high', 'normal', 'low'];

function googleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Realistic fallback news items used when the AI call fails or returns
 * unparseable output. These are generic enough to apply to any major exam
 * while still being plausible and useful.
 */
function getFallbackNews(examName: string, country?: string): NewsItem[] {
  const region = country && country.trim().length > 0 ? country.trim() : 'India';
  const query = (topic: string) => `${examName} ${topic} ${region}`;
  return [
    {
      title: `${examName} official notification released for upcoming session`,
      summary:
        `The conducting body has published the official notification for the next ${examName} session. ` +
        `Candidates are advised to check the eligibility, exam dates and syllabus changes on the official portal.`,
      source: 'Official Portal',
      category: 'Official',
      date: isoDaysAgo(1),
      url: googleSearchUrl(query('official notification')),
      priority: 'urgent',
    },
    {
      title: `${examName} registration window opens next week`,
      summary:
        `The application form for ${examName} will be available online starting next week. ` +
        `Keep scanned documents, photo and signature ready to avoid last-minute issues.`,
      source: 'Exam News Daily',
      category: 'News',
      date: isoDaysAgo(2),
      url: googleSearchUrl(query('registration dates')),
      priority: 'high',
    },
    {
      title: `Syllabus update: new topics added to ${examName} pattern`,
      summary:
        `A few topics have been added or re-weighted in the latest ${examName} syllabus. ` +
        `Review the updated blueprint and align your mock attempts accordingly.`,
      source: 'Prep Bulletin',
      category: 'News',
      date: isoDaysAgo(3),
      url: googleSearchUrl(query('syllabus update')),
      priority: 'high',
    },
    {
      title: `Top educators share last-week strategy for ${examName}`,
      summary:
        `With the exam around the corner, mentors recommend focusing on revision, formula sheets, ` +
        `and full-length mocks under timed conditions rather than starting new topics.`,
      source: 'Mentor Community',
      category: 'Tips',
      date: isoDaysAgo(4),
      url: googleSearchUrl(query('last week strategy tips')),
      priority: 'normal',
    },
    {
      title: `${examName} aspirants trend on social media with #PrepHard`,
      summary:
        `Thousands of ${examName} aspirants are sharing their study schedules and motivating each other online. ` +
        `Joining a focused peer group can boost consistency in the final stretch.`,
      source: 'Social Buzz',
      category: 'Social Media',
      date: isoDaysAgo(5),
      url: googleSearchUrl(query('aspirants social media motivation')),
      priority: 'low',
    },
    {
      title: `Common mistakes to avoid in the ${examName} exam hall`,
      summary:
        `Time mismanagement, misreading negative-marking questions, and skipping easy topics first ` +
        `are the most reported mistakes. Practise mock attempts that mirror the real exam pattern.`,
      source: 'Prep Bulletin',
      category: 'Tips',
      date: isoDaysAgo(6),
      url: googleSearchUrl(query('common mistakes exam hall')),
      priority: 'normal',
    },
  ];
}

function normaliseCategory(raw: unknown): NewsCategory {
  if (typeof raw !== 'string') return 'News';
  const lower = raw.toLowerCase();
  if (lower.includes('official')) return 'Official';
  if (lower.includes('social')) return 'Social Media';
  if (lower.includes('tip')) return 'Tips';
  if (lower.includes('news')) return 'News';
  if (VALID_CATEGORIES.includes(raw as NewsCategory)) return raw as NewsCategory;
  return 'News';
}

function normalisePriority(raw: unknown): NewsPriority {
  if (typeof raw !== 'string') return 'normal';
  const lower = raw.toLowerCase();
  if (lower.includes('urgent')) return 'urgent';
  if (lower.includes('high')) return 'high';
  if (lower.includes('low')) return 'low';
  if (lower.includes('normal') || lower.includes('medium')) return 'normal';
  if (VALID_PRIORITIES.includes(raw as NewsPriority)) return raw as NewsPriority;
  return 'normal';
}

function isValidDate(s: string): boolean {
  if (typeof s !== 'string') return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

function normaliseItem(raw: any, examName: string): NewsItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const summary = typeof raw.summary === 'string' ? raw.summary.trim() : '';
  const source = typeof raw.source === 'string' && raw.source.trim().length > 0 ? raw.source.trim() : 'Exam News';
  if (!title || !summary) return null;

  let url = typeof raw.url === 'string' && raw.url.trim().length > 0 ? raw.url.trim() : '';
  if (!url || !url.startsWith('http')) {
    url = googleSearchUrl(`${examName} ${title}`);
  }

  let date = typeof raw.date === 'string' ? raw.date.trim() : '';
  if (!isValidDate(date)) date = isoDaysAgo(1);
  else date = new Date(date).toISOString().slice(0, 10);

  return {
    title,
    summary,
    source,
    category: normaliseCategory(raw.category),
    date,
    url,
    priority: normalisePriority(raw.priority),
  };
}

function extractJsonArray(content: string): unknown[] | null {
  if (!content) return null;
  // Strip markdown code fences if present.
  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1] : content;

  // Try direct parse first.
  try {
    const parsed = JSON.parse(candidate);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray((parsed as any).items)) return (parsed as any).items;
    if (parsed && Array.isArray((parsed as any).news)) return (parsed as any).news;
  } catch {
    // fall through to regex extraction
  }

  // Find the first JSON array in the text.
  const start = candidate.indexOf('[');
  const end = candidate.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    const slice = candidate.slice(start, end + 1);
    try {
      const parsed = JSON.parse(slice);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // give up
    }
  }
  return null;
}

function buildPrompt(examName: string, examId: string, country: string): string {
  return `You are a news aggregator for competitive exam aspirants on the Preparation AI platform.

Generate 8 to 10 realistic, exam-specific news items for: "${examName}" (exam id: ${examId}, region: ${country}).

Strict output rules:
- Respond with ONLY a JSON array. No prose, no markdown fences, no commentary.
- Each element must be an object with EXACTLY these fields:
  {
    "title": string,            // short headline, <= 90 chars
    "summary": string,          // 1-2 sentence summary, <= 220 chars
    "source": string,           // plausible source name, e.g. "NTA Official", "The Hindu", "PrepTube"
    "category": "Official" | "News" | "Social Media" | "Tips",
    "date": "YYYY-MM-DD",       // a plausible date within the last 7 days
    "url": string,              // MUST be https://www.google.com/search?q=<url-encoded+query>
    "priority": "urgent" | "high" | "normal" | "low"
  }
- URLs MUST use the format: https://www.google.com/search?q=<url-encoded-query>. Never invent other domains.
- At least 1 item must have category "Official", at least 2 "News", at least 1 "Social Media", at least 1 "Tips".
- At most 2 items may be "urgent". Distribute priorities across the list.
- Make titles specific to ${examName} (mention syllabus, dates, admit card, pattern change, prep tips, etc.).
- Never fabricate celebrity quotes or specific named individuals as sources.
- Keep the JSON valid (no trailing commas, double-quoted strings only).

Return the array now:`;
}

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
    const completion = await zai.chat.completions.create({
      model: 'glm-4.6',
      stream: false,
      messages: [
        { role: 'system', content: 'You generate structured JSON news feeds for exam aspirants. Output only JSON.' },
        { role: 'user', content: buildPrompt(examName, examId, country) },
      ],
    });

    const content = completion?.choices?.[0]?.message?.content || '';
    const rawArray = extractJsonArray(content);

    if (!rawArray || rawArray.length === 0) {
      const fallback = getFallbackNews(examName, country);
      return NextResponse.json({ items: fallback, source: 'fallback', reason: 'empty-or-unparseable-ai-response' });
    }

    const items: NewsItem[] = [];
    for (const raw of rawArray) {
      const item = normaliseItem(raw, examName);
      if (item) items.push(item);
    }

    if (items.length === 0) {
      const fallback = getFallbackNews(examName, country);
      return NextResponse.json({ items: fallback, source: 'fallback', reason: 'no-valid-items-after-normalisation' });
    }

    // Sort by priority then date (most recent first).
    const priorityOrder: Record<NewsPriority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    items.sort((a, b) => {
      const p = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (p !== 0) return p;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return NextResponse.json({ items, source: 'ai', count: items.length });
  } catch (e) {
    const fallback = getFallbackNews(examName, country);
    return NextResponse.json(
      { items: fallback, source: 'fallback', reason: (e as Error).message || 'ai-call-failed' },
      { status: 200 }
    );
  }
}
