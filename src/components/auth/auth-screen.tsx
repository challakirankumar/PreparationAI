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
  Phone,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  Gift,
  MessageSquare,
  Loader2,
  SkipForward,
  CheckCircle2,
  Eye,
  EyeOff,
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


// ============================================================================
// Step definitions for the multi-step signup wizard.
// Order: details → grade → country → exams → exam date → package → otp
// ============================================================================
type SignupStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const STEP_DEFS: { step: SignupStep; label: string; shortLabel: string }[] = [
  { step: 1, label: 'Your details', shortLabel: 'Details' },
  { step: 2, label: 'Grade / Standard', shortLabel: 'Grade' },
  { step: 3, label: 'Country', shortLabel: 'Country' },
  { step: 4, label: 'Target exams', shortLabel: 'Exams' },
  { step: 5, label: 'Exam date', shortLabel: 'Date' },
  { step: 6, label: 'Package', shortLabel: 'Package' },
  { step: 7, label: 'Verify number', shortLabel: 'OTP' },
];

export function AuthScreen({
  initialTab = 'signup',
  onClose,
}: {
  initialTab?: 'login' | 'signup';
  onClose?: () => void;
} = {}) {
  const register = useStore((s) => s.register);
  const loginWithCredentials = useStore((s) => s.loginWithCredentials);
  const { toast } = useToast();

  const [tab, setTab] = React.useState<'login' | 'signup'>(initialTab);

  React.useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  // Shared state — used by both login (just email/password) and signup (full wizard)
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [userType, setUserType] = React.useState<UserType>('school-12');
  const [country, setCountry] = React.useState<string>('in');
  const [selectedExams, setSelectedExams] = React.useState<string[]>([]);
  const [examDate, setExamDate] = React.useState<string>(defaultExamDate());
  const [step, setStep] = React.useState<SignupStep>(1);
  const [termsOpen, setTermsOpen] = React.useState(false);

  // OTP step state
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [verifyingOtp, setVerifyingOtp] = React.useState(false);
  const [enteredOtp, setEnteredOtp] = React.useState('');
  const [serverOtp, setServerOtp] = React.useState<string | null>(null); // dev mode shows the code

  const [showLoginPassword, setShowLoginPassword] = React.useState(false);

  // Exams filtered by the selected country + userType
  const availableExams = React.useMemo(() => {
    // Country-popular exams first, then fall back to user-type exams.
    const countryInfo = getCountryByCode(country);
    const popular = countryInfo?.popularExams ?? [];
    const popularSet = new Set(popular);
    const typeExams = examsForUserType(userType);
    if (popular.length > 0) {
      const filtered = typeExams.filter((p) => popularSet.has(p.id));
      if (filtered.length > 0) return filtered;
    }
    return typeExams;
  }, [userType, country]);

  function toggleExam(id: string) {
    setSelectedExams((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]));
  }

  // ---------------- LOGIN ----------------
  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast({ title: 'Please enter a valid email', variant: 'destructive' });
      return;
    }
    if (password.length < 4) {
      toast({ title: 'Password must be at least 4 characters', variant: 'destructive' });
      return;
    }
    await doLogin();
  }

  async function doLogin() {
    const result = await loginWithCredentials(email.trim(), password);
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

  // ---------------- SIGNUP WIZARD ----------------
  function nextStep() {
    setStep((s) => (s < 7 ? ((s + 1) as SignupStep) : s));
  }
  function prevStep() {
    setStep((s) => (s > 1 ? ((s - 1) as SignupStep) : s));
  }

  function validateStep1(): boolean {
    if (!name.trim()) { toast({ title: 'Please enter your name', variant: 'destructive' }); return false; }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      toast({ title: 'Please enter a valid phone number', variant: 'destructive' }); return false;
    }
    if (!email.trim() || !email.includes('@')) {
      toast({ title: 'Please enter a valid email', variant: 'destructive' }); return false;
    }
    if (password.length < 4) {
      toast({ title: 'Password must be at least 4 characters', variant: 'destructive' }); return false;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' }); return false;
    }
    return true;
  }

  function validateStep4(): boolean {
    if (selectedExams.length === 0) {
      toast({ title: 'Select at least one target exam', variant: 'destructive' });
      return false;
    }
    return true;
  }

  function handleStepNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 4 && !validateStep4()) return;
    if (step === 6) {
      setTermsOpen(true);
      return;
    }
    nextStep();
  }

  // Called when the user accepts the terms popup from step 6 → opens OTP step.
  function proceedToOtp() {
    setTermsOpen(false);
    setStep(7);
    void sendOtp();
  }

  async function sendOtp() {
    setSendingOtp(true);
    setEnteredOtp('');
    setServerOtp(null);
    try {
      const resp = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name, country }),
      });
      const data = await resp.json();
      if (data.devOtp) {
        setServerOtp(data.devOtp);
      }
      toast({
        title: 'OTP sent',
        description: data.devOtp
          ? `Dev mode: code is ${data.devOtp}`
          : `A verification code was sent to ${phone}`,
      });
    } catch (e) {
      toast({
        title: 'Could not send OTP',
        description: (e as Error).message,
        variant: 'destructive',
      });
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyOtp() {
    if (enteredOtp.length < 4) {
      toast({ title: 'Enter the 6-digit code', variant: 'destructive' });
      return;
    }
    setVerifyingOtp(true);
    try {
      const resp = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: enteredOtp }),
      });
      const data = await resp.json();
      if (!data.verified) {
        toast({ title: 'Incorrect code', description: 'Please double-check the code.', variant: 'destructive' });
        setVerifyingOtp(false);
        return;
      }
      toast({ title: 'Phone verified', description: 'Creating your account…' });
      finalizeSignup();
    } catch (e) {
      toast({ title: 'Verification failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setVerifyingOtp(false);
    }
  }

  function skipOtp() {
    toast({
      title: 'OTP skipped',
      description: 'You can verify your number later from Settings.',
    });
    finalizeSignup();
  }

  // Builds the User object and calls register().
  function finalizeSignup() {
    const primaryExam = selectedExams[0];
    const pattern = getPattern(primaryExam);
    const user: User = {
      id: Math.random().toString(36).slice(2, 11),
      name: name.trim() || (email.split('@')[0] ?? 'Aspirant'),
      email: email.trim(),
      phone: phone.trim(),
      type: userType,
      examGoal: primaryExam,
      examGoals: [...selectedExams],
      examDate,
      country,
      targetScore: pattern ? Math.round(pattern.totalMarks * 0.75) : undefined,
      joinedAt: new Date().toISOString(),
    };
    const result = register(user, password);
    if (!result.success) {
      toast({ title: 'Sign up failed', description: result.error, variant: 'destructive' });
      return;
    }
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

  function renderSignupStep() {
    switch (step) {
      case 1:
        return <StepDetails
          name={name} setName={setName}
          phone={phone} setPhone={setPhone}
          email={email} setEmail={setEmail}
          password={password} setPassword={setPassword}
          confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
        />;
      case 2:
        return <StepGrade userType={userType} setUserType={setUserType} />;
      case 3:
        return <StepCountry country={country} setCountry={setCountry} />;
      case 4:
        return <StepExams
          availableExams={availableExams}
          selectedExams={selectedExams}
          toggleExam={toggleExam}
        />;
      case 5:
        return <StepExamDate
          examDate={examDate} setExamDate={setExamDate}
          primaryExamName={getPattern(selectedExams[0])?.name ?? 'your exam'}
        />;
      case 6:
        return <StepPackage />;
      case 7:
        return <StepOtp
          phone={phone}
          enteredOtp={enteredOtp}
          setEnteredOtp={setEnteredOtp}
          sendingOtp={sendingOtp}
          verifyingOtp={verifyingOtp}
          serverOtp={serverOtp}
          onResend={sendOtp}
          onVerify={verifyOtp}
          onSkip={skipOtp}
        />;
    }
  }

  const showBack = tab === 'signup' && step > 1 && step < 7;
  const showNext = tab === 'signup' && step < 7;
  const nextLabel = step === 6 ? 'Accept & continue' : 'Continue';

  return (
    <div className="min-h-screen bg-premium relative">
      {onClose && (
        <div className="absolute top-4 left-4 z-20">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 bg-white/70 dark:bg-slate-850/70 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Home
          </Button>
        </div>
      )}
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2 pt-12 lg:pt-0">
        {/* Left side — brand & value */}
        <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14">
          <div>
            <div className="flex items-center gap-3">
              <img src="/logo.jpeg" alt="PreparationAI" className="h-14 w-14 rounded-xl object-cover shadow-md" />
              <div>
                <p className="text-xl font-bold tracking-tight">Preparation<span className="text-blue-600">AI</span></p>
                <p className="text-[11px] text-muted-foreground">EDUCATIONAL OS</p>
              </div>
            </div>

            <h1 className="mt-10 text-4xl xl:text-5xl font-bold tracking-tight leading-tight">
              Your AI-powered<br />
              <span className="text-gradient-emerald">exam preparation OS.</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground max-w-md leading-relaxed">
              Mock exams, AI mentor, analytics, planner — eleven specialised agents
              trained on real exam patterns, all in one workspace.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 max-w-md">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="rounded-xl border border-stone-200 bg-white/70 backdrop-blur-sm p-3.5 hover:border-blue-300 transition"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-8 w-8 rounded-lg bg-blue-700 text-white flex items-center justify-center">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-semibold text-stone-900">{f.title}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{f.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Credit line — "Developed by Kiran Challa and Team" with glassy premium styling */}
          <div className="mt-10 pt-6 border-t border-stone-200">
            <div className="relative inline-flex items-center gap-3 rounded-2xl px-5 py-3 ring-1 ring-blue-200/60 bg-white/60 backdrop-blur-md shadow-[0_4px_24px_-8px_rgba(15,76,129,0.18)] overflow-hidden">
              <div className="pointer-events-none absolute -top-6 -left-4 h-20 w-20 rounded-full bg-blue-200/30 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-blue-100/40 blur-2xl" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent" />
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 flex items-center justify-center shadow-md ring-1 ring-white/30 flex-shrink-0">
                <Sparkles className="h-4 w-4 text-white" />
                <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              </div>
              <div className="relative min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700/80">Crafted by</p>
                <p className="text-base font-bold tracking-tight bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-900 bg-clip-text text-transparent leading-tight">
                  Kiran Challa and Team
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side — auth card */}
        <div className="flex items-center justify-center p-5 sm:p-8 lg:p-10">
          <Card className="w-full max-w-md p-6 sm:p-8 border-stone-200 shadow-xl">
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <img src="/logo.jpeg" alt="PreparationAI" className="h-10 w-10 rounded-lg object-cover" />
              <div>
                <p className="font-bold">Preparation<span className="text-blue-600">AI</span></p>
                <p className="text-[11px] text-muted-foreground">EDUCATIONAL OS</p>
              </div>
            </div>

            <Tabs value={tab} onValueChange={(v) => {
              setTab(v as 'login' | 'signup');
              setStep(1);
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Log In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* ---------------- LOGIN ---------------- */}
              <TabsContent value="login" className="mt-5 space-y-4">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                        type={showLoginPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-8 pr-10"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-stone-900 focus:outline-none p-1"
                        tabIndex={-1}
                        aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800">
                    Log in
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </form>

                {/* 1-Click Demo Credentials */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">
                    ⚡ Quick Demo Login
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 border-slate-200 hover:bg-blue-50 hover:text-blue-700 font-semibold"
                      onClick={() => {
                        setEmail('student@preparationai.com');
                        setPassword('password123');
                      }}
                    >
                      🎓 Student
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-amber-900 font-semibold"
                      onClick={() => {
                        setEmail('admin@preparationai.com');
                        setPassword('adminpassword123');
                      }}
                    >
                      🛡️ SuperAdmin
                    </Button>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground text-center">
                  By continuing you agree to our Terms & Privacy Policy.
                </p>
              </TabsContent>

              {/* ---------------- SIGNUP WIZARD ---------------- */}
              <TabsContent value="signup" className="mt-5 space-y-4">
                {/* Step progress indicator */}
                <div className="flex items-center gap-1.5">
                  {STEP_DEFS.map((s, idx) => {
                    const isActive = s.step === step;
                    const isDone = s.step < step;
                    return (
                      <React.Fragment key={s.step}>
                        <div
                          className={cn(
                            'h-1.5 flex-1 rounded-full transition-all',
                            isActive ? 'bg-blue-700' : isDone ? 'bg-blue-300' : 'bg-stone-200',
                          )}
                          title={s.label}
                        />
                        {idx < STEP_DEFS.length - 1 && <div className="w-0.5" />}
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                    Step {step} of 7 · {STEP_DEFS[step - 1].label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {STEP_DEFS[step - 1].shortLabel}
                  </p>
                </div>

                <div className="min-h-[280px]">
                  {renderSignupStep()}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {showBack && (
                    <Button variant="outline" onClick={prevStep}>
                      <ChevronLeft className="h-4 w-4" /> Back
                    </Button>
                  )}
                  {showNext && (
                    <Button className="flex-1 bg-blue-700 hover:bg-blue-800" onClick={handleStepNext}>
                      {nextLabel}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      <SignupTermsDialog
        open={termsOpen}
        onOpenChange={setTermsOpen}
        onAccept={proceedToOtp}
      />
    </div>
  );
}

// ============================================================================
// STEP 1 — Details
// ============================================================================
function StepDetails({
  name, setName, phone, setPhone, email, setEmail,
  password, setPassword, confirmPassword, setConfirmPassword,
}: {
  name: string; setName: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  confirmPassword: string; setConfirmPassword: (v: string) => void;
}) {
  const [showPw, setShowPw] = React.useState(false);
  const [showConfirmPw, setShowConfirmPw] = React.useState(false);

  return (
    <div className="space-y-3.5">
      <div>
        <h3 className="font-bold text-lg tracking-tight text-stone-900">Let&apos;s get started</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Tell us a bit about yourself.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-name">Full name</Label>
        <div className="relative">
          <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Sharma" className="pl-8" autoComplete="name" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-phone">Phone number</Label>
        <div className="relative">
          <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="su-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 90000 00000" className="pl-8" inputMode="tel" autoComplete="tel" />
        </div>
        <p className="text-[10px] text-muted-foreground">Include country code — we&apos;ll send a verification code via SMS.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-8" autoComplete="email" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="su-pw">Password</Label>
          <div className="relative">
            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="su-pw"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-8 pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-stone-900 focus:outline-none p-1"
              tabIndex={-1}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="su-pw2">Confirm password</Label>
          <div className="relative">
            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="su-pw2"
              type={showConfirmPw ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-8 pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPw((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-stone-900 focus:outline-none p-1"
              tabIndex={-1}
              aria-label={showConfirmPw ? "Hide password" : "Show password"}
            >
              {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 2 — Grade
// ============================================================================
function StepGrade({ userType, setUserType }: { userType: UserType; setUserType: (v: UserType) => void }) {
  return (
    <div className="space-y-3.5">
      <div>
        <h3 className="font-bold text-lg tracking-tight text-stone-900">Which standard are you in?</h3>
        <p className="text-xs text-muted-foreground mt-0.5">This tailors exam recommendations.</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {USER_TYPES.map((u) => {
          const Icon = u.icon;
          const active = userType === u.id;
          return (
            <button
              type="button"
              key={u.id}
              onClick={() => setUserType(u.id)}
              className={cn(
                'rounded-xl border p-3.5 text-left transition palette-btn',
                active ? 'border-blue-400 bg-blue-50/70 ring-1 ring-blue-300 shadow-sm' : 'border-stone-200 bg-white hover:border-blue-300',
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn('h-4 w-4', active ? 'text-blue-700' : 'text-stone-500')} />
                <span className="text-sm font-semibold text-stone-900">{u.label}</span>
                {active && <Check className="h-3.5 w-3.5 text-blue-700 ml-auto" />}
              </div>
              <p className="text-[11px] text-muted-foreground">{u.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// STEP 3 — Country
// ============================================================================
function StepCountry({ country, setCountry }: { country: string; setCountry: (v: string) => void }) {
  return (
    <div className="space-y-3.5">
      <div>
        <h3 className="font-bold text-lg tracking-tight text-stone-900">Where are you from?</h3>
        <p className="text-xs text-muted-foreground mt-0.5">We&apos;ll filter exams popular for your country.</p>
      </div>
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
      <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-[11px] text-blue-800 leading-relaxed">
        Selected country:&nbsp;
        <strong>{getCountryByCode(country)?.flag} {getCountryByCode(country)?.name}</strong>.
        On the next step you&apos;ll see exams popular for students from this country.
      </div>
    </div>
  );
}

// ============================================================================
// STEP 4 — Target Exams (searchable + multi-select, filtered by country + type)
// ============================================================================
function StepExams({
  availableExams, selectedExams, toggleExam,
}: {
  availableExams: ExamPattern[];
  selectedExams: string[];
  toggleExam: (id: string) => void;
}) {
  const [query, setQuery] = React.useState('');
  const filtered = React.useMemo(() => {
    if (!query.trim()) return availableExams;
    const q = query.toLowerCase().trim();
    return availableExams.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.fullName.toLowerCase().includes(q) ||
        (p.state && p.state.toLowerCase().includes(q)) ||
        (p.conductingBody && p.conductingBody.toLowerCase().includes(q)) ||
        (p.domainCategory && p.domainCategory.toLowerCase().includes(q)) ||
        (p.postOrCourse && p.postOrCourse.toLowerCase().includes(q)),
    );
  }, [availableExams, query]);

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-lg tracking-tight text-stone-900">Pick your target exams</h3>
          <p className="text-xs text-muted-foreground mt-0.5">You can select multiple.</p>
        </div>
        <Badge variant="outline" className={cn(
          'border-blue-300 text-blue-700 bg-blue-50',
          selectedExams.length === 0 && 'border-rose-300 text-rose-700 bg-rose-50',
        )}>
          {selectedExams.length} selected
        </Badge>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search exams — JEE, NEET, GRE, GATE…" className="pl-8" />
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto scroll-thin pr-1">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-6 text-xs text-muted-foreground">No exams match &quot;{query}&quot;.</div>
        ) : (
          filtered.map((p) => (
            <ExamToggle key={p.id} examId={p.id} selected={selectedExams.includes(p.id)} onToggle={() => toggleExam(p.id)} />
          ))
        )}
      </div>
      {selectedExams.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedExams.map((id, idx) => {
            const p = getPattern(id);
            if (!p) return null;
            return (
              <span key={id} className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border',
                idx === 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-blue-50 border-blue-200 text-blue-700',
              )}>
                {idx === 0 && <Star className="h-3 w-3" />}
                {p.name}
                <button type="button" onClick={() => toggleExam(id)} className="ml-0.5 hover:bg-black/10 rounded-full p-0.5" aria-label={`Remove ${p.name}`}>
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
  );
}

// ============================================================================
// STEP 5 — Exam Date
// ============================================================================
function StepExamDate({
  examDate, setExamDate, primaryExamName,
}: {
  examDate: string;
  setExamDate: (v: string) => void;
  primaryExamName: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const daysToGo = (() => {
    const d = new Date(examDate);
    if (Number.isNaN(d.getTime())) return 0;
    const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
    return Math.max(0, diff);
  })();

  return (
    <div className="space-y-3.5">
      <div>
        <h3 className="font-bold text-lg tracking-tight text-stone-900">When is your exam?</h3>
        <p className="text-xs text-muted-foreground mt-0.5">For <strong>{primaryExamName}</strong>. We&apos;ll start a live countdown.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-exam-date">Exam date</Label>
        <div className="relative">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input id="su-exam-date" type="date" value={examDate} min={today} onChange={(e) => setExamDate(e.target.value)} className="pl-8" />
        </div>
      </div>
      <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-blue-700 text-white flex items-center justify-center flex-shrink-0">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-blue-900 text-lg tabular-nums leading-tight">{daysToGo} days</p>
          <p className="text-[11px] text-blue-700">until your target exam</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 6 — Package (dummy, read-only, no selection)
// ============================================================================
function StepPackage() {
  return (
    <div className="space-y-3.5">
      <div>
        <h3 className="font-bold text-lg tracking-tight text-stone-900">Your package</h3>
        <p className="text-xs text-muted-foreground mt-0.5">This is the default plan — no selection needed.</p>
      </div>
      <div className="rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white p-5 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-blue-200/40 blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-blue-700 text-white border-none"><Gift className="h-3 w-3" /> Default Plan</Badge>
            <span className="text-[10px] uppercase tracking-wider font-bold text-blue-700">Auto-assigned</span>
          </div>
          <p className="text-xl font-bold text-stone-900 tracking-tight">PreparationAI Starter</p>
          <p className="text-xs text-muted-foreground mt-1">Access to mock exams, AI mentor, analytics, planner, and 11 AI agents.</p>
          <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] text-stone-700">
            {['Unlimited mock exams', 'AI mentor chat', 'Full analytics suite', 'Study planner', 'PYQ trends', 'Wellness counsellor'].map((f) => (
              <div key={f} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-blue-700 flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground text-center">You can upgrade your plan later from Settings. Tap &quot;Accept &amp; continue&quot; to proceed.</p>
    </div>
  );
}

// ============================================================================
// STEP 7 — OTP verification (with Skip option)
// ============================================================================
function StepOtp({
  phone, enteredOtp, setEnteredOtp, sendingOtp, verifyingOtp, serverOtp, onResend, onVerify, onSkip,
}: {
  phone: string;
  enteredOtp: string;
  setEnteredOtp: (v: string) => void;
  sendingOtp: boolean;
  verifyingOtp: boolean;
  serverOtp: string | null;
  onResend: () => void;
  onVerify: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-3.5">
      <div>
        <h3 className="font-bold text-lg tracking-tight text-stone-900">Verify your number</h3>
        <p className="text-xs text-muted-foreground mt-0.5">We sent a 6-digit code to <strong className="text-stone-800">{phone}</strong>.</p>
      </div>
      {serverOtp && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-800">
          <strong>Dev mode:</strong> your code is <span className="font-mono font-bold">{serverOtp}</span>.
          (In production this would only be sent via SMS.)
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="su-otp">Enter code</Label>
        <Input
          id="su-otp"
          value={enteredOtp}
          onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          inputMode="numeric"
          className="text-center text-lg font-mono tracking-[0.4em]"
        />
      </div>
      <Button className="w-full bg-blue-700 hover:bg-blue-800" onClick={onVerify} disabled={verifyingOtp || enteredOtp.length < 4}>
        {verifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {verifyingOtp ? 'Verifying…' : 'Verify & continue'}
      </Button>
      <div className="flex items-center justify-between text-[11px]">
        <button type="button" onClick={onResend} disabled={sendingOtp} className="text-blue-700 hover:text-blue-900 font-medium inline-flex items-center gap-1 disabled:opacity-50">
          {sendingOtp ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3" />}
          {sendingOtp ? 'Sending…' : 'Resend code'}
        </button>
        <button type="button" onClick={onSkip} className="text-slate-500 hover:text-slate-700 font-medium inline-flex items-center gap-1">
          <SkipForward className="h-3 w-3" /> Skip for now
        </button>
      </div>
    </div>
  );
}
