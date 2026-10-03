'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Brain,
  Send,
  Trash2,
  Sparkles,
  Target,
  Clock,
  Heart,
  Lightbulb,
  TrendingUp,
  CalendarDays,
  Zap,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageHeader, SectionTitle } from '@/components/shared';
import { useStore } from '@/lib/store';
import { useSubscriptionStore } from '@/lib/subscription/store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const QUICK_PROMPTS = [
  { label: 'Explain a concept', icon: Lightbulb, prompt: 'Explain Rotational Dynamics & Moment of Inertia with an intuitive derivation.' },
  { label: 'Improve weak topic', icon: Target, prompt: 'My weak topics are Calculus and Coordination Compounds. How should I improve them for maximum accuracy?' },
  { label: 'Score strategy', icon: TrendingUp, prompt: 'What 60-day high-yield strategy should I follow to boost my mock test percentile?' },
  { label: 'Time management', icon: Clock, prompt: 'Help me create a daily time-management plan balancing coaching classes and self-study.' },
  { label: 'Motivate me', icon: Heart, prompt: 'I am feeling burnt out from constant test revisions. Can you give me actionable advice?' },
];

const CAPABILITIES = [
  {
    icon: Target,
    title: 'Concept Mastery',
    description: 'Deep conceptual explanations across Physics, Chemistry, Math, Biology, and Reasoning with LaTeX precision.',
    accent: 'emerald' as const,
  },
  {
    icon: TrendingUp,
    title: 'Score Strategy',
    description: 'Personalised tips on elimination techniques, negative marking avoidance, and high-yield chapter prioritization.',
    accent: 'amber' as const,
  },
  {
    icon: Heart,
    title: 'Stress & Focus Coaching',
    description: 'Feeling anxious or overwhelmed? Your mentor listens, motivates, and helps you build exam-day mental toughness.',
    accent: 'rose' as const,
  },
];

function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Brain className="h-4 w-4 text-white" />
      </div>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export function MentorRoom() {
  const { toast } = useToast();
  const user = useStore((s) => s.user);
  const messages = useStore((s) => s.mentorMessages);
  const addMentorMessage = useStore((s) => s.addMentorMessage);
  const updateMentorMessage = (id: string, content: string) => {};
  const setMentorMessages = useStore((s) => s.setMentorMessages);
  const setView = useStore((s) => s.setView);

  const { canUseDoubt, useDoubtCredit, currentPlan, openCheckout } = useSubscriptionStore();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [telemetry, setTelemetry] = useState<{ provider: string; model: string; latencyMs: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userName = user?.name?.split(' ')[0] || 'aspirant';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (!canUseDoubt()) {
      toast({
        title: 'Daily AI Limit Reached',
        description: 'You have used your 10 free daily inquiries. Upgrade to Prep Pro for unlimited AI mentorship.',
      });
      openCheckout('pro');
      return;
    }

    useDoubtCredit();

    const userMsg = {
      id: uid(),
      role: 'user' as const,
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    addMentorMessage(userMsg);
    setInput('');
    setLoading(true);

    const assistantMsgId = uid();
    let accumulatedText = '';

    // Optimistically add an empty assistant message to stream tokens into
    const initialAssistantMsg = {
      id: assistantMsgId,
      role: 'assistant' as const,
      content: '',
      timestamp: new Date().toISOString(),
    };
    addMentorMessage(initialAssistantMsg);

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const response = await fetch('/api/ai-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          agent: 'mentor',
          profile: {
            examGoal: user?.examGoal || 'JEE Main',
            name: userName,
            type: user?.type || 'school-12',
          },
        }),
      });

      if (!response.body) throw new Error('ReadableStream not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.meta) {
                setTelemetry({
                  provider: data.meta.provider,
                  model: data.meta.model,
                  latencyMs: data.meta.latencyMs,
                });
              }
              if (data.chunk) {
                accumulatedText += data.chunk;
                // Live update the assistant message in store
                const updated = [...useStore.getState().mentorMessages];
                const targetIdx = updated.findIndex((m) => m.id === assistantMsgId);
                if (targetIdx !== -1) {
                  updated[targetIdx] = { ...updated[targetIdx], content: accumulatedText };
                  setMentorMessages(updated);
                }
              }
            } catch {
              // ignore parse errors on partial streams
            }
          }
        }
      }
    } catch {
      const fallbackReply = "Here's a strategic tip: Break down the concept into fundamental axioms, identify known and unknown variables, and solve systematically.";
      const updated = [...useStore.getState().mentorMessages];
      const targetIdx = updated.findIndex((m) => m.id === assistantMsgId);
      if (targetIdx !== -1) {
        updated[targetIdx] = { ...updated[targetIdx], content: fallbackReply };
        setMentorMessages(updated);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleClear() {
    setMentorMessages([]);
    setTelemetry(null);
  }

  const capabilityAccents = {
    emerald: 'from-blue-600 to-indigo-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    amber: 'from-amber-500 to-orange-500 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    rose: 'from-rose-500 to-pink-500 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Brain}
        title="AI Academic Mentor"
        subtitle={`24/7 exam coaching tailored specifically for ${user?.examGoal || 'Competitive Exams'}`}
        accent="emerald"
        right={
          <div className="flex items-center gap-2">
            {telemetry && (
              <Badge variant="outline" className="text-[11px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 py-1">
                <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span>{telemetry.provider.toUpperCase()}</span>
                <span className="text-slate-400">·</span>
                <span className="text-[10px] text-muted-foreground">{telemetry.latencyMs}ms</span>
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleClear} disabled={messages.length === 0}>
              <Trash2 className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>
        }
      />

      {/* Chat Card */}
      <Card className="border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              PrepMentor · Live AI Stream
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                Target: {user?.examGoal || 'JEE Main'}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div
            ref={scrollRef}
            className="h-[60vh] min-h-[440px] overflow-y-auto p-4 sm:p-6 bg-slate-50/40 dark:bg-slate-950/50"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Hi {userName}, I'm your AI Mentor</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md">
                  Ask me about tough concepts, previous year exam patterns, score maximization, or just talk when you need focus and motivation.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-6 w-full max-w-2xl">
                  {QUICK_PROMPTS.map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.label}
                        onClick={() => sendMessage(p.prompt)}
                        className="flex flex-col items-start gap-1 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-slate-850 transition-all text-left shadow-2xs hover:shadow-xs group"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-blue-600 group-hover:scale-110 transition" />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{p.label}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{p.prompt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  if (!m.content && !isUser) return null;

                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'flex items-end gap-2.5',
                        isUser ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      {isUser ? (
                        <Avatar className="h-8 w-8 flex-shrink-0 ring-1 ring-amber-400/50">
                          <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs font-bold">
                            {userName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Brain className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[85%] sm:max-w-[75%] px-4 py-3 text-sm rounded-2xl shadow-2xs whitespace-pre-wrap break-words leading-relaxed',
                          isUser
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-br-xs font-medium'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs'
                        )}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}
                {loading && !messages[messages.length - 1]?.content && <TypingIndicator />}
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4">
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask anything regarding your ${user?.examGoal || 'exam'} syllabus, problems, or study strategy...`}
                className="min-h-[48px] resize-none border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-blue-500"
                rows={1}
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white shadow-sm rounded-xl h-12 w-12 flex-shrink-0"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span>Shift+Enter for new line</span>
              <span>EduScope AI Guardrails Active 🛡️</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capabilities */}
      <div>
        <SectionTitle icon={Sparkles} title="How PrepMentor Accelerates Your Score" />
        <div className="grid sm:grid-cols-3 gap-4">
          {CAPABILITIES.map((c) => {
            const Icon = c.icon;
            const accents = capabilityAccents[c.accent];
            const [grad] = accents.split(' ');
            return (
              <Card key={c.title} className="p-4 border-slate-200 dark:border-slate-800 hover:shadow-md transition bg-white dark:bg-slate-900">
                <div className={cn('h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 text-white shadow-sm', grad)}>
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{c.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{c.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
