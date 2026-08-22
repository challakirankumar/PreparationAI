'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import type { View } from '@/lib/types';
import { ChevronLeft, Sparkles, Compass } from 'lucide-react';

interface Props {
  parent: 'ai-agents' | 'explore';
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional React node rendered on the right side of the header (e.g., action buttons). */
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Wraps any AI Agent or Explore sub-module with a consistent back-to-hub header.
 * The back button returns the user to either the AI Agents dashboard or the
 * Explore dashboard, depending on which hub they came from.
 */
export function SubModuleHeader({ parent, title, subtitle, icon: Icon, actions, children }: Props) {
  const setView = useStore((s) => s.setView);
  const ParentIcon = parent === 'ai-agents' ? Sparkles : Compass;
  const parentLabel = parent === 'ai-agents' ? 'AI Agents' : 'Explore';

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-white via-blue-50/40 to-white px-4 py-3 flex items-center gap-3 shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView(parent as View)}
          className="text-blue-700 hover:bg-blue-100 hover:text-blue-800 flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="h-6 w-px bg-blue-200" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
          <ParentIcon className="h-3.5 w-3.5 text-blue-600" />
          <span className="font-medium">{parentLabel}</span>
        </div>
        <div className="h-6 w-px bg-blue-200" />
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {Icon && (
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="font-semibold text-stone-900 truncate leading-tight">{title}</h2>
            {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
