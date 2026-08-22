'use client';

import * as React from 'react';
import {
  Brain,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  GraduationCap,
  School,
  BookOpen,
  Check,
  X,
  Mail,
  Lock,
  User as UserIcon,
  Clock,
  ListChecks,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useStore, defaultExamDate } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { examsForUserType, getPattern } from '@/lib/exams/patterns';
import { COUNTRIES, getCountryByCode } from '@/lib/country-exam-data';
import type { ExamPattern, User, UserType } from '@/lib/types';
import { SignupTermsDialog } from '@/components/shared/dialogs';

const USER_TYPES: { id: UserType; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'school-11', label: 'Class 11', description: 'First year prep', icon: School },
  { id: 'school-12', label: 'Class 12', description: 'Board + entrance', icon: GraduationCap },
  { id: 'ug', label: 'Undergrad', description: 'College / GRE / GMAT', icon: BookOpen },
  { id: 'grad', label: 'Graduate', description: 'GATE / UPSC / work', icon: Users },
];

const FEATURES = [
  { icon: Sparkles, title: '11 AI Agents', description: 'Mock exams, mentor, analytics, planner — all in one workspace.' },
  { icon: Target, title: 'Real Exam Patterns', description: 'JEE, NEET, GRE, GMAT, GATE, UPSC, SAT, IELTS, TOEFL and more.' },
  { icon: TrendingUp, title: 'Weakness Radar', description: 'Identify weak topics and fix them with curated YouTube lessons.' },
  { icon: ShieldCheck, title: 'Private & Local', description: 'Your prep history lives in your browser. No spam, ever.' },
];

const SOCIAL_PROOF = [
  { label: 'Exams supported', value: '17' },
  { label: 'AI agents', value: '11' },
  { label: 'Avg. score lift', value: '+22%' },
];

function formatDuration(sec: number): string {
  const mins = Math.round(sec / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} m`;
}

function ExamToggle({
  examId,
  selected,
  onToggle,
}: {
  examId: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const p = getPattern(examId);
  if (!p) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'group relative text-left rounded-lg border p-3 transition-all palette-btn',
        selected
          ? 'border-blue-400 bg-blue-50/70 ring-1 ring-blue-300'
          : 'border-stone-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-900 truncate">{p.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <ListChecks className="h-3 w-3" /> {p.totalQuestions} Qs
          </p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatDuration(p.durationSec)}
          </p>
        </div>
        <span
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-md border flex-shrink-0 transition',
            selected ? 'bg-blue-600 border-emerald-600 text-white' : 'border-stone-300 bg-white text-transparent'
          )}
        >
          <Check className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}

export function AuthScreen() {
  const register = useStore((s) => s.register);
  const loginWithCredentials = useStore((s) => s.loginWithCredentials);
  const { toast } = useToast();

  const [tab, setTab] = React.useState<'login' | 'signup'>('signup');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [userType, setUserType] = React.useState<UserType>('school-12');
  const [selectedExams, setSelectedExams] = React.useState<string[]>(['jee-main']);
  const [country, setCountry] = React.useState<string>('IN');
  const [termsOpen, setTermsOpen] = React.useState(false);

  const availableExams = React.useMemo(() => examsForUserType(userType), [userType]);

  // Ensure selected exams stay valid when user type changes
  React.useEffect(() => {
    const valid = new Set(availableExams.map((p) => p.id));
    setSelectedExams((curr) => {
      const filtered = curr.filter((id) => valid.has(id));
      return filtered.length === 0 ? (availableExams[0]?.id ? [availableExams[0].id] : []) : filtered;
    });
  }, [availableExams]);

  function toggleExam(id: string) {
    setSelectedExams((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tab === 'signup' && !name.trim()) {
      toast({ title: 'Please enter your name', variant: 'destructive' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast({ title: 'Please enter a valid email', variant: 'destructive' });
      return;
    }
    if (password.length < 4) {
      toast({ title: 'Password must be at least 4 characters', variant: 'destructive' });
      return;
    }
    if (tab === 'signup' && selectedExams.length === 0) {
      toast({ title: 'Select at least one target exam', variant: 'destructive' });
      return;
    }

    if (tab === 'signup') {
      // Show terms popup before creating account
      setTermsOpen(true);
      return;
    }

    // Login mode — direct
    doLogin();
  }

  function doLogin() {
    const result = loginWithCredentials(email.trim(), password);
    if (!result.success) {
      toast({ title: 'Login failed', description: result.error, variant: 'destructive' });
      return;
    }
    const savedUser = useStore.getState().user;
    toast({
      title: `Welcome back, ${savedUser?.name.split(' ')[0]}!`,
      description: `${useStore.getState().attempts.length} attempts on record`,
    });
  }

  function doSignup() {
    setTermsOpen(false);
    const primaryExam = selectedExams[0];
    const pattern = getPattern(primaryExam);
    const user: User = {
      id: Math.random().toString(36).slice(2, 11),
      name: name.trim() || (email.split('@')[0] ?? 'Aspirant'),
      email: email.trim(),
      type: userType,
      examGoal: primaryExam,
      examGoals: [...selectedExams],
      examDate: defaultExamDate(),
      country,
      targetScore: pattern ? Math.round(pattern.totalMarks * 0.75) : undefined,
      joinedAt: new Date().toISOString(),
    };
    const result = register(user, password);
    if (!result.success) {
      toast({ title: 'Sign up failed', description: result.error, variant: 'destructive' });
      return;
    }
    // Fire a welcome notification to the backend so the bell badge lights up
    // on first login. Non-blocking — fail silently if the API is unreachable.
    void import('@/lib/notifications/client').then(({ createNotification }) =>
      createNotification({
        userId: user.id,
        type: 'welcome',
        title: `Welcome aboard, ${user.name.split(' ')[0]}!`,
        body: `Your ${pattern?.name ?? ''} prep journey starts now. Take your first mock exam to see real analytics.`,
        link: 'mock-exam',
      }),
    );
    toast({
      title: `Welcome, ${user.name.split(' ')[0]}!`,
      description: `${selectedExams.length} target exam${selectedExams.length === 1 ? '' : 's'} ready · ${pattern?.name ?? ''}`,
    });
  }

  return (
    <div className="min-h-screen bg-premium">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">
        {/* Left side — brand & value */}
        <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14">
          <div>
            <div className="flex items-center gap-3">
              <img src="/logo.jpeg" alt="PreparationAI" className="h-14 w-14 rounded-xl object-cover shadow-md" />
              <div>
                <p className="text-xl font-bold tracking-tight">Preparation<span className="text-blue-600">AI</span></p>
                <p className="text-xs text-muted-foreground">EDUCATIONAL OS</p>
              </div>
            </div>

            <h1 className="mt-10 text-4xl xl:text-5xl font-bold tracking-tight leading-[1.1]">
              Your path to <span className="text-gradient-emerald">exam mastery</span> starts here.
            </h1>
            <p className="mt-4 text-base text-muted-foreground max-w-xl">
              Real exam patterns, AI-generated mock papers, syllabus-weighted questions, behaviour analytics, and YouTube fixes for every weak topic — all in one workspace.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="rounded-xl border border-stone-200 bg-white p-4 card-lift">
                    <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="font-semibold text-sm text-stone-900">{f.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Social proof */}
          <div className="mt-10 flex items-center gap-6 pt-6 border-t border-stone-200">
            {SOCIAL_PROOF.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-gradient-emerald">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex -space-x-2">
                {['A', 'R', 'S', 'K'].map((c) => (
                  <div
                    key={c}
                    className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-white text-white text-[10px] font-semibold flex items-center justify-center"
                  >
                    {c}
                  </div>
                ))}
              </div>
              <span>Joined by 50k+ aspirants</span>
            </div>
          </div>
        </div>

        {/* Right side — auth card */}
        <div className="flex items-center justify-center p-5 sm:p-8 lg:p-10">
          <Card className="w-full max-w-md p-6 sm:p-8 border-stone-200 shadow-xl">
            {/* Mobile brand header */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <img src="/logo.jpeg" alt="PreparationAI" className="h-10 w-10 rounded-xl object-contain shadow" />
              <div>
                <p className="font-bold">Preparation<span className="text-blue-600">AI</span></p>
                <p className="text-[11px] text-muted-foreground">EDUCATIONAL OS</p>
              </div>
            </div>

            <div className="mb-5">
              <h2 className="text-2xl font-bold tracking-tight">Welcome</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Pick your exams and start your prep journey in 30 seconds.
              </p>
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Log In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-5 space-y-4">
                <AuthFormFields
                  tab={tab}
                  name={name}
                  setName={setName}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  userType={userType}
                  setUserType={setUserType}
                  availableExams={availableExams}
                  selectedExams={selectedExams}
                  toggleExam={toggleExam}
                  country={country}
                  setCountry={setCountry}
                  onSubmit={handleSubmit}
                />
              </TabsContent>
              <TabsContent value="signup" className="mt-5 space-y-4">
                <AuthFormFields
                  tab={tab}
                  name={name}
                  setName={setName}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  userType={userType}
                  setUserType={setUserType}
                  availableExams={availableExams}
                  selectedExams={selectedExams}
                  toggleExam={toggleExam}
                  country={country}
                  setCountry={setCountry}
                  onSubmit={handleSubmit}
                />
              </TabsContent>
            </Tabs>

            <p className="text-[11px] text-muted-foreground text-center mt-4">
              By continuing you agree to our Terms & Privacy Policy. Demo mode — no real account is created.
            </p>
          </Card>
        </div>
      </div>

      <SignupTermsDialog
        open={termsOpen}
        onOpenChange={setTermsOpen}
        onAccept={doSignup}
      />
    </div>
  );
}

function AuthFormFields({
  tab,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  userType,
  setUserType,
  availableExams,
  selectedExams,
  toggleExam,
  onSubmit,
  country,
  setCountry,
}: {
  tab: 'login' | 'signup';
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  userType: UserType;
  setUserType: (v: UserType) => void;
  availableExams: ExamPattern[];
  selectedExams: string[];
  toggleExam: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  country: string;
  setCountry: (v: string) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {tab === 'signup' && (
        <div className="space-y-1.5">
          <Label htmlFor="auth-name">Full name</Label>
          <div className="relative">
            <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="auth-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aarav Sharma"
              className="pl-8"
              autoComplete="name"
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="auth-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="pl-8"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="auth-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pl-8"
            autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
          />
        </div>
      </div>

      {/* User type selector */}
      <div className="space-y-1.5">
        <Label>I am a</Label>
        <div className="grid grid-cols-2 gap-2">
          {USER_TYPES.map((u) => {
            const Icon = u.icon;
            const active = userType === u.id;
            return (
              <button
                type="button"
                key={u.id}
                onClick={() => setUserType(u.id)}
                className={cn(
                  'rounded-lg border p-2.5 text-left transition palette-btn',
                  active
                    ? 'border-blue-400 bg-blue-50/70 ring-1 ring-blue-300'
                    : 'border-stone-200 bg-white hover:border-blue-300'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', active ? 'text-blue-600' : 'text-stone-500')} />
                  <span className="text-sm font-medium text-stone-900">{u.label}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{u.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Country selector — signup only */}
      {tab === 'signup' && (
      <div className="space-y-1.5">
        <Label>Country</Label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm font-medium text-stone-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-300 outline-none"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
          ))}
        </select>
      </div>
      )}

      {/* Multi-exam selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-blue-600" /> Target exams
          </Label>
          <Badge
            variant="outline"
            className={cn(
              'border-blue-300 text-blue-700 bg-blue-50',
              selectedExams.length === 0 && 'border-rose-300 text-rose-700 bg-rose-50'
            )}
          >
            {selectedExams.length} selected
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto scroll-thin pr-1">
          {availableExams.map((p) => (
            <ExamToggle
              key={p.id}
              examId={p.id}
              selected={selectedExams.includes(p.id)}
              onToggle={() => toggleExam(p.id)}
            />
          ))}
        </div>

        {/* Removable chips */}
        {selectedExams.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {selectedExams.map((id, idx) => {
              const p = getPattern(id);
              if (!p) return null;
              return (
                <span
                  key={id}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border',
                    idx === 0
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                  )}
                >
                  {idx === 0 && <Star className="h-3 w-3" />}
                  {p.name}
                  <button
                    type="button"
                    onClick={() => toggleExam(id)}
                    className="ml-0.5 hover:bg-black/10 rounded-full p-0.5"
                    aria-label={`Remove ${p.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        {selectedExams.length === 0 && (
          <p className="text-[11px] text-rose-600 flex items-center gap-1">
            <X className="h-3 w-3" /> Select at least one exam to continue.
          </p>
        )}
      </div>

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
        {tab === 'signup' ? 'Create account & start' : 'Log in'}
        <Sparkles className="h-4 w-4" />
      </Button>
    </form>
  );
}
