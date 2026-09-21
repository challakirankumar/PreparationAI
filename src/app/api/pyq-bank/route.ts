import { NextResponse } from 'next/server';
import { DEFAULT_PYQ_VOLUMES, DEFAULT_PYQ_QUESTIONS, getPYQQuestions, getPYQVolumes } from '@/lib/pyq/volume-bank';
import type { PYQFilter, PYQQuestion, PYQVolume } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory runtime cache for custom volumes and custom questions added by SuperAdmin
let customVolumesMemory: PYQVolume[] = [];
let customQuestionsMemory: PYQQuestion[] = [];

// ----------------------------------------------------------------------------
// GET /api/pyq-bank
// Query params: examId, year, volumeId, subject, topic, difficulty, search
// ----------------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const examId = url.searchParams.get('examId') || undefined;
    const yearRaw = url.searchParams.get('year');
    const volumeId = url.searchParams.get('volumeId') || undefined;
    const subject = url.searchParams.get('subject') || undefined;
    const topic = url.searchParams.get('topic') || undefined;
    const difficulty = (url.searchParams.get('difficulty') as any) || undefined;
    const searchQuery = url.searchParams.get('search') || undefined;

    const filter: PYQFilter = {
      examId,
      year: yearRaw && yearRaw !== 'all' ? parseInt(yearRaw, 10) : undefined,
      volumeId,
      subject,
      topic,
      difficulty,
      searchQuery,
    };

    const volumes = getPYQVolumes(examId, customVolumesMemory);
    const questions = getPYQQuestions(filter, customQuestionsMemory);

    return NextResponse.json({
      success: true,
      totalVolumes: volumes.length,
      volumes,
      totalQuestions: questions.length,
      questions,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------------
// POST /api/pyq-bank
// SuperAdmin ingestion endpoint for adding new N-volumes or bulk questions
// Body: { action: 'add-volume' | 'add-question' | 'reset', volume?: PYQVolume, question?: PYQQuestion }
// ----------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'add-volume' && body.volume) {
      const vol: PYQVolume = {
        ...body.volume,
        id: body.volume.id || `vol-custom-${Date.now()}`,
        isCustom: true,
        createdAt: new Date().toISOString(),
      };
      customVolumesMemory.push(vol);
      return NextResponse.json({ success: true, message: 'Volume created', volume: vol });
    }

    if (action === 'add-question' && body.question) {
      const q: PYQQuestion = {
        ...body.question,
        id: body.question.id || `pyq-custom-${Date.now()}`,
      };
      customQuestionsMemory.push(q);
      return NextResponse.json({ success: true, message: 'Question ingested', question: q });
    }

    if (action === 'reset') {
      customVolumesMemory = [];
      customQuestionsMemory = [];
      return NextResponse.json({ success: true, message: 'Custom bank reset to defaults' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action or payload' }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
