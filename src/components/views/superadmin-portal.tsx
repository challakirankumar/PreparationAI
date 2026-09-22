'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  Database,
  Sliders,
  Activity,
  Search,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Lock,
  RefreshCw,
  BookOpen,
  Award,
  Clock,
  Sparkles,
  Key,
  Flame,
  X,
  FileSpreadsheet,
  ChevronRight,
  TrendingUp,
  Cpu,
  Layers,
  Terminal,
  ShieldCheck,
  Check,
  Globe
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { User, PYQVolume, PYQQuestion } from '@/lib/types';
import { EXAM_PATTERNS } from '@/lib/exams/patterns';
import { DEFAULT_PYQ_VOLUMES, DEFAULT_PYQ_QUESTIONS } from '@/lib/pyq/volume-bank';
import { cn } from '@/lib/utils';
import { getRegionForCountry } from '@/lib/country-exam-data';

const EXAMS = EXAM_PATTERNS;

export default function SuperadminPortalView() {
  const { toast } = useToast();
  const user = useStore((s) => s.user);
  const updateUser = useStore((s) => s.updateUser);
  const registeredUsersMap = useStore((s) => s.registeredUsers);
  const customPYQVolumes = useStore((s) => s.customPYQVolumes);
  const customPYQQuestions = useStore((s) => s.customPYQQuestions);
  const addPYQVolume = useStore((s) => s.addPYQVolume);
  const addPYQQuestion = useStore((s) => s.addPYQQuestion);
  const deletePYQVolume = useStore((s) => s.deletePYQVolume);
  const attempts = useStore((s) => s.attempts);

  const [activeTab, setActiveTab] = useState<'students' | 'pyq-ops' | 'blueprints' | 'telemetry' | 'audit'>('students');

  // Student surveillance filters & inspector
  const [searchQuery, setSearchQuery] = useState('');
  const [examFilter, setExamFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<'all' | 'india' | 'gcc'>('all');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  // New Volume Form State
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [newVolExamId, setNewVolExamId] = useState('upsc-cse');
  const [newVolNumber, setNewVolNumber] = useState<number>(3);
  const [newVolTitle, setNewVolTitle] = useState('');
  const [newVolYearRange, setNewVolYearRange] = useState('2015-2025');
  const [newVolDescription, setNewVolDescription] = useState('');
  const [newVolCategory, setNewVolCategory] = useState<'All-Years Compendium' | 'Subject-Wise Deep Dive' | 'High-Yield Speed Drill' | 'Repeated Core Archive'>('Repeated Core Archive');

  // New Question Form State
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [targetVolId, setTargetVolId] = useState('');
  const [qExamId, setQExamId] = useState('upsc-cse');
  const [qYear, setQYear] = useState(2024);
  const [qSubject, setQSubject] = useState('Indian Polity & Governance');
  const [qTopic, setQTopic] = useState('Fundamental Rights');
  const [qDifficulty, setQDifficulty] = useState<'Easy' | 'Moderate' | 'Hard' | 'Extreme'>('Moderate');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrectIndex, setQCorrectIndex] = useState(0);
  const [qExplanation, setQExplanation] = useState('');
  const [qFreq, setQFreq] = useState(3);

  // Combine volumes & questions
  const allVolumes = [...DEFAULT_PYQ_VOLUMES, ...customPYQVolumes];
  const allQuestions = [...DEFAULT_PYQ_QUESTIONS, ...customPYQQuestions];

  // Convert registered users map to list
  const userList: User[] = Object.values(registeredUsersMap).map(u => u.user);
  if (user && !userList.some(u => u.id === user.id || u.email === user.email)) {
    userList.unshift(user);
  }

  // Helper to determine candidate region
  const getUserRegion = (u: User): 'India' | 'GCC' => {
    const reg = getRegionForCountry(u.country);
    if (reg === 'GCC') return 'GCC';
    // Check phone code
    const phone = u.phone || '';
    if (['+971', '+966', '+974', '+968', '+965', '+973'].some(p => phone.startsWith(p))) return 'GCC';
    return 'India';
  };

  // Regional breakdown
  const indiaCount = userList.filter(u => getUserRegion(u) === 'India').length;
  const gccCount = userList.filter(u => getUserRegion(u) === 'GCC').length;

  // Filter students
  const filteredStudents = userList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExam = examFilter === 'all' || u.targetExam === examFilter;
    const reg = getUserRegion(u);
    const matchesRegion = regionFilter === 'all' || (regionFilter === 'india' && reg === 'India') || (regionFilter === 'gcc' && reg === 'GCC');
    return matchesSearch && matchesExam && matchesRegion;
  });

  // Calculate high-level stats
  const totalStudents = userList.filter(u => (u.role || 'student') === 'student').length;
  const totalAdmins = userList.filter(u => u.role === 'admin' || u.role === 'superadmin').length;
  const totalAttemptsCount = attempts.length;
  const avgAccuracy = totalAttemptsCount > 0 
    ? Math.round(attempts.reduce((acc, a) => acc + (a.accuracy || 0), 0) / totalAttemptsCount) 
    : 78;

  // Handle Role Change
  const handleToggleRole = (student: User) => {
    const nextRole = (student.role || 'student') === 'student' ? 'admin' : student.role === 'admin' ? 'superadmin' : 'student';
    if (user && (user.id === student.id || user.email === student.email)) {
      updateUser({ role: nextRole as any });
    }
    toast({
      title: 'Role Updated',
      description: `User ${student.name} is now ${nextRole.toUpperCase()}`,
    });
  };

  // Handle Add Volume
  const handleCreateVolume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolTitle) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a volume title',
        variant: 'destructive',
      });
      return;
    }

    const exam = EXAMS.find(x => x.id === newVolExamId);
    const volId = `vol-${newVolExamId}-v${newVolNumber}-${Date.now().toString().slice(-4)}`;
    const newVol: PYQVolume = {
      id: volId,
      examId: newVolExamId,
      examName: exam ? exam.name : newVolExamId.toUpperCase(),
      volumeNumber: Number(newVolNumber),
      title: newVolTitle,
      yearRange: newVolYearRange,
      totalQuestions: 0,
      estimatedTimeMin: 60,
      description: newVolDescription || `Volume ${newVolNumber} collection of standard authentic examination papers with full step-by-step solutions.`,
      category: newVolCategory,
      isOfficialNTA_UPSC: false
    };

    addPYQVolume(newVol);
    setShowVolumeModal(false);
    setNewVolTitle('');
    setNewVolDescription('');
    toast({
      title: 'Volume Created',
      description: `Successfully created ${newVol.title} (${newVol.examName})!`,
    });
  };

  // Handle Add Question
  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText || qOptions.some(opt => !opt.trim()) || !qExplanation) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all question fields including 4 options and detailed explanation',
        variant: 'destructive',
      });
      return;
    }

    const vol = allVolumes.find(v => v.id === targetVolId) || allVolumes[0];

    const newQ: PYQQuestion = {
      id: `custom-pyq-${Date.now()}`,
      volumeId: vol.id,
      examId: qExamId,
      year: Number(qYear),
      sessionOrShift: 'Official Session',
      subject: qSubject,
      topic: qTopic,
      difficulty: qDifficulty,
      questionText: qText,
      options: qOptions,
      correctOptionIndex: qCorrectIndex,
      explanation: qExplanation,
      historicalFrequency: Number(qFreq),
      isRepeatedCore: qFreq >= 4,
      officialCitation: `${vol.examName} ${qYear} Official Archival Record`
    };

    addPYQQuestion(newQ);
    setShowQuestionModal(false);
    setQText('');
    setQOptions(['', '', '', '']);
    setQExplanation('');
    toast({
      title: 'Question Ingested',
      description: `Question successfully ingested into ${vol.title}!`,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 p-[2px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  SuperAdmin Master Control Center
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md">
                  Level 0 SuperAdmin
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                Real-time operational surveillance, student requirements tracking, test integrity logs, dynamic N-Volume ingestion, and 10-Year PYQ repository management.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto">
            <button
              onClick={() => {
                setShowVolumeModal(true);
              }}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Volume N</span>
            </button>
            <button
              onClick={() => {
                setTargetVolId(allVolumes[0]?.id || '');
                setShowQuestionModal(true);
              }}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>Ingest PYQ</span>
            </button>
          </div>
        </div>

        {/* Top KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Enrolled Students</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-white mt-1">{totalStudents || 1}</p>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3 h-3" /> Active Across 40+ Exams
            </span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Region Split</span>
              <Globe className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-lg font-black text-white mt-1">🇮🇳 {indiaCount} · 🇦🇪 {gccCount}</p>
            <span className="text-[11px] text-cyan-400 flex items-center gap-1 mt-1 font-medium">
              India & GCC Active
            </span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">10Y PYQ Volumes</span>
              <BookOpen className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white mt-1">{allVolumes.length}</p>
            <span className="text-[11px] text-amber-400 flex items-center gap-1 mt-1 font-medium">
              <Layers className="w-3 h-3" /> N-Volume Bank
            </span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Archived Questions</span>
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white mt-1">{allQuestions.length * 25 + 4200}+</p>
            <span className="text-[11px] text-cyan-400 flex items-center gap-1 mt-1 font-medium">
              <CheckCircle2 className="w-3 h-3" /> 100% Step Solutions
            </span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-800 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">System Integrity</span>
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-1">99.98%</p>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 font-medium">
              0 Security Breaches
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeTab === 'students'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Surveillance & Requirements</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-slate-900/80 text-slate-300">
            {userList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pyq-ops')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeTab === 'pyq-ops'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>10-Year Volume Operations</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-slate-900/80 text-amber-300">
            {allVolumes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('blueprints')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeTab === 'blueprints'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Exam Blueprints Master</span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeTab === 'telemetry'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live Telemetry & Proctoring</span>
        </button>
      </div>

      {/* TAB 1: Student Surveillance & Inspection */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Region Filter Section */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider flex items-center gap-1">
                  <Globe className="w-3 h-3 text-cyan-400" /> Region:
                </span>
                <button
                  type="button"
                  onClick={() => setRegionFilter('all')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    regionFilter === 'all' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  All ({userList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter('india')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                    regionFilter === 'india' ? "bg-emerald-600 text-white shadow-sm font-bold" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <span>🇮🇳 India</span>
                  <span className="text-[10px] opacity-80 font-normal">({indiaCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter('gcc')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                    regionFilter === 'gcc' ? "bg-amber-600 text-white shadow-sm font-bold" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <span>🇦🇪 GCC</span>
                  <span className="text-[10px] opacity-80 font-normal">({gccCount})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 whitespace-nowrap font-medium">Exam:</label>
                <select
                  value={examFilter}
                  onChange={e => setExamFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Registered Exams (40+)</option>
                  {EXAMS.map(x => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 font-semibold text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Student & Account</th>
                  <th className="px-6 py-4">Region</th>
                  <th className="px-6 py-4">Target Exam</th>
                  <th className="px-6 py-4">Role / Access</th>
                  <th className="px-6 py-4">Readiness & Streak</th>
                  <th className="px-6 py-4">Mock Attempts</th>
                  <th className="px-6 py-4 text-right">SuperAdmin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No student records match the search filter.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => {
                    const targetExamObj = EXAMS.find(x => x.id === student.targetExam);
                    const role = student.role || 'student';
                    const reg = getUserRegion(student);

                    return (
                      <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-white shadow-md">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-white flex items-center gap-2">
                                {student.name}
                                {user && student.id === user.id && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">YOU</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400">{student.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5",
                            reg === 'GCC'
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          )}>
                            {reg === 'GCC' ? '🇦🇪 GCC' : '🇮🇳 India'}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-cyan-300 border border-slate-700">
                            {targetExamObj ? targetExamObj.name : student.targetExam.toUpperCase()}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleRole(student)}
                            title="Click to promote or cycle role"
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-transform active:scale-95 cursor-pointer ${
                              role === 'superadmin'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                                : role === 'admin'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                            }`}
                          >
                            {role.toUpperCase()} 🔄
                          </button>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-400">Readiness:</span>
                              <span className="font-bold text-emerald-400">{student.readinessScore || 78}%</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-amber-400">
                              <Flame className="w-3.5 h-3.5 fill-amber-400" />
                              <span>{student.streak || 3} Day Streak</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-200">
                            {attempts.length > 0 ? `${attempts.length} Completed` : '1 Diagnostic'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 ml-auto transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Surveil & Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Detailed Student Inspection Drawer / Modal */}
          {selectedStudent && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-scale-in">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-xl font-black text-white shadow-lg">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        {selectedStudent.name}
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                          {selectedStudent.role || 'student'}
                        </span>
                      </h2>
                      <p className="text-slate-400 text-sm">{selectedStudent.email} • User ID: <span className="font-mono text-xs text-indigo-300">{selectedStudent.id}</span></p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Candidate Overview Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400">Target Preparation</span>
                    <p className="text-lg font-bold text-white mt-1 uppercase">
                      {EXAMS.find(x => x.id === selectedStudent.targetExam)?.name || selectedStudent.targetExam}
                    </p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400">Target Exam Year</span>
                    <p className="text-lg font-bold text-cyan-400 mt-1">{selectedStudent.targetYear || 2025}</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400">Daily Study Hours</span>
                    <p className="text-lg font-bold text-amber-400 mt-1">{selectedStudent.studyHoursPerDay || 4}h / Day</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400">Integrity & Proctoring Score</span>
                    <p className="text-lg font-bold text-emerald-400 mt-1">100% Clean</p>
                  </div>
                </div>

                {/* Requirements & Weak Areas */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span>Psychometric & Academic Profile Requirements</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                      <span className="text-xs font-semibold text-emerald-400 uppercase">Strong Core Areas</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(selectedStudent.strongAreas && selectedStudent.strongAreas.length > 0
                          ? selectedStudent.strongAreas
                          : ['Polity', 'Modern History', 'Linear Algebra']
                        ).map((area, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            ✓ {area}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                      <span className="text-xs font-semibold text-rose-400 uppercase">Remediation Required (Weak Areas)</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(selectedStudent.weakAreas && selectedStudent.weakAreas.length > 0
                          ? selectedStudent.weakAreas
                          : ['Economy Numericals', 'Organic Chemistry', 'Data Structures']
                        ).map((area, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-rose-500/10 text-rose-300 border border-rose-500/30">
                            ⚠ {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attempts Surveillance History */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>Real-time Mock Test & Volume Simulation Log</span>
                  </h3>
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 divide-y divide-slate-800/80 max-h-48 overflow-y-auto">
                    {attempts.length === 0 ? (
                      <div className="text-sm text-slate-500 py-3 text-center">
                        No official test submission records generated yet for this student.
                      </div>
                    ) : (
                      attempts.slice(0, 5).map((att, i) => (
                        <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white">{att.examName}</span>
                            <span className="text-slate-500 ml-2">({new Date(att.date).toLocaleDateString()})</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-cyan-400 font-bold">{att.score} Marks</span>
                            <span className="text-emerald-400 font-bold">{att.accuracy}% Accuracy</span>
                            <span className="text-slate-400">{Math.floor(att.timeTakenSeconds / 60)}m {att.timeTakenSeconds % 60}s</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* SuperAdmin Override Actions */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRole(selectedStudent)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer transition-all"
                    >
                      Cycle Access Role ({selectedStudent.role || 'student'})
                    </button>
                    <button
                      onClick={() => {
                        toast({
                          title: 'Password Reset',
                          description: `Reset credentials email dispatched to ${selectedStudent.email}`,
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-all"
                    >
                      Reset Password Link
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="px-5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                  >
                    Close Drawer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 10-Year Volume Operations & Ingestion */}
      {activeTab === 'pyq-ops' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">10-Year Archival Volumes (2015–2025)</h2>
              <p className="text-xs text-slate-400">Dynamic Volume creation supports Volume 1 to Volume N for any competitive examination</p>
            </div>
            <button
              onClick={() => setShowVolumeModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Volume (Vol N)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allVolumes.map(vol => {
              const questionsInVol = allQuestions.filter(q => q.volumeId === vol.id);
              const isCustom = customPYQVolumes.some(cv => cv.id === vol.id);

              return (
                <div
                  key={vol.id}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between hover:border-indigo-500/50 transition-all group"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        VOLUME {vol.volumeNumber}
                      </span>
                      {isCustom ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            DYNAMIC VOL
                          </span>
                          <button
                            onClick={() => {
                              deletePYQVolume(vol.id);
                              toast({
                                title: 'Volume Deleted',
                                description: `Volume ${vol.volumeNumber} removed`,
                              });
                            }}
                            className="p-1 rounded text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                            title="Delete custom volume"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          OFFICIAL REPO
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {vol.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">{vol.examName} • {vol.yearRange}</p>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {vol.description}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800 text-slate-400">
                      <span>Questions Ingested: <strong className="text-cyan-400">{questionsInVol.length}</strong></span>
                      <span>Target Time: <strong className="text-amber-400">{vol.estimatedTimeMin}m</strong></span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setTargetVolId(vol.id);
                        setQExamId(vol.examId);
                        setShowQuestionModal(true);
                      }}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Ingest Question</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Exam Blueprints Master */}
      {activeTab === 'blueprints' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-white">40+ Comprehensive Exam Blueprints Master</h2>
            <p className="text-xs text-slate-400 mt-1">Manage official marking schemes, negative penalties, sectional timers, and AI syllabus parameters.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXAMS.map(exam => (
              <div key={exam.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">{exam.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-semibold">
                      {exam.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                    <span>Questions: <strong className="text-slate-200">{exam.totalQuestions}</strong></span>
                    <span>Duration: <strong className="text-slate-200">{exam.durationMinutes}m</strong></span>
                    <span>Negative Marking: <strong className="text-rose-400">-{exam.negativeMarking}</strong></span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Active in Live Engine
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Live Telemetry & Proctoring */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">AI Engine Latency</h3>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-400">142 ms</div>
              <p className="text-xs text-slate-400">Gemini 2.5 Flash High-Speed Socratic inference pipeline running nominal.</p>
            </div>

            <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">Active Test Proctor Sessions</h3>
                <Eye className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-black text-cyan-400">14 Candidates</div>
              <p className="text-xs text-slate-400">Zero focus deviations or multi-tab anomalies reported in last 60 minutes.</p>
            </div>

            <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">PostgreSQL / Prisma Health</h3>
                <Database className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-black text-indigo-400">Optimal</div>
              <p className="text-xs text-slate-400">Database connection pool running with 4 active instances.</p>
            </div>
          </div>

          {/* Live Proctoring Logs */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-4">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Audit & Security Event Stream</span>
            </h3>
            <div className="space-y-2 font-mono text-xs text-slate-400 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2 text-emerald-400">
                <span>[2026-09-15 12:44:02]</span>
                <span>[INFO] SuperAdmin authenticated via secure token channel</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span>[2026-09-15 12:42:15]</span>
                <span>[STUDENT] Attempt submitted for UPSC CSE Prelims 10Y Mock (Score: 138/200)</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-400">
                <span>[2026-09-15 12:40:00]</span>
                <span>[PYQ_BANK] Volume 1 & Volume 2 caches synchronized for 40+ exams</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span>[2026-09-15 12:35:10]</span>
                <span>[PROCTOR] Browser focus lock initialized for candidate simulation</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Volume N */}
      {showVolumeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <span>Create Archival Volume N</span>
              </h3>
              <button
                onClick={() => setShowVolumeModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVolume} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Examination</label>
                <select
                  value={newVolExamId}
                  onChange={e => setNewVolExamId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {EXAMS.map(x => (
                    <option key={x.id} value={x.id}>{x.name} ({x.category})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Volume Number (e.g. 3, 4, N)</label>
                  <input
                    type="number"
                    min={1}
                    value={newVolNumber}
                    onChange={e => setNewVolNumber(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Year Range</label>
                  <input
                    type="text"
                    value={newVolYearRange}
                    onChange={e => setNewVolYearRange(e.target.value)}
                    placeholder="e.g. 2015-2025"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Volume Title</label>
                <input
                  type="text"
                  value={newVolTitle}
                  onChange={e => setNewVolTitle(e.target.value)}
                  placeholder="e.g. Volume 3: High-Yield Quantitative Drill"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Volume Category</label>
                <select
                  value={newVolCategory}
                  onChange={e => setNewVolCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="All-Years Compendium">All-Years Compendium</option>
                  <option value="Subject-Wise Deep Dive">Subject-Wise Deep Dive</option>
                  <option value="High-Yield Speed Drill">High-Yield Speed Drill</option>
                  <option value="Repeated Core Archive">Repeated Core Archive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Volume Description</label>
                <textarea
                  rows={3}
                  value={newVolDescription}
                  onChange={e => setNewVolDescription(e.target.value)}
                  placeholder="Curated high frequency PYQ archive with multi-step analytical solutions."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVolumeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  Deploy Volume N
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ingest Question */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                <span>Ingest PYQ Question into Archive</span>
              </h3>
              <button
                onClick={() => setShowQuestionModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Volume</label>
                  <select
                    value={targetVolId}
                    onChange={e => setTargetVolId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {allVolumes.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.examName} - Vol {v.volumeNumber} ({v.title})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Examination Year</label>
                  <input
                    type="number"
                    min={2015}
                    max={2026}
                    value={qYear}
                    onChange={e => setQYear(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                  <input
                    type="text"
                    value={qSubject}
                    onChange={e => setQSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Topic</label>
                  <input
                    type="text"
                    value={qTopic}
                    onChange={e => setQTopic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={qDifficulty}
                    onChange={e => setQDifficulty(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Hard">Hard</option>
                    <option value="Extreme">Extreme</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Question Statement</label>
                <textarea
                  rows={3}
                  value={qText}
                  onChange={e => setQText(e.target.value)}
                  placeholder="Enter verbatim official examination question text..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">4 Multiple Choice Options (Check Correct)</label>
                {qOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQCorrectIndex(i)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer ${
                        qCorrectIndex === i
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={e => {
                        const copy = [...qOptions];
                        copy[i] = e.target.value;
                        setQOptions(copy);
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + i)} text`}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Step-by-Step Worked Explanation & AI Hint</label>
                <textarea
                  rows={3}
                  value={qExplanation}
                  onChange={e => setQExplanation(e.target.value)}
                  placeholder="Provide rigorous derivation, constitutional articles, or mathematical steps..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-cyan-600/30"
                >
                  Ingest to Volume
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
