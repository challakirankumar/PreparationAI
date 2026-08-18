import { NextResponse } from 'next/server';
import { ingestError, ingestBulk, type IngestInput } from '@/lib/error-journal/store';
import { getEduScope } from '@/lib/ai-guards/eduscope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/error-journal/ingest
 * Body: either a single IngestInput or { userId, entries: IngestInput[] }
 * Returns: { entry } or { count } for bulk
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // EduScope audit (no LLM call here, but we log for the audit trail)
  if (typeof body === 'object' && body !== null) {
    const userId = (body as any).userId ?? (body as any).entry?.userId;
    if (userId) {
      getEduScope().evaluate({
        userPrompt: `Error journal ingest for user ${userId}`,
        context: { agent: 'mock-generator', userId },
      });
    }
  }

  // Bulk ingest?
  if (Array.isArray((body as any).entries)) {
    const userId = (body as any).userId;
    const entries = (body as any).entries as IngestInput[];
    if (!userId || !Array.isArray(entries)) {
      return NextResponse.json({ error: 'userId and entries[] are required for bulk ingest' }, { status: 400 });
    }
    const count = ingestBulk(userId, entries);
    return NextResponse.json({ count, auditId: 'bulk' });
  }

  // Single ingest
  const input = body as IngestInput;
  if (!input.userId || !input.subject || !input.topic || !input.questionText || !input.questionId) {
    return NextResponse.json(
      { error: 'userId, subject, topic, questionText, questionId are required' },
      { status: 400 }
    );
  }
  try {
    const entry = ingestError(input);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
