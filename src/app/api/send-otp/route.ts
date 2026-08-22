import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// POST /api/send-otp
// Body: { phone, name?, country? }
// ----------------------------------------------------------------------------
// Generates a 6-digit OTP and "sends" it via SMS. In production you would
// inject your SMS provider's API key (MSG91, Twilio, Fast2SMS, etc.) and call
// their SDK here. In dev mode the code is returned in the response so the UI
// can display it on screen for testing.
//
// To enable real SMS, set these env vars:
//   SMS_PROVIDER=msg91|twilio|fast2sms
//   SMS_API_KEY=your_provider_api_key
//   SMS_SENDER_ID=PREPAI   (for MSG91 / DLT-approved sender ID)
//   TWILIO_ACCOUNT_SID=... (for Twilio)
//   TWILIO_AUTH_TOKEN=...
//   TWILIO_PHONE_NUMBER=+1...
//
// The OTP is also cached in an in-memory Map keyed by phone number so the
// verify-otp route can check it within the 5-minute validity window.
// ============================================================================

// Module-level in-memory OTP cache. Survives across requests in the same
// Node.js process (fine for dev / single-instance deploys; for multi-instance
// production, swap this for Redis or your DB).
const otpCache = new Map<string, { code: string; expiresAt: number; attempts: number }>();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds between resend requests

function generateOtp(): string {
  // 6-digit numeric code
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizePhone(raw: string): string {
  // Strip everything except digits and a leading +
  const cleaned = raw.replace(/[^\d+]/g, '');
  return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
}

async function sendViaMsg91(phone: string, message: string): Promise<boolean> {
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || 'PREPAI';
  if (!apiKey) return false;
  try {
    const url = `https://api.msg91.com/api/v5/otp?authkey=${encodeURIComponent(apiKey)}&mobiles=${encodeURIComponent(phone)}&message=${encodeURIComponent(message)}&sender=${encodeURIComponent(senderId)}&otp=${encodeURIComponent(message.match(/\d{6}/)?.[0] ?? '')}&country=0`;
    const resp = await fetch(url, { method: 'GET' });
    return resp.ok;
  } catch {
    return false;
  }
}

async function sendViaTwilio(phone: string, message: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return false;
  try {
    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: phone, From: from, Body: message }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phoneRaw: string = String(body?.phone || '').trim();
    const name: string = String(body?.name || 'there').trim();
    const country: string = String(body?.country || '').trim();

    if (phoneRaw.replace(/\D/g, '').length < 8) {
      return NextResponse.json({ error: 'A valid phone number is required' }, { status: 400 });
    }
    const phone = normalizePhone(phoneRaw);

    // Cooldown check — prevent spamming
    const existing = otpCache.get(phone);
    if (existing && Date.now() < existing.expiresAt - (OTP_TTL_MS - OTP_RESEND_COOLDOWN_MS)) {
      return NextResponse.json({
        success: false,
        error: 'Please wait 30 seconds before requesting another code.',
      }, { status: 429 });
    }

    const code = generateOtp();
    const message = `Hi ${name}, your PreparationAI verification code is ${code}. It expires in 5 minutes. Do not share this with anyone.`;

    // Try to send via the configured SMS provider. If no provider is configured
    // (or the call fails), we fall back to "dev mode" where the code is
    // returned in the response so the UI can show it.
    let smsSent = false;
    const provider = (process.env.SMS_PROVIDER || '').toLowerCase();
    if (provider === 'msg91') smsSent = await sendViaMsg91(phone, message);
    else if (provider === 'twilio') smsSent = await sendViaTwilio(phone, message);

    // Cache the code regardless so verify-otp works in dev mode too.
    otpCache.set(phone, {
      code,
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
    });

    return NextResponse.json({
      success: true,
      sent: smsSent,
      // Only expose the code in dev mode (when SMS didn't actually send).
      devOtp: smsSent ? undefined : code,
      phone,
      country,
      message: smsSent
        ? `OTP sent via SMS to ${phone}`
        : 'Dev mode: SMS provider not configured, code returned in response.',
    });
  } catch (e) {
    console.error('[send-otp]', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// Export the cache so the verify-otp route can read it.
export { otpCache };
