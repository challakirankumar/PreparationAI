'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/shared';
import { useStore } from '@/lib/store';
import {
  PenTool, Upload, Camera, Send, Loader2, Trash2, CheckCircle2,
  AlertTriangle, Award, FileText, BookOpen, Target, Lightbulb,
  Image as ImageIcon, X, GraduationCap, Eye, ChevronRight,
} from 'lucide-react';

// ============================================================================
// Types matching the API
// ============================================================================

interface SampleRubric {
  id: string;
  title: string;
  subject: string;
  topic: string;
  totalMarks: number;
  stepsCount: number;
  problemStatement: string;
}

interface StepGrade {
  rubricStepIndex: number;
  description: string;
  status: 'correct' | 'partial' | 'wrong' | 'missing';
  awardedMarks: number;
  maxMarks: number;
  studentWork?: string;
  feedback: string;
  conceptsPresent: string[];
  conceptsMissing: string[];
  mistakesIdentified: string[];
}

interface GradingResult {
  totalAwardedMarks: number;
  totalMaxMarks: number;
  percentage: number;
  stepGrades: StepGrade[];
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  handwritingConfidence: 'high' | 'medium' | 'low';
  illegible: boolean;
  auditId?: string;
  generatedAt: string;
}

// ============================================================================
// Status metadata
// ============================================================================

const STATUS_META: Record<StepGrade['status'], { label: string; color: string; bgClass: string; icon: React.ReactNode; barColor: string }> = {
  correct: {
    label: 'Correct',
    color: 'text-emerald-700',
    bgClass: 'bg-emerald-50 border-emerald-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
    barColor: 'bg-emerald-500',
  },
  partial: {
    label: 'Partial',
    color: 'text-amber-700',
    bgClass: 'bg-amber-50 border-amber-200',
    icon: <AlertTriangle className="h-3 w-3" />,
    barColor: 'bg-amber-500',
  },
  wrong: {
    label: 'Wrong',
    color: 'text-rose-700',
    bgClass: 'bg-rose-50 border-rose-200',
    icon: <X className="h-3 w-3" />,
    barColor: 'bg-rose-500',
  },
  missing: {
    label: 'Missing',
    color: 'text-stone-500',
    bgClass: 'bg-stone-50 border-stone-200',
    icon: <FileText className="h-3 w-3" />,
    barColor: 'bg-stone-300',
  },
};

const HANDWRITING_CONFIDENCE: Record<string, { label: string; color: string }> = {
  high: { label: 'Clear handwriting', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  medium: { label: 'Some parts hard to read', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  low: { label: 'Mostly illegible', color: 'bg-rose-100 text-rose-700 border-rose-300' },
};

// ============================================================================
// Main view
// ============================================================================

export function HandwrittenGraderView() {
  const user = useStore(s => s.user);
  const [sampleRubrics, setSampleRubrics] = useState<SampleRubric[]>([]);
  const [selectedRubricId, setSelectedRubricId] = useState<string>('');
  const [customProblem, setCustomProblem] = useState(false);

  // Custom rubric fields
  const [customTitle, setCustomTitle] = useState('');
  const [customStatement, setCustomStatement] = useState('');
  const [customModelAnswer, setCustomModelAnswer] = useState('');
  const [customSubject, setCustomSubject] = useState('Physics');
  const [customTopic, setCustomTopic] = useState('');
  const [customTotalMarks, setCustomTotalMarks] = useState(5);

  // Image upload
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Grading state
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  // Load sample rubrics
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/grade-handwritten');
        if (r.ok) {
          const j = await r.json();
          setSampleRubrics(j.sampleRubrics ?? []);
          if (j.sampleRubrics?.length > 0) {
            setSelectedRubricId(j.sampleRubrics[0].id);
          }
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, HEIC, etc.).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image is too large. Please pick one under 8 MB.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
      setImageName(file.name);
      setResult(null);
    };
    reader.onerror = () => setError('Could not read the file. Try a different image.');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearImage = () => {
    setImageDataUrl(null);
    setImageName(null);
    setResult(null);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) continue;
        if (file.size > 8 * 1024 * 1024) {
          setError('Pasted image is too large. Use one under 8 MB.');
          continue;
        }
        const reader = new FileReader();
        reader.onload = () => {
          setImageDataUrl(reader.result as string);
          setImageName('pasted-image.png');
          setResult(null);
        };
        reader.readAsDataURL(file);
        e.preventDefault();
        break;
      }
    }
  }, []);

  const submitForGrading = async () => {
    if (!imageDataUrl) {
      setError('Please upload an image of your handwritten solution first.');
      return;
    }
    setError(null);
    setGrading(true);
    setResult(null);
    setFallbackMode(false);

    try {
      const payload: any = {
        imageDataUrl,
        userId: user?.id,
        user: user ? { id: user.id, type: user.type, examGoal: user.examGoal } : undefined,
      };

      if (customProblem) {
        // Build a custom rubric on the fly using the model answer as the only step
        payload.rubric = {
          problemTitle: customTitle || 'Custom Problem',
          problemStatement: customStatement,
          totalMarks: customTotalMarks,
          subject: customSubject,
          topic: customTopic || 'General',
          modelAnswer: customModelAnswer,
          steps: [
            {
              index: 1,
              description: 'Overall solution correctness, approach, and presentation',
              marks: customTotalMarks,
              keyConcepts: [],
              commonMistakes: [],
            },
          ],
        };
      } else {
        payload.rubricId = selectedRubricId;
      }

      const r = await fetch('/api/grade-handwritten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to grade');
      }
      const j = await r.json();
      setResult(j.result);
      setFallbackMode(j.fallback === true);
    } catch (e) {
      setError(`Grading failed: ${(e as Error).message}`);
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="space-y-6" onPaste={handlePaste}>
      <PageHeader
        title="Handwritten Step Grader"
        subtitle="Upload a photo of your handwritten solution — AI grades each step against a rubric, identifies mistakes, and awards partial credit"
        accent="blue"
        icon={PenTool}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Problem selection + image upload */}
        <div className="space-y-4">
          {/* Problem selection */}
          <Card className="p-4 border-blue-200">
            <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              Choose Problem
            </h3>

            <label className="flex items-center gap-2 text-sm mb-3 cursor-pointer">
              <input
                type="radio"
                checked={!customProblem}
                onChange={() => setCustomProblem(false)}
                className="border-stone-300"
              />
              Use a sample problem
            </label>
            {!customProblem && (
              <Select value={selectedRubricId} onValueChange={setSelectedRubricId}>
                <SelectTrigger><SelectValue placeholder="Select a sample problem" /></SelectTrigger>
                <SelectContent>
                  {sampleRubrics.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title} · {r.subject} · {r.totalMarks} marks · {r.stepsCount} steps
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <label className="flex items-center gap-2 text-sm mt-3 mb-3 cursor-pointer">
              <input
                type="radio"
                checked={customProblem}
                onChange={() => setCustomProblem(true)}
                className="border-stone-300"
              />
              Define my own problem
            </label>
            {customProblem && (
              <div className="space-y-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                <div>
                  <Label className="text-xs text-stone-500">Problem title</Label>
                  <Input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="e.g. Integration by parts" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-stone-500">Problem statement</Label>
                  <Textarea value={customStatement} onChange={e => setCustomStatement(e.target.value)} placeholder="Paste the question here…" rows={3} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-stone-500">Model answer (for the AI to grade against)</Label>
                  <Textarea value={customModelAnswer} onChange={e => setCustomModelAnswer(e.target.value)} placeholder="Paste the official solution here…" rows={4} className="mt-1" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-stone-500">Subject</Label>
                    <Select value={customSubject} onValueChange={setCustomSubject}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Physics">Physics</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="Biology">Biology</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-stone-500">Topic</Label>
                    <Input value={customTopic} onChange={e => setCustomTopic(e.target.value)} placeholder="e.g. Calculus" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-stone-500">Total marks</Label>
                    <Input type="number" value={customTotalMarks} onChange={e => setCustomTotalMarks(Number(e.target.value) || 5)} className="mt-1" min={1} max={20} />
                  </div>
                </div>
              </div>
            )}

            {/* Show problem statement preview */}
            {!customProblem && selectedRubricId && (
              <div className="mt-3 p-3 rounded-lg bg-stone-50 border border-stone-200">
                {(() => {
                  const r = sampleRubrics.find(s => s.id === selectedRubricId);
                  if (!r) return null;
                  return (
                    <>
                      <p className="text-xs font-semibold text-stone-600 uppercase mb-1">Problem Statement</p>
                      <p className="text-sm text-stone-800 leading-relaxed">{r.problemStatement}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-stone-500">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{r.subject}</Badge>
                        <Badge variant="outline" className="bg-stone-50 text-stone-700 border-stone-200">{r.topic}</Badge>
                        <span>{r.totalMarks} marks · {r.stepsCount} steps</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </Card>

          {/* Image upload */}
          <Card className="p-4 border-blue-200">
            <h3 className="font-semibold text-stone-800 mb-2 flex items-center gap-2">
              <Upload className="h-4 w-4 text-blue-500" />
              Upload Your Solution
            </h3>
            <p className="text-xs text-stone-500 mb-3">
              Drag-and-drop, paste from clipboard, or use the buttons below. Max 8 MB.
            </p>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileSelected} className="hidden" />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onFileSelected} className="hidden" />

            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="h-4 w-4 mr-1" />
                Gallery
              </Button>
              <Button variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()}>
                <Camera className="h-4 w-4 mr-1" />
                Camera
              </Button>
            </div>

            {imageDataUrl && (
              <div className="relative group">
                <img src={imageDataUrl} alt="uploaded solution" className="w-full h-64 object-contain rounded-lg border border-blue-200 bg-white" />
                <button
                  onClick={clearImage}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
                {imageName && (
                  <p className="text-xs text-stone-500 mt-1 truncate">{imageName}</p>
                )}
              </div>
            )}

            {error && (
              <div className="mt-3 flex items-start gap-2 p-2 bg-rose-50 border border-rose-200 rounded text-sm text-rose-700">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              onClick={submitForGrading}
              disabled={grading || !imageDataUrl || (customProblem && (!customStatement.trim() || !customModelAnswer.trim()))}
              className="w-full mt-3"
            >
              {grading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Grading step-by-step…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Grade My Solution
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Right column: grading results */}
        <div className="space-y-4">
          {!result && !grading && (
            <Card className="p-12 text-center border-dashed border-stone-200">
              <PenTool className="h-12 w-12 text-stone-300 mx-auto mb-3" />
              <h4 className="font-semibold text-stone-600 mb-1">No grading yet</h4>
              <p className="text-sm text-stone-500 max-w-xs mx-auto">
                Select a problem, upload your handwritten solution, and click "Grade My Solution" to see step-by-step feedback.
              </p>
            </Card>
          )}

          {grading && (
            <Card className="p-12 text-center border-blue-200">
              <Loader2 className="h-10 w-10 text-blue-500 mx-auto animate-spin mb-3" />
              <h4 className="font-semibold text-stone-700 mb-1">Grading in progress…</h4>
              <p className="text-sm text-stone-500">
                Reading your handwriting, identifying each step, and comparing against the rubric.
              </p>
            </Card>
          )}

          {result && (
            <GradingResultView result={result} isFallback={fallbackMode} />
          )}
        </div>
      </div>

      {/* Bottom explainer */}
      <Card className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <div className="flex items-start gap-3">
          <GraduationCap className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-stone-800 mb-1">How step-wise grading works</h4>
            <ul className="text-sm text-stone-700 space-y-1 list-disc list-inside">
              <li>Each problem has a <strong>rubric</strong> — a list of expected steps with marks and key concepts.</li>
              <li>The AI <strong>reads your handwritten solution</strong> via the vision model and identifies which steps you wrote.</li>
              <li>Each step is graded as <strong>correct</strong> (full marks), <strong>partial</strong> (half marks — right idea, minor error), <strong>wrong</strong> (step present but incorrect), or <strong>missing</strong> (step not in your work).</li>
              <li>You get <strong>per-step feedback</strong> identifying which concepts you got right, which you missed, and the specific mistakes you made.</li>
              <li>Every call passes through <strong>EduScope</strong> — PII is auto-redacted and off-topic content is blocked.</li>
            </ul>
            <p className="text-xs text-stone-500 mt-2">
              <AlertTriangle className="inline h-3 w-3 mr-1" />
              Handwriting recognition isn't perfect — for messy handwriting the AI may downgrade confidence or mark steps as missing. Re-upload a clearer photo if needed.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// Grading Result view
// ============================================================================

function GradingResultView({ result, isFallback }: { result: GradingResult; isFallback: boolean }) {
  const pct = result.percentage;
  const tier =
    pct >= 90 ? { label: 'Excellent', color: 'text-emerald-700', bg: 'from-emerald-400 to-teal-500', icon: <Award className="h-8 w-8 text-white" /> }
    : pct >= 70 ? { label: 'Good', color: 'text-blue-700', bg: 'from-blue-400 to-cyan-500', icon: <CheckCircle2 className="h-8 w-8 text-white" /> }
    : pct >= 40 ? { label: 'Needs Work', color: 'text-amber-700', bg: 'from-amber-400 to-orange-500', icon: <AlertTriangle className="h-8 w-8 text-white" /> }
    : { label: 'Significant Gaps', color: 'text-rose-700', bg: 'from-rose-400 to-red-500', icon: <Target className="h-8 w-8 text-white" /> };

  return (
    <div className="space-y-4">
      {/* Hero card with score */}
      <Card className={`p-5 border-2 ${isFallback ? 'border-amber-300' : 'border-blue-300'} bg-gradient-to-br ${tier.bg}`}>
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
            {tier.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-white">Grading Complete</h3>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur">{tier.label}</Badge>
              {isFallback && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300">Fallback mode</Badge>
              )}
            </div>
            <p className="text-3xl font-bold text-white mt-1 tabular-nums">
              {result.totalAwardedMarks}<span className="text-xl opacity-80"> / {result.totalMaxMarks}</span>
              <span className="text-lg ml-2 opacity-80">({pct}%)</span>
            </p>
            <Badge className={`mt-2 bg-white/20 text-white border-white/30 backdrop-blur ${HANDWRITING_CONFIDENCE[result.handwritingConfidence].color.split(' ')[0]}`}>
              <Eye className="h-3 w-3 mr-1" />
              {HANDWRITING_CONFIDENCE[result.handwritingConfidence].label}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Overall feedback */}
      <Card className="p-4 border-blue-200">
        <h4 className="font-semibold text-stone-800 mb-2 text-sm flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Overall Feedback
        </h4>
        <p className="text-sm text-stone-700 leading-relaxed">{result.overallFeedback}</p>
      </Card>

      {/* Score progress */}
      <Card className="p-4 border-blue-200">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="font-semibold text-stone-700">Total Score</span>
          <span className="font-mono tabular-nums text-stone-700">
            {result.totalAwardedMarks} / {result.totalMaxMarks} ({pct}%)
          </span>
        </div>
        <Progress value={pct} className="h-3" />
      </Card>

      {/* Step-by-step breakdown */}
      <Card className="p-4 border-blue-200">
        <h4 className="font-semibold text-stone-800 mb-3 text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-500" />
          Step-by-Step Breakdown
        </h4>
        <div className="space-y-3">
          {result.stepGrades.map((step, idx) => (
            <StepCard key={idx} step={step} />
          ))}
        </div>
      </Card>

      {/* Strengths + improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {result.strengths.length > 0 && (
          <Card className="p-4 border-emerald-200">
            <h4 className="font-semibold text-stone-800 mb-2 text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Strengths
            </h4>
            <ul className="space-y-1">
              {result.strengths.map((s, i) => (
                <li key={i} className="text-sm text-stone-700 flex items-start gap-2">
                  <ChevronRight className="h-3 w-3 mt-1 text-emerald-500 flex-shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {result.improvements.length > 0 && (
          <Card className="p-4 border-amber-200">
            <h4 className="font-semibold text-stone-800 mb-2 text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-500" />
              Areas to Improve
            </h4>
            <ul className="space-y-1">
              {result.improvements.map((s, i) => (
                <li key={i} className="text-sm text-stone-700 flex items-start gap-2">
                  <ChevronRight className="h-3 w-3 mt-1 text-amber-500 flex-shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Audit info */}
      {result.auditId && (
        <p className="text-xs text-stone-400 text-center">
          Audited via EduScope · audit ID: <span className="font-mono">{result.auditId}</span>
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Step card
// ============================================================================

function StepCard({ step }: { step: StepGrade }) {
  const meta = STATUS_META[step.status];
  const marksPct = step.maxMarks > 0 ? (step.awardedMarks / step.maxMarks) * 100 : 0;

  return (
    <div className={`p-3 rounded-lg border ${meta.bgClass}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-stone-500">Step {step.rubricStepIndex}</span>
            <Badge variant="outline" className={`text-xs ${meta.color} ${meta.bgClass} border-current`}>
              {meta.icon}
              <span className="ml-1">{meta.label}</span>
            </Badge>
          </div>
          <p className="text-sm font-medium text-stone-800 mt-1">{step.description}</p>
        </div>
        <div className="text-right">
          <p className="font-bold tabular-nums text-stone-800">
            {step.awardedMarks}<span className="text-xs text-stone-500">/{step.maxMarks}</span>
          </p>
        </div>
      </div>

      {/* Marks bar */}
      <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden mb-2">
        <div className={`h-full ${meta.barColor}`} style={{ width: `${marksPct}%` }} />
      </div>

      {/* Student's work */}
      {step.studentWork && (
        <div className="mb-2 p-2 rounded bg-white/60 border border-stone-200">
          <p className="text-[10px] font-semibold text-stone-500 uppercase mb-0.5">Your work (paraphrased)</p>
          <p className="text-xs text-stone-700 italic">"{step.studentWork}"</p>
        </div>
      )}

      {/* Feedback */}
      <p className="text-xs text-stone-700 leading-relaxed mb-2">{step.feedback}</p>

      {/* Concepts present */}
      {step.conceptsPresent.length > 0 && (
        <div className="mb-1.5">
          <p className="text-[10px] font-semibold text-emerald-700 uppercase mb-0.5">Concepts ✓</p>
          <div className="flex flex-wrap gap-1">
            {step.conceptsPresent.map((c, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                {c}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Concepts missing */}
      {step.conceptsMissing.length > 0 && (
        <div className="mb-1.5">
          <p className="text-[10px] font-semibold text-rose-700 uppercase mb-0.5">Missing</p>
          <div className="flex flex-wrap gap-1">
            {step.conceptsMissing.map((c, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200">
                {c}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Mistakes */}
      {step.mistakesIdentified.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-amber-700 uppercase mb-0.5">Mistakes</p>
          <ul className="space-y-0.5">
            {step.mistakesIdentified.map((m, i) => (
              <li key={i} className="text-xs text-stone-700 flex items-start gap-1">
                <span className="text-amber-500">⚠</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
