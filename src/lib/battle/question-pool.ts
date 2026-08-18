// ============================================================================
// Battle Question Pool + Bot AI
// ----------------------------------------------------------------------------
// Generates rapid-fire battle questions (10-15 per battle) for any exam.
// Reuses the existing GENERATORS registry to pull question templates.
// ============================================================================

import type { Question, ExamPattern } from '@/lib/types';
import { getPattern } from '@/lib/exams/patterns';
import { GENERATORS, signature } from '@/lib/exams/generator';

// ---------------------------------------------------------------------------
// Generate a battle question pool
// ---------------------------------------------------------------------------

export function generateBattleQuestions(
  examId: string,
  count: number,
  seenSignatures?: Set<string>,
): Question[] {
  const pattern = getPattern(examId);
  if (!pattern) {
    throw new Error(`Unknown exam pattern: ${examId}`);
  }
  return generateBattleQuestionsForPattern(pattern, count, seenSignatures);
}

export function generateBattleQuestionsForPattern(
  pattern: ExamPattern,
  count: number,
  seenSignatures?: Set<string>,
): Question[] {
  const questions: Question[] = [];
  const usedSignatures = new Set<string>(seenSignatures ?? []);
  const usedTexts = new Set<string>();
  // Track topic usage to balance coverage
  const topicUsage: Record<string, number> = {};

  // Get all available (subject, topic) combos for this pattern
  const topicPool: { subject: string; topic: string }[] = [];
  for (const syllabus of pattern.syllabus) {
    for (const tw of syllabus.topics) {
      const key = `${syllabus.subject}|${tw.topic}`;
      if (GENERATORS[key]) {
        topicPool.push({ subject: syllabus.subject, topic: tw.topic });
      }
    }
  }

  if (topicPool.length === 0) {
    throw new Error(`No generators available for exam: ${pattern.id}`);
  }

  // Section-by-section marks lookup
  const sectionMarksMap = new Map<string, { marksPerQuestion: number; negativeMarks: number }>();
  for (const section of pattern.sections) {
    sectionMarksMap.set(section.subject, {
      marksPerQuestion: section.marksPerQuestion,
      negativeMarks: section.negativeMarks,
    });
  }

  for (let i = 0; i < count; i++) {
    // Pick a topic with low usage to balance coverage
    const sortedTopics = [...topicPool].sort((a, b) => {
      const aKey = `${a.subject}|${a.topic}`;
      const bKey = `${b.subject}|${b.topic}`;
      return (topicUsage[aKey] ?? 0) - (topicUsage[bKey] ?? 0);
    });
    // Pick from the first half (least-used)
    const candidateTopics = sortedTopics.slice(0, Math.max(1, Math.ceil(sortedTopics.length / 2)));
    const pickedTopic = candidateTopics[Math.floor(Math.random() * candidateTopics.length)];

    const key = `${pickedTopic.subject}|${pickedTopic.topic}`;
    const gen = GENERATORS[key];
    if (!gen) continue;

    const sectionInfo = sectionMarksMap.get(pickedTopic.subject) ?? { marksPerQuestion: 4, negativeMarks: 1 };
    // Vary difficulty across the battle (mix easy/medium/hard)
    const difficultyOptions: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'medium', 'hard'];
    const difficulty = difficultyOptions[Math.floor(Math.random() * difficultyOptions.length)];

    const meta = {
      subject: pickedTopic.subject,
      topic: pickedTopic.topic,
      difficulty,
      marks: sectionInfo.marksPerQuestion,
      negativeMarks: sectionInfo.negativeMarks,
    };

    let q: Question | null = null;
    for (let retry = 0; retry < 8; retry++) {
      try {
        const candidate = gen(meta, usedTexts);
        const sig = signature(candidate.text);
        if (!usedSignatures.has(sig) && !usedTexts.has(candidate.text)) {
          usedSignatures.add(sig);
          usedTexts.add(candidate.text);
          q = candidate;
          break;
        }
      } catch {
        // skip
      }
    }
    if (q) {
      questions.push(q);
      topicUsage[key] = (topicUsage[key] ?? 0) + 1;
    }
  }

  return questions;
}

// ---------------------------------------------------------------------------
// Bot AI — answers questions with a configurable accuracy + response time
// ---------------------------------------------------------------------------

export interface BotPersonality {
  name: string;
  avatarEmoji: string;
  rating: number;
  accuracy: number;        // 0-1 chance of getting a question right
  responseTimeMs: number; // base response time (jittered ±30%)
}

// Bot personalities spanning skill levels — chosen by user rating when starting solo-bot battle
export const BOT_PERSONALITIES: BotPersonality[] = [
  {
    name: 'Rookie Ravi',
    avatarEmoji: '🐣',
    rating: 900,
    accuracy: 0.45,
    responseTimeMs: 12000,
  },
  {
    name: 'Aspirant Anu',
    avatarEmoji: '📚',
    rating: 1100,
    accuracy: 0.55,
    responseTimeMs: 10000,
  },
  {
    name: 'Sharp Shruti',
    avatarEmoji: '⚡',
    rating: 1300,
    accuracy: 0.65,
    responseTimeMs: 8000,
  },
  {
    name: 'Master Mohan',
    avatarEmoji: '🎯',
    rating: 1500,
    accuracy: 0.75,
    responseTimeMs: 7000,
  },
  {
    name: 'Grand Guru Geeta',
    avatarEmoji: '👑',
    rating: 1700,
    accuracy: 0.82,
    responseTimeMs: 6000,
  },
];

export function pickBotOpponent(playerRating: number): BotPersonality {
  // Pick a bot whose rating is within ±200 of the player's rating
  const closeBots = BOT_PERSONALITIES.filter(b => Math.abs(b.rating - playerRating) <= 200);
  if (closeBots.length > 0) {
    return closeBots[Math.floor(Math.random() * closeBots.length)];
  }
  // Fallback: pick closest
  const sorted = [...BOT_PERSONALITIES].sort((a, b) => Math.abs(a.rating - playerRating) - Math.abs(b.rating - playerRating));
  return sorted[0];
}

// ---------------------------------------------------------------------------
// Bot answer simulation — given a question, returns (correct, responseTimeMs)
// ---------------------------------------------------------------------------

export function simulateBotAnswer(
  question: Question,
  personality: BotPersonality,
): { correct: boolean; responseTimeMs: number } {
  // Roll for accuracy
  const roll = Math.random();
  const correct = roll < personality.accuracy;
  // Jitter response time by ±30%
  const jitter = (Math.random() - 0.5) * 0.6;
  const responseTime = Math.max(2000, Math.round(personality.responseTimeMs * (1 + jitter)));
  return { correct, responseTimeMs: responseTime };
}

// ---------------------------------------------------------------------------
// Grade a player's answer for a battle question
// ---------------------------------------------------------------------------

export function gradeBattleAnswer(
  question: Question,
  answer: 'unanswered' | number | number[],
): boolean {
  if (answer === 'unanswered') return false;

  // MCQ-style (single optionIndex)
  if (typeof answer === 'number') {
    return (question.correctOptions ?? []).includes(answer);
  }

  // MSQ-style (array of optionIndices)
  if (Array.isArray(answer)) {
    const correctSet = new Set(question.correctOptions ?? []);
    const studentSet = new Set(answer);
    if (studentSet.size === 0) return false;
    return correctSet.size === studentSet.size &&
      [...studentSet].every(idx => correctSet.has(idx));
  }

  return false;
}
