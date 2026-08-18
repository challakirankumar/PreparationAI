// ============================================================================
// Violation Rule Engine — consumes proctoring events and produces scored verdict
// ============================================================================

import type {
  ProctoringEvent, ProctoringProfile, SessionVerdict, CategoryBreakdown,
  Severity, UFACategory, ProctoringEventType,
} from '@/lib/types';
import { EVENT_TO_CATEGORY, getVerdictTier, VERDICT_COACHING } from './profiles';

/**
 * Run the rule engine against a session's events and produce a verdict.
 * 
 * Scoring algorithm:
 * - Start at 100
 * - Deduct per event based on severity weight (from profile config)
 * - Diminishing returns on repeated low-severity events (cap per category)
 * - Critical events (identity mismatch) drop score sharply
 * - Apply debounce/correlation pass before finalizing
 */
export function runRuleEngine(
  events: ProctoringEvent[],
  profile: ProctoringProfile,
): SessionVerdict {
  // Step 1: Debounce/correlation pass
  const filteredEvents = applyDebounce(events);

  // Step 2: Group by NTA UFM category
  const categoryMap = new Map<UFACategory, ProctoringEvent[]>();
  for (const event of filteredEvents) {
    const category = EVENT_TO_CATEGORY[event.eventType] || 'Exam Environment Integrity';
    if (!categoryMap.has(category)) categoryMap.set(category, []);
    categoryMap.get(category)!.push(event);
  }

  // Step 3: Score each category
  const categoryBreakdown: CategoryBreakdown[] = [];
  let totalDeduction = 0;

  for (const [category, catEvents] of categoryMap) {
    let categoryDeduction = 0;
    let maxSeverity: Severity = 'low';

    for (const event of catEvents) {
      const deduction = getDeduction(event.severity, profile);
      
      // Cap low-severity deductions per category
      if (event.severity === 'low') {
        const currentLowDeduction = catEvents
          .filter(e => e.severity === 'low')
          .reduce((sum, e) => sum + getDeduction('low', profile), 0);
        if (currentLowDeduction > profile.scoring.lowCategoryCap) {
          continue; // Skip — already hit cap
        }
      }

      categoryDeduction += deduction;
      
      // Track max severity
      if (severityRank(event.severity) > severityRank(maxSeverity)) {
        maxSeverity = event.severity;
      }
    }

    // Session continuity events are informational, don't deduct
    if (category === 'Session Continuity') {
      categoryDeduction = 0;
    }

    totalDeduction += categoryDeduction;
    
    categoryBreakdown.push({
      category,
      eventCount: catEvents.length,
      maxSeverity,
      totalDeduction: categoryDeduction,
      events: catEvents,
    });
  }

  // Step 4: Compute integrity score
  const integrityScore = Math.max(0, Math.min(100, 100 - totalDeduction));

  // Step 5: Determine verdict tier
  const verdict = getVerdictTier(integrityScore);

  return {
    sessionId: filteredEvents[0]?.sessionId || '',
    integrityScore,
    verdictTier: verdict.tier as SessionVerdict['verdictTier'],
    categoryBreakdown: categoryBreakdown.sort((a, b) => b.totalDeduction - a.totalDeduction),
    totalEvents: filteredEvents.length,
    computedAt: new Date().toISOString(),
  };
}

function getDeduction(severity: Severity, profile: ProctoringProfile): number {
  switch (severity) {
    case 'low': return profile.scoring.lowDeduction;
    case 'medium': return profile.scoring.mediumDeduction;
    case 'high': return profile.scoring.highDeduction;
    case 'critical': return profile.scoring.criticalDeduction;
  }
}

function severityRank(s: Severity): number {
  return { low: 1, medium: 2, high: 3, critical: 4 }[s];
}

/**
 * Debounce/correlation pass:
 * - If a gaze_away event occurs within 2 seconds of a tab_switch, 
 *   treat as one continuous distraction (keep the higher severity one)
 * - Deduplicate identical events within 3 seconds
 */
function applyDebounce(events: ProctoringEvent[]): ProctoringEvent[] {
  if (events.length <= 1) return events;
  
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const result: ProctoringEvent[] = [];
  const CORRELATION_WINDOW = 2000; // 2 seconds
  
  for (const event of sorted) {
    const lastEvent = result[result.length - 1];
    
    if (lastEvent) {
      const timeDiff = event.timestamp - lastEvent.timestamp;
      
      // Correlation: gaze_away + tab_switch within 2s = one event (keep tab_switch, higher severity)
      if (timeDiff < CORRELATION_WINDOW) {
        const isCorrelatedPair =
          (lastEvent.eventType === 'gaze_away_sustained' && event.eventType === 'tab_switch') ||
          (lastEvent.eventType === 'tab_switch' && event.eventType === 'gaze_away_sustained');
        
        if (isCorrelatedPair) {
          // Replace with the higher severity one
          if (severityRank(event.severity) > severityRank(lastEvent.severity)) {
            result[result.length - 1] = event;
          }
          continue;
        }
        
        // Dedup: same event type within 3 seconds
        if (lastEvent.eventType === event.eventType && timeDiff < 3000) {
          continue;
        }
      }
    }
    
    result.push(event);
  }
  
  return result;
}

export function getCoachingText(verdictTier: string): string {
  return VERDICT_COACHING[verdictTier] || VERDICT_COACHING.minor_flags;
}
