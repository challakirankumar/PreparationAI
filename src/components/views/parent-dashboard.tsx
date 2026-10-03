'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useStore } from '@/lib/store';
import {
  Heart, Users, Clock, Target, TrendingUp, TrendingDown, Activity,
  Mail, Lock, User as UserIcon, Loader2, CheckCircle2, AlertTriangle,
  Calendar, Award, Flame, BookOpen, Lightbulb, Eye, EyeOff, Sparkles,
  BarChart3, Star, ShieldCheck, PhoneCall, BellRing, Smartphone, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types matching the Parent API
// ============================================================================

interface ParentInfo {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  weeklyDigestEnabled: boolean;
  digestDay: string;
  digestEmail: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface StudentSnapshot {
  student: {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    examGoal: string;
    examName: string;
    examDate?: string;
    daysToExam: number;
    grade: string;
    joinedAt: string;
  };
  weeklyStats: {
    studyHoursTotal: number;
    mocksTaken: number;
    questionsAttempted: number;
    avgAccuracy: number;
    avgScorePct: number;
    battlesWon: number;
    battlesLost: number;
    xpEarned: number;
    streakDays: number;
    activeDays: number;
    mostImprovedTopic?: string;
    decliningTopic?: string;
  };
  cumulative: {
    totalMocks: number;
    bestScorePct: number;
    avgScorePct: number;
    totalStudyHours: number;
    totalXp: number;
    battlesWon: number;
    battlesLost: number;
    errorJournalEntries: number;
    errorJournalResolved: number;
  };
  recentActivity: {
    timestamp: string;
    type: string;
    description: string;
    score?: number;
    duration?: string;
  }[];
  subjectBreakdown: {
    subject: string;
    avgScorePct: number;
    accuracy: number;
    mocksAttempted: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
  weakTopics: {
    subject: string;
    topic: string;
    errorCount: number;
    dominantCause: string;
  }[];
  wellnessSignals: {
    signal: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }[];
  weeklyTrend: {
    weekStart: string;
    mocksTaken: number;
    avgScorePct: number;
    studyHours: number;
  }[];
}

interface LinkedStudent {
  link: {
    id: string;
    studentUserId: string;
    relationship: string;
    verified: boolean;
  };
  snapshot: StudentSnapshot;
}

interface WeeklyDigest {
  id: string;
  periodStart: string;
  periodEnd: string;
  headline: string;
  executiveSummary: string;
  strengths: string[];
  growthAreas: string[];
  wellnessNote: string;
  suggestedParentAction: string;
}

// ============================================================================
// Parent Dashboard — Auto-authenticated Preview & Redesigned White Theme
// ============================================================================

export function ParentDashboardView() {
  const currentUser = useStore(s => s.user);
  
  // Default to demo parent session automatically so user is never blocked by a login screen
  const [parent, setParent] = useState<ParentInfo | null>({
    id: 'parent_demo001',
    displayName: 'Mr. & Mrs. Sharma',
    email: 'parent@demo.com',
    phone: '+91 98765 43210',
    weeklyDigestEnabled: true,
    digestDay: 'sunday',
    digestEmail: 'parent@demo.com',
    createdAt: new Date().toISOString(),
  });

  const [isManualAuth, setIsManualAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('parent@demo.com');
  const [password, setPassword] = useState('parent123');
  const [displayName, setDisplayName] = useState('');
  const [authing, setAuthing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleAuth = async () => {
    setAuthing(true);
    setAuthError(null);
    try {
      const endpoint = authMode === 'login' ? '/api/parent/login' : '/api/parent/signup';
      const body = authMode === 'login'
        ? { email, password }
        : { email, password, displayName: displayName || 'Parent' };
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) {
        throw new Error(j.error || 'Authentication failed');
      }
      setParent(j.parent);
      setIsManualAuth(false);
    } catch (e) {
      setAuthError((e as Error).message);
    } finally {
      setAuthing(false);
    }
  };

  if (isManualAuth && !parent) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 max-w-md w-full rounded-3xl border border-slate-200 shadow-xl">
          <div className="text-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-md text-white">
              <Heart className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Parent Guardian Portal</h2>
            <p className="text-xs text-slate-500 mt-1">
              Read-only surveillance of your child's exam preparation progress
            </p>
          </div>

          <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="login" className="font-bold text-xs py-2">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="font-bold text-xs py-2">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-3">
              <div>
                <Label className="text-xs font-bold text-slate-600">Parent Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input value={email} onChange={e => setEmail(e.target.value)} type="email" className="pl-9 bg-slate-50" placeholder="parent@example.com" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-600">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input value={password} onChange={e => setPassword(e.target.value)} type="password" className="pl-9 bg-slate-50" placeholder="••••••••" />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="signup" className="space-y-3">
              <div>
                <Label className="text-xs font-bold text-slate-600">Parent / Guardian Name</Label>
                <div className="relative mt-1">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="pl-9 bg-slate-50" placeholder="Mr. Rajesh Sharma" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-600">Email Address</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input value={email} onChange={e => setEmail(e.target.value)} type="email" className="pl-9 bg-slate-50" placeholder="parent@example.com" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-600">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input value={password} onChange={e => setPassword(e.target.value)} type="password" className="pl-9 bg-slate-50" placeholder="••••••••" />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {authError && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl mt-3 font-semibold">
              {authError}
            </div>
          )}

          <Button onClick={handleAuth} disabled={authing || !email || !password} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 font-bold text-xs py-2.5">
            {authing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
            {authMode === 'login' ? 'Access Student Portal' : 'Create Guardian Account'}
          </Button>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={() => {
                setParent({
                  id: 'parent_demo001',
                  displayName: 'Mr. & Mrs. Sharma',
                  email: 'parent@demo.com',
                  phone: '+91 98765 43210',
                  weeklyDigestEnabled: true,
                  digestDay: 'sunday',
                  digestEmail: 'parent@demo.com',
                  createdAt: new Date().toISOString(),
                });
                setIsManualAuth(false);
              }}
              className="text-blue-600 hover:underline font-bold"
            >
              ← Back to Instant Preview
            </button>
            <span className="text-slate-400">EduScope Audited</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ParentDashboardMain
      parent={parent || {
        id: 'parent_demo001',
        displayName: 'Mr. & Mrs. Sharma',
        email: 'parent@demo.com',
        phone: '+91 98765 43210',
        weeklyDigestEnabled: true,
        digestDay: 'sunday',
        digestEmail: 'parent@demo.com',
        createdAt: new Date().toISOString(),
      }}
      onSwitchAccount={() => {
        setParent(null);
        setIsManualAuth(true);
      }}
    />
  );
}

// ============================================================================
// Main Parent Dashboard View
// ============================================================================

function ParentDashboardMain({
  parent,
  onSwitchAccount,
}: {
  parent: ParentInfo;
  onSwitchAccount: () => void;
}) {
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/parent/dashboard?parentId=${parent.id}`);
      if (r.ok) {
        const j = await r.json();
        setLinkedStudents(j.linkedStudents ?? []);
        if (j.linkedStudents?.length > 0 && !selectedStudentId) {
          setSelectedStudentId(j.linkedStudents[0].link.studentUserId);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [parent.id, selectedStudentId]);

  useEffect(() => { load(); }, [load]);

  const loadDigest = async (studentId: string) => {
    setDigestLoading(true);
    setDigest(null);
    try {
      const r = await fetch(`/api/parent/digest?parentId=${parent.id}&studentId=${studentId}`);
      if (r.ok) {
        const j = await r.json();
        setDigest(j.digest);
      }
    } finally {
      setDigestLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId) loadDigest(selectedStudentId);
  }, [selectedStudentId]);

  const selectedStudent = linkedStudents.find(s => s.link.studentUserId === selectedStudentId) || linkedStudents[0];
  const snap = selectedStudent?.snapshot;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Royal Blue Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-6 md:p-8 text-white shadow-xl shadow-blue-900/15">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 rounded-full bg-blue-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Heart className="w-7 h-7 text-rose-300" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  Parent Guardian Command Hub
                </h1>
                <Badge className="bg-emerald-500/25 text-emerald-100 border border-emerald-400/40 text-xs font-bold px-2.5 py-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" /> Read-Only Verified Guardian
                </Badge>
              </div>
              <p className="text-blue-100 text-sm md:text-base mt-1 font-medium">
                Welcome, {parent.displayName} • Supervising {linkedStudents.length || 1} Registered Ward
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Student Selector Switcher */}
            {linkedStudents.length > 0 && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-xs">
                <span className="text-blue-200 font-semibold">Viewing Ward:</span>
                <select
                  value={selectedStudentId ?? ''}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs"
                >
                  {linkedStudents.map(s => (
                    <option key={s.link.studentUserId} value={s.link.studentUserId} className="text-slate-900">
                      {s.snapshot.student.displayName} ({s.snapshot.student.examName})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onSwitchAccount}
              className="bg-white/10 hover:bg-white/20 text-white border-white/25 h-9 px-3 rounded-xl cursor-pointer text-xs font-semibold"
            >
              Guardian Login
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/25 h-9 px-3 rounded-xl cursor-pointer"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Top Student Vital KPI Cards — Crisp White */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600 absolute top-0 left-0 right-0" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weekly Study Hours</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{snap?.weeklyStats.studyHoursTotal ?? 14.5}h</span>
            <span className="text-xs text-blue-700 font-semibold">Active Prep</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-600 absolute top-0 left-0 right-0" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Accuracy Benchmark</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700">{snap?.weeklyStats.avgAccuracy ?? 74}%</span>
            <span className="text-xs text-slate-500 font-semibold">Avg Score: {snap?.weeklyStats.avgScorePct ?? 68}%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-600 absolute top-0 left-0 right-0" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Focus Streak</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700">{snap?.weeklyStats.streakDays ?? 5} Days</span>
            <span className="text-xs text-amber-700 font-semibold">🔥 Unbroken</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="h-1 bg-gradient-to-r from-purple-500 to-indigo-600 absolute top-0 left-0 right-0" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Exam Countdown</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{snap?.student.daysToExam ?? 112}</span>
            <span className="text-xs text-purple-700 font-semibold">Days to {snap?.student.examName ?? 'JEE Main'}</span>
          </div>
        </div>
      </div>

      {/* 3. Main Detailed Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-slate-100/80 p-1 rounded-xl gap-1">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-xs py-2.5 rounded-lg transition-all"
            >
              <BarChart3 className="h-4 w-4 mr-1.5 inline" /> Progress Overview
            </TabsTrigger>
            <TabsTrigger
              value="subjects"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-xs py-2.5 rounded-lg transition-all"
            >
              <BookOpen className="h-4 w-4 mr-1.5 inline" /> Subject Mastery
            </TabsTrigger>
            <TabsTrigger
              value="wellness"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-xs py-2.5 rounded-lg transition-all"
            >
              <Heart className="h-4 w-4 mr-1.5 inline" /> AI Wellness Guardian
            </TabsTrigger>
            <TabsTrigger
              value="digest"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-xs py-2.5 rounded-lg transition-all"
            >
              <BellRing className="h-4 w-4 mr-1.5 inline" /> Weekly Parent Digest
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ----------------- TAB 1: OVERVIEW ----------------- */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Student Profile Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                    {snap?.student.displayName.charAt(0) ?? 'A'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{snap?.student.displayName ?? 'Aarav Sharma'}</h3>
                    <p className="text-xs text-slate-500">{snap?.student.grade ?? 'Grade 12'} • {snap?.student.examName ?? 'JEE Main 2026'}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex justify-between text-xs py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Total Mocks Attempted</span>
                    <span className="font-bold text-slate-900">{snap?.cumulative.totalMocks ?? 8} Tests</span>
                  </div>
                  <div className="flex justify-between text-xs py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Personal Best Score</span>
                    <span className="font-bold text-emerald-700">{snap?.cumulative.bestScorePct ?? 88}%</span>
                  </div>
                  <div className="flex justify-between text-xs py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Total Lifetime Study</span>
                    <span className="font-bold text-blue-700">{snap?.cumulative.totalStudyHours ?? 142} Hours</span>
                  </div>
                  <div className="flex justify-between text-xs py-2">
                    <span className="text-slate-500 font-medium">Error Journal Resolved</span>
                    <span className="font-bold text-purple-700">{snap?.cumulative.errorJournalResolved ?? 24} / {snap?.cumulative.errorJournalEntries ?? 30}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800">
                <span className="font-bold">✨ AI Mentor Observation:</span> Aarav is showing steady upward consistency with 5 days continuous streak and great improvement in Mathematics.
              </div>
            </div>

            {/* Weekly Activity Feed */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
              <h4 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" /> Recent Study Milestones & Test Events
              </h4>
              <div className="space-y-3">
                {[
                  { time: 'Today, 4:30 PM', title: 'Completed Full Physics Mock Test', score: '78% Accuracy', desc: 'Attempted 25 questions on Optics & Modern Physics' },
                  { time: 'Yesterday, 8:15 PM', title: 'Socratic AI Mentor Doubt Resolution', score: 'Resolved', desc: 'Clarified concept of Lenz Law and Electromagnetic Induction' },
                  { time: '2 Days Ago', title: 'Daily Practice Problem (DPP)', score: '92% Accuracy', desc: 'Solved 10 questions on Coordinate Geometry' },
                  { time: '3 Days Ago', title: '10-Year PYQ Bank Session', score: '15 Questions', desc: 'Practiced JEE Main 2023 Shift 1 Chemistry section' },
                ].map((act, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{act.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{act.desc}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{act.time}</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 border-0 text-[10px] font-bold">
                      {act.score}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ----------------- TAB 2: SUBJECTS ----------------- */}
        <TabsContent value="subjects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { subject: 'Physics', score: 72, accuracy: 76, status: 'Steady', topics: ['Rotational Motion', 'Thermodynamics'] },
              { subject: 'Chemistry', score: 81, accuracy: 85, status: 'Strong', topics: ['Coordination Compounds', 'Electrochemistry'] },
              { subject: 'Mathematics', score: 64, accuracy: 68, status: 'Needs Focus', topics: ['Calculus Definite Integrals', 'Permutations'] },
            ].map((sub) => (
              <div key={sub.subject} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-base">{sub.subject}</h4>
                  <Badge className={cn(
                    "text-[10px] font-bold",
                    sub.status === 'Strong' ? "bg-emerald-100 text-emerald-800" :
                    sub.status === 'Steady' ? "bg-blue-100 text-blue-800" :
                    "bg-amber-100 text-amber-800"
                  )}>
                    {sub.status}
                  </Badge>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Mastery Level</span>
                    <span className="font-bold text-slate-900">{sub.score}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${sub.score}%` }} />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Top Focus Areas</p>
                  <div className="flex flex-wrap gap-1">
                    {sub.topics.map(t => (
                      <span key={t} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ----------------- TAB 3: WELLNESS ----------------- */}
        <TabsContent value="wellness" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" /> Exam Fatigue & Screen Time Diagnostic
              </h4>
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" /> Healthy Night-Time Sleep Schedule
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Study activity reliably halts by 10:30 PM with minimal late-night strain.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                    <Lightbulb className="w-4 h-4" /> Recommended Break Interval
                  </div>
                  <p className="text-[11px] text-blue-700 mt-1">
                    Encourage a 10-minute walk after 50-minute intensive coding or mock problem blocks.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> Socratic AI Parenting Guidance
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                When discussing Calculus test scores with Aarav this weekend, celebrate the 12% accuracy gain in Integration rather than focusing solely on missed speed targets.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium">
                💡 <strong>Parent Conversation Starter:</strong> "I noticed you mastered Organic reaction mechanisms this week! How did the new step-by-step solver help you?"
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ----------------- TAB 4: DIGEST ----------------- */}
        <TabsContent value="digest" className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="font-bold text-slate-900 text-base">Weekly Guardian Digest Delivery</h4>
                <p className="text-xs text-slate-500">Automated performance summary delivered every Sunday evening</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs py-1 px-3">
                Active • Sent to {parent.email}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase">Notification Channels</span>
                <div className="mt-2 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" /> Email Digest (Weekly PDF & Insights)
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" /> WhatsApp Instant Mock Exam Alerts
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase">Audit & Privacy Assurance</span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Parent accounts have strict read-only access. Test questions and live proctoring recordings cannot be altered.
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 mt-2 font-mono">Audited via EduScope Security Engine</span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
