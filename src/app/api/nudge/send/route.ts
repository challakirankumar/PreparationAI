import { NextResponse } from 'next/server';
import { sendNudge } from '@/lib/nudge/store';
import { getEduScope } from '@/lib/ai-guards/eduscope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/nudge/send
 * Body: { nudgeId }
 * Sends a specific nudge (simulates WhatsApp/Telegram API call).
 */
export async function POST(request: Request) {
  let body: { nudgeId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.nudgeId) {
    return NextResponse.json({ error: 'nudgeId is required' }, { status: 400 });
  }

  getEduScope().evaluate({
    userPrompt: `Nudge send: ${body.nudgeId}`,
    context: { agent: 'mock-generator' },
  });

  const result = sendNudge(body.nudgeId);
  return NextResponse.json(result);
}
