import { NextResponse } from 'next/server';
import { getNudges, getPreferences } from '@/lib/nudge/store';
import { getEntries } from '@/lib/error-journal/store';
import { generateSpacedRepetitionNudges, processDueNudges } from '@/lib/nudge/store';
import { getEduScope } from '@/lib/ai-guards/eduscope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/nudge/queue?userId=...&processDue=true
 * Returns the user's nudge queue + preferences.
 * If processDue=true, also processes (sends) any due nudges.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const processDue = url.searchParams.get('processDue') === 'true';

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  getEduScope().evaluate({
    userPrompt: `Nudge queue fetch for user ${userId}`,
    context: { agent: 'mock-generator', userId },
  });

  // Optionally process due nudges
  let processed = { sent: [] as any[], snoozed: 0 };
  if (processDue) {
    processed = processDueNudges(userId) as any;
  }

  // Generate new spaced-repetition nudges from error journal
  const errorEntries = getEntries(userId);
  const generated = generateSpacedRepetitionNudges(userId, errorEntries);

  const nudges = getNudges(userId);
  const prefs = getPreferences(userId);

  return NextResponse.json({
    nudges,
    preferences: prefs,
    generated: { created: generated.created.length, skipped: generated.skipped },
    processed: { sent: processed.sent.length, snoozed: processed.snoozed },
  });
}
