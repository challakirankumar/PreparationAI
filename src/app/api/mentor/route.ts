import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { getEduScope, buildContext } from '@/lib/ai-guards/eduscope';
import type { User } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface MentorRequestBody {
  messages: { role: string; content: string }[];
  profile?: Partial<User> & { id?: string };
  language?: string;
}

export async function POST(request: Request) {
  try {
    const { messages: incomingMessages, profile, language } = (await request.json()) as MentorRequestBody;
    const msgs = Array.isArray(incomingMessages) ? incomingMessages : [];
    const latestUserMsg = msgs.filter(m => m.role === 'user').pop();

    // -------- EduScope guardrail --------
    const guard = getEduScope();
    const ctx = buildContext('mentor', (profile as User | undefined) ?? null, undefined, language);
    const baseSystem = `You are "PrepMentor", a 24/7 AI academic mentor for the Preparation AI platform.
You help students preparing for competitive exams (${profile?.examGoal || 'JEE Main / NEET / GRE / etc.'}) with:
- Explaining concepts and doubts across Physics, Chemistry, Math, Biology, English, Reasoning
- Analysing their mock test performance and giving specific improvement tips
- Creating study plans (daily/weekly/monthly)
- Motivating them when they feel burnt out or anxious
- Suggesting learning strategies, time management and focus techniques

Be concise, warm, practical and exam-focused. Use short paragraphs and bullet points where helpful.
Limit response to 250 words unless asked otherwise. Never invent fake scores; if the user shares their performance, reason from it.`;

    const decision = guard.evaluate({
      userPrompt: latestUserMsg?.content ?? '',
      systemPrompt: baseSystem,
      context: ctx,
    });

    // Hard blocks — return a polite refusal without calling the model.
    if (decision.verdict === 'blocked-unsafe') {
      return NextResponse.json({
        reply: "I can't help with that — I'm here strictly to support your exam preparation. If you're feeling overwhelmed or unsafe, please reach out to a parent, teacher, or a helpline such as iCall (9152987821 in India).",
        auditId: decision.auditId,
        blocked: true,
        reason: decision.reason,
      });
    }
    if (decision.verdict === 'blocked-off-topic') {
      return NextResponse.json({
        reply: "That's outside my scope — I focus only on competitive-exam preparation (concepts, study plans, motivation, exam logistics, and career choice). Try asking me about a topic from Physics, Chemistry, Math, Biology, English, Reasoning, or your exam syllabus, and I'll dive in.",
        auditId: decision.auditId,
        blocked: true,
        reason: decision.reason,
      });
    }

    // Build the final message list.
    const systemContent = decision.rewrittenSystemPrompt;
    const finalUserMessages = msgs.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content:
        m.role === 'user' && m === latestUserMsg
          ? (decision.socraticReframe ?? decision.sanitizedPrompt)
          : m.content,
    }));

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      model: 'glm-4.6',
      stream: false,
      messages: [
        { role: 'system', content: systemContent },
        ...finalUserMessages,
      ],
    });

    let reply = completion?.choices?.[0]?.message?.content || 'I am here to help. Could you rephrase your question?';

    // Inspect the model's response for safety/PII before returning.
    const inspection = guard.inspectResponse(reply, decision.auditId);
    if (!inspection.safe) {
      reply = "I can't share that — it falls outside what I'm allowed to help with on this platform. Let's get back to your exam prep; tell me which topic you're working on.";
    } else {
      reply = inspection.cleaned;
    }

    // Socratic mode prefix so the UI can show a badge
    const socraticPrefix = decision.verdict === 'socratic'
      ? '[Socratic mode] '
      : '';

    return NextResponse.json({
      reply: socraticPrefix + reply,
      auditId: decision.auditId,
      socratic: decision.verdict === 'socratic',
      blocked: false,
    });
  } catch (e) {
    return NextResponse.json(
      {
        reply: `I'm having trouble connecting right now, but I'm still here for you. Quick tip: revise your weakest topic today and do 10 practice problems. (${(e as Error).message})`,
      },
      { status: 200 }
    );
  }
}
