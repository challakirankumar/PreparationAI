'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared';
import { useStore } from '@/lib/store';
import {
  BookOpen, Search, Send, Loader2, FileText, ExternalLink,
  Brain, Library, Quote, AlertTriangle, CheckCircle2, RefreshCw,
  ChevronRight, BookMarked, GraduationCap,
} from 'lucide-react';

// ============================================================================
// Types matching API responses
// ============================================================================

interface ContextCitation {
  chunkId: string;
  source: string;
  chapter?: string;
  page?: number;
  subject: string;
  topic: string;
  title: string;
  excerpt: string;
}

interface RagResponse {
  reply: string;
  citations: ContextCitation[];
  retrievedCount: number;
  detectedSubject?: string;
  detectedTopic?: string;
  auditId?: string;
  blocked?: boolean;
  fallback?: boolean;
}

interface RagDocument {
  id: string;
  title: string;
  subject: string;
  topic: string;
  source: string;
  sourceType: string;
  chapter?: string;
  page?: number;
  chunks: { id: string; index: number; text: string }[];
}

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: ContextCitation[];
  detectedSubject?: string;
  detectedTopic?: string;
  retrievedCount?: number;
  blocked?: boolean;
  fallback?: boolean;
}

// ============================================================================
// Subject color mapping
// ============================================================================

const SUBJECT_COLORS: Record<string, string> = {
  Physics: 'bg-blue-50 text-blue-700 border-blue-200',
  Chemistry: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Mathematics: 'bg-purple-50 text-purple-700 border-purple-200',
  Biology: 'bg-rose-50 text-rose-700 border-rose-200',
};

// ============================================================================
// Main view
// ============================================================================

export function RagTutorView() {
  const user = useStore(s => s.user);
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load document list (for the sidebar — shows what's indexed)
  useEffect(() => {
    (async () => {
      try {
        // We don't have a /api/rag-tutor/documents GET yet — use the document store directly via the chunks count
        // For now, hardcode the known documents from the seed data
        setDocuments([
          { id: 'ncert_phy_laws_motion', title: 'Laws of Motion', subject: 'Physics', topic: 'Laws of Motion', source: 'NCERT Class 11 Physics, Chapter 5', sourceType: 'ncert', chapter: 'Chapter 5', page: 87, chunks: [] },
          { id: 'ncert_phy_work_energy', title: 'Work, Energy and Power', subject: 'Physics', topic: 'Work Energy Power', source: 'NCERT Class 11 Physics, Chapter 6', sourceType: 'ncert', chapter: 'Chapter 6', page: 110, chunks: [] },
          { id: 'hcverma_rotational', title: 'Rotational Mechanics', subject: 'Physics', topic: 'Rotational Motion', source: 'HC Verma, Concepts of Physics Vol 1, Chapter 10', sourceType: 'reference-book', chapter: 'Chapter 10', page: 220, chunks: [] },
          { id: 'ncert_chem_bonding', title: 'Chemical Bonding and Molecular Structure', subject: 'Chemistry', topic: 'Chemical Bonding', source: 'NCERT Class 11 Chemistry, Chapter 4', sourceType: 'ncert', chapter: 'Chapter 4', page: 65, chunks: [] },
          { id: 'ncert_math_diff', title: 'Differentiation', subject: 'Mathematics', topic: 'Calculus', source: 'NCERT Class 12 Mathematics, Chapter 5', sourceType: 'ncert', chapter: 'Chapter 5', page: 95, chunks: [] },
          { id: 'ncert_math_prob', title: 'Probability', subject: 'Mathematics', topic: 'Probability', source: 'NCERT Class 12 Mathematics, Chapter 13', sourceType: 'ncert', chapter: 'Chapter 13', page: 380, chunks: [] },
          { id: 'ncert_bio_genetics', title: 'Principles of Inheritance and Variation', subject: 'Biology', topic: 'Genetics', source: 'NCERT Class 12 Biology, Chapter 5', sourceType: 'ncert', chapter: 'Chapter 5', page: 70, chunks: [] },
        ]);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, loading]);

  const sendQuery = async () => {
    const query = input.trim();
    if (!query || loading) return;
    setError(null);

    const userTurn: ChatTurn = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };
    setTurns(prev => [...prev, userTurn]);
    setInput('');
    setLoading(true);

    try {
      const history = turns.slice(-4).map(t => ({ role: t.role, content: t.content }));
      const r = await fetch('/api/rag-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          userId: user?.id,
          user: user ? { id: user.id, type: user.type, examGoal: user.examGoal } : undefined,
          language: typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('prep-ai-language') || '{"state":{"language":"en"}}').state?.language || 'en') : 'en',
          history,
          topK: 5,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to get answer');
      }
      const j: RagResponse = await r.json();
      const assistantTurn: ChatTurn = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: j.reply,
        timestamp: new Date().toISOString(),
        citations: j.citations,
        detectedSubject: j.detectedSubject,
        detectedTopic: j.detectedTopic,
        retrievedCount: j.retrievedCount,
        blocked: j.blocked,
        fallback: j.fallback,
      };
      setTurns(prev => [...prev, assistantTurn]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTurns([]);
    setError(null);
  };

  // Quick prompt suggestions
  const suggestions = [
    'What is Newton\'s second law of motion?',
    'Explain the work-energy theorem',
    'What is hybridization in chemical bonding?',
    'State the chain rule in differentiation',
    'What is Bayes\' theorem in probability?',
    'Explain Mendel\'s law of segregation',
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="RAG Tutor"
        subtitle="Chat directly with NCERT and reference materials — every answer cites its source, no hallucinations"
        accent="blue"
        icon={BookOpen}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat column (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Chat card */}
          <Card className="p-4 border-blue-200 min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-500" />
                Conversation
                {turns.length > 0 && (
                  <Badge variant="outline" className="bg-stone-50 text-stone-600 text-xs ml-1">
                    {turns.length} turn{turns.length === 1 ? '' : 's'}
                  </Badge>
                )}
              </h3>
              {turns.length > 0 && (
                <Button variant="ghost" size="sm" onClick={reset}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[450px]">
              {turns.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-4">
                    <BookOpen className="h-8 w-8 text-blue-500" />
                  </div>
                  <h4 className="font-semibold text-stone-700">Ask about your syllabus</h4>
                  <p className="text-sm text-stone-500 mt-1 max-w-md mb-4">
                    Every answer is grounded in indexed NCERT chapters and reference books — with inline citations and page numbers. No hallucinations.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl">
                    {suggestions.map(s => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="text-left text-xs text-blue-700 hover:bg-blue-50 px-2 py-1.5 rounded border border-blue-100 transition"
                      >
                        <Quote className="inline h-3 w-3 mr-1" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                turns.map(t => <ChatBubble key={t.id} turn={t} />)
              )}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-stone-500 pl-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Retrieving sources + generating answer…
                </div>
              )}
            </div>
          </Card>

          {/* Input */}
          <Card className="p-3 border-blue-200">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  sendQuery();
                }
              }}
              placeholder="Ask about any concept from your syllabus — answers cite the source…"
              rows={2}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-stone-400">⌘+Enter to send · Answers cite NCERT/reference sources</p>
              <Button onClick={sendQuery} disabled={loading || !input.trim()} size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                Ask
              </Button>
            </div>
            {error && (
              <p className="text-xs text-rose-600 mt-2">{error}</p>
            )}
          </Card>
        </div>

        {/* Sidebar (1 col) — indexed documents */}
        <div className="space-y-4">
          <Card className="p-4 border-blue-200">
            <h3 className="font-semibold text-stone-800 mb-2 flex items-center gap-2 text-sm">
              <Library className="h-4 w-4 text-blue-500" />
              Indexed Sources
            </h3>
            <p className="text-xs text-stone-500 mb-3">
              {documents.length} documents indexed · {documents.reduce((s, d) => s + Math.max(1, Math.floor(d.page ? 200 / 200 : 1)), 0)}+ chunks
            </p>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {documents.map(doc => (
                <div key={doc.id} className="p-2 rounded border border-stone-200 hover:border-blue-300 transition">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-stone-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-stone-700 truncate">{doc.title}</p>
                      <p className="text-[10px] text-stone-500 truncate">{doc.source}</p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <Badge variant="outline" className={`text-[9px] ${SUBJECT_COLORS[doc.subject] ?? 'bg-stone-50 text-stone-700 border-stone-200'}`}>
                          {doc.subject}
                        </Badge>
                        {doc.sourceType === 'ncert' && (
                          <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">
                            NCERT
                          </Badge>
                        )}
                        {doc.sourceType === 'reference-book' && (
                          <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-700 border-purple-200">
                            Reference
                          </Badge>
                        )}
                      </div>
                      {doc.page && (
                        <p className="text-[10px] text-stone-400 mt-0.5">p. {doc.page}+</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* How it works */}
          <Card className="p-4 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
            <h4 className="font-semibold text-stone-800 mb-2 text-sm flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-500" />
              How RAG Works
            </h4>
            <ol className="text-xs text-stone-700 space-y-1.5 list-decimal list-inside">
              <li>Your question is tokenized + analyzed for subject/topic</li>
              <li>Top-5 most relevant chunks are retrieved via TF-IDF ranking</li>
              <li>Chunks + your question are sent to GLM-4.6 with a strict "answer only from context" prompt</li>
              <li>The answer cites sources inline: [Source 1, p. 87]</li>
              <li>If no relevant chunks found, the tutor says so — no hallucination</li>
            </ol>
            <p className="text-[10px] text-stone-500 mt-2 italic">
              Currently indexed: NCERT Physics (Ch 5-6), HC Verma (Ch 10), NCERT Chemistry (Ch 4), NCERT Math (Ch 5, 13), NCERT Biology (Ch 5).
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Chat bubble with citations
// ============================================================================

function ChatBubble({ turn }: { turn: ChatTurn }) {
  const isUser = turn.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[90%] ${isUser ? 'order-2' : ''}`}>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {!isUser && turn.detectedSubject && (
            <Badge variant="outline" className={`text-xs ${SUBJECT_COLORS[turn.detectedSubject] ?? 'bg-stone-50'}`}>
              {turn.detectedSubject}
            </Badge>
          )}
          {!isUser && turn.detectedTopic && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {turn.detectedTopic}
            </Badge>
          )}
          {!isUser && typeof turn.retrievedCount === 'number' && (
            <Badge variant="outline" className="text-xs bg-stone-50 text-stone-600 border-stone-200">
              {turn.retrievedCount} source{turn.retrievedCount === 1 ? '' : 's'}
            </Badge>
          )}
          {!isUser && turn.fallback && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              Fallback
            </Badge>
          )}
          {!isUser && turn.blocked && (
            <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200">
              Blocked
            </Badge>
          )}
          <span className="text-[10px] text-stone-400">
            {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className={`rounded-2xl px-4 py-2 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-stone-100 text-stone-800 rounded-bl-sm'
        }`}>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{turn.content}</p>
        </div>

        {/* Citations */}
        {!isUser && turn.citations && turn.citations.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-[10px] font-semibold text-stone-500 uppercase flex items-center gap-1">
              <BookMarked className="h-3 w-3" />
              Sources cited ({turn.citations.length})
            </p>
            <div className="space-y-1">
              {turn.citations.map((cite, idx) => (
                <CitationCard key={idx} citation={cite} index={idx + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Citation card
// ============================================================================

function CitationCard({ citation, index }: { citation: ContextCitation; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const subjectColor = SUBJECT_COLORS[citation.subject] ?? 'bg-stone-50 text-stone-700 border-stone-200';

  return (
    <div className={`p-2 rounded-lg border ${subjectColor} text-xs`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <span className="font-mono font-bold flex-shrink-0">[{index}]</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{citation.source}</p>
          {citation.chapter && (
            <p className="text-[10px] opacity-70 truncate">{citation.chapter}</p>
          )}
        </div>
        {citation.page && (
          <Badge variant="outline" className="text-[9px] bg-white/60 border-current">
            p. {citation.page}
          </Badge>
        )}
        <ChevronRight className={`h-3 w-3 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-current/20">
          <p className="text-[10px] font-semibold opacity-70 uppercase mb-1">{citation.subject} → {citation.topic}</p>
          <p className="italic opacity-90 leading-relaxed">"{citation.excerpt}"</p>
        </div>
      )}
    </div>
  );
}
