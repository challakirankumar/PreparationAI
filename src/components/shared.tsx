'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================================
// PageHeader — premium glass header used at the top of secondary pages.
// Smaller than PremiumHeader (no time widget) but uses the same glossy
// gradient + inner sheen + soft glow treatment.
// ============================================================================
export function PageHeader({ icon: Icon, title, subtitle, accent = 'emerald', right }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  accent?: 'emerald' | 'amber' | 'teal' | 'rose' | 'blue';
  right?: React.ReactNode;
}) {
  const grads = {
    emerald: 'from-blue-600 to-cyan-600',
    amber: 'from-amber-500 to-orange-500',
    teal: 'from-teal-600 to-cyan-600',
    rose: 'from-rose-500 to-pink-500',
    blue: 'from-blue-600 to-cyan-600',
  };
  return (
    <div className={cn(
      // Glossy pill header with the gradient, soft glow, and inner top sheen
      'relative overflow-hidden rounded-2xl shadow-lg mb-6',
      'bg-gradient-to-r', grads[accent],
      'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent'
    )}>
      {/* Decorative glossy bloom */}
      <div className="pointer-events-none absolute -top-12 -right-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-3 min-w-0">
          <div className={cn(
            'h-11 w-11 rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25 flex items-center justify-center flex-shrink-0'
          )}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white truncate">
              {title}
            </h1>
            {subtitle && <p className="text-xs sm:text-sm text-white/85 mt-0.5 max-w-xl truncate">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, accent = 'emerald' }: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: 'emerald' | 'amber' | 'teal' | 'rose';
}) {
  const bgs = {
    emerald: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    teal: 'bg-teal-50 text-teal-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <Card className="p-4 border-stone-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-stone-900">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        {Icon && <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${bgs[accent]}`}><Icon className="h-4 w-4" /></div>}
      </div>
    </Card>
  );
}

export function SectionTitle({ icon: Icon, title, right }: { icon: React.ComponentType<{ className?: string }>; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold flex items-center gap-2">
        <Icon className="h-4 w-4 text-blue-600" /> {title}
      </h3>
      {right}
    </div>
  );
}
