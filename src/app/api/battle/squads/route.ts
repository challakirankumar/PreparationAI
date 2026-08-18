import { NextResponse } from 'next/server';
import {
  listSquads,
  getSquad,
  createSquad,
  joinSquad,
  leaveSquad,
  getPlayerSquad,
  getSquadMembers,
} from '@/lib/battle/battle-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/battle/squads?userId=...&squadId=...
 *   - No params: list all squads
 *   - ?userId=...: returns user's current squad + members
 *   - ?squadId=...: returns specific squad + its members
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const squadId = url.searchParams.get('squadId');

  if (squadId) {
    const squad = getSquad(squadId);
    if (!squad) return NextResponse.json({ error: 'Squad not found' }, { status: 404 });
    const members = getSquadMembers(squadId);
    return NextResponse.json({ squad, members });
  }

  if (userId) {
    const mySquad = getPlayerSquad(userId);
    if (mySquad) {
      const members = getSquadMembers(mySquad.id);
      return NextResponse.json({
        squads: listSquads(),
        mySquad,
        mySquadMembers: members,
      });
    }
    return NextResponse.json({ squads: listSquads(), mySquad: null });
  }

  return NextResponse.json({ squads: listSquads() });
}

interface CreateSquadRequest {
  action: 'create' | 'join' | 'leave';
  name?: string;
  description?: string;
  examGoal?: string;
  squadId?: string;
  userId: string;
  displayName?: string;
}

export async function POST(request: Request) {
  let body: CreateSquadRequest;
  try {
    body = (await request.json()) as CreateSquadRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body.action || !body.userId) {
    return NextResponse.json({ error: 'action and userId are required' }, { status: 400 });
  }

  if (body.action === 'create') {
    if (!body.name || !body.examGoal) {
      return NextResponse.json({ error: 'name and examGoal are required for create' }, { status: 400 });
    }
    const squad = createSquad({
      name: body.name,
      description: body.description ?? '',
      examGoal: body.examGoal,
      createdByUserId: body.userId,
      createdByDisplayName: body.displayName ?? 'Anonymous',
    });
    return NextResponse.json({ squad }, { status: 201 });
  }

  if (body.action === 'join') {
    if (!body.squadId) {
      return NextResponse.json({ error: 'squadId is required for join' }, { status: 400 });
    }
    const squad = joinSquad(body.squadId, body.userId);
    if (!squad) return NextResponse.json({ error: 'Squad not found' }, { status: 404 });
    return NextResponse.json({ squad });
  }

  if (body.action === 'leave') {
    const ok = leaveSquad(body.userId);
    return NextResponse.json({ ok });
  }

  return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
}
