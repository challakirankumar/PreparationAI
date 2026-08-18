import { NextResponse } from 'next/server';
import { getPlayerHistory } from '@/lib/league/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/league/history?userId=...
 * Returns the player's weekly reset history (promotions, demotions, rewards earned).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  const history = getPlayerHistory(userId);
  return NextResponse.json({ history, count: history.length });
}
