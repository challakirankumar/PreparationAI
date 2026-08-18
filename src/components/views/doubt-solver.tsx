'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared';
import { useStore } from '@/lib/store';
import {
  Camera, Upload, Image as ImageIcon, Send, Loader2, Trash2,
  Sparkles, AlertCircle, MessageSquare, X, GraduationCap,
} from 'lucide-react';

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;        // data URL preview for user messages
  subject?: string;       // for assistant messages
  socratic?: boolean;
  blocked?: boolean;
  timestamp: string;
}

export function DoubtSolverView() {
  const user = useStore(s => s.user);
  const [prompt, setPrompt] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, loading]);

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, HEIC, etc.).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image is too large. Please pick one under 8 MB.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
      setImageName(file.name);
    };
    reader.onerror = () => setError('Could not read the file. Try a different image.');
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const clearImage = () => {
    setImageDataUrl(null);
    setImageName(null);
  };

  const submit = async () => {
    if (!prompt.trim() && !imageDataUrl) return;
    setError(null);

    const userTurn: ChatTurn = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: prompt.trim() || '(uploaded image — please analyse)',
      image: imageDataUrl ?? undefined,
      timestamp: new Date().toISOString(),
    };
    setTurns(prev => [...prev, userTurn]);
    setLoading(true);

    // Build history for context (last 6 turns, alternating roles)
    const history = turns.slice(-6).map(t => ({ role: t.role, content: t.content }));

    try {
      const r = await fetch('/api/solve-doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl,
          prompt: prompt.trim(),
          user: user ? { id: user.id, type: user.type, examGoal: user.examGoal } : undefined,
          examGoal: user?.examGoal,
          history,
        }),
      });
      const j = await r.json();
      const assistantTurn: ChatTurn = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: j.reply,
        subject: j.subject,
        socratic: j.socratic,
        blocked: j.blocked,
        timestamp: new Date().toISOString(),
      };
      setTurns(prev => [...prev, assistantTurn]);
      setPrompt('');
      clearImage();
    } catch (e) {
      setError(`Could not reach the doubt solver. ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) continue;
        if (file.size > 8 * 1024 * 1024) {
          setError('Pasted image is too large. Use one under 8 MB.');
          continue;
        }
        const reader = new FileReader();
        reader.onload = () => {
          setImageDataUrl(reader.result as string);
          setImageName('pasted-image.png');
        };
        reader.readAsDataURL(file);
        e.preventDefault();
        break;
      }
    }
  }, []);

  return (
    <div className="space-y-6" onPaste={handlePaste}>
      <PageHeader
        title="AI Doubt Solver"
        subtitle="Snap a photo of any problem — handwritten, textbook, or diagram — and get Socratic step-by-step guidance"
        accent="blue"
        icon={Camera}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload + composer column */}
        <Card className="p-4 lg:col-span-1 h-fit border-blue-200">
          <h3 className="font-semibold text-stone-800 mb-2 flex items-center gap-2">
            <Upload className="h-4 w-4 text-blue-500" />
            Upload Doubt
          </h3>
          <p className="text-xs text-stone-500 mb-3">
            Drag-and-drop, paste from clipboard, or use the buttons below.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileSelected}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileSelected}
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="h-4 w-4 mr-1" />
              Gallery
            </Button>
            <Button variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()}>
              <Camera className="h-4 w-4 mr-1" />
              Camera
            </Button>
          </div>

          {/* Image preview */}
          {imageDataUrl && (
            <div className="relative group mb-3">
              <img
                src={imageDataUrl}
                alt="uploaded doubt"
                className="w-full h-40 object-cover rounded-lg border border-blue-200"
              />
              <button
                onClick={clearImage}
                className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
              {imageName && (
                <p className="text-xs text-stone-500 mt-1 truncate">{imageName}</p>
              )}
            </div>
          )}

          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="What's your doubt? e.g. 'I'm stuck at step 3 — why is the friction force negative here?'"
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-stone-400 mt-1">
            Tip: ask “guide me” rather than “give me the answer” — the AI uses Socratic mode for academic doubts.
          </p>

          <Button
            onClick={submit}
            disabled={loading || (!prompt.trim() && !imageDataUrl)}
            className="w-full mt-3"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Analysing…
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                Solve My Doubt
              </>
            )}
          </Button>

          {error && (
            <div className="mt-3 flex items-start gap-2 p-2 bg-rose-50 border border-rose-200 rounded text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Suggestions */}
          <div className="mt-4 border-t border-stone-100 pt-3">
            <p className="text-xs font-semibold text-stone-500 uppercase mb-2">Quick prompts</p>
            <div className="space-y-1">
              {[
                'Walk me through the approach to this problem',
                'Where did I go wrong in this solution?',
                'Explain the concept behind this question',
                'Is there a faster way to solve this?',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => setPrompt(q)}
                  className="block w-full text-left text-xs text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition"
                >
                  “{q}”
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Chat thread column */}
        <Card className="p-4 lg:col-span-2 border-blue-200 min-h-[60vh] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-stone-800 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              Conversation
              {turns.length > 0 && (
                <Badge variant="outline" className="bg-stone-50 text-stone-600 text-xs ml-1">
                  {turns.length} turn{turns.length === 1 ? '' : 's'}
                </Badge>
              )}
            </h3>
            {turns.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setTurns([])}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {turns.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-blue-500" />
                </div>
                <h4 className="font-semibold text-stone-700">Snap it. Solve it.</h4>
                <p className="text-sm text-stone-500 mt-1 max-w-md">
                  Upload a photo of any problem — handwritten notes, textbook exercise, equation,
                  or graph. The AI will guide you step by step without giving away the final answer.
                </p>
                <div className="grid grid-cols-3 gap-2 mt-6 max-w-sm">
                  {[
                    { icon: '📐', label: 'Math' },
                    { icon: '⚗️', label: 'Chemistry' },
                    { icon: '🔬', label: 'Physics' },
                    { icon: '🧬', label: 'Biology' },
                    { icon: '📖', label: 'English' },
                    { icon: '💡', label: 'Reasoning' },
                  ].map(s => (
                    <div key={s.label} className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                      <p className="text-lg">{s.icon}</p>
                      <p className="text-xs text-stone-600">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              turns.map(t => <ChatBubble key={t.id} turn={t} />)
            )}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-stone-500 pl-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analysing your doubt…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </Card>
      </div>

      {/* Bottom info card */}
      <Card className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <div className="flex items-start gap-3">
          <GraduationCap className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-stone-800 mb-1">How it works</h4>
            <ul className="text-sm text-stone-700 space-y-1 list-disc list-inside">
              <li>Upload a photo (or paste from clipboard) of your problem, solution attempt, diagram, or equation.</li>
              <li>Ask a specific question — “where did I go wrong?” works better than “solve this”.</li>
              <li>The AI runs through EduScope (the shared guardrail layer), so PII is auto-redacted and off-topic requests are politely refused.</li>
              <li>For academic doubts, Socratic mode engages — you'll get guiding questions, not the final answer on a plate.</li>
              <li>Each session is audited; you can review all activity in the Guardrail Dashboard.</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ChatBubble({ turn }: { turn: ChatTurn }) {
  const isUser = turn.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : ''}`}>
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : ''}`}>
          {!isUser && turn.subject && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {turn.subject}
            </Badge>
          )}
          {!isUser && turn.socratic && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              Socratic
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
        <div
          className={`rounded-2xl px-4 py-2 ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-stone-100 text-stone-800 rounded-bl-sm'
          }`}
        >
          {turn.image && (
            <img
              src={turn.image}
              alt="uploaded"
              className="w-full max-w-xs rounded-lg mb-2 border border-white/20"
            />
          )}
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{turn.content}</p>
        </div>
      </div>
    </div>
  );
}
