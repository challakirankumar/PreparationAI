// ============================================================================
// Battle Session Manager + Leaderboard + Squads
// ----------------------------------------------------------------------------
// In-memory store for active battles, player stats, leaderboard, and squads.
// In production: swap to Redis/DB. For dev: globalThis survives HMR.
// ============================================================================

import type { BattleSession, BattlePlayer, BattleQuestion, BattleLeaderboardEntry, StudySquad, SquadMember } from './types';
import { calculatePoints, updateRating, computeRatingChange, computeXpAward, computeSquadTier, SQUAD_TIER_COLORS } from './types';
import { generateBattleQuestions, pickBotOpponent, simulateBotAnswer, gradeBattleAnswer, type BotPersonality } from './question-pool';
import type { Question } from '@/lib/types';

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

interface BattleStore {
  battles: Map<string, BattleSession>;
  // userId -> BattlePlayer (for matchmaking + leaderboard)
  players: Map<string, BattlePlayer & { battlesWon: number; battlesLost: number; battlesDraw: number; totalXp: number; weeklyXp: number; monthlyXp: number; xpHistory: { date: string; xp: number }[] }>;
  squads: Map<string, StudySquad>;
  // userId -> squadId
  playerSquad: Map<string, string>;
}

declare global {
  // eslint-disable-next-line no-var
  var __battle_store__: BattleStore | undefined;
}

function getStore(): BattleStore {
  if (!globalThis.__battle_store__) {
    const store: BattleStore = {
      battles: new Map(),
      players: new Map(),
      squads: new Map(),
      playerSquad: new Map(),
    };
    // Seed a few demo squads + leaderboard entries
    seedDemoData(store);
    globalThis.__battle_store__ = store;
  }
  return globalThis.__battle_store__;
}

function seedDemoData(store: BattleStore) {
  // Demo leaderboard players
  const demoPlayers = [
    { userId: 'demo_p1', displayName: 'Aarav Sharma', rating: 1480, battlesWon: 32, battlesLost: 18, battlesDraw: 4, totalXp: 4250, weeklyXp: 320, monthlyXp: 1180 },
    { userId: 'demo_p2', displayName: 'Diya Patel', rating: 1520, battlesWon: 41, battlesLost: 22, battlesDraw: 6, totalXp: 5180, weeklyXp: 450, monthlyXp: 1420 },
    { userId: 'demo_p3', displayName: 'Vivaan Reddy', rating: 1390, battlesWon: 28, battlesLost: 24, battlesDraw: 3, totalXp: 3680, weeklyXp: 280, monthlyXp: 920 },
    { userId: 'demo_p4', displayName: 'Ananya Iyer', rating: 1610, battlesWon: 47, battlesLost: 19, battlesDraw: 5, totalXp: 6120, weeklyXp: 580, monthlyXp: 1640 },
    { userId: 'demo_p5', displayName: 'Aditya Nair', rating: 1450, battlesWon: 35, battlesLost: 25, battlesDraw: 4, totalXp: 4520, weeklyXp: 340, monthlyXp: 1080 },
    { userId: 'demo_p6', displayName: 'Saanvi Gupta', rating: 1580, battlesWon: 44, battlesLost: 21, battlesDraw: 7, totalXp: 5680, weeklyXp: 490, monthlyXp: 1520 },
    { userId: 'demo_p7', displayName: 'Arjun Mehta', rating: 1320, battlesWon: 22, battlesLost: 28, battlesDraw: 5, totalXp: 2980, weeklyXp: 210, monthlyXp: 720 },
    { userId: 'demo_p8', displayName: 'Ishaan Verma', rating: 1240, battlesWon: 18, battlesLost: 31, battlesDraw: 3, totalXp: 2410, weeklyXp: 160, monthlyXp: 580 },
  ];
  for (const p of demoPlayers) {
    store.players.set(p.userId, {
      userId: p.userId,
      displayName: p.displayName,
      rating: p.rating,
      isBot: false,
      battlesWon: p.battlesWon,
      battlesLost: p.battlesLost,
      battlesDraw: p.battlesDraw,
      totalXp: p.totalXp,
      weeklyXp: p.weeklyXp,
      monthlyXp: p.monthlyXp,
      xpHistory: [],
    });
  }

  // Demo squads
  const demoSquads = [
    {
      id: 'squad_demo1',
      name: 'Photon Squad',
      description: 'JEE Physics enthusiasts — we battle every weekend',
      examGoal: 'jee-main',
      createdByUserId: 'demo_p1',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      memberIds: ['demo_p1', 'demo_p3', 'demo_p5'],
      totalXp: 10900,
      weeklyXp: 850,
      weeklyWins: 8,
      weeklyLosses: 3,
    },
    {
      id: 'squad_demo2',
      name: 'Chem Catalysts',
      description: 'NEET chemistry dream team 🔬',
      examGoal: 'neet',
      createdByUserId: 'demo_p2',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      memberIds: ['demo_p2', 'demo_p4', 'demo_p7'],
      totalXp: 14280,
      weeklyXp: 1140,
      weeklyWins: 11,
      weeklyLosses: 4,
    },
    {
      id: 'squad_demo3',
      name: 'Quant Quokkas',
      description: 'CAT prep — fun, fast, and competitive',
      examGoal: 'cat',
      createdByUserId: 'demo_p6',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      memberIds: ['demo_p6', 'demo_p8'],
      totalXp: 5390,
      weeklyXp: 370,
      weeklyWins: 4,
      weeklyLosses: 5,
    },
  ];
  for (const s of demoSquads) {
    store.squads.set(s.id, {
      ...s,
      tier: computeSquadTier(s.totalXp),
      color: SQUAD_TIER_COLORS[computeSquadTier(s.totalXp)],
    });
    // Register squad membership
    for (const memberId of s.memberIds) {
      store.playerSquad.set(memberId, s.id);
    }
  }
}

// ---------------------------------------------------------------------------
// Player profile management
// ---------------------------------------------------------------------------

export function getOrCreatePlayer(userId: string, displayName: string): BattlePlayer & { battlesWon: number; battlesLost: number; battlesDraw: number; totalXp: number; weeklyXp: number; monthlyXp: number; xpHistory: { date: string; xp: number }[] } {
  const store = getStore();
  let p = store.players.get(userId);
  if (!p) {
    p = {
      userId,
      displayName,
      rating: 1000,
      isBot: false,
      battlesWon: 0,
      battlesLost: 0,
      battlesDraw: 0,
      totalXp: 0,
      weeklyXp: 0,
      monthlyXp: 0,
      xpHistory: [],
    };
    store.players.set(userId, p);
  }
  return p;
}

// ---------------------------------------------------------------------------
// Start a new battle
// ---------------------------------------------------------------------------

export interface StartBattleInput {
  mode: 'solo-bot' | 'async-duel';
  examId: string;
  userId: string;
  displayName: string;
  questionCount?: number;       // default 10
  timePerQuestionSec?: number;  // default 30
  // For async-duel mode (future): opponentUserId
  opponentUserId?: string;
}

export function startBattle(input: StartBattleInput): BattleSession {
  const store = getStore();
  const playerA = getOrCreatePlayer(input.userId, input.displayName);
  const questionCount = input.questionCount ?? 10;
  const timePerQuestionSec = input.timePerQuestionSec ?? 30;

  // Generate questions
  const questions = generateBattleQuestions(input.examId, questionCount);
  if (questions.length === 0) {
    throw new Error(`Could not generate any questions for exam: ${input.examId}`);
  }

  // Pick opponent
  let playerB: BattlePlayer;
  let botPersonality: BotPersonality | undefined;
  if (input.mode === 'solo-bot' || !input.opponentUserId) {
    botPersonality = pickBotOpponent(playerA.rating);
    playerB = {
      userId: `bot_${botPersonality.name.replace(/\s+/g, '_').toLowerCase()}`,
      displayName: botPersonality.name,
      rating: botPersonality.rating,
      isBot: true,
      botAccuracy: botPersonality.accuracy,
      botResponseTimeMs: botPersonality.responseTimeMs,
    };
  } else {
    playerB = getOrCreatePlayer(input.opponentUserId, 'Opponent');
  }

  const battleId = `battle_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const pattern = questions[0]; // any question's subject/examId we can use

  const battle: BattleSession = {
    id: battleId,
    mode: input.mode === 'solo-bot' ? 'solo-bot' : 'async-duel',
    examId: input.examId,
    examName: getExamName(input.examId),
    status: 'active',
    playerA: {
      userId: playerA.userId,
      displayName: playerA.displayName,
      avatarUrl: (playerA as any).avatarUrl,
      rating: playerA.rating,
      isBot: false,
    },
    playerB,
    questionCount,
    timePerQuestionSec,
    totalDurationSec: questionCount * timePerQuestionSec,
    questions: questions.map((q, idx) => ({
      index: idx,
      question: q,
      deliveredAt: now,
    })),
    currentQuestionIndex: 0,
    playerAScore: 0,
    playerBScore: 0,
    startedAt: now,
  };

  // For bot battles, simulate the bot's answers immediately (player will see results as they progress)
  if (botPersonality) {
    for (const bq of battle.questions) {
      const botResult = simulateBotAnswer(bq.question, botPersonality);
      bq.playerBResponse = {
        questionId: bq.question.id,
        answer: botResult.correct ? (bq.question.correctOptions?.[0] ?? 'unanswered') : 'unanswered',
        correct: botResult.correct,
        timeTakenMs: botResult.responseTimeMs,
        pointsEarned: calculatePoints(botResult.correct, botResult.responseTimeMs, timePerQuestionSec * 1000),
        submittedAt: new Date(Date.now() + botResult.responseTimeMs).toISOString(),
      };
      battle.playerBScore += bq.playerBResponse.pointsEarned;
    }
  }

  store.battles.set(battleId, battle);
  return battle;
}

function getExamName(examId: string): string {
  // Map common exam IDs to display names
  const names: Record<string, string> = {
    'jee-main': 'JEE Main',
    'neet': 'NEET',
    'gate': 'GATE CS',
    'cat': 'CAT',
    'gre': 'GRE',
    'gmat': 'GMAT',
    'sat': 'SAT',
    'ielts': 'IELTS',
    'toefl': 'TOEFL',
    'upsc': 'UPSC CSE',
  };
  return names[examId] ?? examId.toUpperCase();
}

// ---------------------------------------------------------------------------
// Get a battle by ID
// ---------------------------------------------------------------------------

export function getBattle(battleId: string): BattleSession | undefined {
  return getStore().battles.get(battleId);
}

// ---------------------------------------------------------------------------
// Submit a player's answer for the current question
// ---------------------------------------------------------------------------

export interface SubmitAnswerInput {
  battleId: string;
  questionId: string;
  answer: 'unanswered' | number | number[];
  timeTakenMs: number;
}

export interface SubmitAnswerResult {
  battle: BattleSession;
  correct: boolean;
  pointsEarned: number;
  opponentCorrect: boolean;
  opponentPointsEarned: number;
  scoreA: number;
  scoreB: number;
  currentQuestionIndex: number;
  nextQuestion: Question | null;
  battleEnded: boolean;
  winner?: 'A' | 'B' | 'draw';
}

export function submitAnswer(input: SubmitAnswerInput): SubmitAnswerResult {
  const store = getStore();
  const battle = store.battles.get(input.battleId);
  if (!battle) {
    throw new Error(`Battle not found: ${input.battleId}`);
  }
  if (battle.status !== 'active') {
    throw new Error(`Battle is not active (status: ${battle.status})`);
  }

  const currentBQ = battle.questions[battle.currentQuestionIndex];
  if (!currentBQ || currentBQ.question.id !== input.questionId) {
    throw new Error(`Question mismatch: expected ${currentBQ?.question.id}, got ${input.questionId}`);
  }

  // Grade player A's answer
  const correctA = gradeBattleAnswer(currentBQ.question, input.answer);
  const pointsA = calculatePoints(correctA, input.timeTakenMs, battle.timePerQuestionSec * 1000);

  currentBQ.playerAResponse = {
    questionId: input.questionId,
    answer: input.answer,
    correct: correctA,
    timeTakenMs: input.timeTakenMs,
    pointsEarned: pointsA,
    submittedAt: new Date().toISOString(),
  };

  battle.playerAScore += pointsA;

  // For bot battles, the bot's response is already pre-computed (in startBattle)
  // For async-duel, the opponent hasn't answered yet (this is async — TBD)

  const opponentCorrect = currentBQ.playerBResponse?.correct ?? false;
  const opponentPointsEarned = currentBQ.playerBResponse?.pointsEarned ?? 0;

  // Advance to next question
  battle.currentQuestionIndex += 1;
  const nextQuestion = battle.currentQuestionIndex < battle.questions.length
    ? battle.questions[battle.currentQuestionIndex].question
    : null;

  // Check end of battle
  let battleEnded = false;
  let winner: 'A' | 'B' | 'draw' | undefined;
  if (battle.currentQuestionIndex >= battle.questions.length) {
    battleEnded = true;
    battle.status = 'completed';
    battle.endedAt = new Date().toISOString();
    if (battle.playerAScore > battle.playerBScore) winner = 'A';
    else if (battle.playerBScore > battle.playerAScore) winner = 'B';
    else winner = 'draw';
    battle.winner = winner;

    // Update player stats + ratings + XP
    finalizeBattle(battle, winner);
  }

  return {
    battle,
    correct: correctA,
    pointsEarned: pointsA,
    opponentCorrect,
    opponentPointsEarned,
    scoreA: battle.playerAScore,
    scoreB: battle.playerBScore,
    currentQuestionIndex: battle.currentQuestionIndex,
    nextQuestion,
    battleEnded,
    winner,
  };
}

// ---------------------------------------------------------------------------
// Finalize battle — update player stats, ratings, XP
// ---------------------------------------------------------------------------

function finalizeBattle(battle: BattleSession, winner: 'A' | 'B' | 'draw') {
  const store = getStore();
  const playerA = store.players.get(battle.playerA.userId);
  if (!playerA) return;

  const result: 'win' | 'loss' | 'draw' = winner === 'A' ? 'win' : winner === 'B' ? 'loss' : 'draw';

  // Update battle counts
  if (result === 'win') playerA.battlesWon++;
  else if (result === 'loss') playerA.battlesLost++;
  else playerA.battlesDraw++;

  // Update rating
  const oldRating = playerA.rating;
  playerA.rating = updateRating(playerA.rating, battle.playerB.rating, result);
  battle.ratingChangeA = playerA.rating - oldRating;

  // Award XP
  const xpAward = computeXpAward(result, battle.playerAScore, battle.playerBScore, battle.mode);
  battle.xpAwardedA = xpAward;
  playerA.totalXp += xpAward;
  playerA.weeklyXp += xpAward;
  playerA.monthlyXp += xpAward;
  playerA.xpHistory.push({ date: new Date().toISOString(), xp: xpAward });

  // If player B is also a real player (async-duel), update their stats too
  if (!battle.playerB.isBot) {
    const playerB = store.players.get(battle.playerB.userId);
    if (playerB) {
      const resultB: 'win' | 'loss' | 'draw' = winner === 'B' ? 'win' : winner === 'A' ? 'loss' : 'draw';
      if (resultB === 'win') playerB.battlesWon++;
      else if (resultB === 'loss') playerB.battlesLost++;
      else playerB.battlesDraw++;
      const oldBRating = playerB.rating;
      playerB.rating = updateRating(playerB.rating, battle.playerA.rating, resultB);
      battle.ratingChangeB = playerB.rating - oldBRating;
      const xpB = computeXpAward(resultB, battle.playerBScore, battle.playerAScore, battle.mode);
      battle.xpAwardedB = xpB;
      playerB.totalXp += xpB;
      playerB.weeklyXp += xpB;
      playerB.monthlyXp += xpB;
      playerB.xpHistory.push({ date: new Date().toISOString(), xp: xpB });
    }
  }

  // Update squad stats (if player A is in a squad)
  const squadId = store.playerSquad.get(playerA.userId);
  if (squadId) {
    const squad = store.squads.get(squadId);
    if (squad) {
      squad.totalXp += xpAward;
      squad.weeklyXp += xpAward;
      if (result === 'win') squad.weeklyWins++;
      else if (result === 'loss') squad.weeklyLosses++;
      squad.tier = computeSquadTier(squad.totalXp);
      squad.color = SQUAD_TIER_COLORS[squad.tier];
    }
  }
}

// ---------------------------------------------------------------------------
// Get the leaderboard
// ---------------------------------------------------------------------------

export function getLeaderboard(limit = 50): BattleLeaderboardEntry[] {
  const store = getStore();
  const entries: BattleLeaderboardEntry[] = [];
  for (const p of store.players.values()) {
    if (p.isBot) continue; // exclude bots from leaderboard
    const totalBattles = p.battlesWon + p.battlesLost + p.battlesDraw;
    const winRate = totalBattles > 0 ? Math.round((p.battlesWon / totalBattles) * 100) : 0;
    entries.push({
      userId: p.userId,
      displayName: p.displayName,
      avatarUrl: (p as any).avatarUrl,
      rating: p.rating,
      battlesWon: p.battlesWon,
      battlesLost: p.battlesLost,
      battlesDraw: p.battlesDraw,
      totalBattles,
      winRate,
      totalXp: p.totalXp,
      weeklyXp: p.weeklyXp,
      monthlyXp: p.monthlyXp,
      rank: 0,
    });
  }
  // Sort by rating desc
  entries.sort((a, b) => b.rating - a.rating);
  // Assign ranks
  entries.forEach((e, idx) => { e.rank = idx + 1; });
  return entries.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Get player's own battle history
// ---------------------------------------------------------------------------

export function getPlayerBattles(userId: string): BattleSession[] {
  const store = getStore();
  const battles: BattleSession[] = [];
  for (const b of store.battles.values()) {
    if (b.playerA.userId === userId || b.playerB.userId === userId) {
      battles.push(b);
    }
  }
  battles.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  return battles.slice(0, 20);
}

// ---------------------------------------------------------------------------
// Squad management
// ---------------------------------------------------------------------------

export function listSquads(): StudySquad[] {
  return Array.from(getStore().squads.values());
}

export function getSquad(squadId: string): StudySquad | undefined {
  return getStore().squads.get(squadId);
}

export function getPlayerSquad(userId: string): StudySquad | undefined {
  const store = getStore();
  const squadId = store.playerSquad.get(userId);
  if (!squadId) return undefined;
  return store.squads.get(squadId);
}

export function createSquad(input: { name: string; description: string; examGoal: string; createdByUserId: string; createdByDisplayName: string }): StudySquad {
  const store = getStore();
  const squadId = `squad_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const squad: StudySquad = {
    id: squadId,
    name: input.name,
    description: input.description,
    examGoal: input.examGoal,
    createdByUserId: input.createdByUserId,
    createdAt: new Date().toISOString(),
    memberIds: [input.createdByUserId],
    totalXp: 0,
    weeklyXp: 0,
    tier: 'bronze',
    color: SQUAD_TIER_COLORS.bronze,
    weeklyWins: 0,
    weeklyLosses: 0,
  };
  store.squads.set(squadId, squad);
  // Remove player from previous squad
  const previousSquadId = store.playerSquad.get(input.createdByUserId);
  if (previousSquadId) {
    const prevSquad = store.squads.get(previousSquadId);
    if (prevSquad) {
      prevSquad.memberIds = prevSquad.memberIds.filter(id => id !== input.createdByUserId);
    }
  }
  store.playerSquad.set(input.createdByUserId, squadId);
  return squad;
}

export function joinSquad(squadId: string, userId: string): StudySquad | undefined {
  const store = getStore();
  const squad = store.squads.get(squadId);
  if (!squad) return undefined;
  // Remove from previous squad
  const prevSquadId = store.playerSquad.get(userId);
  if (prevSquadId && prevSquadId !== squadId) {
    const prevSquad = store.squads.get(prevSquadId);
    if (prevSquad) {
      prevSquad.memberIds = prevSquad.memberIds.filter(id => id !== userId);
    }
  }
  if (!squad.memberIds.includes(userId)) {
    squad.memberIds.push(userId);
  }
  store.playerSquad.set(userId, squadId);
  return squad;
}

export function leaveSquad(userId: string): boolean {
  const store = getStore();
  const squadId = store.playerSquad.get(userId);
  if (!squadId) return false;
  const squad = store.squads.get(squadId);
  if (!squad) return false;
  squad.memberIds = squad.memberIds.filter(id => id !== userId);
  store.playerSquad.delete(userId);
  return true;
}

export function getSquadMembers(squadId: string): SquadMember[] {
  const store = getStore();
  const squad = store.squads.get(squadId);
  if (!squad) return [];
  const members: SquadMember[] = [];
  for (const userId of squad.memberIds) {
    const player = store.players.get(userId);
    members.push({
      userId,
      displayName: player?.displayName ?? `Player ${userId.slice(-4)}`,
      joinedAt: squad.createdAt,
      contributionXp: player?.totalXp ?? 0,
      weeklyContributionXp: player?.weeklyXp ?? 0,
    });
  }
  return members.sort((a, b) => b.contributionXp - a.contributionXp);
}

// ---------------------------------------------------------------------------
// GC — clean up abandoned battles older than 1 hour
// ---------------------------------------------------------------------------

export function gcBattles(): number {
  const store = getStore();
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  let removed = 0;
  for (const [id, battle] of store.battles.entries()) {
    if (battle.status === 'active' && now - new Date(battle.startedAt).getTime() > ONE_HOUR) {
      battle.status = 'abandoned';
      battle.endedAt = new Date().toISOString();
    }
    if (battle.status !== 'active' && now - new Date(battle.endedAt ?? battle.startedAt).getTime() > 2 * ONE_HOUR) {
      store.battles.delete(id);
      removed++;
    }
  }
  return removed;
}

// ---------------------------------------------------------------------------
// Weekly reset — clears weeklyXp + weeklyWins/Losses (call from a cron)
// ---------------------------------------------------------------------------

export function resetWeeklyStats(): void {
  const store = getStore();
  for (const p of store.players.values()) {
    p.weeklyXp = 0;
  }
  for (const s of store.squads.values()) {
    s.weeklyXp = 0;
    s.weeklyWins = 0;
    s.weeklyLosses = 0;
  }
}
