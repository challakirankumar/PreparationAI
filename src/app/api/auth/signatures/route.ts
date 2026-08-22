import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ----------------------------------------------------------------------------
// POST /api/auth/signatures
// Body: { userId, signatures: string[] }
// Bulk-inserts seen question signatures for the user. Uses a unique constraint
// on (userId, signature) so duplicates are silently skipped.
// ----------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId: string = body.userId;
    const signatures: string[] = body.signatures ?? [];

    if (!userId || signatures.length === 0) {
      return NextResponse.json({ success: true, inserted: 0 });
    }

    // Skip-create many — Prisma doesn't have a native "INSERT OR IGNORE",
    // so we filter against the existing rows first to avoid unique-constraint
    // exceptions on re-submit.
    const existing = await db.seenQuestionSignature.findMany({
      where: { userId, signature: { in: signatures } },
      select: { signature: true },
    });
    const existingSet = new Set(existing.map((e) => e.signature));
    const fresh = signatures.filter((s) => !existingSet.has(s));

    if (fresh.length > 0) {
      await db.seenQuestionSignature.createMany({
        data: fresh.map((signature) => ({ userId, signature })),
      });
    }

    return NextResponse.json({ success: true, inserted: fresh.length });
  } catch (e) {
    console.error('[auth/signatures]', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
