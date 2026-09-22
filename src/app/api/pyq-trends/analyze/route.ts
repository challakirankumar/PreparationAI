import { NextResponse } from 'next/server';
import { executeAI } from '@/lib/ai-engine';
import { getPyqExam } from '@/lib/pyq/pyq-data';
import { computeExamTrendReport } from '@/lib/pyq/trend-engine';
import { getEduScope } from '@/lib/ai-guards/eduscope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface AnalyzeRequest {
  examId: string;
  userExamGoal?: string;
  userId?: string;
}

interface PyqAnalysis {
  highPriorityTopics: { topic: string; subject: string; reason: string; predictedCount: number }[];
  surpriseCandidates: { topic: string; subject: string; reason: string }[];
  decliningAreas: { topic: string; subject: string; reason: string }[];
  focusStrategy: string;
  timeAllocation: { subject: string; percentage: number; rationale: string }[];
  keyInsight: string;
  generatedAt: string;
}

function isPyqAnalysis(obj: unknown): obj is PyqAnalysis {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  if (!Array.isArray(o.highPriorityTopics)) return false;
  if (!Array.isArray(o.surpriseCandidates)) return false;
  if (!Array.isArray(o.decliningAreas)) return false;
  if (typeof o.focusStrategy !== 'string') return false;
  if (!Array.isArray(o.timeAllocation)) return false;
  if (typeof o.keyInsight !== 'string') return false;
  return true;
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

function buildFallbackAnalysis(examId: string): PyqAnalysis {
  const exam = getPyqExam(examId);
  if (!exam) {
    return {
      highPriorityTopics: [],
      surpriseCandidates: [],
      decliningAreas: [],
      focusStrategy: 'No historical data available for this exam.',
      timeAllocation: [],
      keyInsight: 'PYQ analysis unavailable.',
      generatedAt: new Date().toISOString(),
    };
  }
  const report = computeExamTrendReport(examId, exam);
  const hot = report.hotTopics.slice(0, 5);
  const emerging = report.emergingTopics.slice(0, 3);
  const declining = report.watchList.slice(0, 3);
  const subjects = report.subjectBreakdown;
  const totalPredicted = subjects.reduce((s, sb) => s + sb.totalPredictedQuestions, 0) || 1;

  return {
    highPriorityTopics: hot.map(t => ({
      topic: t.topic,
      subject: t.subject,
      reason: `${t.momentum} trend · ${t.appearanceProb}% appearance prob · predicted ${t.predictedNextCount} questions`,
      predictedCount: t.predictedNextCount,
    })),
    surpriseCandidates: emerging.map(t => ({
      topic: t.topic,
      subject: t.subject,
      reason: `${t.momentum} momentum (slope ${t.momentumScore.toFixed(2)}) · last appeared ${t.lastAppearedYear ?? 'never'}`,
    })),
    decliningAreas: declining.map(t => ({
      topic: t.topic,
      subject: t.subject,
      reason: `Recent frequency ${t.recentFrequency}/yr vs lifetime ${t.lifetimeFrequency}/yr (${t.momentumScore.toFixed(2)} slope)`,
    })),
    focusStrategy:
      `Prioritise ${hot.slice(0, 3).map(t => t.topic).join(', ')} — these topics have ${hot[0]?.appearanceProb ?? 0}%+ appearance probability based on the last ${exam.yearsCovered[1] - exam.yearsCovered[0]} years. ` +
      `Treat the emerging topics (${emerging.map(t => t.topic).slice(0, 2).join(', ') || 'none'}) as surprise candidates — brush through them once. ` +
      `Don't waste time on declining areas (${declining.map(t => t.topic).slice(0, 2).join(', ') || 'none'}) unless they're your weak spots.`,
    timeAllocation: subjects.map(s => ({
      subject: s.subject,
      percentage: Math.round((s.totalPredictedQuestions / totalPredicted) * 100),
      rationale: `${s.totalPredictedQuestions} questions predicted across ${s.totalTopics} topics`,
    })),
    keyInsight:
      `Based on ${exam.totalPapers} past papers spanning ${exam.yearsCovered[0]}–${exam.yearsCovered[1]}, ${hot.length} topics have a high (>60%) appearance probability and ${emerging.length} are trending upward. ` +
      `Your strongest ROI will come from mastering the top 3 hot topics first.`,
    generatedAt: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  let body: AnalyzeRequest;
  try {
    body = (await request.json()) as AnalyzeRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body.examId) {
    return NextResponse.json({ error: 'examId is required' }, { status: 400 });
  }
  const exam = getPyqExam(body.examId);
  if (!exam) {
    return NextResponse.json({ error: `Unknown exam: ${body.examId}` }, { status: 404 });
  }

  const report = computeExamTrendReport(body.examId, exam);
  const fallback = buildFallbackAnalysis(body.examId);

  // -------- EduScope guardrail --------
  const guard = getEduScope();
  const promptForGuard = `PYQ trend analysis for ${exam.examName} — ${report.topicTrends.length} topics, ${exam.totalPapers} past papers`;
  const baseSystem = `You are an expert exam-pattern analyst for the Preparation AI platform. Given a topic-level trend report mined from previous year question papers (PYQs), produce a strategic analysis as STRICT JSON. Output ONLY the JSON — no prose, no markdown fences.`;
  const decision = guard.evaluate({
    userPrompt: promptForGuard,
    systemPrompt: baseSystem,
    context: { agent: 'mock-generator', userId: body.userId },
  });

  // Compress the report into a compact text form for the prompt
  const topicLines = report.topicTrends
    .sort((a, b) => b.appearanceProb - a.appearanceProb)
    .slice(0, 25) // top 25 topics to keep prompt short
    .map(t => `- ${t.subject} | ${t.topic}: prob=${t.appearanceProb}%, predicted=${t.predictedNextCount}Q, momentum=${t.momentum}(${t.momentumScore.toFixed(2)}), recentFreq=${t.recentFrequency}/yr, lifetimeFreq=${t.lifetimeFrequency}/yr, lastYear=${t.lastAppearedYear ?? 'never'}, confidence=${t.confidenceScore}, diffTrend=${t.difficultyTrend}`)
    .join('\n');

  const subjectSummary = report.subjectBreakdown
    .map(s => `${s.subject}: ${s.totalTopics} topics, ${s.totalPredictedQuestions} predicted Qs, avg ${s.avgAppearanceProb}% prob`)
    .join('; ');

  const userContent = `Exam: ${exam.examName} (${body.userExamGoal ?? body.examId})
Years covered: ${exam.yearsCovered[0]}–${exam.yearsCovered[1]} (${exam.totalPapers} past papers)
Subject summary: ${subjectSummary}

Top 25 topics by appearance probability:
${topicLines}

Produce a strategic analysis as STRICT JSON conforming to this TypeScript interface:

interface PyqAnalysis {
  highPriorityTopics: { topic: string; subject: string; reason: string; predictedCount: number }[];  // 4-6 topics with ≥60% appearance prob
  surpriseCandidates: { topic: string; subject: string; reason: string }[];  // 2-3 emerging topics that might surprise
  decliningAreas: { topic: string; subject: string; reason: string }[];  // 2-3 declining topics — mention if they're worth deprioritising
  focusStrategy: string;  // 3-4 sentence strategic recommendation
  timeAllocation: { subject: string; percentage: number; rationale: string }[];  // one entry per subject, percentages sum to ~100
  keyInsight: string;  // 1-2 sentence headline insight
  generatedAt: string;  // ISO timestamp
}

Return ONLY the JSON object.`;

  try {
    const systemContentWithSchema = decision.rewrittenSystemPrompt + `

The JSON must conform to this TypeScript interface:

interface PyqAnalysis {
  highPriorityTopics: { topic: string; subject: string; reason: string; predictedCount: number }[];
  surpriseCandidates: { topic: string; subject: string; reason: string }[];
  decliningAreas: { topic: string; subject: string; reason: string }[];
  focusStrategy: string;
  timeAllocation: { subject: string; percentage: number; rationale: string }[];
  keyInsight: string;
  generatedAt: string;
}`;

    const aiRes = await executeAI({
      systemPrompt: systemContentWithSchema,
      messages: [{ role: 'user', content: decision.sanitizedPrompt || userContent }],
      jsonMode: true,
    });

    const raw = aiRes.content || '';
    const parsed = extractJsonObject(raw);
    if (parsed && isPyqAnalysis(parsed)) {
      const analysis = parsed as PyqAnalysis;
      analysis.generatedAt = new Date().toISOString();
      // EduScope response inspection
      const inspection = guard.inspectResponse(analysis.focusStrategy + ' ' + analysis.keyInsight, decision.auditId);
      if (inspection.safe) {
        analysis.focusStrategy = inspection.cleaned.split(' ').slice(0, -50).join(' ') || inspection.cleaned;
      }
      return NextResponse.json({ analysis, auditId: decision.auditId });
    }
    return NextResponse.json({ analysis: fallback, fallback: true, auditId: decision.auditId });
  } catch {
    return NextResponse.json({ analysis: fallback, fallback: true, auditId: decision.auditId });
  }
}
