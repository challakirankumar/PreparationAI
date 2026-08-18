'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, Camera, CameraOff, Radio } from 'lucide-react';

export function ProctoringIndicator({
  active,
  degraded,
  lastEventType,
}: {
  active: boolean;
  degraded: boolean;
  lastEventType?: string;
}) {
  if (!active) return null;

  return (
    <div className={cn(
      'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border',
      degraded
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
    )}>
      {degraded ? (
        <CameraOff className="h-3 w-3" />
      ) : (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
      <span>{degraded ? 'Degraded Mode' : 'Monitoring Active'}</span>
    </div>
  );
}
