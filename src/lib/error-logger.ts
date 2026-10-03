// src/lib/error-logger.ts
/**
 * PreparationAI Crash Resilience & Error Monitoring Layer
 * Captures uncaught client exceptions, API failures, and logs telemetry.
 */

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  userId?: string;
  timestamp: string;
  severity: 'fatal' | 'error' | 'warning';
}

const inMemoryErrors: ErrorReport[] = [];

export function captureException(
  error: Error | string,
  context?: { componentStack?: string; userId?: string; severity?: 'fatal' | 'error' | 'warning' }
): ErrorReport {
  const errObj = typeof error === 'string' ? new Error(error) : error;
  const report: ErrorReport = {
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    message: errObj.message || 'Unknown error occurred',
    stack: errObj.stack,
    componentStack: context?.componentStack,
    url: typeof window !== 'undefined' ? window.location.href : '',
    userId: context?.userId,
    timestamp: new Date().toISOString(),
    severity: context?.severity || 'error',
  };

  inMemoryErrors.push(report);

  // If Sentry is installed on window, forward to Sentry
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(errObj);
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 [Crash Logger Caught Error]:', report);
  }

  return report;
}

export function getLoggedErrors(): ErrorReport[] {
  return inMemoryErrors.slice(-30);
}
