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

  // AI Code Mentor Chat
  const [aiMentorMessages, setAiMentorMessages] = React.useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: `Hello! I'm your Socratic Coding Mentor. I can give you progressive hints, analyze your code's Big-O Time/Space complexity, or help debug edge cases without spoiling the solution. What would you like help with?`,
    },
  ]);
  const [aiInput, setAiInput] = React.useState('');
  const [aiLoading, setAiLoading] = React.useState(false);

  // Sync starter code on problem or language change
  React.useEffect(() => {
    setCode(selectedProblem.starterCode[language] || selectedProblem.starterCode.python);
  }, [selectedProblem, language]);

  // Reset code handler
  function handleResetCode() {
    setCode(selectedProblem.starterCode[language] || selectedProblem.starterCode.python);
    toast({ title: 'Code reset to default boilerplate template' });
  }

  // Copy code handler
  function handleCopyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Code copied to clipboard' });
  }

  // Next / Previous Problem
  function handlePrevProblem() {
    const idx = CODING_PROBLEMS.findIndex((p) => p.id === selectedProblem.id);
    if (idx > 0) {
      setSelectedProblem(CODING_PROBLEMS[idx - 1]);
      setExecutionResult(null);
    }
  }

  function handleNextProblem() {
    const idx = CODING_PROBLEMS.findIndex((p) => p.id === selectedProblem.id);
    if (idx < CODING_PROBLEMS.length - 1) {
      setSelectedProblem(CODING_PROBLEMS[idx + 1]);
      setExecutionResult(null);
    }
  }

  // Run Code against sample test cases
  async function handleRunCode() {
    setIsRunning(true);
    setActiveConsoleTab('result');
    try {
      const resp = await fetch('/api/code-runner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: selectedProblem.id,
          language,
          code,
          customInput: useCustomInput ? customInput : '',
          isSubmit: false,
        }),
      });
      const data = await resp.json();
      setExecutionResult(data);
      if (data.status === 'Accepted') {
        toast({ title: 'Test cases passed!', description: `Finished in ${data.runtimeMs}ms` });
      } else {
        toast({ title: data.status, description: 'Check console output for details', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Execution failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsRunning(false);
    }
  }

  // Submit Code against all test cases
  async function handleSubmitCode() {
    setIsSubmitting(true);
    setActiveConsoleTab('result');
    try {
      const resp = await fetch('/api/code-runner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: selectedProblem.id,
          language,
          code,
          isSubmit: true,
        }),
      });
      const data = await resp.json();
      setExecutionResult(data);

      const subEntry = {
        id: `sub-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: data.status,
        runtimeMs: data.runtimeMs,
        memoryMb: data.memoryMb,
        language: LANGUAGE_LABELS[language].label,
        passedCases: data.passedTestCases,
        totalCases: data.totalTestCases,
      };
      setSubmissionsHistory((prev) => [subEntry, ...prev]);

      if (data.status === 'Accepted') {
        toast({
          title: '🎉 Solution Accepted!',
          description: `All ${data.totalTestCases} test cases passed · Runtime: ${data.runtimeMs}ms (${data.memoryMb} MB)`,
        });
      } else {
        toast({
          title: data.status,
          description: `Passed ${data.passedTestCases}/${data.totalTestCases} test cases`,
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({ title: 'Submission failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  // AI Mentor Prompt Handler
  async function handleAskAiMentor(customPrompt?: string) {
    const promptText = customPrompt || aiInput;
    if (!promptText.trim()) return;

    const newMsgs = [...aiMentorMessages, { role: 'user' as const, text: promptText }];
    setAiMentorMessages(newMsgs);
    setAiInput('');
    setAiLoading(true);

    try {
      const resp = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[Coding Problem: ${selectedProblem.title} (${selectedProblem.difficulty}) in ${language}]\n[Current User Code]:\n${code}\n[User Question]: ${promptText}\n[Instructions: Provide a helpful Socratic guidance hint, Big-O analysis or bug spot without outputting the direct full code answer unless explicitly requested.]`,
          history: aiMentorMessages.slice(-6).map((m) => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await resp.json();
      const reply = data.reply || data.response || "Here's a hint: Check your loop bounds and consider whether a hash map or two-pointer approach can reduce time complexity to O(N).";
      setAiMentorMessages([...newMsgs, { role: 'assistant', text: reply }]);
    } catch {
      setAiMentorMessages([
        ...newMsgs,
        {
          role: 'assistant',
          text: `💡 **Socratic Hint for ${selectedProblem.title}**:\nConsider what information you need at each step. If you store past elements in a Hash Set/Map, you can query their existence in O(1) time instead of scanning the array repeatedly in O(N).`,
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
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-[100vw] overflow-hidden bg-stone-900 text-stone-100 -m-4 lg:-m-6">
      {/* Top Navbar / Toolbar */}
      <div className="h-14 border-b border-stone-800 bg-stone-950 px-4 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setProblemPickerOpen(true)}
            className="text-stone-200 hover:text-white hover:bg-stone-800 font-semibold text-xs flex items-center gap-1.5 px-2.5 h-8 border border-stone-800"
          >
            <Layers className="h-3.5 w-3.5 text-blue-400" />
            <span className="truncate max-w-[200px] sm:max-w-[280px]">{selectedProblem.title}</span>
            <Badge
              className={cn(
                'ml-1 text-[10px] px-1.5 py-0 h-4 border-none font-bold',
                selectedProblem.difficulty === 'Easy' && 'bg-emerald-500/20 text-emerald-400',
                selectedProblem.difficulty === 'Medium' && 'bg-amber-500/20 text-amber-400',
                selectedProblem.difficulty === 'Hard' && 'bg-rose-500/20 text-rose-400'
              )}
            >
              {selectedProblem.difficulty}
            </Badge>
          </Button>

          <div className="hidden sm:flex items-center gap-1 text-stone-500">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevProblem}
              className="h-7 w-7 text-stone-400 hover:text-white hover:bg-stone-800"
              title="Previous Problem"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextProblem}
              className="h-7 w-7 text-stone-400 hover:text-white hover:bg-stone-800"
              title="Next Problem"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Action Buttons & Language Selector */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Select value={language} onValueChange={(v) => setLanguage(v as ProgrammingLanguage)}>
            <SelectTrigger className="h-8 text-xs bg-stone-900 border-stone-700 text-stone-200 w-[150px] focus:ring-1 focus:ring-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-stone-900 border-stone-700 text-stone-200">
              {Object.entries(LANGUAGE_LABELS).map(([key, val]) => (
                <SelectItem key={key} value={key} className="text-xs hover:bg-stone-800 focus:bg-stone-800">
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
            className="h-8 text-xs bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700 hover:text-white font-medium"
          >
            {isRunning ? <Clock className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1.5 text-emerald-400 fill-emerald-400" />}
            Run
          </Button>

          <Button
            size="sm"
            onClick={handleSubmitCode}
            disabled={isRunning || isSubmitting}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
          >
            {isSubmitting ? <Clock className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
            Submit
          </Button>
        </div>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* Left Panel: Description / Editorial / Submissions / AI Copilot */}
        <div className="lg:col-span-5 border-r border-stone-800 flex flex-col min-h-0 bg-stone-950 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col h-full">
            <div className="px-3 pt-2 border-b border-stone-800 bg-stone-900/60 flex-shrink-0">
              <TabsList className="bg-stone-800/80 p-0.5 h-8 gap-1">
                <TabsTrigger value="description" className="text-xs data-[state=active]:bg-stone-950 data-[state=active]:text-white">
                  <FileCode className="h-3.5 w-3.5 mr-1 text-blue-400" /> Description
                </TabsTrigger>
                <TabsTrigger value="editorial" className="text-xs data-[state=active]:bg-stone-950 data-[state=active]:text-white">
                  <BookOpen className="h-3.5 w-3.5 mr-1 text-amber-400" /> Editorial
                </TabsTrigger>
                <TabsTrigger value="submissions" className="text-xs data-[state=active]:bg-stone-950 data-[state=active]:text-white">
                  <History className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Submissions
                </TabsTrigger>
                <TabsTrigger value="ai-mentor" className="text-xs data-[state=active]:bg-stone-950 data-[state=active]:text-white">
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-purple-400" /> AI Copilot
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Description Tab */}
            <TabsContent value="description" className="flex-1 overflow-y-auto p-5 space-y-5 m-0 scroll-thin">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">{selectedProblem.title}</h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge
                    className={cn(
                      'text-xs font-bold border-none px-2 py-0.5',
                      selectedProblem.difficulty === 'Easy' && 'bg-emerald-500/20 text-emerald-400',
                      selectedProblem.difficulty === 'Medium' && 'bg-amber-500/20 text-amber-400',
                      selectedProblem.difficulty === 'Hard' && 'bg-rose-500/20 text-rose-400'
                    )}
                  >
                    {selectedProblem.difficulty}
                  </Badge>
                  <span className="text-xs text-stone-400">Acceptance: {selectedProblem.acceptanceRate}</span>
                  <span className="text-xs text-stone-500">·</span>
                  <span className="text-xs text-stone-400">{selectedProblem.category}</span>
                </div>

                {/* Company Tags */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  <Building2 className="h-3.5 w-3.5 text-stone-500" />
                  {selectedProblem.companyTags.map((company) => (
                    <span
                      key={company}
                      className="text-[10px] bg-stone-900 border border-stone-800 text-stone-400 px-2 py-0.5 rounded-full font-medium"
                    >
                      {company}
                    </span>
                  ))}
                </div>
              </div>

              {/* Problem Body */}
              <div className="prose prose-invert text-stone-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line space-y-4">
                {selectedProblem.description}
              </div>

              {/* Examples */}
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Examples</h3>
                {selectedProblem.examples.map((ex, idx) => (
                  <div key={idx} className="bg-stone-900 border border-stone-800 rounded-lg p-3 space-y-1.5 text-xs font-mono">
                    <p className="font-sans font-bold text-stone-400 text-[11px]">Example {idx + 1}:</p>
                    <p className="text-stone-300"><span className="text-stone-500">Input: </span>{ex.input}</p>
                    <p className="text-emerald-400"><span className="text-stone-500">Output: </span>{ex.output}</p>
                    {ex.explanation && (
                      <p className="text-stone-400 font-sans text-[11px] pt-1 border-t border-stone-800/80">
                        <span className="text-stone-500 font-bold">Explanation: </span>{ex.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Constraints */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Constraints</h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-stone-300 font-mono">
                  {selectedProblem.constraints.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>

              {/* Progressive Hints */}
              <div className="space-y-2 pt-2 border-t border-stone-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Problem Hints
                </h3>
                <div className="space-y-1.5">
                  {selectedProblem.hints.map((hint, idx) => (
                    <details key={idx} className="group bg-stone-900 border border-stone-800 rounded-md p-2.5 text-xs text-stone-300">
                      <summary className="cursor-pointer font-semibold text-stone-400 group-hover:text-stone-200">
                        Hint {idx + 1}
                      </summary>
                      <p className="mt-2 text-stone-300 leading-relaxed pl-2 border-l-2 border-amber-500/60">{hint}</p>
                    </details>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Editorial Tab */}
            <TabsContent value="editorial" className="flex-1 overflow-y-auto p-5 space-y-4 m-0 scroll-thin">
              <div>
                <h2 className="text-base font-bold text-white">Optimal Approach: {selectedProblem.editorial.approach}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400 text-xs">
                    Time: {selectedProblem.editorial.timeComplexity}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400 text-xs">
                    Space: {selectedProblem.editorial.spaceComplexity}
                  </Badge>
                </div>
              </div>

              <div className="bg-stone-900 border border-stone-800 rounded-lg p-3">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Reference Solution (Python)</h4>
                <pre className="text-xs font-mono text-emerald-400 bg-stone-950 p-3 rounded overflow-x-auto">
                  {selectedProblem.editorial.codeSnippet}
                </pre>
              </div>
            </TabsContent>

            {/* Submissions Tab */}
            <TabsContent value="submissions" className="flex-1 overflow-y-auto p-4 space-y-2 m-0 scroll-thin">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Submission History</h3>
              {submissionsHistory.length === 0 ? (
                <div className="text-center py-10 text-stone-500 text-xs">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No submissions yet. Click <strong>Submit</strong> to evaluate your code across all test cases.
                </div>
              ) : (
                submissionsHistory.map((sub) => (
                  <div key={sub.id} className="bg-stone-900 border border-stone-800 rounded-lg p-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        {sub.status === 'Accepted' ? (
                          <span className="font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Accepted
                          </span>
                        ) : (
                          <span className="font-bold text-rose-400 flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5" /> {sub.status}
                          </span>
                        )}
                        <span className="text-stone-500">· {sub.language}</span>
                      </div>
                      <p className="text-[11px] text-stone-500">{sub.timestamp} · {sub.passedCases}/{sub.totalCases} test cases passed</p>
                    </div>
                    <div className="text-right text-stone-400">
                      <p className="font-mono">{sub.runtimeMs} ms</p>
                      <p className="text-[10px] text-stone-500">{sub.memoryMb} MB</p>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* AI Socratic Copilot Tab */}
            <TabsContent value="ai-mentor" className="flex-1 flex flex-col min-h-0 m-0 p-3">
              <div className="flex-1 overflow-y-auto space-y-3 p-2 scroll-thin">
                {aiMentorMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'p-3 rounded-xl text-xs leading-relaxed max-w-[92%]',
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white ml-auto'
                        : 'bg-stone-900 border border-stone-800 text-stone-300'
                    )}
                  >
                    <p className="font-bold text-[10px] uppercase tracking-wider mb-1 opacity-60">
                      {msg.role === 'user' ? 'You' : 'AI Coding Mentor'}
                    </p>
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                ))}
                {aiLoading && (
                  <div className="bg-stone-900 border border-stone-800 p-3 rounded-xl text-xs text-stone-400 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 animate-spin text-purple-400" />
                    Analyzing algorithm and preparing Socratic hint...
                  </div>
                )}
              </div>

              {/* Quick Prompt Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-2 flex-shrink-0">
                <button
                  onClick={() => handleAskAiMentor('Give me a small hint for this problem without giving the answer.')}
                  className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-full text-[10px] text-stone-300 whitespace-nowrap"
                >
                  💡 Give Hint
                </button>
                <button
                  onClick={() => handleAskAiMentor('Analyze the time and space complexity of my current code.')}
                  className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-full text-[10px] text-stone-300 whitespace-nowrap"
                >
                  ⏱️ Check Big-O
                </button>
                <button
                  onClick={() => handleAskAiMentor('What edge cases should I test for this problem?')}
                  className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-full text-[10px] text-stone-300 whitespace-nowrap"
                >
                  🧪 Edge Cases
                </button>
              </div>

              {/* Input Box */}
              <div className="flex items-center gap-2 pt-2 border-t border-stone-800 flex-shrink-0">
                <Input
                  placeholder="Ask a question about your code or logic..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAiMentor()}
                  className="h-8 text-xs bg-stone-900 border-stone-800 text-stone-200"
                />
                <Button size="sm" onClick={() => handleAskAiMentor()} disabled={aiLoading} className="h-8 px-3 bg-purple-600 hover:bg-purple-500 text-white">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel: Code Editor + Interactive Console */}
        <div className="lg:col-span-7 flex flex-col min-h-0 bg-stone-950 overflow-hidden">
          {/* Editor Header */}
          <div className="h-9 px-3 border-b border-stone-800 bg-stone-900/90 flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-mono font-medium text-stone-400 flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-blue-400" />
              Solution{LANGUAGE_LABELS[language].extension}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyCode}
                className="h-7 w-7 text-stone-400 hover:text-white hover:bg-stone-800"
                title="Copy Code"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetCode}
                className="h-7 w-7 text-stone-400 hover:text-white hover:bg-stone-800"
                title="Reset to Template"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Code Textarea / IDE Workspace */}
          <div className="flex-1 relative bg-stone-950 font-mono text-xs sm:text-sm overflow-hidden flex">
            {/* Line Numbers Simulation */}
            <div className="w-10 py-3 select-none text-right pr-2 text-stone-600 bg-stone-950/60 border-r border-stone-800/60 font-mono text-xs leading-6">
              {Array.from({ length: Math.max(25, code.split('\n').length) }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="flex-1 h-full w-full p-3 bg-transparent text-stone-200 resize-none outline-none font-mono text-xs sm:text-sm leading-6 selection:bg-blue-600/40 tab-size-4"
              style={{ tabSize: 4 }}
            />
          </div>

          {/* Bottom Interactive Terminal / Console */}
          <div className="h-56 border-t border-stone-800 bg-stone-900/95 flex flex-col flex-shrink-0">
            {/* Console Header Tabs */}
            <div className="h-8 px-3 border-b border-stone-800 flex items-center justify-between bg-stone-950">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveConsoleTab('testcases')}
                  className={cn(
                    'text-xs font-semibold px-2 py-1 rounded transition',
                    activeConsoleTab === 'testcases' ? 'text-white bg-stone-800' : 'text-stone-400 hover:text-stone-200'
                  )}
                >
                  <Terminal className="h-3 w-3 inline mr-1 text-blue-400" /> Testcases
                </button>
                <button
                  onClick={() => setActiveConsoleTab('result')}
                  className={cn(
                    'text-xs font-semibold px-2 py-1 rounded transition',
                    activeConsoleTab === 'result' ? 'text-white bg-stone-800' : 'text-stone-400 hover:text-stone-200'
                  )}
                >
                  <CheckCircle2 className="h-3 w-3 inline mr-1 text-emerald-400" /> Test Result
                  {executionResult && (
                    <span className={cn(
                      'ml-1.5 text-[10px] font-bold px-1.5 py-0.2 rounded',
                      executionResult.status === 'Accepted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    )}>
                      {executionResult.status}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Console Body */}
            <div className="flex-1 overflow-y-auto p-3 text-xs scroll-thin">
              {activeConsoleTab === 'testcases' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {selectedProblem.testCases.filter((tc) => !tc.isHidden).map((tc, idx) => (
                      <button
                        key={tc.id}
                        onClick={() => {
                          setSelectedTestCaseIdx(idx);
                          setUseCustomInput(false);
                        }}
                        className={cn(
                          'px-2.5 py-1 rounded text-xs font-mono font-semibold transition',
                          !useCustomInput && selectedTestCaseIdx === idx
                            ? 'bg-stone-800 text-white border border-stone-700'
                            : 'text-stone-400 hover:bg-stone-850 hover:text-stone-200'
                        )}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setUseCustomInput(true)}
                      className={cn(
                        'px-2.5 py-1 rounded text-xs font-mono font-semibold transition',
                        useCustomInput ? 'bg-stone-800 text-white border border-stone-700' : 'text-stone-400 hover:bg-stone-850'
                      )}
                    >
                      + Custom Input
                    </button>
                  </div>

                  {!useCustomInput ? (
                    <div className="bg-stone-950 border border-stone-800 rounded p-2.5 font-mono space-y-1">
                      <p className="text-stone-500 text-[11px]">Input:</p>
                      <p className="text-stone-200">{selectedProblem.testCases[selectedTestCaseIdx]?.input}</p>
                    </div>
                  ) : (
                    <Textarea
                      placeholder="Enter custom input (e.g. nums = [1, 2, 3], target = 4)..."
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="h-20 bg-stone-950 border-stone-800 text-xs font-mono text-stone-200"
                    />
                  )}
                </div>
              )}

              {activeConsoleTab === 'result' && (
                <div>
                  {!executionResult ? (
                    <p className="text-stone-500 text-xs py-4 text-center">Run or submit code to see test results.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-sm font-bold',
                            executionResult.status === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'
                          )}>
                            {executionResult.status}
                          </span>
                          <span className="text-stone-500">·</span>
                          <span className="text-stone-400 font-mono">Runtime: {executionResult.runtimeMs} ms</span>
                          <span className="text-stone-500">·</span>
                          <span className="text-stone-400 font-mono">Memory: {executionResult.memoryMb} MB</span>
                        </div>
                        <span className="text-stone-400 font-semibold">
                          {executionResult.passedTestCases} / {executionResult.totalTestCases} Passed
                        </span>
                      </div>

                      {/* Detailed Results per testcase */}
                      <div className="space-y-2">
                        {executionResult.results?.map((res: any, idx: number) => (
                          <div key={idx} className="bg-stone-950 border border-stone-800 rounded p-2.5 font-mono space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-stone-400 font-bold">Test Case {idx + 1}</span>
                              {res.passed ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] border-none font-bold">Passed</Badge>
                              ) : (
                                <Badge className="bg-rose-500/20 text-rose-400 text-[10px] border-none font-bold">Wrong Answer</Badge>
                              )}
                            </div>
                            <p className="text-stone-500 text-[11px] pt-1">Input: <span className="text-stone-300">{res.input}</span></p>
                            <p className="text-stone-500 text-[11px]">Output: <span className={cn(res.passed ? 'text-emerald-400' : 'text-rose-400')}>{res.actualOutput}</span></p>
                            {res.expectedOutput && (
                              <p className="text-stone-500 text-[11px]">Expected: <span className="text-stone-300">{res.expectedOutput}</span></p>
                            )}
                            {res.stdout && (
                              <div className="mt-1 pt-1 border-t border-stone-900 text-[10px] text-stone-400">
                                <span className="text-stone-600">stdout:</span> {res.stdout}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Problem Directory Picker Modal */}
      <Dialog open={problemPickerOpen} onOpenChange={setProblemPickerOpen}>
        <DialogContent className="sm:max-w-2xl bg-stone-950 border-stone-800 text-stone-100 max-h-[85vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-400" />
              LeetCode &amp; HackerRank Problem Bank
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-400">
              Curated Data Structures &amp; Algorithms problems for FAANG, TCS NQT, Infosys, Amazon &amp; GATE CS.
            </DialogDescription>
          </DialogHeader>

          {/* Search & Filter Toolbar */}
          <div className="flex items-center gap-2 my-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <Input
                placeholder="Search by title, tag (e.g. Array, DP, Google, Amazon)..."
                value={searchProblem}
                onChange={(e) => setSearchProblem(e.target.value)}
                className="pl-8 h-8 text-xs bg-stone-900 border-stone-800 text-stone-200"
              />
            </div>
            <div className="flex items-center gap-1 text-xs">
              {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setFilterDifficulty(diff)}
                  className={cn(
                    'px-2.5 py-1 rounded text-[11px] font-semibold transition',
                    filterDifficulty === diff ? 'bg-blue-600 text-white' : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
                  )}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Problems List */}
          <ScrollArea className="flex-1 max-h-[50vh] pr-2">
            <div className="space-y-2">
              {filteredProblems.map((prob) => (
                <div
                  key={prob.id}
                  onClick={() => {
                    setSelectedProblem(prob);
                    setExecutionResult(null);
                    setProblemPickerOpen(false);
                  }}
                  className={cn(
                    'p-3 rounded-lg border transition cursor-pointer flex items-center justify-between',
                    selectedProblem.id === prob.id
                      ? 'bg-blue-950/40 border-blue-600'
                      : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
                  )}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-xs text-white truncate">{prob.title}</p>
                      <Badge
                        className={cn(
                          'text-[10px] px-1.5 py-0 h-4 border-none font-bold',
                          prob.difficulty === 'Easy' && 'bg-emerald-500/20 text-emerald-400',
                          prob.difficulty === 'Medium' && 'bg-amber-500/20 text-amber-400',
                          prob.difficulty === 'Hard' && 'bg-rose-500/20 text-rose-400'
                        )}
                      >
                        {prob.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-400">
                      <span>{prob.category}</span>
                      <span>·</span>
                      <span>Acceptance: {prob.acceptanceRate}</span>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-stone-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
