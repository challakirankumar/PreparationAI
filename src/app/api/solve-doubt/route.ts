import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { getEduScope, buildContext } from '@/lib/ai-guards/eduscope';
import type { User } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90; // Vision calls can take longer

interface SolveDoubtRequest {
  imageDataUrl?: string;     // data:image/...;base64,.....
  imageUrl?: string;         // public URL fallback
  prompt?: string;           // student's text prompt
  user?: Pick<User, 'id' | 'type' | 'examGoal'>;
  examGoal?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  language?: string;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB hard cap

function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return 0;
  const b64 = dataUrl.slice(comma + 1);
  // Approx: 4 chars of base64 ≈ 3 bytes
  return Math.floor((b64.length * 3) / 4);
}

export async function POST(request: Request) {
  let body: SolveDoubtRequest;
  try {
    body = (await request.json()) as SolveDoubtRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const hasImage = !!body.imageDataUrl || !!body.imageUrl;
  const prompt = (body.prompt ?? '').trim();

  if (!hasImage && !prompt) {
    return NextResponse.json(
      { error: 'Either an image or a text prompt is required' },
      { status: 400 }
    );
  }

  if (body.imageDataUrl && estimateDataUrlBytes(body.imageDataUrl) > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: 'Image too large. Please upload an image under 8 MB.' },
      { status: 413 }
    );
  }

  // -------- EduScope guardrail (audit + harden) --------
  const guard = getEduScope();
  const ctx = buildContext('doubt-solver', (body.user as User | undefined) ?? null, undefined, body.language);
  const baseSystem = `You are "Doubt Solver", a multimodal academic tutor inside Preparation AI.
Given a student-uploaded image (photo of a textbook problem, handwritten solution, diagram, equation, or graph) and an optional text prompt, you must:

1. Identify what's in the image (subject, topic, problem type).
2. Diagnose the misconception or block (don't assume the student has the same context as you).
3. Apply SOCRATIC MODE: instead of giving the final answer outright, scaffold the student with 2-3 hints, ask a guiding question, and let them attempt. Once they've worked through it, confirm with a brief explanation.
4. Where applicable, draw a small labelled diagram or write the key equations in plain text.
5. If the image is illegible or unrelated to academics, politely say so and ask for a clearer image.

Be concise (≤ 280 words), warm, and exam-focused.`;

  const decision = guard.evaluate({
    userPrompt: prompt || '[image-only doubt submission]',
    systemPrompt: baseSystem,
    context: ctx,
  });

  // Hard blocks
  if (decision.verdict === 'blocked-unsafe') {
    return NextResponse.json({
      reply: "I can't help with that. If you're feeling unsafe, please reach out to a parent, teacher, or a helpline such as iCall (9152987821 in India).",
      auditId: decision.auditId,
      blocked: true,
      reason: decision.reason,
    });
  }
  if (decision.verdict === 'blocked-off-topic') {
    return NextResponse.json({
      reply: "That looks outside my scope — I only help with academic doubts. Upload a photo of a problem from your textbook, notes, or a mock test, and I'll walk you through it.",
      auditId: decision.auditId,
      blocked: true,
      reason: decision.reason,
    });
  }

  // Build the multimodal message content
  const userText = decision.socraticReframe ?? (decision.sanitizedPrompt || prompt);
  const finalUserText = userText && userText.length > 0
    ? userText
    : 'Please analyse this image and guide me through the problem step by step.';

  const userContent: any[] = [{ type: 'text', text: finalUserText }];
  if (body.imageDataUrl) {
    userContent.push({ type: 'image_url', image_url: { url: body.imageDataUrl } });
  } else if (body.imageUrl) {
    userContent.push({ type: 'image_url', image_url: { url: body.imageUrl } });
  }

  try {
    const zai = await ZAI.create();

    // If we have an image, use the vision endpoint; else fall back to chat.
    const hasImageForCall = hasImage;
    const completion = hasImageForCall
      ? await (zai as any).chat.completions.createVision({
          messages: [
            { role: 'system', content: decision.rewrittenSystemPrompt },
            ...(body.history ?? []).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userContent },
          ],
          thinking: { type: 'disabled' },
        })
      : await zai.chat.completions.create({
          model: 'glm-4.6',
          stream: false,
          messages: [
            { role: 'system', content: decision.rewrittenSystemPrompt },
            ...(body.history ?? []).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: finalUserText },
          ],
        });

    let reply = completion?.choices?.[0]?.message?.content || "I couldn't analyse that. Could you upload a clearer image or rephrase your question?";

    // Inspect response for safety/PII
    const inspection = guard.inspectResponse(reply, decision.auditId);
    if (!inspection.safe) {
      reply = "I can't share that — let's get back to your exam prep. Try uploading a different problem.";
    } else {
      reply = inspection.cleaned;
    }

    return NextResponse.json({
      reply,
      auditId: decision.auditId,
      socratic: decision.verdict === 'socratic',
      blocked: false,
      subject: guessSubject(reply),
    });
  } catch (e) {
    return NextResponse.json(
      {
        reply: `I couldn't analyse your doubt right now. Quick tip: if it's a numerical problem, identify the knowns, the unknown, and the relevant formula; then substitute and solve. (${(e as Error).message})`,
        auditId: decision.auditId,
        blocked: false,
      },
      { status: 200 }
    );
  }
}

/** Cheap heuristic to surface a subject badge in the UI. */
function guessSubject(reply: string): string | undefined {
  const r = reply.toLowerCase();
  if (r.includes('physics') || r.includes('velocity') || r.includes('force') || r.includes('energy')) return 'Physics';
  if (r.includes('chemistry') || r.includes('mole') || r.includes('reaction') || r.includes('compound')) return 'Chemistry';
  if (r.includes('math') || r.includes('equation') || r.includes('integral') || r.includes('derivative')) return 'Mathematics';
  if (r.includes('biology') || r.includes('cell') || r.includes('organism') || r.includes('gene')) return 'Biology';
  return undefined;
}
