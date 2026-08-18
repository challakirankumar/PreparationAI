// ============================================================================
// Peer Battle Mode — Types
// ----------------------------------------------------------------------------
// Real-time 1v1 timed duels between students (or vs bot for solo practice).
// Players answer rapid-fire questions; correct + fast = more points.
// ============================================================================

import type { Question } from '@/lib/types';

export type BattleMode = 'solo-bot' | 'async-duel' | 'squad-vs-squad';
export type BattleStatus = 'pending' | 'active' | 'completed' | 'abandoned';

export interface BattlePlayer {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  // Skill rating (Elo-style, 1000-2000 typical range)
  rating: number;
  // True if this is a bot
  isBot: boolean;
  // Bot accuracy (0-1) — for solo-bot mode
  botAccuracy?: number;
  // Bot response time (ms) — for solo-bot mode
  botResponseTimeMs?: number;
}

export interface BattleQuestion {
  index: number;             // 1-indexed within the battle
  question: Question;
  deliveredAt: string;       // ISO timestamp when question was delivered
  // Player A's response
  playerAResponse?: BattleResponse;
  // Player B's response
  playerBResponse?: BattleResponse;
}

export interface BattleResponse {
  questionId: string;
  answer: 'unanswered' | number | number[]; // mcq optionIndex or msq optionIndices
  correct: boolean;
  timeTakenMs: number;
  pointsEarned: number;
  submittedAt: string;
}

export interface BattleSession {
  id: string;
  mode: BattleMode;
  examId: string;
  examName: string;
  status: BattleStatus;
  playerA: BattlePlayer;     // current user (or challengee)
  playerB: BattlePlayer;     // opponent (or bot)
  // Squad IDs if squad-vs-squad mode
  squadAId?: string;
  squadBId?: string;
  // Battle config
  questionCount: number;
  timePerQuestionSec: number;
  totalDurationSec: number;
  // Question pool
  questions: BattleQuestion[];
  // Current state
  currentQuestionIndex: number;     // 0-indexed
  // Live scores
  playerAScore: number;
  playerBScore: number;
  // Match metadata
  startedAt: string;
  endedAt?: string;
  // Result
  winner?: 'A' | 'B' | 'draw';
  // XP awarded to players
  xpAwardedA?: number;
  xpAwardedB?: number;
  // Rating change (Elo-style)
  ratingChangeA?: number;
  ratingChangeB?: number;
}

export interface BattleLeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  rating: number;
  battlesWon: number;
  battlesLost: number;
  battlesDraw: number;
  totalBattles: number;
  winRate: number;
  totalXp: number;
  weeklyXp: number;
  monthlyXp: number;
  rank: number;
}

export interface StudySquad {
  id: string;
  name: string;
  description: string;
  examGoal: string;
  createdByUserId: string;
  createdAt: string;
  memberIds: string[];
  // Aggregate stats
  totalXp: number;
  weeklyXp: number;
  // Squad badge (auto-assigned based on rating tier)
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  // Squad color (hex)
  color: string;
  // Optional: weekly battle record
  weeklyWins: number;
  weeklyLosses: number;
}

export interface SquadMember {
  userId: string;
  displayName: string;
  joinedAt: string;
  contributionXp: number;
  weeklyContributionXp: number;
}

// ---------------------------------------------------------------------------
// Point calculation — rewards correctness + speed
// ---------------------------------------------------------------------------

export function calculatePoints(
  correct: boolean,
  timeTakenMs: number,
  timeLimitMs: number,
): number {
  if (!correct) return 0;
  // Base points for correct
  const base = 100;
  // Speed bonus: max 50 points if answered in < 25% of time, scaling to 0 at 100%
  const speedRatio = Math.min(1, timeTakenMs / timeLimitMs);
  const speedBonus = Math.round(50 * (1 - speedRatio));
  return base + speedBonus;
}

// ---------------------------------------------------------------------------
// Elo-style rating update
// ---------------------------------------------------------------------------

export function updateRating(
  playerRating: number,
  opponentRating: number,
  result: 'win' | 'loss' | 'draw',
  k = 32,
): number {
  const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const actual = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
  const newRating = Math.round(playerRating + k * (actual - expected));
  // Clamp to [800, 2500]
  return Math.max(800, Math.min(2500, newRating));
}

export function computeRatingChange(
  playerRating: number,
  opponentRating: number,
  result: 'win' | 'loss' | 'draw',
  k = 32,
): number {
  const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const actual = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
  return Math.round(k * (actual - expected));
}

// ---------------------------------------------------------------------------
// Squad tier computation
// ---------------------------------------------------------------------------

export function computeSquadTier(totalXp: number): 'bronze' | 'silver' | 'gold' | 'diamond' {
  if (totalXp >= 10000) return 'diamond';
  if (totalXp >= 5000) return 'gold';
  if (totalXp >= 2000) return 'silver';
  return 'bronze';
}

export const SQUAD_TIER_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#d4af37',
  diamond: '#b9f2ff',
};

// ---------------------------------------------------------------------------
// XP award computation
// ---------------------------------------------------------------------------

export function computeXpAward(
  result: 'win' | 'loss' | 'draw',
  score: number,
  opponentScore: number,
  mode: BattleMode,
): number {
  let base = 50;  // participation XP
  if (result === 'win') base += 100;
  else if (result === 'draw') base += 50;
  // Margin bonus
  const margin = score - opponentScore;
  if (margin > 0) base += Math.min(50, Math.round(margin / 10));
  // Mode multiplier
  if (mode === 'squad-vs-squad') base = Math.round(base * 1.5);
  else if (mode === 'async-duel') base = Math.round(base * 1.2);
  return base;
}
