'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { IntegrityReport, CategoryBreakdown } from '@/lib/types';
import { getVerdictTier, VERDICT_THRESHOLDS } from '@/lib/proctoring/profiles';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Clock, Camera, Eye, Lock,
  ChevronDown, ChevronRight, Shield, ShieldAlert, ShieldX, Info, FileWarning,
  Microscope, Users, Mic, Monitor, UserCheck, Activity, Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// NTA UFM category metadata — clearly labeled training simulation
// ============================================================================
const UFM_CATEGORY_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; description: string; ntaReference: string }
> = {
  'Candidate Conduct — Attention': {
    icon: Eye,
    description: 'Sustained absence from camera frame or looking away from the screen for an extended period.',
    ntaReference: 'NTA treats sustained inattention as a conduct violation under the UFM taxonomy.',
  },
  'Communication / Assistance': {
    icon: Mic,
    description: 'Talking, whispering, multiple faces in frame, or signs of receiving help from someone nearby.',
    ntaReference: 'NTA explicitly lists "talking to, signaling, or receiving help from anyone" as a UFM offence.',
  },
  'Identity Verification': {
    icon: UserCheck,
    description: 'Face at exam start or during the exam does not match the reference selfie captured at registration.',
    ntaReference: 'NTA: "Impersonation / identity fraud — someone else appearing on a candidate\'s behalf."',
  },
  'Prohibited Items': {
    icon: FileWarning,
    description: 'A phone-shaped, book-shaped, or paper-shaped object detected in the camera frame.',
    ntaReference: 'NTA: "any electronic device (even switched off), smartwatch, Bluetooth earphones, written material."',
  },
  'Exam Environment Integrity': {
    icon: Monitor,
    description: 'Browser tab switches, fullscreen exits, copy/paste attempts, devtools suspected, multi-monitor detected.',
    ntaReference: 'NTA equivalent: leaving the exam hall, leaving the seat without permission, or using unauthorised tools.',
  },
  'Session Continuity': {
    icon: Activity,
    description: 'Network connection lost temporarily, or exam tab closed without submitting.',
    ntaReference: 'NTA equivalent: leaving the exam center before the official end of the paper without invigilator permission.',
  },
};

export function IntegrityReportTab({ report }: { report: IntegrityReport | null }) {
  if (!report) {
    return (
      <Card className="p-6 border-stone-200">
        <div className="text-center">
          <ShieldCheck className="h-10 w-10 text-blue-600 mx-auto mb-2" />
          <p className="font-semibold">No proctoring data</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            This exam was not proctored. Enable AI Proctoring on your next mock to
            get a Simulated Integrity Report grounded in the NTA Unfair Means (UFM)
            taxonomy.
          </p>
        </div>
      </Card>
    );
  }

  const { verdict, disclaimer, coachingText, evidenceTimeline, session } = report;
  const tier = getVerdictTier(verdict.integrityScore);

  return (
    <div className="space-y-4">
      {/* ===== Training simulation banner ===== */}
      <div className="rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 p-3 flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Scale className="h-5 w-5 text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">
            Training Simulation — No Real-World Effect
          </p>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">{disclaimer}</p>
          <p className="text-[10px] text-amber-700 mt-1 italic">
            PreparationAI cannot debar you, cancel a real result, or impose legal
            consequence. The categories below mirror what NTA enforces so you can
            build exam-day discipline before it costs you a real seat.
          </p>
        </div>
      </div>

      {/* ===== Score hero ===== */}
      <Card className="p-5 border-stone-200">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative h-24 w-24 flex-shrink-0 mx-auto md:mx-0">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80">
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
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
              <ShieldIcon tier={tier.tier} />
              <h3 className="font-bold text-lg" style={{ color: tier.color }}>{tier.label}</h3>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed">
              {verdict.totalEvents} event{verdict.totalEvents !== 1 ? 's' : ''} detected across{' '}
              {verdict.categoryBreakdown.length} categor{verdict.categoryBreakdown.length !== 1 ? 'ies' : 'y'} of
              the NTA Unfair Means taxonomy.
            </p>
            <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
              <Badge variant="outline" className="text-[10px] border-stone-300">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(session.startedAt).toLocaleString(undefined, {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </Badge>
              {session.proctoringDegraded ? (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  <Camera className="h-3 w-3 mr-1" /> Degraded — camera unavailable
                </Badge>
              ) : session.cameraEnabled ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                  <Camera className="h-3 w-3 mr-1" /> Camera active
                </Badge>
              ) : null}
              {session.micEnabled && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                  <Mic className="h-3 w-3 mr-1" /> Mic active
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Verdict scale legend */}
        <div className="mt-4 pt-3 border-t border-stone-100">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            Verdict scale (training simulation)
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {Object.entries(VERDICT_THRESHOLDS).map(([key, v]) => (
              <div
                key={key}
                className={cn(
                  'rounded-md px-2 py-1.5 border text-center transition',
                  tier.tier === key
                    ? 'border-2 shadow-sm'
                    : 'border opacity-50'
                )}
                style={{
                  borderColor: tier.tier === key ? v.color : '#e7e5e4',
                  backgroundColor: tier.tier === key ? `${v.color}10` : 'transparent',
                }}
              >
                <p className="text-[9px] uppercase font-bold tracking-wide" style={{ color: v.color }}>
                  {v.label}
                </p>
                <p className="text-[8px] text-muted-foreground mt-0.5">
                  {key === 'clean' ? '90–100' : key === 'minor_flags' ? '70–89' : key === 'flagged_for_review' ? '40–69' : '0–39'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ===== Coaching text ===== */}
      <Card className="p-4 border-stone-200" style={{ borderLeft: `4px solid ${tier.color}` }}>
        <div className="flex items-start gap-2">
          <Microscope className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: tier.color }} />
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">
              What this means for your real exam
            </p>
            <p className="text-sm text-stone-700 leading-relaxed">{coachingText}</p>
          </div>
        </div>
      </Card>

      {/* ===== Category breakdown ===== */}
      <Card className="p-5 border-stone-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-600" /> Category Breakdown
          </h3>
          <span className="text-[10px] text-muted-foreground">Tap a category to expand</span>
        </div>
        <div className="space-y-2">
          {verdict.categoryBreakdown.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-stone-700">
                No integrity events detected in this attempt.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You maintained clean exam discipline throughout this session.
              </p>
            </div>
          ) : (
            verdict.categoryBreakdown.map((cat) => (
              <CategoryBar key={cat.category} category={cat} />
            ))
          )}
        </div>
      </Card>

      {/* ===== NTA reference table ===== */}
      <Card className="p-5 border-stone-200 bg-stone-50/40">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600" /> NTA UFM Taxonomy Reference
        </h3>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          The categories below mirror the Unfair Means taxonomy published by the
          National Testing Agency (NTA) for JEE Main and NEET. Each detection in
          this report maps to one of these categories.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(UFM_CATEGORY_META).map(([cat, meta]) => {
            const Icon = meta.icon;
            const isDetected = verdict.categoryBreakdown.some(c => c.category === cat);
            return (
              <div
                key={cat}
                className={cn(
                  'rounded-lg border p-2.5 flex items-start gap-2 transition',
                  isDetected ? 'border-amber-200 bg-amber-50/50' : 'border-stone-200 bg-white'
                )}
              >
                <Icon className={cn(
                  'h-4 w-4 flex-shrink-0 mt-0.5',
                  isDetected ? 'text-amber-600' : 'text-stone-400'
                )} />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-stone-900 flex items-center gap-1">
                    {cat}
                    {isDetected && (
                      <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-700 bg-amber-50">
                        Detected
                      </Badge>
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{meta.description}</p>
                  <p className="text-[9px] text-stone-500 italic mt-0.5">{meta.ntaReference}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ===== Evidence timeline ===== */}
      <Card className="p-5 border-stone-200">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600" /> Evidence Timeline
        </h3>
        {evidenceTimeline.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-stone-700">
              No medium or high severity events detected.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The timeline below would have shown a chronological list of every
              flagged moment, with the camera snapshot captured at that instant.
            </p>
          </div>
        ) : (
          <EvidenceTimeline timeline={evidenceTimeline} />
        )}
      </Card>

      {/* ===== Privacy & data footer ===== */}
      <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 flex items-start gap-2">
        <Lock className="h-4 w-4 text-stone-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
            Privacy & data
          </p>
          <p className="text-[11px] text-stone-600 leading-relaxed mt-0.5">
            All detection runs in your browser. Only structured event metadata and
            compressed JPEG snapshots of <strong>flagged moments only</strong> leave
            your device. No raw video stream is uploaded at any point.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Category bar — expandable to show every event in that category
// ============================================================================
function CategoryBar({ category }: { category: CategoryBreakdown }) {
  const [expanded, setExpanded] = React.useState(false);
  const meta = UFM_CATEGORY_META[category.category];
  const Icon = meta?.icon || Shield;
  const severityColor = {
    critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#3b82f6',
  }[category.maxSeverity];

  return (
    <div className="rounded-lg border border-stone-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-stone-50 transition text-left"
      >
        <div
          className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${severityColor}15` }}
        >
          <Icon className="h-4 w-4" style={{ color: severityColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-stone-900 truncate">{category.category}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {category.eventCount} event{category.eventCount !== 1 ? 's' : ''} ·
            max severity: <span style={{ color: severityColor }}>{category.maxSeverity}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {category.totalDeduction > 0 && (
            <span className="text-xs font-bold" style={{ color: severityColor }}>
              −{category.totalDeduction}
            </span>
          )}
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-stone-100 bg-stone-50/30 p-3 space-y-1.5">
          <p className="text-[10px] text-muted-foreground mb-2 italic">
            {meta?.ntaReference}
          </p>
          {category.events.length === 0 ? (
            <p className="text-[10px] text-muted-foreground">No events recorded.</p>
          ) : (
            category.events.map((e, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-1.5 rounded bg-white border border-stone-100"
              >
                <span className="text-[10px] font-mono text-muted-foreground w-12 flex-shrink-0">
                  {formatExamTime(e.timestamp)}
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] capitalize flex-shrink-0"
                  style={{ color: severityColor, borderColor: `${severityColor}40` }}
                >
                  {e.severity}
                </Badge>
                <span className="text-[11px] text-stone-700 truncate">
                  {e.eventType.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
                  conf {(e.confidenceScore * 100).toFixed(0)}%
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Evidence timeline — chronological list with expandable snapshots
// ============================================================================
function EvidenceTimeline({ timeline }: {
  timeline: NonNullable<IntegrityReport['evidenceTimeline']>;
}) {
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set());

  function toggle(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {timeline.map((item, i) => {
        const isOpen = expanded.has(i);
        const sevColor = {
          critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#3b82f6',
        }[item.severity];
        return (
          <div
            key={i}
            className="rounded-lg border border-stone-200 overflow-hidden bg-white"
          >
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-start gap-3 p-3 hover:bg-stone-50 transition text-left"
            >
              <div
                className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${sevColor}15` }}
              >
                <SeverityIcon severity={item.severity} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">
                    {item.formattedTime}
                  </span>
                  <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                  <Badge
                    variant="outline"
                    className="text-[9px] capitalize"
                    style={{ color: sevColor, borderColor: `${sevColor}40` }}
                  >
                    {item.severity}
                  </Badge>
                </div>
                <p className="text-xs text-stone-700 mt-1 leading-relaxed">{item.description}</p>
                {item.evidenceUrl && (
                  <p className="text-[10px] text-blue-600 mt-1 flex items-center gap-1">
                    <Camera className="h-3 w-3" />
                    {isOpen ? 'Hide snapshot' : 'View snapshot'}
                  </p>
                )}
              </div>
            </button>
            {isOpen && item.evidenceUrl && (
              <div className="border-t border-stone-100 bg-stone-50/30 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Captured snapshot
                </p>
                <div className="flex items-start gap-3">
                  <img
                    src={item.evidenceUrl}
                    alt={`Evidence at ${item.formattedTime}`}
                    className="h-32 w-auto rounded border border-stone-200 object-cover"
                  />
                  <p className="text-[10px] text-muted-foreground leading-relaxed flex-1">
                    This snapshot was captured on-device at the moment the event
                    was detected. Only this single JPEG frame was uploaded —
                    no continuous video stream was ever sent to the server.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================
function formatExamTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
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
  return <AlertTriangle className={cn('h-4 w-4', cls)} />;
}
