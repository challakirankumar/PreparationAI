'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Clock, Calendar, Sparkles } from 'lucide-react';

// ============================================================================
// PremiumHeader — sapphire-to-midnight gradient pill with optional glass time widget
// ----------------------------------------------------------------------------
// Used at the top of every module page. Replaces the old hero card on the
// dashboard. Mirrors the look from the reference screenshot:
//   • Pill-shaped gradient background (sapphire → midnight blue)
//   • Large white title + smaller subtitle on the left
//   • Optional glassmorphic time/date widget on the right
//
// The live clock is OFF by default — only the main Dashboard explicitly
// passes `showTime` to enable it. All other module headers stay clean.
// ============================================================================

interface PremiumHeaderProps {
  /** Main title — usually "Welcome back, {name}" or the module name */
  title: string;
  /** Optional smaller subtitle below the title */
  subtitle?: string;
  /** Optional icon shown to the left of the title */
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional React node rendered on the far right (e.g., action buttons).
   *  When provided, it appears where the time widget would be. */
  actions?: React.ReactNode;
  /** Show the live clock widget on the right. Default: false (clean header).
   *  Only the Dashboard turns this on. */
  showTime?: boolean;
  /** Override the gradient palette. Default: sapphire (deep blue). */
  variant?: 'sapphire' | 'midnight' | 'emerald' | 'amber' | 'rose';
  className?: string;
}

// Sapphire & midnight blue palette — no purple, no indigo.
const GRADIENTS: Record<NonNullable<PremiumHeaderProps['variant']>, string> = {
  sapphire: 'from-blue-700 via-blue-800 to-slate-900',
  midnight: 'from-slate-800 via-blue-900 to-slate-950',
  emerald:  'from-teal-700 via-blue-800 to-slate-900',
  amber:    'from-amber-600 via-orange-700 to-slate-900',
  rose:     'from-rose-600 via-pink-700 to-slate-900',
};

export function PremiumHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  showTime = false,
  variant = 'sapphire',
  className,
}: PremiumHeaderProps) {
  const [now, setNow] = React.useState<Date | null>(null);

  // Tick every 1 second — but only when the clock is actually shown.
  React.useEffect(() => {
    if (!showTime) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [showTime]);

  const timeStr = now
    ? now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true,
      })
    : '--:--:--';
  const dateStr = now
    ? now.toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
      })
    : 'Loading...';

  return (
    <div
      className={cn(
        // Pill-shaped gradient bar with soft shadow + subtle inner highlight
        'relative overflow-hidden rounded-2xl shadow-lg',
        'bg-gradient-to-r', GRADIENTS[variant],
        'before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/10 before:to-transparent',
        'after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-white/30',
        className,
      )}
    >
      {/* Decorative glossy bloom — soft sapphire glow, never purple */}
      <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-24 w-48 rounded-full bg-blue-400/10 blur-3xl" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 lg:p-7">
        {/* Left side — title */}
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="hidden sm:flex h-12 w-12 rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20 items-center justify-center flex-shrink-0">
              <Icon className="h-6 w-6 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-xl truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side — time widget + actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {actions}
          {showTime && (
            <div className="rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 p-1.5">
              <div className="flex items-center gap-2.5 rounded-lg bg-white px-3 py-2 shadow-sm">
                <div className="h-9 w-9 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-blue-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-stone-900 tabular-nums leading-tight">
                    {timeStr}
                  </p>
                  <p className="text-[10px] text-stone-500 truncate flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    {dateStr}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
