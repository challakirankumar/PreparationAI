import { NextResponse } from 'next/server';
import { getPlayerRewards, applyStreakProtectionToken, getPlayer } from '@/lib/league/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/league/rewards?userId=...
 * Returns the player's reward inventory.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  const rewards = getPlayerRewards(userId);
  const player = getPlayer(userId);
  return NextResponse.json({
    rewards,
    streakProtectionTokens: player?.streakProtectionTokens ?? 0,
  });
}

/**
 * POST /api/league/rewards
 * Body: { userId, action: 'use_streak_protection' }
 * Uses a streak protection token (prevents a streak from breaking today).
 */
export async function POST(request: Request) {
  let body: { userId?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.userId || !body.action) {
    return NextResponse.json({ error: 'userId and action are required' }, { status: 400 });
  }

  if (body.action === 'use_streak_protection') {
    const result = applyStreakProtectionToken(body.userId);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
}
