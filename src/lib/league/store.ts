// ============================================================================
// League Store — in-memory persistence
// ----------------------------------------------------------------------------
// Manages league players, cohort standings, weekly resets, rewards, badges.
// In production: swap to DB. For dev: globalThis survives HMR.
// ============================================================================

import type {
  LeaguePlayer, Tier, Badge, CohortStanding, WeeklyResetEvent, RewardGrant,
} from './types';
import {
  TIERS, TIER_ORDER, getNextTier, getPreviousTier,
  computeTierForXp, computeProgressToNextTier, computeProjectedChange,
  getWeekStart, getWeekEnd, getWeekKey,
  generateTierBadge, generateStreakBadge, generateMilestoneBadge,
} from './types';

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

interface LeagueStore {
  players: Map<string, LeaguePlayer>;
  // History of weekly reset events per user
  history: Map<string, WeeklyResetEvent[]>;
  // Granted rewards (badges + streak protection tokens + etc)
  rewards: Map<string, RewardGrant[]>;
  // Current week key
  currentWeekKey: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __league_store__: LeagueStore | undefined;
}

function getStore(): LeagueStore {
  if (!globalThis.__league_store__) {
    const store: LeagueStore = {
      players: new Map(),
      history: new Map(),
      rewards: new Map(),
      currentWeekKey: getWeekKey(),
    };
    seedDemoData(store);
    globalThis.__league_store__ = store;
  }
  return globalThis.__league_store__;
}

// ---------------------------------------------------------------------------
// Seed demo data — populate 20 demo players across 4 tiers
// ---------------------------------------------------------------------------

function seedDemoData(store: LeagueStore) {
  const weekKey = getWeekKey();

  // Demo players — 5 per tier
  const demoPlayers: Array<{ userId: string; displayName: string; tier: Tier; weeklyXp: number }> = [
    // Diamond (5 players, weeklyXp 1200+)
    { userId: 'demo_p1', displayName: 'Aarav Sharma', tier: 'diamond', weeklyXp: 1850 },
    { userId: 'demo_p2', displayName: 'Diya Patel', tier: 'diamond', weeklyXp: 1620 },
    { userId: 'demo_p3', displayName: 'Vivaan Reddy', tier: 'diamond', weeklyXp: 1480 },
    { userId: 'demo_p4', displayName: 'Ananya Iyer', tier: 'diamond', weeklyXp: 1340 },
    { userId: 'demo_p5', displayName: 'Aditya Nair', tier: 'diamond', weeklyXp: 1250 },
    // Gold (5 players, 600-1199)
    { userId: 'demo_p6', displayName: 'Saanvi Gupta', tier: 'gold', weeklyXp: 1150 },
    { userId: 'demo_p7', displayName: 'Arjun Mehta', tier: 'gold', weeklyXp: 980 },
    { userId: 'demo_p8', displayName: 'Ishaan Verma', tier: 'gold', weeklyXp: 820 },
    { userId: 'demo_p9', displayName: 'Riya Singh', tier: 'gold', weeklyXp: 710 },
    { userId: 'demo_p10', displayName: 'Karan Joshi', tier: 'gold', weeklyXp: 650 },
    // Silver (5 players, 200-599)
    { userId: 'demo_p11', displayName: 'Tara Menon', tier: 'silver', weeklyXp: 540 },
    { userId: 'demo_p12', displayName: 'Rohit Das', tier: 'silver', weeklyXp: 420 },
    { userId: 'demo_p13', displayName: 'Nisha Pillai', tier: 'silver', weeklyXp: 350 },
    { userId: 'demo_p14', displayName: 'Sameer Rao', tier: 'silver', weeklyXp: 280 },
    { userId: 'demo_p15', displayName: 'Pooja Bhat', tier: 'silver', weeklyXp: 220 },
    // Bronze (5 players, 0-199)
    { userId: 'demo_p16', displayName: 'Vikram Reddy', tier: 'bronze', weeklyXp: 180 },
    { userId: 'demo_p17', displayName: 'Anika Sengupta', tier: 'bronze', weeklyXp: 140 },
    { userId: 'demo_p18', displayName: 'Dev Malhotra', tier: 'bronze', weeklyXp: 90 },
    { userId: 'demo_p19', displayName: 'Kavya Iyer', tier: 'bronze', weeklyXp: 50 },
    { userId: 'demo_p20', displayName: 'Yash Agarwal', tier: 'bronze', weeklyXp: 20 },
  ];

  for (const p of demoPlayers) {
    const tierMeta = TIERS[p.tier];
    const player: LeaguePlayer = {
      userId: p.userId,
      displayName: p.displayName,
      tier: p.tier,
      weeklyXp: p.weeklyXp,
      rankInTier: 0,  // computed below
      tierSize: 5,    // 5 per tier in seed
      progressToNextTier: 0,  // computed below
      xpToNextTier: 0,  // computed below
      lastWeekTier: p.tier,  // assume same as current (no transitions in seed)
      streakProtectionTokens: p.tier === 'gold' ? 1 : p.tier === 'diamond' ? 2 : 0,
      weeksByTier: { bronze: 0, silver: 0, gold: 0, diamond: 4 },  // demo: been in tier 4 weeks
      highestTierAchieved: p.tier,
      badges: [
        generateTierBadge(p.tier, weekKey),
        generateStreakBadge(p.tier === 'diamond' ? 30 : p.tier === 'gold' ? 14 : p.tier === 'silver' ? 7 : 3),
      ],
    };
    store.players.set(p.userId, player);
  }

  // Compute ranks within each tier
  recomputeRanks(store);

  // Add some history for demo_p1 (Aarav — diamond)
  store.history.set('demo_p1', [
    {
      weekStart: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      weekEnd: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      tierBefore: 'silver',
      tierAfter: 'gold',
      change: 'promoted',
      weeklyXpEarned: 720,
      rewards: ['Gold badge on profile', '1 streak protection token / week'],
      streakProtectionUsed: false,
    },
    {
      weekStart: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      weekEnd: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      tierBefore: 'gold',
      tierAfter: 'gold',
      change: 'stayed',
      weeklyXpEarned: 850,
      rewards: ['1 streak protection token / week'],
      streakProtectionUsed: false,
    },
    {
      weekStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      weekEnd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      tierBefore: 'gold',
      tierAfter: 'diamond',
      change: 'promoted',
      weeklyXpEarned: 1850,
      rewards: ['Diamond badge on profile', '2 streak protection tokens / week', 'Early access to new features'],
      streakProtectionUsed: false,
    },
  ]);

  // Rewards inventory for demo_p1
  store.rewards.set('demo_p1', [
    {
      id: 'reward_demo_1',
      userId: 'demo_p1',
      rewardType: 'streak_protection',
      description: 'Streak protection token (Gold tier weekly grant)',
      grantedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      used: false,
      metadata: { tier: 'gold', weekStart: getWeekKey() },
    },
    {
      id: 'reward_demo_2',
      userId: 'demo_p1',
      rewardType: 'streak_protection',
      description: 'Streak protection token (Diamond tier weekly grant)',
      grantedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      used: false,
      metadata: { tier: 'diamond', weekStart: getWeekKey() },
    },
    {
      id: 'reward_demo_3',
      userId: 'demo_p1',
      rewardType: 'feature_access',
      description: 'Early access to new features (Diamond tier perk)',
      grantedAt: new Date().toISOString(),
      metadata: { tier: 'diamond' },
    },
  ]);
}

function recomputeRanks(store: LeagueStore) {
  // Group by tier, sort by weeklyXp desc, assign ranks
  for (const tier of TIER_ORDER) {
    const playersInTier = Array.from(store.players.values()).filter(p => p.tier === tier);
    playersInTier.sort((a, b) => b.weeklyXp - a.weeklyXp);
    const tierSize = playersInTier.length;
    playersInTier.forEach((p, idx) => {
      const updated = store.players.get(p.userId);
      if (updated) {
        updated.rankInTier = idx + 1;
        updated.tierSize = tierSize;
        const progress = computeProgressToNextTier(p.weeklyXp, p.tier);
        updated.progressToNextTier = progress.progressPct;
        updated.xpToNextTier = progress.xpToNext;
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getOrCreatePlayer(userId: string, displayName: string): LeaguePlayer {
  const store = getStore();
  let player = store.players.get(userId);
  if (!player) {
    // New players start in Bronze
    player = {
      userId,
      displayName,
      tier: 'bronze',
      weeklyXp: 0,
      rankInTier: 0,
      tierSize: 0,
      progressToNextTier: 0,
      xpToNextTier: TIERS.silver.weeklyXpThreshold,
      lastWeekTier: 'bronze',
      streakProtectionTokens: 0,
      weeksByTier: { bronze: 0, silver: 0, gold: 0, diamond: 0 },
      highestTierAchieved: 'bronze',
      badges: [],
    };
    store.players.set(userId, player);
    recomputeRanks(store);
  }
  return player;
}

export function getPlayer(userId: string): LeaguePlayer | undefined {
  return getStore().players.get(userId);
}

export function getCohortStandings(tier: Tier): CohortStanding {
  const store = getStore();
  const playersInTier = Array.from(store.players.values())
    .filter(p => p.tier === tier)
    .sort((a, b) => b.weeklyXp - a.weeklyXp);

  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd(weekStart);

  return {
    tier,
    weekStart: weekStart.toISOString().slice(0, 10),
    weekEnd: weekEnd.toISOString().slice(0, 10),
    players: playersInTier.map((p, idx) => ({
      userId: p.userId,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      weeklyXp: p.weeklyXp,
      rankInTier: idx + 1,
      projectedChange: computeProjectedChange(idx + 1, playersInTier.length, tier),
    })),
    totalPlayers: playersInTier.length,
    avgXp: playersInTier.length > 0 ? Math.round(playersInTier.reduce((s, p) => s + p.weeklyXp, 0) / playersInTier.length) : 0,
    topXp: playersInTier.length > 0 ? playersInTier[0].weeklyXp : 0,
  };
}

export function getAllCohortStandings(): Record<Tier, CohortStanding> {
  return {
    bronze: getCohortStandings('bronze'),
    silver: getCohortStandings('silver'),
    gold: getCohortStandings('gold'),
    diamond: getCohortStandings('diamond'),
  };
}

export function getPlayerHistory(userId: string): WeeklyResetEvent[] {
  return getStore().history.get(userId) ?? [];
}

export function getPlayerRewards(userId: string): RewardGrant[] {
  return getStore().rewards.get(userId) ?? [];
}

// ---------------------------------------------------------------------------
// Award XP to a player (e.g. when they complete a mock or win a battle)
// ---------------------------------------------------------------------------

export function awardXp(userId: string, xpAmount: number, reason: string): LeaguePlayer | null {
  const store = getStore();
  const player = store.players.get(userId);
  if (!player) return null;

  // Apply tier-based XP boost
  const tierBoost = player.tier === 'diamond' ? 1.15 :
    player.tier === 'gold' ? 1.10 :
    player.tier === 'silver' ? 1.05 : 1.0;
  const boostedXp = Math.round(xpAmount * tierBoost);

  player.weeklyXp += boostedXp;

  // Check if XP crossed a tier threshold (immediate auto-promotion)
  const newTier = computeTierForXp(player.weeklyXp);
  if (TIER_ORDER.indexOf(newTier) > TIER_ORDER.indexOf(player.tier)) {
    // Auto-promote!
    const oldTier = player.tier;
    player.tier = newTier;
    player.lastWeekTier = oldTier;
    player.weeksByTier[newTier] = (player.weeksByTier[newTier] ?? 0) + 1;
    if (TIER_ORDER.indexOf(newTier) > TIER_ORDER.indexOf(player.highestTierAchieved)) {
      player.highestTierAchieved = newTier;
    }
    // Grant tier badge
    const tierBadge = generateTierBadge(newTier, getWeekKey());
    player.badges.push(tierBadge);
    // Grant streak protection tokens for new tier
    if (newTier === 'gold') player.streakProtectionTokens += 1;
    if (newTier === 'diamond') player.streakProtectionTokens += 2;

    // Record history event
    if (!store.history.has(userId)) store.history.set(userId, []);
    store.history.get(userId)!.push({
      weekStart: getWeekStart().toISOString().slice(0, 10),
      weekEnd: getWeekEnd().toISOString().slice(0, 10),
      tierBefore: oldTier,
      tierAfter: newTier,
      change: 'promoted',
      weeklyXpEarned: player.weeklyXp,
      rewards: TIERS[newTier].rewards,
      streakProtectionUsed: false,
    });
  }

  recomputeRanks(store);
  return player;
}

// ---------------------------------------------------------------------------
// Use a streak protection token (prevents a streak from breaking)
// ---------------------------------------------------------------------------

export function applyStreakProtectionToken(userId: string): { used: boolean; remaining: number; reason?: string } {
  const store = getStore();
  const player = store.players.get(userId);
  if (!player) return { used: false, remaining: 0, reason: 'Player not found' };

  if (player.streakProtectionTokens <= 0) {
    return { used: false, remaining: 0, reason: 'No tokens available' };
  }

  player.streakProtectionTokens -= 1;

  // Mark a reward as used
  const rewards = store.rewards.get(userId) ?? [];
  const unusedToken = rewards.find(r =>
    r.rewardType === 'streak_protection' && !r.used
  );
  if (unusedToken) {
    unusedToken.used = true;
    unusedToken.usedAt = new Date().toISOString();
  }

  return { used: true, remaining: player.streakProtectionTokens };
}

// ---------------------------------------------------------------------------
// Weekly reset — called by a cron every Monday at 00:00
// For each player: reset weeklyXp, run promotion/demotion, grant weekly rewards
// ---------------------------------------------------------------------------

export function performWeeklyReset(): { processed: number; promoted: number; demoted: number; stayed: number } {
  const store = getStore();
  const newWeekKey = getWeekKey();
  if (store.currentWeekKey === newWeekKey) {
    return { processed: 0, promoted: 0, demoted: 0, stayed: 0 };
  }

  let promoted = 0, demoted = 0, stayed = 0;
  const oldWeekKey = store.currentWeekKey;
  store.currentWeekKey = newWeekKey;

  for (const player of store.players.values()) {
    const oldTier = player.tier;
    const projectedChange = computeProjectedChange(player.rankInTier, player.tierSize, player.tier);

    let newTier = oldTier;
    let streakProtectionUsed = false;

    if (projectedChange === 'promote') {
      const nextTier = getNextTier(oldTier);
      if (nextTier) {
        newTier = nextTier;
        promoted++;
      } else {
        stayed++;
      }
    } else if (projectedChange === 'demote') {
      const prevTier = getPreviousTier(oldTier);
      if (prevTier) {
        // Check if player has a streak protection token to prevent demotion
        if (player.streakProtectionTokens > 0) {
          player.streakProtectionTokens -= 1;
          streakProtectionUsed = true;
          newTier = oldTier;  // stay
          stayed++;
        } else {
          newTier = prevTier;
          demoted++;
        }
      } else {
        stayed++;
      }
    } else {
      stayed++;
    }

    // Apply changes
    player.tier = newTier;
    player.lastWeekTier = oldTier;
    player.weeklyXp = 0;  // reset weekly XP
    player.weeksByTier[newTier] = (player.weeksByTier[newTier] ?? 0) + 1;
    if (TIER_ORDER.indexOf(newTier) > TIER_ORDER.indexOf(player.highestTierAchieved)) {
      player.highestTierAchieved = newTier;
    }

    // Grant weekly rewards for the new tier
    if (newTier === 'gold') player.streakProtectionTokens += 1;
    if (newTier === 'diamond') player.streakProtectionTokens += 2;

    // Add tier badge if promoted
    if (newTier !== oldTier && TIER_ORDER.indexOf(newTier) > TIER_ORDER.indexOf(oldTier)) {
      player.badges.push(generateTierBadge(newTier, newWeekKey));
    }

    // Record history event
    if (!store.history.has(player.userId)) store.history.set(player.userId, []);
    store.history.get(player.userId)!.push({
      weekStart: oldWeekKey,
      weekEnd: new Date(Date.now() - 1).toISOString().slice(0, 10),
      tierBefore: oldTier,
      tierAfter: newTier,
      change: newTier !== oldTier ? (TIER_ORDER.indexOf(newTier) > TIER_ORDER.indexOf(oldTier) ? 'promoted' : 'demoted') : 'stayed',
      weeklyXpEarned: player.weeklyXp,  // was reset to 0 above — for history, would be saved before reset in production
      rewards: TIERS[newTier].rewards,
      streakProtectionUsed,
    });
  }

  recomputeRanks(store);
  return { processed: store.players.size, promoted, demoted, stayed };
}

// ---------------------------------------------------------------------------
// Award milestone badges (called when player completes a mock)
// ---------------------------------------------------------------------------

export function checkMilestoneBadges(userId: string, totalMocks: number): Badge | null {
  const store = getStore();
  const player = store.players.get(userId);
  if (!player) return null;

  const badge = generateMilestoneBadge(totalMocks);
  if (!badge) return null;

  // Check if already earned
  if (player.badges.some(b => b.id === badge.id)) return null;

  player.badges.push(badge);
  return badge;
}

// ---------------------------------------------------------------------------
// Award streak badges (called when player hits a streak milestone)
// ---------------------------------------------------------------------------

export function checkStreakBadge(userId: string, streakDays: number): Badge | null {
  const store = getStore();
  const player = store.players.get(userId);
  if (!player) return null;

  const badge = generateStreakBadge(streakDays);

  // Check if already earned
  if (player.badges.some(b => b.id === badge.id)) return null;

  player.badges.push(badge);
  return badge;
}
