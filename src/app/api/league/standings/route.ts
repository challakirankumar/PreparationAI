import { NextResponse } from 'next/server';
import { getOrCreatePlayer, getAllCohortStandings, getCohortStandings } from '@/lib/league/store';
import { getEduScope } from '@/lib/ai-guards/eduscope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/league/standings?userId=...&tier=...
 * Returns the player's league record + cohort standings.
 * If ?tier= is specified, returns only that tier's standings.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const tier = url.searchParams.get('tier');

  if (userId) {
    getEduScope().evaluate({
      userPrompt: `League standings fetch for user ${userId}`,
      context: { agent: 'mock-generator', userId },
    });
  }

  if (tier) {
    const standings = getCohortStandings(tier as any);
    return NextResponse.json({ standings });
  }

  if (!userId) {
    return NextResponse.json({ error: 'userId is required (or specify ?tier=)' }, { status: 400 });
  }

  const player = getOrCreatePlayer(userId, 'Aspirant');
  const allStandings = getAllCohortStandings();

  return NextResponse.json({
    player,
    standings: allStandings,
    currentTierStandings: allStandings[player.tier],
  });
}
