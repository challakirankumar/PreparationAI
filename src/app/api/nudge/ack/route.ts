import { NextResponse } from 'next/server';
import { acknowledgeNudge, snoozeNudge } from '@/lib/nudge/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/nudge/ack
 * Body: { nudgeId, action: 'acknowledge' | 'snooze', snoozeUntil? }
 */
export async function POST(request: Request) {
  let body: { nudgeId?: string; action?: string; snoozeUntil?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.nudgeId || !body.action) {
    return NextResponse.json({ error: 'nudgeId and action are required' }, { status: 400 });
  }

  let ok = false;
  if (body.action === 'acknowledge') {
    ok = acknowledgeNudge(body.nudgeId);
  } else if (body.action === 'snooze') {
    if (!body.snoozeUntil) {
      return NextResponse.json({ error: 'snoozeUntil is required for snooze action' }, { status: 400 });
    }
    ok = snoozeNudge(body.nudgeId, body.snoozeUntil);
  } else {
    return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
  }

  return NextResponse.json({ ok });
}
