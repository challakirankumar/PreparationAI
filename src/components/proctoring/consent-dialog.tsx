'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  ShieldCheck, Camera, Mic, Video, Lock, AlertTriangle, CheckCircle2,
  Eye, FileText, Clock,
} from 'lucide-react';

export function ProctoringConsentDialog({
  open,
  onOpenChange,
  onAccept,
  examName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAccept: (cameraEnabled: boolean, micEnabled: boolean) => void;
  examName: string;
}) {
  const [cameraConsent, setCameraConsent] = React.useState(false);
  const [micConsent, setMicConsent] = React.useState(false);
  const [termsConsent, setTermsConsent] = React.useState(false);
  const [minorConsent, setMinorConsent] = React.useState(false);
  const [step, setStep] = React.useState<'consent' | 'system_check'>('consent');

  React.useEffect(() => {
    if (open) {
      setCameraConsent(false);
      setMicConsent(false);
      setTermsConsent(false);
      setMinorConsent(false);
      setStep('consent');
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
          <div className="flex-1">
            <DialogTitle className="text-base font-bold text-white leading-tight">
              AI Proctoring — {examName}
            </DialogTitle>
            <DialogDescription className="text-blue-50 text-xs">
              {step === 'consent' ? 'Consent & Privacy' : 'System Check'}
            </DialogDescription>
          </div>
          <Badge className="bg-white/20 text-white border-0">Training Simulation</Badge>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scroll-thin px-4 py-3 min-h-0">
          {step === 'consent' ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-[11px] text-blue-800">
                <strong>What is this?</strong> AI Proctoring monitors your exam environment to help
                you build exam-day discipline. It detects the same behavioral categories NTA cares
                about (device use, multiple faces, leaving frame) during practice.
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-stone-900">What will be monitored:</p>
                <ConsentItem icon={Camera} title="Camera (Visual Monitoring)" desc="Face presence, multiple faces, gaze direction, prohibited objects. On-device ML — no raw video leaves your browser." />
                <ConsentItem icon={Mic} title="Microphone (Optional)" desc="Audio anomaly detection for sustained speech. Separate consent — you can opt out." />
                <ConsentItem icon={Eye} title="Browser Activity" desc="Tab switches, fullscreen exits, copy/paste attempts, devtools detection." />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-stone-900">What is stored:</p>
                <ConsentItem icon={FileText} title="Event Logs" desc="Structured event metadata (type, severity, timestamp) — retained as academic history." />
                <ConsentItem icon={Video} title="Evidence Snapshots" desc="Compressed JPEG snapshots ONLY on medium+ severity events. Auto-deleted after 30 days." />
                <ConsentItem icon={Lock} title="Reference Selfie" desc="Used for identity verification. Retained until you delete it from Settings." />
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-800 flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span><strong>Privacy:</strong> ML inference runs on your device. No raw video/audio streams are sent to servers. Only structured events + single JPEG snapshots on flagged moments. This is your main privacy protection.</span>
              </div>

              <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-[11px] text-rose-800">
                <strong>Important:</strong> This is a training simulation only. It has no effect on
                your real exam eligibility or academic record. We cannot debar, cancel a real
                result, or impose legal consequence.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-stone-900">System requirements check:</p>
              <SystemCheck icon={Camera} label="Camera access" desc="Required for visual monitoring" />
              <SystemCheck icon={Clock} label="Stable internet" desc="Heartbeat every 30s — brief drops are OK" />
              <SystemCheck icon={Lock} label="Fullscreen mode" desc="Will be requested when exam starts" />
              
              <div className="rounded-lg bg-stone-50 border border-stone-200 p-2.5 text-[11px] text-stone-600">
                If camera is unavailable, the session will proceed in <strong>degraded mode</strong> —
                browser lockdown + tab monitoring still active, but visual checks are skipped.
                This will be noted in your report.
              </div>
            </div>
          )}
        </div>

        {/* Acceptance */}
        <div className="border-t border-stone-200 p-3 flex-shrink-0 space-y-2 bg-stone-50/50">
          {step === 'consent' ? (
            <>
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox checked={cameraConsent} onCheckedChange={(v) => setCameraConsent(v === true)} className="mt-0.5 flex-shrink-0" />
                <span className="text-[11px] text-stone-700">I consent to camera monitoring during this exam. I understand ML runs on my device.</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox checked={micConsent} onCheckedChange={(v) => setMicConsent(v === true)} className="mt-0.5 flex-shrink-0" />
                <span className="text-[11px] text-stone-700">I consent to microphone monitoring (optional — you can opt out).</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox checked={termsConsent} onCheckedChange={(v) => setTermsConsent(v === true)} className="mt-0.5 flex-shrink-0" />
                <span className="text-[11px] text-stone-700">I understand this is a training simulation with no real-world academic or legal effect.</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox checked={minorConsent} onCheckedChange={(v) => setMinorConsent(v === true)} className="mt-0.5 flex-shrink-0" />
                <span className="text-[11px] text-stone-700">If I am under 18, I confirm guardian consent has been obtained for biometric monitoring.</span>
              </label>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!cameraConsent || !termsConsent || !minorConsent}
                  onClick={() => setStep('system_check')}
                >
                  Continue to System Check
                </Button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setStep('consent')}>
                Back
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => onAccept(cameraConsent, micConsent)}
              >
                <CheckCircle2 className="h-4 w-4" /> Start Proctored Exam
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConsentItem({ icon: Icon, title, desc }: { icon: typeof Camera; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-stone-50">
      <Icon className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[11px] font-medium text-stone-900">{title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function SystemCheck({ icon: Icon, label, desc }: { icon: typeof Camera; label: string; desc: string }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg border border-stone-200">
      <Icon className="h-4 w-4 text-blue-600 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-xs font-medium text-stone-900">{label}</p>
        <p className="text-[10px] text-muted-foreground">{desc}</p>
      </div>
      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    </div>
  );
}
