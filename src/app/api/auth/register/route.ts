import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { User } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ----------------------------------------------------------------------------
// POST /api/auth/register
// Body: { user: User, password: string }
// Creates the user row in the database. Idempotent on email — returns the
// existing user if the email is already registered (so the local UI's
// optimistic update wins even if the network is slow).
// ----------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user: User = body.user;
    const password: string = body.password;

    if (!user || !user.email || !password) {
      return NextResponse.json({ error: 'user and password are required' }, { status: 400 });
    }

    const email = user.email.toLowerCase().trim();

    // Check if the user already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      // Idempotent: return success without overwriting their data
      return NextResponse.json({ success: true, userId: existing.id });
    }

    // Create the user row
    const created = await db.user.create({
      data: {
        id: user.id,
        email,
        passwordHash: password, // NOTE: in production, hash this with bcrypt/argon2
        name: user.name,
        phone: user.phone ?? null,
        country: user.country ?? null,
        userType: user.type ?? 'school-12',
        examGoal: user.examGoal ?? '',
        examGoals: JSON.stringify(user.examGoals ?? []),
        examDates: JSON.stringify(user.examDates ?? {}),
        examDate: user.examDate ?? null,
        targetScore: user.targetScore ?? null,
        avatar: user.avatar ?? null,
        darkMode: user.darkMode ?? false,
        emailVerified: user.emailVerified ?? false,
      },
    });

    return NextResponse.json({ success: true, userId: created.id });
  } catch (e) {
    console.error('[auth/register]', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
