import { NextResponse } from 'next/server';
import { getEntries } from '@/lib/error-journal/store';
import { computePatternReport } from '@/lib/error-journal/classifier';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/error-journal/patterns?userId=...
 * Returns the aggregated mistake-pattern report:
 *   - byCause breakdown
 *   - dominant cause
 *   - top weak topics
 *   - recurring errors
 *   - weekly trend (last 8 weeks)
 *   - readiness impact
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  const entries = getEntries(userId);
  const report = computePatternReport(userId, entries);
  return NextResponse.json(report);
}
