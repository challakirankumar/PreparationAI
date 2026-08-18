import { NextResponse } from 'next/server';
import { getBatch, computeBatchMetrics } from '@/lib/institution/store';
import type { ExamAttempt, User } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/institution/cohort?batchId=...&registeredUsers=<JSON>
 * Returns full CohortMetrics for a single batch.
 *
 * registeredUsers is the JSON-encoded client map of registered users + their
 * attempts. We send it from the client because attempts live in client
 * localStorage; the server has no DB yet. Once Prisma is wired up, this can
 * be replaced with a DB query.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const batchId = url.searchParams.get('batchId');
  const registeredUsersJson = url.searchParams.get('registeredUsers');

  if (!batchId) {
    return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
  }
  const batch = getBatch(batchId);
  if (!batch) {
    return NextResponse.json({ error: 'batch not found' }, { status: 404 });
  }

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
      /* ignore */
    }
  }

  const metrics = computeBatchMetrics(batchId, attemptsByStudent, usersById);
  return NextResponse.json({ batch, metrics });
}
