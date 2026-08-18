'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { AppShell } from '@/components/app-shell';
import { AuthScreen } from '@/components/auth/auth-screen';
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
import { DigitalTwin, ExamReadiness, RankPredictor, SuccessSimulator } from '@/components/views/ai-features';
import type { View } from '@/lib/types';

function ViewRouter({ view }: { view: View }) {
  switch (view) {
    case 'dashboard':
      return <Dashboard />;
    case 'mock-exam':
      return <ExamRunnerOrEngine />;
    case 'analytics':
      return <PerformanceAnalytics />;
    case 'mentor':
      return <MentorRoom />;
    case 'career':
      return <CareerGuide />;
    case 'university':
      return <UniversityFinder />;
    case 'scholarship':
      return <ScholarshipEngine />;
    case 'planner':
      return <StudyPlanner />;
    case 'counsellor':
      return <WellnessCounsellor />;
    case 'university-predictor':
      return <UniversityPredictor />;
    case 'digital-twin':
      return <DigitalTwin />;
    case 'readiness':
      return <ExamReadiness />;
    case 'rank-predictor':
      return <RankPredictor />;
    case 'success-simulator':
      return <SuccessSimulator />;
    case 'weakness-radar':
      return <PerformanceAnalytics />;
    case 'settings':
      return <SettingsView />;
    case 'study-material':
      return <StudyMaterialView />;
    case 'guardrail':
      return <GuardrailDashboardView />;
    case 'institution':
      return <InstitutionDashboardView />;
    case 'teacher':
      return <InstitutionDashboardView />;
    case 'doubt-solver':
      return <DoubtSolverView />;
    case 'pyq-trends':
      return <PyqTrendPredictorView />;
    case 'socratic-mentor':
      return <SocraticMentorView />;
    case 'handwritten-grader':
      return <HandwrittenGraderView />;
    case 'battle-arena':
      return <BattleArenaView />;
    case 'error-journal':
      return <ErrorJournalView />;
    case 'parent-dashboard':
      return <ParentDashboardView />;
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
    return <AuthScreen />;
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
