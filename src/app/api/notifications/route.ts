import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Notification } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ----------------------------------------------------------------------------
// GET /api/notifications?userId=...
// Returns the user's notifications, newest first. Includes unreadCount.
// ----------------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await db.notification.count({
      where: { userId, read: false },
    });

    return NextResponse.json({
      notifications: notifications.map(serializeNotification),
      unreadCount,
    });
  } catch (e) {
    console.error('[notifications GET]', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// ----------------------------------------------------------------------------
// POST /api/notifications
// Body: { userId, action: 'create' | 'mark_read' | 'mark_all_read', notificationId? }
// ----------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // ---- Create ----
    if (action === 'create') {
      const { type, title, body: notifBody, link } = body;
      if (!type || !title) {
        return NextResponse.json({ error: 'type and title are required' }, { status: 400 });
      }
      const n = await db.notification.create({
        data: {
          userId,
          type,
          title,
          body: notifBody ?? '',
          link: link ?? null,
        },
      });
      return NextResponse.json({ notification: serializeNotification(n) });
    }

    // ---- Mark one as read ----
    if (action === 'mark_read') {
      const { notificationId } = body;
      if (!notificationId) {
        return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
      }
      const n = await db.notification.update({
        where: { id: notificationId, userId }, // scoped to user — prevents IDOR
        data: { read: true },
      });
      return NextResponse.json({ notification: serializeNotification(n) });
    }

    // ---- Mark all as read ----
    if (action === 'mark_all_read') {
      await db.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error('[notifications POST]', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// ----------------------------------------------------------------------------
// Serializer — converts DB rows to API-safe objects with ISO timestamps
// ----------------------------------------------------------------------------
function serializeNotification(n: Notification) {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}
