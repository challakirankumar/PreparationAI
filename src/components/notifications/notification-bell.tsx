'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverTrigger, PopoverContent,
} from '@/components/ui/popover';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import {
  fetchNotifications, markNotificationRead, markAllNotificationsRead,
  type AppNotification,
} from '@/lib/notifications/client';
import type { View } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Bell, CheckCheck, BellOff, Sparkles, Trophy, AlertCircle, Info,
  Megaphone, Loader2,
} from 'lucide-react';

// ============================================================================
// NotificationBell — top-bar dropdown showing real DB-backed notifications
// ============================================================================
export function NotificationBell() {
  const user = useStore((s) => s.user);
  const setView = useStore((s) => s.setView);
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<AppNotification[]>([]);
  const [unread, setUnread] = React.useState(0);

  // Pull notifications from the backend whenever the popover opens, and
  // also do a refresh every 60s while it is open so the user sees new items.
  const refresh = React.useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await fetchNotifications(user.id);
      setItems(data.notifications);
      setUnread(data.unreadCount);
    } catch {
      // Non-blocking — keep silent if the API call fails
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (open) {
      refresh();
      const id = setInterval(refresh, 60_000);
      return () => clearInterval(id);
    }
  }, [open, refresh]);

  // Also do a one-shot refresh on mount and whenever the user changes —
  // keeps the unread badge accurate without requiring the user to open it.
  React.useEffect(() => {
    refresh();
  }, [user?.id, refresh]);

  async function handleClickItem(n: AppNotification) {
    if (!user) return;
    if (!n.read) {
      await markNotificationRead(user.id, n.id);
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      );
      setUnread((u) => Math.max(0, u - 1));
    }
    if (n.link) {
      setView(n.link as View);
      setOpen(false);
    }
  }

  async function handleMarkAll() {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
    toast({ title: 'All caught up', description: 'Marked every notification as read.' });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-blue-50 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 max-h-[480px] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-gradient-to-r from-white to-blue-50/30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center">
              <Bell className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Notifications</p>
              <p className="text-[10px] text-muted-foreground">
                {unread > 0 ? `${unread} unread` : 'You\'re all caught up'}
              </p>
            </div>
          </div>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-blue-700 hover:bg-blue-100"
              onClick={handleMarkAll}
            >
              <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scroll-thin">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="divide-y divide-stone-100">
              {items.map((n) => (
                <NotificationItem key={n.id} n={n} onClick={() => handleClickItem(n)} />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-100 p-2 flex-shrink-0 bg-stone-50/40">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-[11px] text-muted-foreground"
            onClick={() => { setView('dashboard'); setOpen(false); }}
          >
            Go to dashboard
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Single notification row
// ============================================================================
function NotificationItem({ n, onClick }: { n: AppNotification; onClick: () => void }) {
  const icon = getIconForType(n.type);
  const Icon = icon.icon;
  const ago = formatRelative(n.createdAt);

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left p-3 hover:bg-blue-50/40 transition-colors flex items-start gap-3',
          !n.read && 'bg-blue-50/30',
        )}
      >
        <div
          className={cn(
            'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
            icon.bg,
          )}
        >
          <Icon className={cn('h-4 w-4', icon.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn('text-xs leading-tight', !n.read ? 'font-semibold text-stone-900' : 'font-medium text-stone-700')}>
              {n.title}
            </p>
            {!n.read && (
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
            )}
          </div>
          {n.body && (
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
              {n.body}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">{ago}</p>
        </div>
      </button>
    </li>
  );
}

// ============================================================================
// Empty state
// ============================================================================
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center mb-3">
        <BellOff className="h-5 w-5 text-stone-400" />
      </div>
      <p className="text-sm font-medium text-stone-700">No notifications yet</p>
      <p className="text-[11px] text-muted-foreground mt-1 max-w-[220px]">
        Welcome notifications, mock-exam results, and streak reminders will appear here.
      </p>
    </div>
  );
}

// ============================================================================
// Helpers — per-type icon/color
// ============================================================================
function getIconForType(type: AppNotification['type']): {
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  color: string;
} {
  switch (type) {
    case 'welcome':
      return { icon: Sparkles, bg: 'bg-blue-100', color: 'text-blue-600' };
    case 'mock_submitted':
      return { icon: Trophy, bg: 'bg-amber-100', color: 'text-amber-600' };
    case 'achievement':
      return { icon: Trophy, bg: 'bg-emerald-100', color: 'text-emerald-600' };
    case 'nudge':
      return { icon: Megaphone, bg: 'bg-orange-100', color: 'text-orange-600' };
    case 'system':
      return { icon: AlertCircle, bg: 'bg-rose-100', color: 'text-rose-600' };
    default:
      return { icon: Info, bg: 'bg-stone-100', color: 'text-stone-600' };
  }
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
