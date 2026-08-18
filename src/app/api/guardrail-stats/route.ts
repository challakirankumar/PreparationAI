import { NextResponse } from 'next/server';
import { getEduScope } from '@/lib/ai-guards/eduscope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/guardrail-stats
 * Returns aggregate stats + recent audit entries for the EduScope guard layer.
 * Used by the admin guardrail dashboard.
 */
export async function GET() {
  const guard = getEduScope();
  return NextResponse.json({
    stats: guard.stats(),
    recent: guard.getAuditLog(50),
  });
}

/**
 * POST /api/guardrail-stats
 * Test endpoint — accepts { prompt, agent, isMinor } and returns the
 * GuardDecision WITHOUT calling the underlying AI model. Useful for
 * demoing / debugging the guard layer in isolation.
 */
export async function POST(request: Request) {
  const guard = getEduScope();
  try {
    const { prompt, agent = 'mentor', systemPrompt, isMinor, userId, examGoal } = await request.json() as {
      prompt?: string;
      agent?: string;
      systemPrompt?: string;
      isMinor?: boolean;
      userId?: string;
      examGoal?: string;
    };
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }
    const decision = guard.evaluate({
      userPrompt: prompt,
      systemPrompt,
      context: {
        agent: agent as any,
        userId,
        examGoal,
        isMinor,
      },
    });
    return NextResponse.json({ decision });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
