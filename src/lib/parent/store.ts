// ============================================================================
// Parent Dashboard Store — in-memory persistence
// ----------------------------------------------------------------------------
// Manages parent accounts, parent-student links (with approval flow),
// student snapshot computation, and weekly digest generation.
// ============================================================================

import type { ParentAccount, ParentStudentLink, StudentSnapshot, WeeklyDigest } from './types';
import { detectWellnessSignals, generateWeeklyDigest } from './types';
import type { ExamAttempt, AcademicRecord, User } from '@/lib/types';
import type { ErrorPatternReport, ErrorEntry } from '@/lib/error-journal/classifier';
import { getEntries } from '@/lib/error-journal/store';
import { getPattern } from '@/lib/exams/patterns';

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

interface ParentStore {
  parents: Map<string, ParentAccount>;
  links: ParentStudentLink[];
}

declare global {
  // eslint-disable-next-line no-var
  var __parent_store__: ParentStore | undefined;
}

function getStore(): ParentStore {
  if (!globalThis.__parent_store__) {
    const store: ParentStore = {
      parents: new Map(),
      links: [],
    };
    seedDemoData(store);
    globalThis.__parent_store__ = store;
  }
  return globalThis.__parent_store__;
}

function seedDemoData(store: ParentStore) {
  // Demo parent account
  const parent: ParentAccount = {
    id: 'parent_demo_1',
    displayName: 'Mr. Sharma',
    email: 'parent@demo.com',
    phone: '+91-9876543210',
    password: 'parent123',
    linkedStudentIds: ['student_demo_1', 'student_demo_2'],
    weeklyDigestEnabled: true,
    digestDay: 'sunday',
    digestEmail: 'parent@demo.com',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  };
  store.parents.set(parent.id, parent);

  // Demo approved links
  const link1: ParentStudentLink = {
    parentUserId: parent.id,
    studentUserId: 'student_demo_1',
    relationship: 'parent',
    approvalStatus: 'approved',
    approvedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    invitationMethod: 'email',
  };
  const link2: ParentStudentLink = {
    parentUserId: parent.id,
    studentUserId: 'student_demo_2',
    relationship: 'parent',
    approvalStatus: 'approved',
    approvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    invitationMethod: 'email',
  };
  store.links.push(link1, link2);
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export function authenticateParent(email: string, password: string): ParentAccount | null {
  const store = getStore();
  for (const parent of store.parents.values()) {
    if (parent.email.toLowerCase() === email.toLowerCase() && parent.password === password) {
      parent.lastLoginAt = new Date().toISOString();
      return parent;
    }
  }
  return null;
}

export function getParent(parentId: string): ParentAccount | undefined {
  return getStore().parents.get(parentId);
}

// ---------------------------------------------------------------------------
// Link management
// ---------------------------------------------------------------------------

export function getLinkedStudents(parentId: string): ParentStudentLink[] {
  return getStore().links.filter(l => l.parentUserId === parentId && l.approvalStatus === 'approved');
}

export function getPendingLinks(parentId: string): ParentStudentLink[] {
  return getStore().links.filter(l => l.parentUserId === parentId && l.approvalStatus === 'pending');
}

export function createLink(parentId: string, studentUserId: string, relationship: ParentStudentLink['relationship'], invitationMethod: ParentStudentLink['invitationMethod'] = 'email'): ParentStudentLink {
  const store = getStore();
  // Check if link already exists
  const existing = store.links.find(l => l.parentUserId === parentId && l.studentUserId === studentUserId);
  if (existing) return existing;
  const link: ParentStudentLink = {
    parentUserId: parentId,
    studentUserId,
    relationship,
    approvalStatus: 'pending',
    createdAt: new Date().toISOString(),
    invitationMethod,
  };
  store.links.push(link);
  // Also add to parent's linkedStudentIds (will be filtered by approvalStatus on read)
  const parent = store.parents.get(parentId);
  if (parent && !parent.linkedStudentIds.includes(studentUserId)) {
    parent.linkedStudentIds.push(studentUserId);
  }
  return link;
}

export function approveLink(parentId: string, studentUserId: string): boolean {
  const store = getStore();
  const link = store.links.find(l => l.parentUserId === parentId && l.studentUserId === studentUserId);
  if (!link) return false;
  link.approvalStatus = 'approved';
  link.approvedAt = new Date().toISOString();
  return true;
}

export function revokeLink(parentId: string, studentUserId: string): boolean {
  const store = getStore();
  const link = store.links.find(l => l.parentUserId === parentId && l.studentUserId === studentUserId);
  if (!link) return false;
  link.approvalStatus = 'revoked';
  const parent = store.parents.get(parentId);
  if (parent) {
    parent.linkedStudentIds = parent.linkedStudentIds.filter(id => id !== studentUserId);
  }
  return true;
}

// ---------------------------------------------------------------------------
// Build student snapshot — read-only view of student's progress
// ---------------------------------------------------------------------------

export interface SnapshotInput {
  studentUser: User;
  attempts: ExamAttempt[];
  academicRecords: AcademicRecord[];
  errorEntries: ErrorEntry[];
  errorReport?: ErrorPatternReport;
}

export function buildStudentSnapshot(input: SnapshotInput): StudentSnapshot {
  const { studentUser, attempts, errorEntries } = input;
  const pattern = getPattern(studentUser.examGoal);

  // Days to exam
  const examDateStr = studentUser.examDates?.[studentUser.examGoal] ?? studentUser.examDate;
  const examDate = examDateStr ? new Date(examDateStr) : null;
  const daysToExam = examDate ? Math.max(0, Math.ceil((examDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : 0;

  // Weekly stats — last 7 days
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekAttempts = attempts.filter(a => new Date(a.submittedAt).getTime() >= weekAgo);
  const studyHoursTotal = weekAttempts.reduce((s, a) => s + (a.durationSec / 3600), 0);
  const questionsAttempted = weekAttempts.reduce((s, a) => s + a.results.length, 0);
  const avgAccuracy = weekAttempts.length > 0 ? Math.round(weekAttempts.reduce((s, a) => s + a.accuracy, 0) / weekAttempts.length) : 0;
  const avgScorePct = weekAttempts.length > 0 ? Math.round(weekAttempts.reduce((s, a) => s + (a.score / Math.max(1, a.totalMarks)) * 100, 0) / weekAttempts.length) : 0;
  const battlesWon = 0; // would come from battle store in production
  const battlesLost = 0;
  const xpEarned = 0; // would come from battle store

  // Streak: consecutive days (counting back from today) with at least 1 mock or 30 min study
  const dayBuckets: Record<string, { mocks: number; studyHours: number }> = {};
  for (const a of attempts) {
    const day = new Date(a.submittedAt).toISOString().slice(0, 10);
    if (!dayBuckets[day]) dayBuckets[day] = { mocks: 0, studyHours: 0 };
    dayBuckets[day].mocks++;
    dayBuckets[day].studyHours += a.durationSec / 3600;
  }
  let streakDays = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayKey = d.toISOString().slice(0, 10);
    const bucket = dayBuckets[dayKey];
    if (bucket && (bucket.mocks > 0 || bucket.studyHours >= 0.5)) {
      streakDays++;
    } else if (i > 0) {
      break; // streak broken (but skip today if no activity yet)
    }
  }

  // Active days this week
  const activeDays = Object.entries(dayBuckets).filter(([day, b]) => {
    const d = new Date(day);
    return d.getTime() >= weekAgo && (b.mocks > 0 || b.studyHours >= 0.5);
  }).length;

  // Most-improved topic this week vs prior week
  const priorWeekAttempts = attempts.filter(a => {
    const t = new Date(a.submittedAt).getTime();
    return t >= weekAgo - 7 * 24 * 60 * 60 * 1000 && t < weekAgo;
  });
  const weekTopics = aggregateTopicAccuracy(weekAttempts);
  const priorWeekTopics = aggregateTopicAccuracy(priorWeekAttempts);
  let mostImprovedTopic: string | undefined;
  let mostImprovedDelta = 0;
  for (const [topic, acc] of Object.entries(weekTopics)) {
    const prior = priorWeekTopics[topic];
    if (prior !== undefined && acc > prior) {
      const delta = acc - prior;
      if (delta > mostImprovedDelta) {
        mostImprovedDelta = delta;
        mostImprovedTopic = topic;
      }
    }
  }
  let decliningTopic: string | undefined;
  let decliningDelta = 0;
  for (const [topic, acc] of Object.entries(weekTopics)) {
    const prior = priorWeekTopics[topic];
    if (prior !== undefined && acc < prior) {
      const delta = prior - acc;
      if (delta > decliningDelta) {
        decliningDelta = delta;
        decliningTopic = topic;
      }
    }
  }

  // Cumulative stats
  const totalMocks = attempts.length;
  const allScores = attempts.map(a => (a.score / Math.max(1, a.totalMarks)) * 100);
  const bestScorePct = allScores.length > 0 ? Math.round(Math.max(...allScores)) : 0;
  const avgScorePctCumulative = allScores.length > 0 ? Math.round(allScores.reduce((s, x) => s + x, 0) / allScores.length) : 0;
  const totalStudyHours = attempts.reduce((s, a) => s + (a.durationSec / 3600), 0);

  // Recent activity (last 10)
  const recentActivity = [...attempts]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 10)
    .map(a => ({
      timestamp: a.submittedAt,
      type: 'mock' as const,
      description: `${a.examName} attempt #${a.attemptNumber ?? '?'}`,
      score: Math.round((a.score / Math.max(1, a.totalMarks)) * 100),
      duration: `${Math.round(a.durationSec / 60)} min`,
    }));

  // Subject breakdown
  const subjectMap: Record<string, { scores: number[]; accuracies: number[]; mocks: number }> = {};
  for (const a of attempts) {
    for (const s of a.subjectScores) {
      if (!subjectMap[s.subject]) subjectMap[s.subject] = { scores: [], accuracies: [], mocks: 0 };
      const scorePct = s.total > 0 ? (s.scored / s.total) * 100 : 0;
      subjectMap[s.subject].scores.push(scorePct);
      subjectMap[s.subject].accuracies.push(s.accuracy);
      subjectMap[s.subject].mocks++;
    }
  }
  const subjectBreakdown = Object.entries(subjectMap).map(([subject, d]) => {
    const avgScore = d.scores.length > 0 ? d.scores.reduce((s, x) => s + x, 0) / d.scores.length : 0;
    const avgAcc = d.accuracies.length > 0 ? d.accuracies.reduce((s, x) => s + x, 0) / d.accuracies.length : 0;
    // Trend: last 2 vs prior 2 (simple)
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (d.scores.length >= 4) {
      const recent = d.scores.slice(-2).reduce((s, x) => s + x, 0) / 2;
      const prior = d.scores.slice(-4, -2).reduce((s, x) => s + x, 0) / 2;
      if (recent > prior + 5) trend = 'improving';
      else if (recent < prior - 5) trend = 'declining';
    }
    return {
      subject,
      avgScorePct: Math.round(avgScore),
      accuracy: Math.round(avgAcc),
      mocksAttempted: d.mocks,
      trend,
    };
  });

  // Weak topics from error journal
  const weakTopics = errorEntries
    .filter(e => !e.resolved)
    .reduce((acc, e) => {
      const key = `${e.subject}|${e.topic}`;
      const existing = acc.find(x => x.subject === e.subject && x.topic === e.topic);
      if (existing) {
        existing.errorCount++;
      } else {
        acc.push({
          subject: e.subject,
          topic: e.topic,
          errorCount: 1,
          dominantCause: e.rootCause,
        });
      }
      return acc;
    }, [] as { subject: string; topic: string; errorCount: number; dominantCause: string }[])
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 5);

  // Wellness signals
  const dailyActivity: { date: string; mocksTaken: number; studyHours: number; startedAtHour: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayKey = d.toISOString().slice(0, 10);
    const dayAttempts = attempts.filter(a => new Date(a.submittedAt).toISOString().slice(0, 10) === dayKey);
    dailyActivity.push({
      date: dayKey,
      mocksTaken: dayAttempts.length,
      studyHours: dayAttempts.reduce((s, a) => s + a.durationSec / 3600, 0),
      startedAtHour: dayAttempts.length > 0 ? new Date(dayAttempts[0].startedAt).getHours() : 0,
    });
  }
  const recentScores = attempts.slice(0, 5).map(a => (a.score / Math.max(1, a.totalMarks)) * 100).reverse();
  const priorWeekAccuracy = priorWeekAttempts.length > 0 ? priorWeekAttempts.reduce((s, a) => s + a.accuracy, 0) / priorWeekAttempts.length : 0;
  const wellnessSignals = detectWellnessSignals({
    dailyActivity,
    recentScores,
    weeklyAccuracy: avgAccuracy,
    priorWeekAccuracy,
  });

  // 8-week trend
  const weeklyTrend: StudentSnapshot['weeklyTrend'] = [];
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (w * 7 + weekStart.getDay()));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const weekAttempts = attempts.filter(a => {
      const d = new Date(a.submittedAt);
      return d >= weekStart && d < weekEnd;
    });
    weeklyTrend.push({
      weekStart: weekStart.toISOString().slice(0, 10),
      mocksTaken: weekAttempts.length,
      avgScorePct: weekAttempts.length > 0 ? Math.round(weekAttempts.reduce((s, a) => s + (a.score / Math.max(1, a.totalMarks)) * 100, 0) / weekAttempts.length) : 0,
      studyHours: Math.round(weekAttempts.reduce((s, a) => s + a.durationSec / 3600, 0) * 10) / 10,
    });
  }

  // Grade label
  const grade = studentUser.type === 'school-11' ? 'Class 11' :
    studentUser.type === 'school-12' ? 'Class 12' :
    studentUser.type === 'ug' ? 'Undergraduate' : 'Graduate';

  return {
    student: {
      userId: studentUser.id,
      displayName: studentUser.name,
      avatarUrl: studentUser.avatar,
      examGoal: studentUser.examGoal,
      examName: pattern?.name ?? studentUser.examGoal,
      examDate: examDateStr,
      daysToExam,
      grade,
      joinedAt: studentUser.joinedAt,
    },
    weeklyStats: {
      studyHoursTotal: Math.round(studyHoursTotal * 10) / 10,
      mocksTaken: weekAttempts.length,
      questionsAttempted,
      avgAccuracy,
      avgScorePct,
      battlesWon,
      battlesLost,
      xpEarned,
      streakDays,
      activeDays,
      mostImprovedTopic,
      decliningTopic,
    },
    cumulative: {
      totalMocks,
      bestScorePct,
      avgScorePct: avgScorePctCumulative,
      totalStudyHours: Math.round(totalStudyHours * 10) / 10,
      totalXp: 0,
      battlesWon,
      battlesLost,
      errorJournalEntries: errorEntries.length,
      errorJournalResolved: errorEntries.filter(e => e.resolved).length,
    },
    recentActivity,
    subjectBreakdown,
    weakTopics,
    wellnessSignals,
    weeklyTrend,
  };
}

function aggregateTopicAccuracy(attempts: ExamAttempt[]): Record<string, number> {
  const topicMap: Record<string, { correct: number; total: number }> = {};
  for (const a of attempts) {
    for (const t of a.topicScores) {
      const key = `${t.subject}|${t.topic}`;
      if (!topicMap[key]) topicMap[key] = { correct: 0, total: 0 };
      topicMap[key].correct += t.correct;
      topicMap[key].total += t.total;
    }
  }
  const result: Record<string, number> = {};
  for (const [key, v] of Object.entries(topicMap)) {
    if (v.total > 0) result[key] = (v.correct / v.total) * 100;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Generate weekly digest (calls buildStudentSnapshot internally)
// ---------------------------------------------------------------------------

export function buildWeeklyDigest(parent: ParentAccount, snapshot: StudentSnapshot): WeeklyDigest {
  // Use the snapshot's weekly trend to get the prior week's data
  const priorWeek = snapshot.weeklyTrend[snapshot.weeklyTrend.length - 2];
  return generateWeeklyDigest(
    parent,
    snapshot,
    priorWeek ? {
      studyHours: priorWeek.studyHours,
      avgScorePct: priorWeek.avgScorePct,
      mocksTaken: priorWeek.mocksTaken,
    } : undefined,
  );
}

// ---------------------------------------------------------------------------
// Create new parent account
// ---------------------------------------------------------------------------

export function createParentAccount(input: {
  displayName: string;
  email: string;
  password: string;
  phone?: string;
}): ParentAccount {
  const store = getStore();
  const id = `parent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const parent: ParentAccount = {
    id,
    displayName: input.displayName,
    email: input.email,
    phone: input.phone,
    password: input.password,
    linkedStudentIds: [],
    weeklyDigestEnabled: true,
    digestDay: 'sunday',
    digestEmail: input.email,
    createdAt: new Date().toISOString(),
  };
  store.parents.set(id, parent);
  return parent;
}
