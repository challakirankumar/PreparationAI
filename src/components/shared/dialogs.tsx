'use client';

import * as React from 'react';
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ShieldCheck, FileText, Clock, AlertTriangle, CheckCircle2, Lock, Eye,
  Trophy, Zap, Info, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExamPattern } from '@/lib/types';

// ============================================================================
// CONTEST FORM — popup before starting a mock exam
// Key fix: dialog uses max-h-[85vh] with the body as a flex column so the
// checkboxes and button are ALWAYS visible at the bottom (sticky), and the
// rules section scrolls independently above them.
// ============================================================================
export function ContestFormDialog({
  open,
  onOpenChange,
  pattern,
  onAccept,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pattern: ExamPattern | null;
  onAccept: () => void;
}) {
  const [agreed, setAgreed] = React.useState(false);
  const [agreed2, setAgreed2] = React.useState(false);
  const [agreed3, setAgreed3] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setAgreed(false);
      setAgreed2(false);
      setAgreed3(false);
    }
  }, [open]);

  if (!pattern) return null;

  const markingText = pattern.sections[0]?.negativeMarks > 0
    ? `+${pattern.sections[0].marksPerQuestion} / -${pattern.sections[0].negativeMarks}`
    : `+${pattern.sections[0].marksPerQuestion} (no neg)`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header — fixed at top */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 flex items-center gap-3 flex-shrink-0">
          <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur flex-shrink-0">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-base font-bold text-white leading-tight">
              {pattern.name} Mock — Rules
            </DialogTitle>
            <DialogDescription className="text-blue-50 text-xs">
              Accept the terms to begin your exam
            </DialogDescription>
          </div>
        </div>

        {/* Scrollable rules section — takes remaining space */}
        <div className="flex-1 overflow-y-auto scroll-thin px-4 py-3 space-y-3 min-h-0">
          {/* Summary tiles */}
          <div className="grid grid-cols-4 gap-1.5">
            <SummaryTile icon={FileText} label="Qs" value={String(pattern.totalQuestions)} />
            <SummaryTile icon={Clock} label="Min" value={String(Math.round(pattern.durationSec / 60))} />
            <SummaryTile icon={Trophy} label="Marks" value={String(pattern.totalMarks)} />
            <SummaryTile icon={Zap} label="Marking" value={markingText} />
          </div>

          {/* Sections */}
          <div className="rounded-lg border border-stone-200 p-2.5">
            <p className="text-[11px] font-semibold text-stone-600 uppercase tracking-wide mb-1.5">Sections</p>
            <div className="space-y-1">
              {pattern.sections.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-stone-800">{s.name}</span>
                  <span className="text-muted-foreground">{s.questionCount} Qs · +{s.marksPerQuestion}{s.negativeMarks > 0 ? `/-${s.negativeMarks}` : ''}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div>
            <p className="text-xs font-semibold text-stone-900 mb-1.5 flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-blue-600" /> Exam Rules
            </p>
            <div className="space-y-1.5 text-[11px] text-stone-700">
              <RuleItem text={`Strict time limit: ${Math.round(pattern.durationSec / 60)} min. Timer starts on "Start Exam".`} />
              <RuleItem text={`${pattern.totalQuestions} questions across ${pattern.sections.length} sections. Marking: ${markingText}.`} />
              <RuleItem text="Mark questions for review — revisit before submitting." />
              <RuleItem text="Exam auto-submits when timer hits zero." />
              <RuleItem text="Do not refresh or close the browser — progress may be lost." />
            </div>
          </div>

          {/* Privacy */}
          <div>
            <p className="text-xs font-semibold text-stone-900 mb-1.5 flex items-center gap-1">
              <Lock className="h-3.5 w-3.5 text-stone-500" /> Privacy &amp; Data
            </p>
            <div className="space-y-1.5 text-[11px] text-stone-700">
              <RuleItem text="Answers and time data stored locally, linked to your account." />
              <RuleItem text="AI generates personalized insights — no third-party sharing." />
            </div>
          </div>

          {/* Fair use */}
          <div>
            <p className="text-xs font-semibold text-stone-900 mb-1.5 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Fair Use
            </p>
            <div className="space-y-1.5 text-[11px] text-stone-700">
              <RuleItem text="Unique questions per attempt — do not redistribute." />
              <RuleItem text="No external resources during the exam." />
            </div>
          </div>
        </div>

        {/* Acceptance section — always visible at bottom */}
        <div className="border-t border-stone-200 p-3 flex-shrink-0 space-y-2 bg-stone-50/50">
          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5 flex-shrink-0" />
            <span className="text-[11px] text-stone-700">I have read and understood the exam rules, marking scheme, and time limit.</span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox checked={agreed2} onCheckedChange={(v) => setAgreed2(v === true)} className="mt-0.5 flex-shrink-0" />
            <span className="text-[11px] text-stone-700">I consent to my exam data being analyzed by AI for personalized insights.</span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox checked={agreed3} onCheckedChange={(v) => setAgreed3(v === true)} className="mt-0.5 flex-shrink-0" />
            <span className="text-[11px] text-stone-700">I agree not to use external resources; refreshing may lose progress.</span>
          </label>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!agreed || !agreed2 || !agreed3}
              onClick={onAccept}
            >
              <CheckCircle2 className="h-4 w-4" /> Accept &amp; Start
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// SIGNUP TERMS — popup before creating account
// Same layout fix: flex column with sticky bottom
// ============================================================================
export function SignupTermsDialog({
  open,
  onOpenChange,
  onAccept,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAccept: () => void;
}) {
  const [agreed, setAgreed] = React.useState(false);
  const [agreed2, setAgreed2] = React.useState(false);
  const [agreed3, setAgreed3] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setAgreed(false);
      setAgreed2(false);
      setAgreed3(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 flex items-center gap-3 flex-shrink-0">
          <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur flex-shrink-0">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-base font-bold text-white leading-tight">Terms &amp; Conditions</DialogTitle>
            <DialogDescription className="text-blue-50 text-xs">Accept to create your PreparationAI account</DialogDescription>
          </div>
        </div>

        {/* Scrollable terms */}
        <div className="flex-1 overflow-y-auto scroll-thin px-4 py-3 space-y-3 min-h-0">
          <div>
            <p className="text-xs font-semibold text-stone-900 mb-1.5 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-blue-600" /> Terms of Service
            </p>
            <div className="space-y-1.5 text-[11px] text-stone-700">
              <RuleItem text="PreparationAI is an AI-powered educational platform for competitive exam preparation." />
              <RuleItem text="Your account is personal — do not share it. You are responsible for all activity." />
              <RuleItem text="Mock exams are AI-generated based on real patterns — not affiliated with official exam bodies." />
              <RuleItem text="AI Mentor responses are AI-generated guidance — verify critical info from official sources." />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-stone-900 mb-1.5 flex items-center gap-1">
              <Lock className="h-3.5 w-3.5 text-stone-500" /> Privacy Policy
            </p>
            <div className="space-y-1.5 text-[11px] text-stone-700">
              <RuleItem text="Account data is stored locally in your browser via localStorage — no server storage." />
              <RuleItem text="Exam attempts, scores, and mentor chats are stored locally and linked to your account." />
              <RuleItem text="AI analysis is processed via secure API — data used only for personalized responses." />
              <RuleItem text="Delete your account anytime from Settings → Security." />
              <RuleItem text="We do not sell, share, or distribute your personal data." />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-stone-900 mb-1.5 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Acceptable Use
            </p>
            <div className="space-y-1.5 text-[11px] text-stone-700">
              <RuleItem text="Do not redistribute or share mock exam questions." />
              <RuleItem text="Do not reverse-engineer or automate the question engine." />
              <RuleItem text="Platform is for individual study — commercial use prohibited." />
              <RuleItem text="Email verification required for account security." />
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 text-[11px] text-blue-800 flex items-start gap-1.5">
            <Eye className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>Your email will be verified via a one-time code. Data stays in your browser.</span>
          </div>
        </div>

        {/* Acceptance — always visible */}
        <div className="border-t border-stone-200 p-3 flex-shrink-0 space-y-2 bg-stone-50/50">
          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5 flex-shrink-0" />
            <span className="text-[11px] text-stone-700">I have read and agree to the Terms of Service and Privacy Policy.</span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox checked={agreed2} onCheckedChange={(v) => setAgreed2(v === true)} className="mt-0.5 flex-shrink-0" />
            <span className="text-[11px] text-stone-700">I consent to AI analysis of my exam data for personalized insights.</span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox checked={agreed3} onCheckedChange={(v) => setAgreed3(v === true)} className="mt-0.5 flex-shrink-0" />
            <span className="text-[11px] text-stone-700">I understand my data is stored locally and I can delete it anytime.</span>
          </label>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!agreed || !agreed2 || !agreed3}
              onClick={onAccept}
            >
              <CheckCircle2 className="h-4 w-4" /> Accept &amp; Create Account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryTile({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-2 text-center">
      <Icon className="h-3.5 w-3.5 text-blue-600 mx-auto mb-0.5" />
      <p className="text-xs font-bold text-stone-900 leading-none">{value}</p>
      <p className="text-[9px] text-muted-foreground uppercase mt-0.5">{label}</p>
    </div>
  );
}

function RuleItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="h-1 w-1 rounded-full bg-stone-400 mt-1.5 flex-shrink-0" />
      <span className="leading-relaxed">{text}</span>
    </div>
  );
}
