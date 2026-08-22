'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import type { View } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PremiumHeader } from '@/components/shared/premium-header';
import {
  MessageSquare, Brain, Mic, HelpCircle, BookOpen, TrendingUp, UserCog,
  Sparkles, Gauge, Trophy, School, Radar, ArrowRight, Sparkle,
} from 'lucide-react';

interface AgentCard {
  id: View;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  badge?: string;
}

const AGENT_CARDS: AgentCard[] = [
  {
    id: 'mentor',
    title: 'AI Mentor',
    subtitle: 'Personalized guidance chat',
    description:
      'Your always-on study companion. Ask any conceptual doubt, request a study plan adjustment, or get motivation when motivation is low. Conversations are saved to your profile so the mentor remembers your context across sessions.',
    icon: MessageSquare,
    accent: 'from-blue-500 to-blue-600',
    badge: 'Core',
  },
  {
    id: 'socratic-mentor',
    title: 'Socratic Mentor v2',
    subtitle: 'Question-led learning',
    description:
      'Instead of giving you the answer, this mentor asks you the next right question. Built on the Socratic method, it surfaces your misconceptions and forces you to reason through the problem yourself before revealing the explanation.',
    icon: Brain,
    accent: 'from-indigo-500 to-blue-600',
    badge: 'v2',
  },
  {
    id: 'voice-mentor',
    title: 'Voice Mentor',
    subtitle: 'Speak, listen, learn',
    description:
      'Talk to your mentor naturally using the Web Speech API. Hands-free revision while walking, cooking, or commuting. Your voice is processed in-browser; only the transcript is sent to the AI for a spoken response.',
    icon: Mic,
    accent: 'from-sky-500 to-blue-600',
    badge: 'Beta',
  },
  {
    id: 'doubt-solver',
    title: 'Doubt Solver',
    subtitle: 'Photo → worked solution',
    description:
      'Snap a photo of any doubt — handwritten, printed, or screen-captured — and the AI returns a step-by-step worked solution with the underlying concept, related formulas, and two practice problems to lock in the learning.',
    icon: HelpCircle,
    accent: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'rag-tutor',
    title: 'RAG Tutor',
    subtitle: 'Grounded textbook Q&A',
    description:
      'Retrieval-Augmented Generation over your uploaded textbooks and notes. Every answer cites the exact page and paragraph it came from, so you can verify each claim against the source rather than trusting the model blindly.',
    icon: BookOpen,
    accent: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'pyq-trends',
    title: 'PYQ Trends',
    subtitle: 'Previous-year question radar',
    description:
      'Analyzes the last 10 years of your exam\'s previous-year questions (PYQs) to surface topic frequency, difficulty drift, and the recurring question archetypes you are most likely to face in the upcoming attempt.',
    icon: TrendingUp,
    accent: 'from-emerald-500 to-blue-600',
  },
  {
    id: 'digital-twin',
    title: 'Digital Twin',
    subtitle: 'Simulate-you simulator',
    description:
      'A behavioral clone of you, trained on every attempt you have taken. Use it to forecast how you would perform on a different exam pattern, with more time, or after a focused revision sprint — without burning a real mock.',
    icon: UserCog,
    accent: 'from-violet-500 to-blue-600',
  },
  {
    id: 'success-simulator',
    title: 'Success Simulator',
    subtitle: 'What-if scenario planner',
    description:
      'Slide variables like "if I improve Physics accuracy by 12%" or "if I attempt 5 more questions" and watch projected rank, percentile, and readiness shift in real time. Helps you find the highest-leverage focus area before your next mock.',
    icon: Sparkles,
    accent: 'from-amber-500 to-blue-600',
  },
  {
    id: 'readiness',
    title: 'Readiness Index',
    subtitle: 'Are you exam-ready?',
    description:
      'A single 0–1000 score that fuses accuracy, speed, consistency, coverage, and recency. Updated after every mock and every study session. The closer to 1000, the closer you are to being ready to walk into the real exam hall.',
    icon: Gauge,
    accent: 'from-rose-500 to-blue-600',
  },
  {
    id: 'rank-predictor',
    title: 'Rank Predictor',
    subtitle: 'Forecast your AIR',
    description:
      'Uses your last 5 attempts, normalizes against historical cutoff curves for your exam, and projects your All-India Rank band with a confidence interval — not a single misleading number.',
    icon: Trophy,
    accent: 'from-orange-500 to-blue-600',
  },
  {
    id: 'university-predictor',
    title: 'University Predictor',
    subtitle: 'Where will you get in?',
    description:
      'Cross-references your predicted rank with closing-rank cutoffs of 2,400+ colleges across India and abroad. Filter by branch, location, fee band, and placement record. Shortlist the realistic reach, match, and safety options.',
    icon: School,
    accent: 'from-teal-500 to-blue-600',
  },
  {
    id: 'weakness-radar',
    title: 'Weakness Radar',
    subtitle: 'See your blind spots',
    description:
      'A 360° radar across subjects, topics, difficulty bands, question types, time pressure, and silly-mistake patterns. Surfaces not just what you got wrong, but the deeper cognitive pattern behind why you keep getting it wrong.',
    icon: Radar,
    accent: 'from-fuchsia-500 to-blue-600',
  },
];

export function AiAgentsDashboard() {
  const setView = useStore((s) => s.setView);
  const attempts = useStore((s) => s.attempts);

  return (
    <div className="space-y-6">
      {/* Premium gradient header */}
      <PremiumHeader
        title="AI Agents Hub"
        subtitle="Twelve specialised AI agents — conceptual mastery, behavior simulation, rank forecasting, weakness diagnosis. Tap any card to launch."
        icon={Sparkles}
        variant="midnight"
        actions={
          attempts.length > 0 ? (
            <div className="hidden sm:block rounded-xl bg-white/15 backdrop-blur px-4 py-2.5 ring-1 ring-white/20">
              <p className="text-[10px] uppercase tracking-wider text-blue-50 font-semibold">Mocks taken</p>
              <p className="text-2xl font-bold leading-tight text-white">{attempts.length}</p>
            </div>
          ) : null
        }
      />

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENT_CARDS.map((agent) => {
          const Icon = agent.icon;
          return (
            <button
              key={agent.id}
              onClick={() => setView(agent.id)}
              className="group text-left focus:outline-none"
            >
              <Card className="h-full border-stone-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/60 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={cn(
                      'h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md flex-shrink-0',
                      agent.accent
                    )}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    {agent.badge && (
                      <span className="text-[9px] uppercase tracking-wider font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                        {agent.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-stone-900 leading-tight">{agent.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">{agent.subtitle}</p>
                  <p className="text-xs text-stone-600 leading-relaxed flex-1">
                    {agent.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 group-hover:gap-2 transition-all">
                    Launch agent
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
