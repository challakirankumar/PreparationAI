// ============================================================================
// Gamified League System — Types + Tier Progression
// ----------------------------------------------------------------------------
// Bronze → Silver → Gold → Diamond cohorts.
// Weekly resets: every Monday at 00:00 local time.
// Promotion/demotion based on XP earned during the week.
//
// Cost-free rewards:
//   - Badges (auto-granted on tier transitions)
//   - Streak protection tokens (1 per week in Gold/Diamond)
//   - Profile flair (cosmetic)
//   - Squad banner upgrade
//   - Early access to new features (Diamond)
// ============================================================================

export type Tier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface TierMeta {
  tier: Tier;
  label: string;
  color: string;          // hex color
  bgClass: string;       // tailwind bg class
  textClass: string;      // tailwind text class
  borderClass: string;    // tailwind border class
  icon: string;           // emoji
  // XP threshold to ENTER this tier (weekly XP)
  weeklyXpThreshold: number;
  // Cohort size cap — top N% of cohort promote to next tier each week
  promotionPercentile: number;  // e.g. top 30% promote
  demotionPercentile: number;   // e.g. bottom 20% demote
  // Rewards granted for being in this tier
  rewards: string[];
}

export const TIERS: Record<Tier, TierMeta> = {
  bronze: {
    tier: 'bronze',
    label: 'Bronze',
    color: '#cd7f32',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-300',
    icon: '🥉',
    weeklyXpThreshold: 0,
    promotionPercentile: 30,    // top 30% promote to Silver
    demotionPercentile: 0,     // no demotion from Bronze (entry tier)
    rewards: [
      'Bronze badge on profile',
      'Access to public leaderboards',
      'Daily streak tracking',
    ],
  },
  silver: {
    tier: 'silver',
    label: 'Silver',
    color: '#c0c0c0',
    bgClass: 'bg-stone-100',
    textClass: 'text-stone-700',
    borderClass: 'border-stone-400',
    icon: '🥈',
    weeklyXpThreshold: 200,
    promotionPercentile: 25,    // top 25% promote to Gold
    demotionPercentile: 20,     // bottom 20% demote to Bronze
    rewards: [
      'Silver badge on profile',
      'Custom profile color (silver)',
      'Weekly XP boost: +5%',
      'Access to peer battles',
    ],
  },
  gold: {
    tier: 'gold',
    label: 'Gold',
    color: '#d4af37',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-400',
    icon: '🥇',
    weeklyXpThreshold: 600,
    promotionPercentile: 20,    // top 20% promote to Diamond
    demotionPercentile: 25,     // bottom 25% demote to Silver
    rewards: [
      'Gold badge on profile',
      'Custom profile color (gold)',
      'Weekly XP boost: +10%',
      '1 streak protection token / week',
      'Priority doubt-solver queue',
      'Squad banner upgrade',
    ],
  },
  diamond: {
    tier: 'diamond',
    label: 'Diamond',
    color: '#b9f2ff',
    bgClass: 'bg-cyan-50',
    textClass: 'text-cyan-700',
    borderClass: 'border-cyan-400',
    icon: '💎',
    weeklyXpThreshold: 1200,
    promotionPercentile: 0,    // already at top tier
    demotionPercentile: 30,    // bottom 30% demote to Gold
    rewards: [
      'Diamond badge on profile',
      'Custom profile color (diamond)',
      'Weekly XP boost: +15%',
      '2 streak protection tokens / week',
      'Instant doubt-solver priority',
      'Diamond squad banner',
      'Early access to new features',
      'Mentor status — featured on leaderboard',
    ],
  },
};

export const TIER_ORDER: Tier[] = ['bronze', 'silver', 'gold', 'diamond'];

export function getNextTier(tier: Tier): Tier | null {
  const idx = TIER_ORDER.indexOf(tier);
  return idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;
}

export function getPreviousTier(tier: Tier): Tier | null {
  const idx = TIER_ORDER.indexOf(tier);
  return idx > 0 ? TIER_ORDER[idx - 1] : null;
}

// ---------------------------------------------------------------------------
// Player league record — per-user, per-week
// ---------------------------------------------------------------------------

export interface LeaguePlayer {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  tier: Tier;
  // Weekly XP — resets every Monday
  weeklyXp: number;
  // Position within tier cohort (1-indexed)
  rankInTier: number;
  // Total players in this tier (for percentile computation)
  tierSize: number;
  // Progress to next tier (0-100%)
  progressToNextTier: number;
  // XP needed to reach next tier (for the progress bar)
  xpToNextTier: number;
  // Last week's tier (for promotion/demotion detection)
  lastWeekTier: Tier;
  // Streak protection tokens available
  streakProtectionTokens: number;
  // Total weeks spent in each tier (career stats)
  weeksByTier: Record<Tier, number>;
  // Highest tier ever achieved
  highestTierAchieved: Tier;
  // Badges earned
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier?: Tier;
  earnedAt: string;
  category: 'tier-promotion' | 'streak' | 'milestone' | 'special';
}

// ---------------------------------------------------------------------------
// Cohort standings — full list of players in a tier
// ---------------------------------------------------------------------------

export interface CohortStanding {
  tier: Tier;
  weekStart: string;
  weekEnd: string;
  players: {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    weeklyXp: number;
    rankInTier: number;
    // Will they promote / demote next week based on current percentile?
    projectedChange: 'promote' | 'demote' | 'stay';
  }[];
  // Tier summary stats
  totalPlayers: number;
  avgXp: number;
  topXp: number;
}

// ---------------------------------------------------------------------------
// Weekly reset event — fired every Monday at 00:00 local time
// ---------------------------------------------------------------------------

export interface WeeklyResetEvent {
  weekStart: string;
  weekEnd: string;
  tierBefore: Tier;
  tierAfter: Tier;
  change: 'promoted' | 'demoted' | 'stayed';
  weeklyXpEarned: number;
  rewards: string[];
  // For demotions: was a streak protection token used to prevent demotion?
  streakProtectionUsed: boolean;
}

// ---------------------------------------------------------------------------
// Reward inventory — track granted rewards per user
// ---------------------------------------------------------------------------

export interface RewardGrant {
  id: string;
  userId: string;
  rewardType: 'badge' | 'streak_protection' | 'profile_flair' | 'feature_access' | 'squad_banner';
  description: string;
  grantedAt: string;
  expiresAt?: string;  // for time-limited rewards like weekly tokens
  used?: boolean;       // for streak protection tokens
  usedAt?: string;
  metadata?: {
    tier?: Tier;
    weekStart?: string;
  };
}

// ---------------------------------------------------------------------------
// Tier computation — given weekly XP, determine tier
// ---------------------------------------------------------------------------

export function computeTierForXp(weeklyXp: number): Tier {
  if (weeklyXp >= TIERS.diamond.weeklyXpThreshold) return 'diamond';
  if (weeklyXp >= TIERS.gold.weeklyXpThreshold) return 'gold';
  if (weeklyXp >= TIERS.silver.weeklyXpThreshold) return 'silver';
  return 'bronze';
}

export function computeProgressToNextTier(weeklyXp: number, currentTier: Tier): { progressPct: number; xpToNext: number; nextTier: Tier | null } {
  const nextTier = getNextTier(currentTier);
  if (!nextTier) {
    return { progressPct: 100, xpToNext: 0, nextTier: null };
  }
  const currentThreshold = TIERS[currentTier].weeklyXpThreshold;
  const nextThreshold = TIERS[nextTier].weeklyXpThreshold;
  const range = nextThreshold - currentThreshold;
  const earned = weeklyXp - currentThreshold;
  const progressPct = Math.min(100, Math.max(0, Math.round((earned / range) * 100)));
  const xpToNext = Math.max(0, nextThreshold - weeklyXp);
  return { progressPct, xpToNext, nextTier };
}

// ---------------------------------------------------------------------------
// Projected change — based on percentile within tier cohort
// ---------------------------------------------------------------------------

export function computeProjectedChange(
  rankInTier: number,
  tierSize: number,
  tier: Tier,
): 'promote' | 'demote' | 'stay' {
  if (tierSize <= 1) return 'stay';
  const percentile = (rankInTier / tierSize) * 100;
  const topPct = percentile; // rank 1 = top 1%
  const bottomPct = 100 - percentile;

  const tierMeta = TIERS[tier];
  if (topPct <= tierMeta.promotionPercentile && getNextTier(tier)) {
    return 'promote';
  }
  if (bottomPct <= tierMeta.demotionPercentile && getPreviousTier(tier)) {
    return 'demote';
  }
  return 'stay';
}

// ---------------------------------------------------------------------------
// Week date helpers
// ---------------------------------------------------------------------------

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Monday = 1, Sunday = 0
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export function getWeekEnd(weekStart: Date = getWeekStart()): Date {
  const end = new Date(weekStart);
  end.setDate(weekStart.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getWeekKey(date: Date = new Date()): string {
  return getWeekStart(date).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Auto-badge generation on tier transitions
// ---------------------------------------------------------------------------

export function generateTierBadge(tier: Tier, weekKey: string): Badge {
  const tierMeta = TIERS[tier];
  return {
    id: `badge_tier_${tier}_${weekKey}`,
    name: `${tierMeta.label} Tier`,
    description: `Reached ${tierMeta.label} tier in week of ${weekKey}`,
    icon: tierMeta.icon,
    tier,
    earnedAt: new Date().toISOString(),
    category: 'tier-promotion',
  };
}

export function generateStreakBadge(streakDays: number): Badge {
  const milestones: Record<number, { name: string; icon: string }> = {
    3: { name: '3-Day Spark', icon: '🔥' },
    7: { name: 'Week Warrior', icon: '⚔️' },
    14: { name: 'Fortnight Force', icon: '🛡️' },
    30: { name: 'Monthly Master', icon: '👑' },
    60: { name: 'Iron Will', icon: '⚒️' },
    100: { name: 'Centurion', icon: '🏛️' },
  };
  const m = milestones[streakDays];
  if (!m) return {
    id: `badge_streak_${streakDays}`,
    name: `${streakDays}-Day Streak`,
    description: `Studied ${streakDays} consecutive days`,
    icon: '🔥',
    earnedAt: new Date().toISOString(),
    category: 'streak',
  };
  return {
    id: `badge_streak_${streakDays}`,
    name: m.name,
    description: `Maintained a ${streakDays}-day study streak`,
    icon: m.icon,
    earnedAt: new Date().toISOString(),
    category: 'streak',
  };
}

export function generateMilestoneBadge(totalMocks: number): Badge | null {
  const milestones: Record<number, { name: string; icon: string }> = {
    10: { name: 'First 10 Mocks', icon: '🎯' },
    25: { name: 'Mock Marathoner', icon: '🏃' },
    50: { name: 'Half-Centurion', icon: '🎖️' },
    100: { name: 'Mock Centurion', icon: '🏅' },
    250: { name: 'Mock Legend', icon: '🌟' },
    500: { name: 'Mock Immortal', icon: '💎' },
  };
  const m = milestones[totalMocks];
  if (!m) return null;
  return {
    id: `badge_milestone_${totalMocks}`,
    name: m.name,
    description: `Completed ${totalMocks} mock exams`,
    icon: m.icon,
    earnedAt: new Date().toISOString(),
    category: 'milestone',
  };
}
