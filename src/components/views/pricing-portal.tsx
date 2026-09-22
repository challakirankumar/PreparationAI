'use client';

import * as React from 'react';
import {
  Check,
  Zap,
  Sparkles,
  Shield,
  Crown,
  Building,
  ArrowRight,
  CheckCircle2,
  Clock,
  HelpCircle,
  Brain,
  FileText,
  Lock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSubscriptionStore, PLANS, type SubscriptionPlan } from '@/lib/subscription/store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function PricingPortalView() {
  const { toast } = useToast();
  const {
    currentPlan,
    billingCycle,
    setPlan,
    setBillingCycle,
    isCheckoutOpen,
    selectedPlanForUpgrade,
    openCheckout,
    closeCheckout,
    doubtsUsedToday,
  } = useSubscriptionStore();

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'plans' | 'comparison'>('plans');

  const handleSelectPlan = (planId: SubscriptionPlan) => {
    if (planId === currentPlan) {
      toast({
        title: 'Already Active',
        description: `You are currently on the ${PLANS[planId].name} plan.`,
      });
      return;
    }
    openCheckout(planId);
  };

  const handleConfirmUpgrade = () => {
    if (!selectedPlanForUpgrade) return;
    setIsProcessing(true);

    setTimeout(() => {
      setPlan(selectedPlanForUpgrade);
      setIsProcessing(false);
      closeCheckout();
      toast({
        title: '🎉 Plan Upgraded Successfully!',
        description: `Welcome to ${PLANS[selectedPlanForUpgrade].name}. Unlimited AI features are now active.`,
      });
    }, 1200);
  };

  const targetPlan = selectedPlanForUpgrade ? PLANS[selectedPlanForUpgrade] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="max-w-5xl mx-auto text-center space-y-4 mb-10">
        <Badge variant="outline" className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs font-semibold">
          <Sparkles className="h-3 w-3 mr-1 text-blue-600 animate-spin" /> PreparationAI Pro Tier
        </Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Supercharge Your Exam Preparation with <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">Elite AI Power</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Choose the plan that fits your ambition. From unlimited Socratic tutoring to AI handwritten grading and 10-year PYQ radar forecasts.
        </p>

        {/* Billing Cycle Switcher */}
        <div className="inline-flex items-center bg-slate-200/70 dark:bg-slate-800 p-1.5 rounded-full ring-1 ring-slate-300 dark:ring-slate-700 mt-2">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              'px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all',
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            )}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={cn(
              'px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5',
              billingCycle === 'yearly'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            )}
          >
            Annual Billing
            <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold">
              Save 25%
            </span>
          </button>
        </div>
      </div>

      {/* Usage Meter for Current User */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Subscription</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {PLANS[currentPlan].name}
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-emerald-300">
                  Active
                </Badge>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-right">Daily AI Inquiries</p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-right">
                {currentPlan === 'free' ? `${doubtsUsedToday} / 10 used` : 'Unlimited ⚡'}
              </p>
            </div>
            {currentPlan === 'free' && (
              <Button size="sm" onClick={() => openCheckout('pro')} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm font-semibold">
                Upgrade to Pro
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {(Object.keys(PLANS) as SubscriptionPlan[]).map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = currentPlan === planId;
          const isPro = planId === 'pro';
          const isElite = planId === 'elite';

          const price = billingCycle === 'yearly'
            ? plan.priceYearlyINR === 0 ? '₹0' : `₹${Math.round(plan.priceYearlyINR / 12)}`
            : `₹${plan.priceMonthlyINR}`;

          return (
            <div
              key={planId}
              className={cn(
                'relative rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden',
                isPro
                  ? 'border-blue-500 dark:border-blue-500 bg-gradient-to-b from-white via-blue-50/20 to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 shadow-xl ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg',
                isCurrent && 'ring-2 ring-emerald-500 border-emerald-500'
              )}
            >
              {plan.badge && (
                <div className="absolute top-0 right-0">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                    {plan.badge}
                  </div>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  {isPro && <Zap className="h-5 w-5 text-blue-600" />}
                  {isElite && <Crown className="h-5 w-5 text-amber-500" />}
                  {planId === 'institution' && <Building className="h-5 w-5 text-purple-600" />}
                  {planId === 'free' && <Brain className="h-5 w-5 text-slate-500" />}
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">{plan.name}</h3>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px] mb-4">
                  {plan.tagline}
                </p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{price}</span>
                    <span className="text-xs text-slate-500">/ month</span>
                  </div>
                  {billingCycle === 'yearly' && plan.priceYearlyINR > 0 && (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                      Billed ₹{plan.priceYearlyINR}/year
                    </p>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Key Capabilities</p>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 pt-0">
                <Button
                  onClick={() => handleSelectPlan(planId)}
                  disabled={isCurrent}
                  className={cn(
                    'w-full font-semibold rounded-xl transition-all',
                    isCurrent
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-default'
                      : isPro
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md hover:shadow-blue-500/25'
                      : isElite
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  )}
                >
                  {isCurrent ? 'Current Plan' : `Get ${plan.name}`}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulated Checkout Modal */}
      <Dialog open={isCheckoutOpen} onOpenChange={closeCheckout}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Confirm Upgrade to {targetPlan?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Instant 256-bit encrypted secure checkout with money-back guarantee.
            </DialogDescription>
          </DialogHeader>

          {targetPlan && (
            <div className="space-y-4 my-2">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-850 p-4 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="font-semibold text-slate-900 dark:text-white">{targetPlan.name} ({billingCycle})</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{billingCycle === 'yearly' ? targetPlan.priceYearlyINR : targetPlan.priceMonthlyINR}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{targetPlan.tagline}</p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Instant unlock of all AI models and features
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Cancel anytime with 1 click
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Supported: UPI, GPay, PhonePe, Credit/Debit Cards
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <Button variant="outline" onClick={closeCheckout} className="w-1/2">
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmUpgrade}
                  disabled={isProcessing}
                  className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {isProcessing ? 'Activating...' : 'Pay & Activate'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
