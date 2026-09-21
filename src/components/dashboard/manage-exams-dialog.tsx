'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Plus, Star, X, Clock, ListChecks, Award, Search, Filter, Landmark, Sparkles } from 'lucide-react';
import { useStore, userExamGoals } from '@/lib/store';
import { EXAM_PATTERNS, getPattern } from '@/lib/exams/patterns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function ManageExamsDialog({ open, onOpenChange }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const user = useStore((s) => s.user);
  const addExamGoal = useStore((s) => s.addExamGoal);
  const removeExamGoal = useStore((s) => s.removeExamGoal);
  const updateUser = useStore((s) => s.updateUser);
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');

  if (!user) return null;

  const goals = userExamGoals(user);
  const allPatterns = EXAM_PATTERNS;

  // Distinct domain categories
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    allPatterns.forEach((p) => {
      if (p.domainCategory) set.add(p.domainCategory);
    });
    return ['All', ...Array.from(set)];
  }, [allPatterns]);

  // Filter addable exams
  const addable = React.useMemo(() => {
    return allPatterns
      .filter((p) => !goals.includes(p.id))
      .filter((p) => {
        if (selectedCategory !== 'All' && p.domainCategory !== selectedCategory) {
          return false;
        }
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.fullName.toLowerCase().includes(q) ||
          (p.state && p.state.toLowerCase().includes(q)) ||
          (p.conductingBody && p.conductingBody.toLowerCase().includes(q)) ||
          (p.domainCategory && p.domainCategory.toLowerCase().includes(q)) ||
          (p.postOrCourse && p.postOrCourse.toLowerCase().includes(q))
        );
      });
  }, [allPatterns, goals, selectedCategory, searchQuery]);

  function handleRemove(id: string) {
    if (goals.length <= 1) {
      toast({
        title: 'Cannot remove last exam',
        description: 'You must keep at least one target exam for your curriculum.',
        variant: 'destructive',
      });
      return;
    }
    removeExamGoal(id);
    const p = getPattern(id);
    toast({ title: `Removed ${p?.name ?? id} from targets` });
  }

  function handleAdd(id: string) {
    addExamGoal(id);
    const p = getPattern(id);
    toast({ title: `Added ${p?.name ?? id} to targets` });
  }

  function handleMakePrimary(id: string) {
    updateUser({ examGoal: id });
    const p = getPattern(id);
    toast({ title: `${p?.name ?? id} is now your primary exam` });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-stone-900">
            <Landmark className="h-5 w-5 text-blue-700" />
            Master Target Exam Directory
          </DialogTitle>
          <DialogDescription className="text-xs">
            Select exams across UPSC, SSC, Banking, Railways, State PSCs (all 28 states), Engineering, Teaching, Law, Management &amp; IT.
          </DialogDescription>
        </DialogHeader>

        {/* Selected target exams */}
        <div className="bg-stone-50/80 p-3.5 rounded-xl border border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              Active Target Exams ({goals.length})
            </h4>
            <span className="text-[11px] text-muted-foreground">
              Primary: <strong className="text-blue-700">{getPattern(user.examGoal)?.name ?? 'Not set'}</strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
            {goals.map((id) => {
              const p = getPattern(id);
              if (!p) return null;
              const isPrimary = user.examGoal === id;
              return (
                <div
                  key={id}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition shadow-sm',
                    isPrimary
                      ? 'bg-amber-50 border-amber-300 text-amber-950 ring-1 ring-amber-200'
                      : 'bg-white border-stone-200 text-stone-800'
                  )}
                >
                  <span className="font-bold">{p.name}</span>
                  {p.state && p.state !== 'All-India' && (
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-normal">
                      {p.state}
                    </span>
                  )}
                  {isPrimary ? (
                    <Badge className="bg-amber-500 text-white text-[9px] px-1 py-0 h-4 leading-none">
                      Primary
                    </Badge>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMakePrimary(id)}
                      className="text-[10px] text-blue-700 hover:underline font-semibold"
                    >
                      Make Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(id)}
                    disabled={goals.length <= 1}
                    className="text-stone-400 hover:text-rose-600 p-0.5"
                    aria-label="Remove exam"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="space-y-2 mt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by exam name, state, conducting body (e.g. KPSC, Karnataka, UPSC, SBI, BPSC, TCS, CAT)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-stone-50 border-stone-200"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition',
                  selectedCategory === cat
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Directory List */}
        <div className="flex-1 min-h-0 flex flex-col mt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-stone-700">
              Available to Add ({addable.length})
            </span>
          </div>

          {addable.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-200 p-8 text-center text-xs text-muted-foreground bg-stone-50/50">
              <Award className="h-8 w-8 mx-auto mb-2 text-stone-400" />
              No matching exams found. Try adjusting your search or category filter.
            </div>
          ) : (
            <ScrollArea className="flex-1 max-h-[38vh] pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {addable.map((p) => (
                  <Card
                    key={p.id}
                    className="p-3 border-stone-200 hover:border-blue-300 hover:bg-blue-50/20 transition flex flex-col justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-stone-900 truncate">{p.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{p.fullName}</p>
                        </div>
                        {p.domainCategory && (
                          <span className="text-[10px] font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full flex-shrink-0">
                            {p.conductingBody || p.domainCategory}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.state && (
                          <span className="text-[10px] bg-blue-50 text-blue-800 font-medium px-1.5 py-0.5 rounded">
                            📍 {p.state}
                          </span>
                        )}
                        <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                          {p.totalQuestions} Qs · {Math.round(p.durationSec / 60)}m
                        </span>
                        <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                          {p.marking}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                        {p.postOrCourse || p.qualification || 'All streams'}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleAdd(p.id)}
                        className="h-7 text-[11px] bg-blue-700 hover:bg-blue-800 px-2.5"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add to Targets
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-stone-200 flex items-center justify-between text-xs text-muted-foreground">
          <span>All selected exams immediately unlock in the <strong>AI Mock Exam Engine</strong>, <strong>Analytics</strong>, and <strong>Planner</strong>.</span>
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
