import { NextResponse } from 'next/server';
import {
  createBatch,
  getInstitution,
  listBatches,
  enrollStudentInBatch,
} from '@/lib/institution/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/institution/batches?institutionId=... */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const institutionId = url.searchParams.get('institutionId');
  if (!institutionId) {
    return NextResponse.json({ error: 'institutionId is required' }, { status: 400 });
  }
  if (!getInstitution(institutionId)) {
    return NextResponse.json({ error: 'institution not found' }, { status: 404 });
  }
  return NextResponse.json({ batches: listBatches(institutionId) });
}

/** POST /api/institution/batches  body: { institutionId, name, cohortTier, targetExam, capacity, startDate, endDate, teacherIds? } */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.institutionId || !body.name || !body.targetExam) {
    return NextResponse.json(
      { error: 'institutionId, name, targetExam are required' },
      { status: 400 }
    );
  }
  if (!getInstitution(body.institutionId)) {
    return NextResponse.json({ error: 'institution not found' }, { status: 404 });
  }
  const batch = createBatch({
    institutionId: body.institutionId,
    name: body.name,
    cohortTier: body.cohortTier ?? 'foundation',
    targetExam: body.targetExam,
    startDate: body.startDate ?? new Date().toISOString(),
    endDate: body.endDate ?? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    capacity: body.capacity ?? 60,
    teacherIds: body.teacherIds,
  });
  return NextResponse.json({ batch }, { status: 201 });
}

/** PATCH /api/institution/batches  body: { batchId, userId, action: 'enroll' | 'unenroll' } */
export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.batchId || !body.userId || !body.action) {
    return NextResponse.json(
      { error: 'batchId, userId, action are required' },
      { status: 400 }
    );
  }
  if (body.action === 'enroll') {
    enrollStudentInBatch(body.userId, body.batchId);
  } else if (body.action === 'unenroll') {
    // unenrollStudentFromBatch is exported in the store; we'll call it via a dynamic import.
    const { unenrollStudentFromBatch } = await import('@/lib/institution/store');
    unenrollStudentFromBatch(body.userId, body.batchId);
  } else {
    return NextResponse.json({ error: 'action must be enroll or unenroll' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
