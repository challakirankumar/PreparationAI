// src/lib/analytics.ts
/**
 * PreparationAI Global Product Analytics & Conversion Funnel Engine
 * Supports local telemetry + seamless integration with Google Analytics (GA4) / PostHog.
 */

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];

  /**
   * Track critical user actions (Signups, Exam selections, Mock completions, Dropoffs)
   */
  track(event: string, properties: Record<string, any> = {}) {
    const payload: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        url: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      },
      timestamp: Date.now(),
    };

    this.events.push(payload);

    // Forward to window.gtag if Google Analytics is installed
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, properties);
    }

    // Forward to window.posthog if PostHog is installed
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(event, properties);
    }

    // Console logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 [Analytics] ${event}`, properties);
    }
  }

  // Pre-configured conversion events
  trackSignup(userId: string, examGoal: string, userType: string) {
    this.track('student_signup', { userId, examGoal, userType });
  }

  trackExamStarted(examId: string, examName: string) {
    this.track('mock_exam_started', { examId, examName });
  }

  trackExamSubmitted(examId: string, score: number, percentile: number, durationSec: number) {
    this.track('mock_exam_submitted', { examId, score, percentile, durationSec });
  }

  trackDoubtAsked(examGoal: string, hasImage: boolean) {
    this.track('doubt_solver_invoked', { examGoal, hasImage });
  }

  trackSocraticInteraction(examGoal: string, strategy: string) {
    this.track('socratic_session_turn', { examGoal, strategy });
  }

  getRecentEvents(): AnalyticsEvent[] {
    return this.events.slice(-50);
  }
}

export const analytics = new AnalyticsService();

export function trackEvent(event: string, properties?: Record<string, any>) {
  analytics.track(event, properties);
}

export default analytics;
