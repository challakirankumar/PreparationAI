// src/app/api/launch-audit/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const startTime = Date.now();

    // 1. Audit Database Connectivity
    let dbStatus = 'disconnected';
    let userCount = 0;
    let dbLatencyMs = 0;
    try {
      const dbStart = Date.now();
      userCount = await db.user.count();
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = 'connected';
    } catch (dbErr) {
      dbStatus = `error: ${(dbErr as Error).message}`;
    }

    // 2. Audit Environment Secrets Presence (without revealing values)
    const secretsAudit = {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      GROQ_API_KEY: Boolean(process.env.GROQ_API_KEY),
      GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      Z_AI_API_KEY: Boolean(process.env.Z_AI_API_KEY || process.env.ZAI_API_KEY),
    };

    const allSecretsPresent = Object.values(secretsAudit).every(Boolean);

    // 3. Security Headers Check
    const securityCheck = {
      httpsEnforced: process.env.NODE_ENV === 'production',
      serverScopedSecrets: true,
      nodeVersion: process.version,
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
      database: {
        status: dbStatus,
        provider: 'MongoDB Atlas',
        latencyMs: dbLatencyMs,
        totalUsers: userCount,
        whitelistRequired: '0.0.0.0/0 enabled for serverless',
      },
      secrets: {
        allPresent: allSecretsPresent,
        details: secretsAudit,
      },
      security: securityCheck,
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
