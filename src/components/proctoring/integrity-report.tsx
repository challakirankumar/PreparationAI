'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { IntegrityReport, CategoryBreakdown, ProctoringEvent } from '@/lib/types';
import { getVerdictTier } from '@/lib/proctoring/profiles';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Clock, Camera, Eye, Lock,
  FileText, ChevronDown, ChevronRight, Shield, ShieldAlert, ShieldX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function IntegrityReportTab({ report }: { report: IntegrityReport | null }) {
  if (!report) {
    return (
      <Card className="p-6 border-stone-200">
        <div className="text-center">
          <ShieldCheck className="h-10 w-10 text-blue-600 mx-auto mb-2" />
          <p className="font-semibold">No proctoring data</p>
          <p className="text-sm text-muted-foreground mt-1">
            This exam was not proctored. Enable AI Proctoring on your next mock to get an integrity report.
          </p>
        </div>
      </Card>
    );
  }

  const { verdict, disclaimer, coachingText, evidenceTimeline, session } = report;
  const tier = getVerdictTier(verdict.integrityScore);

  return (
    <div className="space-y-4">
      {/* Disclaimer banner */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-800">{disclaimer}</p>
      </div>

      {/* Score hero */}
      <Card className="p-5 border-stone-200">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 flex-shrink-0">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" stroke="#f5f5f4" strokeWidth="6" fill="none" />
              <circle
                cx="40" cy="40" r="34" stroke={tier.color} strokeWidth="6" fill="none"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - verdict.integrityScore / 100)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold" style={{ color: tier.color }}>{verdict.integrityScore}</span>
              <span className="text-[9px] text-muted-foreground uppercase">/ 100</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <ShieldIcon tier={tier.tier} />
              <h3 className="font-bold text-lg" style={{ color: tier.color }}>{tier.label}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {verdict.totalEvents} event{verdict.totalEvents !== 1 ? 's' : ''} detected across{' '}
              {verdict.categoryBreakdown.length} categor{verdict.categoryBreakdown.length !== 1 ? 'ies' : 'y'}
            </p>
            {session.proctoringDegraded && (
              <Badge className="mt-1 bg-amber-100 text-amber-700 border-amber-200">
                <Camera className="h-3 w-3 mr-1" /> Degraded mode — camera unavailable
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Coaching text */}
      <Card className="p-4 border-stone-200" style={{ borderLeft: `4px solid ${tier.color}` }}>
        <p className="text-sm text-stone-700 leading-relaxed">{coachingText}</p>
      </Card>

      {/* Category breakdown */}
      <Card className="p-5 border-stone-200">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600" /> Category Breakdown
        </h3>
        <div className="space-y-3">
          {verdict.categoryBreakdown.map((cat) => (
            <CategoryBar key={cat.category} category={cat} />
          ))}
        </div>
      </Card>

      {/* Evidence timeline */}
      <Card className="p-5 border-stone-200">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600" /> Evidence Timeline
        </h3>
        {evidenceTimeline.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No medium or high severity events detected.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {evidenceTimeline.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-stone-100 hover:border-blue-200 transition">
                <div className={cn(
                  'h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0',
                  item.severity === 'critical' ? 'bg-rose-100' :
                  item.severity === 'high' ? 'bg-orange-100' :
                  'bg-amber-100'
                )}>
                  <SeverityIcon severity={item.severity} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{item.formattedTime}</span>
                    <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                  </div>
                  <p className="text-xs text-stone-700 mt-0.5">{item.description}</p>
                </div>
                {item.evidenceUrl && (
                  <img src={item.evidenceUrl} alt="Evidence" className="h-10 w-10 rounded object-cover flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function CategoryBar({ category }: { category: CategoryBreakdown }) {
  const [expanded, setExpanded] = React.useState(false);
  const severityColor = {
    critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#3b82f6',
  }[category.maxSeverity];

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          <span className="text-xs font-medium text-stone-900">{category.category}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{category.eventCount} event{category.eventCount !== 1 ? 's' : ''}</span>
          <div className="h-1.5 w-12 rounded-full bg-stone-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, category.totalDeduction * 2)}%`, backgroundColor: severityColor }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: severityColor }}>-{category.totalDeduction}</span>
        </div>
      </button>
      {expanded && (
        <div className="ml-6 mt-1 space-y-1">
          {category.events.map((e, i) => (
            <div key={i} className="text-[10px] text-muted-foreground flex items-center gap-2">
              <span className="font-mono">{Math.floor(e.timestamp / 60000)}:{String(Math.floor((e.timestamp % 60000) / 1000)).padStart(2, '0')}</span>
              <span>{e.eventType.replace(/_/g, ' ')}</span>
              <Badge variant="outline" className="text-[9px] capitalize">{e.severity}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ShieldIcon({ tier }: { tier: string }) {
  if (tier === 'clean') return <ShieldCheck className="h-5 w-5 text-emerald-500" />;
  if (tier === 'minor_flags') return <Shield className="h-5 w-5 text-amber-500" />;
  if (tier === 'flagged_for_review') return <ShieldAlert className="h-5 w-5 text-orange-500" />;
  return <ShieldX className="h-5 w-5 text-rose-500" />;
}

function SeverityIcon({ severity }: { severity: string }) {
  const cls = severity === 'critical' ? 'text-rose-600' :
    severity === 'high' ? 'text-orange-600' : 'text-amber-600';
  return <AlertTriangle className={cn('h-3.5 w-3.5', cls)} />;
}
