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
  Calendar, BookOpen, UserPlus, Activity, School, X, Sparkles, CheckCircle2,
  Search, SlidersHorizontal, ArrowUpRight, ShieldCheck, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Institution Dashboard — Redesigned White & Royal Blue B2B Module
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
  const [batchSearch, setBatchSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const serializedRegisteredUsers = useMemo(() => {
    const out: Record<string, { user: User; attempts: ExamAttempt[] }> = {};
    for (const [email, saved] of Object.entries(registeredUsers)) {
      out[email] = { user: saved.user, attempts: saved.attempts ?? [] };
    }
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

  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(batchSearch.toLowerCase()) ||
        b.targetExam.toLowerCase().includes(batchSearch.toLowerCase());
      const matchesTier = selectedTier === 'all' || b.cohortTier === selectedTier;
      return matchesSearch && matchesTier;
    });
  }, [batches, batchSearch, selectedTier]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner — Royal Blue Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-6 md:p-8 text-white shadow-xl shadow-blue-900/15">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 rounded-full bg-blue-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  Institution Command Dashboard
                </h1>
                <Badge className="bg-emerald-500/25 text-emerald-100 border border-emerald-400/40 text-xs font-bold px-2.5 py-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" /> Level 0 Partner Institute
                </Badge>
              </div>
              <p className="text-blue-100 text-sm md:text-base mt-1 font-medium">
                {institution ? `${institution.name} • ${institution.city}, ${institution.country}` : 'VidyaMandir Excellence Academy • Bengaluru, India'}
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-xs">
              <span className="text-blue-200 font-semibold">Viewing as:</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="admin" className="text-slate-900">Institute Admin</option>
                <option value="teacher" className="text-slate-900">Faculty / Teacher</option>
                <option value="student" className="text-slate-900">Student Cohort</option>
              </select>
            </div>

            {role === 'admin' && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-white text-blue-800 hover:bg-blue-50 font-bold shadow-md shadow-black/10 border-0 h-9 px-4 rounded-xl text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create Batch
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/25 h-9 px-3 rounded-xl cursor-pointer"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Top KPI Metric Cards — Crisp White */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600 absolute top-0 left-0 right-0" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Batches</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <School className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{summary?.totalBatches ?? batches.length}</span>
            <span className="text-xs text-blue-700 font-semibold">Active Cohorts</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-600 absolute top-0 left-0 right-0" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Enrolled</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{summary?.totalStudents ?? 0}</span>
            <span className="text-xs text-slate-500 font-semibold">Registered Students</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-600 absolute top-0 left-0 right-0" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Faculty & Mentors</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <UserCog className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{summary?.totalTeachers ?? teachers.length}</span>
            <span className="text-xs text-purple-700 font-semibold">Specialists Assigned</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-600 absolute top-0 left-0 right-0" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mocks Attempted</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{summary?.totalMocksTaken ?? 0}</span>
            <span className="text-xs text-emerald-700 font-semibold">Evaluated Tests</span>
          </div>
        </div>
      </div>

      {/* 3. Main Operational Tabs */}
      <Tabs defaultValue="batches" className="space-y-6">
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-slate-100/80 p-1 rounded-xl gap-1">
            <TabsTrigger
              value="batches"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-xs py-2.5 rounded-lg transition-all"
            >
              <School className="h-4 w-4 mr-1.5 inline" /> Active Batches ({batches.length})
            </TabsTrigger>
            <TabsTrigger
              value="cohort"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-xs py-2.5 rounded-lg transition-all"
            >
              <BarChart3 className="h-4 w-4 mr-1.5 inline" /> Cohort Analytics
            </TabsTrigger>
            <TabsTrigger
              value="assignments"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-xs py-2.5 rounded-lg transition-all"
            >
              <ClipboardList className="h-4 w-4 mr-1.5 inline" /> Assignments Hub
            </TabsTrigger>
            <TabsTrigger
              value="teachers"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-xs py-2.5 rounded-lg transition-all"
            >
              <UserCog className="h-4 w-4 mr-1.5 inline" /> Teaching Faculty ({teachers.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ----------------- TAB 1: BATCHES ----------------- */}
        <TabsContent value="batches" className="space-y-4">
          {/* Batch Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search batch name or exam..."
                value={batchSearch}
                onChange={e => setBatchSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" /> Tier:
              </span>
              {['all', 'foundation', 'advanced', 'crash', 'test-series'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize",
                    selectedTier === tier
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* Batches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBatches.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
                <School className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-base">No batches found</h4>
                <p className="text-slate-500 text-xs mt-1">Try adjusting your search query or create a new batch.</p>
                {role === 'admin' && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Create New Batch
                  </Button>
                )}
              </div>
            ) : (
              filteredBatches.map(b => (
                <BatchCardModern
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

        {/* ----------------- TAB 2: COHORT ANALYTICS ----------------- */}
        <TabsContent value="cohort" className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Cohort:</Label>
              <Select value={selectedBatchId ?? ''} onValueChange={setSelectedBatchId}>
                <SelectTrigger className="w-72 bg-slate-50 border-slate-200 font-semibold text-xs">
                  <SelectValue placeholder="Choose a batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map(b => (
                    <SelectItem key={b.id} value={b.id} className="text-xs font-medium">
                      {b.name} ({b.targetExam.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedBatch && (
              <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs py-1 px-3">
                Target: {selectedBatch.targetExam.toUpperCase()} • Tier: {selectedBatch.cohortTier.toUpperCase()}
              </Badge>
            )}
          </div>

          {selectedBatchMetrics ? (
            <CohortAnalyticsPanelModern metrics={selectedBatchMetrics} batchName={selectedBatch?.name || 'Cohort'} />
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-xs">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-base">Cohort Diagnostics Awaiting Data</h4>
              <p className="text-slate-500 text-xs mt-1">Pick a batch with enrolled students and mock submissions to see live telemetry.</p>
            </div>
          )}
        </TabsContent>

        {/* ----------------- TAB 3: ASSIGNMENTS ----------------- */}
        <TabsContent value="assignments" className="space-y-4">
          <AssignmentPanelModern
            batchId={selectedBatch?.id}
            batchName={selectedBatch?.name}
            teacherId={role === 'teacher' ? teachers[0]?.id : undefined}
            onAssignmentCreated={refresh}
            canCreate={role !== 'student'}
          />
        </TabsContent>

        {/* ----------------- TAB 4: TEACHERS ----------------- */}
        <TabsContent value="teachers" className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Registered Teaching Faculty</h3>
              <p className="text-xs text-slate-500">Subject matter experts supervising active student batches</p>
            </div>
            <Badge className="bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs">
              {teachers.length} Active Faculty
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map(t => (
              <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md flex-shrink-0">
                    {t.displayName.split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate text-sm">{t.displayName}</p>
                    <p className="text-xs text-slate-500 truncate">{t.email}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {t.subjects.map(s => (
                        <Badge key={s} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-semibold">
                          {s}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <span>Assigned Batches: <strong className="text-slate-900">{t.batchIds.length}</strong></span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* 4. Modal Dialog for Creating New Batch (No Broken Inline Layout) */}
      {showCreateModal && (
        <CreateBatchModal
          institutionId={institution?.id ?? 'inst_demo001'}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modern White Batch Card
// ---------------------------------------------------------------------------

function BatchCardModern({
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
  const tierBadges: Record<string, { bg: string; text: string }> = {
    foundation: { bg: 'bg-blue-100', text: 'text-blue-800' },
    basic: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    advanced: { bg: 'bg-purple-100', text: 'text-purple-800' },
    crash: { bg: 'bg-rose-100', text: 'text-rose-800' },
    'test-series': { bg: 'bg-amber-100', text: 'text-amber-800' },
  };

  const studentCount = metrics?.totalStudents ?? batch.studentIds.length;
  const fillPct = Math.min(100, Math.round((studentCount / batch.capacity) * 100));

  return (
    <div
      onClick={onSelect}
      className={cn(
        "bg-white p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md",
        selected
          ? "border-blue-600 ring-2 ring-blue-500/20 shadow-md"
          : "border-slate-200 hover:border-blue-300"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900 truncate text-base group-hover:text-blue-700 transition-colors">
            {batch.name}
          </h4>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className={cn("text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md", tierBadges[batch.cohortTier]?.bg || "bg-slate-100", tierBadges[batch.cohortTier]?.text || "text-slate-800")}>
              {batch.cohortTier}
            </span>
            <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 text-slate-700 border-slate-200">
              {batch.targetExam.toUpperCase()}
            </Badge>
          </div>
        </div>
        {selected && (
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-400">Enrollment</p>
          <p className="font-extrabold text-slate-900 text-sm mt-0.5">
            {studentCount} / {batch.capacity}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-400">Active</p>
          <p className="font-extrabold text-blue-700 text-sm mt-0.5">
            {metrics?.activeStudents ?? 0}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-400">Avg Score</p>
          <p className="font-extrabold text-emerald-700 text-sm mt-0.5">
            {metrics?.avgScorePct ?? 0}%
          </p>
        </div>
      </div>

      {/* Capacity Progress Bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
          <span>Batch Utilization</span>
          <span className="font-bold text-slate-700">{fillPct}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all"
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cohort Analytics Visualizer Panel
// ---------------------------------------------------------------------------

function CohortAnalyticsPanelModern({ metrics, batchName }: { metrics: CohortMetrics; batchName: string }) {
  return (
    <div className="space-y-4">
      {/* 4 Quick Telemetry Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Avg Score</span>
            <Target className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.avgScorePct}%</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Accuracy</span>
            <Award className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{metrics.avgAccuracy}%</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Speed / Q</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.avgTimePerQuestionSec}s</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Total Mocks</span>
            <Activity className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">{metrics.totalMocksTaken}</div>
        </div>
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Score distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Score Distribution — {batchName}
          </h4>
          <div className="space-y-2.5">
            {metrics.scoreDistribution.map(b => {
              const maxCount = Math.max(...metrics.scoreDistribution.map(x => x.count), 1);
              const pct = (b.count / maxCount) * 100;
              return (
                <div key={b.bucket} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>{b.bucket}</span>
                    <span className="font-bold text-slate-900">{b.count} students</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Weak Topics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Cohort Remedial Targets (Weak Topics)
          </h4>
          <div className="space-y-2.5">
            {metrics.topWeakTopics.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No critical weak topics flagged for this batch.</p>
            ) : (
              metrics.topWeakTopics.map(t => (
                <div key={t.topic} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{t.topic}</p>
                    <p className="text-[11px] text-slate-500">{t.subject}</p>
                  </div>
                  <Badge className="bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold">
                    {t.affectedStudents} students impacted
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assignment Panel Modern
// ---------------------------------------------------------------------------

function AssignmentPanelModern({
  batchId,
  batchName,
  teacherId,
  onAssignmentCreated,
  canCreate,
}: {
  batchId?: string;
  batchName?: string;
  teacherId?: string;
  onAssignmentCreated: () => void;
  canCreate: boolean;
}) {
  const [assignments, setAssignments] = useState<BatchAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'dpp' | 'practice' | 'mock' | 'revision'>('dpp');
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
    if (!batchId || !newTitle.trim()) return;
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

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base">
            Assignments Hub {batchName ? `• ${batchName}` : ''}
          </h3>
          <p className="text-xs text-slate-500">Track daily practice problems, mock schedules, and student submissions</p>
        </div>
        {canCreate && (
          <Button
            size="sm"
            onClick={() => setShowCreate(!showCreate)}
            className="bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" /> New Assignment
          </Button>
        )}
      </div>

      {showCreate && canCreate && (
        <div className="bg-white p-6 rounded-2xl border border-blue-300 shadow-md space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" /> Create & Publish Batch Assignment
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-slate-600">Assignment Title</Label>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Kinematics DPP Set 4"
                className="mt-1 bg-slate-50"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-600">Type</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as any)}>
                <SelectTrigger className="mt-1 bg-slate-50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dpp">DPP (Daily Practice)</SelectItem>
                  <SelectItem value="practice">Practice Problem Set</SelectItem>
                  <SelectItem value="mock">Proctored Mock Test</SelectItem>
                  <SelectItem value="revision">Sprint Revision</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs font-bold text-slate-600">Instructions & Objectives</Label>
              <Textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Complete 10 numerical problems on uniform acceleration..."
                className="mt-1 bg-slate-50"
                rows={2}
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-600">Submission Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="mt-1 bg-slate-50"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={createAssignment} disabled={!newTitle.trim()} className="bg-blue-600 text-white font-bold text-xs">
              Publish to Batch
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="text-xs font-bold">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
          Loading assignments...
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700 text-sm">No assignments published yet for this batch</p>
          <p className="text-xs text-slate-400 mt-1">Create a DPP or Mock Test to assign work to your students.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {assignments.map(a => (
            <div key={a.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800 border-0 text-[10px] font-extrabold uppercase">
                      {a.type}
                    </Badge>
                    <h5 className="font-bold text-slate-900 text-sm">{a.title}</h5>
                  </div>
                  {a.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{a.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      Due: {new Date(a.dueDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5 text-purple-600" />
                      {(a.examId || 'general').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dedicated Modal Dialog for Creating New Batch
// ---------------------------------------------------------------------------

function CreateBatchModal({
  institutionId,
  onClose,
  onCreated,
}: {
  institutionId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [cohortTier, setCohortTier] = useState<string>('foundation');
  const [targetExam, setTargetExam] = useState<string>('jee-main');
  const [capacity, setCapacity] = useState(60);
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
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
      onCreated();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Create New Batch</h3>
              <p className="text-xs text-slate-500">Configure curriculum, target exam & student capacity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 py-5">
          <div>
            <Label className="text-xs font-bold text-slate-700">Batch Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. JEE 2026 Riser — Batch C"
              className="mt-1 bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-slate-700">Cohort Tier</Label>
              <Select value={cohortTier} onValueChange={setCohortTier}>
                <SelectTrigger className="mt-1 bg-slate-50"><SelectValue /></SelectTrigger>
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
              <Label className="text-xs font-bold text-slate-700">Target Exam</Label>
              <Select value={targetExam} onValueChange={setTargetExam}>
                <SelectTrigger className="mt-1 bg-slate-50"><SelectValue /></SelectTrigger>
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
          </div>

          <div>
            <Label className="text-xs font-bold text-slate-700">Student Capacity</Label>
            <Input
              type="number"
              value={capacity}
              onChange={e => setCapacity(Number(e.target.value) || 60)}
              className="mt-1 bg-slate-50"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} className="font-bold text-xs">
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={creating || !name.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
          >
            {creating ? 'Creating Batch...' : 'Create Batch'}
          </Button>
        </div>
      </div>
    </div>
  );
}
