// ============================================================================
// WhatsApp / Telegram Nudge Bot — Types + Spaced-Repetition Scheduler
// ----------------------------------------------------------------------------
// Generates personalised nudges for students:
//   - Spaced-repetition reminders (revisit wrong answers at 1d/3d/7d/14d/30d)
//   - Daily plan reminders (morning/evening)
//   - Streak warnings (don't break the streak!)
//   - Weak topic drills (target top weak area)
//   - Exam countdowns (X days to go)
//   - Peer battle invites (challenge a friend)
//
// Channel: WhatsApp Business API or Telegram Bot API (pluggable — for now we
// simulate sending and return the message body that would be dispatched).
// ============================================================================

export type NudgeType =
  | 'spaced-repetition'    // revisit a previously-wrong question
  | 'daily-plan'            // morning reminder of today's study plan
  | 'streak-warning'        // streak at risk — haven't studied today
  | 'weak-topic-drill'      // top weak topic needs attention
  | 'exam-countdown'        // X days to exam
  | 'battle-invite'         // challenge a peer
  | 'doubt-photo-prompt'    // 1-tap doubt upload encouragement
  | 'wellness-check';        // gentle check-in from wellness signals

export type NudgeChannel = 'whatsapp' | 'telegram' | 'in-app';

export type NudgeStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'acknowledged' | 'snoozed' | 'failed';

export interface Nudge {
  id: string;
  userId: string;
  type: NudgeType;
  channel: NudgeChannel;
  // Recipient contact (phone for WhatsApp, chatId for Telegram)
  recipient: string;
  // Message body — WhatsApp-formatted (with *bold* and _italic_)
  message: string;
  // Optional: deep link back into the app
  appDeepLink?: string;
  // Optional: attached media (image URL for doubt-photo)
  imageUrl?: string;
  // Scheduling
  scheduledFor: string;     // ISO timestamp
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  // Status
  status: NudgeStatus;
  // Snooze: if user snoozed, when to re-send
  snoozedUntil?: string;
  snoozeCount: number;
  // Metadata for analytics
  metadata?: {
    spacedRepetitionStep?: number;  // 0=1d, 1=3d, 2=7d, 3=14d, 4=30d
    topic?: string;
    subject?: string;
    questionId?: string;
    streakDays?: number;
    daysToExam?: number;
  };
  // For 1-tap doubt flow
  isOneTap?: boolean;
}

// ---------------------------------------------------------------------------
// Spaced-repetition schedule (SM-2 inspired, simplified)
// ---------------------------------------------------------------------------

export const SPACED_REPETITION_INTERVALS_DAYS = [1, 3, 7, 14, 30];

export function getNextSpacedRepetitionDate(lastReviewedAt: string, currentStep: number): { nextDate: string; nextStep: number; isComplete: boolean } {
  const step = Math.max(0, Math.min(SPACED_REPETITION_INTERVALS_DAYS.length - 1, currentStep));
  const intervalDays = SPACED_REPETITION_INTERVALS_DAYS[step];
  const next = new Date(lastReviewedAt);
  next.setDate(next.getDate() + intervalDays);
  const nextStep = step + 1;
  const isComplete = nextStep >= SPACED_REPETITION_INTERVALS_DAYS.length;
  return {
    nextDate: next.toISOString(),
    nextStep,
    isComplete,
  };
}

// ---------------------------------------------------------------------------
// Nudge preferences (per-user)
// ---------------------------------------------------------------------------

export interface NudgePreferences {
  userId: string;
  enabled: boolean;
  // Channels
  whatsappEnabled: boolean;
  telegramEnabled: boolean;
  inAppEnabled: boolean;
  // Contact info
  whatsappPhone?: string;
  telegramChatId?: string;
  // Quiet hours (24h format, e.g. 22 = no nudges after 10 PM)
  quietHoursStart: number;     // 0-23
  quietHoursEnd: number;       // 0-23
  // Preferred nudge times (HH:MM format)
  morningNudgeTime: string;     // e.g. "08:00"
  eveningNudgeTime: string;     // e.g. "19:00"
  // Frequency caps
  maxNudgesPerDay: number;      // default 3
  // Opt-ins per type
  enabledTypes: Record<NudgeType, boolean>;
  // Language for message body
  language: string;
}

export const DEFAULT_NUDGE_PREFERENCES: Omit<NudgePreferences, 'userId'> = {
  enabled: true,
  whatsappEnabled: false,
  telegramEnabled: false,
  inAppEnabled: true,
  quietHoursStart: 22,
  quietHoursEnd: 7,
  morningNudgeTime: '08:00',
  eveningNudgeTime: '19:00',
  maxNudgesPerDay: 3,
  enabledTypes: {
    'spaced-repetition': true,
    'daily-plan': true,
    'streak-warning': true,
    'weak-topic-drill': true,
    'exam-countdown': true,
    'battle-invite': false,  // opt-in only — can feel spammy
    'doubt-photo-prompt': true,
    'wellness-check': true,
  },
  language: 'en',
};

// ---------------------------------------------------------------------------
// Message templates — WhatsApp formatting (*bold*, _italic_, ```code```)
// ---------------------------------------------------------------------------

export interface MessageTemplateInput {
  studentName: string;
  // For spaced-repetition
  topic?: string;
  subject?: string;
  questionText?: string;
  spacedRepetitionStep?: number;
  // For streak-warning
  streakDays?: number;
  lastActiveDays?: number;  // days since last activity
  // For exam-countdown
  daysToExam?: number;
  examName?: string;
  // For weak-topic-drill
  weakTopic?: string;
  errorCount?: number;
  // For daily-plan
  plannedMocks?: number;
  plannedStudyHours?: number;
  // For wellness-check
  wellnessDescription?: string;
}

export function buildNudgeMessage(type: NudgeType, input: MessageTemplateInput, lang: string = 'en'): string {
  // Per-language templates — key strings translated
  const greeting = lang === 'hi' ? `नमस्ते ${input.studentName}! 👋` :
    lang === 'es' ? `¡Hola ${input.studentName}! 👋` :
    lang === 'fr' ? `Salut ${input.studentName}! 👋` :
    `Hi ${input.studentName}! 👋`;

  switch (type) {
    case 'spaced-repetition': {
      const step = input.spacedRepetitionStep ?? 0;
      const stepLabels = lang === 'hi'
        ? ['1 दिन बाद', '3 दिन बाद', '1 सप्ताह बाद', '2 सप्ताह बाद', '1 महीने बाद']
        : lang === 'es'
        ? ['después de 1 día', 'después de 3 días', 'después de 1 semana', 'después de 2 semanas', 'después de 1 mes']
        : lang === 'fr'
        ? ['après 1 jour', 'après 3 jours', 'après 1 semaine', 'après 2 semaines', 'après 1 mois']
        : ['after 1 day', 'after 3 days', 'after 1 week', 'after 2 weeks', 'after 1 month'];
      const intro = lang === 'hi' ? 'याद दिलाने के लिए:' : lang === 'es' ? 'Para recordar:' : lang === 'fr' ? 'Pour rappel:' : 'Time to revisit:';
      const cta = lang === 'hi' ? 'अभी अभ्यास करें' : lang === 'es' ? 'Practicar ahora' : lang === 'fr' ? 'Pratiquer maintenant' : 'Practice now';
      const topicLine = input.subject && input.topic ? `*${input.subject} → ${input.topic}*\n` : '';
      const questionLine = input.questionText ? `\n\n📝 "${input.questionText.slice(0, 100)}${input.questionText.length > 100 ? '…' : ''}"\n` : '';
      return `${greeting}\n\n${intro} ${stepLabels[step]} 📚\n\n${topicLine}यह विषय ${step + 1}/5 spaced-repetition चरण में है।\n\n${cta}: prepai.app/review?q=${input.questionText?.slice(0, 20) ?? ''}${questionLine}`;
    }

    case 'daily-plan': {
      const intro = lang === 'hi' ? 'आज की योजना:' : lang === 'es' ? 'Plan de hoy:' : lang === 'fr' ? 'Plan du jour:' : 'Today\'s plan:';
      const mocks = input.plannedMocks ?? 1;
      const hours = input.plannedStudyHours ?? 4;
      const mockLine = lang === 'hi' ? `📊 ${mocks} मॉक परीक्षा${mocks > 1 ? 'एं' : ''}` : lang === 'es' ? `📊 ${mocks} examen${mocks > 1 ? 'es' : ''} de práctica` : lang === 'fr' ? `📊 ${mocks} examen${mocks > 1 ? 's' : ''} blanc${mocks > 1 ? 's' : ''}` : `📊 ${mocks} mock${mocks > 1 ? 's' : ''}`;
      const hourLine = lang === 'hi' ? `⏰ ${hours} घंटे अध्ययन` : lang === 'es' ? `⏰ ${hours} horas de estudio` : lang === 'fr' ? `⏰ ${hours} heures d'étude` : `⏰ ${hours}h study`;
      return `${greeting}\n\n${intro}\n\n${mockLine}\n${hourLine}\n\n_आज कड़ी मेहनत करें — कल आप धन्यवाद करेंगे! 💪_\n\nपूरी योजना देखें: prepai.app/planner`;
    }

    case 'streak-warning': {
      const streak = input.streakDays ?? 0;
      const lastActive = input.lastActiveDays ?? 0;
      const warning = lang === 'hi' ? `⚠️ आपकी ${streak}-दिन की श्रृंखला खतरे में है!` :
        lang === 'es' ? `⚠️ ¡Tu racha de ${streak} días está en peligro!` :
        lang === 'fr' ? `⚠️ Ta série de ${streak} jours est en danger!` :
        `⚠️ Your ${streak}-day streak is at risk!`;
      const detail = lang === 'hi' ? `आपने ${lastActive} दिन से अध्ययन नहीं किया। एक छोटा सा सत्र भी श्रृंखला बचा लेगा।` :
        lang === 'es' ? `No has estudiado en ${lastActive} día(s). Incluso una sesión corta salvará tu racha.` :
        lang === 'fr' ? `Tu n'as pas étudié depuis ${lastActive} jour(s). Même une courte session sauvera ta série.` :
        `You haven't studied in ${lastActive} day(s). Even a short session will save the streak.`;
      const cta = lang === 'hi' ? 'अभी एक 15-मिनट का सत्र करें' : lang === 'es' ? 'Haz una sesión de 15 min ahora' : lang === 'fr' ? 'Fais une session de 15 min maintenant' : 'Do a 15-min session now';
      return `${greeting}\n\n${warning}\n\n${detail}\n\n${cta}: prepai.app/mock-exam`;
    }

    case 'weak-topic-drill': {
      const weak = input.weakTopic ?? 'a weak topic';
      const count = input.errorCount ?? 1;
      const intro = lang === 'hi' ? `आपका सबसे कमजोर विषय: *${weak}*` :
        lang === 'es' ? `Tu tema más débil: *${weak}*` :
        lang === 'fr' ? `Ton sujet le plus faible: *${weak}*` :
        `Your weakest topic: *${weak}*`;
      const detail = lang === 'hi' ? `${count} त्रुटियां दर्ज हैं। इसे आज ठीक करने का समय।` :
        lang === 'es' ? `${count} errore(s) registrados. Es hora de arreglarlo.` :
        lang === 'fr' ? `${count} erreur(s) enregistrées. Il est temps de corriger ça.` :
        `${count} error(s) logged. Time to fix it.`;
      return `${greeting}\n\n${intro}\n${detail}\n\n_कमजोरियों को मजबूती में बदलें_ 💪\n\nड्रिल शुरू करें: prepai.app/error-journal`;
    }

    case 'exam-countdown': {
      const days = input.daysToExam ?? 0;
      const exam = input.examName ?? 'your exam';
      const headline = lang === 'hi' ? `📅 बस ${days} दिन बचे हैं!` :
        lang === 'es' ? `¡Quedan solo ${days} días!` :
        lang === 'fr' ? `Plus que ${days} jours!` :
        `Only ${days} days to go!`;
      const detail = lang === 'hi' ? `${exam} के लिए। अंतिम चरण पर ध्यान दें — रिवीजन, मॉक, और आत्मविश्वास।` :
        lang === 'es' ? `para ${exam}. Enfócate en la fase final — revisión, mocks y confianza.` :
        lang === 'fr' ? `pour ${exam}. Concentre-toi sur la phase finale — révision, examens blancs et confiance.` :
        `for ${exam}. Focus on the final stretch — revision, mocks, and confidence.`;
      return `${greeting}\n\n${headline}\n\n${detail}\n\nआप इसके लिए तैयार हैं! 🚀 prepai.app/dashboard`;
    }

    case 'battle-invite': {
      const intro = lang === 'hi' ? 'एक नई बैटल की तैयारी है?' : lang === 'es' ? '¿Listo para una nueva batalla?' : lang === 'fr' ? 'Prêt pour une nouvelle bataille?' : 'Ready for a new battle?';
      return `${greeting}\n\n${intro} 🤺\n\n_प्रतिस्पर्धा सीखने को गति देती है_\n\nढूंढें एक प्रतिद्वंद्वी: prepai.app/battle-arena`;
    }

    case 'doubt-photo-prompt': {
      const intro = lang === 'hi' ? 'कोई संदेह है? बस एक फोटो खींचें! 📸' :
        lang === 'es' ? '¿Tienes una duda? ¡Solo toma una foto! 📸' :
        lang === 'fr' ? 'Un doute ? Prends juste une photo! 📸' :
        'Got a doubt? Just snap a photo! 📸';
      const detail = lang === 'hi' ? 'AI आपके हाथ से लिखे हुए समाधान को पढ़ेगा और चरण-दर-चरण मार्गदर्शन देगा।' :
        lang === 'es' ? 'La IA leerá tu solución manuscrita y te guiará paso a paso.' :
        lang === 'fr' ? "L'IA lira ta solution manuscrite et te guidera pas à pas." :
        'The AI will read your handwritten solution and guide you step-by-step.';
      return `${greeting}\n\n${intro}\n\n${detail}\n\n1-tap अपलोड: prepai.app/doubt-solver`;
    }

    case 'wellness-check': {
      const detail = input.wellnessDescription ?? 'We noticed your study pattern has changed recently.';
      const intro = lang === 'hi' ? 'सब कुछ ठीक है? 💙' :
        lang === 'es' ? '¿Todo bien? 💙' :
        lang === 'fr' ? 'Tout va bien? 💙' :
        'Everything okay? 💙';
      const cta = lang === 'hi' ? 'यदि आप थके हुए महसूस कर रहे हैं, तो एक दिन का ब्रेक लें।' :
        lang === 'es' ? 'Si te sientes agotado, tómate un día libre.' :
        lang === 'fr' ? 'Si tu te sens épuisé, prends un jour de congé.' :
        'If you\'re feeling burnt out, take a day off.';
      return `${greeting}\n\n${intro}\n\n${detail}\n\n${cta}\n\nहम आपकी परवाह करते हैं — आवश्यक हो तो किसी से बात करें। 💙`;
    }

    default:
      return `${greeting}\n\nprepai.app`;
  }
}

// ---------------------------------------------------------------------------
// Quiet hours check — should we send a nudge right now?
// ---------------------------------------------------------------------------

export function isWithinQuietHours(now: Date, quietStart: number, quietEnd: number): boolean {
  const hour = now.getHours();
  if (quietStart <= quietEnd) {
    // Simple case: e.g. 22 → 23 (1 hour)
    return hour >= quietStart && hour < quietEnd;
  }
  // Wraps midnight: e.g. 22 → 7
  return hour >= quietStart || hour < quietEnd;
}

// ---------------------------------------------------------------------------
// Nudge deduplication — don't send the same type to the same user within 6 hours
// ---------------------------------------------------------------------------

export function shouldDeduplicateNudge(
  existingNudges: Nudge[],
  userId: string,
  type: NudgeType,
  withinHours = 6,
): boolean {
  const cutoff = Date.now() - withinHours * 60 * 60 * 1000;
  return existingNudges.some(n =>
    n.userId === userId &&
    n.type === type &&
    n.status !== 'failed' &&
    new Date(n.scheduledFor).getTime() >= cutoff
  );
}
