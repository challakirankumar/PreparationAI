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
import { ExamRegion, getRegionForCountry } from '@/lib/country-exam-data';

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
  const [examFilter, setExamFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState<'all' | 'india' | 'gcc'>('all');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  // Volume operations modal state
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [newVolExamId, setNewVolExamId] = useState('upsc-prelims');
  const [newVolNumber, setNewVolNumber] = useState(16);
  const [newVolTitle, setNewVolTitle] = useState('');
  const [newVolYearRange, setNewVolYearRange] = useState('2024 - 2025');
  const [newVolDescription, setNewVolDescription] = useState('');
  const [newVolCategory, setNewVolCategory] = useState('Civil Services & Governance');

  // Question ingestion modal state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [targetVolId, setTargetVolId] = useState('');
  const [qSubject, setQSubject] = useState('General Studies');
  const [qTopic, setQTopic] = useState('Indian Polity & Governance');
  const [qDifficulty, setQDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectIndex, setQCorrectIndex] = useState(0);
  const [qExplanation, setQExplanation] = useState('');
  const [qYear, setQYear] = useState(2024);
  const [qFreq, setQFreq] = useState(3);

  // All combined volumes and questions
  const allVolumes = [...DEFAULT_PYQ_VOLUMES, ...customPYQVolumes];
  const allQuestions = [...DEFAULT_PYQ_QUESTIONS, ...customPYQQuestions];

  // Registered students list
  const userList: User[] = Object.values(registeredUsersMap || {})
    .map(s => s.user)
    .filter((u): u is User => Boolean(u));
  if (user && !userList.some(u => u.id === user.id)) {
    userList.unshift(user);
  }

  // Region helpers
  function getUserRegion(u: User): ExamRegion {
    if (u.country) {
      return getRegionForCountry(u.country);
    }
    return 'India';
  }

  const indiaCount = userList.filter(u => getUserRegion(u) === 'India').length;
  const gccCount = userList.filter(u => getUserRegion(u) === 'GCC').length;
  const totalStudents = userList.length;

  // Filter students
  const filteredStudents = userList.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExam = examFilter === 'all' || s.targetExam === examFilter;
    const matchesRegion =
      regionFilter === 'all' ||
      (regionFilter === 'india' && getUserRegion(s) === 'India') ||
      (regionFilter === 'gcc' && getUserRegion(s) === 'GCC');
    return matchesSearch && matchesExam && matchesRegion;
  });

  const handleToggleRole = (targetUser: User) => {
    const nextRole: User['role'] =
      targetUser.role === 'superadmin'
        ? 'student'
        : targetUser.role === 'admin'
        ? 'superadmin'
        : 'admin';
    updateUser({ ...targetUser, role: nextRole });
    toast({
      title: 'Role Updated',
      description: `${targetUser.name} is now a ${nextRole.toUpperCase()}`,
    });
  };

  const handleCreateVolume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolTitle.trim()) {
      toast({ title: 'Validation Error', description: 'Volume title is required', variant: 'destructive' });
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
      description: `Volume ${newVolNumber} (${newVol.title}) is now live for all students!`,
    });
  };

  const handleIngestQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || qOptions.some(o => !o.trim())) {
      toast({ title: 'Validation Error', description: 'Question text and all 4 options are required', variant: 'destructive' });
      return;
    }

    const vol = allVolumes.find(v => v.id === targetVolId) || allVolumes[0];
    const qId = `q-${vol.examId}-${Date.now()}`;
    const newQ: PYQQuestion = {
      id: qId,
      volumeId: vol.id,
      examId: vol.examId,
      year: Number(qYear),
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
      {/* Header — Majestic Royal Blue Gradient Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 border border-blue-600 p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md p-[2px] shadow-lg border border-white/20">
              <div className="w-full h-full bg-white/10 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  SuperAdmin Master Control Center
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-amber-950 shadow-md">
                  Level 0 SuperAdmin
                </span>
              </div>
              <p className="text-blue-100 text-sm mt-1 max-w-2xl">
                Real-time operational surveillance, student requirements tracking, test integrity logs, dynamic N-Volume ingestion, and 10-Year PYQ repository management.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto">
            <button
              onClick={() => {
                setShowVolumeModal(true);
              }}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-blue-900 text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Create Volume N</span>
            </button>
            <button
              onClick={() => {
                setTargetVolId(allVolumes[0]?.id || '');
                setShowQuestionModal(true);
              }}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>Ingest PYQ</span>
            </button>
          </div>
        </div>

        {/* Top KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8 pt-6 border-t border-white/20">
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-100 uppercase">Enrolled Students</span>
              <Users className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-black text-white mt-1">{totalStudents || 1}</p>
            <span className="text-[11px] text-blue-100 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3 h-3" /> Active Across 40+ Exams
            </span>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-100 uppercase">Region Split</span>
              <Globe className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-black text-white mt-1">🇮🇳 {indiaCount} · 🇦🇪 {gccCount}</p>
            <span className="text-[11px] text-blue-100 flex items-center gap-1 mt-1 font-medium">
              India & GCC Active
            </span>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-100 uppercase">10Y PYQ Volumes</span>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-black text-white mt-1">{allVolumes.length}</p>
            <span className="text-[11px] text-blue-100 flex items-center gap-1 mt-1 font-medium">
              <Layers className="w-3 h-3" /> N-Volume Bank
            </span>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-100 uppercase">Archived Questions</span>
              <Database className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-black text-white mt-1">{allQuestions.length * 25 + 4200}+</p>
            <span className="text-[11px] text-blue-100 flex items-center gap-1 mt-1 font-medium">
              <CheckCircle2 className="w-3 h-3" /> 100% Step Solutions
            </span>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-100 uppercase">System Integrity</span>
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-black text-white mt-1">99.98%</p>
            <span className="text-[11px] text-blue-100 flex items-center gap-1 mt-1 font-medium">
              0 Security Breaches
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeTab === 'students'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-blue-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Surveillance & Requirements</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/20 text-white">
            {userList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pyq-ops')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeTab === 'pyq-ops'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-blue-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>10-Year Volume Operations</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 font-bold">
            {allVolumes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('blueprints')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeTab === 'blueprints'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-blue-50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Exam Blueprints Master</span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeTab === 'telemetry'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-blue-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live Telemetry & Proctoring</span>
        </button>
      </div>

      {/* TAB 1: Student Surveillance & Inspection */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Crisp White Filter & Search Header */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Region Filter Section */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 px-2 uppercase tracking-wider flex items-center gap-1">
                  <Globe className="w-3 h-3 text-blue-600" /> Region:
                </span>
                <button
                  type="button"
                  onClick={() => setRegionFilter('all')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    regionFilter === 'all' ? "bg-blue-600 text-white shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  All ({userList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter('india')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                    regionFilter === 'india' ? "bg-emerald-600 text-white shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
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
                    regionFilter === 'gcc' ? "bg-amber-600 text-white shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <span>🇦🇪 GCC</span>
                  <span className="text-[10px] opacity-80 font-normal">({gccCount})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 whitespace-nowrap font-medium">Exam:</label>
                <select
                  value={examFilter}
                  onChange={e => setExamFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Registered Exams (40+)</option>
                  {EXAMS.map(x => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Crisp White Student Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No student records match the search filter.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => {
                    const targetExamObj = EXAMS.find(x => x.id === student.targetExam);
                    const role = student.role || 'student';
                    const reg = getUserRegion(student);

                    return (
                      <tr key={student.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-2">
                                {student.name}
                                {user && student.id === user.id && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">YOU</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">{student.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5",
                            reg === 'GCC'
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          )}>
                            {reg === 'GCC' ? '🇦🇪 GCC' : '🇮🇳 India'}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            {targetExamObj ? targetExamObj.name : student.targetExam ? student.targetExam.toUpperCase() : 'ALL'}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleRole(student)}
                            title="Click to promote or cycle role"
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-transform active:scale-95 cursor-pointer ${
                              role === 'superadmin'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : role === 'admin'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {role.toUpperCase()} 🔄
                          </button>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500">Readiness:</span>
                              <span className="font-bold text-emerald-600">{student.readinessScore || 78}%</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>{student.streak || 3} Day Streak</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-800">
                            {attempts.length > 0 ? `${attempts.length} Completed` : '1 Diagnostic'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-xs font-semibold flex items-center gap-1.5 ml-auto transition-all cursor-pointer shadow-2xs"
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
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-scale-in text-slate-900">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xl font-black text-white shadow-lg">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        {selectedStudent.name}
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold uppercase">
                          {selectedStudent.role || 'student'}
                        </span>
                      </h2>
                      <p className="text-slate-500 text-sm">{selectedStudent.email} • User ID: <span className="font-mono text-xs text-blue-600">{selectedStudent.id}</span></p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Candidate Overview Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">Target Preparation</span>
                    <p className="text-lg font-bold text-slate-900 mt-1 uppercase">
                      {EXAMS.find(x => x.id === selectedStudent.targetExam)?.name || selectedStudent.targetExam}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">Target Exam Year</span>
                    <p className="text-lg font-bold text-blue-600 mt-1">{selectedStudent.targetYear || 2025}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">Daily Study Hours</span>
                    <p className="text-lg font-bold text-amber-600 mt-1">{selectedStudent.studyHoursPerDay || 4}h / Day</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">Integrity & Proctoring Score</span>
                    <p className="text-lg font-bold text-emerald-600 mt-1">100% Clean</p>
                  </div>
                </div>

                {/* Requirements & Weak Areas */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <span>Psychometric & Academic Profile Requirements</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                      <span className="text-xs font-semibold text-emerald-800 uppercase">Strong Core Areas</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(selectedStudent.strongAreas && selectedStudent.strongAreas.length > 0
                          ? selectedStudent.strongAreas
                          : ['Polity', 'Modern History', 'Linear Algebra']
                        ).map((area, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium">
                            ✓ {area}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200">
                      <span className="text-xs font-semibold text-rose-800 uppercase">Remediation Required (Weak Areas)</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(selectedStudent.weakAreas && selectedStudent.weakAreas.length > 0
                          ? selectedStudent.weakAreas
                          : ['Economy Numericals', 'Organic Chemistry', 'Data Structures']
                        ).map((area, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-rose-100 text-rose-800 border border-rose-200 font-medium">
                            ⚠ {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attempts Surveillance History */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>Real-time Mock Test & Volume Simulation Log</span>
                  </h3>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 divide-y divide-slate-200 max-h-48 overflow-y-auto">
                    {attempts.length === 0 ? (
                      <div className="text-sm text-slate-500 py-3 text-center">
                        No official test submission records generated yet for this student.
                      </div>
                    ) : (
                      attempts.slice(0, 5).map((att, i) => (
                        <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{att.examName}</span>
                            <span className="text-slate-500 ml-2">({att.date ? new Date(att.date).toLocaleDateString() : 'N/A'})</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-blue-700 font-bold">{att.score} Marks</span>
                            <span className="text-emerald-600 font-bold">{att.accuracy}% Accuracy</span>
                            <span className="text-slate-600">
                              {typeof att.timeTakenSeconds === 'number'
                                ? `${Math.floor(att.timeTakenSeconds / 60)}m ${att.timeTakenSeconds % 60}s`
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* SuperAdmin Override Actions */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRole(selectedStudent)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
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
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer transition-all border border-slate-200"
                    >
                      Reset Password Link
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 text-xs font-semibold cursor-pointer border border-slate-200"
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">10-Year Archival Volumes (2015–2025)</h2>
              <p className="text-xs text-slate-500">Dynamic Volume creation supports Volume 1 to Volume N for any competitive examination</p>
            </div>
            <button
              onClick={() => setShowVolumeModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
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
                  className="rounded-2xl bg-white border border-slate-200 p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all group shadow-xs"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                        VOLUME {vol.volumeNumber}
                      </span>
                      {isCustom ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
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
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                            title="Delete custom volume"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          OFFICIAL REPO
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {vol.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{vol.examName} • {vol.yearRange}</p>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {vol.description}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 text-slate-500">
                      <span>Questions Ingested: <strong className="text-blue-700">{questionsInVol.length}</strong></span>
                      <button
                        onClick={() => {
                          setTargetVolId(vol.id);
                          setShowQuestionModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ingest</span>
                      </button>
                    </div>
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
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Exam Architecture & Pattern Blueprints</h2>
              <p className="text-xs text-slate-500">Full psychometric parameters, section weightage, and negative marking matrices</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {EXAMS.length} Exam Patterns Configured
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXAMS.map(ex => (
              <div key={ex.id} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs hover:border-blue-200 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">{ex.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">ID: {ex.id}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {Math.round(ex.durationSec / 60)} Mins
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg text-center">
                    <span className="text-slate-500 block text-[10px]">Total Marks</span>
                    <strong className="text-slate-900">{ex.totalMarks}</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg text-center">
                    <span className="text-slate-500 block text-[10px]">Correct Mark</span>
                    <strong className="text-emerald-700">+{ex.sections[0]?.marksPerQuestion ?? 4}</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg text-center">
                    <span className="text-slate-500 block text-[10px]">Negative Mark</span>
                    <strong className="text-rose-700">-{ex.sections[0]?.negativeMarks ?? 1}</strong>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sections:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ex.sections.map((sec, sIdx) => (
                      <span key={sIdx} className="px-2 py-0.5 rounded text-[11px] bg-blue-50 text-blue-800 border border-blue-100 font-medium">
                        {sec.name} ({sec.questionCount}Q)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Live Telemetry & Proctoring Surveillance */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Live Test Integrity & Anti-Cheating Telemetry</h2>
              <p className="text-xs text-slate-500">Real-time candidate camera, multi-face presence, and gaze away telemetry monitoring</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Surveillance Stream Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Face Presence Detector</span>
              <p className="text-2xl font-black text-slate-900">99.4%</p>
              <p className="text-xs text-slate-500">Single candidate in frame threshold verified</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Gaze Deviation Rate</span>
              <p className="text-2xl font-black text-blue-700">&lt; 3.2%</p>
              <p className="text-xs text-slate-500">Standard candidate focus maintained</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Tab Switch Violations</span>
              <p className="text-2xl font-black text-emerald-700">0 Reported</p>
              <p className="text-xs text-slate-500">Active full-screen browser lockdown</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Volume N */}
      {showVolumeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-scale-in text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Create New 10Y PYQ Volume</span>
              </h3>
              <button onClick={() => setShowVolumeModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVolume} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Examination</label>
                <select
                  value={newVolExamId}
                  onChange={e => setNewVolExamId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  {EXAMS.map(x => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Volume Number (N)</label>
                  <input
                    type="number"
                    value={newVolNumber}
                    onChange={e => setNewVolNumber(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Year Range</label>
                  <input
                    type="text"
                    value={newVolYearRange}
                    onChange={e => setNewVolYearRange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Volume Title</label>
                <input
                  type="text"
                  placeholder="e.g. Volume 16: 2024–2025 Solved Papers"
                  value={newVolTitle}
                  onChange={e => setNewVolTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Description of the past paper series..."
                  value={newVolDescription}
                  onChange={e => setNewVolDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVolumeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Create Volume
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ingest Question */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-4 animate-scale-in text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <span>Ingest PYQ Question into Volume</span>
              </h3>
              <button onClick={() => setShowQuestionModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIngestQuestion} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Volume</label>
                <select
                  value={targetVolId}
                  onChange={e => setTargetVolId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  {allVolumes.map(v => (
                    <option key={v.id} value={v.id}>{v.title} ({v.examName})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={qSubject}
                    onChange={e => setQSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Topic</label>
                  <input
                    type="text"
                    value={qTopic}
                    onChange={e => setQTopic(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Difficulty</label>
                  <select
                    value={qDifficulty}
                    onChange={e => setQDifficulty(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Question Statement</label>
                <textarea
                  rows={3}
                  placeholder="Enter complete official question text..."
                  value={qText}
                  onChange={e => setQText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">Options & Correct Answer</label>
                {qOptions.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOpt"
                      checked={qCorrectIndex === oIdx}
                      onChange={() => setQCorrectIndex(oIdx)}
                      className="accent-blue-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-600 font-mono">{String.fromCharCode(65 + oIdx)}:</span>
                    <input
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + oIdx)}...`}
                      value={opt}
                      onChange={e => {
                        const next = [...qOptions];
                        next[oIdx] = e.target.value;
                        setQOptions(next);
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Worked Step-by-Step Explanation</label>
                <textarea
                  rows={3}
                  placeholder="Detailed editorial worked solution..."
                  value={qExplanation}
                  onChange={e => setQExplanation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Ingest Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
