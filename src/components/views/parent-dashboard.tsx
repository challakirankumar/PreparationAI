'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Heart, Users, Clock, Target, TrendingUp, TrendingDown, Activity,
  Mail, Lock, User as UserIcon, Loader2, CheckCircle2, AlertTriangle,
  Calendar, Award, Flame, BookOpen, Lightbulb, Eye, EyeOff, Sparkles,
  BarChart3, Star,
} from 'lucide-react';

// ============================================================================
// Types matching the API
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
    parentUserId: string;
    studentUserId: string;
    relationship: string;
    approvalStatus: string;
    approvedAt?: string;
    createdAt: string;
    invitationMethod: string;
  };
  snapshot: StudentSnapshot;
}

interface WeeklyDigest {
  parentName: string;
  studentName: string;
  weekStart: string;
  weekEnd: string;
  digestId: string;
  headline: string;
  summary: {
    studyHours: number;
    mocksTaken: number;
    avgScorePct: number;
    accuracy: number;
    xpEarned: number;
    streak: number;
    battlesWon: number;
  };
  comparison: {
    studyHoursDelta: number;
    avgScorePctDelta: number;
    mocksTakenDelta: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  highlights: string[];
  focusAreas: string[];
  wellnessFlags: string[];
  recommendedActions: string[];
  quoteOfTheWeek: string;
  generatedAt: string;
}

// ============================================================================
// Main view
// ============================================================================

export function ParentDashboardView() {
  const [parent, setParent] = useState<ParentInfo | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authing, setAuthing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleAuth = async () => {
    setAuthing(true);
    setAuthError(null);
    try {
      const r = await fetch('/api/parent/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode,
          email,
          password,
          displayName: authMode === 'signup' ? displayName : undefined,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setAuthError(j.error || 'Authentication failed');
        return;
      }
      setParent(j.parent);
    } catch (e) {
      setAuthError((e as Error).message);
    } finally {
      setAuthing(false);
    }
  };

  // Auto-login as demo parent on first mount (so the UI is immediately useful)
  useEffect(() => {
    setEmail('parent@demo.com');
    setPassword('parent123');
    // Don't auto-submit — let user see the auth screen first
  }, []);

  if (!parent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full border-blue-200">
          <div className="text-center mb-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-3">
              <Heart className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-stone-800">Parent Dashboard</h2>
            <p className="text-sm text-stone-500 mt-1">
              Read-only view of your child's exam preparation progress
            </p>
          </div>

          <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-3">
              <div>
                <Label className="text-xs text-stone-500">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input value={email} onChange={e => setEmail(e.target.value)} type="email" className="pl-8" placeholder="parent@example.com" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-stone-500">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input value={password} onChange={e => setPassword(e.target.value)} type="password" className="pl-8" placeholder="••••••••" />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="signup" className="space-y-3">
              <div>
                <Label className="text-xs text-stone-500">Display Name</Label>
                <div className="relative mt-1">
                  <UserIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="pl-8" placeholder="Mr. Sharma" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-stone-500">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input value={email} onChange={e => setEmail(e.target.value)} type="email" className="pl-8" placeholder="parent@example.com" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-stone-500">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input value={password} onChange={e => setPassword(e.target.value)} type="password" className="pl-8" placeholder="••••••••" />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {authError && (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded mt-3">
              {authError}
            </div>
          )}

          <Button onClick={handleAuth} disabled={authing || !email || !password} className="w-full mt-3">
            {authing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            {authMode === 'login' ? 'Login' : 'Create Account'}
          </Button>

          <div className="text-xs text-center text-stone-500 mt-3 p-2 bg-blue-50 rounded border border-blue-100">
            <Sparkles className="inline h-3 w-3 mr-1" />
            Demo login: <code className="font-mono">parent@demo.com</code> / <code className="font-mono">parent123</code>
          </div>

          <p className="text-xs text-center text-stone-400 mt-3">
            <EyeOff className="inline h-3 w-3 mr-1" />
            Read-only access · No chat · No editing · Audited via EduScope
          </p>
        </Card>
      </div>
    );
  }

  return <ParentDashboard parent={parent} onLogout={() => { setParent(null); setEmail(''); setPassword(''); }} />;
}

// ============================================================================
// Parent dashboard (after auth)
// ============================================================================

function ParentDashboard({ parent, onLogout }: { parent: ParentInfo; onLogout: () => void }) {
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
  }, [selectedStudentId, loadDigest]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-stone-600">Loading your children's progress…</p>
      </div>
    );
  }

  const selectedStudent = linkedStudents.find(s => s.link.studentUserId === selectedStudentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-5 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-800">Parent Dashboard</h1>
              <p className="text-sm text-stone-600">
                Welcome, {parent.displayName} · Read-only view of {linkedStudents.length} linked {linkedStudents.length === 1 ? 'student' : 'students'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white/60 border-blue-200 text-blue-700">
              <Eye className="h-3 w-3 mr-1" />
              Read-only
            </Badge>
            <Button variant="ghost" size="sm" onClick={onLogout}>Logout</Button>
          </div>
        </div>
      </Card>

      {linkedStudents.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Users className="h-12 w-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-semibold text-stone-700">No students linked yet</h3>
          <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
            Your child needs to approve the link from their student account. Once approved, you'll see their progress here.
          </p>
        </Card>
      ) : (
        <>
          {/* Student selector */}
          <div className="flex items-center gap-3">
            <Label className="text-sm text-stone-600 whitespace-nowrap">Viewing:</Label>
            <Select value={selectedStudentId ?? ''} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
              <SelectContent>
                {linkedStudents.map(s => (
                  <SelectItem key={s.link.studentUserId} value={s.link.studentUserId}>
                    {s.snapshot.student.displayName} · {s.snapshot.student.examName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStudent && (
            <StudentDashboard snapshot={selectedStudent.snapshot} digest={digest} digestLoading={digestLoading} onRefreshDigest={() => loadDigest(selectedStudentId!)} />
          )}
        </>
      )}

      {/* Footer explainer */}
      <Card className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Heart className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-stone-800 mb-1">About the Parent Dashboard</h4>
            <ul className="text-sm text-stone-700 space-y-1 list-disc list-inside">
              <li><strong>Read-only:</strong> You can see progress, scores, and trends — but cannot edit anything or chat with the AI mentor.</li>
              <li><strong>Weekly digest:</strong> A summary is generated on {parent.digestDay}s, delivered to {parent.digestEmail}. You can also generate it on-demand above.</li>
              <li><strong>Wellness signals:</strong> The system flags concerning patterns (low activity, late-night studying, accuracy drops, burnout risk) so you can intervene gently.</li>
              <li><strong>Privacy:</strong> Your child must approve the link. All access is audited via EduScope.</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// Student dashboard (read-only view)
// ============================================================================

function StudentDashboard({ snapshot: s, digest, digestLoading, onRefreshDigest }: {
  snapshot: StudentSnapshot;
  digest: WeeklyDigest | null;
  digestLoading: boolean;
  onRefreshDigest: () => void;
}) {
  const student = s.student;
  const ws = s.weeklyStats;
  const cs = s.cumulative;

  return (
    <div className="space-y-6">
      {/* Student hero card */}
      <Card className="p-5 border-blue-200">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {student.displayName.split(' ').map(w => w[0]).slice(0, 2).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-stone-800">{student.displayName}</h2>
            <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-stone-500">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{student.examName}</Badge>
              <Badge variant="outline" className="bg-stone-50 text-stone-700 border-stone-200">{student.grade}</Badge>
              {student.daysToExam > 0 && (
                <Badge variant="outline" className={`bg-amber-50 border-amber-200 ${student.daysToExam < 30 ? 'text-rose-700' : 'text-amber-700'}`}>
                  <Clock className="h-3 w-3 mr-1" />
                  {student.daysToExam} days to exam
                </Badge>
              )}
              {ws.streakDays >= 3 && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  <Flame className="h-3 w-3 mr-1" />
                  {ws.streakDays}-day streak
                </Badge>
              )}
            </div>
          </div>
          {student.examDate && (
            <div className="text-right">
              <p className="text-xs text-stone-500 uppercase">Exam Date</p>
              <p className="font-semibold text-stone-800">{new Date(student.examDate).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Wellness signals */}
      {s.wellnessSignals.length > 0 && (
        <Card className="p-4 border-amber-300 bg-amber-50/40">
          <h3 className="font-semibold text-stone-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Wellness Signals ({s.wellnessSignals.length})
          </h3>
          <div className="space-y-2">
            {s.wellnessSignals.map((sig, idx) => (
              <div key={idx} className={`p-2 rounded border ${
                sig.severity === 'high' ? 'bg-rose-50 border-rose-200' :
                sig.severity === 'medium' ? 'bg-amber-50 border-amber-200' :
                'bg-stone-50 border-stone-200'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={`text-xs capitalize ${
                    sig.severity === 'high' ? 'bg-rose-100 text-rose-700 border-rose-300' :
                    sig.severity === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                    'bg-stone-100 text-stone-700 border-stone-300'
                  }`}>
                    {sig.severity}
                  </Badge>
                  <span className="text-sm font-medium text-stone-700 capitalize">{sig.signal.replace(/-/g, ' ')}</span>
                </div>
                <p className="text-sm text-stone-700">{sig.description}</p>
                <p className="text-xs text-stone-600 mt-1 italic">
                  <Lightbulb className="inline h-3 w-3 mr-1" />
                  {sig.recommendation}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Weekly stats KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ParentKpiCard label="Study Hours" value={`${ws.studyHoursTotal}h`} sub={`${ws.activeDays} active days`} icon={<Clock className="h-5 w-5" />} color="blue" />
        <ParentKpiCard label="Mocks Taken" value={ws.mocksTaken} sub={`${ws.questionsAttempted} questions`} icon={<Target className="h-5 w-5" />} color="cyan" />
        <ParentKpiCard label="Avg Score" value={`${ws.avgScorePct}%`} sub={`${ws.avgAccuracy}% accuracy`} icon={<Award className="h-5 w-5" />} color="emerald" />
        <ParentKpiCard label="Streak" value={`${ws.streakDays} days`} sub={`${ws.battlesWon} battles won`} icon={<Flame className="h-5 w-5" />} color="amber" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview"><Activity className="h-4 w-4 mr-1 inline" />Overview</TabsTrigger>
          <TabsTrigger value="subjects"><BarChart3 className="h-4 w-4 mr-1 inline" />Subjects</TabsTrigger>
          <TabsTrigger value="digest"><Mail className="h-4 w-4 mr-1 inline" />Weekly Digest</TabsTrigger>
          <TabsTrigger value="errors"><BookOpen className="h-4 w-4 mr-1 inline" />Weak Topics</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Cumulative stats */}
          <Card className="p-5 border-blue-200">
            <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Cumulative Progress
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="Total Mocks" value={cs.totalMocks} />
              <StatBox label="Best Score" value={`${cs.bestScorePct}%`} />
              <StatBox label="Avg Score" value={`${cs.avgScorePct}%`} />
              <StatBox label="Total Study" value={`${cs.totalStudyHours}h`} />
            </div>
          </Card>

          {/* 8-week trend */}
          <Card className="p-5 border-blue-200">
            <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              8-Week Trend
            </h3>
            <div className="flex items-end justify-between h-32 gap-2">
              {s.weeklyTrend.map((w, idx) => {
                const maxScore = Math.max(...s.weeklyTrend.map(x => x.avgScorePct), 100);
                const heightPct = (w.avgScorePct / maxScore) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-[10px] text-stone-500">{w.avgScorePct}%</div>
                    <div className="w-full bg-stone-100 rounded-t" style={{ height: '80px', display: 'flex', alignItems: 'flex-end' }}>
                      <div
                        className={`w-full rounded-t transition-all ${
                          w.avgScorePct >= 70 ? 'bg-emerald-500' :
                          w.avgScorePct >= 50 ? 'bg-blue-500' :
                          w.avgScorePct > 0 ? 'bg-amber-500' : 'bg-stone-200'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-stone-500 text-center">
                      <div>{w.mocksTaken} mocks</div>
                      <div>{w.studyHours}h</div>
                    </div>
                    <span className="text-[10px] text-stone-400">
                      {new Date(w.weekStart).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Recent activity */}
          <Card className="p-5 border-blue-200">
            <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Recent Activity (Last 10)
            </h3>
            {s.recentActivity.length === 0 ? (
              <p className="text-sm text-stone-400 italic">No recent activity.</p>
            ) : (
              <div className="space-y-2">
                {s.recentActivity.map((a, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-stone-50 border border-stone-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileIcon type={a.type} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-700 truncate">{a.description}</p>
                        <p className="text-xs text-stone-500">
                          {new Date(a.timestamp).toLocaleDateString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          {a.duration && ` · ${a.duration}`}
                        </p>
                      </div>
                    </div>
                    {a.score !== undefined && (
                      <Badge variant="outline" className={`text-xs ${
                        a.score >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        a.score >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {a.score}%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Subjects tab */}
        <TabsContent value="subjects" className="space-y-4">
          <Card className="p-5 border-blue-200">
            <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Subject Performance
            </h3>
            {s.subjectBreakdown.length === 0 ? (
              <p className="text-sm text-stone-400 italic">No subject data yet.</p>
            ) : (
              <div className="space-y-3">
                {s.subjectBreakdown.map(subj => (
                  <div key={subj.subject}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-stone-700 flex items-center gap-2">
                        {subj.subject}
                        <Badge variant="outline" className={`text-xs ${
                          subj.trend === 'improving' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          subj.trend === 'declining' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-stone-50 text-stone-700 border-stone-200'
                        }`}>
                          {subj.trend === 'improving' && <TrendingUp className="h-3 w-3" />}
                          {subj.trend === 'declining' && <TrendingDown className="h-3 w-3" />}
                          {subj.trend}
                        </Badge>
                      </span>
                      <span className="text-xs text-stone-500">
                        {subj.mocksAttempted} mocks · {subj.accuracy}% accuracy
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            subj.avgScorePct >= 70 ? 'bg-emerald-500' :
                            subj.avgScorePct >= 50 ? 'bg-blue-500' :
                            'bg-amber-500'
                          }`}
                          style={{ width: `${subj.avgScorePct}%` }}
                        />
                      </div>
                      <span className="font-bold tabular-nums text-stone-700 text-sm w-12 text-right">{subj.avgScorePct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Weekly digest tab */}
        <TabsContent value="digest" className="space-y-4">
          <Card className="p-5 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                Weekly Digest
              </h3>
              <Button variant="outline" size="sm" onClick={onRefreshDigest} disabled={digestLoading}>
                {digestLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Generate Now
              </Button>
            </div>

            {digestLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 text-blue-500 mx-auto animate-spin mb-2" />
                <p className="text-sm text-stone-500">Generating digest…</p>
              </div>
            ) : digest ? (
              <div className="space-y-4">
                {/* Headline */}
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
                  <p className="text-sm text-stone-800 leading-relaxed">{digest.headline}</p>
                  <p className="text-xs text-stone-500 mt-2">
                    Week of {digest.weekStart} to {digest.weekEnd}
                  </p>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatBox label="Study Hours" value={`${digest.summary.studyHours}h`} delta={digest.comparison.studyHoursDelta} />
                  <StatBox label="Mocks" value={digest.summary.mocksTaken} delta={digest.comparison.mocksTakenDelta} />
                  <StatBox label="Avg Score" value={`${digest.summary.avgScorePct}%`} delta={digest.comparison.avgScorePctDelta} />
                  <StatBox label="Streak" value={`${digest.summary.streak} days`} />
                </div>

                {/* Highlights */}
                <div>
                  <p className="text-xs font-semibold text-emerald-700 uppercase mb-1">Highlights</p>
                  <ul className="space-y-1">
                    {digest.highlights.map((h, i) => (
                      <li key={i} className="text-sm text-stone-700 flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 mt-1 text-emerald-500 flex-shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Focus areas */}
                <div>
                  <p className="text-xs font-semibold text-amber-700 uppercase mb-1">Focus Areas</p>
                  <ul className="space-y-1">
                    {digest.focusAreas.map((f, i) => (
                      <li key={i} className="text-sm text-stone-700 flex items-start gap-2">
                        <Target className="h-3 w-3 mt-1 text-amber-500 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Wellness flags */}
                {digest.wellnessFlags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-rose-700 uppercase mb-1">Wellness Flags</p>
                    <ul className="space-y-1">
                      {digest.wellnessFlags.map((f, i) => (
                        <li key={i} className="text-sm text-stone-700 flex items-start gap-2">
                          <AlertTriangle className="h-3 w-3 mt-1 text-rose-500 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended actions */}
                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Recommended Actions for You</p>
                  <ul className="space-y-1">
                    {digest.recommendedActions.map((a, i) => (
                      <li key={i} className="text-sm text-stone-700 flex items-start gap-2">
                        <Lightbulb className="h-3 w-3 mt-1 text-blue-500 flex-shrink-0" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Quote */}
                <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 italic text-sm text-stone-700">
                  <Star className="inline h-3 w-3 mr-1 text-amber-500" />
                  {digest.quoteOfTheWeek}
                </div>
              </div>
            ) : (
              <p className="text-sm text-stone-500 italic text-center py-4">
                Click "Generate Now" to create this week's digest.
              </p>
            )}
          </Card>
        </TabsContent>

        {/* Weak topics tab */}
        <TabsContent value="errors" className="space-y-4">
          <Card className="p-5 border-blue-200">
            <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              Weak Topics (from Error Journal)
            </h3>
            {s.weakTopics.length === 0 ? (
              <p className="text-sm text-stone-400 italic">No weak topics flagged — great progress!</p>
            ) : (
              <div className="space-y-2">
                {s.weakTopics.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded bg-stone-50 border border-stone-200">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 truncate">{t.topic}</p>
                      <p className="text-xs text-stone-500">{t.subject}</p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200">
                      {t.errorCount} errors
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 capitalize">
                      {t.dominantCause.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-xs text-stone-700">
                <Lightbulb className="inline h-3 w-3 mr-1 text-amber-500" />
                Errors resolved: <strong>{cs.errorJournalResolved}/{cs.errorJournalEntries}</strong> —
                {cs.errorJournalEntries > 0 ? `${Math.round((cs.errorJournalResolved / cs.errorJournalEntries) * 100)}% resolution rate` : ' no errors logged yet'}.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function ParentKpiCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: 'blue' | 'cyan' | 'emerald' | 'amber';
}) {
  const colors: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };
  return (
    <Card className={`p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase opacity-80">{label}</span>
        <div className="opacity-80">{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs opacity-70 mt-1">{sub}</div>}
    </Card>
  );
}

function StatBox({ label, value, delta }: { label: string; value: string | number; delta?: number }) {
  return (
    <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
      <p className="text-xs text-stone-500 uppercase">{label}</p>
      <p className="text-xl font-bold tabular-nums text-stone-800">{value}</p>
      {delta !== undefined && delta !== 0 && (
        <p className={`text-xs ${delta > 0 ? 'text-emerald-600' : 'text-rose-600'} flex items-center gap-1`}>
          {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {delta > 0 ? '+' : ''}{delta}
        </p>
      )}
    </div>
  );
}

function FileIcon({ type }: { type: string }) {
  const Icon = type === 'mock' ? Target : type === 'battle' ? Flame : type === 'study' ? BookOpen : Activity;
  return (
    <div className="h-7 w-7 rounded bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
      <Icon className="h-3.5 w-3.5" />
    </div>
  );
}
