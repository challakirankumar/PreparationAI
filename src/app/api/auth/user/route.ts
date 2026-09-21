import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { User } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ----------------------------------------------------------------------------
// POST /api/auth/user
// Body: { user: User }
// Upserts the user — used whenever the user updates their profile, exam goals,
// exam dates, etc. Fields that don't exist in the DB schema are silently
// dropped (academic records are saved via a separate endpoint).
// ----------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user: User = body.user;
    if (!user || !user.id || !user.email) {
      return NextResponse.json({ error: 'user.id and user.email are required' }, { status: 400 });
    }

    await db.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email.toLowerCase().trim(),
        passwordHash: '', // created via /api/auth/register; upsert shouldn't change it
        name: user.name,
        phone: user.phone ?? null,
        country: user.country ?? null,
        institution: user.institution ?? null,
        userType: user.type ?? 'school-12',
        examGoal: user.examGoal ?? '',
        examGoals: JSON.stringify(user.examGoals ?? []),
        examDates: JSON.stringify(user.examDates ?? {}),
        examDate: user.examDate ?? null,
        targetScore: user.targetScore ?? null,
        avatar: user.avatar ?? null,
        darkMode: user.darkMode ?? false,
        emailVerified: user.emailVerified ?? false,
        clockTimezone: user.clockTimezone ?? 'Asia/Kolkata',
        clockFace: user.clockFace ?? 'digital',
        clockTheme: user.clockTheme ?? 'day',
      },
      update: {
        name: user.name,
        phone: user.phone ?? null,
        country: user.country ?? null,
        institution: user.institution ?? null,
        userType: user.type ?? 'school-12',
        examGoal: user.examGoal ?? '',
        examGoals: JSON.stringify(user.examGoals ?? []),
        examDates: JSON.stringify(user.examDates ?? {}),
        examDate: user.examDate ?? null,
        targetScore: user.targetScore ?? null,
        avatar: user.avatar ?? null,
        darkMode: user.darkMode ?? false,
        emailVerified: user.emailVerified ?? false,
        clockTimezone: user.clockTimezone ?? 'Asia/Kolkata',
        clockFace: user.clockFace ?? 'digital',
        clockTheme: user.clockTheme ?? 'day',
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[auth/user]', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
