import { NextResponse } from 'next/server';
import type { ProctoringSession, ProctoringEvent, SessionVerdict, IntegrityReport } from '@/lib/types';
import { getProfile, EVENT_DESCRIPTIONS, EVENT_TO_CATEGORY } from '@/lib/proctoring/profiles';
import { runRuleEngine, getCoachingText } from '@/lib/proctoring/rule-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function uid(): string { return Math.random().toString(36).slice(2, 11); }

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // ---- Create session ----
    if (action === 'create_session') {
      const { userId, examType, mockAttemptId, cameraEnabled, micEnabled } = body;
      const session: ProctoringSession = {
        id: uid(),
        mockAttemptId,
        userId,
        examType,
        status: 'pending',
        startedAt: new Date().toISOString(),
        proctoringDegraded: !cameraEnabled,
        cameraEnabled: cameraEnabled ?? true,
        micEnabled: micEnabled ?? false,
      };
      return NextResponse.json({ session });
    }

    // ---- Ingest events ----
    if (action === 'ingest_events') {
      const { sessionId, events } = body as { sessionId: string; events: ProctoringEvent[] };
      // In a real system, these would be persisted to a database.
      // For this demo, we acknowledge them.
      return NextResponse.json({ acknowledged: true, count: events?.length || 0 });
    }

    // ---- Close session ----
    if (action === 'close_session') {
      const { sessionId, events, examType } = body as { sessionId: string; events: ProctoringEvent[]; examType: string };
      
      const profile = getProfile(examType);
      const verdict = runRuleEngine(events || [], profile);
      
      const report: IntegrityReport = {
        session: {
          id: sessionId,
          userId: body.userId || '',
          examType,
          status: 'completed',
          startedAt: body.startedAt || new Date().toISOString(),
          endedAt: new Date().toISOString(),
          proctoringDegraded: body.proctoringDegraded || false,
          cameraEnabled: body.cameraEnabled ?? true,
          micEnabled: body.micEnabled ?? false,
        },
        verdict,
        disclaimer: 'This is a simulated training report based on categories published by NTA for JEE/NEET exams. It has no effect on your real exam eligibility or academic record.',
        coachingText: getCoachingText(verdict.verdictTier),
        evidenceTimeline: (events || [])
          .filter(e => e.severity !== 'low')
          .sort((a, b) => a.timestamp - b.timestamp)
          .map(e => ({
            timestamp: e.timestamp,
            formattedTime: formatExamTime(e.timestamp),
            eventType: e.eventType,
            category: EVENT_TO_CATEGORY[e.eventType] || 'Exam Environment Integrity',
            severity: e.severity,
            description: EVENT_DESCRIPTIONS[e.eventType] || e.eventType,
            evidenceUrl: e.evidenceSnapshotUrl,
          })),
      };

      return NextResponse.json({ report });
    }

    // ---- Heartbeat ----
    if (action === 'heartbeat') {
      return NextResponse.json({ alive: true, timestamp: Date.now() });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

function formatExamTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
