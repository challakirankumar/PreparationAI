'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared';
import { useStore } from '@/lib/store';
import type { User, ExamAttempt } from '@/lib/types';
import type {
  Institution,
  Batch,
  Teacher,
  CohortMetrics,
  InstitutionSummary,
  BatchAssignment,
} from '@/lib/institution/types';
import {
  Building2, Users, GraduationCap, ClipboardList, BarChart3, UserCog,
  Plus, RefreshCw, TrendingUp, AlertTriangle, Award, Clock, Target,
  Calendar, BookOpen, UserPlus, Activity, School,
} from 'lucide-react';

// ============================================================================
// Institution Dashboard — combined Admin + Teacher view
// ============================================================================

type Role = 'admin' | 'teacher' | 'student';

interface InstitutionResponse {
  institution: Institution;
  summary: InstitutionSummary;
  batches: (Batch & { metrics: CohortMetrics | null })[];
  teachers: Teacher[];
}

export function InstitutionDashboardView() {
  const user = useStore(s => s.user);
  const registeredUsers = useStore(s => s.registeredUsers);
  const [role, setRole] = useState<Role>('admin');
  const [data, setData] = useState<InstitutionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const serializedRegisteredUsers = useMemo(() => {
    // Build the JSON blob the API expects: { [email]: { user, attempts } }
    const out: Record<string, { user: User; attempts: ExamAttempt[] }> = {};
    for (const [email, saved] of Object.entries(registeredUsers)) {
      out[email] = { user: saved.user, attempts: saved.attempts ?? [] };
    }
    // Always include the current user (might not be in registeredUsers yet)
    if (user && !Object.values(out).some(e => e.user.id === user.id)) {
      out[`__self__${user.email}`] = { user, attempts: [] };
    }
    return encodeURIComponent(JSON.stringify(out));
  }, [registeredUsers, user]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `/api/institution?institutionId=inst_demo001&registeredUsers=${serializedRegisteredUsers}`
      );
      if (r.ok) {
        const j = await r.json();
        setData(j);
        if (!selectedBatchId && j.batches?.length > 0) {
          setSelectedBatchId(j.batches[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load institution', e);
    } finally {
      setLoading(false);
    }
  }, [serializedRegisteredUsers, selectedBatchId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const institution = data?.institution;
  const summary = data?.summary;
  const batches = data?.batches ?? [];
  const teachers = data?.teachers ?? [];
  const selectedBatch = batches.find(b => b.id === selectedBatchId) ?? batches[0];
  const selectedBatchMetrics = selectedBatch?.metrics;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institution Dashboard"
        subtitle={institution ? `${institution.name} · ${institution.city}, ${institution.country}` : 'B2B / Coaching Institute Module'}
        accent="blue"
        icon={Building2}
      />

      {/* Role switcher + refresh */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">Viewing as:</span>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Institute Admin</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="student">Student</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Top KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Total Batches"
          value={summary?.totalBatches ?? 0}
          icon={<School className="h-5 w-5" />}
          color="blue"
        />
        <KpiCard
          label="Total Students"
          value={summary?.totalStudents ?? 0}
          icon={<Users className="h-5 w-5" />}
          color="cyan"
        />
        <KpiCard
          label="Teachers"
          value={summary?.totalTeachers ?? 0}
          icon={<UserCog className="h-5 w-5" />}
          color="purple"
        />
        <KpiCard
          label="Mocks Attempted"
          value={summary?.totalMocksTaken ?? 0}
          icon={<ClipboardList className="h-5 w-5" />}
          color="emerald"
        />
      </div>

      {/* Main tabs */}
      <Tabs defaultValue={role === 'admin' ? 'batches' : role === 'teacher' ? 'cohort' : 'assignments'} key={role}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="batches"><School className="h-4 w-4 mr-1 inline" />Batches</TabsTrigger>
          <TabsTrigger value="cohort"><BarChart3 className="h-4 w-4 mr-1 inline" />Cohort Analytics</TabsTrigger>
          <TabsTrigger value="assignments"><ClipboardList className="h-4 w-4 mr-1 inline" />Assignments</TabsTrigger>
          {role === 'admin' && (
            <TabsTrigger value="teachers"><UserCog className="h-4 w-4 mr-1 inline" />Teachers</TabsTrigger>
          )}
        </TabsList>

        {/* BATCHES TAB */}
        <TabsContent value="batches" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-stone-800">Active Batches</h3>
            {role === 'admin' && <CreateBatchDialog institutionId={institution?.id} onCreated={refresh} />}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.length === 0 ? (
              <Card className="p-6 col-span-full text-center text-stone-500">
                No batches yet. Create one to get started.
              </Card>
            ) : (
              batches.map(b => (
                <BatchCard
                  key={b.id}
                  batch={b}
                  metrics={b.metrics}
                  onSelect={() => setSelectedBatchId(b.id)}
                  selected={selectedBatchId === b.id}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* COHORT ANALYTICS TAB */}
        <TabsContent value="cohort" className="space-y-4">
          <div className="flex items-center gap-3">
            <Label className="text-sm text-stone-600">Select batch:</Label>
            <Select
              value={selectedBatchId ?? ''}
              onValueChange={setSelectedBatchId}
            >
              <SelectTrigger className="w-72"><SelectValue placeholder="Choose a batch" /></SelectTrigger>
              <SelectContent>
                {batches.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedBatchMetrics ? (
            <CohortAnalyticsPanel metrics={selectedBatchMetrics} />
          ) : (
            <Card className="p-6 text-center text-stone-500">
              No analytics available — pick a batch with enrolled students.
            </Card>
          )}
        </TabsContent>

        {/* ASSIGNMENTS TAB */}
        <TabsContent value="assignments" className="space-y-4">
          <AssignmentPanel
            batchId={selectedBatch?.id}
            teacherId={role === 'teacher' ? teachers[0]?.id : undefined}
            onAssignmentCreated={refresh}
            canCreate={role !== 'student'}
          />
        </TabsContent>

        {/* TEACHERS TAB (admin only) */}
        {role === 'admin' && (
          <TabsContent value="teachers" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-stone-800">Teaching Faculty</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teachers.map(t => (
                <Card key={t.id} className="p-4 border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                      {t.displayName.split(' ').map(w => w[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 truncate">{t.displayName}</p>
                      <p className="text-xs text-stone-500 truncate">{t.email}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {t.subjects.map(s => (
                          <Badge key={s} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-stone-400 mt-2">
                        Batches: {t.batchIds.length}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'cyan' | 'purple' | 'emerald';
}) {
  const colors: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
  return (
    <Card className={`p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase opacity-80">{label}</span>
        <div className="opacity-80">{icon}</div>
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums">{value}</div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Batch card
// ---------------------------------------------------------------------------

function BatchCard({
  batch,
  metrics,
  onSelect,
  selected,
}: {
  batch: Batch;
  metrics: CohortMetrics | null;
  onSelect: () => void;
  selected: boolean;
}) {
  const tierColors: Record<string, string> = {
    foundation: 'bg-blue-50 text-blue-700 border-blue-200',
    basic: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    advanced: 'bg-purple-50 text-purple-700 border-purple-200',
    crash: 'bg-rose-50 text-rose-700 border-rose-200',
    'test-series': 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <Card
      className={`p-4 cursor-pointer transition-all border-2 ${
        selected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-blue-200 hover:border-blue-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-800 truncate">{batch.name}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge variant="outline" className={`text-xs ${tierColors[batch.cohortTier] ?? 'bg-stone-50'}`}>
              {batch.cohortTier}
            </Badge>
            <Badge variant="outline" className="text-xs bg-stone-50 text-stone-700 border-stone-200">
              {batch.targetExam.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div>
          <p className="text-xs text-stone-500">Students</p>
          <p className="font-semibold text-stone-800 tabular-nums">
            {metrics?.totalStudents ?? batch.studentIds.length}/{batch.capacity}
          </p>
        </div>
        <div>
          <p className="text-xs text-stone-500">Active</p>
          <p className="font-semibold text-blue-700 tabular-nums">{metrics?.activeStudents ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-stone-500">Avg %</p>
          <p className="font-semibold text-emerald-700 tabular-nums">{metrics?.avgScorePct ?? 0}%</p>
        </div>
      </div>
      <div className="mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500"
          style={{ width: `${Math.min(100, ((metrics?.totalStudents ?? batch.studentIds.length) / batch.capacity) * 100)}%` }}
        />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Cohort analytics panel — used by teachers and admins
// ---------------------------------------------------------------------------

function CohortAnalyticsPanel({ metrics }: { metrics: CohortMetrics }) {
  const maxBucket = Math.max(...metrics.scoreDistribution.map(b => b.count), 1);
  const maxTrend = Math.max(...metrics.engagementTrend.map(d => d.mocksTaken), 1);
  const maxWeak = Math.max(...metrics.topWeakTopics.map(t => t.affectedStudents), 1);

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="Avg Score" value={`${metrics.avgScorePct}%`} icon={<Target className="h-4 w-4" />} color="blue" />
        <MiniStat label="Avg Accuracy" value={`${metrics.avgAccuracy}%`} icon={<Award className="h-4 w-4" />} color="emerald" />
        <MiniStat label="Avg Time/Q" value={`${metrics.avgTimePerQuestionSec}s`} icon={<Clock className="h-4 w-4" />} color="amber" />
        <MiniStat label="Total Mocks" value={metrics.totalMocksTaken} icon={<Activity className="h-4 w-4" />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Score distribution */}
        <Card className="p-4 border-blue-200">
          <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            Score Distribution
          </h4>
          <div className="space-y-2">
            {metrics.scoreDistribution.map(b => (
              <div key={b.bucket} className="flex items-center gap-3">
                <span className="text-xs w-16 text-stone-600">{b.bucket}</span>
                <div className="flex-1 h-6 bg-stone-100 rounded overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-end pr-2"
                    style={{ width: `${(b.count / maxBucket) * 100}%` }}
                  >
                    {b.count > 0 && (
                      <span className="text-xs font-medium text-white">{b.count}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Engagement trend */}
        <Card className="p-4 border-blue-200">
          <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Last 7 Days Engagement
          </h4>
          <div className="flex items-end justify-between h-32 gap-1">
            {metrics.engagementTrend.map(d => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-gradient-to-t from-blue-400 to-cyan-400 rounded-t"
                  style={{ height: `${(d.mocksTaken / maxTrend) * 100}%`, minHeight: d.mocksTaken > 0 ? '8px' : '2px' }}
                  title={`${d.mocksTaken} mocks on ${d.date}`}
                />
                <span className="text-[10px] text-stone-500">
                  {new Date(d.date).toLocaleDateString('en', { weekday: 'short' }).slice(0, 2)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Total mocks this week: {metrics.engagementTrend.reduce((s, d) => s + d.mocksTaken, 0)}
          </p>
        </Card>

        {/* Top weak topics */}
        <Card className="p-4 border-amber-200">
          <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Top Weak Topics (Cohort)
          </h4>
          {metrics.topWeakTopics.length === 0 ? (
            <p className="text-sm text-stone-400 italic">No weak topics flagged yet.</p>
          ) : (
            <div className="space-y-2">
              {metrics.topWeakTopics.map(t => (
                <div key={`${t.topic}-${t.subject}`} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-700 truncate">{t.topic}</p>
                    <p className="text-xs text-stone-500">{t.subject}</p>
                  </div>
                  <div className="w-24 h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-rose-500"
                      style={{ width: `${(t.affectedStudents / maxWeak) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-stone-600 w-12 text-right">{t.affectedStudents} students</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top performers + at-risk */}
        <Card className="p-4 border-blue-200">
          <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            Top Performers & At-Risk Students
          </h4>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase mb-1">Top Performers</p>
              {metrics.topPerformers.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No top performers yet (need ≥3 mocks & ≥60% avg).</p>
              ) : (
                metrics.topPerformers.map(p => (
                  <div key={p.studentId} className="flex items-center justify-between text-sm py-1">
                    <span className="text-stone-700 truncate">{p.studentName}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                        {p.avgScorePct}%
                      </Badge>
                      <span className="text-xs text-stone-500">{p.mocksTaken} mocks</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-stone-100 pt-2">
              <p className="text-xs font-semibold text-rose-700 uppercase mb-1">At-Risk Students</p>
              {metrics.atRiskStudents.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No at-risk students — cohort looks healthy.</p>
              ) : (
                metrics.atRiskStudents.map(s => (
                  <div key={s.studentId} className="flex items-center justify-between text-sm py-1">
                    <div className="min-w-0">
                      <p className="text-stone-700 truncate">{s.studentName}</p>
                      <p className="text-xs text-stone-500 truncate">{s.reason}</p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200">
                      {s.avgScorePct}%
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'amber' | 'purple';
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <div className={`p-3 rounded-lg border ${colors[color]}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs uppercase opacity-80">{label}</span>
      </div>
      <p className="text-xl font-bold tabular-nums mt-1">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create batch dialog (admin only)
// ---------------------------------------------------------------------------

function CreateBatchDialog({ institutionId, onCreated }: { institutionId?: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [cohortTier, setCohortTier] = useState<string>('foundation');
  const [targetExam, setTargetExam] = useState<string>('jee-main');
  const [capacity, setCapacity] = useState(60);
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!institutionId || !name.trim()) return;
    setCreating(true);
    try {
      await fetch('/api/institution/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId,
          name: name.trim(),
          cohortTier,
          targetExam,
          capacity,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
      setName('');
      setOpen(false);
      onCreated();
    } finally {
      setCreating(false);
    }
  };

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        New Batch
      </Button>
    );
  }

  return (
    <Card className="p-4 border-blue-300">
      <h4 className="font-semibold text-stone-800 mb-3">Create New Batch</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-stone-500">Batch Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="JEE 2026 Riser — Batch C" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs text-stone-500">Cohort Tier</Label>
          <Select value={cohortTier} onValueChange={setCohortTier}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="foundation">Foundation</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="crash">Crash Course</SelectItem>
              <SelectItem value="test-series">Test Series</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-stone-500">Target Exam</Label>
          <Select value={targetExam} onValueChange={setTargetExam}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="jee-main">JEE Main</SelectItem>
              <SelectItem value="neet">NEET</SelectItem>
              <SelectItem value="gate">GATE</SelectItem>
              <SelectItem value="cat">CAT</SelectItem>
              <SelectItem value="upsc">UPSC</SelectItem>
              <SelectItem value="gre">GRE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-stone-500">Capacity</Label>
          <Input type="number" value={capacity} onChange={e => setCapacity(Number(e.target.value) || 60)} className="mt-1" />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <Button onClick={submit} disabled={creating || !name.trim()}>
          {creating ? 'Creating…' : 'Create Batch'}
        </Button>
        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Assignment panel
// ---------------------------------------------------------------------------

function AssignmentPanel({
  batchId,
  teacherId,
  onAssignmentCreated,
  canCreate,
}: {
  batchId?: string;
  teacherId?: string;
  onAssignmentCreated: () => void;
  canCreate: boolean;
}) {
  const [assignments, setAssignments] = useState<BatchAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'mock' | 'practice' | 'dpp' | 'revision'>('dpp');
  const [newDesc, setNewDesc] = useState('');
  const [dueDate, setDueDate] = useState('');

  const load = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/institution/assignments?batchId=${batchId}`);
      if (r.ok) {
        const j = await r.json();
        setAssignments(j.assignments ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    load();
  }, [load]);

  const createAssignment = async () => {
    if (!batchId || !teacherId || !newTitle.trim()) return;
    await fetch('/api/institution/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId,
        teacherId,
        title: newTitle.trim(),
        description: newDesc,
        type: newType,
        examId: 'jee-main',
        dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        studentIds: [],
      }),
    });
    setNewTitle('');
    setNewDesc('');
    setDueDate('');
    setShowCreate(false);
    load();
    onAssignmentCreated();
  };

  const typeColors: Record<string, string> = {
    mock: 'bg-rose-50 text-rose-700 border-rose-200',
    practice: 'bg-blue-50 text-blue-700 border-blue-200',
    dpp: 'bg-amber-50 text-amber-700 border-amber-200',
    revision: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-stone-800">
          Assignments{batchId ? ` · ${assignments.length}` : ''}
        </h3>
        {canCreate && (
          <Button size="sm" variant="outline" onClick={() => setShowCreate(s => !s)}>
            <Plus className="h-4 w-4 mr-1" />
            New Assignment
          </Button>
        )}
      </div>

      {showCreate && canCreate && (
        <Card className="p-4 border-blue-300 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-stone-500">Title</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Kinematics DPP Set 4" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-stone-500">Type</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dpp">DPP (Daily Practice)</SelectItem>
                  <SelectItem value="practice">Practice Set</SelectItem>
                  <SelectItem value="mock">Mock Test</SelectItem>
                  <SelectItem value="revision">Revision</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-stone-500">Description</Label>
              <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="10 problems on uniformly accelerated motion…" className="mt-1" rows={2} />
            </div>
            <div>
              <Label className="text-xs text-stone-500">Due Date</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={createAssignment} disabled={!newTitle.trim()}>Publish</Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="p-6 text-center text-stone-500">Loading assignments…</Card>
      ) : assignments.length === 0 ? (
        <Card className="p-6 text-center text-stone-500">No assignments yet for this batch.</Card>
      ) : (
        <div className="space-y-2">
          {assignments.map(a => (
            <Card key={a.id} className="p-3 border-blue-100 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-xs ${typeColors[a.type] ?? 'bg-stone-50'}`}>
                      {a.type.toUpperCase()}
                    </Badge>
                    <p className="font-medium text-stone-800">{a.title}</p>
                  </div>
                  {a.description && (
                    <p className="text-sm text-stone-600 mt-1 line-clamp-2">{a.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due: {new Date(a.dueDate).toLocaleDateString()}
                    </span>
                    {a.examId && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {a.examId.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
