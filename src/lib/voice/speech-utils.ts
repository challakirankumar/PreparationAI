// ============================================================================
// Voice Mentor — Web Speech API Wrappers
// ----------------------------------------------------------------------------
// Wraps the browser's built-in SpeechRecognition (speech-to-text) and
// SpeechSynthesis (text-to-speech) APIs with TypeScript types + helpers.
//
// No external dependencies — uses the native browser APIs which are:
//   - Free (no API tokens)
//   - Offline-capable (TTS voices are bundled with the OS)
//   - Privacy-friendly (recognition happens on-device in Chrome)
//
// Fallback: if the browser doesn't support Web Speech API, the UI shows
// a clear message and falls back to text input + silent text display.
// ============================================================================

// ---------------------------------------------------------------------------
// TypeScript declarations for Web Speech API
// (Not in the default DOM lib.d.ts — we extend it)
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechRecognitionOptions {
  lang?: string;              // BCP-47 tag: 'en-US' | 'hi-IN' | 'es-ES' | 'fr-FR'
  continuous?: boolean;       // keep listening after a pause (default false)
  interimResults?: boolean;   // return partial results as user speaks (default true)
  maxAlternatives?: number;   // default 1
}

// ---------------------------------------------------------------------------
// Language code mapping — from our i18n codes to BCP-47 speech tags
// ---------------------------------------------------------------------------

export function i18nToSpeechLang(i18nLang: string): string {
  switch (i18nLang) {
    case 'hi': return 'hi-IN';
    case 'es': return 'es-ES';
    case 'fr': return 'fr-FR';
    default: return 'en-US';
  }
}

// ---------------------------------------------------------------------------
// Browser support check
// ---------------------------------------------------------------------------

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
}

// ---------------------------------------------------------------------------
// SpeechRecognition wrapper — speech-to-text
// ---------------------------------------------------------------------------

export class SpeechRecognizer {
  private recognition: any = null;
  private listening = false;
  private onResultCallback?: (result: SpeechRecognitionResult) => void;
  private onErrorCallback?: (error: string) => void;
  private onEndCallback?: () => void;

  constructor(options: SpeechRecognitionOptions = {}) {
    if (!isSpeechRecognitionSupported()) {
      throw new Error('Speech recognition is not supported in this browser. Use Chrome or Edge.');
    }
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognitionClass();
    this.recognition.lang = options.lang ?? 'en-US';
    this.recognition.continuous = options.continuous ?? false;
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.maxAlternatives = options.maxAlternatives ?? 1;

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0;
        const isFinal = result.isFinal;
        if (this.onResultCallback) {
          this.onResultCallback({ transcript, confidence, isFinal });
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      if (this.onErrorCallback) {
        this.onErrorCallback(event.error || 'unknown error');
      }
    };

    this.recognition.onend = () => {
      this.listening = false;
      if (this.onEndCallback) this.onEndCallback();
    };
  }

  setLang(lang: string) {
    this.recognition.lang = lang;
  }

  onResult(cb: (result: SpeechRecognitionResult) => void) {
    this.onResultCallback = cb;
  }

  onError(cb: (error: string) => void) {
    this.onErrorCallback = cb;
  }

  onEnd(cb: () => void) {
    this.onEndCallback = cb;
  }

  start() {
    if (this.listening) return;
    try {
      this.recognition.start();
      this.listening = true;
    } catch (e) {
      // Already started or not allowed
    }
  }

  stop() {
    if (!this.listening) return;
    try {
      this.recognition.stop();
      this.listening = false;
    } catch (e) {
      // Already stopped
    }
  }

  isListening(): boolean {
    return this.listening;
  }
}

// ---------------------------------------------------------------------------
// SpeechSynthesis wrapper — text-to-speech
// ---------------------------------------------------------------------------

export interface SpeechSynthesisOptions {
  lang?: string;
  rate?: number;       // 0.1 to 10, default 1
  pitch?: number;      // 0 to 2, default 1
  volume?: number;    // 0 to 1, default 1
  voice?: SpeechSynthesisVoice;
}

export class SpeechSpeaker {
  private options: SpeechSynthesisOptions;
  private speaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onEndCallback?: () => void;
  private onStartCallback?: () => void;
  private onBoundaryCallback?: (charIndex: number) => void;

  constructor(options: SpeechSynthesisOptions = {}) {
    this.options = {
      lang: options.lang ?? 'en-US',
      rate: options.rate ?? 1,
      pitch: options.pitch ?? 1,
      volume: options.volume ?? 1,
      voice: options.voice,
    };
  }

  setOptions(options: Partial<SpeechSynthesisOptions>) {
    this.options = { ...this.options, ...options };
  }

  onSpeakStart(cb: () => void) { this.onStartCallback = cb; }
  onSpeakEnd(cb: () => void) { this.onEndCallback = cb; }
  onBoundary(cb: (charIndex: number) => void) { this.onBoundaryCallback = cb; }

  speak(text: string) {
    if (!isSpeechSynthesisSupported()) {
      if (this.onErrorCallback) this.onErrorCallback(new Error('Speech synthesis not supported'));
      return;
    }
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.options.lang ?? 'en-US';
    utterance.rate = this.options.rate ?? 1;
    utterance.pitch = this.options.pitch ?? 1;
    utterance.volume = this.options.volume ?? 1;
    if (this.options.voice) utterance.voice = this.options.voice;

    utterance.onstart = () => {
      this.speaking = true;
      if (this.onStartCallback) this.onStartCallback();
    };
    utterance.onend = () => {
      this.speaking = false;
      this.currentUtterance = null;
      if (this.onEndCallback) this.onEndCallback();
    };
    utterance.onerror = (e) => {
      this.speaking = false;
      this.currentUtterance = null;
      if (this.onErrorCallback) this.onErrorCallback(new Error(e.error || 'speech error'));
    };
    utterance.onboundary = (e) => {
      if (this.onBoundaryCallback) this.onBoundaryCallback(e.charIndex);
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  private onErrorCallback?: (e: Error) => void;
  onError(cb: (e: Error) => void) { this.onErrorCallback = cb; }

  pause() {
    if (isSpeechSynthesisSupported()) window.speechSynthesis.pause();
  }

  resume() {
    if (isSpeechSynthesisSupported()) window.speechSynthesis.resume();
  }

  cancel() {
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
      this.speaking = false;
      this.currentUtterance = null;
    }
  }

  isSpeaking(): boolean {
    return this.speaking;
  }

  // Get available voices (async — voices load asynchronously in some browsers)
  static getVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      if (!isSpeechSynthesisSupported()) {
        resolve([]);
        return;
      }
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
        return;
      }
      // Voices not loaded yet — wait for the voiceschanged event
      const handler = () => {
        const v = window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = null;
        resolve(v);
      };
      window.speechSynthesis.onvoiceschanged = handler;
      // Timeout fallback after 2s
      setTimeout(() => {
        window.speechSynthesis.onvoiceschanged = null;
        resolve(window.speechSynthesis.getVoices());
      }, 2000);
    });
  }
}

// ---------------------------------------------------------------------------
// Cleanup helper — stop all speech when component unmounts
// ---------------------------------------------------------------------------

export function stopAllSpeech() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
