import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SubscriptionPlan = 'free' | 'pro' | 'elite' | 'institution';

export interface PlanFeature {
  name: string;
  included: boolean;
  highlight?: boolean;
}

export interface PlanDetails {
  id: SubscriptionPlan;
  name: string;
  tagline: string;
  priceMonthlyINR: number;
  priceMonthlyUSD: number;
  priceYearlyINR: number;
  badge?: string;
  popular?: boolean;
  limits: {
    dailyAIDoubts: number | 'unlimited';
    mockExamsPerMonth: number | 'unlimited';
    voiceMentorMinutes: number | 'unlimited';
    handwrittenGradingPerMonth: number | 'unlimited';
    pyqRadarUnlocked: boolean;
    proctoringReportUnlocked: boolean;
    parentSyncUnlocked: boolean;
  };
  features: string[];
}

export const PLANS: Record<SubscriptionPlan, PlanDetails> = {
  free: {
    id: 'free',
    name: 'Free Explorer',
    tagline: 'Foundational AI exam preparation tools',
    priceMonthlyINR: 0,
    priceMonthlyUSD: 0,
    priceYearlyINR: 0,
    limits: {
      dailyAIDoubts: 10,
      mockExamsPerMonth: 3,
      voiceMentorMinutes: 5,
      handwrittenGradingPerMonth: 2,
      pyqRadarUnlocked: false,
      proctoringReportUnlocked: false,
      parentSyncUnlocked: false,
    },
    features: [
      '10 Daily AI Mentor & Socratic inquiries',
      '3 Full Adaptive Mock Exams per month',
      'Basic Performance Analytics',
      'Public Quiz Battle Arena',
      'Standard NCERT Syllabus Library',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Prep Pro',
    tagline: 'For serious aspirants aiming for top percentiles',
    priceMonthlyINR: 499,
    priceMonthlyUSD: 9,
    priceYearlyINR: 4499,
    popular: true,
    badge: 'MOST POPULAR',
    limits: {
      dailyAIDoubts: 'unlimited',
      mockExamsPerMonth: 'unlimited',
      voiceMentorMinutes: 60,
      handwrittenGradingPerMonth: 25,
      pyqRadarUnlocked: true,
      proctoringReportUnlocked: true,
      parentSyncUnlocked: true,
    },
    features: [
      'Unlimited AI Mentor & Visual Doubt OCR',
      'Unlimited 3PL IRT Adaptive Mock Exams',
      '10-Year PYQ Trend Radar & Weightage Forecaster',
      'AI Handwritten Answer Sheet Grading (25/mo)',
      'NTA UFM Anti-Cheat Proctoring Reports',
      'Error Journal & Spaced Repetition Tracker',
      'College Cutoff & Rank Probability Predictor',
    ],
  },
  elite: {
    id: 'elite',
    name: 'Elite 1-on-1',
    tagline: 'Private AI Masterclass & Personalized Mentorship',
    priceMonthlyINR: 1499,
    priceMonthlyUSD: 25,
    priceYearlyINR: 12999,
    badge: 'ULTIMATE',
    limits: {
      dailyAIDoubts: 'unlimited',
      mockExamsPerMonth: 'unlimited',
      voiceMentorMinutes: 'unlimited',
      handwrittenGradingPerMonth: 'unlimited',
      pyqRadarUnlocked: true,
      proctoringReportUnlocked: true,
      parentSyncUnlocked: true,
    },
    features: [
      'Everything in Prep Pro + VIP Low-Latency GPU Queue',
      'Unlimited Real-time Voice Mentor Coaching',
      'Unlimited Handwritten Answer Sheet Rubric Grading',
      'Dedicated Weekly Parent WhatsApp/SMS Progress Digest',
      'Custom Institution & Coach Test Generator',
      '1-on-1 Personalized College Admission Strategy',
    ],
  },
  institution: {
    id: 'institution',
    name: 'Institutional Campus',
    tagline: 'For Schools, Coaching Academies & Universities',
    priceMonthlyINR: 9999,
    priceMonthlyUSD: 149,
    priceYearlyINR: 89999,
    badge: 'ENTERPRISE',
    limits: {
      dailyAIDoubts: 'unlimited',
      mockExamsPerMonth: 'unlimited',
      voiceMentorMinutes: 'unlimited',
      handwrittenGradingPerMonth: 'unlimited',
      pyqRadarUnlocked: true,
      proctoringReportUnlocked: true,
      parentSyncUnlocked: true,
    },
    features: [
      'Full Multi-Batch & Cohort Performance Dashboard',
      'Teacher Portal with Custom Test Broadcast',
      'Centralized Anti-Cheat Surveillance Console',
      'White-label Institutional Branding & Subdomain',
      'Bulk Student Import & Enterprise SSO',
    ],
  },
};

interface SubscriptionState {
  currentPlan: SubscriptionPlan;
  billingCycle: 'monthly' | 'yearly';
  doubtsUsedToday: number;
  mockExamsUsedThisMonth: number;
  voiceMinutesUsedThisMonth: number;
  lastResetDate: string; // YYYY-MM-DD
  isCheckoutOpen: boolean;
  selectedPlanForUpgrade: SubscriptionPlan | null;

  // Actions
  setPlan: (plan: SubscriptionPlan) => void;
  setBillingCycle: (cycle: 'monthly' | 'yearly') => void;
  openCheckout: (plan?: SubscriptionPlan) => void;
  closeCheckout: () => void;
  useDoubtCredit: () => boolean;
  useMockCredit: () => boolean;
  canUseDoubt: () => boolean;
  canUseMock: () => boolean;
  getPlanDetails: () => PlanDetails;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      currentPlan: 'free',
      billingCycle: 'monthly',
      doubtsUsedToday: 2,
      mockExamsUsedThisMonth: 1,
      voiceMinutesUsedThisMonth: 1,
      lastResetDate: new Date().toISOString().split('T')[0],
      isCheckoutOpen: false,
      selectedPlanForUpgrade: null,

      setPlan: (plan) => set({ currentPlan: plan }),
      setBillingCycle: (billingCycle) => set({ billingCycle }),

      openCheckout: (plan) =>
        set({
          isCheckoutOpen: true,
          selectedPlanForUpgrade: plan || 'pro',
        }),

      closeCheckout: () =>
        set({
          isCheckoutOpen: false,
          selectedPlanForUpgrade: null,
        }),

      getPlanDetails: () => {
        const plan = get().currentPlan;
        return PLANS[plan] || PLANS.free;
      },

      canUseDoubt: () => {
        const state = get();
        const details = PLANS[state.currentPlan];
        if (details.limits.dailyAIDoubts === 'unlimited') return true;

        const today = new Date().toISOString().split('T')[0];
        const doubtsToday = state.lastResetDate === today ? state.doubtsUsedToday : 0;
        return doubtsToday < details.limits.dailyAIDoubts;
      },

      useDoubtCredit: () => {
        const state = get();
        const details = PLANS[state.currentPlan];
        const today = new Date().toISOString().split('T')[0];

        if (details.limits.dailyAIDoubts === 'unlimited') return true;

        const doubtsToday = state.lastResetDate === today ? state.doubtsUsedToday : 0;
        if (doubtsToday >= details.limits.dailyAIDoubts) {
          return false;
        }

        set({
          doubtsUsedToday: doubtsToday + 1,
          lastResetDate: today,
        });
        return true;
      },

      canUseMock: () => {
        const state = get();
        const details = PLANS[state.currentPlan];
        if (details.limits.mockExamsPerMonth === 'unlimited') return true;
        return state.mockExamsUsedThisMonth < details.limits.mockExamsPerMonth;
      },

      useMockCredit: () => {
        const state = get();
        const details = PLANS[state.currentPlan];
        if (details.limits.mockExamsPerMonth === 'unlimited') return true;

        if (state.mockExamsUsedThisMonth >= details.limits.mockExamsPerMonth) {
          return false;
        }

        set({ mockExamsUsedThisMonth: state.mockExamsUsedThisMonth + 1 });
        return true;
      },
    }),
    {
      name: 'prepai_subscription_store',
    }
  )
);
