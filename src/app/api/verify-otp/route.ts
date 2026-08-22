import { NextResponse } from 'next/server';
import { otpCache } from '../send-otp/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// POST /api/verify-otp
// Body: { phone, code }
// ----------------------------------------------------------------------------
// Checks the code against the in-memory cache populated by /api/send-otp.
// Returns { verified: true } on success, { verified: false } on mismatch or
// expiry. Also enforces a max of 5 attempts per code to prevent brute force.
// ============================================================================

const MAX_ATTEMPTS = 5;

function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, '');
  return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phoneRaw: string = String(body?.phone || '').trim();
    const code: string = String(body?.code || '').trim();

    if (!phoneRaw || code.length < 4) {
      return NextResponse.json({ verified: false, error: 'Phone and code are required' }, { status: 400 });
    }
    const phone = normalizePhone(phoneRaw);

    const entry = otpCache.get(phone);
    if (!entry) {
      return NextResponse.json({
        verified: false,
        error: 'No code was sent to this number, or it has expired. Please request a new one.',
      }, { status: 400 });
    }

    if (Date.now() > entry.expiresAt) {
      otpCache.delete(phone);
      return NextResponse.json({
        verified: false,
        error: 'This code has expired. Please request a new one.',
      }, { status: 400 });
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
      otpCache.delete(phone);
      return NextResponse.json({
        verified: false,
        error: 'Too many incorrect attempts. Please request a new code.',
      }, { status: 429 });
    }

    entry.attempts += 1;

    if (entry.code !== code) {
      return NextResponse.json({
        verified: false,
        error: 'Incorrect code. Please try again.',
        attemptsLeft: Math.max(0, MAX_ATTEMPTS - entry.attempts),
      }, { status: 400 });
    }

    // Success — remove the code so it can't be reused.
    otpCache.delete(phone);
    return NextResponse.json({
      verified: true,
      phone,
      verifiedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[verify-otp]', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
