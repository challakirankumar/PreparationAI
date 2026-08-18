'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared';
import { useStore } from '@/lib/store';
import {
  Trophy, Crown, Award, Star, Flame, Shield, Sparkles, Loader2,
  TrendingUp, TrendingDown, Minus, Target, Zap, Gem, Medal,
  CheckCircle2, Clock, Calendar,
} from 'lucide-react';

// ============================================================================
// Types matching API responses
// ============================================================================

type Tier = 'bronze' | 'silver' | 'gold' | 'diamond';

interface LeaguePlayer {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  tier: Tier;
  weeklyXp: number;
  rankInTier: number;
  tierSize: number;
  progressToNextTier: number;
  xpToNextTier: number;
  lastWeekTier: Tier;
  streakProtectionTokens: number;
  weeksByTier: Record<Tier, number>;
  highestTierAchieved: Tier;
  badges: Badge[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier?: Tier;
  earnedAt: string;
  category: 'tier-promotion' | 'streak' | 'milestone' | 'special';
}

interface CohortStanding {
  tier: Tier;
  weekStart: string;
  weekEnd: string;
  players: {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    weeklyXp: number;
    rankInTier: number;
    projectedChange: 'promote' | 'demote' | 'stay';
  }[];
  totalPlayers: number;
  avgXp: number;
  topXp: number;
}

interface RewardGrant {
  id: string;
  userId: string;
  rewardType: 'badge' | 'streak_protection' | 'profile_flair' | 'feature_access' | 'squad_banner';
  description: string;
  grantedAt: string;
  expiresAt?: string;
  used?: boolean;
  usedAt?: string;
  metadata?: { tier?: Tier; weekStart?: string };
}

interface WeeklyResetEvent {
  weekStart: string;
  weekEnd: string;
  tierBefore: Tier;
  tierAfter: Tier;
  change: 'promoted' | 'demoted' | 'stayed';
  weeklyXpEarned: number;
  rewards: string[];
  streakProtectionUsed: boolean;
}

// ============================================================================
// Tier metadata
// ============================================================================

const TIER_META: Record<Tier, {
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  icon: string;
  gradient: string;
  threshold: number;
}> = {
  bronze: {
    label: 'Bronze',
    color: '#cd7f32',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-300',
    icon: '🥉',
    gradient: 'from-orange-400 to-amber-500',
    threshold: 0,
  },
  silver: {
    label: 'Silver',
    color: '#c0c0c0',
    bgClass: 'bg-stone-100',
    textClass: 'text-stone-700',
    borderClass: 'border-stone-400',
    icon: '🥈',
    gradient: 'from-stone-400 to-stone-500',
    threshold: 200,
  },
  gold: {
    label: 'Gold',
    color: '#d4af37',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-400',
    icon: '🥇',
    gradient: 'from-amber-400 to-yellow-500',
    threshold: 600,
  },
  diamond: {
    label: 'Diamond',
    color: '#b9f2ff',
    bgClass: 'bg-cyan-50',
    textClass: 'text-cyan-700',
    borderClass: 'border-cyan-400',
    icon: '💎',
    gradient: 'from-cyan-400 to-blue-500',
    threshold: 1200,
  },
};

const TIER_ORDER: Tier[] = ['bronze', 'silver', 'gold', 'diamond'];

const PROJECTED_CHANGE_META = {
  promote: { label: '↑ Promote', color: 'text-emerald-600', icon: <TrendingUp className="h-3 w-3" /> },
  demote: { label: '↓ Demote', color: 'text-rose-600', icon: <TrendingDown className="h-3 w-3" /> },
  stay: { label: '→ Stay', color: 'text-stone-500', icon: <Minus className="h-3 w-3" /> },
};

// ============================================================================
// Main view
// ============================================================================

export function LeagueSystemView() {
  const user = useStore(s => s.user);
  const userId = user?.id ?? 'demo_p1';  // default to top diamond player for demo
  const [player, setPlayer] = useState<LeaguePlayer | null>(null);
  const [standings, setStandings] = useState<Record<Tier, CohortStanding> | null>(null);
  const [currentTierStandings, setCurrentTierStandings] = useState<CohortStanding | null>(null);
  const [rewards, setRewards] = useState<RewardGrant[]>([]);
  const [streakTokens, setStreakTokens] = useState(0);
  const [history, setHistory] = useState<WeeklyResetEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingToken, setUsingToken] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [standingsR, rewardsR, historyR] = await Promise.all([
        fetch(`/api/league/standings?userId=${userId}`),
        fetch(`/api/league/rewards?userId=${userId}`),
        fetch(`/api/league/history?userId=${userId}`),
      ]);
      if (standingsR.ok) {
        const j = await standingsR.json();
        setPlayer(j.player);
        setStandings(j.standings);
        setCurrentTierStandings(j.currentTierStandings);
      }
      if (rewardsR.ok) {
        const j = await rewardsR.json();
        setRewards(j.rewards ?? []);
        setStreakTokens(j.streakProtectionTokens ?? 0);
      }
      if (historyR.ok) {
        const j = await historyR.json();
        setHistory(j.history ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleUseStreakToken = async () => {
    setUsingToken(true);
    try {
      await fetch('/api/league/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'use_streak_protection' }),
      });
      load();
    } finally {
      setUsingToken(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-stone-600">Loading league standings…</p>
      </div>
    );
  }

  if (!player || !standings) {
    return <Card className="p-8 text-center text-stone-500">Failed to load league data.</Card>;
  }

  const tierMeta = TIER_META[player.tier];

  return (
    <div className="space-y-6">
      <PageHeader
        title="League System"
        subtitle="Compete in weekly cohorts — Bronze → Silver → Gold → Diamond. Top performers promote, bottom performers demote."
        accent="blue"
        icon={Trophy}
      />

      {/* Hero card with current tier */}
      <Card className={`p-6 border-2 ${tierMeta.borderClass} bg-gradient-to-br ${tierMeta.gradient}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl">
              {tierMeta.icon}
            </div>
            <div className="text-white">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold">{tierMeta.label} Tier</h2>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur">
                  Rank #{player.rankInTier} / {player.tierSize}
                </Badge>
              </div>
              <p className="text-sm opacity-90 mt-1">{player.displayName}</p>
              <p className="text-xs opacity-75 mt-0.5">
                Highest tier: {TIER_META[player.highestTierAchieved].label} ·
                Weeks in {tierMeta.label}: {player.weeksByTier[player.tier]}
              </p>
            </div>
          </div>
          <div className="text-right text-white">
            <p className="text-xs opacity-75 uppercase font-semibold">Weekly XP</p>
            <p className="text-3xl font-bold tabular-nums">{player.weeklyXp}</p>
            <p className="text-xs opacity-75 mt-1">
              {player.xpToNextTier > 0
                ? `${player.xpToNextTier} XP to ${TIER_META[tierNext(player.tier)].label}`
                : 'Max tier reached! 🎉'}
            </p>
          </div>
        </div>

        {/* Progress bar to next tier */}
        <div className="mt-4">
          <Progress value={player.progressToNextTier} className="h-2 bg-white/20" />
          <p className="text-xs text-white/80 mt-1">
            {player.progressToNextTier}% to next tier
          </p>
        </div>

        {/* Streak protection tokens */}
        {player.streakProtectionTokens > 0 && (
          <div className="mt-3 flex items-center gap-2 p-2 rounded bg-white/20 backdrop-blur">
            <Shield className="h-4 w-4 text-white" />
            <span className="text-sm text-white">
              {player.streakProtectionTokens} streak protection token{player.streakProtectionTokens === 1 ? '' : 's'} available
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleUseStreakToken}
              disabled={usingToken || streakTokens === 0}
              className="ml-auto bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              {usingToken ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
              Use Token
            </Button>
          </div>
        )}
      </Card>

      <Tabs defaultValue="standings">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="standings"><Trophy className="h-4 w-4 mr-1 inline" />Standings</TabsTrigger>
          <TabsTrigger value="rewards"><Award className="h-4 w-4 mr-1 inline" />Rewards</TabsTrigger>
          <TabsTrigger value="badges"><Medal className="h-4 w-4 mr-1 inline" />Badges</TabsTrigger>
          <TabsTrigger value="history"><Calendar className="h-4 w-4 mr-1 inline" />History</TabsTrigger>
        </TabsList>

        {/* Standings tab */}
        <TabsContent value="standings" className="space-y-4">
          {currentTierStandings && (
            <Card className="p-4 border-blue-200">
              <h3 className="font-semibold text-stone-800 mb-1 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Your Tier — {tierMeta.label} {tierMeta.icon}
              </h3>
              <p className="text-xs text-stone-500 mb-3">
                Week of {currentTierStandings.weekStart} → {currentTierStandings.weekEnd} ·
                {currentTierStandings.totalPlayers} players · Avg {currentTierStandings.avgXp} XP · Top {currentTierStandings.topXp} XP
              </p>
              <CohortList standing={currentTierStandings} currentUserId={userId} />
            </Card>
          )}

          {/* All tiers overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {TIER_ORDER.map(tier => {
              const standing = standings[tier];
              const meta = TIER_META[tier];
              return (
                <Card key={tier} className={`p-3 ${meta.borderClass} border-2`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{meta.icon}</span>
                    <Badge variant="outline" className={`text-xs ${meta.bgClass} ${meta.textClass} ${meta.borderClass} border`}>
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-500 mb-1">Cohort size</p>
                  <p className="text-2xl font-bold tabular-nums text-stone-800">{standing.totalPlayers}</p>
                  <p className="text-xs text-stone-500 mt-1">Avg {standing.avgXp} XP</p>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Rewards tab */}
        <TabsContent value="rewards" className="space-y-4">
          <Card className="p-5 border-blue-200">
            <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Your Rewards ({rewards.length})
            </h3>
            {rewards.length === 0 ? (
              <p className="text-sm text-stone-400 italic">No rewards earned yet. Promote to a higher tier to unlock rewards!</p>
            ) : (
              <div className="space-y-2">
                {rewards.map(r => (
                  <RewardCard key={r.id} reward={r} />
                ))}
              </div>
            )}
          </Card>

          {/* Tier rewards catalog */}
          <Card className="p-5 border-blue-200">
            <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Rewards by Tier
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TIER_ORDER.map(tier => {
                const meta = TIER_META[tier];
                const tierRewards = TIER_REWARDS[tier];
                const isCurrent = player.tier === tier;
                const isUnlocked = TIER_ORDER.indexOf(player.tier) >= TIER_ORDER.indexOf(tier);
                return (
                  <Card
                    key={tier}
                    className={`p-3 ${meta.borderClass} border-2 ${isCurrent ? 'ring-2 ring-blue-300' : ''} ${!isUnlocked ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{meta.icon}</span>
                        <span className={`font-semibold ${meta.textClass}`}>{meta.label}</span>
                        {isCurrent && <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs">Current</Badge>}
                        {!isUnlocked && <Badge variant="outline" className="text-xs bg-stone-100 text-stone-500 border-stone-300">Locked</Badge>}
                      </div>
                      <span className="text-xs text-stone-500">{meta.threshold}+ XP/week</span>
                    </div>
                    <ul className="space-y-1">
                      {tierRewards.map((r, i) => (
                        <li key={i} className="text-xs text-stone-700 flex items-start gap-1">
                          {isUnlocked ? <CheckCircle2 className="h-3 w-3 mt-0.5 text-emerald-500 flex-shrink-0" /> : <span className="text-stone-400 flex-shrink-0">🔒</span>}
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Badges tab */}
        <TabsContent value="badges" className="space-y-4">
          <Card className="p-5 border-blue-200">
            <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <Medal className="h-5 w-5 text-amber-500" />
              Earned Badges ({player.badges.length})
            </h3>
            {player.badges.length === 0 ? (
              <p className="text-sm text-stone-400 italic">No badges yet. Take mocks, maintain streaks, and promote tiers to earn badges!</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {player.badges.map(badge => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* History tab */}
        <TabsContent value="history" className="space-y-4">
          <Card className="p-5 border-blue-200">
            <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Weekly Reset History ({history.length})
            </h3>
            {history.length === 0 ? (
              <p className="text-sm text-stone-400 italic">No history yet — your weekly resets will appear here.</p>
            ) : (
              <div className="space-y-3">
                {[...history].reverse().map((event, idx) => (
                  <HistoryCard key={idx} event={event} />
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function tierNext(tier: Tier): Tier {
  const idx = TIER_ORDER.indexOf(tier);
  return idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : tier;
}

// ============================================================================
// Cohort list — players within a tier
// ============================================================================

function CohortList({ standing, currentUserId }: { standing: CohortStanding; currentUserId: string }) {
  return (
    <div className="space-y-1">
      {standing.players.map(p => {
        const isMe = p.userId === currentUserId;
        const projMeta = PROJECTED_CHANGE_META[p.projectedChange];
        return (
          <div
            key={p.userId}
            className={`flex items-center gap-3 p-2 rounded ${
              isMe ? 'bg-blue-50 border border-blue-300' : 'hover:bg-stone-50'
            }`}
          >
            <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
              p.rankInTier === 1 ? 'bg-amber-100 text-amber-700' :
              p.rankInTier === 2 ? 'bg-stone-200 text-stone-700' :
              p.rankInTier === 3 ? 'bg-orange-100 text-orange-700' :
              'bg-stone-100 text-stone-600'
            }`}>
              {p.rankInTier}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">
                {p.displayName} {isMe && <span className="text-xs text-blue-600">(you)</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tabular-nums text-stone-700">{p.weeklyXp} XP</span>
              <Badge variant="outline" className={`text-xs ${projMeta.color} border-current`}>
                {projMeta.icon}
                <span className="ml-1">{projMeta.label}</span>
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Reward card
// ============================================================================

function RewardCard({ reward }: { reward: RewardGrant }) {
  const icon = reward.rewardType === 'streak_protection' ? <Shield className="h-5 w-5 text-blue-500" /> :
    reward.rewardType === 'badge' ? <Medal className="h-5 w-5 text-amber-500" /> :
    reward.rewardType === 'feature_access' ? <Sparkles className="h-5 w-5 text-purple-500" /> :
    reward.rewardType === 'profile_flair' ? <Star className="h-5 w-5 text-pink-500" /> :
    <Award className="h-5 w-5 text-stone-500" />;

  const expired = reward.expiresAt && new Date(reward.expiresAt) < new Date();
  const used = reward.used;

  return (
    <div className={`p-3 rounded-lg border ${used || expired ? 'bg-stone-50 border-stone-200 opacity-60' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-800">{reward.description}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-stone-500">
              Granted: {new Date(reward.grantedAt).toLocaleDateString()}
            </span>
            {reward.expiresAt && (
              <Badge variant="outline" className={`text-xs ${expired ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                <Clock className="h-3 w-3 mr-1" />
                {expired ? 'Expired' : `Expires ${new Date(reward.expiresAt).toLocaleDateString()}`}
              </Badge>
            )}
            {used && (
              <Badge variant="outline" className="text-xs bg-stone-100 text-stone-600 border-stone-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />Used
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Badge card
// ============================================================================

function BadgeCard({ badge }: { badge: Badge }) {
  const tierMeta = badge.tier ? TIER_META[badge.tier] : null;
  return (
    <div className={`p-3 rounded-lg border-2 text-center ${tierMeta ? tierMeta.borderClass : 'border-stone-200'} ${tierMeta ? tierMeta.bgClass : 'bg-stone-50'}`}>
      <div className="text-3xl mb-1">{badge.icon}</div>
      <p className="text-xs font-semibold text-stone-800">{badge.name}</p>
      <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-2">{badge.description}</p>
      <Badge variant="outline" className={`text-[10px] mt-1 capitalize ${tierMeta ? tierMeta.textClass : 'text-stone-600'} border-current`}>
        {badge.category.replace('-', ' ')}
      </Badge>
    </div>
  );
}

// ============================================================================
// History card
// ============================================================================

function HistoryCard({ event }: { event: WeeklyResetEvent }) {
  const changeMeta = {
    promoted: { label: 'Promoted', color: 'text-emerald-600', icon: <TrendingUp className="h-4 w-4" />, bg: 'bg-emerald-50 border-emerald-200' },
    demoted: { label: 'Demoted', color: 'text-rose-600', icon: <TrendingDown className="h-4 w-4" />, bg: 'bg-rose-50 border-rose-200' },
    stayed: { label: 'Stayed', color: 'text-stone-600', icon: <Minus className="h-4 w-4" />, bg: 'bg-stone-50 border-stone-200' },
  }[event.change];

  return (
    <div className={`p-3 rounded-lg border ${changeMeta.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {changeMeta.icon}
          <span className={`font-semibold text-sm ${changeMeta.color}`}>{changeMeta.label}</span>
        </div>
        <span className="text-xs text-stone-500">
          {new Date(event.weekStart).toLocaleDateString()} → {new Date(event.weekEnd).toLocaleDateString()}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-xs">
          {TIER_META[event.tierBefore].icon} {TIER_META[event.tierBefore].label}
        </Badge>
        <span className="text-stone-400">→</span>
        <Badge variant="outline" className={`text-xs ${TIER_META[event.tierAfter].textClass} ${TIER_META[event.tierAfter].borderClass} border`}>
          {TIER_META[event.tierAfter].icon} {TIER_META[event.tierAfter].label}
        </Badge>
        <span className="text-xs text-stone-500 ml-auto">{event.weeklyXpEarned} XP earned</span>
      </div>
      {event.rewards.length > 0 && (
        <div className="text-xs text-stone-600">
          <span className="font-semibold">Rewards:</span> {event.rewards.join(', ')}
        </div>
      )}
      {event.streakProtectionUsed && (
        <Badge variant="outline" className="text-xs mt-1 bg-blue-50 text-blue-700 border-blue-200">
          <Shield className="h-3 w-3 mr-1" />Streak protection used
        </Badge>
      )}
    </div>
  );
}

// ============================================================================
// Static reward catalog (mirrors TIERS.rewards from types.ts)
// ============================================================================

const TIER_REWARDS: Record<Tier, string[]> = {
  bronze: [
    'Bronze badge on profile',
    'Access to public leaderboards',
    'Daily streak tracking',
  ],
  silver: [
    'Silver badge on profile',
    'Custom profile color (silver)',
    'Weekly XP boost: +5%',
    'Access to peer battles',
  ],
  gold: [
    'Gold badge on profile',
    'Custom profile color (gold)',
    'Weekly XP boost: +10%',
    '1 streak protection token / week',
    'Priority doubt-solver queue',
    'Squad banner upgrade',
  ],
  diamond: [
    'Diamond badge on profile',
    'Custom profile color (diamond)',
    'Weekly XP boost: +15%',
    '2 streak protection tokens / week',
    'Instant doubt-solver priority',
    'Diamond squad banner',
    'Early access to new features',
    'Mentor status — featured on leaderboard',
  ],
};
