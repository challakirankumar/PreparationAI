'use client';

import * as React from 'react';
import {
  Brain,
  Sparkles,
  Target,
  TrendingUp,
  ShieldCheck,
  GraduationCap,
  School,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Zap,
  Clock,
  Award,
  Users,
  BarChart3,
  Cpu,
  FileCheck,
  HelpCircle,
  Mic,
  Search,
  ChevronRight,
  Lock,
  Play,
  Layers,
  Flame,
  Globe,
  Star,
  Activity,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { EXAM_PATTERNS } from '@/lib/exams/patterns';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

const STATS = [
  { label: 'Supported Exams', value: '17+', detail: 'JEE, NEET, UPSC, GATE, CAT, GRE, SAT, IELTS' },
  { label: 'Specialized AI Agents', value: '11', detail: 'Socratic Tutor, Doubt OCR, PYQ Radar & more' },
  { label: 'Proctoring Standards', value: 'NTA UFM', detail: 'Real-time multi-modal integrity evaluation' },
  { label: 'Psychometric Engine', value: '3PL IRT', detail: 'Adaptive item-response latent ability scoring' },
];

const AGENTS = [
  {
    icon: Brain,
    title: 'Socratic Mentor v2',
    subtitle: 'Question-Led Active Learning',
    desc: 'Never gives away direct homework answers. Uses scaffolding prompts to build deep conceptual intuition.',
    badge: 'Pedagogy',
    gradient: 'from-blue-600 to-indigo-700',
  },
  {
    icon: HelpCircle,
    title: 'Visual Doubt Solver',
    subtitle: 'Instant Photo to Solution',
    desc: 'Upload handwritten equations or textbook problems. Delivers step-by-step LaTeX derivations.',
    badge: 'Vision AI',
    gradient: 'from-indigo-600 to-violet-700',
  },
  {
    icon: FileCheck,
    title: 'Handwritten Grader',
    subtitle: 'Multi-Criteria Rubric Scoring',
    desc: 'Evaluates subjective answer sheets on methodology, precision, diagram presentation, and calculation steps.',
    badge: 'Evaluation',
    gradient: 'from-emerald-600 to-teal-700',
  },
  {
    icon: BookOpen,
    title: 'RAG Textbook Tutor',
    subtitle: 'NCERT & Standard Reference Q&A',
    desc: 'Answers grounded strictly in authorized curriculum textbooks to eliminate model hallucinations.',
    badge: 'Grounding',
    gradient: 'from-amber-600 to-orange-700',
  },
  {
    icon: TrendingUp,
    title: 'PYQ Trend Radar',
    subtitle: 'Historical Weightage Forecaster',
    desc: 'Analyzes 10+ years of previous-year papers to forecast high-yield topics and difficulty shifts.',
    badge: 'Analytics',
    gradient: 'from-blue-700 to-cyan-700',
  },
  {
    icon: Mic,
    title: 'Voice Mentor',
    subtitle: 'Real-time Conversational Coaching',
    desc: 'Interactive oral mock interviews and spoken doubt resolution for IELTS, TOEFL, and UPSC personality tests.',
    badge: 'Voice AI',
    gradient: 'from-purple-600 to-pink-700',
  },
];

const FEATURES_HIGHLIGHT = [
  {
    title: 'Adaptive Mock Exam Engine (3PL IRT)',
    desc: 'Unlike static question banks, our engine dynamically adjusts problem difficulty based on your latent ability score (theta), measuring true exam readiness.',
    points: ['Real exam patterns (JEE, NEET, GATE, CAT, GRE, SAT)', 'Cross-attempt signature deduplication', 'Accurate time-per-question telemetry', 'Negative marking and confidence tagging'],
  },
  {
    title: 'NTA UFM-Grounded AI Proctoring',
    desc: 'Built on the National Testing Agency Unfair Means framework. Ensures rigorous exam simulation with constructive integrity coaching reports.',
    points: ['Attention and multi-face detection', 'Audio anomaly and background noise tracking', 'Full-screen and tab-switch lockdown', 'Non-punitive integrity score & review logs'],
  },
  {
    title: 'Metacognitive Error Journal',
    desc: 'Transforms mistakes into mastery by categorizing slips into conceptual gaps, calculation errors, misreadings, or time-pressure guesses.',
    points: ['Automated Ebbinghaus spaced repetition (1d, 3d, 7d, 21d)', 'Curated remediation video lectures per topic', 'Weakness radar heatmap across subjects', 'Pre-exam mistake flashcard drills'],
  },
];

export function LandingPage({ onOpenAuth }: LandingPageProps) {
  const [selectedExamCategory, setSelectedExamCategory] = React.useState<'all' | 'school' | 'ug' | 'grad'>('all');

  const filteredExams = React.useMemo(() => {
    if (selectedExamCategory === 'all') return EXAM_PATTERNS.slice(0, 8);
    return EXAM_PATTERNS.filter((p) => p.category === selectedExamCategory).slice(0, 8);
  }, [selectedExamCategory]);

  return (
    <div className="min-h-screen bg-premium text-slate-900 dark:text-white selection:bg-blue-600 selection:text-white">
      {/* ------------------------------------------------------------ */}
      {/* 1. TOP NAVIGATION BAR                                         */}
      {/* ------------------------------------------------------------ */}
      <header className="sticky top-0 z-50 w-full border-b border-stone-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="PreparationAI" className="h-9 w-9 rounded-xl object-cover shadow-sm ring-1 ring-blue-500/20" />
            <div>
              <span className="font-bold text-lg tracking-tight">
                Preparation<span className="text-blue-600">AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Ed-OS
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#exams" className="hover:text-blue-600 transition-colors">Supported Exams</a>
            <a href="#ai-agents" className="hover:text-blue-600 transition-colors">AI Agents Suite</a>
            <a href="#proctoring" className="hover:text-blue-600 transition-colors">Proctoring</a>
            <a href="#methodology" className="hover:text-blue-600 transition-colors">Methodology</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenAuth('login')}
              className="text-slate-700 dark:text-slate-200 hover:text-blue-600 font-semibold text-xs sm:text-sm"
            >
              Log In
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenAuth('signup')}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20"
            >
              Get Started Free <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------ */}
      {/* 2. HERO SECTION                                               */}
      {/* ------------------------------------------------------------ */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Subtle Ambient Background Glows */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-blue-400/20 via-indigo-300/20 to-transparent blur-3xl rounded-full" />
        <div className="pointer-events-none absolute top-1/2 -right-48 w-96 h-96 bg-blue-300/15 blur-3xl rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm mb-6 animate-fade-in">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Next-Generation AI Educational Operating System
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Master High-Stakes Exams with{' '}
              <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 bg-clip-text text-transparent">
                Adaptive AI Intelligence
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="mt-5 text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Syllabus-weighted mock exams, Socratic conceptual scaffolding, NTA UFM-grounded proctoring, and 11 specialized pedagogical agents built for serious aspirants.
            </p>

            {/* CTA Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => onOpenAuth('signup')}
                className="w-full sm:w-auto h-12 px-8 bg-blue-700 hover:bg-blue-800 text-white font-bold text-base shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
              >
                Start Free Preparation <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => onOpenAuth('login')}
                className="w-full sm:w-auto h-12 px-6 border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 backdrop-blur text-slate-700 dark:text-slate-200 font-semibold text-base hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Sign In to Account
              </Button>
            </div>

            {/* Trust Highlights */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" /> Real Exam Patterns & Marking
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" /> Zero Hallucinated Solutions
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" /> Full Privacy & Security
              </span>
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* Core System Capabilities Matrix                            */}
          {/* ---------------------------------------------------------- */}
          <div className="mt-12 max-w-5xl mx-auto">
            <div className="relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white via-blue-50/20 to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-5 sm:p-7 backdrop-blur-2xl shadow-xl shadow-blue-500/5">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-md">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Built-In Educational Architecture</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Scientific psychometrics, authentic past papers, and proctoring integrity</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 text-xs">
                    ● Real-Time Adaptive Engine
                  </Badge>
                  <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs">
                    17+ Exams Supported
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-5">
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-4 text-left">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">3PL IRT Testing</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Latent ability (θ) estimation adjusting difficulty dynamically.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-4 text-left">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2.5">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">10-Year PYQ Bank</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Past papers with shift tags and frequency counts.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-4 text-left">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">NTA UFM Proctoring</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Anti-cheat browser lock, gaze drift, and webcam telemetry.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-4 text-left">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5">
                    <Brain className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">EduScope Guardrails</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Syllabus-grounded answers with zero generic hallucinations.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-500" /> Multi-tier AI Fallback Cascade: Z-AI, Groq Llama 3.3, and Google Gemini.
                </span>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="text-blue-700 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1 flex-shrink-0"
                >
                  Explore Platform <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* 3. METRICS / STATS BAR                                       */}
      {/* ------------------------------------------------------------ */}
      <section className="border-y border-stone-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-400 mt-0.5">{s.label}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* 4. SUPPORTED EXAMS ECOSYSTEM                                 */}
      {/* ------------------------------------------------------------ */}
      <section id="exams" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 text-xs mb-3">
            Real Exam Patterns
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Calibrated Across Major Competitive Exams
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
            Every mock exam follows the official test pattern, time limits, section weights, and scoring penalties.
          </p>

          <div className="flex justify-center gap-2 mt-6 flex-wrap">
            {(['all', 'school', 'ug', 'grad'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedExamCategory(cat)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
                  selectedExamCategory === cat
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
                )}
              >
                {cat === 'all' ? 'All Exams' : cat === 'school' ? 'Class 11 & 12 / JEE / NEET' : cat === 'ug' ? 'Undergrad / GRE / GMAT' : 'Graduate / GATE / UPSC'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredExams.map((p) => (
            <Card
              key={p.id}
              className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-850/80 backdrop-blur hover:border-blue-400 transition-all hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-[10px] font-semibold border-blue-200 text-blue-700 bg-blue-50">
                    {p.category.toUpperCase()}
                  </Badge>
                  <span className="text-xs font-bold text-slate-500">{p.marking}</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">{p.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{p.fullName}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>{p.totalQuestions} Questions</span>
                  <span>{Math.round(p.durationSec / 60)} Mins</span>
                  <span>{p.totalMarks} Marks</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenAuth('signup')}
                className="mt-3 w-full text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                Start Preparation <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* 5. THE 11 SPECIALIZED AI AGENTS SUITE                        */}
      {/* ------------------------------------------------------------ */}
      <section id="ai-agents" className="py-20 bg-gradient-to-b from-white via-blue-50/30 to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-y border-stone-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 text-xs mb-3">
              Multi-Agent Architecture
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              11 Purpose-Built AI Agents. Zero Generic Wrappers.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
              Each agent operates under strict educational guardrails (EduScope), ensuring grounded pedagogy, step-by-step guidance, and real syllabus alignment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AGENTS.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.title}
                  className="rounded-2xl border border-white/80 dark:border-slate-800 bg-white/70 dark:bg-slate-850/70 p-6 backdrop-blur-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-300 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md', `bg-gradient-to-br ${a.gradient}`)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-semibold border-slate-200 text-slate-600 bg-slate-50">
                      {a.badge}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">{a.subtitle}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{a.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* 6. METHODOLOGY & SCIENTIFIC FOUNDATIONS                      */}
      {/* ------------------------------------------------------------ */}
      <section id="methodology" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 text-xs mb-3">
            Pedagogical Rigour
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Engineered on Proven Cognitive Science
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
            Why PreparationAI produces dramatically superior exam rank outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {FEATURES_HIGHLIGHT.map((f, i) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-850/80 p-6 flex flex-col justify-between"
            >
              <div>
                <div className="h-8 w-8 rounded-lg bg-blue-700 text-white font-bold flex items-center justify-center text-sm mb-4">
                  0{i + 1}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{f.desc}</p>
                <ul className="space-y-2">
                  {f.points.map((pt) => (
                    <li key={pt} className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* 7. NTA UFM PROCTORING HIGHLIGHT                              */}
      {/* ------------------------------------------------------------ */}
      <section id="proctoring" className="py-16 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs mb-3">
                Exam Integrity Standard
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                National Testing Agency (NTA) UFM-Grounded Proctoring
              </h2>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                Experience the authentic pressure of official testing conditions. Our computer-vision and audio pipeline detects tab switches, multi-face presence, gaze drift, and browser tampering, delivering a detailed integrity coaching report.
              </p>
              <div className="mt-6 space-y-2.5">
                {[
                  'Strict compliance with NTA Unfair Means (UFM) taxonomy',
                  'Gaze and face absence telemetry with confidence scoring',
                  'Instant browser lockdown and multi-monitor prevention',
                  'Constructive post-exam integrity audit report for coaching centers',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-slate-200">
                    <ShieldCheck className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => onOpenAuth('signup')}
                className="mt-8 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md"
              >
                Experience Proctored Mock <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Proctoring Telemetry Stream</span>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                  Integrity: 100/100
                </Badge>
              </div>
              <div className="space-y-2.5 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 flex items-center justify-between">
                  <span>[00:14:22] Biometric Face Lock</span>
                  <span className="text-[10px] text-slate-500">Confidence 99.4%</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-blue-400 flex items-center justify-between">
                  <span>[00:42:10] Gaze Stability Check</span>
                  <span className="text-[10px] text-slate-500">Nominal Attention</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 flex items-center justify-between">
                  <span>[01:15:00] Audio Spectrum Guard</span>
                  <span className="text-[10px] text-slate-500">0 Anomalies</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between">
                  <span>[02:00:00] Final Verdict Generated</span>
                  <span className="text-[10px] font-bold text-emerald-400">CLEAN SUBMISSION</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* 8. FINAL CALL TO ACTION                                      */}
      {/* ------------------------------------------------------------ */}
      <section className="py-20 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Ready to Supercharge Your Exam Rank?
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Join thousands of aspirants preparing smarter with adaptive psychometrics, Socratic AI, and real exam pattern engines.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => onOpenAuth('signup')}
              className="w-full sm:w-auto h-12 px-8 bg-blue-700 hover:bg-blue-800 text-white font-bold text-base shadow-lg shadow-blue-500/25"
            >
              Create Free Account <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto h-12 px-6 text-slate-700 dark:text-slate-200 font-semibold"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* 9. FOOTER                                                    */}
      {/* ------------------------------------------------------------ */}
      <footer className="border-t border-stone-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 py-10 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 dark:text-white">Preparation<span className="text-blue-600">AI</span></span>
            <span>• Educational Operating System</span>
          </div>

          <div className="text-center sm:text-right">
            <p className="font-medium text-slate-700 dark:text-slate-300">Crafted by Kiran Challa and Team</p>
            <p className="text-[11px] text-slate-400 mt-0.5">© {new Date().getFullYear()} PreparationAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
