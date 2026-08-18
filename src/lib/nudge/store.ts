// ============================================================================
// Nudge Store — in-memory queue + sent log + preferences
// ----------------------------------------------------------------------------
// Manages nudge lifecycle: pending → sent → delivered → read → acknowledged
// Snooze support: re-schedule for later
// ============================================================================

import type { Nudge, NudgePreferences, NudgeType, NudgeChannel } from './types';
import { DEFAULT_NUDGE_PREFERENCES, buildNudgeMessage, isWithinQuietHours, shouldDeduplicateNudge } from './types';
import type { ErrorEntry } from '@/lib/error-journal/classifier';

interface NudgeStore {
  nudges: Nudge[];
  preferences: Map<string, NudgePreferences>;
}

declare global {
  // eslint-disable-next-line no-var
  var __nudge_store__: NudgeStore | undefined;
}

function getStore(): NudgeStore {
  if (!globalThis.__nudge_store__) {
    const store: NudgeStore = {
      nudges: [],
      preferences: new Map(),
    };
    seedDemoData(store);
    globalThis.__nudge_store__ = store;
  }
  return globalThis.__nudge_store__;
}

// ---------------------------------------------------------------------------
// Seed demo data
// ---------------------------------------------------------------------------

function seedDemoData(store: NudgeStore) {
  // Demo preferences for demo_user
  store.preferences.set('demo_user', {
    ...DEFAULT_NUDGE_PREFERENCES,
    userId: 'demo_user',
    whatsappEnabled: true,
    whatsappPhone: '+91-9876543210',
    language: 'en',
  });

  // Demo pending nudges
  const now = Date.now();
  const demoNudges: Nudge[] = [
    {
      id: 'nudge_demo_1',
      userId: 'demo_user',
      type: 'spaced-repetition',
      channel: 'whatsapp',
      recipient: '+91-9876543210',
      message: buildNudgeMessage('spaced-repetition', {
        studentName: 'Aarav',
        subject: 'Physics',
        topic: 'Rotational Motion',
        questionText: 'A solid sphere rolls without slipping down an incline. Find its acceleration.',
        spacedRepetitionStep: 1,
      }, 'en'),
      appDeepLink: 'prepai.app/review?q=rotational-motion',
      scheduledFor: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      snoozeCount: 0,
      metadata: { spacedRepetitionStep: 1, topic: 'Rotational Motion', subject: 'Physics', questionId: 'q_demo_1' },
    },
    {
      id: 'nudge_demo_2',
      userId: 'demo_user',
      type: 'streak-warning',
      channel: 'whatsapp',
      recipient: '+91-9876543210',
      message: buildNudgeMessage('streak-warning', {
        studentName: 'Aarav',
        streakDays: 5,
        lastActiveDays: 1,
      }, 'en'),
      appDeepLink: 'prepai.app/mock-exam',
      scheduledFor: new Date(now - 30 * 60 * 1000).toISOString(),  // 30 min ago — overdue
      status: 'pending',
      snoozeCount: 0,
      metadata: { streakDays: 5 },
    },
    {
      id: 'nudge_demo_3',
      userId: 'demo_user',
      type: 'weak-topic-drill',
      channel: 'whatsapp',
      recipient: '+91-9876543210',
      message: buildNudgeMessage('weak-topic-drill', {
        studentName: 'Aarav',
        weakTopic: 'Organic Basics',
        errorCount: 3,
      }, 'en'),
      appDeepLink: 'prepai.app/error-journal',
      scheduledFor: new Date(now + 5 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      snoozeCount: 0,
      metadata: { topic: 'Organic Basics' },
    },
    {
      id: 'nudge_demo_4',
      userId: 'demo_user',
      type: 'exam-countdown',
      channel: 'whatsapp',
      recipient: '+91-9876543210',
      message: buildNudgeMessage('exam-countdown', {
        studentName: 'Aarav',
        daysToExam: 120,
        examName: 'JEE Main',
      }, 'en'),
      appDeepLink: 'prepai.app/dashboard',
      scheduledFor: new Date(now - 24 * 60 * 60 * 1000).toISOString(),  // yesterday — already "sent"
      sentAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      deliveredAt: new Date(now - 24 * 60 * 60 * 1000 + 5000).toISOString(),
      status: 'acknowledged',
      snoozeCount: 0,
      metadata: { daysToExam: 120 },
    },
  ];
  store.nudges.push(...demoNudges);
}

// ---------------------------------------------------------------------------
// Get / update preferences
// ---------------------------------------------------------------------------

export function getPreferences(userId: string): NudgePreferences {
  const store = getStore();
  let prefs = store.preferences.get(userId);
  if (!prefs) {
    prefs = { ...DEFAULT_NUDGE_PREFERENCES, userId };
    store.preferences.set(userId, prefs);
  }
  return prefs;
}

export function updatePreferences(userId: string, updates: Partial<NudgePreferences>): NudgePreferences {
  const store = getStore();
  const current = getPreferences(userId);
  const updated = { ...current, ...updates, userId };
  store.preferences.set(userId, updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Get nudges for a user
// ---------------------------------------------------------------------------

export function getNudges(userId: string, filters?: {
  status?: string;
  type?: NudgeType;
  limit?: number;
}): Nudge[] {
  const store = getStore();
  let nudges = store.nudges.filter(n => n.userId === userId);
  if (filters?.status) nudges = nudges.filter(n => n.status === filters.status);
  if (filters?.type) nudges = nudges.filter(n => n.type === filters.type);
  nudges = nudges.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
  if (filters?.limit) nudges = nudges.slice(0, filters.limit);
  return nudges;
}

// ---------------------------------------------------------------------------
// Create a nudge (used by the scheduler + 1-tap doubt flow)
// ---------------------------------------------------------------------------

export function createNudge(input: {
  userId: string;
  type: NudgeType;
  channel?: NudgeChannel;
  recipient?: string;
  message: string;
  appDeepLink?: string;
  imageUrl?: string;
  scheduledFor?: string;
  metadata?: Nudge['metadata'];
  isOneTap?: boolean;
}): Nudge {
  const store = getStore();
  const prefs = getPreferences(input.userId);

  // Determine channel + recipient
  let channel: NudgeChannel = input.channel ?? 'in-app';
  let recipient = input.recipient ?? '';
  if (!input.channel) {
    if (prefs.whatsappEnabled && prefs.whatsappPhone) {
      channel = 'whatsapp';
      recipient = prefs.whatsappPhone;
    } else if (prefs.telegramEnabled && prefs.telegramChatId) {
      channel = 'telegram';
      recipient = prefs.telegramChatId;
    } else {
      channel = 'in-app';
      recipient = input.userId;
    }
  }

  // Check if this type is enabled
  if (!prefs.enabledTypes[input.type]) {
    throw new Error(`Nudge type ${input.type} is disabled in user preferences`);
  }

  // Deduplicate — don't create same-type nudge within 6 hours
  if (shouldDeduplicateNudge(store.nudges, input.userId, input.type)) {
    throw new Error(`A ${input.type} nudge was already scheduled recently — deduplicated`);
  }

  // Daily cap
  const today = new Date().toISOString().slice(0, 10);
  const todaysNudges = store.nudges.filter(n =>
    n.userId === input.userId &&
    n.scheduledFor.slice(0, 10) === today &&
    n.status !== 'failed'
  );
  if (todaysNudges.length >= prefs.maxNudgesPerDay) {
    throw new Error(`Daily nudge cap (${prefs.maxNudgesPerDay}) reached — try again tomorrow`);
  }

  const nudge: Nudge = {
    id: `nudge_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    userId: input.userId,
    type: input.type,
    channel,
    recipient,
    message: input.message,
    appDeepLink: input.appDeepLink,
    imageUrl: input.imageUrl,
    scheduledFor: input.scheduledFor ?? new Date().toISOString(),
    status: 'pending',
    snoozeCount: 0,
    metadata: input.metadata,
    isOneTap: input.isOneTap,
  };

  store.nudges.push(nudge);
  return nudge;
}

// ---------------------------------------------------------------------------
// Send a nudge — simulates the WhatsApp Business API / Telegram Bot API call
// In production: replace with actual API calls (using whatsapp-business or
// node-telegram-bot-api packages, with API tokens in env vars).
// ---------------------------------------------------------------------------

export interface SendResult {
  nudgeId: string;
  success: boolean;
  providerMessageId?: string;
  error?: string;
  sentAt: string;
}

export function sendNudge(nudgeId: string): SendResult {
  const store = getStore();
  const nudge = store.nudges.find(n => n.id === nudgeId);
  if (!nudge) {
    return { nudgeId, success: false, error: 'Nudge not found', sentAt: new Date().toISOString() };
  }
  if (nudge.status === 'sent' || nudge.status === 'delivered' || nudge.status === 'read' || nudge.status === 'acknowledged') {
    return { nudgeId, success: false, error: `Nudge already ${nudge.status}`, sentAt: new Date().toISOString() };
  }

  // Check quiet hours
  const prefs = getPreferences(nudge.userId);
  const now = new Date();
  if (isWithinQuietHours(now, prefs.quietHoursStart, prefs.quietHoursEnd)) {
    // Snooze to end of quiet hours
    const snoozeUntil = new Date(now);
    snoozeUntil.setHours(prefs.quietHoursEnd, 0, 0, 0);
    if (snoozeUntil <= now) snoozeUntil.setDate(snoozeUntil.getDate() + 1);
    nudge.snoozedUntil = snoozeUntil.toISOString();
    nudge.snoozeCount++;
    nudge.status = 'snoozed';
    return {
      nudgeId,
      success: false,
      error: `Within quiet hours — snoozed until ${snoozeUntil.toLocaleTimeString()}`,
      sentAt: new Date().toISOString(),
    };
  }

  // Simulate sending — in production, this is where the WhatsApp/Telegram API call goes
  // For now: mark as sent + delivered
  nudge.status = 'sent';
  nudge.sentAt = new Date().toISOString();
  nudge.deliveredAt = new Date().toISOString();
  nudge.status = 'delivered';

  return {
    nudgeId,
    success: true,
    providerMessageId: `sim_${Date.now().toString(36)}`,
    sentAt: nudge.sentAt,
  };
}

// ---------------------------------------------------------------------------
// Acknowledge / snooze a nudge
// ---------------------------------------------------------------------------

export function acknowledgeNudge(nudgeId: string): boolean {
  const store = getStore();
  const nudge = store.nudges.find(n => n.id === nudgeId);
  if (!nudge) return false;
  nudge.status = 'acknowledged';
  nudge.readAt = new Date().toISOString();
  return true;
}

export function snoozeNudge(nudgeId: string, snoozeUntil: string): boolean {
  const store = getStore();
  const nudge = store.nudges.find(n => n.id === nudgeId);
  if (!nudge) return false;
  nudge.status = 'snoozed';
  nudge.snoozedUntil = snoozeUntil;
  nudge.snoozeCount++;
  return true;
}

// ---------------------------------------------------------------------------
// Generate spaced-repetition nudges from the Error Journal
// For each unresolved error entry, check if it's due for review
// ---------------------------------------------------------------------------

export function generateSpacedRepetitionNudges(
  userId: string,
  errorEntries: ErrorEntry[],
): { created: Nudge[]; skipped: number } {
  const prefs = getPreferences(userId);
  const studentName = 'Aspirant'; // would come from user record in production
  const created: Nudge[] = [];
  let skipped = 0;

  const now = Date.now();
  for (const entry of errorEntries) {
    if (entry.resolved) continue;
    // Check if it's due — based on the spaced-repetition schedule
    // Use ingestedAt as the "lastReviewedAt" baseline
    const lastReviewed = new Date(entry.timestamp).getTime();
    const daysSince = Math.floor((now - lastReviewed) / (24 * 60 * 60 * 1000));

    // Determine current step: based on reviewed count (which we don't track directly here)
    // For demo: use reviewed flag as proxy — reviewed = step 1, unreviewed = step 0
    const currentStep = entry.reviewed ? 1 : 0;
    const intervals = [1, 3, 7, 14, 30];
    const dueAt = intervals[currentStep];

    if (daysSince < dueAt) {
      skipped++;
      continue;
    }

    // Deduplicate — don't create if we already have a pending spaced-rep nudge for this questionId
    const store = getStore();
    const existing = store.nudges.find(n =>
      n.userId === userId &&
      n.type === 'spaced-repetition' &&
      n.metadata?.questionId === entry.questionId &&
      n.status === 'pending'
    );
    if (existing) {
      skipped++;
      continue;
    }

    try {
      const nudge = createNudge({
        userId,
        type: 'spaced-repetition',
        message: buildNudgeMessage('spaced-repetition', {
          studentName,
          subject: entry.subject,
          topic: entry.topic,
          questionText: entry.questionText,
          spacedRepetitionStep: currentStep,
        }, prefs.language),
        appDeepLink: `prepai.app/error-journal?q=${entry.questionId}`,
        scheduledFor: new Date().toISOString(),
        metadata: {
          spacedRepetitionStep: currentStep,
          topic: entry.topic,
          subject: entry.subject,
          questionId: entry.questionId,
        },
      });
      created.push(nudge);
    } catch {
      skipped++;
    }
  }

  return { created, skipped };
}

// ---------------------------------------------------------------------------
// Process due nudges — send all pending nudges whose scheduledFor has passed
// ---------------------------------------------------------------------------

export function processDueNudges(userId: string): { sent: SendResult[]; snoozed: number } {
  const store = getStore();
  const now = Date.now();
  const due = store.nudges.filter(n =>
    n.userId === userId &&
    n.status === 'pending' &&
    new Date(n.scheduledFor).getTime() <= now
  );
  const sent: SendResult[] = [];
  let snoozed = 0;
  for (const nudge of due) {
    const result = sendNudge(nudge.id);
    if (result.success) sent.push(result);
    else if (nudge.status === 'snoozed') snoozed++;
  }
  return { sent, snoozed };
}

// ---------------------------------------------------------------------------
// 1-tap doubt photo flow — generates a pre-filled message + creates an in-app nudge
// ---------------------------------------------------------------------------

export function createOneTapDoubtNudge(userId: string, imageDataUrl?: string): Nudge {
  const prefs = getPreferences(userId);
  const message = buildNudgeMessage('doubt-photo-prompt', {
    studentName: 'Aspirant',
  }, prefs.language);
  return createNudge({
    userId,
    type: 'doubt-photo-prompt',
    message,
    appDeepLink: 'prepai.app/doubt-solver',
    imageUrl: imageDataUrl,
    scheduledFor: new Date().toISOString(),
    isOneTap: true,
  });
}
