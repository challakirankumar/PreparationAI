'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/shared';
import { useStore } from '@/lib/store';
import {
  Mic, MicOff, Volume2, VolumeX, Pause, Play, Square, Loader2,
  MessageSquare, Settings, Brain, AlertTriangle, CheckCircle2,
  Headphones, Zap, RefreshCw, Send,
} from 'lucide-react';
import {
  SpeechRecognizer, SpeechSpeaker, stopAllSpeech,
  isSpeechRecognitionSupported, isSpeechSynthesisSupported,
  i18nToSpeechLang,
} from '@/lib/voice/speech-utils';

// ============================================================================
// Types
// ============================================================================

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  spoken?: boolean;
}

// ============================================================================
// Main view
// ============================================================================

export function VoiceMentorView() {
  const user = useStore(s => s.user);

  // Speech state
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [synthesisSupported, setSynthesisSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Settings
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [autoListen, setAutoListen] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Refs
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const speakerRef = useRef<SpeechSpeaker | null>(null);
  const finalTranscriptRef = useRef('');
  const autoListenRef = useRef(autoListen);
  const autoSpeakRef = useRef(autoSpeak);
  const languageRef = useRef('en');

  // Keep refs in sync
  useEffect(() => { autoListenRef.current = autoListen; }, [autoListen]);
  useEffect(() => { autoSpeakRef.current = autoSpeak; }, [autoSpeak]);

  // Read language from localStorage (same as i18n store)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('prep-ai-language');
      if (stored) {
        const parsed = JSON.parse(stored);
        languageRef.current = parsed?.state?.language ?? 'en';
      }
    } catch { /* ignore */ }
  }, []);

  // Initialize on mount
  useEffect(() => {
    const recSupported = isSpeechRecognitionSupported();
    const synSupported = isSpeechSynthesisSupported();
    setRecognitionSupported(recSupported);
    setSynthesisSupported(synSupported);

    if (recSupported) {
      try {
        const recognizer = new SpeechRecognizer({
          lang: i18nToSpeechLang(languageRef.current),
          continuous: false,
          interimResults: true,
        });
        recognizer.onResult((result) => {
          if (result.isFinal) {
            finalTranscriptRef.current += result.transcript;
            setInterimTranscript('');
          } else {
            setInterimTranscript(result.transcript);
          }
        });
        recognizer.onEnd(() => {
          setListening(false);
          const finalText = finalTranscriptRef.current.trim();
          if (finalText) {
            submitMessage(finalText);
            finalTranscriptRef.current = '';
          }
        });
        recognizer.onError((err) => {
          setListening(false);
          setError(`Speech recognition error: ${err}`);
        });
        recognizerRef.current = recognizer;
      } catch (e) {
        setError((e as Error).message);
      }
    }

    if (synSupported) {
      const speaker = new SpeechSpeaker({
        lang: i18nToSpeechLang(languageRef.current),
        rate,
        pitch,
      });
      speaker.onSpeakStart(() => setSpeaking(true));
      speaker.onSpeakEnd(() => {
        setSpeaking(false);
        // Auto-listen after response if enabled
        if (autoListenRef.current && recognitionSupported) {
          setTimeout(() => startListening(), 500);
        }
      });
      speaker.onError((e) => {
        setSpeaking(false);
        setError(`Speech synthesis error: ${e.message}`);
      });
      speakerRef.current = speaker;

      // Load voices
      SpeechSpeaker.getVoices().then((v) => {
        setVoices(v);
        // Pick a default voice matching the language
        const langCode = i18nToSpeechLang(languageRef.current).split('-')[0];
        const defaultVoice = v.find(voice => voice.lang.startsWith(langCode));
        if (defaultVoice) setSelectedVoiceURI(defaultVoice.voiceURI);
      });
    }

    return () => {
      stopAllSpeech();
      if (recognizerRef.current) recognizerRef.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update speaker options when settings change
  useEffect(() => {
    if (speakerRef.current) {
      const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
      speakerRef.current.setOptions({
        lang: i18nToSpeechLang(languageRef.current),
        rate,
        pitch,
        voice,
      });
    }
  }, [voices, selectedVoiceURI, rate, pitch]);

  // Start/stop listening
  const startListening = useCallback(() => {
    if (!recognizerRef.current || listening) return;
    setError(null);
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    try {
      recognizerRef.current.setLang(i18nToSpeechLang(languageRef.current));
      recognizerRef.current.start();
      setListening(true);
    } catch (e) {
      setError(`Failed to start: ${(e as Error).message}`);
    }
  }, [listening]);

  const stopListening = useCallback(() => {
    if (!recognizerRef.current || !listening) return;
    recognizerRef.current.stop();
    setListening(false);
  }, [listening]);

  // Submit message to /api/mentor
  const submitMessage = async (text: string) => {
    if (!text.trim()) return;
    const userTurn: ChatTurn = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setTurns(prev => [...prev, userTurn]);
    setLoading(true);

    try {
      // Build history from existing turns (last 6)
      const history = [...turns, userTurn].slice(-6).map(t => ({ role: t.role, content: t.content }));
      const r = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          profile: {
            examGoal: user?.examGoal || 'JEE Main',
            name: user?.name || 'Aspirant',
            type: user?.type || 'school-12',
          },
          language: languageRef.current,
        }),
      });
      const data = await r.json();
      const reply = data?.reply || "I'm here for you. Could you rephrase your question?";
      const assistantTurn: ChatTurn = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        spoken: false,
      };
      setTurns(prev => [...prev, assistantTurn]);

      // Auto-speak the response
      if (autoSpeakRef.current && synthesisSupported && speakerRef.current) {
        // Strip markdown for cleaner speech
        const cleanReply = reply
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/`(.*?)`/g, '$1')
          .replace(/#{1,6}\s/g, '')
          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
          .replace(/\n+/g, '. ');
        speakerRef.current.speak(cleanReply);
      }
    } catch (e) {
      setError(`Failed to get response: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const submitText = () => {
    if (!textInput.trim()) return;
    submitMessage(textInput);
    setTextInput('');
  };

  const speakTurn = (turn: ChatTurn) => {
    if (!speakerRef.current) return;
    const cleanText = turn.content
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\n+/g, '. ');
    speakerRef.current.speak(cleanText);
  };

  const stopSpeaking = () => {
    if (speakerRef.current) speakerRef.current.cancel();
    setSpeaking(false);
  };

  const toggleMic = () => {
    if (listening) stopListening();
    else startListening();
  };

  const toggleSpeaking = () => {
    if (!speakerRef.current) return;
    if (speaking) {
      speakerRef.current.pause();
      setSpeaking(false);
    } else {
      speakerRef.current.resume();
      setSpeaking(true);
    }
  };

  const reset = () => {
    stopAllSpeech();
    if (recognizerRef.current) recognizerRef.current.stop();
    setTurns([]);
    setInterimTranscript('');
    setError(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voice Mentor"
        subtitle="Spoken doubt-solving for accessibility and hands-busy studying — speak your question, hear the answer"
        accent="blue"
        icon={Mic}
      />

      {/* Browser support warning */}
      {(!recognitionSupported || !synthesisSupported) && (
        <Card className="p-4 border-amber-300 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800 mb-1">Limited browser support</h4>
              <p className="text-sm text-amber-700">
                {!recognitionSupported && 'Speech recognition is not supported in this browser. Use Chrome or Edge for voice input. '}
                {!synthesisSupported && 'Speech synthesis is not supported. Text output will be displayed but not spoken. '}
                You can still use text input below.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Voice control panel (left, 1 col) */}
        <div className="space-y-4">
          {/* Big mic button */}
          <Card className="p-6 border-blue-200 text-center">
            <h3 className="font-semibold text-stone-800 mb-4 flex items-center justify-center gap-2">
              <Headphones className="h-5 w-5 text-blue-500" />
              Voice Control
            </h3>
            <button
              onClick={toggleMic}
              disabled={!recognitionSupported || loading}
              className={`mx-auto h-24 w-24 rounded-full flex items-center justify-center transition-all ${
                listening
                  ? 'bg-rose-500 animate-pulse shadow-lg shadow-rose-200'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'
              } ${(!recognitionSupported || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {listening ? (
                <MicOff className="h-10 w-10 text-white" />
              ) : (
                <Mic className="h-10 w-10 text-white" />
              )}
            </button>
            <p className="mt-3 text-sm font-medium text-stone-700">
              {listening ? 'Listening…' : 'Tap to speak'}
            </p>
            {interimTranscript && (
              <p className="mt-2 text-xs text-stone-500 italic bg-stone-50 p-2 rounded">
                "{interimTranscript}"
              </p>
            )}

            {/* Speaking controls */}
            {speaking && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <div className="flex items-center justify-center gap-2">
                  <Button size="sm" variant="outline" onClick={toggleSpeaking}>
                    <Pause className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={stopSpeaking} className="text-rose-600">
                    <Square className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-stone-500 mt-2 flex items-center justify-center gap-1">
                  <Volume2 className="h-3 w-3 animate-pulse" />
                  Speaking…
                </p>
              </div>
            )}
          </Card>

          {/* Quick actions */}
          <Card className="p-4 border-blue-200">
            <h4 className="text-xs font-semibold text-stone-500 uppercase mb-2">Quick Actions</h4>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={reset}>
                <RefreshCw className="h-3 w-3 mr-2" />Reset conversation
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setShowSettings(s => !s)}>
                <Settings className="h-3 w-3 mr-2" />Voice settings
              </Button>
            </div>

            {/* Auto-listen + auto-speak toggles */}
            <div className="mt-3 space-y-2 pt-3 border-t border-stone-100">
              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-500" />
                  Auto-listen after response
                </span>
                <Switch checked={autoListen} onCheckedChange={setAutoListen} />
              </label>
              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="flex items-center gap-1">
                  <Volume2 className="h-3 w-3 text-blue-500" />
                  Auto-speak responses
                </span>
                <Switch checked={autoSpeak} onCheckedChange={setAutoSpeak} />
              </label>
            </div>
          </Card>

          {/* Settings panel (collapsible) */}
          {showSettings && (
            <Card className="p-4 border-blue-200 space-y-3">
              <h4 className="text-xs font-semibold text-stone-500 uppercase">Voice Settings</h4>
              {synthesisSupported && voices.length > 0 && (
                <div>
                  <Label className="text-xs text-stone-500">Voice</Label>
                  <Select value={selectedVoiceURI} onValueChange={setSelectedVoiceURI}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Default" /></SelectTrigger>
                    <SelectContent>
                      {voices
                        .filter(v => v.lang.startsWith(i18nToSpeechLang(languageRef.current).split('-')[0]))
                        .map(v => (
                          <SelectItem key={v.voiceURI} value={v.voiceURI}>
                            {v.name} ({v.lang})
                          </SelectItem>
                        ))}
                      {voices
                        .filter(v => !v.lang.startsWith(i18nToSpeechLang(languageRef.current).split('-')[0]))
                        .slice(0, 10)
                        .map(v => (
                          <SelectItem key={v.voiceURI} value={v.voiceURI}>
                            {v.name} ({v.lang})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-xs text-stone-500">Rate: {rate.toFixed(1)}x</Label>
                <input
                  type="range" min={0.5} max={2} step={0.1} value={rate}
                  onChange={e => setRate(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-stone-500">Pitch: {pitch.toFixed(1)}</Label>
                <input
                  type="range" min={0.5} max={2} step={0.1} value={pitch}
                  onChange={e => setPitch(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={() => speakTurn({ id: 'test', role: 'assistant', content: 'Hello! This is a test of the voice mentor. How does it sound?', timestamp: new Date().toISOString() })}>
                <Volume2 className="h-3 w-3 mr-1" />Test voice
              </Button>
            </Card>
          )}
        </div>

        {/* Chat thread (right, 2 cols) */}
        <Card className="p-4 lg:col-span-2 border-blue-200 min-h-[500px] flex flex-col">
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
              <Button variant="ghost" size="sm" onClick={reset}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[500px]">
            {turns.length === 0 && !interimTranscript ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-4">
                  <Mic className="h-8 w-8 text-blue-500" />
                </div>
                <h4 className="font-semibold text-stone-700">Speak or type your question</h4>
                <p className="text-sm text-stone-500 mt-1 max-w-md">
                  Tap the microphone button to speak your doubt aloud, or type below. The mentor will respond in your selected language and speak the answer back to you.
                </p>
              </div>
            ) : (
              <>
                {turns.map(t => (
                  <div key={t.id} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${t.role === 'user' ? 'order-2' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {t.role === 'assistant' && (
                          <Button size="sm" variant="ghost" className="h-5 text-xs" onClick={() => speakTurn(t)}>
                            <Volume2 className="h-3 w-3" />
                          </Button>
                        )}
                        <span className="text-[10px] text-stone-400">
                          {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`rounded-2xl px-4 py-2 ${
                        t.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-stone-100 text-stone-800 rounded-bl-sm'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{t.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {interimTranscript && (
                  <div className="flex justify-end">
                    <div className="max-w-[85%]">
                      <div className="rounded-2xl px-4 py-2 bg-blue-200 text-stone-700 rounded-br-sm italic">
                        <p className="text-sm">{interimTranscript}…</p>
                      </div>
                    </div>
                  </div>
                )}
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-stone-500 pl-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mentor is thinking…
                  </div>
                )}
              </>
            )}
          </div>

          {/* Text input fallback */}
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-2">
            <Input
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitText(); } }}
              placeholder="Or type your question here…"
              className="flex-1"
            />
            <Button onClick={submitText} disabled={!textInput.trim() || loading} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Bottom explainer */}
      <Card className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Brain className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-stone-800 mb-1">How Voice Mentor works</h4>
            <ul className="text-sm text-stone-700 space-y-1 list-disc list-inside">
              <li><strong>Speech-to-text</strong>: Your spoken question is transcribed via the browser's built-in SpeechRecognition API (Chrome/Edge recommended). No audio is sent to a server — recognition happens on-device.</li>
              <li><strong>AI mentor response</strong>: The transcript is sent to the same <code className="font-mono bg-stone-100 px-1">/api/mentor</code> endpoint, routed through EduScope (PII redaction, scope clamp, language injection).</li>
              <li><strong>Text-to-speech</strong>: The mentor's response is spoken aloud via the browser's SpeechSynthesis API. Markdown formatting is stripped for cleaner speech.</li>
              <li><strong>Auto-listen mode</strong>: After the mentor finishes speaking, the mic automatically re-activates for follow-up questions — perfect for hands-busy studying.</li>
              <li><strong>Multi-language</strong>: Voice input/output respects your language preference (English, Hindi, Spanish, French) from the sidebar language switcher.</li>
              <li><strong>Accessibility</strong>: Designed for visually impaired students, hands-busy scenarios (cooking, commuting), and kinesthetic learners.</li>
            </ul>
            <p className="text-xs text-stone-500 mt-2">
              <AlertTriangle className="inline h-3 w-3 mr-1" />
              Voice quality and available languages depend on your browser/OS. Chrome on desktop provides the best experience with the widest language coverage.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
