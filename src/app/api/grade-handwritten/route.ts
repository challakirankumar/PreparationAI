import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { getEduScope, buildContext } from '@/lib/ai-guards/eduscope';
import type { User } from '@/lib/types';
import {
  type GradingRubric,
  type GradingResult,
  type StepGrade,
  buildGradingPrompt,
  isGradingResult,
  alignStepGrades,
  aggregateStepGrades,
  SAMPLE_RUBRICS,
} from '@/lib/grading/rubric';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90; // VLM calls can take longer

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB hard cap

function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return 0;
  const b64 = dataUrl.slice(comma + 1);
  return Math.floor((b64.length * 3) / 4);
}

function extractJsonObject(text: string): unknown {
  let t = (text || '').trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Request / response types
// ---------------------------------------------------------------------------

interface GradeRequest {
  imageDataUrl?: string;
  imageUrl?: string;
  rubric?: GradingRubric;
  rubricId?: string;     // 'sample-1' | 'sample-2' | 'sample-3' for pre-built rubrics
  user?: Pick<User, 'id' | 'type' | 'examGoal'>;
  userId?: string;
}

// ---------------------------------------------------------------------------
// GET — list sample rubrics (so the UI can show pre-built problems)
// ---------------------------------------------------------------------------

export async function GET() {
  return NextResponse.json({
    sampleRubrics: SAMPLE_RUBRICS.map((r, idx) => ({
      id: `sample-${idx + 1}`,
      title: r.problemTitle,
      subject: r.subject,
      topic: r.topic,
      totalMarks: r.totalMarks,
      stepsCount: r.steps.length,
      problemStatement: r.problemStatement,
    })),
  });
}

// ---------------------------------------------------------------------------
// POST — grade a handwritten solution
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  let body: GradeRequest;
  try {
    body = (await request.json()) as GradeRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const hasImage = !!body.imageDataUrl || !!body.imageUrl;
  if (!hasImage) {
    return NextResponse.json({ error: 'Image is required (imageDataUrl or imageUrl)' }, { status: 400 });
  }

  if (body.imageDataUrl && estimateDataUrlBytes(body.imageDataUrl) > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Image too large. Please upload under 8 MB.' }, { status: 413 });
  }

  // Resolve rubric
  let rubric: GradingRubric | undefined = body.rubric;
  if (!rubric && body.rubricId) {
    const idx = parseInt(body.rubricId.replace('sample-', ''), 10) - 1;
    if (idx >= 0 && idx < SAMPLE_RUBRICS.length) {
      rubric = SAMPLE_RUBRICS[idx];
    }
  }
  if (!rubric) {
    return NextResponse.json(
      { error: 'Either rubric or rubricId is required. Use GET /api/grade-handwritten to see available sample rubrics.' },
      { status: 400 }
    );
  }

  // -------- EduScope guardrail --------
  const guard = getEduScope();
  const ctx = buildContext('academic-analyzer', (body.user as User | undefined) ?? null);
  const baseSystem = 'You are a strict but fair board-exam evaluator. You grade handwritten solutions step-by-step against a rubric. Output only JSON.';
  const decision = guard.evaluate({
    userPrompt: `Grade handwritten solution for: ${rubric.problemTitle} (${rubric.subject}/${rubric.topic})`,
    systemPrompt: baseSystem,
    context: ctx,
  });

  // Build the multimodal user content
  const promptText = buildGradingPrompt(rubric);
  const userContent: any[] = [{ type: 'text', text: decision.sanitizedPrompt || promptText }];
  if (body.imageDataUrl) {
    userContent.push({ type: 'image_url', image_url: { url: body.imageDataUrl } });
  } else if (body.imageUrl) {
    userContent.push({ type: 'image_url', image_url: { url: body.imageUrl } });
  }

  try {
    const zai = await ZAI.create();

    const completion = body.imageDataUrl
      ? await (zai as any).chat.completions.createVision({
          messages: [
            { role: 'system', content: decision.rewrittenSystemPrompt },
            { role: 'user', content: userContent },
          ],
          thinking: { type: 'disabled' },
        })
      : await (zai as any).chat.completions.createVision({
          messages: [
            { role: 'system', content: decision.rewrittenSystemPrompt },
            { role: 'user', content: userContent },
          ],
          thinking: { type: 'disabled' },
        });

    const raw = completion?.choices?.[0]?.message?.content || '';

    // EduScope response inspection
    const inspection = guard.inspectResponse(raw, decision.auditId);
    const safeRaw = inspection.safe ? inspection.cleaned : '';

    const parsed = extractJsonObject(safeRaw);
    if (!parsed || !isGradingResult(parsed)) {
      // Fallback — return a default "manual review needed" result
      const stepGrades: StepGrade[] = rubric.steps.map(s => ({
        rubricStepIndex: s.index,
        description: s.description,
        status: 'missing' as const,
        awardedMarks: 0,
        maxMarks: s.marks,
        studentWork: '',
        feedback: 'Could not parse AI grading response — please try again or grade manually.',
        conceptsPresent: [],
        conceptsMissing: s.keyConcepts,
        mistakesIdentified: [],
      }));
      const result = aggregateStepGrades(
        stepGrades,
        rubric,
        'low',
        true,
        decision.auditId,
      );
      return NextResponse.json({ result, fallback: true, auditId: decision.auditId });
    }

    // Align with rubric (fills missing steps, clamps marks)
    const alignedStepGrades = alignStepGrades(parsed, rubric);

    const result: GradingResult = aggregateStepGrades(
      alignedStepGrades,
      rubric,
      parsed.handwritingConfidence,
      parsed.illegible,
      decision.auditId,
    );

    // Inspect overall feedback for safety
    const feedbackInspection = guard.inspectResponse(result.overallFeedback, decision.auditId);
    if (feedbackInspection.safe) {
      result.overallFeedback = feedbackInspection.cleaned;
    }

    return NextResponse.json({ result, auditId: decision.auditId });
  } catch (e) {
    // Error fallback
    const stepGrades: StepGrade[] = rubric.steps.map(s => ({
      rubricStepIndex: s.index,
      description: s.description,
      status: 'missing' as const,
      awardedMarks: 0,
      maxMarks: s.marks,
      studentWork: '',
      feedback: `Grading failed: ${(e as Error).message}. Please try again.`,
      conceptsPresent: [],
      conceptsMissing: s.keyConcepts,
      mistakesIdentified: [],
    }));
    const result = aggregateStepGrades(
      stepGrades,
      rubric,
      'low',
      true,
      decision.auditId,
    );
    return NextResponse.json({ result, fallback: true, error: (e as Error).message, auditId: decision.auditId });
  }
}
