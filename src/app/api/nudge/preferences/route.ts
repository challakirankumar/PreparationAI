import { NextResponse } from 'next/server';
import { getPreferences, updatePreferences } from '@/lib/nudge/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/nudge/preferences?userId=...
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  const prefs = getPreferences(userId);
  return NextResponse.json({ preferences: prefs });
}

/**
 * PATCH /api/nudge/preferences
 * Body: { userId, updates: Partial<NudgePreferences> }
 */
export async function PATCH(request: Request) {
  let body: { userId?: string; updates?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.userId || !body.updates) {
    return NextResponse.json({ error: 'userId and updates are required' }, { status: 400 });
  }
  const updated = updatePreferences(body.userId, body.updates as any);
  return NextResponse.json({ preferences: updated });
}
