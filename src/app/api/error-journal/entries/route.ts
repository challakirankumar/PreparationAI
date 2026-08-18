import { NextResponse } from 'next/server';
import { getEntries, markReviewed, markResolved, deleteEntry } from '@/lib/error-journal/store';
import type { ErrorRootCause } from '@/lib/error-journal/classifier';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/error-journal/entries?userId=...&subject=...&topic=...&rootCause=...&source=...&reviewedOnly=true&unresolvedOnly=true&limit=50
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  const filters: any = {};
  const subject = url.searchParams.get('subject');
  if (subject) filters.subject = subject;
  const topic = url.searchParams.get('topic');
  if (topic) filters.topic = topic;
  const rootCause = url.searchParams.get('rootCause');
  if (rootCause) filters.rootCause = rootCause as ErrorRootCause;
  const source = url.searchParams.get('source');
  if (source) filters.source = source;
  if (url.searchParams.get('reviewedOnly') === 'true') filters.reviewedOnly = true;
  if (url.searchParams.get('unresolvedOnly') === 'true') filters.unresolvedOnly = true;
  const limit = url.searchParams.get('limit');
  if (limit) filters.limit = parseInt(limit, 10);

  const entries = getEntries(userId, filters);
  return NextResponse.json({ entries, count: entries.length });
}

/**
 * PATCH /api/error-journal/entries
 * Body: { userId, entryId, action: 'review' | 'resolve' | 'unreview' | 'unresolve' | 'delete' }
 */
export async function PATCH(request: Request) {
  let body: { userId?: string; entryId?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body.userId || !body.entryId || !body.action) {
    return NextResponse.json({ error: 'userId, entryId, action are required' }, { status: 400 });
  }
  let ok = false;
  switch (body.action) {
    case 'review': ok = markReviewed(body.userId, body.entryId); break;
    case 'resolve': ok = markResolved(body.userId, body.entryId); break;
    case 'delete': ok = deleteEntry(body.userId, body.entryId); break;
    default:
      return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
  }
  return NextResponse.json({ ok });
}
