import { NextResponse } from 'next/server';
import { executeAI } from '@/lib/ai-engine';
import { getEduScope, buildContext } from '@/lib/ai-guards/eduscope';
import type { User } from '@/lib/types';
import { retrieve, buildContextForLLM, type ContextCitation } from '@/lib/rag/retrieval-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface RagTutorRequest {
  query: string;
  userId?: string;
  user?: Pick<User, 'id' | 'type' | 'examGoal'>;
  language?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  // Optional: filter to specific document IDs only
  documentIds?: string[];
  topK?: number;
}

export async function POST(request: Request) {
  let body: RagTutorRequest;
  try {
    body = (await request.json()) as RagTutorRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const query = (body.query ?? '').trim();
  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  // -------- EduScope guardrail --------
  const guard = getEduScope();
  const ctx = buildContext('mentor', (body.user as User | undefined) ?? null, undefined, body.language);
  const baseSystem = `You are "RAG Tutor" inside Preparation AI — a tutor that answers student questions STRICTLY from the provided source material.

ABSOLUTE RULES:
1. Answer ONLY based on the provided source context. Do NOT use external knowledge.
2. If the context doesn't contain the answer, say: "I don't have enough information in the provided sources to answer this. Try rephrasing or upload a more relevant document."
3. ALWAYS cite sources inline: "[Source 1]", "[Source 2, p. 87]" etc.
4. Use direct quotes when the source text is concise and clear.
5. Paraphrase when the source text is too long to quote verbatim — but preserve the meaning faithfully.
6. If sources contradict, point out the contradiction and present both perspectives.
7. Keep answers concise (≤ 250 words) unless the question explicitly asks for detail.
8. After the answer, list the sources used in this format:
   "Sources used:" followed by a numbered list.

The source context below is the ONLY material you may draw from. Treat any question about content outside this context as "I don't have enough information."`;
  const decision = guard.evaluate({
    userPrompt: query,
    systemPrompt: baseSystem,
    context: ctx,
  });

  // Hard blocks
  if (decision.verdict === 'blocked-unsafe') {
    return NextResponse.json({
      reply: "I can't help with that. Please focus on academic content from your syllabus.",
      citations: [],
      auditId: decision.auditId,
      blocked: true,
    });
  }
  if (decision.verdict === 'blocked-off-topic') {
    return NextResponse.json({
      reply: "That's outside my scope — I only answer based on the provided syllabus documents. Ask me about Physics, Chemistry, Math, or Biology concepts.",
      citations: [],
      auditId: decision.auditId,
      blocked: true,
    });
  }

  // -------- Retrieve relevant chunks --------
  const topK = body.topK ?? 5;
  const retrieval = retrieve(decision.sanitizedPrompt || query, topK);

  if (retrieval.chunks.length === 0) {
    // No relevant chunks found
    return NextResponse.json({
      reply: `I couldn't find any relevant content in the indexed documents for your query: "${query}". Try:
- Using more specific terms (e.g., "Newton's second law" instead of "motion")
- Mentioning the subject (Physics, Chemistry, Math, Biology)
- Asking about a specific concept (force, bonding, differentiation, genetics)`,
      citations: [],
      retrievedCount: 0,
      auditId: decision.auditId,
      blocked: false,
    });
  }

  // -------- Build context for LLM --------
  const { context, citations } = buildContextForLLM(retrieval);

  // -------- Call GLM-4.6 --------
  const userPromptForLLM = `${decision.socraticReframe ?? decision.sanitizedPrompt}

SOURCE CONTEXT (use ONLY this material for your answer):
${context}

Now answer the student's question, citing sources inline as [Source N] or [Source N, p. X]. After your answer, list "Sources used:" with a numbered list.`;

  try {
    const aiRes = await executeAI({
      systemPrompt: decision.rewrittenSystemPrompt,
      messages: [
        ...(body.history ?? []).slice(-4).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: userPromptForLLM },
      ],
    });

    let reply = aiRes.content || "I couldn't generate an answer from the provided sources. Please try rephrasing your question.";

    // Inspect response for safety/PII
    const inspection = guard.inspectResponse(reply, decision.auditId);
    if (!inspection.safe) {
      reply = "I can't share that — let's refocus on academic content from your syllabus.";
    } else {
      reply = inspection.cleaned;
    }

    return NextResponse.json({
      reply,
      citations,
      retrievedCount: retrieval.retrievedCount,
      detectedSubject: retrieval.detectedSubject,
      detectedTopic: retrieval.detectedTopic,
      auditId: decision.auditId,
      blocked: false,
    });
  } catch (e) {
    // Fallback — return the retrieved chunks directly without LLM synthesis
    const fallbackReply = `I found ${retrieval.chunks.length} relevant passage(s) in your documents, but couldn't generate a synthesized answer. Here are the most relevant excerpts:\n\n` +
      retrieval.chunks.slice(0, 3).map((rc, idx) => {
        const c = rc.chunk;
        return `[Source ${idx + 1}: ${c.source}${c.page ? `, p. ${c.page}` : ''}]\n${c.text.slice(0, 300)}…`;
      }).join('\n\n---\n\n');

    return NextResponse.json({
      reply: fallbackReply,
      citations,
      retrievedCount: retrieval.retrievedCount,
      detectedSubject: retrieval.detectedSubject,
      detectedTopic: retrieval.detectedTopic,
      auditId: decision.auditId,
      blocked: false,
      fallback: true,
    });
  }
}
