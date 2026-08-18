'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/shared';
import { useStore } from '@/lib/store';
import {
  Brain, Send, Loader2, RefreshCw, Sparkles, AlertTriangle,
  Target, Lightbulb, GraduationCap, Activity, MessageSquare,
  CheckCircle2, XCircle, Eye, EyeOff, Zap, Clock, Compass,
} from 'lucide-react';

// ============================================================================
// Types matching the API response
// ============================================================================

interface MisconceptionDetection {
  type: string;
  confidence: number;
  diagnosis: string;
  evidence: string;
  suggestedStrategy: string;
  subPattern?: string;
}

interface SocraticResponse {
  sessionId: string;
  reply: string;
  phase: string;
  hintCount: number;
  misconception?: MisconceptionDetection;
  misconceptionHistory: string[];
  allowDirectAnswer: boolean;
  directAnswerRevealed: boolean;
  auditId?: string;
  blocked?: boolean;
  reason?: string;
}

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  // Socratic metadata (only for assistant turns)
  phase?: string;
  hintCount?: number;
  misconception?: MisconceptionDetection;
  allowDirectAnswer?: boolean;
  directAnswerRevealed?: boolean;
  blocked?: boolean;
}

// ============================================================================
// Phase + strategy metadata
// ============================================================================

const PHASE_META: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  initial: {
    label: 'Initial',
    color: 'bg-stone-100 text-stone-700 border-stone-300',
    icon: <Compass className="h-3 w-3" />,
    description: 'Gathering context — share a problem to begin.',
  },
  probing: {
    label: 'Probing',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: <Activity className="h-3 w-3" />,
    description: 'Asking diagnostic questions to identify the misconception.',
  },
  diagnosing: {
    label: 'Diagnosing',
    color: 'bg-amber-100 text-amber-700 border-amber-300',
    icon: <Target className="h-3 w-3" />,
    description: 'Misconception identified — tailoring the next hint.',
  },
  scaffolding: {
    label: 'Scaffolding',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    icon: <Lightbulb className="h-3 w-3" />,
    description: 'Providing hints one at a time — student attempts after each.',
  },
  confirming: {
    label: 'Confirming',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    icon: <CheckCircle2 className="h-3 w-3" />,
    description: 'Student reached the answer — verifying understanding.',
  },
  closed: {
    label: 'Closed',
    color: 'bg-stone-100 text-stone-700 border-stone-300',
    icon: <CheckCircle2 className="h-3 w-3" />,
    description: 'Session complete — full solution revealed if needed.',
  },
};

const MISCONCEPTION_COLORS: Record<string, string> = {
  conceptual: 'bg-rose-50 text-rose-700 border-rose-200',
  procedural: 'bg-amber-50 text-amber-700 border-amber-200',
  factual: 'bg-blue-50 text-blue-700 border-blue-200',
  arithmetical: 'bg-orange-50 text-orange-700 border-orange-200',
  'visual-spatial': 'bg-purple-50 text-purple-700 border-purple-200',
  semantic: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  overgeneralisation: 'bg-pink-50 text-pink-700 border-pink-200',
  strategic: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  careless: 'bg-stone-50 text-stone-700 border-stone-200',
  unclassified: 'bg-stone-50 text-stone-600 border-stone-200',
};

const STRATEGY_LABELS: Record<string, string> = {
  'probe-understanding': 'Probe Understanding',
  'confront-contradiction': 'Confront Contradiction',
  'scaffold-steps': 'Scaffold Steps',
  'analogical-prompt': 'Analogical Prompt',
  'limit-case': 'Limit Case',
  'review-definition': 'Review Definition',
  'redraw-diagram': 'Redraw Diagram',
  'verify-calculation': 'Verify Calculation',
  'try-alternative': 'Try Alternative',
};

// ============================================================================
// Main view
// ============================================================================

export function SocraticMentorView() {
  const user = useStore(s => s.user);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Optional problem context (advanced feature for better detection)
  const [showContext, setShowContext] = useState(false);
  const [questionContext, setQuestionContext] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');

  // Live session state
  const [phase, setPhase] = useState<string>('initial');
  const [hintCount, setHintCount] = useState(0);
  const [lastMisconception, setLastMisconception] = useState<MisconceptionDetection | undefined>(undefined);
  const [misconceptionHistory, setMisconceptionHistory] = useState<string[]>([]);
  const [directAnswerRevealed, setDirectAnswerRevealed] = useState(false);
  const [allowDirectAnswer, setAllowDirectAnswer] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, loading]);

  // Start a session on mount
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/socratic-mentor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start', userId: user?.id, examGoal: user?.examGoal }),
        });
        if (r.ok) {
          const j: SocraticResponse = await r.json();
          setSessionId(j.sessionId);
          setTurns([{
            id: 'welcome',
            role: 'assistant',
            content: j.reply,
            timestamp: new Date().toISOString(),
            phase: j.phase,
            hintCount: j.hintCount,
          }]);
        }
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async (opts?: { asksForAnswer?: boolean; isCorrect?: boolean }) => {
    if (!sessionId) return;
    const trimmed = input.trim();
    if (!trimmed && !opts?.asksForAnswer) return;

    const userTurn: ChatTurn = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: trimmed || (opts?.asksForAnswer ? '(student asked for direct answer)' : ''),
      timestamp: new Date().toISOString(),
    };
    setTurns(prev => [...prev, userTurn]);
    setInput('');
    setLoading(true);

    try {
      const r = await fetch('/api/socratic-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond',
          sessionId,
          message: trimmed,
          asksForAnswer: opts?.asksForAnswer,
          isCorrect: opts?.isCorrect,
          questionContext: showContext ? questionContext : undefined,
          correctAnswer: showContext ? correctAnswer : undefined,
          subject: showContext ? subject : undefined,
          topic: showContext ? topic : undefined,
          user: user ? { id: user.id, type: user.type, examGoal: user.examGoal } : undefined,
        }),
      });
      if (r.ok) {
        const j: SocraticResponse = await r.json();
        const assistantTurn: ChatTurn = {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: j.reply,
          timestamp: new Date().toISOString(),
          phase: j.phase,
          hintCount: j.hintCount,
          misconception: j.misconception,
          allowDirectAnswer: j.allowDirectAnswer,
          directAnswerRevealed: j.directAnswerRevealed,
          blocked: j.blocked,
        };
        setTurns(prev => [...prev, assistantTurn]);
        setPhase(j.phase);
        setHintCount(j.hintCount);
        setLastMisconception(j.misconception);
        setMisconceptionHistory(j.misconceptionHistory);
        setAllowDirectAnswer(j.allowDirectAnswer);
        setDirectAnswerRevealed(j.directAnswerRevealed);
      }
    } catch (e) {
      setTurns(prev => [...prev, {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Connection error: ${(e as Error).message}. Try again in a moment.`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (!sessionId) return;
    try {
      const r = await fetch('/api/socratic-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', sessionId }),
      });
      if (r.ok) {
        const j: SocraticResponse = await r.json();
        setTurns([{
          id: 'reset',
          role: 'assistant',
          content: j.reply,
          timestamp: new Date().toISOString(),
          phase: j.phase,
          hintCount: j.hintCount,
        }]);
        setPhase(j.phase);
        setHintCount(0);
        setLastMisconception(undefined);
        setMisconceptionHistory([]);
        setAllowDirectAnswer(false);
        setDirectAnswerRevealed(false);
      }
    } catch {
      /* ignore */
    }
  };

  const markCorrect = () => send({ isCorrect: true });
  const askForAnswer = () => send({ asksForAnswer: true });

  const phaseMeta = PHASE_META[phase] ?? PHASE_META.initial;
  const hintProgress = (hintCount / 3) * 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Socratic Mentor v2"
        subtitle="Never gives the final answer directly — diagnoses your misconception type and guides you to discover the solution yourself"
        accent="blue"
        icon={Brain}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat column (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Chat card */}
          <Card className="p-4 border-blue-200 min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                Conversation
                {turns.length > 0 && (
                  <Badge variant="outline" className="bg-stone-50 text-stone-600 text-xs ml-1">
                    {turns.length} turn{turns.length === 1 ? '' : 's'}
                  </Badge>
                )}
              </h3>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[500px]">
              {turns.map(t => <ChatBubble key={t.id} turn={t} />)}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-stone-500 pl-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking Socratically…
                </div>
              )}
            </div>
          </Card>

          {/* Input card */}
          <Card className="p-4 border-blue-200">
            {/* Optional problem context expander */}
            <button
              onClick={() => setShowContext(s => !s)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mb-2"
            >
              {showContext ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showContext ? 'Hide' : 'Show'} problem context (for better diagnosis)
            </button>
            {showContext && (
              <div className="mb-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100 space-y-2">
                <div>
                  <Label className="text-xs text-stone-500">Original question (optional)</Label>
                  <Textarea
                    value={questionContext}
                    onChange={e => setQuestionContext(e.target.value)}
                    placeholder="Paste the problem text — improves misconception detection accuracy"
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-stone-500">Correct answer (optional)</Label>
                    <Input value={correctAnswer} onChange={e => setCorrectAnswer(e.target.value)} placeholder="42" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-stone-500">Subject</Label>
                    <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Physics" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-stone-500">Topic</Label>
                  <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Kinematics" className="mt-1" />
                </div>
              </div>
            )}

            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Share your attempt, or paste a problem you're stuck on…"
              rows={3}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={markCorrect}
                  disabled={loading || !input.trim()}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Mark Correct
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={askForAnswer}
                  disabled={loading}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Just Give Me the Answer
                </Button>
              </div>
              <Button
                size="sm"
                onClick={() => send()}
                disabled={loading || !input.trim()}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Thinking…</>
                ) : (
                  <><Send className="h-4 w-4 mr-1" />Send</>
                )}
              </Button>
            </div>
            <p className="text-[10px] text-stone-400 mt-2">
              ⌘+Enter to send · The mentor uses Socratic mode — it will guide you to the answer rather than handing it over.
            </p>
          </Card>
        </div>

        {/* Side panel (1 col) — live diagnosis */}
        <div className="space-y-4">
          {/* Phase tracker */}
          <Card className="p-4 border-blue-200">
            <h4 className="font-semibold text-stone-800 mb-2 text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Dialogue Phase
            </h4>
            <Badge className={`text-xs ${phaseMeta.color}`}>
              {phaseMeta.icon}
              <span className="ml-1">{phaseMeta.label}</span>
            </Badge>
            <p className="text-xs text-stone-600 mt-2">{phaseMeta.description}</p>

            {/* Hint progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-stone-500 uppercase font-semibold">Hints given</span>
                <span className="font-mono tabular-nums text-stone-700">{hintCount} / 3</span>
              </div>
              <Progress value={hintProgress} className="h-1.5" />
              <p className="text-[10px] text-stone-400 mt-1">
                After 3 hints the mentor may reveal the full worked solution.
              </p>
            </div>
          </Card>

          {/* Latest misconception */}
          {lastMisconception && (
            <Card className="p-4 border-amber-200">
              <h4 className="font-semibold text-stone-800 mb-2 text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-500" />
                Latest Diagnosis
              </h4>
              <Badge variant="outline" className={`text-xs ${MISCONCEPTION_COLORS[lastMisconception.type] ?? MISCONCEPTION_COLORS.unclassified}`}>
                {lastMisconception.type}
                {lastMisconception.subPattern && (
                  <span className="opacity-70 ml-1">· {lastMisconception.subPattern}</span>
                )}
              </Badge>

              {/* Confidence */}
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1">
                  <span>Confidence</span>
                  <span>{Math.round(lastMisconception.confidence * 100)}%</span>
                </div>
                <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${lastMisconception.confidence >= 0.7 ? 'bg-amber-500' : 'bg-amber-300'}`}
                    style={{ width: `${lastMisconception.confidence * 100}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-stone-700 mt-2 leading-relaxed">{lastMisconception.diagnosis}</p>

              {/* Strategy */}
              <div className="mt-3 p-2 rounded bg-blue-50 border border-blue-100">
                <p className="text-[10px] font-semibold text-blue-700 uppercase mb-0.5">Next strategy</p>
                <p className="text-xs text-stone-700">{STRATEGY_LABELS[lastMisconception.suggestedStrategy] ?? lastMisconception.suggestedStrategy}</p>
              </div>

              {/* Evidence */}
              <div className="mt-2">
                <p className="text-[10px] font-semibold text-stone-500 uppercase mb-0.5">Evidence</p>
                <p className="text-xs text-stone-600 italic">{lastMisconception.evidence}</p>
              </div>
            </Card>
          )}

          {/* Misconception history */}
          {misconceptionHistory.length > 0 && (
            <Card className="p-4 border-stone-200">
              <h4 className="font-semibold text-stone-800 mb-2 text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-stone-500" />
                Misconception History
              </h4>
              <div className="space-y-1.5">
                {misconceptionHistory.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-stone-400 w-4">{idx + 1}.</span>
                    <Badge variant="outline" className={`text-xs ${MISCONCEPTION_COLORS[m] ?? MISCONCEPTION_COLORS.unclassified}`}>
                      {m}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-stone-400 mt-2">
                {misconceptionHistory.length} unique misconception{misconceptionHistory.length === 1 ? '' : 's'} surfaced in this session.
              </p>
            </Card>
          )}

          {/* Reveal flag */}
          {(allowDirectAnswer || directAnswerRevealed) && (
            <Card className={`p-4 border-2 ${directAnswerRevealed ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
              <h4 className="font-semibold text-stone-800 mb-1 text-sm flex items-center gap-2">
                {directAnswerRevealed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
                {directAnswerRevealed ? 'Solution Revealed' : 'Direct answer allowed'}
              </h4>
              <p className="text-xs text-stone-700">
                {directAnswerRevealed
                  ? 'The mentor has revealed the full worked solution. Use it to verify your understanding, then try a related problem to confirm transfer.'
                  : 'After 3 hints the mentor may reveal the full solution on the next stuck attempt or if you explicitly ask.'}
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom explainer */}
      <Card className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <div className="flex items-start gap-3">
          <GraduationCap className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-stone-800 mb-1">How Socratic Mentor v2 differs from a regular tutor</h4>
            <ul className="text-sm text-stone-700 space-y-1 list-disc list-inside">
              <li><strong>Never reveals the answer directly.</strong> The mentor guides you to discover it through scaffolded hints.</li>
              <li><strong>Diagnoses your misconception type</strong> — conceptual, procedural, factual, arithmetical, visual-spatial, semantic, overgeneralisation, strategic, or careless — and tailors the next hint to that specific gap.</li>
              <li><strong>State machine tracks the dialogue phase</strong>: initial → probing → diagnosing → scaffolding → confirming. The mentor never piles on multiple hints at once.</li>
              <li><strong>Three-hint rule</strong>: after 3 hints (or an explicit request from you), the mentor may reveal the full worked solution, framed against the misconception that was blocking you.</li>
              <li><strong>Every response passes through EduScope</strong> — off-topic and unsafe requests are blocked, PII is auto-redacted, and every exchange is audited.</li>
            </ul>
            <p className="text-xs text-stone-500 mt-2">
              <Sparkles className="inline h-3 w-3 mr-1" />
              For best results, paste your <em>actual attempt</em> (including how you arrived at your answer) — the diagnosis engine uses keywords in your reasoning to detect the misconception pattern.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat bubble
// ---------------------------------------------------------------------------

function ChatBubble({ turn }: { turn: ChatTurn }) {
  const isUser = turn.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : ''}`}>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {!isUser && turn.phase && (
            <Badge variant="outline" className={`text-xs ${PHASE_META[turn.phase]?.color ?? PHASE_META.initial.color}`}>
              {PHASE_META[turn.phase]?.icon}
              <span className="ml-1">{PHASE_META[turn.phase]?.label ?? turn.phase}</span>
            </Badge>
          )}
          {!isUser && typeof turn.hintCount === 'number' && turn.hintCount > 0 && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              <Lightbulb className="h-3 w-3" />
              <span className="ml-1">Hint #{turn.hintCount}</span>
            </Badge>
          )}
          {!isUser && turn.misconception && turn.misconception.type !== 'unclassified' && (
            <Badge variant="outline" className={`text-xs ${MISCONCEPTION_COLORS[turn.misconception.type] ?? MISCONCEPTION_COLORS.unclassified}`}>
              <Target className="h-3 w-3" />
              <span className="ml-1">{turn.misconception.type}</span>
            </Badge>
          )}
          {!isUser && turn.directAnswerRevealed && (
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="h-3 w-3" />
              <span className="ml-1">Solution revealed</span>
            </Badge>
          )}
          {!isUser && turn.blocked && (
            <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200">
              <AlertTriangle className="h-3 w-3" />
              <span className="ml-1">Blocked</span>
            </Badge>
          )}
          <span className="text-[10px] text-stone-400">
            {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div
          className={`rounded-2xl px-4 py-2 ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-stone-100 text-stone-800 rounded-bl-sm'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{turn.content}</p>
        </div>
      </div>
    </div>
  );
}
