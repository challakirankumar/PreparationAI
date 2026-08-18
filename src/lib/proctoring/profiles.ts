// ============================================================================
// Proctoring Profiles — Config-driven severity mapping per exam type
// Based on NTA's published Unfair Means (UFM) taxonomy
// ============================================================================

import type { ProctoringProfile, ProctoringEventType, UFACategory } from '@/lib/types';

export const DEFAULT_PROCTORING_PROFILE: ProctoringProfile = {
  examType: 'default',
  version: 1,
  modules: {
    facePresence: { enabled: true, thresholdSec: 5, severity: 'medium' },
    multipleFaces: { enabled: true, severity: 'high' },
    gazeAway: { enabled: true, thresholdSec: 10, severity: 'low' },
    objectDetection: { enabled: true, severity: 'medium' },
    audioAnomaly: { enabled: false, severity: 'medium' },
    browserLockdown: { enabled: true, severity: 'medium' },
    identityVerification: { enabled: true, severity: 'critical' },
  },
  scoring: {
    lowDeduction: 2,
    mediumDeduction: 8,
    highDeduction: 25,
    criticalDeduction: 50,
    lowCategoryCap: 15,
  },
};

export const PROCTORING_PROFILES: Record<string, ProctoringProfile> = {
  'jee-main': { ...DEFAULT_PROCTORING_PROFILE, examType: 'jee-main' },
  'neet': { ...DEFAULT_PROCTORING_PROFILE, examType: 'neet' },
  'jee-advanced': {
    ...DEFAULT_PROCTORING_PROFILE,
    examType: 'jee-advanced',
    modules: {
      ...DEFAULT_PROCTORING_PROFILE.modules,
      gazeAway: { enabled: true, thresholdSec: 8, severity: 'low' },
      objectDetection: { enabled: true, severity: 'high' },
    },
  },
};

export function getProfile(examType: string): ProctoringProfile {
  return PROCTORING_PROFILES[examType] || DEFAULT_PROCTORING_PROFILE;
}

export const EVENT_TO_CATEGORY: Record<ProctoringEventType, UFACategory> = {
  face_absent: 'Candidate Conduct — Attention',
  gaze_away_sustained: 'Candidate Conduct — Attention',
  multiple_faces_detected: 'Communication / Assistance',
  audio_anomaly: 'Communication / Assistance',
  identity_mismatch_at_start: 'Identity Verification',
  identity_mismatch_midexam: 'Identity Verification',
  prohibited_object_suspected: 'Prohibited Items',
  tab_switch: 'Exam Environment Integrity',
  fullscreen_exited: 'Exam Environment Integrity',
  input_restriction_bypass_attempt: 'Exam Environment Integrity',
  devtools_suspected: 'Exam Environment Integrity',
  multi_monitor_detected: 'Exam Environment Integrity',
  session_abandoned: 'Session Continuity',
  connection_gap: 'Session Continuity',
};

export const VERDICT_THRESHOLDS = {
  clean: { min: 90, label: 'Clean', color: '#10b981' },
  minor_flags: { min: 70, label: 'Minor Flags', color: '#f59e0b' },
  flagged_for_review: { min: 40, label: 'Flagged for Review', color: '#f97316' },
  simulated_invalid: { min: 0, label: 'Simulated Invalid', color: '#ef4444' },
} as const;

export function getVerdictTier(score: number): { tier: string; label: string; color: string } {
  if (score >= 90) return { tier: 'clean', ...VERDICT_THRESHOLDS.clean };
  if (score >= 70) return { tier: 'minor_flags', ...VERDICT_THRESHOLDS.minor_flags };
  if (score >= 40) return { tier: 'flagged_for_review', ...VERDICT_THRESHOLDS.flagged_for_review };
  return { tier: 'simulated_invalid', ...VERDICT_THRESHOLDS.simulated_invalid };
}

export const VERDICT_COACHING: Record<string, string> = {
  clean: 'No significant integrity concerns detected. You maintained good exam discipline throughout this session. Keep up the focused approach in your real exam.',
  minor_flags: 'Some attention or environment flags were detected. In a real exam hall, these alone would not cause issues, but frequent gaze-breaks or minor distractions can cost you time. Try practicing sustained focus in your next mock.',
  flagged_for_review: 'Multiple integrity concerns were detected during this session. We recommend reviewing the timeline below with your teacher or mentor to identify patterns and build better exam-day habits before your real exam.',
  simulated_invalid: 'Patterns consistent with what NTA categorizes as Unfair Means were detected in this session. This is a training simulation only — no real academic consequence. Please review the detailed timeline and discuss with your mentor before your next attempt.',
};

export const EVENT_DESCRIPTIONS: Record<ProctoringEventType, string> = {
  face_absent: 'No face detected in camera frame for an extended period.',
  multiple_faces_detected: 'More than one face detected in the camera frame.',
  gaze_away_sustained: 'Sustained head turn away from screen beyond threshold.',
  prohibited_object_suspected: 'A phone-shaped or book/paper-shaped object was detected in frame.',
  audio_anomaly: 'Sustained speech or a second distinct voice pattern was detected.',
  tab_switch: 'Browser tab visibility changed (tab switched or minimized).',
  fullscreen_exited: 'Fullscreen mode was exited during the exam.',
  input_restriction_bypass_attempt: 'An attempt to use copy, paste, right-click, or print-screen was detected.',
  devtools_suspected: 'Browser developer tools may have been opened.',
  multi_monitor_detected: 'Multiple monitors were detected.',
  identity_mismatch_at_start: 'Face at exam start did not match the reference selfie.',
  identity_mismatch_midexam: 'Face during exam did not match the reference selfie.',
  session_abandoned: 'Exam tab was closed without submitting.',
  connection_gap: 'Network connection was lost temporarily during the exam.',
};
