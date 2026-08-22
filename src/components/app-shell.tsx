'use client';

import * as React from 'react';
import {
  Brain,
  LayoutDashboard,
  FileText,
  BookOpen,
  BarChart3,
  CalendarDays,
  MessageSquare,
  UserCog,
  Sparkles,
  Gauge,
  Trophy,
  School,
  Radar,
  Briefcase,
  GraduationCap,
  Award,
  HeartPulse,
  Bell,
  LogOut,
  Menu,
  Target,
  Calendar,
  Clock,
  Settings2,
  Shield,
  Building2,
  Camera,
  TrendingUp,
  PenTool,
  Swords,
  BookX,
  Heart,
  MessageCircle,
  Mic,
  Library,
  Compass,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { getPattern } from '@/lib/exams/patterns';
import { NotificationBell } from '@/components/notifications/notification-bell';
import type { View } from '@/lib/types';

interface NavItem {
  id: View;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Core',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'mock-exam', label: 'Mock Exam', icon: FileText },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'planner', label: 'Planner', icon: CalendarDays },
    ],
  },
  {
    title: 'AI Agents',
    items: [
      { id: 'ai-agents', label: 'AI Agents Hub', icon: Sparkles },
    ],
  },
  {
    title: 'Explore',
    items: [
      { id: 'explore', label: 'Explore Hub', icon: Compass },
    ],
  },
  {
    title: 'Account',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings2 },
    ],
  },
];

export function daysToExam(examDate?: string): number {
  if (!examDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(examDate);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  return Math.max(0, diff);
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Sub-module groupings — used to keep the parent hub button highlighted
// when one of its child views is currently active.
const AI_AGENT_CHILDREN: View[] = [
  'mentor', 'socratic-mentor', 'voice-mentor', 'doubt-solver', 'rag-tutor',
  'pyq-trends', 'digital-twin', 'success-simulator', 'readiness',
  'rank-predictor', 'university-predictor', 'weakness-radar',
];
const EXPLORE_CHILDREN: View[] = [
  'career', 'university', 'scholarship',
];

function isParentActive(parentId: View, currentView: View): boolean {
  if (currentView === parentId) return true;
  if (parentId === 'ai-agents') return AI_AGENT_CHILDREN.includes(currentView);
  if (parentId === 'explore') return EXPLORE_CHILDREN.includes(currentView);
  return false;
}

function NavList({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const attempts = useStore((s) => s.attempts);

  if (collapsed) {
    // ----------------------------------------------------------------
    // COLLAPSED MODE — icon-only rail with tooltips on hover.
    // Group titles are hidden, labels are hidden, badges are hidden.
    // The "PreparationAI" brand text is rendered above this rail in
    // the SidebarHeader and stays visible.
    // ----------------------------------------------------------------
    return (
      <TooltipProvider delayDuration={150}>
        <nav className="flex-1 overflow-y-auto scroll-thin px-2 py-4 space-y-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isParentActive(item.id, view);
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          setView(item.id);
                          onNavigate?.();
                        }}
                        aria-label={item.label}
                        className={cn(
                          'relative w-full flex items-center justify-center rounded-xl p-2.5 transition-all duration-300 group overflow-hidden ring-1',
                          active
                            ? 'bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white ring-blue-900/50 shadow-[0_6px_18px_-4px_rgba(15,76,129,0.5)]'
                            : 'text-slate-600 ring-slate-200/70 bg-white/60 backdrop-blur-sm hover:bg-white hover:text-blue-900 hover:ring-blue-200',
                        )}
                      >
                        <span className={cn(
                          'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent',
                          !active && 'opacity-40'
                        )} />
                        {active && (
                          <span className="pointer-events-none absolute -bottom-6 -right-3 h-16 w-16 rounded-full bg-blue-400/20 blur-2xl" />
                        )}
                        <Icon className={cn(
                          'h-5 w-5 flex-shrink-0 transition-all duration-300',
                          active
                            ? 'text-white drop-shadow-sm'
                            : 'text-slate-500 group-hover:text-blue-700 group-hover:scale-110'
                        )} />
                        {/* Active indicator dot in the top-right corner */}
                        {active && (
                          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-white/80" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </nav>
      </TooltipProvider>
    );
  }

  // ----------------------------------------------------------------
  // EXPANDED MODE — full glassy nav with labels, group titles, etc.
  // ----------------------------------------------------------------
  return (
    <nav className="flex-1 overflow-y-auto scroll-thin px-3 py-4 space-y-6">
      {NAV_GROUPS.map((group) => {
        return (
        <div key={group.title}>
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2.5">
            {group.title}
          </p>
          <div className="space-y-1.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isParentActive(item.id, view);
              const isMockExam = item.id === 'mock-exam';
              const attemptCount = attempts.length;
              const isHub = item.id === 'ai-agents' || item.id === 'explore';
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id);
                    onNavigate?.();
                  }}
                  className={cn(
                    // Premium glassy button — base layer for both states
                    'relative w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-300 group overflow-hidden',
                    // Refined ring + 1px hairline border on every button (glass surface)
                    'ring-1',
                    active
                      ? // Active: deep sapphire gradient + bright top sheen + soft glow
                        'bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white ring-blue-900/50 shadow-[0_6px_18px_-4px_rgba(15,76,129,0.5)]'
                      : // Idle: translucent white glass that intensifies on hover
                        'text-slate-600 ring-slate-200/70 bg-white/60 backdrop-blur-sm hover:bg-white hover:text-blue-900 hover:ring-blue-200 hover:shadow-[0_4px_12px_-2px_rgba(15,76,129,0.12)]',
                  )}
                >
                  {/* Glossy top sheen — visible on every button, brighter on active */}
                  <span className={cn(
                    'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent',
                    !active && 'opacity-40'
                  )} />
                  {/* Inner glassy bloom on the lower-right for active state */}
                  {active && (
                    <span className="pointer-events-none absolute -bottom-8 -right-4 h-20 w-20 rounded-full bg-blue-400/20 blur-2xl" />
                  )}
                  <Icon className={cn(
                    'h-[18px] w-[18px] flex-shrink-0 transition-all duration-300',
                    active
                      ? 'text-white drop-shadow-sm'
                      : 'text-slate-500 group-hover:text-blue-700 group-hover:scale-110'
                  )} />
                  <span className={cn(
                    'flex-1 text-left truncate',
                    active
                      ? 'font-semibold tracking-tight text-white'
                      : 'font-medium tracking-tight text-slate-700 group-hover:text-blue-900 group-hover:font-semibold'
                  )}>
                    {item.label}
                  </span>
                  {isHub && (
                    <ChevronRight className={cn(
                      'h-3.5 w-3.5 transition-all',
                      active
                        ? 'text-white/80'
                        : 'text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5'
                    )} />
                  )}
                  {isMockExam && attemptCount > 0 && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'h-5 px-1.5 text-[10px] border-none font-semibold',
                        active ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                      )}
                    >
                      {attemptCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        );
      })}
    </nav>
  );
}

function TargetExamCard() {
  const user = useStore((s) => s.user);
  if (!user) return null;
  const pattern = getPattern(user.examGoal);
  const days = daysToExam(user.examDate);
  const isNear = days <= 30;
  return (
    <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-emerald-50 to-amber-50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <Target className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Primary exam</p>
          <p className="text-sm font-semibold text-stone-900 truncate">{pattern?.name ?? user.examGoal}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className={cn('text-2xl font-bold tabular-nums', isNear ? 'text-rose-600' : 'text-blue-700')}>
            {days}
          </p>
          <p className="text-[10px] text-muted-foreground">days to go</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
            <Calendar className="h-3 w-3" />
            {new Date(user.examDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
          </p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
            <Clock className="h-3 w-3" />
            {pattern ? `${Math.round(pattern.durationSec / 60)} min` : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

function SidebarHeader({
  collapsed = false,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className={cn(
      'flex items-center h-16 border-b border-stone-200 flex-shrink-0 bg-gradient-to-r from-white via-blue-50/40 to-white relative overflow-hidden',
      collapsed ? 'px-2 justify-center' : 'px-5',
    )}>
      {/* Decorative glossy sheen */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-12 -left-8 h-32 w-32 rounded-full bg-blue-100/40 blur-3xl" />
      </div>
      <div className="relative flex items-center gap-2.5 w-full">
        {/* Brand text — ALWAYS visible, even when collapsed.
            In collapsed mode it shrinks to a stacked "Prep / AI" mark so it
            still fits in the narrow rail without disappearing. */}
        {collapsed ? (
          <p className="font-bold text-base leading-none tracking-tight text-center w-full select-none">
            Prep
            <br />
            <span className="text-blue-700">AI</span>
          </p>
        ) : (
          <p className="font-bold text-2xl leading-tight tracking-tight flex-1">
            Preparation<span className="text-blue-700">AI</span>
          </p>
        )}

        {/* Transparent collapse toggle arrow — only visible in expanded mode.
            Sits on the right edge; low opacity by default, full opacity on hover. */}
        {!collapsed && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="group/toggle relative h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-all flex-shrink-0"
          >
            <PanelLeftClose className="h-4 w-4 opacity-50 group-hover/toggle:opacity-100 transition-opacity" />
          </button>
        )}
      </div>
    </div>
  );
}

function SidebarFooter({ collapsed = false }: { collapsed?: boolean }) {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const setView = useStore((s) => s.setView);
  if (!user) return null;

  if (collapsed) {
    // Collapsed footer — just the avatar (with tooltip) + a tiny log-out button.
    return (
      <div className="border-t border-stone-200 p-2 flex-shrink-0 flex flex-col items-center gap-1.5">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setView('settings')}
                className="rounded-full ring-2 ring-white/80 hover:ring-blue-300 transition"
                aria-label="Open settings"
              >
                <Avatar className="h-8 w-8">
                  {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                  <AvatarFallback className="bg-gradient-to-br from-blue-700 to-blue-900 text-white text-[10px] font-semibold">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {user.name} · {user.email}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-rose-600"
          onClick={logout}
          title="Log out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t border-stone-200 p-3 flex-shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="h-8 w-8">
          {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
          <AvatarFallback className="bg-gradient-to-br from-blue-700 to-blue-900 text-white text-xs font-semibold">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate text-stone-900">{user.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-stone-500 hover:text-rose-600"
          onClick={logout}
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const user = useStore((s) => s.user);
  const setView = useStore((s) => s.setView);
  if (!user) return null;

  return (
    <header className="relative z-30 flex h-16 items-center gap-3 glass-topbar px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden hover:bg-blue-50"
        onClick={onOpenSidebar}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Brand text on mobile (larger, matches sidebar size) */}
      <div className="lg:hidden flex items-center gap-2">
        <p className="font-bold text-xl leading-tight tracking-tight">
          Preparation<span className="text-blue-700">AI</span>
        </p>
      </div>

      <div className="flex-1" />

      <NotificationBell />

      <Avatar
        className="h-9 w-9 cursor-pointer ring-2 ring-white/80 hover:ring-blue-300 transition"
        onClick={() => setView('settings')}
      >
        {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
        <AvatarFallback className="bg-gradient-to-br from-blue-700 to-blue-900 text-white text-xs font-semibold">
          {initials(user.name)}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState<boolean>(false);
  const user = useStore((s) => s.user);

  // Persist sidebar collapse state across reloads.
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('prep-ai-sidebar-collapsed');
      if (stored === '1') setCollapsed(true);
    } catch { /* ignore */ }
  }, []);
  React.useEffect(() => {
    try {
      localStorage.setItem('prep-ai-sidebar-collapsed', collapsed ? '1' : '0');
    } catch { /* ignore */ }
  }, [collapsed]);

  // Dark mode toggle
  React.useEffect(() => {
    const root = document.documentElement;
    if (user?.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [user?.darkMode]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-premium">
      {/* Desktop sidebar — collapses from w-72 (expanded) to w-[76px] (collapsed) */}
      <aside
        className={cn(
          'hidden lg:flex fixed inset-y-0 left-0 flex-col bg-gradient-to-b from-white via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border-r border-stone-200 dark:border-slate-700 z-40 shadow-sm transition-[width] duration-300',
          collapsed ? 'w-[76px]' : 'w-72',
        )}
      >
        <SidebarHeader
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(true)}
        />
        <NavList collapsed={collapsed} />

        {/* When collapsed, show an expand button at the bottom of the nav rail
            (above the footer) — a transparent arrow pointing right to expand. */}
        {collapsed && (
          <div className="px-2 pb-2 flex-shrink-0">
            <button
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="group/toggle relative w-full flex items-center justify-center rounded-xl p-2.5 ring-1 ring-slate-200/70 bg-white/60 backdrop-blur-sm hover:bg-white hover:ring-blue-200 text-slate-400 hover:text-blue-700 transition-all"
            >
              <PanelLeftOpen className="h-4 w-4 opacity-50 group-hover/toggle:opacity-100 transition-opacity" />
            </button>
          </div>
        )}

        <SidebarFooter collapsed={collapsed} />
      </aside>

      {/* Mobile sidebar — always full-width, never collapsed */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarHeader />
          <NavList onNavigate={() => setMobileOpen(false)} />
          <SidebarFooter />
        </SheetContent>
      </Sheet>

      {/* Main — left padding matches sidebar width */}
      <div className={cn('transition-[padding] duration-300', collapsed ? 'lg:pl-[76px]' : 'lg:pl-72')}>
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
