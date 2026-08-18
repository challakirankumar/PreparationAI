import { NextResponse } from 'next/server';
import {
  listInstitutions,
  getInstitution,
  listBatches,
  listTeachers,
  listBatchesForStudent,
} from '@/lib/institution/store';
import type { ExamAttempt, User } from '@/lib/types';
import { computeInstitutionSummary, computeBatchMetrics } from '@/lib/institution/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/institution
 * Returns institutions + their summaries. If ?institutionId= is set, returns
 * only that institution with full institution summary (including batch mini-stats).
 * If ?userId= is set, returns only institutions the user has access to (via
 * student enrolment or teacher assignment).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const institutionId = url.searchParams.get('institutionId');
  const userId = url.searchParams.get('userId');
  const registeredUsersJson = url.searchParams.get('registeredUsers');

  // Decode the registered-users blob (sent from client since attempts live in
  // localStorage on the client — server has no DB yet).
  let attemptsByStudent: Record<string, ExamAttempt[]> = {};
  let usersById: Record<string, User> = {};
  if (registeredUsersJson) {
    try {
      const parsed = JSON.parse(registeredUsersJson) as Record<string, {
        user: User;
        attempts: ExamAttempt[];
      }>;
      for (const [, v] of Object.entries(parsed)) {
        if (v.user?.id) {
          usersById[v.user.id] = v.user;
          attemptsByStudent[v.user.id] = v.attempts ?? [];
        }
      }
    } catch {
      /* ignore — fall back to empty */
    }
  }

  if (institutionId) {
    const inst = getInstitution(institutionId);
    if (!inst) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const summary = computeInstitutionSummary(institutionId, attemptsByStudent, usersById);
    return NextResponse.json({
      institution: inst,
      summary,
      batches: listBatches(institutionId).map(b => ({
        ...b,
        metrics: computeBatchMetrics(b.id, attemptsByStudent, usersById),
      })),
      teachers: listTeachers(institutionId),
    });
  }

  // Filter by user access
  let institutions = listInstitutions();
  if (userId) {
    const userBatches = listBatchesForStudent(userId);
    const instIds = new Set(userBatches.map(b => b.institutionId));
    institutions = institutions.filter(i => instIds.has(i.id));
  }

  return NextResponse.json({
    institutions,
    summaries: institutions.map(i =>
      computeInstitutionSummary(i.id, attemptsByStudent, usersById)
    ),
  });
}
