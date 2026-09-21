import { NextResponse } from 'next/server';
import {
  createAssignment,
  listAssignmentsForBatch,
  listAssignmentsForTeacher,
} from '@/lib/institution/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/institution/assignments?batchId=...  OR  ?teacherId=... */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const batchId = url.searchParams.get('batchId');
  const teacherId = url.searchParams.get('teacherId');
  if (!batchId && !teacherId) {
    return NextResponse.json({ error: 'batchId or teacherId is required' }, { status: 400 });
  }
  if (batchId) {
    return NextResponse.json({ assignments: listAssignmentsForBatch(batchId) });
  }
  return NextResponse.json({ assignments: listAssignmentsForTeacher(teacherId!) });
}

/** POST /api/institution/assignments  body: BatchAssignment fields (without id/createdAt) */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.batchId || !body.teacherId || !body.title) {
    return NextResponse.json(
      { error: 'batchId, teacherId, title are required' },
      { status: 400 }
    );
  }
  const assignment = createAssignment({
    batchId: body.batchId,
    teacherId: body.teacherId,
    title: body.title,
    description: body.description ?? '',
    type: body.type ?? 'practice',
    examId: body.examId,
    dueDate: body.dueDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    studentIds: body.studentIds ?? [],
  });
  return NextResponse.json({ assignment }, { status: 201 });
}
