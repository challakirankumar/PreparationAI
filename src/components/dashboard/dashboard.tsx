'use client';

import * as React from 'react';
import {
  Sparkles,
  Star,
  Target,
  Trophy,
  Award,
  Gauge,
  Activity,
  FileText,
  BarChart3,
  MessageSquare,
  UserCog,
  Radar,
  Briefcase,
  GraduationCap,
  CalendarDays,
  HeartPulse,
  ChevronRight,
  PlayCircle,
  Lightbulb,
  Settings2,
  TrendingUp,
  Flame,
  Brain,
  ArrowUpRight,
  BookOpen,
  Layers,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useStore, userExamGoals } from '@/lib/store';
import { getPattern } from '@/lib/exams/patterns';
import { StatCard } from '@/components/shared';
import { FeatureCard, type FeatureAccent } from './feature-card';
import { ExamCountdownCard } from './exam-countdown-card';
import { ManageExamsDialog } from './manage-exams-dialog';
import { DailyPlanModal } from './daily-plan-modal';
import { LiveCountdownCard, WeakAreaTriggerCard, ExamNewsFeed } from './live-dashboard-cards';
import { PremiumHeader } from '@/components/shared/premium-header';
import type { View } from '@/lib/types';

interface FeatureDef {
  view: View;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  accent: FeatureAccent;
  badge?: string;
  detailTitle?: string;
  detailDescription?: string;
  detailBody?: React.ReactNode;
  ctaLabel?: string;
}

const FEATURES: FeatureDef[] = [
  {
    view: 'taxonomy',
    icon: Layers,
    title: 'Master Exam Taxonomy (5-Tier)',
    subtitle: 'Exam Family → Exam → Stream/Paper → Subject → Topic → Subtopic hierarchy.',
    accent: 'teal',
    badge: '30 Domains',
    detailTitle: 'Master Exam Taxonomy (5-Tier)',
    detailDescription: 'Comprehensive hierarchical syllabus mapping across 30 master exam families with many-to-many question bank reusability.',
    detailBody: (
      <ul className="space-y-1.5">
        <li>• 30 GATE Papers (CS, DA, EC, EE, ME, CE, CH, etc.) mapped down to subtopics</li>
        <li>• UPSC (Prelims GS/CSAT, Mains GS 1-4 & Optionals), SSC, Banking, 28 State PSCs</li>
        <li>• Dedicated CS / IT / AI candidate opportunity hub connecting 20+ examinations</li>
        <li>• Universal cross-exam question bank reusability (one question shared across exams)</li>
      </ul>
    ),
    ctaLabel: 'Explore 5-Tier Taxonomy',
  },
  {
    view: 'pyq-archive',
    icon: BookOpen,
    title: '10-Year PYQ Multi-Volume Archive',
    subtitle: '2015–2025 past papers with Volume 1 to Volume N, step solutions & AI hints.',
    accent: 'purple',
    badge: '10-Year Hub',
    detailTitle: '10-Year PYQ Multi-Volume Archive',
    detailDescription: 'Official authentic past 10 years question papers across UPSC, GATE, JEE, NEET, SSC, and State PSCs with Volume 1..N separation.',
    detailBody: (
      <ul className="space-y-1.5">
        <li>• Complete 10-year (2015–2025) question archive with multi-volume collections</li>
        <li>• Practice Mode with instant answer checking and Socratic step-by-step guidance</li>
        <li>• Timed Volume Simulations with realistic marking rules and scorecards</li>
        <li>• SuperAdmin dynamic ingestion for creating Volume N and custom questions</li>
      </ul>
    ),
    ctaLabel: 'Open 10Y PYQ Library',
  },
  {
    view: 'mock-exam',
    icon: FileText,
    title: 'Mock Exam Engine',
    subtitle: 'Real-pattern papers, AI-generated, with cross-attempt deduplication.',
    accent: 'emerald',
    badge: 'AI',
    detailTitle: 'Mock Exam Engine',
    detailDescription: 'Take full-length, syllabus-weighted mock exams in real exam patterns.',
    detailBody: (
      <ul className="space-y-1.5">
        <li>• 17 exam patterns supported (JEE, NEET, GRE, GMAT, GATE, UPSC, SAT, IELTS, TOEFL and more)</li>
        <li>• Cross-attempt question signature dedup so you never see the same question twice</li>
        <li>• Subject-wise timing, confidence tagging, and negative marking</li>
        <li>• Auto-evaluation with percentile + rank estimation</li>
      </ul>
    ),
    ctaLabel: 'Start a mock',
  },
  {
    view: 'analytics',
    icon: BarChart3,
    title: 'Performance Analytics',
    subtitle: 'Subject-wise breakdown, accuracy trends, and behaviour insights.',
    accent: 'teal',
    detailTitle: 'Performance Analytics',
    detailDescription: 'Deep insights into your attempt history.',
    detailBody: (
      <ul className="space-y-1.5">
        <li>• Subject-wise score, accuracy, and time distribution</li>
        <li>• Behaviour analysis: pace trend, rapid guesses, answer changes</li>
        <li>• Per-question time spent with confidence levels</li>
        <li>• Compare attempts side-by-side</li>
      </ul>
    ),
  },
  {
    view: 'mentor',
    icon: MessageSquare,
    title: 'AI Mentor Room',
    subtitle: '24/7 chat with GLM-4.6 — concepts, strategy, motivation.',
    accent: 'emerald',
    badge: 'Live',
    detailTitle: 'AI Mentor Room',
    detailDescription: 'Chat with your personal academic mentor anytime.',
    detailBody: (
      <ul className="space-y-1.5">
        <li>• Ask concept doubts, get step-by-step explanations</li>
        <li>• Personalised score-improvement strategy</li>
        <li>• Stress & burnout support</li>
        <li>• Time-management & study planning advice</li>
      </ul>
    ),
  },
  {
    view: 'digital-twin',
    icon: UserCog,
    title: 'Digital Twin',
    subtitle: 'A virtual clone of you that simulates attempts and predicts outcomes.',
    accent: 'teal',
    badge: 'New',
    detailTitle: 'Digital Twin',
    detailDescription: 'Your AI replica for safe experiments.',
    detailBody: (
      <ul className="space-y-1.5">
        <li>• Builds a behavioural model from your past attempts</li>
        <li>• Simulates how you would perform under different strategies</li>
        <li>• Identifies optimal attempt ordering & time allocation</li>
      </ul>
    ),
  },
  {
    view: 'success-simulator',
    icon: Sparkles,
    title: 'Success Simulator',
    subtitle: 'What-if scenarios: if you score X, what ranks & colleges open up?',
    accent: 'amber',
    detailTitle: 'Success Simulator',
    detailDescription: 'Map scores to outcomes.',
    detailBody: (
      <ul className="space-y-1.5">
        <li>• Score → Percentile → Rank → College chain</li>
        <li>• Compare target vs. projected scores</li>
        <li>• Identify the gap you need to close</li>
      </ul>
    ),
  },
  {
    view: 'readiness',
    icon: Gauge,
    title: 'Readiness Index',
    subtitle: 'A single 0-100 score combining accuracy, coverage & consistency.',
    accent: 'emerald',
    detailTitle: 'Readiness Index',
    detailDescription: 'Your exam readiness in one number.',
    detailBody: (
      <ul className="space-y-1.5">
        <li>• Composite of accuracy, syllabus coverage, and consistency</li>
        <li>• Tracks progress week-over-week</li>
        <li>• Tells you exactly when you are exam-ready</li>
      </ul>
    ),
  },
  {
    view: 'rank-predictor',
    icon: Trophy,
    title: 'Rank Predictor',
    subtitle: 'Estimate your rank from the latest mock score & percentile.',
    accent: 'amber',
    detailTitle: 'Rank Predictor',
    detailDescription: 'Forecast your all-India rank.',
    detailBody: (
      <ul className="space-y-1.5">
        <li>• Uses historical normalised distributions</li>
        <li>• Confidence bands on predictions</li>
        <li>• Compares across attempts</li>
      </ul>
    ),
  },
  {
    view: 'university-predictor',
    icon: GraduationCap,
    title: 'University Predictor',
    subtitle: 'See which colleges your projected rank makes you eligible for.',
    accent: 'teal',
    detailTitle: 'University Predictor',
    detailDescription: 'College shortlist from your rank.',
    detailBody: (
      <ul className="space-y-1.5">
        <li>• Match your rank to college cutoffs</li>
        <li>• Filter by location, fees, branch</li>
        <li>• Save favourites for later</li>
      </ul>
    ),
  },
  {
    view: 'weakness-radar',
    icon: Radar,
    title: 'Weakness Radar',
    subtitle: 'Detect weak topics and fix them with curated YouTube lessons.',
    accent: 'rose',
    detailTitle: 'Weakness Radar',
    detailDescription: 'Find & fix weak topics.',
    detailBody: (
      <ul className="space-y-1.5">
        <li>• Topic-level accuracy heatmaps</li>
        <li>• Curated YouTube video recommendations per weak topic</li>
        <li>• Track fix progress over time</li>
      </ul>
    ),
  },
  {
    view: 'career',
    icon: Briefcase,
    title: 'Career Guide',
    subtitle: 'Explore careers — salaries, demand, future scope, recruiters.',
    accent: 'amber',
    detailTitle: 'Career Guide',
    detailDescription: 'Plan beyond the exam.',
    detailBody: (
      <ul className="space-y-1.5">
        <li>• 20+ career paths with deep profiles</li>
        <li>• Salary, demand forecast, work-life balance</li>
        <li>• Skill requirements & top recruiters</li>
      </ul>
    ),
  },
  {
    view: 'university',
    icon: GraduationCap,
    title: 'University Finder',
    subtitle: 'Search 30+ global universities by ranking, fees, country.',
    accent: 'emerald',
    detailTitle: 'University Finder',
    detailDescription: 'Discover universities worldwide.',
    detailBody: (
      <ul className="space-y-1.5">
        <li>• Filter by country, ranking, fees, acceptance rate</li>
        <li>• Scholarships & accommodation details</li>
        <li>• Visa & employment rate insights</li>
      </ul>
    ),
  },
  {
    view: 'scholarship',
    icon: Award,
    title: 'Scholarship Engine',
    subtitle: 'Match scholarships to your profile, country, and level.',
    accent: 'amber',
    detailTitle: 'Scholarship Engine',
    detailDescription: 'Fund your education.',
    detailBody: (
      <ul className="space-y-1.5">
        <li>• Curated scholarships across 10+ countries</li>
        <li>• Filter by eligibility, deadline, level</li>
        <li>• Direct application links</li>
      </ul>
    ),
  },
  {
    view: 'planner',
    icon: CalendarDays,
    title: 'Study Planner',
    subtitle: 'Daily, weekly, monthly & revision plans — AI-personalised.',
    accent: 'teal',
    detailTitle: 'Study Planner',
    detailDescription: 'Structured study schedules.',
    detailBody: (
      <ul className="space-y-1.5">
        <li>• Daily / weekly / monthly / revision / mock plan templates</li>
        <li>• AI-generated plans tuned to your weak topics</li>
        <li>• Drag-and-drop time blocks</li>
      </ul>
    ),
  },
  {
    view: 'counsellor',
    icon: HeartPulse,
    title: 'Wellness Counsellor',
    subtitle: 'Stress, sleep, focus, motivation — your mental wellness ally.',
    accent: 'rose',
    detailTitle: 'Wellness Counsellor',
    detailDescription: 'Stay mentally sharp.',
    detailBody: (
      <ul className="space-y-1.5">
        <li>• Daily mood & energy check-ins</li>
        <li>• Burnout risk detection from behaviour patterns</li>
        <li>• Guided breathing & focus exercises</li>
      </ul>
    ),
  },
  {
    view: 'analytics',
    icon: Activity,
    title: 'Behaviour Insights',
    subtitle: 'Pace, idle time, guess patterns — your hidden exam habits.',
    accent: 'rose',
    detailTitle: 'Behaviour Insights',
    detailDescription: 'See how you actually attempt exams.',
    detailBody: (
      <ul className="space-y-1.5">
        <li>• Speed progression across the paper</li>
        <li>• Idle pauses and rapid-guess detection</li>
        <li>• Difficulty-vs-time gap analysis</li>
      </ul>
    ),
  },
];

function daysToExam(examDate?: string): number {
  if (!examDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(examDate);
  target.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86400000));
}

function ReadinessRing({ value }: { value: number }) {
  const radius = 32;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;
  const color = value >= 75 ? '#10b981' : value >= 50 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="relative h-20 w-20 flex-shrink-0">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="60%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r={radius} stroke="#f5f5f4" strokeWidth="6" fill="none" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke="url(#ring-grad)"
          strokeWidth="6"
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums text-stone-900">{value}</span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">ready</span>
      </div>
      <span
        className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

function ScoreTrendCard({ scores }: { scores: { label: string; value: number }[] }) {
  if (scores.length === 0) {
    return (
      <Card className="p-5 border-stone-200 h-full">
        <p className="text-sm font-semibold text-stone-900 mb-2 flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-blue-600" /> Score trend
        </p>
        <p className="text-xs text-muted-foreground">No attempts yet. Take your first mock to see your trend.</p>
      </Card>
    );
  }

  const max = Math.max(...scores.map((s) => s.value), 1);
  const min = Math.min(...scores.map((s) => s.value), 0);
  const range = Math.max(max - min, 1);
  const w = 240;
  const h = 80;
  const pts = scores.map((s, i) => {
    const x = (i / Math.max(scores.length - 1, 1)) * w;
    const y = h - ((s.value - min) / range) * h;
    return { x, y, ...s };
  });
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${path} L${w},${h} L0,${h} Z`;

  return (
    <Card className="p-5 border-stone-200 h-full">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-stone-900 flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-blue-600" /> Score trend
        </p>
        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
          <ArrowUpRight className="h-3 w-3" /> {scores.length} attempts
        </Badge>
      </div>
      <div className="flex items-end gap-1">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
          <defs>
            <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#area-grad)" />
          <path d={path} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#047857" />
          ))}
        </svg>
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        {scores.map((s, i) => (
          <span key={i}>{s.label}</span>
        ))}
      </div>
    </Card>
  );
}

export function Dashboard() {
  const user = useStore((s) => s.user);
  const attempts = useStore((s) => s.attempts);
  const setView = useStore((s) => s.setView);
  const [manageOpen, setManageOpen] = React.useState(false);

  if (!user) return null;

  const goals = userExamGoals(user);
  const primaryPattern = getPattern(user.examGoal);
  const days = daysToExam(user.examDate);

  // Stats
  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((a, t) => a + (t.score / Math.max(t.totalMarks, 1)) * 100, 0) / attempts.length)
      : 0;
  const mocksTaken = attempts.length;
  const bestPercentile = attempts.length > 0 ? Math.max(...attempts.map((t) => t.percentile)) : 0;
  const avgAccuracy =
    attempts.length > 0
      ? Math.round(attempts.reduce((a, t) => a + t.accuracy, 0) / attempts.length)
      : 0;
  const readiness = Math.min(100, Math.round((avgScore + avgAccuracy) / 2));

  // Latest weak topics
  const latest = attempts[0];
  const weakTopics = latest?.weakTopics?.slice(0, 4) ?? [];

  const scorePoints = attempts
    .slice(0, 6)
    .reverse()
    .map((a, i) => ({ label: `A${i + 1}`, value: Math.round((a.score / Math.max(a.totalMarks, 1)) * 100) }));

  return (
    <div className="space-y-6">
      {/* Premium gradient header — clean, no buttons, no subtitle.
          The live clock widget only appears here on the dashboard. */}
      <PremiumHeader
        title={`Welcome back, ${user.name.split(' ')[0]}`}
        icon={Sparkles}
        showClock
      />

      {/* Live countdown + weak areas + news */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <LiveCountdownCard
          examId={user.examGoal}
          examDate={user.examDate}
          examName={getPattern(user.examGoal)?.name ?? 'Target Exam'}
        />
        <WeakAreaTriggerCard attempts={attempts} />
        <ExamNewsFeed
          examId={user.examGoal}
          examName={getPattern(user.examGoal)?.name ?? 'exam'}
          country={user.country}
        />
      </div>

      {/* Exam countdown card (kept; ScoreTrendCard removed per user request) */}
      <ExamCountdownCard focusArea={weakTopics[0]} streak={mocksTaken > 0 ? Math.min(mocksTaken, 7) : 0} />

      {/* Dialogs */}
      <ManageExamsDialog open={manageOpen} onOpenChange={setManageOpen} />
      <DailyPlanModal />
    </div>
  );
}
