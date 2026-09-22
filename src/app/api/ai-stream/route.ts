import { executeAI, type ChatMessage } from '@/lib/ai-engine';
import { getEduScope, buildContext } from '@/lib/ai-guards/eduscope';
import type { User } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface StreamRequestBody {
  messages: ChatMessage[];
  systemPrompt?: string;
  agent?: 'mentor' | 'socratic' | 'doubt' | 'rag';
  profile?: Partial<User> & { id?: string };
  language?: string;
  imageDataUrl?: string;
  imageUrl?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StreamRequestBody;
    const { messages = [], systemPrompt, agent = 'mentor', profile, language, imageDataUrl, imageUrl } = body;

    const latestUserMsg = messages.filter(m => m.role === 'user').pop();
    const userPrompt = typeof latestUserMsg?.content === 'string' ? latestUserMsg.content : '';

    // -------- EduScope Safety Guardrail --------
    const guard = getEduScope();
    const ctx = buildContext(agent === 'socratic' ? 'socratic' : 'mentor', (profile as User | undefined) ?? null, undefined, language);

    const defaultSystem = `You are an elite 24/7 AI Academic Mentor on Preparation AI platform.
Help the student master competitive exam concepts (${profile?.examGoal || 'JEE Main / NEET / UPSC / GRE / SAT'}).
Be structured, encouraging, highly accurate, and exam-focused. Use clear Markdown with bullet points, numbered steps, and LaTeX formulas.`;

    const baseSystem = systemPrompt || defaultSystem;
    const decision = guard.evaluate({
      userPrompt,
      systemPrompt: baseSystem,
      context: ctx,
    });

    // Hard block check
    if (decision.verdict === 'blocked-unsafe' || decision.verdict === 'blocked-off-topic') {
      const refusalMsg = decision.verdict === 'blocked-unsafe'
        ? "I can't help with that — I'm strictly here to support your exam preparation and academic studies."
        : "That's outside my scope — I focus strictly on competitive exam preparation (concepts, problems, study plans, and exam logistics). Try asking me about a topic from your exam syllabus!";

      return new Response(
        `data: ${JSON.stringify({ chunk: refusalMsg, done: true, blocked: true, reason: decision.reason })}\n\n`,
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    // Execute with multi-tier AI fallback engine
    const aiRes = await executeAI({
      systemPrompt: decision.rewrittenSystemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.role === 'user' && m === latestUserMsg
          ? (decision.socraticReframe ?? decision.sanitizedPrompt)
          : m.content,
      })),
      imageDataUrl,
      imageUrl,
    });

    const fullContent = aiRes.content;
    const encoder = new TextEncoder();

    // Stream the content with simulated real-time SSE token delivery
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial metadata
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              meta: {
                provider: aiRes.provider,
                model: aiRes.modelUsed,
                latencyMs: aiRes.latencyMs,
                fallbackTriggered: aiRes.fallbackTriggered,
                auditId: decision.auditId,
                socratic: decision.verdict === 'socratic',
              },
            })}\n\n`
          )
        );

        // Stream tokens in dynamic realistic chunks
        const words = fullContent.split(/(\s+)/);
        const chunkSize = 3; // send 3 words at a time

        for (let i = 0; i < words.length; i += chunkSize) {
          const chunk = words.slice(i, i + chunkSize).join('');
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
          );
          // 15ms delay per chunk creates high-speed ultra-smooth typing effect
          await new Promise(r => setTimeout(r, 15));
        }

        // Final completion event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err: any) {
    const fallbackMsg = "I'm reviewing your question. Quick tip: Break down the problem into given values and fundamental formulas, and try solving step-by-step!";
    return new Response(
      `data: ${JSON.stringify({ chunk: fallbackMsg, done: true, error: err?.message })}\n\n`,
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
}
