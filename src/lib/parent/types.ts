// ============================================================================
// Parent / Guardian Dashboard — Types
// ----------------------------------------------------------------------------
// Read-only view of student progress for parents/guardians.
// No chat access, no editing, no battle/leaderboard (those are student-only).
// Includes weekly digest generation.
// ============================================================================

import type { ExamAttempt, AcademicRecord, User } from '@/lib/types';
import type { ErrorPatternReport } from '@/lib/error-journal/classifier';

export interface ParentAccount {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  // Hashed password (in production — for now plain-text matching existing pattern)
  password: string;
  // Linked student userIds
  linkedStudentIds: string[];
  // Weekly digest opt-in
  weeklyDigestEnabled: boolean;
  digestDay: 'sunday' | 'monday' | 'friday';
  digestEmail: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface ParentStudentLink {
  parentUserId: string;
  studentUserId: string;
  // Relationship: 'parent' | 'guardian' | 'sibling' | 'mentor'
  relationship: 'parent' | 'guardian' | 'sibling' | 'mentor';
  // Approval status — student must approve before parent can see data
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'revoked';
  approvedAt?: string;
  // When the link was created
  createdAt: string;
  // Invitation method: 'email' | 'code' | 'direct'
  invitationMethod: 'email' | 'code' | 'direct';
}

// ---------------------------------------------------------------------------
// Read-only student snapshot — what the parent sees
// ---------------------------------------------------------------------------

export interface StudentSnapshot {
  student: {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    examGoal: string;
    examName: string;
    examDate?: string;
    daysToExam: number;
    grade: string;
    joinedAt: string;
  };
  // Weekly stats (last 7 days)
  weeklyStats: {
    studyHoursTotal: number;
    mocksTaken: number;
    questionsAttempted: number;
    avgAccuracy: number;
    avgScorePct: number;
    battlesWon: number;
    battlesLost: number;
    xpEarned: number;
    // Streak: consecutive days with at least 1 mock or 30 min study
    streakDays: number;
    // Active days out of 7
    activeDays: number;
    // Most-improved topic this week (vs prior week)
    mostImprovedTopic?: string;
    // Declining topic this week
    decliningTopic?: string;
  };
  // Cumulative stats
  cumulative: {
    totalMocks: number;
    bestScorePct: number;
    avgScorePct: number;
    totalStudyHours: number;
    totalXp: number;
    battlesWon: number;
    battlesLost: number;
    errorJournalEntries: number;
    errorJournalResolved: number;
  };
  // Recent activity (last 10 items)
  recentActivity: {
    timestamp: string;
    type: 'mock' | 'battle' | 'study' | 'doubt';
    description: string;
    score?: number;
    duration?: string;
  }[];
  // Subject performance breakdown
  subjectBreakdown: {
    subject: string;
    avgScorePct: number;
    accuracy: number;
    mocksAttempted: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
  // Top weak topics (from error journal)
  weakTopics: {
    subject: string;
    topic: string;
    errorCount: number;
    dominantCause: string;
  }[];
  // Wellness signals — flags that warrant a check-in
  wellnessSignals: {
    signal: 'low-activity' | 'accuracy-drop' | 'late-night' | 'rapid-burnout-risk' | 'no-improvement';
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }[];
  // 8-week trend chart data
  weeklyTrend: {
    weekStart: string;
    mocksTaken: number;
    avgScorePct: number;
    studyHours: number;
  }[];
}

// ---------------------------------------------------------------------------
// Weekly Digest — sent via email/WhatsApp on digestDay
// ---------------------------------------------------------------------------

export interface WeeklyDigest {
  parentName: string;
  studentName: string;
  weekStart: string;            // ISO date (Monday)
  weekEnd: string;              // ISO date (Sunday)
  digestId: string;
  // Headline summary
  headline: string;
  // Key metrics
  summary: {
    studyHours: number;
    mocksTaken: number;
    avgScorePct: number;
    accuracy: number;
    xpEarned: number;
    streak: number;
    battlesWon: number;
  };
  // Comparison to previous week
  comparison: {
    studyHoursDelta: number;
    avgScorePctDelta: number;
    mocksTakenDelta: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  // Highlights
  highlights: string[];
  // Areas to focus on
  focusAreas: string[];
  // Wellness check
  wellnessFlags: string[];
  // Recommended parent actions (gentle nudges)
  recommendedActions: string[];
  // Quote of the week
  quoteOfTheWeek: string;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Wellness signal detection
// ---------------------------------------------------------------------------

export interface WellnessInput {
  // Last 7 days of activity
  dailyActivity: { date: string; mocksTaken: number; studyHours: number; startedAtHour: number }[];
  // Recent mock scores (last 5)
  recentScores: number[];
  // Weekly accuracy
  weeklyAccuracy: number;
  // Prior week accuracy (for comparison)
  priorWeekAccuracy: number;
}

export function detectWellnessSignals(input: WellnessInput): StudentSnapshot['wellnessSignals'] {
  const signals: StudentSnapshot['wellnessSignals'] = [];

  // Low activity — fewer than 3 active days in the week
  const activeDays = input.dailyActivity.filter(d => d.mocksTaken > 0 || d.studyHours >= 0.5).length;
  if (activeDays < 3) {
    signals.push({
      signal: 'low-activity',
      severity: activeDays === 0 ? 'high' : 'medium',
      description: `Only ${activeDays} active day${activeDays === 1 ? '' : 's'} in the last week (target: ≥4).`,
      recommendation: 'Consider a gentle check-in — ask if they\'re feeling overwhelmed or if study time is being squeezed by other commitments.',
    });
  }

  // Accuracy drop — current accuracy < prior by 10+ points
  if (input.priorWeekAccuracy > 0 && input.weeklyAccuracy < input.priorWeekAccuracy - 10) {
    signals.push({
      signal: 'accuracy-drop',
      severity: input.weeklyAccuracy < input.priorWeekAccuracy - 20 ? 'high' : 'medium',
      description: `Accuracy dropped from ${input.priorWeekAccuracy.toFixed(0)}% to ${input.weeklyAccuracy.toFixed(0)}% this week.`,
      recommendation: 'Suggest they revisit weak topics from the Error Journal. A drop usually means they\'re attempting harder material without solid foundations.',
    });
  }

  // Late-night studying — 2+ sessions started after 11 PM
  const lateNightSessions = input.dailyActivity.filter(d => d.startedAtHour >= 23 || d.startedAtHour <= 4).length;
  if (lateNightSessions >= 2) {
    signals.push({
      signal: 'late-night',
      severity: lateNightSessions >= 4 ? 'high' : 'medium',
      description: `${lateNightSessions} late-night study sessions (after 11 PM) detected this week.`,
      recommendation: 'Late-night studying hurts retention and exam performance. Suggest an earlier schedule — even 30 minutes earlier helps.',
    });
  }

  // Rapid burnout risk — high activity but declining accuracy
  const totalActivity = input.dailyActivity.reduce((s, d) => s + d.mocksTaken + d.studyHours, 0);
  if (totalActivity > 15 && input.priorWeekAccuracy > 0 && input.weeklyAccuracy < input.priorWeekAccuracy - 5) {
    signals.push({
      signal: 'rapid-burnout-risk',
      severity: 'high',
      description: `High activity (${Math.round(totalActivity)} sessions) but accuracy is declining — possible burnout.`,
      recommendation: 'Suggest a 1-day break. Sustained effort with declining returns is a classic burnout signal.',
    });
  }

  // No improvement — flat scores for 3+ weeks
  if (input.recentScores.length >= 3) {
    const scores = input.recentScores.slice(-3);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    if (max - min < 3) {
      signals.push({
        signal: 'no-improvement',
        severity: 'low',
        description: `Scores have plateaued around ${scores[0].toFixed(0)}% for the last 3 attempts.`,
        recommendation: 'A plateau means current strategies have peaked. Suggest changing study methods — new book, new YouTube channel, or try the Socratic Mentor.',
      });
    }
  }

  return signals;
}

// ---------------------------------------------------------------------------
// Generate weekly digest — called on the digest day or on-demand
// ---------------------------------------------------------------------------

export function generateWeeklyDigest(
  parent: ParentAccount,
  snapshot: StudentSnapshot,
  priorWeekSnapshot?: { studyHours: number; avgScorePct: number; mocksTaken: number },
): WeeklyDigest {
  const ws = snapshot.weeklyStats;
  const cs = snapshot.cumulative;

  // Compute comparison deltas
  const priorStudy = priorWeekSnapshot?.studyHours ?? 0;
  const priorScore = priorWeekSnapshot?.avgScorePct ?? 0;
  const priorMocks = priorWeekSnapshot?.mocksTaken ?? 0;
  const studyDelta = ws.studyHoursTotal - priorStudy;
  const scoreDelta = ws.avgScorePct - priorScore;
  const mocksDelta = ws.mocksTaken - priorMocks;
  const trend: 'improving' | 'stable' | 'declining' =
    scoreDelta > 3 ? 'improving' : scoreDelta < -3 ? 'declining' : 'stable';

  // Headline
  let headline: string;
  if (ws.mocksTaken === 0 && ws.studyHoursTotal < 1) {
    headline = `${snapshot.student.displayName} had a quiet week — no mocks taken and limited study time. Worth a gentle check-in.`;
  } else if (trend === 'improving') {
    headline = `${snapshot.student.displayName} had a great week — ${ws.mocksTaken} mocks with ${ws.avgScorePct}% average (up ${scoreDelta.toFixed(0)} points from last week).`;
  } else if (trend === 'declining') {
    headline = `${snapshot.student.displayName} stayed active (${ws.mocksTaken} mocks) but scores dipped ${Math.abs(scoreDelta).toFixed(0)} points this week.`;
  } else {
    headline = `${snapshot.student.displayName} had a steady week — ${ws.mocksTaken} mocks at ${ws.avgScorePct}% average, maintaining pace.`;
  }

  // Highlights
  const highlights: string[] = [];
  if (ws.mocksTaken > 0) highlights.push(`Completed ${ws.mocksTaken} mock${ws.mocksTaken === 1 ? '' : 's'} this week`);
  if (ws.streakDays >= 3) highlights.push(`Maintained a ${ws.streakDays}-day study streak`);
  if (ws.battlesWon > 0) highlights.push(`Won ${ws.battlesWon} battle${ws.battlesWon === 1 ? '' : 's'} in the Battle Arena`);
  if (ws.xpEarned > 0) highlights.push(`Earned ${ws.xpEarned} XP`);
  if (ws.mostImprovedTopic) highlights.push(`Most improved topic: ${ws.mostImprovedTopic}`);
  if (cs.bestScorePct === ws.avgScorePct && ws.mocksTaken > 0) highlights.push(`Set a new personal best with ${ws.avgScorePct}% this week!`);
  if (highlights.length === 0) highlights.push('No notable achievements this week — encourage them to attempt at least one mock this coming week.');

  // Focus areas
  const focusAreas: string[] = [];
  if (snapshot.weakTopics.length > 0) {
    const top = snapshot.weakTopics[0];
    focusAreas.push(`${top.subject} — ${top.topic} (${top.errorCount} errors, ${top.dominantCause} pattern)`);
  }
  if (snapshot.wellnessSignals.length > 0) {
    const sig = snapshot.wellnessSignals[0];
    focusAreas.push(`Wellness: ${sig.description}`);
  }
  if (snapshot.subjectBreakdown.length > 0) {
    const weakest = [...snapshot.subjectBreakdown].sort((a, b) => a.avgScorePct - b.avgScorePct)[0];
    focusAreas.push(`${weakest.subject} remains the weakest subject at ${weakest.avgScorePct}% — consider dedicated practice time`);
  }
  if (focusAreas.length === 0) {
    focusAreas.push('No specific weak areas flagged — encourage continued balanced practice across all subjects.');
  }

  // Wellness flags
  const wellnessFlags = snapshot.wellnessSignals.map(s => s.description);

  // Recommended parent actions
  const recommendedActions: string[] = [];
  if (snapshot.wellnessSignals.some(s => s.signal === 'low-activity' && s.severity === 'high')) {
    recommendedActions.push('Have a non-judgmental conversation — ask what\'s making it hard to study this week.');
  }
  if (snapshot.wellnessSignals.some(s => s.signal === 'late-night')) {
    recommendedActions.push('Suggest an earlier sleep schedule — even 30 minutes earlier can boost retention.');
  }
  if (snapshot.wellnessSignals.some(s => s.signal === 'rapid-burnout-risk')) {
    recommendedActions.push('Recommend a 1-day complete break from studies to recharge.');
  }
  if (snapshot.wellnessSignals.some(s => s.signal === 'accuracy-drop')) {
    recommendedActions.push('Suggest they revisit the Error Journal and re-attempt previously-wrong questions.');
  }
  if (trend === 'improving') {
    recommendedActions.push('Acknowledge the progress — positive reinforcement helps sustain momentum.');
  }
  if (snapshot.student.daysToExam > 0 && snapshot.student.daysToExam < 30) {
    recommendedActions.push(`Exam is in ${snapshot.student.daysToExam} days — suggest 2 full-length mocks per week from here.`);
  }
  if (recommendedActions.length === 0) {
    recommendedActions.push('Continue providing a calm, supportive study environment.');
  }

  // Quote of the week (rotating set)
  const quotes = [
    'Success is the sum of small efforts repeated day in and day out. — Robert Collier',
    'The expert in anything was once a beginner. — Helen Hayes',
    'It\'s not that I\'m so smart, it\'s just that I stay with problems longer. — Albert Einstein',
    'The secret of getting ahead is getting started. — Mark Twain',
    'Quality is not an act, it is a habit. — Aristotle',
    'You don\'t have to be great to start, but you have to start to be great. — Zig Ziglar',
    'Believe you can and you\'re halfway there. — Theodore Roosevelt',
  ];
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const quoteOfTheWeek = quotes[weekNum % quotes.length];

  // Date range (this week, Mon-Sun)
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    parentName: parent.displayName,
    studentName: snapshot.student.displayName,
    weekStart: weekStart.toISOString().slice(0, 10),
    weekEnd: weekEnd.toISOString().slice(0, 10),
    digestId: `digest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    headline,
    summary: {
      studyHours: Math.round(ws.studyHoursTotal * 10) / 10,
      mocksTaken: ws.mocksTaken,
      avgScorePct: ws.avgScorePct,
      accuracy: Math.round(ws.avgAccuracy),
      xpEarned: ws.xpEarned,
      streak: ws.streakDays,
      battlesWon: ws.battlesWon,
    },
    comparison: {
      studyHoursDelta: Math.round(studyDelta * 10) / 10,
      avgScorePctDelta: Math.round(scoreDelta * 10) / 10,
      mocksTakenDelta: mocksDelta,
      trend,
    },
    highlights,
    focusAreas,
    wellnessFlags,
    recommendedActions,
    quoteOfTheWeek,
    generatedAt: new Date().toISOString(),
  };
}
