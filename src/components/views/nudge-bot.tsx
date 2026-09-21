'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared';
import { useStore } from '@/lib/store';
import {
  MessageCircle, Send, Clock, Bell, Brain, Camera, Settings,
  Loader2, RefreshCw, CheckCircle2, AlertTriangle, Zap, Heart,
  Calendar, Flame, Target, BookOpen, Smartphone, Volume2, Moon,
  Sun, Languages, ExternalLink, Copy,
} from 'lucide-react';

// ============================================================================
// Types matching API responses
// ============================================================================

type NudgeType = 'spaced-repetition' | 'daily-plan' | 'streak-warning' | 'weak-topic-drill' | 'exam-countdown' | 'battle-invite' | 'doubt-photo-prompt' | 'wellness-check';
type NudgeChannel = 'whatsapp' | 'telegram' | 'in-app';
type NudgeStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'acknowledged' | 'snoozed' | 'failed';

interface Nudge {
  id: string;
  userId: string;
  type: NudgeType;
  channel: NudgeChannel;
  recipient: string;
  message: string;
  appDeepLink?: string;
  imageUrl?: string;
  scheduledFor: string;
  sentAt?: string;
  status: NudgeStatus;
  snoozedUntil?: string;
  snoozeCount: number;
  metadata?: {
    spacedRepetitionStep?: number;
    topic?: string;
    subject?: string;
    questionId?: string;
    streakDays?: number;
    daysToExam?: number;
  };
  isOneTap?: boolean;
}

interface NudgePreferences {
  userId: string;
  enabled: boolean;
  whatsappEnabled: boolean;
  telegramEnabled: boolean;
  inAppEnabled: boolean;
  whatsappPhone?: string;
  telegramChatId?: string;
  quietHoursStart: number;
  quietHoursEnd: number;
  morningNudgeTime: string;
  eveningNudgeTime: string;
  maxNudgesPerDay: number;
  enabledTypes: Record<NudgeType, boolean>;
  language: string;
}

// ============================================================================
// Type metadata
// ============================================================================

const TYPE_META: Record<NudgeType, { label: string; icon: React.ReactNode; color: string }> = {
  'spaced-repetition': { label: 'Spaced Repetition', icon: <Brain className="h-3 w-3" />, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'daily-plan': { label: 'Daily Plan', icon: <Calendar className="h-3 w-3" />, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  'streak-warning': { label: 'Streak Warning', icon: <Flame className="h-3 w-3" />, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  'weak-topic-drill': { label: 'Weak Topic Drill', icon: <Target className="h-3 w-3" />, color: 'bg-rose-50 text-rose-700 border-rose-200' },
  'exam-countdown': { label: 'Exam Countdown', icon: <Clock className="h-3 w-3" />, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'battle-invite': { label: 'Battle Invite', icon: <Zap className="h-3 w-3" />, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  'doubt-photo-prompt': { label: 'Doubt Photo', icon: <Camera className="h-3 w-3" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'wellness-check': { label: 'Wellness Check', icon: <Heart className="h-3 w-3" />, color: 'bg-pink-50 text-pink-700 border-pink-200' },
};

const STATUS_META: Record<NudgeStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-stone-100 text-stone-700 border-stone-300' },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  delivered: { label: 'Delivered', color: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
  read: { label: 'Read', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  acknowledged: { label: 'Acknowledged', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  snoozed: { label: 'Snoozed', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  failed: { label: 'Failed', color: 'bg-rose-100 text-rose-700 border-rose-300' },
};

const CHANNEL_META: Record<NudgeChannel, { label: string; icon: React.ReactNode }> = {
  whatsapp: { label: 'WhatsApp', icon: <MessageCircle className="h-3 w-3" /> },
  telegram: { label: 'Telegram', icon: <Send className="h-3 w-3" /> },
  'in-app': { label: 'In-app', icon: <Bell className="h-3 w-3" /> },
};

// ============================================================================
// Main view
// ============================================================================

export function NudgeBotView() {
  const user = useStore(s => s.user);
  const userId = user?.id ?? 'demo_user';
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [prefs, setPrefs] = useState<NudgePreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [generated, setGenerated] = useState<{ created: number; skipped: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/nudge/queue?userId=${userId}&processDue=true`);
      if (r.ok) {
        const j = await r.json();
        setNudges(j.nudges ?? []);
        setPrefs(j.preferences);
        setGenerated(j.generated);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const sendNow = async (nudgeId: string) => {
    await fetch('/api/nudge/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nudgeId }),
    });
    load();
  };

  const ackNudge = async (nudgeId: string) => {
    await fetch('/api/nudge/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nudgeId, action: 'acknowledge' }),
    });
    load();
  };

  const snoozeNudge = async (nudgeId: string, hours: number) => {
    const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    await fetch('/api/nudge/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nudgeId, action: 'snooze', snoozeUntil: until }),
    });
    load();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-stone-600">Loading your nudge queue…</p>
      </div>
    );
  }

  const pending = nudges.filter(n => n.status === 'pending');
  const sent = nudges.filter(n => ['sent', 'delivered', 'read', 'acknowledged'].includes(n.status));
  const snoozed = nudges.filter(n => n.status === 'snoozed');

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp / Telegram Nudge Bot"
        subtitle="Spaced-repetition reminders, streak warnings, weak-topic drills — delivered to your phone"
        accent="blue"
        icon={MessageCircle}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NudgeKpi label="Pending" value={pending.length} icon={<Clock className="h-5 w-5" />} color="amber" sub="Waiting to send" />
        <NudgeKpi label="Sent Today" value={sent.length} icon={<CheckCircle2 className="h-5 w-5" />} color="emerald" sub={`${sent.filter(n => n.status === 'acknowledged').length} acknowledged`} />
        <NudgeKpi label="Snoozed" value={snoozed.length} icon={<Moon className="h-5 w-5" />} color="blue" sub="Re-scheduled" />
        <NudgeKpi label="Generated" value={generated?.created ?? 0} icon={<Brain className="h-5 w-5" />} color="purple" sub={`${generated?.skipped ?? 0} skipped (not due yet)`} />
      </div>

      <Tabs defaultValue="queue">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="queue"><Bell className="h-4 w-4 mr-1 inline" />Nudge Queue</TabsTrigger>
          <TabsTrigger value="spaced"><Brain className="h-4 w-4 mr-1 inline" />Spaced Repetition</TabsTrigger>
          <TabsTrigger value="1tap"><Camera className="h-4 w-4 mr-1 inline" />1-Tap Doubt</TabsTrigger>
          <TabsTrigger value="prefs"><Settings className="h-4 w-4 mr-1 inline" />Preferences</TabsTrigger>
        </TabsList>

        {/* Queue tab */}
        <TabsContent value="queue" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-stone-800">Today's Nudges</h3>
            <Button variant="ghost" size="sm" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
          </div>
          {nudges.length === 0 ? (
            <Card className="p-8 text-center text-stone-500">
              <Bell className="h-10 w-10 text-stone-300 mx-auto mb-2" />
              No nudges yet. Take a mock exam or check back later.
            </Card>
          ) : (
            <div className="space-y-3">
              {nudges.slice(0, 30).map(nudge => (
                <NudgeCard
                  key={nudge.id}
                  nudge={nudge}
                  onSend={() => sendNow(nudge.id)}
                  onAck={() => ackNudge(nudge.id)}
                  onSnooze={(h) => snoozeNudge(nudge.id, h)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Spaced repetition tab */}
        <TabsContent value="spaced" className="space-y-4">
          <Card className="p-5 border-blue-200">
            <h3 className="font-semibold text-stone-800 mb-2 flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              How Spaced Repetition Works
            </h3>
            <p className="text-sm text-stone-700 leading-relaxed mb-3">
              For every wrong answer in your Error Journal, we schedule a review nudge at increasing intervals:
              1 day → 3 days → 7 days → 14 days → 30 days. Each review locks the concept deeper into long-term memory.
            </p>
            <div className="grid grid-cols-5 gap-2">
              {['1 day', '3 days', '1 week', '2 weeks', '1 month'].map((interval, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-center">
                  <p className="text-xs font-mono text-blue-700">Step {idx + 1}</p>
                  <p className="text-xs text-stone-600">{interval}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Current spaced-repetition nudges */}
          <div>
            <h4 className="font-semibold text-stone-800 mb-2">Upcoming Reviews</h4>
            {nudges.filter(n => n.type === 'spaced-repetition').length === 0 ? (
              <Card className="p-6 text-center text-stone-500">
                No spaced-repetition nudges scheduled. Make some mistakes in mock exams — they'll show up here!
              </Card>
            ) : (
              <div className="space-y-3">
                {nudges.filter(n => n.type === 'spaced-repetition').map(nudge => (
                  <NudgeCard
                    key={nudge.id}
                    nudge={nudge}
                    onSend={() => sendNow(nudge.id)}
                    onAck={() => ackNudge(nudge.id)}
                    onSnooze={(h) => snoozeNudge(nudge.id, h)}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 1-tap doubt tab */}
        <TabsContent value="1tap" className="space-y-4">
          <OneTapDoubtTab userId={userId} onCreated={load} />
        </TabsContent>

        {/* Preferences tab */}
        <TabsContent value="prefs" className="space-y-4">
          {prefs && <PreferencesTab userId={userId} prefs={prefs} onUpdate={load} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// Nudge KPI card
// ============================================================================

function NudgeKpi({ label, value, icon, color, sub }: {
  label: string; value: string | number; icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'amber' | 'purple'; sub?: string;
}) {
  const colors: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
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

// ============================================================================
// Nudge card — renders a single nudge with WhatsApp-style preview
// ============================================================================

function NudgeCard({ nudge, onSend, onAck, onSnooze }: {
  nudge: Nudge;
  onSend: () => void;
  onAck: () => void;
  onSnooze: (hours: number) => void;
}) {
  const typeMeta = TYPE_META[nudge.type];
  const statusMeta = STATUS_META[nudge.status];
  const channelMeta = CHANNEL_META[nudge.channel];

  const [copied, setCopied] = useState(false);

  const copyMessage = () => {
    navigator.clipboard?.writeText(nudge.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-4 border-blue-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-xs ${typeMeta.color}`}>
            {typeMeta.icon}
            <span className="ml-1">{typeMeta.label}</span>
          </Badge>
          <Badge variant="outline" className="text-xs bg-stone-50 text-stone-700 border-stone-200">
            {channelMeta.icon}
            <span className="ml-1">{channelMeta.label}</span>
          </Badge>
          <Badge variant="outline" className={`text-xs ${statusMeta.color}`}>
            {statusMeta.label}
          </Badge>
          {nudge.isOneTap && (
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
              <Camera className="h-3 w-3 mr-1" />1-tap
            </Badge>
          )}
        </div>
        <span className="text-xs text-stone-500">
          {new Date(nudge.scheduledFor).toLocaleString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* WhatsApp-style message preview */}
      <div className="bg-[#e5ddd5] rounded-lg p-3 mb-3 relative">
        <div className="bg-[#dcf8c6] rounded-lg p-2.5 ml-auto max-w-[90%] shadow-sm">
          <p className="text-sm text-stone-800 whitespace-pre-wrap">{nudge.message}</p>
          <span className="text-[10px] text-stone-500 float-right mt-1">
            {new Date(nudge.scheduledFor).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
            <CheckCircle2 className="inline h-3 w-3 ml-1 text-blue-500" />
          </span>
        </div>
      </div>

      {/* Metadata */}
      {nudge.metadata && Object.keys(nudge.metadata).length > 0 && (
        <div className="text-xs text-stone-500 mb-2 space-y-0.5">
          {nudge.metadata.subject && <p>📊 {nudge.metadata.subject} → {nudge.metadata.topic}</p>}
          {nudge.metadata.spacedRepetitionStep !== undefined && <p>🔁 Step {nudge.metadata.spacedRepetitionStep + 1}/5</p>}
          {nudge.metadata.streakDays !== undefined && <p>🔥 {nudge.metadata.streakDays}-day streak</p>}
          {nudge.metadata.daysToExam !== undefined && <p>📅 {nudge.metadata.daysToExam} days to exam</p>}
        </div>
      )}

      {/* Deep link */}
      {nudge.appDeepLink && (
        <a
          href={`https://${nudge.appDeepLink}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mb-2"
        >
          <ExternalLink className="h-3 w-3" />
          {nudge.appDeepLink}
        </a>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap mt-2">
        {nudge.status === 'pending' && (
          <Button size="sm" onClick={onSend}>
            <Send className="h-3 w-3 mr-1" />Send Now
          </Button>
        )}
        {['sent', 'delivered', 'read'].includes(nudge.status) && (
          <Button size="sm" variant="outline" onClick={onAck}>
            <CheckCircle2 className="h-3 w-3 mr-1" />Acknowledge
          </Button>
        )}
        {nudge.status !== 'acknowledged' && nudge.status !== 'failed' && (
          <>
            <Button size="sm" variant="ghost" onClick={() => onSnooze(1)}>Snooze 1h</Button>
            <Button size="sm" variant="ghost" onClick={() => onSnooze(4)}>4h</Button>
            <Button size="sm" variant="ghost" onClick={() => onSnooze(24)}>Tomorrow</Button>
          </>
        )}
        <Button size="sm" variant="ghost" onClick={copyMessage} className="ml-auto">
          {copied ? <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> : <Copy className="h-3 w-3 mr-1" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
    </Card>
  );
}

// ============================================================================
// 1-tap doubt tab
// ============================================================================

function OneTapDoubtTab({ userId, onCreated }: { userId: string; onCreated: () => void }) {
  const [creating, setCreating] = useState(false);
  const [createdNudge, setCreatedNudge] = useState<Nudge | null>(null);

  const create = async () => {
    setCreating(true);
    try {
      const r = await fetch('/api/nudge/doubt-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (r.ok) {
        const j = await r.json();
        setCreatedNudge(j.nudge);
        onCreated();
      } else {
        const err = await r.json();
        alert(err.error || 'Failed to create nudge');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5 border-emerald-200 bg-gradient-to-br from-emerald-50 to-cyan-50">
        <h3 className="font-semibold text-stone-800 mb-2 flex items-center gap-2">
          <Camera className="h-5 w-5 text-emerald-500" />
          1-Tap Doubt Photo Upload
        </h3>
        <p className="text-sm text-stone-700 leading-relaxed mb-3">
          Snap a photo of any problem — handwritten, textbook, or diagram — and send it to the bot.
          The AI will read it and guide you step-by-step via Socratic mode.
        </p>
        <ol className="text-sm text-stone-700 space-y-1 list-decimal list-inside mb-3">
          <li>Save the bot number to your phone contacts.</li>
          <li>Open WhatsApp / Telegram and find "PreparationAI Bot".</li>
          <li>Send a photo of your problem with caption "solve this".</li>
          <li>The bot replies within ~30 seconds with Socratic guidance.</li>
        </ol>
        <Button onClick={create} disabled={creating} className="w-full">
          {creating ? (
            <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Creating nudge…</>
          ) : (
            <><Camera className="h-4 w-4 mr-1" />Generate 1-Tap Nudge Now</>
          )}
        </Button>
      </Card>

      {createdNudge && (
        <Card className="p-4 border-emerald-200">
          <h4 className="font-semibold text-stone-800 mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            1-Tap Nudge Created
          </h4>
          <NudgeCard
            nudge={createdNudge}
            onSend={() => {}}
            onAck={() => {}}
            onSnooze={() => {}}
          />
        </Card>
      )}

      <Card className="p-4 border-stone-200 bg-stone-50/50">
        <h4 className="font-semibold text-stone-800 mb-2 flex items-center gap-2 text-sm">
          <Smartphone className="h-4 w-4 text-stone-500" />
          Bot Setup (Admin)
        </h4>
        <p className="text-xs text-stone-600 mb-2">
          To enable real WhatsApp/Telegram delivery (currently simulated):
        </p>
        <ul className="text-xs text-stone-700 space-y-1 list-disc list-inside">
          <li><strong>WhatsApp:</strong> Register a WhatsApp Business API account, get a token, set the webhook URL to <code className="font-mono bg-stone-100 px-1">/api/nudge/webhook/whatsapp</code></li>
          <li><strong>Telegram:</strong> Create a bot via <code className="font-mono bg-stone-100 px-1">@BotFather</code>, get the API token, set webhook to <code className="font-mono bg-stone-100 px-1">/api/nudge/webhook/telegram</code></li>
          <li>Add tokens to <code className="font-mono bg-stone-100 px-1">.env.local</code> as <code className="font-mono bg-stone-100 px-1">WHATSAPP_API_TOKEN</code> and <code className="font-mono bg-stone-100 px-1">TELEGRAM_BOT_TOKEN</code></li>
        </ul>
      </Card>
    </div>
  );
}

// ============================================================================
// Preferences tab
// ============================================================================

function PreferencesTab({ userId, prefs, onUpdate }: {
  userId: string;
  prefs: NudgePreferences;
  onUpdate: () => void;
}) {
  const [localPrefs, setLocalPrefs] = useState<NudgePreferences>(prefs);
  const [saving, setSaving] = useState(false);

  const update = async (updates: Partial<NudgePreferences>) => {
    setSaving(true);
    try {
      await fetch('/api/nudge/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates }),
      });
      setLocalPrefs(prev => ({ ...prev, ...updates }));
      onUpdate();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Master toggle */}
      <Card className="p-4 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-stone-800 flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-500" />
              Nudge Bot
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">Master switch — turn all nudges off</p>
          </div>
          <Switch
            checked={localPrefs.enabled}
            onCheckedChange={(v) => update({ enabled: v })}
            disabled={saving}
          />
        </div>
      </Card>

      {/* Channels */}
      <Card className="p-4 border-blue-200">
        <h3 className="font-semibold text-stone-800 mb-3 text-sm">Delivery Channels</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <MessageCircle className="h-4 w-4 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-stone-700">WhatsApp</p>
                <Input
                  value={localPrefs.whatsappPhone ?? ''}
                  onChange={(e) => setLocalPrefs(prev => ({ ...prev, whatsappPhone: e.target.value }))}
                  onBlur={(e) => update({ whatsappPhone: e.target.value })}
                  placeholder="+91-9876543210"
                  className="h-7 text-xs mt-1"
                />
              </div>
            </div>
            <Switch
              checked={localPrefs.whatsappEnabled}
              onCheckedChange={(v) => update({ whatsappEnabled: v })}
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Send className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-stone-700">Telegram</p>
                <Input
                  value={localPrefs.telegramChatId ?? ''}
                  onChange={(e) => setLocalPrefs(prev => ({ ...prev, telegramChatId: e.target.value }))}
                  onBlur={(e) => update({ telegramChatId: e.target.value })}
                  placeholder="@username or chat ID"
                  className="h-7 text-xs mt-1"
                />
              </div>
            </div>
            <Switch
              checked={localPrefs.telegramEnabled}
              onCheckedChange={(v) => update({ telegramEnabled: v })}
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-stone-500" />
              <p className="text-sm font-medium text-stone-700">In-app notifications</p>
            </div>
            <Switch
              checked={localPrefs.inAppEnabled}
              onCheckedChange={(v) => update({ inAppEnabled: v })}
              disabled={saving}
            />
          </div>
        </div>
      </Card>

      {/* Quiet hours */}
      <Card className="p-4 border-blue-200">
        <h3 className="font-semibold text-stone-800 mb-3 text-sm flex items-center gap-2">
          <Moon className="h-4 w-4 text-blue-500" />
          Quiet Hours
        </h3>
        <p className="text-xs text-stone-500 mb-3">No nudges during these hours — sleep is important for retention.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-stone-500 flex items-center gap-1"><Moon className="h-3 w-3" />Start (24h)</Label>
            <Select
              value={String(localPrefs.quietHoursStart)}
              onValueChange={(v) => update({ quietHoursStart: parseInt(v) })}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>{i.toString().padStart(2, '0')}:00</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-stone-500 flex items-center gap-1"><Sun className="h-3 w-3" />End (24h)</Label>
            <Select
              value={String(localPrefs.quietHoursEnd)}
              onValueChange={(v) => update({ quietHoursEnd: parseInt(v) })}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>{i.toString().padStart(2, '0')}:00</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Nudge types */}
      <Card className="p-4 border-blue-200">
        <h3 className="font-semibold text-stone-800 mb-3 text-sm flex items-center gap-2">
          <Settings className="h-4 w-4 text-blue-500" />
          Nudge Types
        </h3>
        <div className="space-y-2">
          {(Object.keys(localPrefs.enabledTypes) as NudgeType[]).map(type => {
            const meta = TYPE_META[type];
            return (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${meta.color}`}>
                    {meta.icon}
                    <span className="ml-1">{meta.label}</span>
                  </Badge>
                </div>
                <Switch
                  checked={localPrefs.enabledTypes[type]}
                  onCheckedChange={(v) => {
                    const newTypes = { ...localPrefs.enabledTypes, [type]: v };
                    update({ enabledTypes: newTypes });
                  }}
                  disabled={saving}
                />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Daily cap + language */}
      <Card className="p-4 border-blue-200">
        <h3 className="font-semibold text-stone-800 mb-3 text-sm">Frequency & Language</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-stone-500">Max nudges per day</Label>
            <Select
              value={String(localPrefs.maxNudgesPerDay)}
              onValueChange={(v) => update({ maxNudgesPerDay: parseInt(v) })}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 5, 10].map(n => (
                  <SelectItem key={n} value={String(n)}>{n} per day</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-stone-500 flex items-center gap-1"><Languages className="h-3 w-3" />Language</Label>
            <Select
              value={localPrefs.language}
              onValueChange={(v) => update({ language: v })}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="hi">🇮🇳 हिन्दी</SelectItem>
                <SelectItem value="es">🇪🇸 Español</SelectItem>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
    </div>
  );
}
