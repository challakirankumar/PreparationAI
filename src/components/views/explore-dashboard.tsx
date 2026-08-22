'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import type { View } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PremiumHeader } from '@/components/shared/premium-header';
import {
  Briefcase, GraduationCap, Award, ArrowRight, Compass,
} from 'lucide-react';

interface ExploreCard {
  id: View;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  features: string[];
}

const EXPLORE_CARDS: ExploreCard[] = [
  {
    id: 'career',
    title: 'Career Guide',
    subtitle: 'Find the path that fits you',
    description:
      'Browse 60+ career paths aligned to your exam stream. See real demand forecasts, average salary bands, skill requirements, work-life balance ratings, and career progression ladders — written by working professionals, not scraped from SEO blogs.',
    icon: Briefcase,
    accent: 'from-blue-500 to-indigo-600',
    features: [
      'Demand forecast & industry growth',
      'Skill requirements with priority',
      'Top recruiters in the field',
      'Work-life balance and progression',
    ],
  },
  {
    id: 'university',
    title: 'Universities',
    subtitle: 'Compare 2,400+ colleges',
    description:
      'Search and shortlist universities across 40 countries. Filter by ranking, acceptance rate, tuition fees, scholarships, placement record, and visa friendliness. Side-by-side comparison view helps you weigh reach, match, and safety schools.',
    icon: GraduationCap,
    accent: 'from-emerald-500 to-blue-600',
    features: [
      '40+ countries covered',
      'Ranking, fees, acceptance rate filter',
      'Scholarship availability per college',
      'Visa & employment rate details',
    ],
  },
  {
    id: 'scholarship',
    title: 'Scholarships',
    subtitle: 'Fund your education',
    description:
      'A curated index of 800+ merit, need, and identity-based scholarships. Each entry shows eligibility, deadline, amount, application link, and a one-tap save-to-planner action so you never miss a deadline.',
    icon: Award,
    accent: 'from-amber-500 to-blue-600',
    features: [
      '800+ verified scholarships',
      'Eligibility-aware filtering',
      'Deadline sync with Planner',
      'Direct application links',
    ],
  },
  // Note: Settings is now its own top-level sidebar item — no longer part of Explore.
];

export function ExploreDashboard() {
  const setView = useStore((s) => s.setView);

  return (
    <div className="space-y-6">
      {/* Premium gradient header */}
      <PremiumHeader
        title="Explore Hub"
        subtitle="Career paths, universities, scholarships, and account settings — everything you need to turn an exam score into a long-term academic trajectory. Tap any card to dive in."
        icon={Compass}
        variant="sapphire"
      />

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EXPLORE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => setView(card.id)}
              className="group text-left focus:outline-none"
            >
              <Card className="h-full border-stone-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/60 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn(
                      'h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md flex-shrink-0',
                      card.accent
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-stone-900 leading-tight">{card.title}</h3>
                      <p className="text-[11px] text-muted-foreground">{card.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed mb-3">
                    {card.description}
                  </p>
                  <ul className="space-y-1.5 flex-1">
                    {card.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-[11px] text-stone-600">
                        <span className="h-1 w-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 group-hover:gap-2 transition-all">
                    Open module
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
