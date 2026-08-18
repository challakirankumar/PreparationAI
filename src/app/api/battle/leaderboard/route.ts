import { NextResponse } from 'next/server';
import { getLeaderboard, getPlayerBattles } from '@/lib/battle/battle-manager';
import type { BattleLeaderboardEntry } from '@/lib/battle/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/battle/leaderboard?userId=...
 * Returns the global leaderboard + the requesting player's own recent battles
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);

  const leaderboard = getLeaderboard(limit);
  const myBattles = userId ? getPlayerBattles(userId) : [];

  // Find my rank (if userId provided)
  let myEntry: BattleLeaderboardEntry | null = null;
  if (userId) {
    myEntry = leaderboard.find(e => e.userId === userId) ?? null;
    if (!myEntry) {
      // Build a stub entry from the player record
      const myBattlesSummary = myBattles.length;
      const wins = myBattles.filter(b => b.winner === 'A' && b.playerA.userId === userId).length;
      myEntry = {
        userId,
        displayName: 'You',
        rating: 1000,
        battlesWon: wins,
        battlesLost: myBattlesSummary - wins,
        battlesDraw: 0,
        totalBattles: myBattlesSummary,
        winRate: myBattlesSummary > 0 ? Math.round((wins / myBattlesSummary) * 100) : 0,
        totalXp: 0,
        weeklyXp: 0,
        monthlyXp: 0,
        rank: 0,
      } as BattleLeaderboardEntry;
    }
  }

  return NextResponse.json({
    leaderboard,
    myEntry,
    myRecentBattles: myBattles.slice(0, 5).map(b => ({
      battleId: b.id,
      examName: b.examName,
      mode: b.mode,
      opponentName: b.playerB.displayName,
      opponentIsBot: b.playerB.isBot,
      myScore: b.playerA.userId === userId ? b.playerAScore : b.playerBScore,
      opponentScore: b.playerA.userId === userId ? b.playerBScore : b.playerAScore,
      winner: b.winner,
      startedAt: b.startedAt,
      endedAt: b.endedAt,
      xpAwarded: b.playerA.userId === userId ? b.xpAwardedA : b.xpAwardedB,
      ratingChange: b.playerA.userId === userId ? b.ratingChangeA : b.ratingChangeB,
    })),
  });
}
