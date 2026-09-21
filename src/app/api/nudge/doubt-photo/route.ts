import { NextResponse } from 'next/server';
import { createOneTapDoubtNudge } from '@/lib/nudge/store';
import { getEduScope } from '@/lib/ai-guards/eduscope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/nudge/doubt-photo
 * Body: { userId, imageDataUrl? }
 * Creates a 1-tap doubt-photo nudge — generates the pre-filled WhatsApp/Telegram
 * message that the student can forward to the bot.
 */
export async function POST(request: Request) {
  let body: { userId?: string; imageDataUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  getEduScope().evaluate({
    userPrompt: `1-tap doubt photo nudge for user ${body.userId}`,
    context: { agent: 'mock-generator', userId: body.userId },
  });

  try {
    const nudge = createOneTapDoubtNudge(body.userId, body.imageDataUrl);
    return NextResponse.json({ nudge }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
