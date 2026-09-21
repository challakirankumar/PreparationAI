'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { AppShell } from '@/components/app-shell';
import { AuthScreen } from '@/components/auth/auth-screen';
import { LandingPage } from '@/components/landing/landing-page';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { DailyPlanModal } from '@/components/dashboard/daily-plan-modal';
import { Dashboard } from '@/components/dashboard/dashboard';
import { MockExamEngine } from '@/components/mock-exam/mock-exam-engine';
import { ExamRunner } from '@/components/mock-exam/exam-runner';
import { PerformanceAnalytics } from '@/components/views/performance-analytics';
import { MentorRoom } from '@/components/views/mentor-room';
import { CareerGuide } from '@/components/views/career-guide';
import { UniversityFinder } from '@/components/views/university-finder';
import { ScholarshipEngine } from '@/components/views/scholarship-engine';
import { StudyPlanner } from '@/components/views/study-planner';
import { WellnessCounsellor } from '@/components/views/wellness-counsellor';
import { UniversityPredictor } from '@/components/views/university-predictor';
import { SettingsView } from '@/components/views/settings';
import { StudyMaterialView } from '@/components/views/study-material';
import { GuardrailDashboardView } from '@/components/views/guardrail-dashboard';
import { InstitutionDashboardView } from '@/components/views/institution-dashboard';
import { DoubtSolverView } from '@/components/views/doubt-solver';
import { PyqTrendPredictorView } from '@/components/views/pyq-trend-predictor';
import { SocraticMentorView } from '@/components/views/socratic-mentor';
import { HandwrittenGraderView } from '@/components/views/handwritten-grader';
import { BattleArenaView } from '@/components/views/battle-arena';
import { ErrorJournalView } from '@/components/views/error-journal';
import { ParentDashboardView } from '@/components/views/parent-dashboard';
import { NudgeBotView } from '@/components/views/nudge-bot';
import { LeagueSystemView } from '@/components/views/league-system';
import { VoiceMentorView } from '@/components/views/voice-mentor';
import { RagTutorView } from '@/components/views/rag-tutor';
import { DigitalTwin, ExamReadiness, RankPredictor, SuccessSimulator } from '@/components/views/ai-features';
import { AiAgentsDashboard } from '@/components/views/ai-agents-dashboard';
import { ExploreDashboard } from '@/components/views/explore-dashboard';
import { CodingArenaView } from '@/components/views/coding-arena';
import PYQArchiveView from '@/components/views/pyq-archive';
import SuperadminPortalView from '@/components/views/superadmin-portal';
import TaxonomyExplorerView from '@/components/views/taxonomy-explorer';
import { SubModuleHeader } from '@/components/shared/sub-module-header';
import type { View } from '@/lib/types';
import {
  MessageSquare, Brain, Mic, HelpCircle, BookOpen, TrendingUp, UserCog,
  Sparkles, Gauge, Trophy, School, Radar,
  Briefcase, GraduationCap, Award,
} from 'lucide-react';

function ViewRouter({ view }: { view: View }) {
  switch (view) {
    case 'dashboard':
      return <Dashboard />;
    case 'taxonomy':
      return <TaxonomyExplorerView />;
    case 'pyq-archive':
      return <PYQArchiveView />;
    case 'superadmin':
      return <SuperadminPortalView />;
    case 'mock-exam':
      return <ExamRunnerOrEngine />;
    case 'coding-arena':
      return <CodingArenaView />;
    case 'analytics':
      return <PerformanceAnalytics />;
    case 'ai-agents':
      return <AiAgentsDashboard />;
    case 'explore':
      return <ExploreDashboard />;
    case 'mentor':
      return (
        <SubModuleHeader parent="ai-agents" title="AI Mentor" subtitle="Personalized guidance chat" icon={MessageSquare}>
          <MentorRoom />
        </SubModuleHeader>
      );
    case 'socratic-mentor':
      return (
        <SubModuleHeader parent="ai-agents" title="Socratic Mentor v2" subtitle="Question-led learning" icon={Brain}>
          <SocraticMentorView />
        </SubModuleHeader>
      );
    case 'voice-mentor':
      return (
        <SubModuleHeader parent="ai-agents" title="Voice Mentor" subtitle="Speak, listen, learn" icon={Mic}>
          <VoiceMentorView />
        </SubModuleHeader>
      );
    case 'doubt-solver':
      return (
        <SubModuleHeader parent="ai-agents" title="Doubt Solver" subtitle="Photo to worked solution" icon={HelpCircle}>
          <DoubtSolverView />
        </SubModuleHeader>
      );
    case 'rag-tutor':
      return (
        <SubModuleHeader parent="ai-agents" title="RAG Tutor" subtitle="Grounded textbook Q&A" icon={BookOpen}>
          <RagTutorView />
        </SubModuleHeader>
      );
    case 'pyq-trends':
      return (
        <SubModuleHeader parent="ai-agents" title="PYQ Trends" subtitle="Previous-year question radar" icon={TrendingUp}>
          <PyqTrendPredictorView />
        </SubModuleHeader>
      );
    case 'digital-twin':
      return (
        <SubModuleHeader parent="ai-agents" title="Digital Twin" subtitle="Simulate-you simulator" icon={UserCog}>
          <DigitalTwin />
        </SubModuleHeader>
      );
    case 'success-simulator':
      return (
        <SubModuleHeader parent="ai-agents" title="Success Simulator" subtitle="What-if scenario planner" icon={Sparkles}>
          <SuccessSimulator />
        </SubModuleHeader>
      );
    case 'readiness':
      return (
        <SubModuleHeader parent="ai-agents" title="Readiness Index" subtitle="Are you exam-ready?" icon={Gauge}>
          <ExamReadiness />
        </SubModuleHeader>
      );
    case 'rank-predictor':
      return (
        <SubModuleHeader parent="ai-agents" title="Rank Predictor" subtitle="Forecast your AIR" icon={Trophy}>
          <RankPredictor />
        </SubModuleHeader>
      );
    case 'university-predictor':
      return (
        <SubModuleHeader parent="ai-agents" title="University Predictor" subtitle="Where will you get in?" icon={School}>
          <UniversityPredictor />
        </SubModuleHeader>
      );
    case 'weakness-radar':
      return (
        <SubModuleHeader parent="ai-agents" title="Weakness Radar" subtitle="See your blind spots" icon={Radar}>
          <PerformanceAnalytics />
        </SubModuleHeader>
      );

    // Explore children
    case 'career':
      return (
        <SubModuleHeader parent="explore" title="Career Guide" subtitle="Find the path that fits you" icon={Briefcase}>
          <CareerGuide />
        </SubModuleHeader>
      );
    case 'university':
      return (
        <SubModuleHeader parent="explore" title="Universities" subtitle="Compare 2,400+ colleges" icon={GraduationCap}>
          <UniversityFinder />
        </SubModuleHeader>
      );
    case 'scholarship':
      return (
        <SubModuleHeader parent="explore" title="Scholarships" subtitle="Fund your education" icon={Award}>
          <ScholarshipEngine />
        </SubModuleHeader>
      );
    case 'settings':
      // Settings is now its own top-level sidebar item — no SubModuleHeader.
      return <SettingsView />;

    // Other views that don't belong to either hub (kept as-is)
    case 'planner':
      return <StudyPlanner />;
    case 'counsellor':
      return <WellnessCounsellor />;
    case 'study-material':
      return <StudyMaterialView />;
    case 'guardrail':
      return <GuardrailDashboardView />;
    case 'institution':
      return <InstitutionDashboardView />;
    case 'teacher':
      return <InstitutionDashboardView />;
    case 'handwritten-grader':
      return <HandwrittenGraderView />;
    case 'battle-arena':
      return <BattleArenaView />;
    case 'error-journal':
      return <ErrorJournalView />;
    case 'parent-dashboard':
      return <ParentDashboardView />;
    case 'nudge-bot':
      return <NudgeBotView />;
    case 'league':
      return <LeagueSystemView />;
    default:
      return <Dashboard />;
  }
}

function ExamRunnerOrEngine() {
  const { currentExam, setView, endExam } = useStore();
  if (currentExam) {
    return <ExamRunner onExit={() => { endExam(); setView('mock-exam'); }} />;
  }
  return <MockExamEngine onStart={() => {}} />;
}

export default function Home() {
  const { user, view, hydrated, setView } = useStore();
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null);

  useEffect(() => {
    if (hydrated && user && view === 'auth') {
      setView('dashboard');
    }
  }, [hydrated, user, view, setView]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.jpeg" alt="PreparationAI" className="h-14 w-14 rounded-xl object-cover animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading PreparationAI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authModal) {
      return <AuthScreen initialTab={authModal} onClose={() => setAuthModal(null)} />;
    }
    return <LandingPage onOpenAuth={(mode) => setAuthModal(mode)} />;
  }

  return (
    <>
      <AppShell>
        <ViewRouter view={view} />
      </AppShell>
      <DailyPlanModal />
    </>
  );
}
