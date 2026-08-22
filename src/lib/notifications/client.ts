// ============================================================================
// Client-side notification helpers
// ----------------------------------------------------------------------------
// Tiny typed wrapper around the /api/notifications endpoints. Used by the
// notification bell dropdown and by other modules (signup, exam submit) to
// create notifications without duplicating fetch boilerplate.
// ============================================================================

export interface AppNotification {
  id: string;
  userId: string;
  type: 'welcome' | 'mock_submitted' | 'achievement' | 'system' | 'nudge';
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string; // ISO
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export async function fetchNotifications(userId: string): Promise<NotificationsResponse> {
  const r = await fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`, {
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`fetchNotifications failed: ${r.status}`);
  return r.json();
}

export async function createNotification(params: {
  userId: string;
  type: AppNotification['type'];
  title: string;
  body?: string;
  link?: string | null;
}): Promise<AppNotification | null> {
  try {
    const r = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: params.userId,
        action: 'create',
        type: params.type,
        title: params.title,
        body: params.body ?? '',
        link: params.link ?? null,
      }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data.notification ?? null;
  } catch {
    return null;
  }
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, action: 'mark_read', notificationId }),
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, action: 'mark_all_read' }),
  });
}
