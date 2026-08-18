'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared';
import { useStore } from '@/lib/store';
import {
  Shield, ShieldCheck, ShieldAlert, Activity, AlertTriangle, Lock, Brain,
  RefreshCw, FlaskConical, ScrollText, Ban, GraduationCap, Eye, EyeOff,
} from 'lucide-react';

interface AuditEntry {
  auditId: string;
  timestamp: string;
  agent: string;
  userId?: string;
  verdict: string;
  reason: string;
  matchedPolicies: string[];
  promptDigest: string;
  responseDigest?: string;
  responseBlocked: boolean;
}

interface Stats {
  total: number;
  allowed: number;
  blocked: number;
  socratic: number;
  byAgent: Record<string, number>;
  topPolicies: { policyId: string; count: number }[];
}

const VERDICT_COLORS: Record<string, string> = {
  allowed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  socratic: 'bg-blue-100 text-blue-700 border-blue-300',
  'blocked-off-topic': 'bg-amber-100 text-amber-700 border-amber-300',
  'blocked-unsafe': 'bg-rose-100 text-rose-700 border-rose-300',
  'blocked-pii': 'bg-purple-100 text-purple-700 border-purple-300',
};

const AGENT_LABELS: Record<string, string> = {
  mentor: 'AI Mentor',
  'exam-news': 'Exam News',
  'academic-analyzer': 'Academic Analyzer',
  'mock-generator': 'Mock Generator',
  'doubt-solver': 'Doubt Solver',
  'digital-twin': 'Digital Twin',
  'success-simulator': 'Success Simulator',
  'wellness-counsellor': 'Wellness Counsellor',
  'institution-analyzer': 'Institution Analyzer',
};

export function GuardrailDashboardView() {
  const user = useStore(s => s.user);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Test panel state
  const [testPrompt, setTestPrompt] = useState('');
  const [testAgent, setTestAgent] = useState('mentor');
  const [testMinor, setTestMinor] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/guardrail-stats');
      if (r.ok) {
        const j = await r.json();
        setStats(j.stats);
        setRecent(j.recent);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  const runTest = async () => {
    if (!testPrompt.trim()) return;
    setTesting(true);
    try {
      const r = await fetch('/api/guardrail-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testPrompt,
          agent: testAgent,
          isMinor: testMinor,
          userId: user?.id,
          examGoal: user?.examGoal,
        }),
      });
      const j = await r.json();
      setTestResult(j.decision);
    } finally {
      setTesting(false);
    }
  };

  const verdictRate = stats && stats.total > 0 ? Math.round((stats.allowed / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Guardrail Dashboard"
        subtitle="EduScope — the shared safety layer every AI agent routes through"
        accent="blue"
        icon={Shield}
      />

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total AI Calls"
          value={stats?.total ?? 0}
          icon={<Activity className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          label="Allowed"
          value={stats?.allowed ?? 0}
          icon={<ShieldCheck className="h-5 w-5" />}
          color="emerald"
          sub={stats ? `${verdictRate}% pass rate` : undefined}
        />
        <StatCard
          label="Blocked"
          value={stats?.blocked ?? 0}
          icon={<Ban className="h-5 w-5" />}
          color="rose"
        />
        <StatCard
          label="Socratic Mode"
          value={stats?.socratic ?? 0}
          icon={<GraduationCap className="h-5 w-5" />}
          color="amber"
          sub="Guide-don't-tell"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Policy hits */}
        <Card className="p-5 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Top Policies Fired
            </h3>
            <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="space-y-2">
            {stats && stats.topPolicies.length > 0 ? (
              stats.topPolicies.map(p => (
                <div key={p.policyId} className="flex items-center justify-between p-2 rounded bg-stone-50">
                  <span className="font-mono text-xs text-stone-600">{p.policyId}</span>
                  <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                    {p.count}× fired
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-400 italic">No policy hits yet — your prompts are well-scoped.</p>
            )}
          </div>

          {/* By-agent breakdown */}
          <div className="mt-5 border-t border-stone-100 pt-4">
            <h4 className="text-xs font-semibold text-stone-500 uppercase mb-2">Calls by Agent</h4>
            <div className="space-y-1.5">
              {stats && Object.entries(stats.byAgent).length > 0 ? (
                Object.entries(stats.byAgent)
                  .sort((a, b) => b[1] - a[1])
                  .map(([agent, count]) => (
                    <div key={agent} className="flex items-center justify-between text-sm">
                      <span className="text-stone-700">{AGENT_LABELS[agent] ?? agent}</span>
                      <span className="font-mono text-stone-500">{count}</span>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-stone-400 italic">No AI agent activity yet.</p>
              )}
            </div>
          </div>
        </Card>

        {/* Test panel */}
        <Card className="p-5 border-blue-200">
          <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-blue-500" />
            Prompt Sandbox
          </h3>
          <p className="text-xs text-stone-500 mb-3">
            Test how EduScope evaluates a prompt — see verdict, matched policies, PII redaction and
            Socratic reframe without calling the underlying model.
          </p>

          <div className="space-y-3">
            <div>
              <Label className="text-xs text-stone-500">Agent</Label>
              <Select value={testAgent} onValueChange={setTestAgent}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(AGENT_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-stone-500">Prompt to test</Label>
              <Input
                value={testPrompt}
                onChange={e => setTestPrompt(e.target.value)}
                placeholder="e.g. just give me the answer to this physics problem"
                className="mt-1"
              />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={testMinor}
                onChange={e => setTestMinor(e.target.checked)}
                className="rounded border-stone-300"
              />
              Simulate minor user (under 18)
            </label>

            <Button onClick={runTest} disabled={testing || !testPrompt.trim()} className="w-full">
              {testing ? 'Evaluating…' : 'Evaluate Prompt'}
            </Button>

            {testResult && (
              <div className="mt-2 p-3 rounded-lg bg-stone-50 border border-stone-200 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">Verdict</span>
                  <Badge className={VERDICT_COLORS[testResult.verdict] ?? 'bg-stone-100 text-stone-700'}>
                    {testResult.verdict}
                  </Badge>
                </div>
                <div>
                  <span className="text-xs text-stone-500">Reason</span>
                  <p className="text-stone-800 mt-0.5">{testResult.reason}</p>
                </div>
                {testResult.matchedPolicies.length > 0 && (
                  <div>
                    <span className="text-xs text-stone-500">Matched policies</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {testResult.matchedPolicies.map((p: string) => (
                        <Badge key={p} variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 text-xs">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {testResult.socraticReframe && (
                  <div>
                    <span className="text-xs text-stone-500">Socratic reframe</span>
                    <p className="text-stone-700 mt-0.5 italic bg-blue-50 p-2 rounded border border-blue-100">
                      {testResult.socraticReframe}
                    </p>
                  </div>
                )}
                {testResult.sanitizedPrompt !== testPrompt && (
                  <div>
                    <span className="text-xs text-stone-500">Sanitized prompt (PII redacted)</span>
                    <p className="text-stone-700 mt-0.5 font-mono text-xs bg-purple-50 p-2 rounded border border-purple-100">
                      {testResult.sanitizedPrompt}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Audit log */}
      <Card className="p-5 border-blue-200">
        <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-blue-500" />
          Recent Audit Trail
          <Badge variant="outline" className="ml-2 bg-stone-50 text-stone-600">
            Last {recent.length} calls
          </Badge>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-stone-500 uppercase border-b border-stone-200">
                <th className="text-left py-2 px-2">Time</th>
                <th className="text-left py-2 px-2">Agent</th>
                <th className="text-left py-2 px-2">Verdict</th>
                <th className="text-left py-2 px-2">Reason</th>
                <th className="text-left py-2 px-2">Policies</th>
                <th className="text-left py-2 px-2">Digest</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-stone-400 italic">
                    No AI calls recorded yet. Take a mock exam or chat with the mentor to populate this log.
                  </td>
                </tr>
              ) : (
                recent.map(e => (
                  <tr key={e.auditId} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className="py-2 px-2 text-xs text-stone-500 whitespace-nowrap">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-2 text-stone-700">{AGENT_LABELS[e.agent] ?? e.agent}</td>
                    <td className="py-2 px-2">
                      <Badge className={VERDICT_COLORS[e.verdict] ?? 'bg-stone-100 text-stone-700'}>
                        {e.verdict}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-xs text-stone-600 max-w-xs truncate" title={e.reason}>
                      {e.reason}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex flex-wrap gap-1">
                        {e.matchedPolicies.length === 0 ? (
                          <span className="text-xs text-stone-400">—</span>
                        ) : (
                          e.matchedPolicies.map(p => (
                            <Badge key={p} variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                              {p}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2 font-mono text-xs text-stone-400">
                      {e.promptDigest}
                      {e.responseBlocked && (
                        <Lock className="inline h-3 w-3 ml-1 text-rose-500" />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Layer explainer */}
      <Card className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Brain className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-stone-800 mb-1">How EduScope works</h3>
            <p className="text-sm text-stone-700 leading-relaxed">
              Every outbound prompt to any AI agent (mentor, exam-news, academic-analyzer, doubt-solver, …)
              is passed through a 5-stage pipeline: <strong>PII redaction</strong> →{' '}
              <strong>Socratic reframe detection</strong> → <strong>off-topic scope check</strong> →{' '}
              <strong>hard safety filter</strong> → <strong>system-prompt hardening</strong> (minor-safety,
              Socratic clause, scope clamp, identity lock, audit notice). The model's response is also
              inspected before being returned to the UI — leaked PII is redacted and unsafe responses
              are replaced. Every call leaves a tamper-evident audit entry that you see above.
            </p>
            <p className="text-xs text-stone-500 mt-2">
              This is a shared layer — adding a new AI agent means routing it through EduScope, not
              writing a new prompt from scratch. That's how we keep jailbreak surface area bounded.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'rose' | 'amber';
  sub?: string;
}) {
  const colors: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };
  return (
    <Card className={`p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase opacity-80">{label}</span>
        <div className="opacity-80">{icon}</div>
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs opacity-70 mt-1">{sub}</div>}
    </Card>
  );
}
