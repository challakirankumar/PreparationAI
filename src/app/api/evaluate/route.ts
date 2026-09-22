import { NextResponse } from 'next/server';
import type {
  AnswerValue, ExamAttempt, QuestionResult, SubjectScore, TopicScore, YoutubeRec,
  GeneratedExam, BehaviorAnalysis,
} from '@/lib/types';
import { getVideosForTopic, searchUrlForTopic, thumbnailUrl, type YoutubeVideo } from '@/lib/youtube-data';
import { ingestBulk } from '@/lib/error-journal/store';
import type { IngestInput } from '@/lib/error-journal/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const exam: GeneratedExam = body.exam;
    const answers: Record<string, AnswerValue> = body.answers || {};
    const timeTaken: Record<string, number> = body.timeTaken || {};
    const attemptNumber: number = body.attemptNumber || 1;
    const previousAttempt: ExamAttempt | null = body.previousAttempt || null;
    const clientDurationSec: number = body.totalDurationSec || 0;
    const userId: string | undefined = body.userId;
    const timeLimitSec: number | undefined = body.timeLimitSec ?? exam?.durationSec;

    if (!exam || !exam.questions) {
      return NextResponse.json({ error: 'exam payload required' }, { status: 400 });
    }

    const results: QuestionResult[] = [];
    const subjectAgg: Record<string, { total: number; scored: number; correct: number; wrong: number; unattempted: number }> = {};
    const topicAgg: Record<string, { subject: string; topic: string; total: number; scored: number; correct: number }> = {};

    for (const q of exam.questions) {
      const ans = answers[q.id];
      const taken = timeTaken[q.id] ?? 0;
      let correct = false;
      let partial = false;
      let awarded = 0;

      if (!ans || ans.type === 'unanswered') {
        awarded = 0;
      } else if (ans.type === 'mcq' || ans.type === 'reading' || ans.type === 'listening') {
        if (q.correctOptions && q.correctOptions.length === 1 && ans.optionIndex === q.correctOptions[0]) {
          correct = true;
          awarded = q.marks;
        } else {
          awarded = -q.negativeMarks;
        }
      } else if (ans.type === 'msq') {
        const correctSet = new Set(q.correctOptions || []);
        const ansSet = new Set(ans.optionIndices);
        const allRight = correctSet.size === ansSet.size && [...correctSet].every((x) => ansSet.has(x));
        if (allRight) {
          correct = true;
          awarded = q.marks;
        } else if (ans.optionIndices.some((x) => correctSet.has(x))) {
          partial = true;
          awarded = q.marks / 2;
        } else {
          awarded = -q.negativeMarks;
        }
      } else if (ans.type === 'numerical') {
        const target = q.correctNumeric ?? 0;
        const tol = q.tolerance ?? 0.01;
        if (Math.abs(ans.value - target) <= tol) {
          correct = true;
          awarded = q.marks;
        } else {
          awarded = -q.negativeMarks;
        }
      } else if (ans.type === 'descriptive' || ans.type === 'writing' || ans.type === 'speaking') {
        const text = (ans.text || '').toLowerCase();
        const keys = q.answerKeys || [];
        if (text.trim().length === 0) {
          awarded = 0;
        } else {
          const hits = keys.filter((k) => text.includes(k.toLowerCase())).length;
          const ratio = keys.length > 0 ? hits / keys.length : Math.min(text.length / 200, 1);
          if (ratio >= 0.7) {
            correct = true;
            awarded = q.marks;
          } else if (ratio >= 0.4) {
            partial = true;
            awarded = q.marks * 0.5;
          } else {
            awarded = q.marks * 0.25;
          }
        }
      }

      results.push({
        questionId: q.id,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        correct,
        partial,
        awardedMarks: parseFloat(awarded.toFixed(2)),
        timeTakenSec: taken,
        confidence: correct ? 'high' : partial ? 'medium' : 'low',
      });

      if (!subjectAgg[q.subject]) subjectAgg[q.subject] = { total: 0, scored: 0, correct: 0, wrong: 0, unattempted: 0 };
      subjectAgg[q.subject].total += q.marks;
      subjectAgg[q.subject].scored += awarded;
      if (!ans || ans.type === 'unanswered') subjectAgg[q.subject].unattempted += 1;
      else if (correct) subjectAgg[q.subject].correct += 1;
      else subjectAgg[q.subject].wrong += 1;

      const tkey = `${q.subject}|${q.topic}`;
      if (!topicAgg[tkey]) topicAgg[tkey] = { subject: q.subject, topic: q.topic, total: 0, scored: 0, correct: 0 };
      topicAgg[tkey].total += q.marks;
      topicAgg[tkey].scored += awarded;
      if (correct) topicAgg[tkey].correct += 1;
    }

    const subjectScores: SubjectScore[] = Object.entries(subjectAgg).map(([subject, v]) => ({
      subject,
      total: v.total,
      scored: parseFloat(v.scored.toFixed(2)),
      correct: v.correct,
      wrong: v.wrong,
      unattempted: v.unattempted,
      accuracy: v.correct + v.wrong > 0 ? parseFloat(((v.correct / (v.correct + v.wrong)) * 100).toFixed(1)) : 0,
    }));

    const topicScores: TopicScore[] = Object.values(topicAgg).map((v) => ({
      subject: v.subject,
      topic: v.topic,
      total: v.total,
      scored: parseFloat(v.scored.toFixed(2)),
      correct: v.correct,
      accuracy: v.total > 0 ? parseFloat(((v.scored / v.total) * 100).toFixed(1)) : 0,
    }));

    const totalScored = subjectScores.reduce((a, s) => a + s.scored, 0);
    const totalMarks = exam.totalMarks;
    const attempted = results.filter((r) => r.awardedMarks !== 0 || r.correct).length;
    const correctCount = results.filter((r) => r.correct).length;
    const accuracy = attempted > 0 ? parseFloat(((correctCount / attempted) * 100).toFixed(1)) : 0;
    // Use client-provided wall-clock duration for accuracy (per-question times may not sum perfectly)
    const sumPerQuestion = results.reduce((a, r) => a + r.timeTakenSec, 0);
    const totalTime = clientDurationSec > 0 ? clientDurationSec : sumPerQuestion;
    const avgTime = results.length > 0 ? Math.round(totalTime / results.length) : 0;
    const speed = totalTime > 0 ? parseFloat((results.length / (totalTime / 3600)).toFixed(1)) : 0;

    const weakTopics = topicScores
      .filter((t) => t.accuracy < 50 && t.total > 0)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 8)
      .map((t) => t.topic);
    const strongTopics = topicScores
      .filter((t) => t.accuracy >= 75 && t.total > 0)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5)
      .map((t) => t.topic);

    const youtubeRecs: YoutubeRec[] = [];
    const seen = new Set<string>();
    for (const topic of weakTopics) {
      const vids = getVideosForTopic(topic);
      const toAdd = vids.length > 0 ? vids : [
        { videoId: 'search', title: `Search YouTube for: ${topic}`, channel: 'YouTube Search', duration: '—' } as YoutubeVideo,
      ];
      for (const v of toAdd.slice(0, 3)) {
        const key = `${topic}|${v.videoId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        youtubeRecs.push({
          topic,
          videoId: v.videoId,
          title: v.title,
          channel: v.channel,
          duration: v.duration,
          thumbnail: v.videoId === 'search' ? '' : thumbnailUrl(v.videoId),
          searchUrl: v.videoId === 'search' ? searchUrlForTopic(topic) : `https://www.youtube.com/watch?v=${v.videoId}`,
        });
      }
    }

    const pct = Math.max(1, Math.min(99.9, 50 + (totalScored / Math.max(1, totalMarks)) * 49));
    const rank = Math.max(1, Math.round((1 - pct / 100) * 1200000));
    const readinessIndex = Math.round((totalScored / Math.max(1, totalMarks)) * 1000);

    const behaviour = computeBehaviour(results, exam.startedAt);

    const attempt: ExamAttempt = {
      id: uid(),
      examId: exam.examId,
      examName: exam.examName,
      startedAt: exam.startedAt,
      submittedAt: new Date().toISOString(),
      durationSec: totalTime,
      answers,
      score: parseFloat(totalScored.toFixed(2)),
      totalMarks,
      percentile: parseFloat(pct.toFixed(2)),
      rank,
      subjectScores,
      topicScores,
      accuracy,
      speed,
      avgTimePerQuestion: avgTime,
      weakTopics,
      strongTopics,
      results,
      youtubeRecs,
      readinessIndex,
      attemptNumber,
      behavior: behaviour,
      questions: exam.questions,
    };

    // Auto-ingest wrong answers into the Error Journal (if userId provided)
    if (userId && attempt) {
      try {
        const errorInputs: IngestInput[] = [];
        for (const r of results) {
          // Skip correct answers and unattempted (unattempted is handled by time_pressure classifier naturally)
          if (r.correct) {
            // Also feed correct answers into the auto-resolve checker (in a future enhancement)
            continue;
          }
          // Find the original question
          const q = exam.questions.find(qq => qq.id === r.questionId);
          if (!q) continue;
          // Find the student's answer
          const ans = answers[q.id];
          if (!ans) continue;
          // Build a human-readable student answer
          let studentAnswer: string | undefined;
          let studentOptionIndex: number | undefined;
          let studentNumeric: number | undefined;
          if (ans.type === 'mcq' || ans.type === 'reading' || ans.type === 'listening') {
            studentOptionIndex = ans.optionIndex;
            studentAnswer = q.options?.[ans.optionIndex];
          } else if (ans.type === 'msq') {
            studentOptionIndex = ans.optionIndices[0];
            studentAnswer = ans.optionIndices.map(i => q.options?.[i]).filter(Boolean).join(', ');
          } else if (ans.type === 'numerical') {
            studentNumeric = ans.value;
            studentAnswer = String(ans.value);
          } else if (ans.type === 'descriptive' || ans.type === 'writing' || ans.type === 'speaking') {
            studentAnswer = ans.text;
          } else if (ans.type === 'unanswered') {
            studentAnswer = '(unanswered)';
          }
          errorInputs.push({
            userId,
            source: 'mock-exam',
            sourceId: attempt.id,
            examId: exam.examId,
            subject: q.subject,
            topic: q.topic,
            difficulty: q.difficulty,
            questionText: q.text,
            questionId: q.id,
            options: q.options,
            correctOptions: q.correctOptions,
            correctNumeric: q.correctNumeric,
            studentAnswer,
            studentOptionIndex,
            studentNumeric,
            timeTakenSec: r.timeTakenSec,
            timeLimitSec: timeLimitSec ? Math.round(timeLimitSec / exam.questions.length) : undefined,
            timestamp: attempt.submittedAt,
          });
        }
        if (errorInputs.length > 0) {
          ingestBulk(userId, errorInputs);
        }
      } catch (ingestErr) {
        // Don't fail the evaluation if journal ingest fails
        console.error('Error journal ingest failed:', (ingestErr as Error).message);
      }
    }

    return NextResponse.json({ attempt });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

function computeBehaviour(
  results: QuestionResult[],
  startedAt: string,
): BehaviorAnalysis {
  const subjectTimes: Record<string, number[]> = {};
  for (const r of results) {
    if (!subjectTimes[r.subject]) subjectTimes[r.subject] = [];
    subjectTimes[r.subject].push(r.timeTakenSec);
  }
  const avgTimeBySubject = Object.entries(subjectTimes).map(([subject, times]) => ({
    subject,
    avgSec: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
  }));

  const decileCount = 10;
  const bucketSize = Math.max(1, Math.ceil(results.length / decileCount));
  const speedProgression: { decile: number; avgSec: number }[] = [];
  for (let d = 0; d < decileCount; d++) {
    const start = d * bucketSize;
    const end = Math.min(results.length, start + bucketSize);
    if (start >= results.length) break;
    const slice = results.slice(start, end);
    const avg = slice.length > 0 ? Math.round(slice.reduce((a, r) => a + r.timeTakenSec, 0) / slice.length) : 0;
    speedProgression.push({ decile: d + 1, avgSec: avg });
  }

  let idleTimeSec = 0;
  let idlePauses = 0;
  for (const r of results) {
    if (r.timeTakenSec > 60) {
      idleTimeSec += r.timeTakenSec - 60;
      idlePauses += 1;
    }
  }

  const startHour = new Date(startedAt).getHours();
  let timeOfDay: BehaviorAnalysis['timeOfDay'];
  if (startHour < 5) timeOfDay = 'Night';
  else if (startHour < 9) timeOfDay = 'Early Morning';
  else if (startHour < 12) timeOfDay = 'Morning';
  else if (startHour < 17) timeOfDay = 'Afternoon';
  else if (startHour < 21) timeOfDay = 'Evening';
  else timeOfDay = 'Night';

  let paceTrend: BehaviorAnalysis['paceTrend'] = 'steady';
  if (speedProgression.length >= 2) {
    const first = speedProgression[0].avgSec;
    const last = speedProgression[speedProgression.length - 1].avgSec;
    const deltaPct = first > 0 ? (last - first) / first : 0;
    if (deltaPct < -0.15) paceTrend = 'speeding-up';
    else if (deltaPct > 0.15) paceTrend = 'slowing-down';
  }

  let hardSum = 0, hardN = 0, easySum = 0, easyN = 0;
  for (const r of results) {
    if (r.difficulty === 'hard') { hardSum += r.timeTakenSec; hardN++; }
    else if (r.difficulty === 'easy') { easySum += r.timeTakenSec; easyN++; }
  }
  const hardAvg = hardN > 0 ? hardSum / hardN : 0;
  const easyAvg = easyN > 0 ? easySum / easyN : 0;
  const difficultyTimeGap = Math.round(hardAvg - easyAvg);

  const rapidGuesses = results.filter((r) => r.timeTakenSec < 10).length;
  const answerChanges = 0;

  return {
    avgTimeBySubject,
    speedProgression,
    idleTimeSec,
    idlePauses,
    startedAtHour: startHour,
    timeOfDay,
    paceTrend,
    difficultyTimeGap,
    rapidGuesses,
    answerChanges,
  };
}
