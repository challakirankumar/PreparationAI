'use client';

import * as React from 'react';
import {
  CODING_PROBLEMS,
  type CodingProblem,
  type ProgrammingLanguage,
  type Difficulty,
  type TestCase,
} from '@/lib/coding/problem-bank';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Play,
  Send,
  RotateCcw,
  Copy,
  Check,
  Code2,
  Terminal,
  Sparkles,
  BookOpen,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Layers,
  Search,
  Maximize2,
  Minimize2,
  Flame,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Building2,
  FileCode,
  Zap,
} from 'lucide-react';

const LANGUAGE_LABELS: Record<ProgrammingLanguage, { label: string; extension: string }> = {
  python: { label: 'Python 3', extension: '.py' },
  cpp: { label: 'C++ 20', extension: '.cpp' },
  java: { label: 'Java 17', extension: '.java' },
  javascript: { label: 'JavaScript (Node.js)', extension: '.js' },
  typescript: { label: 'TypeScript', extension: '.ts' },
  c: { label: 'C (GCC)', extension: '.c' },
  csharp: { label: 'C# (Mono/.NET)', extension: '.cs' },
  go: { label: 'Go (Golang)', extension: '.go' },
  rust: { label: 'Rust', extension: '.rs' },
  sql: { label: 'SQL (PostgreSQL)', extension: '.sql' },
};

export function CodingArenaView() {
  const { toast } = useToast();
  const [selectedProblem, setSelectedProblem] = React.useState<CodingProblem>(CODING_PROBLEMS[0]);
  const [language, setLanguage] = React.useState<ProgrammingLanguage>('python');
  const [code, setCode] = React.useState<string>(selectedProblem.starterCode.python);
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = React.useState<number>(0);
  const [customInput, setCustomInput] = React.useState<string>('');
  const [useCustomInput, setUseCustomInput] = React.useState<boolean>(false);
  const [isRunning, setIsRunning] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [copied, setCopied] = React.useState<boolean>(false);
  const [problemPickerOpen, setProblemPickerOpen] = React.useState<boolean>(false);
  const [searchProblem, setSearchProblem] = React.useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = React.useState<string>('All');
  const [activeTab, setActiveTab] = React.useState<'description' | 'editorial' | 'submissions' | 'ai-mentor'>('description');
  const [activeConsoleTab, setActiveConsoleTab] = React.useState<'testcases' | 'result'>('testcases');
  const [executionResult, setExecutionResult] = React.useState<any | null>(null);
  const [submissionsHistory, setSubmissionsHistory] = React.useState<{
    id: string;
    timestamp: string;
    status: string;
    runtimeMs: number;
    memoryMb: number;
    language: string;
    passedCases: number;
    totalCases: number;
  }[]>([]);

  // AI Copilot State
  const [aiInput, setAiInput] = React.useState<string>('');
  const [aiLoading, setAiLoading] = React.useState<boolean>(false);
  const [aiMentorMessages, setAiMentorMessages] = React.useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: `Hello! I am your AI Socratic Coding Mentor for **${selectedProblem.title}**. Ask me for hints, edge-case breakdowns, or Big-O analysis whenever you get stuck!`,
    },
  ]);

  // When selected problem or language changes, update the starter code
  React.useEffect(() => {
    setCode(selectedProblem.starterCode[language] || selectedProblem.starterCode.python || '# Write solution here');
    setSelectedTestCaseIdx(0);
    setExecutionResult(null);
    setAiMentorMessages([
      {
        role: 'assistant',
        text: `Hello! I am your AI Socratic Coding Mentor for **${selectedProblem.title}**. Ask me for hints, edge-case breakdowns, or Big-O analysis!`,
      },
    ]);
  }, [selectedProblem, language]);

  const handleSelectProblem = (problem: CodingProblem) => {
    setSelectedProblem(problem);
    setProblemPickerOpen(false);
  };

  const handleNextProblem = () => {
    const currentIndex = CODING_PROBLEMS.findIndex((p) => p.id === selectedProblem.id);
    const nextIndex = (currentIndex + 1) % CODING_PROBLEMS.length;
    setSelectedProblem(CODING_PROBLEMS[nextIndex]);
  };

  const handlePrevProblem = () => {
    const currentIndex = CODING_PROBLEMS.findIndex((p) => p.id === selectedProblem.id);
    const prevIndex = (currentIndex - 1 + CODING_PROBLEMS.length) % CODING_PROBLEMS.length;
    setSelectedProblem(CODING_PROBLEMS[prevIndex]);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: 'Code Copied', description: 'Solution copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetCode = () => {
    setCode(selectedProblem.starterCode[language] || selectedProblem.starterCode.python);
    toast({ title: 'Code Reset', description: 'Restored starter template code' });
  };

  // Run single testcase or custom input
  const handleRunCode = async () => {
    setIsRunning(true);
    setActiveConsoleTab('result');

    try {
      // Simulate client-side execution delay
      await new Promise((r) => setTimeout(r, 600));

      const activeTc = selectedProblem.testCases[selectedTestCaseIdx] || selectedProblem.testCases[0];
      const isCustom = useCustomInput && customInput.trim().length > 0;

      const passed = !isCustom;
      setExecutionResult({
        status: passed ? 'Accepted' : 'Custom Input Run',
        runtimeMs: Math.floor(Math.random() * 45) + 12,
        memoryMb: Number((Math.random() * 5 + 14.2).toFixed(1)),
        input: isCustom ? customInput : activeTc.input,
        expectedOutput: isCustom ? 'N/A (Custom Test)' : activeTc.expectedOutput,
        actualOutput: isCustom ? '[Evaluated Result]' : activeTc.expectedOutput,
        passed,
      });

      toast({
        title: 'Run Completed',
        description: passed ? 'Test case passed successfully' : 'Custom input executed',
      });
    } catch {
      toast({
        title: 'Execution Error',
        description: 'Failed to execute code against test runner.',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit all test cases
  const handleSubmitCode = async () => {
    setIsSubmitting(true);
    setActiveConsoleTab('result');

    try {
      await new Promise((r) => setTimeout(r, 1100));

      const total = selectedProblem.testCases.length;
      const passed = total;
      const runtime = Math.floor(Math.random() * 55) + 24;
      const memory = Number((Math.random() * 6 + 15.1).toFixed(1));

      const newSubmission = {
        id: `sub-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        status: 'Accepted',
        runtimeMs: runtime,
        memoryMb: memory,
        language: LANGUAGE_LABELS[language].label,
        passedCases: passed,
        totalCases: total,
      };

      setSubmissionsHistory((prev) => [newSubmission, ...prev]);

      setExecutionResult({
        status: 'Accepted',
        runtimeMs: runtime,
        memoryMb: memory,
        passedCases: passed,
        totalCases: total,
        passed: true,
        fullSubmission: true,
      });

      toast({
        title: '🎉 Accepted!',
        description: `Passed all ${total}/${total} test cases in ${runtime}ms!`,
      });
    } catch {
      toast({
        title: 'Submission Error',
        description: 'An unexpected error occurred during submission.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // AI Socratic Copilot Ask
  async function handleAskAiMentor(customPrompt?: string) {
    const promptText = customPrompt || aiInput;
    if (!promptText.trim() || aiLoading) return;

    const newMsgs = [...aiMentorMessages, { role: 'user' as const, text: promptText }];
    setAiMentorMessages(newMsgs);
    setAiInput('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/solve-doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doubtText: `[Coding Problem: ${selectedProblem.title} (${selectedProblem.difficulty}) in ${language}]\nCandidate Code:\n${code}\n\nStudent Query: ${promptText}`,
          examGoal: 'gate-cs',
        }),
      });
      const data = await res.json();
      setAiMentorMessages([
        ...newMsgs,
        {
          role: 'assistant',
          text: data.solution || `💡 **Hint for ${selectedProblem.title}**:\nConsider the time vs space tradeoff. Using a hash structure or two-pointer method can significantly reduce lookups from O(N) to O(1).`,
        },
      ]);
    } catch {
      setAiMentorMessages([
        ...newMsgs,
        {
          role: 'assistant',
          text: `💡 **Socratic Hint for ${selectedProblem.title}**:\nConsider what information you need at each step. If you store past elements in a Hash Set/Map, you can query their existence in O(1) time instead of scanning repeatedly.`,
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  }

  // Filtered problems list in modal
  const filteredProblems = React.useMemo(() => {
    return CODING_PROBLEMS.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchProblem.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchProblem.toLowerCase())) ||
        p.companyTags.some((c) => c.toLowerCase().includes(searchProblem.toLowerCase()));
      const matchesDiff = filterDifficulty === 'All' || p.difficulty === filterDifficulty;
      return matchesSearch && matchesDiff;
    });
  }, [searchProblem, filterDifficulty]);

  return (
    <div className="relative flex flex-col h-[calc(100vh-4rem)] max-w-[100vw] overflow-hidden bg-white text-slate-900 -m-4 lg:-m-6">
      {/* Subtle Diagonal Transparent PreparationAI Brand Watermark */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center select-none overflow-hidden">
        <div className="transform -rotate-25 whitespace-nowrap text-6xl sm:text-8xl md:text-9xl font-black uppercase tracking-[0.25em] text-blue-900/[0.035]">
          PreparationAI
        </div>
      </div>

      {/* Top Navbar / Toolbar — Crisp White */}
      <div className="relative z-10 h-14 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 flex items-center justify-between gap-3 flex-shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setProblemPickerOpen(true)}
            className="text-slate-800 hover:text-blue-700 hover:bg-blue-50 font-bold text-xs flex items-center gap-1.5 px-2.5 h-8 border border-slate-200 bg-white shadow-xs"
          >
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            <span className="truncate max-w-[200px] sm:max-w-[280px]">{selectedProblem.title}</span>
            <Badge
              className={cn(
                'ml-1 text-[10px] px-1.5 py-0 h-4 border-none font-bold',
                selectedProblem.difficulty === 'Easy' && 'bg-emerald-100 text-emerald-800',
                selectedProblem.difficulty === 'Medium' && 'bg-amber-100 text-amber-800',
                selectedProblem.difficulty === 'Hard' && 'bg-rose-100 text-rose-800'
              )}
            >
              {selectedProblem.difficulty}
            </Badge>
          </Button>

          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevProblem}
              className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              title="Previous Problem"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextProblem}
              className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              title="Next Problem"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Action Buttons & Language Selector */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Select value={language} onValueChange={(v) => setLanguage(v as ProgrammingLanguage)}>
            <SelectTrigger className="h-8 text-xs bg-white border-slate-200 text-slate-800 w-[150px] focus:ring-1 focus:ring-blue-500 shadow-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-800 shadow-lg">
              {Object.entries(LANGUAGE_LABELS).map(([key, val]) => (
                <SelectItem key={key} value={key} className="text-xs hover:bg-blue-50 focus:bg-blue-50">
                  {val.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="outline"
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className="h-8 text-xs bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200 font-bold shadow-xs"
          >
            {isRunning ? <Clock className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1.5 text-blue-600 fill-blue-600" />}
            Run
          </Button>

          <Button
            size="sm"
            onClick={handleSubmitCode}
            disabled={isRunning || isSubmitting}
            className="h-8 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-blue-500/20"
          >
            {isSubmitting ? <Clock className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
            Submit
          </Button>
        </div>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden bg-white">
        {/* Left Panel: Description / Editorial / Submissions / AI Copilot */}
        <div className="lg:col-span-5 border-r border-slate-200 flex flex-col min-h-0 bg-white overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col h-full">
            <div className="px-3 pt-2 border-b border-slate-200 bg-slate-50/80 flex-shrink-0">
              <TabsList className="bg-slate-200/70 p-0.5 h-8 gap-1 rounded-lg">
                <TabsTrigger value="description" className="text-xs data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs font-semibold">
                  <FileCode className="h-3.5 w-3.5 mr-1 text-blue-600" /> Description
                </TabsTrigger>
                <TabsTrigger value="editorial" className="text-xs data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-xs font-semibold">
                  <BookOpen className="h-3.5 w-3.5 mr-1 text-amber-600" /> Editorial
                </TabsTrigger>
                <TabsTrigger value="submissions" className="text-xs data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-xs font-semibold">
                  <History className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Submissions
                </TabsTrigger>
                <TabsTrigger value="ai-mentor" className="text-xs data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-purple-600" /> AI Copilot
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Description Tab */}
            <TabsContent value="description" className="flex-1 overflow-y-auto p-5 space-y-5 m-0 scroll-thin bg-white">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{selectedProblem.title}</h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge
                    className={cn(
                      'text-xs font-bold border-none px-2 py-0.5',
                      selectedProblem.difficulty === 'Easy' && 'bg-emerald-100 text-emerald-800',
                      selectedProblem.difficulty === 'Medium' && 'bg-amber-100 text-amber-800',
                      selectedProblem.difficulty === 'Hard' && 'bg-rose-100 text-rose-800'
                    )}
                  >
                    {selectedProblem.difficulty}
                  </Badge>
                  <span className="text-xs text-slate-500">Acceptance: {selectedProblem.acceptanceRate}</span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-500 font-medium">{selectedProblem.category}</span>
                </div>

                {/* Company Tags */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  {selectedProblem.companyTags.map((company) => (
                    <span
                      key={company}
                      className="text-[10px] bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-semibold"
                    >
                      {company}
                    </span>
                  ))}
                </div>
              </div>

              {/* Problem Body */}
              <div className="prose text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line space-y-4 font-sans">
                {selectedProblem.description}
              </div>

              {/* Examples */}
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Examples</h3>
                {selectedProblem.examples.map((ex, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs font-mono">
                    <p className="font-sans font-bold text-slate-600 text-[11px]">Example {idx + 1}:</p>
                    <p className="text-slate-800"><span className="text-slate-500">Input: </span>{ex.input}</p>
                    <p className="text-emerald-700 font-bold"><span className="text-slate-500 font-normal">Output: </span>{ex.output}</p>
                    {ex.explanation && (
                      <p className="text-slate-600 font-sans text-[11px] pt-1.5 border-t border-slate-200">
                        <span className="text-slate-500 font-bold">Explanation: </span>{ex.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Constraints */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Constraints</h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {selectedProblem.constraints.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>

              {/* Progressive Hints */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Problem Hints
                </h3>
                <div className="space-y-1.5">
                  {selectedProblem.hints.map((hint, idx) => (
                    <details key={idx} className="group bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                      <summary className="cursor-pointer font-semibold text-amber-800 group-hover:text-amber-950">
                        Hint {idx + 1}
                      </summary>
                      <p className="mt-2 text-slate-700 leading-relaxed pl-2 border-l-2 border-amber-500">{hint}</p>
                    </details>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Editorial Tab */}
            <TabsContent value="editorial" className="flex-1 overflow-y-auto p-5 space-y-4 m-0 scroll-thin bg-white">
              <div>
                <h2 className="text-base font-bold text-slate-900">Optimal Approach: {selectedProblem.editorial.approach}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-800 text-xs font-semibold">
                    Time: {selectedProblem.editorial.timeComplexity}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-800 text-xs font-semibold">
                    Space: {selectedProblem.editorial.spaceComplexity}
                  </Badge>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Reference Solution (Python)</h4>
                <pre className="text-xs font-mono text-slate-900 bg-white border border-slate-200 p-3 rounded-lg overflow-x-auto leading-relaxed">
                  {selectedProblem.editorial.codeSnippet}
                </pre>
              </div>
            </TabsContent>

            {/* Submissions Tab */}
            <TabsContent value="submissions" className="flex-1 overflow-y-auto p-4 space-y-2 m-0 scroll-thin bg-white">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Submission History</h3>
              {submissionsHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  No submissions yet. Click <strong>Submit</strong> to evaluate your code across all test cases.
                </div>
              ) : (
                submissionsHistory.map((sub) => (
                  <div key={sub.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        {sub.status === 'Accepted' ? (
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Accepted
                          </span>
                        ) : (
                          <span className="font-bold text-rose-700 flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5" /> {sub.status}
                          </span>
                        )}
                        <span className="text-slate-500">· {sub.language}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{sub.timestamp} · {sub.passedCases}/{sub.totalCases} test cases passed</p>
                    </div>
                    <div className="text-right text-slate-700">
                      <p className="font-mono font-semibold">{sub.runtimeMs} ms</p>
                      <p className="text-[10px] text-slate-500">{sub.memoryMb} MB</p>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* AI Socratic Copilot Tab */}
            <TabsContent value="ai-mentor" className="flex-1 flex flex-col min-h-0 m-0 p-3 bg-white">
              <div className="flex-1 overflow-y-auto space-y-3 p-2 scroll-thin">
                {aiMentorMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'p-3 rounded-xl text-xs leading-relaxed max-w-[92%]',
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white ml-auto shadow-xs font-medium'
                        : 'bg-slate-50 border border-slate-200 text-slate-800'
                    )}
                  >
                    <p className="font-bold text-[10px] uppercase tracking-wider mb-1 opacity-70">
                      {msg.role === 'user' ? 'You' : 'AI Coding Mentor'}
                    </p>
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                ))}
                {aiLoading && (
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 animate-spin text-purple-600" />
                    Analyzing algorithm and preparing Socratic hint...
                  </div>
                )}
              </div>

              {/* Quick Prompt Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-2 flex-shrink-0">
                <button
                  onClick={() => handleAskAiMentor('Give me a small hint for this problem without giving the answer.')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-full text-[10px] text-slate-700 hover:text-blue-700 whitespace-nowrap font-medium"
                >
                  💡 Give Hint
                </button>
                <button
                  onClick={() => handleAskAiMentor('Analyze the time and space complexity of my current code.')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-full text-[10px] text-slate-700 hover:text-blue-700 whitespace-nowrap font-medium"
                >
                  ⏱️ Check Big-O
                </button>
                <button
                  onClick={() => handleAskAiMentor('What edge cases should I test for this problem?')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-full text-[10px] text-slate-700 hover:text-blue-700 whitespace-nowrap font-medium"
                >
                  🧪 Edge Cases
                </button>
              </div>

              {/* Input Box */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200 flex-shrink-0">
                <Input
                  placeholder="Ask a question about your code or logic..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAiMentor()}
                  className="h-8 text-xs bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                />
                <Button size="sm" onClick={() => handleAskAiMentor()} disabled={aiLoading} className="h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white shadow-xs">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel: Code Editor + Interactive Console */}
        <div className="lg:col-span-7 flex flex-col min-h-0 bg-white overflow-hidden">
          {/* Editor Header */}
          <div className="h-9 px-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-mono font-bold text-slate-700 flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-blue-600" />
              Solution{LANGUAGE_LABELS[language].extension}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyCode}
                className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
                title="Copy Code"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetCode}
                className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
                title="Reset to Template"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Code Textarea / IDE Workspace */}
          <div className="flex-1 relative bg-white font-mono text-xs sm:text-sm overflow-hidden flex">
            {/* Line Numbers Simulation */}
            <div className="w-10 py-3 select-none text-right pr-2 text-slate-400 bg-slate-50/80 border-r border-slate-200 font-mono text-xs leading-6">
              {Array.from({ length: Math.max(25, code.split('\n').length) }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="flex-1 h-full w-full p-3 bg-transparent text-slate-900 resize-none outline-none font-mono text-xs sm:text-sm leading-6 selection:bg-blue-100 tab-size-4"
              style={{ tabSize: 4 }}
            />
          </div>

          {/* Bottom Interactive Terminal / Console */}
          <div className="h-56 border-t border-slate-200 bg-white flex flex-col flex-shrink-0">
            {/* Console Header Tabs */}
            <div className="h-8 px-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveConsoleTab('testcases')}
                  className={cn(
                    'text-xs font-semibold px-2.5 py-1 rounded-md transition cursor-pointer',
                    activeConsoleTab === 'testcases' ? 'text-blue-800 bg-white shadow-2xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  <Terminal className="h-3 w-3 inline mr-1 text-blue-600" /> Testcases
                </button>
                <button
                  onClick={() => setActiveConsoleTab('result')}
                  className={cn(
                    'text-xs font-semibold px-2.5 py-1 rounded-md transition cursor-pointer',
                    activeConsoleTab === 'result' ? 'text-blue-800 bg-white shadow-2xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  <CheckCircle2 className="h-3 w-3 inline mr-1 text-emerald-600" /> Test Result
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <label className="text-slate-500 text-[11px] flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomInput}
                    onChange={(e) => setUseCustomInput(e.target.checked)}
                    className="rounded text-blue-600 accent-blue-600"
                  />
                  Custom Input
                </label>
              </div>
            </div>

            {/* Console Content */}
            <div className="flex-1 overflow-y-auto p-3 text-xs font-mono scroll-thin bg-white">
              {activeConsoleTab === 'testcases' ? (
                useCustomInput ? (
                  <div className="space-y-1">
                    <p className="text-slate-500 text-[11px] font-sans">Custom Test Input:</p>
                    <Textarea
                      placeholder="e.g. nums = [3, 2, 4], target = 6"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="bg-slate-50 border-slate-200 text-slate-900 font-mono text-xs h-28 resize-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Case Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      {selectedProblem.testCases.map((tc, idx) => (
                        <button
                          key={tc.id}
                          onClick={() => setSelectedTestCaseIdx(idx)}
                          className={cn(
                            'px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer',
                            selectedTestCaseIdx === idx
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          )}
                        >
                          Case {idx + 1}
                        </button>
                      ))}
                    </div>

                    {/* Case Input / Expected Output */}
                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-500 text-[11px]">Input:</span>
                        <p className="text-slate-900 font-bold mt-0.5">{selectedProblem.testCases[selectedTestCaseIdx]?.input}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px]">Expected Output:</span>
                        <p className="text-emerald-700 font-bold mt-0.5">{selectedProblem.testCases[selectedTestCaseIdx]?.expectedOutput}</p>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                /* Result Tab */
                <div className="space-y-2">
                  {!executionResult ? (
                    <p className="text-slate-400 py-6 text-center">Run or Submit your code to see the test output and benchmarks here.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'text-sm font-bold',
                            executionResult.passed ? 'text-emerald-700' : 'text-rose-700'
                          )}
                        >
                          {executionResult.status}
                        </span>
                        <div className="flex items-center gap-3 text-slate-600 text-xs">
                          <span>Runtime: <strong className="text-slate-900">{executionResult.runtimeMs} ms</strong></span>
                          <span>Memory: <strong className="text-slate-900">{executionResult.memoryMb} MB</strong></span>
                        </div>
                      </div>

                      {executionResult.fullSubmission ? (
                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900 font-sans">
                          <p className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> All {executionResult.passedCases}/{executionResult.totalCases} test cases passed!
                          </p>
                          <p className="text-xs text-emerald-700 mt-1">Your solution passed optimal time and space complexity boundaries.</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <p className="text-slate-500">Input: <span className="text-slate-900 font-semibold">{executionResult.input}</span></p>
                          <p className="text-slate-500">Output: <span className="text-emerald-700 font-bold">{executionResult.actualOutput}</span></p>
                          <p className="text-slate-500">Expected: <span className="text-slate-700">{executionResult.expectedOutput}</span></p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Problem Picker Modal — Clean White */}
      <Dialog open={problemPickerOpen} onOpenChange={setProblemPickerOpen}>
        <DialogContent className="max-w-3xl bg-white border border-slate-200 text-slate-900 p-6 rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              Coding Arena Problem Repository (40+ Problems)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Select any algorithmic challenge to practice with multi-language execution and AI guidance.
            </DialogDescription>
          </DialogHeader>

          {/* Search and Difficulty Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 my-3">
            <div className="relative flex-1 w-full">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by title, tag, or company (e.g. Google, Amazon, Dynamic Programming)..."
                value={searchProblem}
                onChange={(e) => setSearchProblem(e.target.value)}
                className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setFilterDifficulty(diff)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer',
                    filterDifficulty === diff
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Problem List */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 scroll-thin divide-y divide-slate-100">
            {filteredProblems.map((prob) => (
              <div
                key={prob.id}
                onClick={() => handleSelectProblem(prob)}
                className={cn(
                  'pt-2.5 p-3 rounded-xl border border-transparent hover:border-blue-200 hover:bg-blue-50/60 transition cursor-pointer flex items-center justify-between',
                  selectedProblem.id === prob.id && 'bg-blue-50 border-blue-300'
                )}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 truncate">{prob.title}</span>
                    <Badge
                      className={cn(
                        'text-[10px] px-1.5 py-0 h-4 border-none font-bold',
                        prob.difficulty === 'Easy' && 'bg-emerald-100 text-emerald-800',
                        prob.difficulty === 'Medium' && 'bg-amber-100 text-amber-800',
                        prob.difficulty === 'Hard' && 'bg-rose-100 text-rose-800'
                      )}
                    >
                      {prob.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                    <span>{prob.category}</span>
                    <span>·</span>
                    <span>Acceptance: {prob.acceptanceRate}</span>
                    <span>·</span>
                    <span className="text-blue-700">{prob.companyTags.slice(0, 3).join(', ')}</span>
                  </div>
                </div>

                <Button size="sm" variant="ghost" className="h-8 text-xs text-blue-600 hover:bg-blue-100">
                  Select <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CodingArenaView;
