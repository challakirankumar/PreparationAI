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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useStore, userExamGoals } from '@/lib/store';
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
  'career', 'university', 'scholarship', 'settings',
];

function isParentActive(parentId: View, currentView: View): boolean {
  if (currentView === parentId) return true;
  if (parentId === 'ai-agents') return AI_AGENT_CHILDREN.includes(currentView);
  if (parentId === 'explore') return EXPLORE_CHILDREN.includes(currentView);
  return false;
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const attempts = useStore((s) => s.attempts);

  return (
    <nav className="flex-1 overflow-y-auto scroll-thin px-3 py-3 space-y-5">
      {NAV_GROUPS.map((group) => {
        return (
        <div key={group.title}>
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">
            {group.title}
          </p>
          <div className="space-y-1">
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
                    'relative w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 group overflow-hidden',
                    active
                      ? // Glossy active state — blue gradient + soft glow
                        'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_4px_12px_-2px_rgba(0,123,255,0.4)]'
                      : // Glossy idle state — translucent glass surface
                        'text-stone-600 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent hover:shadow-sm',
                    isHub && !active && 'ring-1 ring-stone-200/60'
                  )}
                >
                  {/* Glossy top highlight for active state */}
                  {active && (
                    <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  )}
                  <Icon className={cn(
                    'h-4 w-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110',
                    active ? 'text-white' : 'text-stone-500 group-hover:text-blue-600'
                  )} />
                  <span className={cn(
                    'flex-1 text-left truncate tracking-tight',
                    active && 'font-semibold'
                  )}>
                    {item.label}
                  </span>
                  {isHub && (
                    <ChevronRight className={cn(
                      'h-3 w-3 transition-all',
                      active ? 'text-white/80' : 'text-stone-400 group-hover:text-blue-600 group-hover:translate-x-0.5'
                    )} />
                  )}
                  {isMockExam && attemptCount > 0 && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'h-5 px-1.5 text-[10px] border-none font-semibold',
                        active ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
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

function SidebarHeader() {
  return (
    <div className="flex items-center gap-3 px-5 h-16 border-b border-stone-200 flex-shrink-0 bg-gradient-to-r from-white via-blue-50/40 to-white relative overflow-hidden">
      {/* Decorative glossy sheen */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-12 -left-8 h-32 w-32 rounded-full bg-blue-100/40 blur-3xl" />
      </div>
      <div className="relative flex items-center gap-2.5">
        <p className="font-bold text-xl leading-tight tracking-tight">
          Preparation<span className="text-blue-600">AI</span>
        </p>
      </div>
    </div>
  );
}

function SidebarFooter() {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  if (!user) return null;
  return (
    <div className="border-t border-stone-200 p-3 flex-shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-xs font-semibold">
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

  const goals = userExamGoals(user);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 glass-topbar px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden hover:bg-blue-50"
        onClick={onOpenSidebar}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Brand text on mobile */}
      <div className="lg:hidden flex items-center gap-2">
        <p className="font-bold text-base leading-tight tracking-tight">
          Preparation<span className="text-blue-600">AI</span>
        </p>
      </div>

      <div className="flex-1" />

      <NotificationBell />

      <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-white/80 hover:ring-blue-200 transition" onClick={() => setView('dashboard')}>
        <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-semibold">
          {initials(user.name)}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const user = useStore((s) => s.user);

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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-72 flex-col bg-gradient-to-b from-white via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border-r border-stone-200 dark:border-slate-700 z-40 shadow-sm">
        <SidebarHeader />
        <NavList />
        <SidebarFooter />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarHeader />
          <NavList onNavigate={() => setMobileOpen(false)} />
          <SidebarFooter />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="lg:pl-72">
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
