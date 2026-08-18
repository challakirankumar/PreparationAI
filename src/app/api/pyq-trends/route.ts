import { NextResponse } from 'next/server';
import { getPyqExam, listPyqExams } from '@/lib/pyq/pyq-data';
import { computeExamTrendReport, buildHeatmap } from '@/lib/pyq/trend-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/pyq-trends
 *   - Without params: returns list of supported exams
 *   - ?examId=... : returns full trend report for that exam
 *   - ?examId=...&topic=Kinematics : filters to a single topic (for drill-down)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const examId = url.searchParams.get('examId');

  if (!examId) {
    return NextResponse.json({
      exams: listPyqExams(),
    });
  }

  const exam = getPyqExam(examId);
  if (!exam) {
    return NextResponse.json({ error: `Unknown exam: ${examId}` }, { status: 404 });
  }

  const report = computeExamTrendReport(examId, exam);
  const heatmap = buildHeatmap(exam);

  return NextResponse.json({
    exam: {
      examId: exam.examId,
      examName: exam.examName,
      yearsCovered: exam.yearsCovered,
      totalPapers: exam.totalPapers,
    },
    report,
    heatmap,
  });
}
