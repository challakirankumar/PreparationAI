'use client';

import * as React from 'react';
import {
  Settings as SettingsIcon,
  User as UserIcon,
  Mail,
  Phone,
  Globe,
  Camera,
  Shield,
  Lock,
  Trash2,
  CheckCircle2,
  GraduationCap,
  Plus,
  X,
  Upload,
  Loader2,
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  BookOpen,
  Calendar,
  Moon,
  Bell,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  Lightbulb,
  Rocket,
  ClipboardList,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared';
import { useStore, uidGen } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { AcademicRecord, AcademicAnalysis } from '@/lib/types';

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Singapore', 'United Arab Emirates',
  'Nepal', 'Bangladesh', 'Sri Lanka', 'Pakistan', 'Other',
];

const USER_TYPE_LABEL: Record<string, string> = {
  'school-11': 'Class 11 Student',
  'school-12': 'Class 12 Student',
  'ug': 'Undergraduate',
  'grad': 'Graduate / Professional',
};

interface SubjectRow {
  id: string;
  name: string;
  marks: string;
  maxMarks: string;
  grade: string;
}

function emptySubjectRow(): SubjectRow {
  return { id: uidGen(), name: '', marks: '', maxMarks: '', grade: '' };
}

function clampPct(n: number): number {
  if (!isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function SettingsView() {
  const user = useStore((s) => s.user);
  const updateProfile = useStore((s) => s.updateProfile);
  const addAcademicRecord = useStore((s) => s.addAcademicRecord);
  const updateAcademicRecord = useStore((s) => s.updateAcademicRecord);
  const removeAcademicRecord = useStore((s) => s.removeAcademicRecord);
  const logout = useStore((s) => s.logout);
  const registeredUsers = useStore((s) => s.registeredUsers);
  const { toast } = useToast();

  // ---- Profile state (mirrors user until saved) ----
  const [name, setName] = React.useState(user?.name || '');
  const [phone, setPhone] = React.useState(user?.phone || '');
  const [country, setCountry] = React.useState(user?.country || 'India');

  React.useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setCountry(user.country || 'India');
      setDarkMode(!!user.darkMode);
    }
  }, [user?.id]);

  // ---- Avatar upload (FileReader → base64 → updateProfile) ----
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Image too large',
        description: 'Please pick an image under 2 MB.',
        variant: 'destructive',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      updateProfile({ avatar: base64 });
      toast({ title: 'Avatar updated' });
    };
    reader.onerror = () =>
      toast({ title: 'Failed to read file', variant: 'destructive' });
    reader.readAsDataURL(file);
    // Reset the input so picking the same file again re-fires onChange
    e.target.value = '';
  }

  function saveProfile() {
    if (!user) return;
    updateProfile({
      name: name.trim() || user.name || 'Aspirant',
      phone: phone.trim(),
      country,
    });
    toast({ title: 'Profile saved' });
  }

  function resetProfile() {
    if (!user) return;
    setName(user.name || '');
    setPhone(user.phone || '');
    setCountry(user.country || 'India');
  }

  // ---- Security: change password (validates against registeredUsers[email].password) ----
  const [currentPw, setCurrentPw] = React.useState('');
  const [newPw, setNewPw] = React.useState('');
  const [confirmPw, setConfirmPw] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);

  function changePassword() {
    if (!user) return;
    const email = user.email.toLowerCase().trim();
    const saved = registeredUsers[email];
    const storedPw = saved?.password || '';
    if (currentPw !== storedPw) {
      toast({ title: 'Current password is incorrect', variant: 'destructive' });
      return;
    }
    if (newPw.length < 6) {
      toast({
        title: 'New password too short',
        description: 'At least 6 characters.',
        variant: 'destructive',
      });
      return;
    }
    if (newPw !== confirmPw) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    // Update password in registeredUsers via useStore.setState.
    useStore.setState((s) => ({
      registeredUsers: {
        ...s.registeredUsers,
        [email]: {
          ...(s.registeredUsers[email] || { user, password: '', attempts: [], seenSignatures: [], mentorMessages: [] }),
          password: newPw,
        },
      },
    }));
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    toast({
      title: 'Password updated',
      description: 'Use your new password next time you log in.',
    });
  }

  // ---- Security: delete account with AlertDialog confirmation ----
  function deleteAccount() {
    if (!user) return;
    const email = user.email.toLowerCase().trim();
    useStore.setState((s) => {
      const next = { ...s.registeredUsers };
      delete next[email];
      return { registeredUsers: next };
    });
    toast({
      title: 'Account deleted',
      description: 'All your data has been removed from this device.',
    });
    logout();
  }

  // ---- Academic records: upload dialog state ----
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [examName, setExamName] = React.useState('');
  const [institution, setInstitution] = React.useState('');
  const [examDate, setExamDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  );
  const [subjects, setSubjects] = React.useState<SubjectRow[]>([
    emptySubjectRow(),
    emptySubjectRow(),
    emptySubjectRow(),
  ]);
  const [analyzing, setAnalyzing] = React.useState(false);

  const [analysisRecord, setAnalysisRecord] = React.useState<AcademicRecord | null>(null);

  function resetUploadForm() {
    setExamName('');
    setInstitution('');
    setExamDate(new Date().toISOString().slice(0, 10));
    setSubjects([emptySubjectRow(), emptySubjectRow(), emptySubjectRow()]);
  }

  function updateSubject(id: string, field: keyof SubjectRow, value: string) {
    setSubjects((curr) =>
      curr.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  function addSubject() {
    setSubjects((curr) => [...curr, emptySubjectRow()]);
  }

  function removeSubject(id: string) {
    setSubjects((curr) => (curr.length <= 1 ? curr : curr.filter((s) => s.id !== id)));
  }

  const totals = React.useMemo(() => {
    let totalMarks = 0;
    let maxMarks = 0;
    for (const s of subjects) {
      const m = parseFloat(s.marks);
      const mx = parseFloat(s.maxMarks);
      if (!isNaN(m)) totalMarks += m;
      if (!isNaN(mx)) maxMarks += mx;
    }
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
    return { totalMarks, maxMarks, percentage };
  }, [subjects]);

  async function saveAndAnalyze() {
    if (!user) return;
    if (!examName.trim()) {
      toast({ title: 'Enter exam name', variant: 'destructive' });
      return;
    }
    const validSubjects = subjects.filter(
      (s) => s.name.trim() && s.maxMarks.trim() !== ''
    );
    if (validSubjects.length === 0) {
      toast({
        title: 'Add at least one subject with marks',
        variant: 'destructive',
      });
      return;
    }

    const record: AcademicRecord = {
      id: uidGen(),
      examName: examName.trim(),
      institution: institution.trim() || undefined,
      date: examDate,
      uploadedAt: new Date().toISOString(),
      subjects: validSubjects.map((s) => ({
        name: s.name.trim(),
        marks: parseFloat(s.marks) || 0,
        maxMarks: parseFloat(s.maxMarks) || 0,
        grade: s.grade.trim() || undefined,
      })),
      totalMarks: totals.totalMarks,
      maxMarks: totals.maxMarks,
      percentage: totals.percentage,
    };

    addAcademicRecord(record);
    setUploadOpen(false);
    setAnalyzing(true);
    toast({
      title: 'Record saved',
      description: 'Running AI analysis…',
    });

    try {
      const res = await fetch('/api/analyze-academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record,
          examGoal: user.examGoal,
          userName: user.name,
        }),
      });
      const data = await res.json();
      const analysis: AcademicAnalysis | undefined = data?.analysis;
      if (!analysis) {
        toast({
          title: 'Analysis failed',
          description: data?.error || 'No analysis returned.',
          variant: 'destructive',
        });
        return;
      }
      updateAcademicRecord(record.id, { aiAnalysis: analysis });
      if (data.fallback) {
        toast({
          title: 'Analysis ready (offline mode)',
          description: 'Used deterministic fallback. Try again later for full AI insights.',
        });
      } else {
        toast({
          title: 'AI analysis complete',
          description: 'Tap “View AI Analysis” on the record to read it.',
        });
      }
    } catch (e) {
      toast({
        title: 'Analysis failed',
        description: (e as Error).message,
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
      resetUploadForm();
    }
  }

  function removeRecord(id: string) {
    removeAcademicRecord(id);
    toast({ title: 'Record removed' });
  }

  // ---- Appearance: dark mode Switch → updateProfile({darkMode}) ----
  const [darkMode, setDarkMode] = React.useState<boolean>(!!user?.darkMode);

  function toggleDarkMode(v: boolean) {
    setDarkMode(v);
    updateProfile({ darkMode: v });
    toast({ title: v ? 'Dark mode on' : 'Dark mode off' });
  }

  // ---- Notifications: 3 UI-only Switches ----
  const [notifEmail, setNotifEmail] = React.useState(true);
  const [notifPush, setNotifPush] = React.useState(false);
  const [notifDigest, setNotifDigest] = React.useState(true);

  if (!user) return null;

  const records = user.academicRecords || [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        subtitle="Manage your profile, security, academic records, and preferences"
        accent="emerald"
      />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger value="profile">
            <UserIcon className="h-3.5 w-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-3.5 w-3.5" /> Security
          </TabsTrigger>
          <TabsTrigger value="academic">
            <GraduationCap className="h-3.5 w-3.5" /> Academic
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Moon className="h-3.5 w-3.5" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-3.5 w-3.5" /> Alerts
          </TabsTrigger>
        </TabsList>

        {/* ============================================================= */}
        {/* PROFILE TAB                                                     */}
        {/* ============================================================= */}
        <TabsContent value="profile" className="mt-4">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserIcon className="h-4 w-4 text-blue-600" /> Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Avatar upload */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-blue-100">
                  {user.avatar ? (
                    <AvatarImage src={user.avatar} alt={user.name} />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-xl font-semibold">
                    {(user.name || 'A').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" /> Change avatar
                    </Button>
                    {user.avatar && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => updateProfile({ avatar: undefined })}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PNG / JPG up to 2 MB. Stored locally in your browser.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="set-name">Full name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="set-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="set-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="set-email"
                      value={user.email}
                      readOnly
                      className="pl-8 pr-24 bg-stone-50 text-stone-600"
                    />
                    {user.emailVerified !== false && (
                      <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-100 text-blue-700 border-blue-200">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="set-phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="set-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 90000 00000"
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="w-full">
                      <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select country" />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* User type badge */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/60 border border-blue-100">
                <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    User type
                  </p>
                  <Badge className="mt-0.5 bg-blue-100 text-blue-700 border-blue-200">
                    {USER_TYPE_LABEL[user.type] || user.type}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={resetProfile}>
                  Reset
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={saveProfile}
                >
                  <Save className="h-4 w-4" /> Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================= */}
        {/* SECURITY TAB                                                   */}
        {/* ============================================================= */}
        <TabsContent value="security" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-stone-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lock className="h-4 w-4 text-blue-600" /> Change password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cur-pw">Current password</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cur-pw"
                      type={showPw ? 'text' : 'password'}
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      className="pl-8 pr-9"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-stone-700"
                      aria-label="Toggle password visibility"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-pw">New password</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-pw"
                      type={showPw ? 'text' : 'password'}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      className="pl-8"
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pw">Confirm new password</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-pw"
                      type={showPw ? 'text' : 'password'}
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      className="pl-8"
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={changePassword}
                >
                  <Shield className="h-4 w-4" /> Update password
                </Button>
              </CardContent>
            </Card>

            <Card className="border-rose-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-rose-700">
                  <AlertTriangle className="h-4 w-4" /> Danger zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Deleting your account permanently removes your profile, exam
                  attempts, mentor history, and academic records from this
                  browser. This cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4" /> Delete my account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently erase{' '}
                        <strong>{user.email}</strong> and all associated data
                        from this device. You will be signed out immediately.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-rose-600 hover:bg-rose-700 text-white"
                        onClick={deleteAccount}
                      >
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============================================================= */}
        {/* ACADEMIC RECORDS TAB                                           */}
        {/* ============================================================= */}
        <TabsContent value="academic" className="mt-4 space-y-4">
          <Card className="border-stone-200">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-600" /> Academic records
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Upload past exam marks and get an AI-powered readiness analysis.
                </p>
              </div>
              <Dialog
                open={uploadOpen}
                onOpenChange={(o) => {
                  setUploadOpen(o);
                  if (!o) resetUploadForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Upload className="h-4 w-4" /> Upload marks
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Upload academic record</DialogTitle>
                    <DialogDescription>
                      Add subjects with marks. Totals are computed automatically.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="exam-name">Exam name</Label>
                        <Input
                          id="exam-name"
                          value={examName}
                          onChange={(e) => setExamName(e.target.value)}
                          placeholder="e.g. Class 12 Pre-Boards"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="institution">Institution (optional)</Label>
                        <Input
                          id="institution"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder="e.g. Delhi Public School"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="exam-date">Date</Label>
                      <Input
                        id="exam-date"
                        type="date"
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Subjects</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={addSubject}
                        >
                          <Plus className="h-3.5 w-3.5" /> Add subject
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {subjects.map((s, idx) => (
                          <div
                            key={s.id}
                            className="grid grid-cols-12 gap-2 items-center"
                          >
                            <Input
                              className="col-span-12 sm:col-span-4"
                              placeholder="Subject name"
                              value={s.name}
                              onChange={(e) =>
                                updateSubject(s.id, 'name', e.target.value)
                              }
                            />
                            <Input
                              className="col-span-4 sm:col-span-2"
                              type="number"
                              placeholder="Marks"
                              min={0}
                              value={s.marks}
                              onChange={(e) =>
                                updateSubject(s.id, 'marks', e.target.value)
                              }
                            />
                            <Input
                              className="col-span-4 sm:col-span-2"
                              type="number"
                              placeholder="Max"
                              min={0}
                              value={s.maxMarks}
                              onChange={(e) =>
                                updateSubject(s.id, 'maxMarks', e.target.value)
                              }
                            />
                            <Input
                              className="col-span-3 sm:col-span-3"
                              placeholder="Grade"
                              value={s.grade}
                              onChange={(e) =>
                                updateSubject(s.id, 'grade', e.target.value)
                              }
                            />
                            <button
                              type="button"
                              onClick={() => removeSubject(s.id)}
                              disabled={subjects.length <= 1}
                              className="col-span-1 h-9 flex items-center justify-center rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-400"
                              aria-label={`Remove subject ${idx + 1}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Auto-calculated totals */}
                    <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-blue-50/60 border border-blue-100">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Total
                        </p>
                        <p className="text-lg font-bold text-stone-900">
                          {totals.totalMarks} / {totals.maxMarks}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Percentage
                        </p>
                        <p className="text-lg font-bold text-blue-700">
                          {totals.percentage.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Subjects
                        </p>
                        <p className="text-lg font-bold text-stone-900">
                          {subjects.filter((s) => s.name.trim()).length}
                        </p>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUploadOpen(false);
                        resetUploadForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={saveAndAnalyze}
                      disabled={analyzing}
                    >
                      {analyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Save &amp; analyze
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Records list */}
          {records.length === 0 ? (
            <Card className="p-10 border-stone-200 text-center">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-stone-100 flex items-center justify-center mb-3">
                <GraduationCap className="h-6 w-6 text-stone-400" />
              </div>
              <h3 className="font-semibold text-stone-800">
                No academic records yet
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your past exam marks to unlock AI-powered readiness analysis.
              </p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {records.map((rec) => (
                <AcademicRecordCard
                  key={rec.id}
                  record={rec}
                  onViewAnalysis={() => setAnalysisRecord(rec)}
                  onRemove={() => removeRecord(rec.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ============================================================= */}
        {/* APPEARANCE TAB                                                 */}
        {/* ============================================================= */}
        <TabsContent value="appearance" className="mt-4">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Moon className="h-4 w-4 text-blue-600" /> Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-stone-200">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Moon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-900">Dark mode</p>
                    <p className="text-xs text-muted-foreground">
                      Toggle dark theme for the app.
                    </p>
                  </div>
                </div>
                <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
              </div>
              <p className="text-xs text-muted-foreground">
                Dark mode preference is saved to your profile and persists across
                sessions on this device.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================= */}
        {/* NOTIFICATIONS TAB (UI-only)                                    */}
        {/* ============================================================= */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4 text-blue-600" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <NotifRow
                icon={Mail}
                label="Email notifications"
                description="Daily plan reminders and exam-day alerts."
                checked={notifEmail}
                onChange={setNotifEmail}
              />
              <NotifRow
                icon={Bell}
                label="Push notifications"
                description="Real-time pings for mentor replies and mock completions."
                checked={notifPush}
                onChange={setNotifPush}
              />
              <NotifRow
                icon={ClipboardList}
                label="Weekly digest"
                description="A Sunday summary of your prep week."
                checked={notifDigest}
                onChange={setNotifDigest}
              />
              <p className="text-xs text-muted-foreground mt-2">
                These toggles are UI-only for this demo and are not persisted.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function NotifRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-stone-200">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-stone-900">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function AcademicRecordCard({
  record,
  onViewAnalysis,
  onRemove,
}: {
  record: AcademicRecord;
  onViewAnalysis: () => void;
  onRemove: () => void;
}) {
  const pct = clampPct(record.percentage);
  const accent = pct >= 75 ? 'blue' : pct >= 50 ? 'amber' : 'rose';
  const barColor =
    accent === 'blue'
      ? 'bg-blue-500'
      : accent === 'amber'
      ? 'bg-amber-500'
      : 'bg-rose-500';
  const maxSubjectPct = Math.max(
    1,
    ...record.subjects.map((s) =>
      s.maxMarks > 0 ? (s.marks / s.maxMarks) * 100 : 0
    )
  );

  return (
    <Card className="border-stone-200 hover:shadow-md transition">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-stone-900 truncate">
              {record.examName}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3" />{' '}
              {new Date(record.date).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              {record.institution ? ` · ${record.institution}` : ''}
            </p>
          </div>
          <Badge
            className={cn(
              'border',
              accent === 'blue'
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : accent === 'amber'
                ? 'bg-amber-100 text-amber-700 border-amber-200'
                : 'bg-rose-100 text-rose-700 border-rose-200'
            )}
          >
            {record.percentage.toFixed(1)}%
          </Badge>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-stone-900">
            {record.totalMarks}
          </span>
          <span className="text-sm text-muted-foreground">
            / {record.maxMarks} marks
          </span>
        </div>

        {/* Mini subject bars */}
        <div className="space-y-1.5">
          {record.subjects.map((s, i) => {
            const sp = clampPct(s.maxMarks > 0 ? (s.marks / s.maxMarks) * 100 : 0);
            const sc =
              sp >= 75 ? 'bg-blue-500' : sp >= 50 ? 'bg-amber-500' : 'bg-rose-500';
            return (
              <div key={i} className="space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-stone-700 truncate">
                    {s.name}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {s.marks}/{s.maxMarks}
                    {s.grade ? ` · ${s.grade}` : ''}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', sc)}
                    style={{ width: `${(sp / maxSubjectPct) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] mb-0.5">
            <span className="text-muted-foreground">Overall</span>
            <span className="font-semibold text-stone-700">
              {pct.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
            <div
              className={cn('h-full rounded-full', barColor)}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
          {record.aiAnalysis ? (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={onViewAnalysis}
            >
              <Brain className="h-3.5 w-3.5" /> View AI analysis
            </Button>
          ) : (
            <Badge
              variant="outline"
              className="bg-stone-50 text-stone-500"
            >
              <Loader2 className="h-3 w-3 animate-spin" /> Awaiting analysis
            </Badge>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalysisDialogBody({ record }: { record: AcademicRecord }) {
  const a = record.aiAnalysis;
  if (!a) {
    return (
      <DialogHeader>
        <DialogTitle>Analysis in progress</DialogTitle>
        <DialogDescription>
          AI analysis has not completed for this record yet. Please wait a moment.
        </DialogDescription>
      </DialogHeader>
    );
  }
  const readinessPct = clampPct(a.predictedReadiness / 10);
  const readinessColor =
    readinessPct >= 70 ? 'blue' : readinessPct >= 40 ? 'amber' : 'rose';
  const readinessText =
    readinessColor === 'blue'
      ? 'text-blue-700'
      : readinessColor === 'amber'
      ? 'text-amber-700'
      : 'text-rose-700';
  const readinessBarClass =
    readinessColor === 'blue'
      ? '[&_[data-slot=progress-indicator]]:bg-blue-600'
      : readinessColor === 'amber'
      ? '[&_[data-slot=progress-indicator]]:bg-amber-500'
      : '[&_[data-slot=progress-indicator]]:bg-rose-500';

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" /> AI analysis — {record.examName}
        </DialogTitle>
        <DialogDescription>
          {record.totalMarks}/{record.maxMarks} · {record.percentage.toFixed(1)}%
          · analysed{' '}
          {new Date(a.generatedAt).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Summary */}
        <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100">
          <p className="text-sm text-stone-700 leading-relaxed">{a.summary}</p>
        </div>

        {/* Predicted readiness */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-blue-600" /> Predicted readiness
            </Label>
            <span className={cn('text-sm font-bold tabular-nums', readinessText)}>
              {a.predictedReadiness}/1000
            </span>
          </div>
          <Progress value={readinessPct} className={cn('h-2.5', readinessBarClass)} />
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Predicted score range:{' '}
            <strong className="text-stone-700">{a.predictedScoreRange}</strong>
          </p>
        </div>

        {/* Strengths / Weaknesses badges */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-blue-100 bg-blue-50/40">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
            </p>
            {a.strengths.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No strong subjects yet — keep grinding.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {a.strengths.map((s, i) => (
                  <Badge
                    key={i}
                    className="bg-blue-100 text-blue-700 border-blue-200"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 rounded-lg border border-rose-100 bg-rose-50/40">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700 mb-2 flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5" /> Weaknesses
            </p>
            {a.weaknesses.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No weak subjects detected — well-balanced!
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {a.weaknesses.map((s, i) => (
                  <Badge
                    key={i}
                    className="bg-rose-100 text-rose-700 border-rose-200"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subject insights */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-blue-600" /> Subject insights
          </Label>
          <div className="space-y-2">
            {a.subjectInsights.map((si, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-stone-200 bg-white"
              >
                <p className="text-sm font-semibold text-stone-900">{si.subject}</p>
                <p className="text-xs text-stone-600 mt-0.5">{si.insight}</p>
                <p className="text-xs text-blue-700 mt-1.5 flex items-start gap-1.5">
                  <Rocket className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    <span className="font-semibold">Do:</span> {si.recommendation}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Study plan */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5 text-blue-600" /> Study plan
          </Label>
          <div className="space-y-2">
            {a.studyPlan.map((sp, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-stone-200 bg-gradient-to-br from-blue-50/40 to-white"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                    <span className="h-5 w-5 rounded-md bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {sp.phase}
                  </p>
                  <Badge
                    variant="outline"
                    className="bg-stone-50 text-stone-600 text-[10px]"
                  >
                    {sp.duration}
                  </Badge>
                </div>
                <p className="text-xs text-blue-700 mt-1">{sp.focus}</p>
                <ul className="mt-1.5 space-y-1">
                  {sp.tasks.map((t, ti) => (
                    <li
                      key={ti}
                      className="text-xs text-stone-600 flex items-start gap-1.5"
                    >
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended resources */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-blue-600" /> Recommended resources
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {a.recommendedResources.map((r, i) => (
              <Badge
                key={i}
                variant="outline"
                className="bg-stone-50 text-stone-700 border-stone-200 text-xs"
              >
                {r}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
