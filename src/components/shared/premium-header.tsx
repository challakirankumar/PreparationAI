'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Clock, Calendar, Settings2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { ClockSettingsDialog } from '@/components/clock/clock-settings-dialog';
import type { ClockFace, ClockTheme } from '@/lib/types';

// ============================================================================
// PremiumHeader — sapphire-to-midnight gradient pill with optional glass clock widget
// ----------------------------------------------------------------------------
// Used at the top of every module page. Replaces the old hero card on the
// dashboard. Mirrors the look from the reference screenshot:
//   • Pill-shaped gradient background (sapphire → midnight blue)
//   • Large white title + smaller subtitle on the left
//   • Optional glassmorphic clock widget on the right (digital or analog)
//
// The clock is OFF by default — only the main Dashboard explicitly
// passes `showClock` to enable it. All other module headers stay clean.
//
// Clicking the clock opens the ClockSettingsDialog where the user can pick
// a country/timezone, a clock face, and a theme. Those choices are persisted
// to the user profile (DB-backed) so they survive logout / re-login.
// ============================================================================

interface PremiumHeaderProps {
  /** Main title — usually "Welcome back, {name}" or the module name */
  title: string;
  /** Optional smaller subtitle below the title */
  subtitle?: string;
  /** Optional icon shown to the left of the title */
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional React node rendered on the far right (e.g., action buttons). */
  actions?: React.ReactNode;
  /** Show the live clock widget on the right. Default: false (clean header).
   *  Only the Dashboard turns this on. Clicking it opens clock settings. */
  showClock?: boolean;
  /** Override the gradient palette. Default: sapphire (deep blue).
   *  NOTE: All variants now end in slate-900 (midnight) for consistency
   *  with the dashboard's look — no more per-page color differences. */
  variant?: 'sapphire' | 'midnight';
  className?: string;
}

// All variants now share the same sapphire→midnight gradient so every
// module header looks consistent with the dashboard.
const GRADIENTS: Record<NonNullable<PremiumHeaderProps['variant']>, string> = {
  sapphire: 'from-blue-700 via-blue-800 to-indigo-800',
  midnight: 'from-blue-800 via-blue-900 to-indigo-900',
};

export function PremiumHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  showClock = false,
  variant = 'sapphire',
  className,
}: PremiumHeaderProps) {
  const user = useStore((s) => s.user);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  // Read clock preferences from the user profile (DB-backed)
  const timezone = user?.clockTimezone ?? 'Asia/Kolkata';
  const face: ClockFace = user?.clockFace ?? 'digital';
  const theme: ClockTheme = user?.clockTheme ?? 'day';

  return (
    <>
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
                <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-2xl line-clamp-2 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right side — clock widget + actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
            {showClock && (
              <ClockWidget
                timezone={timezone}
                face={face}
                theme={theme}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Clock settings popup */}
      <ClockSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}

// ============================================================================
// ClockWidget — renders either a digital or analog clock in the header.
// Clicking it opens the settings dialog. Time is computed in the user's
// configured timezone.
// ============================================================================
function ClockWidget({
  timezone,
  face,
  theme,
  onOpenSettings,
}: {
  timezone: string;
  face: ClockFace;
  theme: ClockTheme;
  onOpenSettings: () => void;
}) {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Format time + date in the configured timezone
  let timeStr = '--:--:--';
  let dateStr = 'Loading...';
  if (now) {
    try {
      timeStr = now.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true,
      });
      dateStr = now.toLocaleDateString('en-US', {
        timeZone: timezone,
        weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch {
      // Invalid timezone — fall back to system time
      timeStr = now.toLocaleTimeString('en-US', { hour12: true });
      dateStr = now.toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
      });
    }
  }

  // For the analog clock we need hour/min/sec as numbers in the target tz.
  // We use Intl parts to extract them so the analog hands stay in sync with
  // the digital label.
  let tzHour = 0, tzMin = 0, tzSec = 0;
  if (now) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false,
      }).formatToParts(now);
      for (const p of parts) {
        if (p.type === 'hour') tzHour = parseInt(p.value, 10) % 12;
        else if (p.type === 'minute') tzMin = parseInt(p.value, 10);
        else if (p.type === 'second') tzSec = parseInt(p.value, 10);
      }
    } catch {
      tzHour = now.getHours() % 12;
      tzMin = now.getMinutes();
      tzSec = now.getSeconds();
    }
  }

  return (
    <button
      type="button"
      onClick={onOpenSettings}
      title="Click to change clock settings (country, face, theme)"
      className={cn(
        'group relative rounded-xl p-1.5 ring-1 transition-all',
        theme === 'dark'
          ? 'bg-slate-900/40 ring-white/15 hover:ring-white/30'
          : 'bg-white/10 ring-white/20 hover:ring-white/40',
      )}
    >
      {/* Hover affordance — small settings icon in the corner */}
      <span className="pointer-events-none absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
        <Settings2 className="h-2.5 w-2.5" />
      </span>

      {face === 'digital' ? (
        <div className={cn(
          'flex items-center gap-2.5 rounded-lg px-3 py-2 shadow-sm',
          theme === 'dark' ? 'bg-slate-900' : 'bg-white',
        )}>
          <div className={cn(
            'h-9 w-9 rounded-md flex items-center justify-center flex-shrink-0',
            theme === 'dark' ? 'bg-blue-900' : 'bg-blue-50',
          )}>
            <Clock className={cn('h-4 w-4', theme === 'dark' ? 'text-blue-200' : 'text-blue-700')} />
          </div>
          <div className="min-w-0 text-left">
            <p className={cn(
              'text-sm font-bold tabular-nums leading-tight',
              theme === 'dark' ? 'text-white' : 'text-stone-900',
            )}>
              {timeStr}
            </p>
            <p className={cn(
              'text-[10px] truncate flex items-center gap-1',
              theme === 'dark' ? 'text-slate-400' : 'text-stone-500',
            )}>
              <Calendar className="h-2.5 w-2.5" />
              {dateStr}
            </p>
          </div>
        </div>
      ) : (
        <div className={cn(
          'rounded-lg p-2 shadow-sm flex items-center justify-center',
          theme === 'dark' ? 'bg-slate-900' : 'bg-white',
        )}>
          <AnalogClockSmall
            hour={tzHour}
            minute={tzMin}
            second={tzSec}
            size={56}
            theme={theme}
          />
        </div>
      )}
    </button>
  );
}

// ============================================================================
// AnalogClockSmall — compact SVG analog clock for the header widget
// ============================================================================
function AnalogClockSmall({ hour, minute, second, size, theme }: {
  hour: number;
  minute: number;
  second: number;
  size: number;
  theme: ClockTheme;
}) {
  const hourAngle = (hour + minute / 60) * 30;
  const minuteAngle = (minute + second / 60) * 6;
  const secondAngle = second * 6;

  const isDark = theme === 'dark';
  const face = isDark ? '#1e293b' : '#ffffff';
  const faceBorder = isDark ? '#475569' : '#cbd5e1';
  const tickMajor = isDark ? '#94a3b8' : '#475569';
  const tickMinor = isDark ? '#475569' : '#cbd5e1';
  const hourHand = isDark ? '#f1f5f9' : '#0f172a';
  const minuteHand = isDark ? '#cbd5e1' : '#334155';
  const secondHand = '#0F4C81';
  const centerDot = '#0F4C81';

  const center = size / 2;
  const r = size / 2 - 2;

  const ticks: React.ReactNode[] = [];
  for (let i = 0; i < 60; i++) {
    const angle = (i * 6 * Math.PI) / 180;
    const isMajor = i % 5 === 0;
    const r1 = r - (isMajor ? 4 : 2);
    const r2 = r;
    ticks.push(
      <line
        key={i}
        x1={center + r1 * Math.sin(angle)}
        y1={center - r1 * Math.cos(angle)}
        x2={center + r2 * Math.sin(angle)}
        y2={center - r2 * Math.cos(angle)}
        stroke={isMajor ? tickMajor : tickMinor}
        strokeWidth={isMajor ? 1 : 0.4}
      />,
    );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={r} fill={face} stroke={faceBorder} strokeWidth={1.5} />
      {ticks}
      <line
        x1={center} y1={center}
        x2={center + (r * 0.5) * Math.sin((hourAngle * Math.PI) / 180)}
        y2={center - (r * 0.5) * Math.cos((hourAngle * Math.PI) / 180)}
        stroke={hourHand} strokeWidth={2.5} strokeLinecap="round"
      />
      <line
        x1={center} y1={center}
        x2={center + (r * 0.75) * Math.sin((minuteAngle * Math.PI) / 180)}
        y2={center - (r * 0.75) * Math.cos((minuteAngle * Math.PI) / 180)}
        stroke={minuteHand} strokeWidth={1.5} strokeLinecap="round"
      />
      <line
        x1={center} y1={center}
        x2={center + (r * 0.85) * Math.sin((secondAngle * Math.PI) / 180)}
        y2={center - (r * 0.85) * Math.cos((secondAngle * Math.PI) / 180)}
        stroke={secondHand} strokeWidth={1} strokeLinecap="round"
      />
      <circle cx={center} cy={center} r={2} fill={centerDot} />
    </svg>
  );
}
