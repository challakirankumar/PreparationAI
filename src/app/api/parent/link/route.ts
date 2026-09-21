import { NextResponse } from 'next/server';
import { getParent, createLink, revokeLink } from '@/lib/parent/store';
import { getEduScope } from '@/lib/ai-guards/eduscope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/parent/link
 * Body: { parentId, action: 'create' | 'revoke', studentUserId, relationship? }
 */
export async function POST(request: Request) {
  let body: { parentId?: string; action?: string; studentUserId?: string; relationship?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.parentId || !body.action || !body.studentUserId) {
    return NextResponse.json({ error: 'parentId, action, studentUserId are required' }, { status: 400 });
  }

  const parent = getParent(body.parentId);
  if (!parent) {
    return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
  }

  getEduScope().evaluate({
    userPrompt: `Parent link ${body.action} for student ${body.studentUserId}`,
    context: { agent: 'mock-generator', userId: body.parentId },
  });

  if (body.action === 'create') {
    const relationship = (body.relationship as 'parent' | 'guardian' | 'sibling' | 'mentor') ?? 'parent';
    const link = createLink(body.parentId, body.studentUserId, relationship, 'email');
    return NextResponse.json({ link, status: 'pending' });
  }

  if (body.action === 'revoke') {
    const ok = revokeLink(body.parentId, body.studentUserId);
    return NextResponse.json({ ok });
  }

  return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
}
