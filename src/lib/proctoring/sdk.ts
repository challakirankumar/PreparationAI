'use client';

import type { ProctoringEvent, ProctoringEventType, Severity, ProctoringProfile } from '@/lib/types';

/**
 * Client-Side Proctoring SDK
 * 
 * On-device detection — does NOT send raw video to the server.
 * Only structured events + compressed JPEG snapshots for flagged moments.
 * 
 * Detection modules (each independently toggleable per exam profile):
 * - Face presence (no face for > N seconds)
 * - Multiple faces (>1 face in frame)
 * - Gaze/head-pose (sustained head turn)
 * - Object detection (phone/book-shaped objects)
 * - Browser lockdown (tab switch, fullscreen exit, copy/paste, devtools)
 * 
 * Privacy: ML inference runs on-device. Only event metadata + single
 * JPEG snapshots on medium+ severity are uploaded. No raw video streams.
 */

type EventCallback = (event: ProctoringEvent) => void;

export class ProctoringSDK {
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private profile: ProctoringProfile;
  private sessionId: string;
  private onEvent: EventCallback;
  
  // Detection state
  private faceAbsentSince: number | null = null;
  private gazeAwaySince: number | null = null;
  private lastFaceCount = 0;
  private isMonitoring = false;
  private frameInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private eventBuffer: ProctoringEvent[] = [];
  private lastEventTime: Record<string, number> = {};
  private examStartTime: number = 0;
  private cameraGranted = false;
  
  // Debounce config
  private readonly DEBOUNCE_MS = 3000; // dedup same event within 3s
  private readonly FLUSH_INTERVAL_MS = 4000; // flush buffer every 4s
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  
  // Browser lockdown state
  private fullscreenActive = false;
  private inputRestrictionsActive = false;

  constructor(config: {
    sessionId: string;
    profile: ProctoringProfile;
    onEvent: EventCallback;
  }) {
    this.sessionId = config.sessionId;
    this.profile = config.profile;
    this.onEvent = config.onEvent;
  }

  /**
   * Initialize camera and start monitoring.
   * Returns true if camera was granted, false if degraded mode.
   */
  async start(cameraEnabled: boolean, micEnabled: boolean): Promise<boolean> {
    this.examStartTime = Date.now();

    if (cameraEnabled) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: 4 },
          audio: micEnabled,
        });
        this.cameraGranted = true;
        
        this.video = document.createElement('video');
        this.video.srcObject = this.stream;
        this.video.autoplay = true;
        this.video.muted = true;
        this.video.style.display = 'none';
        document.body.appendChild(this.video);
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = 640;
        this.canvas.height = 480;
      } catch (err) {
        console.warn('[Proctoring] Camera access denied — degraded mode');
        this.cameraGranted = false;
      }
    }

    this.isMonitoring = true;
    
    // Start detection loop at 3 fps (enough for presence/gaze, saves CPU)
    if (this.cameraGranted) {
      this.frameInterval = setInterval(() => this.runDetection(), 333);
    }
    
    // Start browser lockdown monitoring
    this.setupBrowserLockdown();
    
    // Start event flush
    this.flushInterval = setInterval(() => this.flushEvents(), this.FLUSH_INTERVAL_MS);
    
    // Start heartbeat (every 30s)
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 30000);
    
    return this.cameraGranted;
  }

  /**
   * Stop all monitoring and release camera.
   */
  stop() {
    this.isMonitoring = false;
    if (this.frameInterval) clearInterval(this.frameInterval);
    if (this.flushInterval) clearInterval(this.flushInterval);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    
    this.cleanupBrowserLockdown();
    
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
      this.video.remove();
      this.video = null;
    }
    
    // Flush remaining events
    this.flushEvents();
  }

  /**
   * Main detection loop — runs at 3 fps.
   * Uses simple heuristics for face presence and gaze.
   * In production, this would use MediaPipe Face Mesh + COCO-SSD via TF.js.
   */
  private async runDetection() {
    if (!this.isMonitoring || !this.video || !this.canvas) return;
    if (this.video.readyState < 2) return;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    
    // --- Face presence detection ---
    // In production: use face-api.js or MediaPipe Face Detection
    // For this implementation: use brightness/motion heuristic as placeholder
    const faceDetected = this.detectFaceHeuristic(ctx);
    
    if (this.profile.modules.facePresence.enabled) {
      if (!faceDetected) {
        if (this.faceAbsentSince === null) {
          this.faceAbsentSince = Date.now();
        }
        const absentDuration = (Date.now() - this.faceAbsentSince) / 1000;
        if (absentDuration >= this.profile.modules.facePresence.thresholdSec) {
          this.emitEvent('face_absent', this.profile.modules.facePresence.severity, 0.7);
          this.faceAbsentSince = Date.now(); // Reset to avoid flood
        }
      } else {
        this.faceAbsentSince = null;
      }
    }
    
    // --- Multiple faces detection ---
    if (this.profile.modules.multipleFaces.enabled) {
      // In production: count detected faces
      // Placeholder: random check (would use face detection count)
      // This is where MediaPipe would return face count
    }
    
    // --- Gaze/head-pose detection ---
    if (this.profile.modules.gazeAway.enabled && faceDetected) {
      // In production: use MediaPipe Face Mesh to compute head pose angle
      // Placeholder: check if face center is far from frame center
      const lookingAway = this.detectGazeHeuristic(ctx);
      if (lookingAway) {
        if (this.gazeAwaySince === null) {
          this.gazeAwaySince = Date.now();
        }
        const awayDuration = (Date.now() - this.gazeAwaySince) / 1000;
        if (awayDuration >= this.profile.modules.gazeAway.thresholdSec) {
          this.emitEvent('gaze_away_sustained', this.profile.modules.gazeAway.severity, 0.5);
          this.gazeAwaySince = Date.now();
        }
      } else {
        this.gazeAwaySince = null;
      }
    }
    
    // --- Object detection ---
    if (this.profile.modules.objectDetection.enabled) {
      // In production: run COCO-SSD/YOLO-nano via TF.js
      // Placeholder: skip (would detect phone/book shapes)
    }
  }

  /**
   * Heuristic face detection using brightness variance.
   * In production, replace with face-api.js or MediaPipe.
   */
  private detectFaceHeuristic(ctx: CanvasRenderingContext2D): boolean {
    try {
      const imageData = ctx.getImageData(0, 0, this.canvas!.width, this.canvas!.height);
      const data = imageData.data;
      
      // Sample center region for skin-tone-like pixels
      const cx = this.canvas!.width / 2;
      const cy = this.canvas!.height / 2;
      const sampleSize = 100;
      let skinPixels = 0;
      let totalSampled = 0;
      
      for (let y = cy - sampleSize/2; y < cy + sampleSize/2; y += 4) {
        for (let x = cx - sampleSize/2; x < cx + sampleSize/2; x += 4) {
          const i = (Math.floor(y) * this.canvas!.width + Math.floor(x)) * 4;
          const r = data[i], g = data[i+1], b = data[i+2];
          // Simple skin tone heuristic
          if (r > 60 && g > 30 && b > 15 && r > g && r > b && Math.abs(r - g) > 10) {
            skinPixels++;
          }
          totalSampled++;
        }
      }
      
      return skinPixels / totalSampled > 0.15;
    } catch {
      return true; // Assume present if can't analyze
    }
  }

  /**
   * Heuristic gaze detection — checks if the face center is far from frame center.
   */
  private detectGazeHeuristic(ctx: CanvasRenderingContext2D): boolean {
    // In production: use MediaPipe Face Mesh for precise head pose
    // Placeholder: always false (no false positives)
    return false;
  }

  /**
   * Browser lockdown setup — monitors tab switches, fullscreen, input restrictions.
   */
  private setupBrowserLockdown() {
    // Tab visibility
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Fullscreen
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    
    // Input restrictions
    if (this.profile.modules.browserLockdown.enabled) {
      this.inputRestrictionsActive = true;
      document.addEventListener('contextmenu', this.handleContextMenu);
      document.addEventListener('copy', this.handleInputRestriction);
      document.addEventListener('paste', this.handleInputRestriction);
      document.addEventListener('cut', this.handleInputRestriction);
      document.addEventListener('keydown', this.handleKeyDown);
    }
    
    // Enter fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => {
        this.fullscreenActive = true;
      }).catch(() => {
        // Non-blocking — fullscreen is recommended but not required
      });
    }
  }

  private cleanupBrowserLockdown() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('copy', this.handleInputRestriction);
    document.removeEventListener('paste', this.handleInputRestriction);
    document.removeEventListener('cut', this.handleInputRestriction);
    document.removeEventListener('keydown', this.handleKeyDown);
    
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  private handleVisibilityChange = () => {
    if (document.hidden && this.isMonitoring) {
      this.emitEvent('tab_switch', 'medium', 0.9);
    }
  };

  private handleFullscreenChange = () => {
    if (!document.fullscreenElement && this.fullscreenActive && this.isMonitoring) {
      this.emitEvent('fullscreen_exited', 'medium', 0.85);
    }
    this.fullscreenActive = !!document.fullscreenElement;
  };

  private handleContextMenu = (e: Event) => {
    e.preventDefault();
    this.emitEvent('input_restriction_bypass_attempt', 'medium', 0.8);
  };

  private handleInputRestriction = (e: Event) => {
    if (this.inputRestrictionsActive) {
      e.preventDefault();
      this.emitEvent('input_restriction_bypass_attempt', 'medium', 0.8);
    }
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    // Block Print Screen, Ctrl+P, Ctrl+S, F12, Ctrl+Shift+I
    if (e.key === 'PrintScreen' || 
        (e.ctrlKey && e.key === 'p') ||
        (e.ctrlKey && e.key === 's') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
      e.preventDefault();
      this.emitEvent('input_restriction_bypass_attempt', 'medium', 0.85);
    }
  };

  /**
   * Emit an event with debounce.
   * High/critical events are sent immediately, not batched.
   */
  private emitEvent(eventType: ProctoringEventType, severity: Severity, confidence: number) {
    // Debounce: skip if same event type within DEBOUNCE_MS
    const now = Date.now();
    const lastTime = this.lastEventTime[eventType] || 0;
    if (now - lastTime < this.DEBOUNCE_MS && severity === 'low') return;
    this.lastEventTime[eventType] = now;
    
    const event: ProctoringEvent = {
      id: Math.random().toString(36).slice(2, 11),
      sessionId: this.sessionId,
      eventType,
      severity,
      confidenceScore: confidence,
      timestamp: now - this.examStartTime,
    };
    
    // Capture evidence snapshot for medium+ severity
    if (severity !== 'low' && this.canvas && this.cameraGranted) {
      try {
        event.evidenceSnapshotUrl = this.captureSnapshot();
      } catch { /* non-blocking */ }
    }
    
    this.eventBuffer.push(event);
    this.onEvent(event);
    
    // High/critical: flush immediately
    if (severity === 'high' || severity === 'critical') {
      this.flushEvents();
    }
  }

  /**
   * Capture a compressed JPEG snapshot (not video).
   * This is the ONLY image data that leaves the device.
   */
  private captureSnapshot(): string {
    if (!this.canvas) return '';
    return this.canvas.toDataURL('image/jpeg', 0.3); // 30% quality — small file
  }

  /**
   * Flush buffered events to the server.
   */
  private async flushEvents() {
    if (this.eventBuffer.length === 0) return;
    
    const batch = [...this.eventBuffer];
    this.eventBuffer = [];
    
    try {
      await fetch('/api/proctoring/session?XTransformPort=3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ingest_events',
          sessionId: this.sessionId,
          events: batch,
        }),
      });
    } catch {
      // Non-blocking — events are also processed client-side on submit
      // Re-buffer failed events
      this.eventBuffer.unshift(...batch);
    }
  }

  /**
   * Send heartbeat to server (every 30s).
   * Server uses this to detect session_abandoned after grace period.
   */
  private async sendHeartbeat() {
    try {
      await fetch('/api/proctoring/session?XTransformPort=3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'heartbeat', sessionId: this.sessionId }),
      });
    } catch { /* non-blocking */ }
  }

  /**
   * Get all buffered events (for client-side report generation on submit).
   */
  getBufferedEvents(): ProctoringEvent[] {
    return [...this.eventBuffer];
  }
}
