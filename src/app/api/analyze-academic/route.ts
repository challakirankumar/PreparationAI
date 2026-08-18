import { NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import type { AcademicRecord, AcademicAnalysis } from '@/lib/types';
import { getEduScope, buildContext } from '@/lib/ai-guards/eduscope';
import type { User } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface AnalyzeRequestBody {
  record: AcademicRecord;
  examGoal?: string;
  userName?: string;
  user?: Pick<User, 'id' | 'type' | 'examGoal'>;
}

/**
 * Deterministic fallback analysis. Used when the GLM-4.6 call fails or returns
 * invalid JSON. Strengths = subjects >= 75%, weaknesses = subjects < 50%,
 * predictedReadiness = percentage × 10 (0–1000 readiness index).
 */
function buildFallback(record: AcademicRecord): AcademicAnalysis {
  const percentage =
    record.percentage ||
    (record.maxMarks > 0 ? (record.totalMarks / record.maxMarks) * 100 : 0);

  const strengths = record.subjects
    .filter((s) => s.maxMarks > 0 && (s.marks / s.maxMarks) * 100 >= 75)
    .map((s) => s.name);

  const weaknesses = record.subjects
    .filter((s) => s.maxMarks > 0 && (s.marks / s.maxMarks) * 100 < 50)
    .map((s) => s.name);

  const subjectInsights = record.subjects.map((s) => {
    const pct = s.maxMarks > 0 ? (s.marks / s.maxMarks) * 100 : 0;
    let insight: string;
    let recommendation: string;
    if (pct >= 75) {
      insight = `Strong performance at ${pct.toFixed(0)}% — solid command of ${s.name}.`;
      recommendation = `Maintain the edge with timed, advanced-level problems in ${s.name} and use it as a confidence anchor.`;
    } else if (pct >= 50) {
      insight = `Moderate performance at ${pct.toFixed(0)}% — concepts are mostly clear but precision is leaking.`;
      recommendation = `Drill chapter-wise problem sets in ${s.name} and review your mistake notebook weekly.`;
    } else {
      insight = `Weak performance at ${pct.toFixed(0)}% — foundational gaps detected in ${s.name}.`;
      recommendation = `Restart ${s.name} from NCERT/basics, build concept clarity, then scale to exam-level problems.`;
    }
    return { subject: s.name, insight, recommendation };
  });

  const predictedReadiness = Math.round(percentage * 10);
  const lower = Math.max(0, Math.round(percentage) - 5);
  const upper = Math.min(100, Math.round(percentage) + 5);
  const predictedScoreRange = `${lower}–${upper}% in target exam`;

  const studyPlan = [
    {
      phase: 'Foundation Repair',
      duration: '4 weeks',
      focus: `Close gaps in ${weaknesses[0] || 'weak areas'}`,
      tasks: [
        `Revise core concepts in ${weaknesses.slice(0, 2).join(' & ') || 'weak subjects'} from NCERT`,
        'Solve 20 practice problems daily from weak chapters',
        'Take 1 chapter-wise test per week and review every mistake',
      ],
    },
    {
      phase: 'Strength Amplification',
      duration: '3 weeks',
      focus: `Sharpen ${strengths[0] || 'strong areas'} for rank-boosting scores`,
      tasks: [
        `Move to advanced-level problems in ${strengths.slice(0, 2).join(' & ') || 'strong subjects'}`,
        'Target 95%+ accuracy in strong chapters',
        'Build short notes for rapid revision before mocks',
      ],
    },
    {
      phase: 'Full-Length Mock Phase',
      duration: 'Ongoing until exam',
      focus: 'Build exam temperament and time management',
      tasks: [
        'Take 2 full-length mocks per week on PreparationAI',
        'Analyse every mock: weak topics, silly mistakes, time-per-question',
        'Revise mistake notebook before each new mock',
      ],
    },
  ];

  const recommendedResources = [
    'NCERT textbooks (Class 11 & 12)',
    'Previous Year Question Papers (2015–2024)',
    'YouTube: Physics Wallah / Khan Academy / Unacademy Atoms',
    'Concept-specific practice books (HC Verma, MS Chouhan, etc.)',
    'Weekly mock test series on PreparationAI',
  ];

  let summary: string;
  if (percentage >= 75) {
    summary = `Excellent overall performance at ${percentage.toFixed(1)}%. ${strengths.length} strong subject${strengths.length === 1 ? '' : 's'} and ${weaknesses.length} weak area${weaknesses.length === 1 ? '' : 's'}. You are on track for a top-tier rank — keep sharpening speed and accuracy.`;
  } else if (percentage >= 50) {
    summary = `Decent performance at ${percentage.toFixed(1)}%. Concepts are largely clear but execution needs tightening. Focus on the ${weaknesses.length} weak subject${weaknesses.length === 1 ? '' : 's'} and convert them into scoring areas before the exam.`;
  } else {
    summary = `Performance at ${percentage.toFixed(1)}% indicates significant gaps. Do not panic — restart with fundamentals in weak subjects, build concept clarity, and gradually scale to exam-level problems. Consistency over the next 8 weeks can lift readiness materially.`;
  }

  return {
    summary,
    strengths,
    weaknesses,
    subjectInsights,
    predictedReadiness,
    predictedScoreRange,
    studyPlan,
    recommendedResources,
    generatedAt: new Date().toISOString(),
  };
}

/** Strict runtime validation of an unknown value as AcademicAnalysis. */
function isAcademicAnalysis(obj: unknown): obj is AcademicAnalysis {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  if (typeof o.summary !== 'string') return false;
  if (!Array.isArray(o.strengths) || !o.strengths.every((x) => typeof x === 'string')) return false;
  if (!Array.isArray(o.weaknesses) || !o.weaknesses.every((x) => typeof x === 'string')) return false;
  if (!Array.isArray(o.subjectInsights)) return false;
  if (!o.subjectInsights.every((si) => {
    if (!si || typeof si !== 'object') return false;
    const s = si as Record<string, unknown>;
    return typeof s.subject === 'string' && typeof s.insight === 'string' && typeof s.recommendation === 'string';
  })) return false;
  if (!Array.isArray(o.studyPlan)) return false;
  if (!o.studyPlan.every((sp) => {
    if (!sp || typeof sp !== 'object') return false;
    const s = sp as Record<string, unknown>;
    return typeof s.phase === 'string' && typeof s.duration === 'string' && typeof s.focus === 'string'
      && Array.isArray(s.tasks) && s.tasks.every((t) => typeof t === 'string');
  })) return false;
  if (!Array.isArray(o.recommendedResources) || !o.recommendedResources.every((r) => typeof r === 'string')) return false;
  if (typeof o.predictedReadiness !== 'number' || !isFinite(o.predictedReadiness)) return false;
  if (typeof o.predictedScoreRange !== 'string') return false;
  if (typeof o.generatedAt !== 'string') return false;
  return true;
}

/** Extract a JSON object from a possibly-fenced / prose-wrapped LLM reply. */
function extractJsonObject(text: string): unknown {
  let t = (text || '').trim();
  // Strip markdown code fences ```json ... ``` or ``` ... ```
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = t.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyzeRequestBody;
    const record = body?.record;

    if (!record || !Array.isArray(record.subjects) || record.subjects.length === 0) {
      return NextResponse.json(
        { error: 'record with at least one subject is required' },
        { status: 400 }
      );
    }

    // Normalise core numbers in case the client sent partial data.
    if (typeof record.totalMarks !== 'number' || typeof record.maxMarks !== 'number') {
      record.totalMarks = record.subjects.reduce((a, s) => a + (Number(s.marks) || 0), 0);
      record.maxMarks = record.subjects.reduce((a, s) => a + (Number(s.maxMarks) || 0), 0);
    }
    if (typeof record.percentage !== 'number' || !isFinite(record.percentage)) {
      record.percentage = record.maxMarks > 0 ? (record.totalMarks / record.maxMarks) * 100 : 0;
    }

    const examGoal = body.examGoal || 'target exam';
    const userName = body.userName || 'the student';
    const fallback = buildFallback(record);

    // -------- EduScope guardrail --------
    const guard = getEduScope();
    const ctx = buildContext('academic-analyzer', (body.user as User | undefined) ?? null);
    const userPromptForGuard = `Student: ${userName} | Exam: ${record.examName} | Subjects: ${record.subjects.map(s => `${s.name}:${s.marks}/${s.maxMarks}`).join(', ')}`;
    const baseSystem = `You are an expert academic analyst for the Preparation AI platform. Given a student's exam record, produce a thorough, actionable analysis as STRICT JSON.`;
    const decision = guard.evaluate({
      userPrompt: userPromptForGuard,
      systemPrompt: baseSystem,
      context: ctx,
    });
    // For this agent we don't hard-block (no student-facing free text), but we
    // log the audit entry and use the hardened system prompt.
    const systemContent = decision.rewrittenSystemPrompt + `\n\nReturn ONLY the JSON object — no prose, no markdown fences.`;

    try {
      const zai = await ZAI.create();
      const subjectLines = record.subjects.map((s) => {
        const pct = s.maxMarks > 0 ? ((s.marks / s.maxMarks) * 100).toFixed(1) : '0';
        const gradeSuffix = s.grade ? ` · grade ${s.grade}` : '';
        return `- ${s.name}: ${s.marks}/${s.maxMarks} (${pct}%)${gradeSuffix}`;
      }).join('\n');

      const userContent = `Student: ${userName}
Exam goal: ${examGoal}
Record: ${record.examName}${record.institution ? ` at ${record.institution}` : ''} on ${record.date}
Overall: ${record.totalMarks}/${record.maxMarks} (${record.percentage.toFixed(1)}%)
Subjects:
${subjectLines}

Analyse and return the JSON object now.`;

      const systemContentWithSchema = systemContent + `

The JSON must conform to this TypeScript interface:

interface AcademicAnalysis {
  summary: string;                      // 2-3 sentence overall evaluation, student-first tone
  strengths: string[];                  // subject names scoring >= 75% (return [] if none)
  weaknesses: string[];                 // subject names scoring < 50% (return [] if none)
  subjectInsights: { subject: string; insight: string; recommendation: string }[];  // one entry per subject
  predictedReadiness: number;           // 0-1000 readiness index (percentage * 10 is a sensible baseline)
  predictedScoreRange: string;          // e.g. "72-78% in JEE Main"
  studyPlan: { phase: string; duration: string; focus: string; tasks: string[] }[];  // 3 phases
  recommendedResources: string[];       // 4-6 specific resources (books, channels, websites)
  generatedAt: string;                  // ISO 8601 timestamp
}`;

      const completion = await zai.chat.completions.create({
        model: 'glm-4.6',
        stream: false,
        messages: [
          { role: 'system', content: systemContentWithSchema },
          { role: 'user', content: decision.sanitizedPrompt || userContent },
        ],
      });

      const raw = completion?.choices?.[0]?.message?.content || '';
      const parsed = extractJsonObject(raw);
      if (parsed && isAcademicAnalysis(parsed)) {
        const analysis: AcademicAnalysis = parsed;
        // Always stamp server time so the client sees a fresh generatedAt.
        analysis.generatedAt = new Date().toISOString();
        // EduScope response inspection (redacts any leaked PII)
        const inspection = guard.inspectResponse(analysis.summary, decision.auditId);
        if (inspection.safe) analysis.summary = inspection.cleaned;
        return NextResponse.json({ analysis, auditId: decision.auditId });
      }
      // JSON parse failed → fall back.
      return NextResponse.json({ analysis: fallback, fallback: true });
    } catch {
      // SDK / network error → fall back.
      return NextResponse.json({ analysis: fallback, fallback: true });
    }
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || 'failed to analyse academic record' },
      { status: 500 }
    );
  }
}
