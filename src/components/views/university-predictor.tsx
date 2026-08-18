'use client';

import { useMemo, useState } from 'react';
import {
  Compass,
  Search,
  Sparkles,
  TrendingUp,
  Building2,
  Briefcase,
  Award,
  GraduationCap,
  Clock,
  IndianRupee,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared';
import {
  DISCOVER_ITEMS,
  DISCOVER_GRADES,
  discoverCounts,
  type DiscoverCategory,
  type DiscoverItem,
} from '@/lib/discover-data';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

type TabKey = 'All' | DiscoverCategory;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'All', label: 'All' },
  { key: 'Courses', label: 'Courses' },
  { key: 'Internships', label: 'Internships' },
  { key: 'Govt', label: 'Govt' },
  { key: 'Short', label: 'Short' },
];

const DEMAND_BADGE: Record<DiscoverItem['demand'], string> = {
  'Very High': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  High: 'bg-blue-50 text-blue-700 border-blue-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Emerging: 'bg-purple-50 text-purple-700 border-purple-200',
};

const ACCENT_BAR: Record<DiscoverItem['accentColor'], string> = {
  blue: 'bg-blue-500',
  gold: 'bg-amber-500',
};

const ACCENT_BADGE: Record<DiscoverItem['accentColor'], string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  gold: 'bg-amber-50 text-amber-700 border-amber-200',
};

const CATEGORY_ICON: Record<DiscoverCategory, React.ComponentType<{ className?: string }>> = {
  Courses: GraduationCap,
  Internships: Briefcase,
  Govt: ShieldCheck,
  Short: Award,
};

export function UniversityPredictor() {
  const user = useStore((s) => s.user);
  const setView = useStore((s) => s.setView);

  const [grade, setGrade] = useState<string>('all');
  const [tab, setTab] = useState<TabKey>('All');
  const [query, setQuery] = useState<string>('');
  const [selected, setSelected] = useState<DiscoverItem | null>(null);

  const counts = useMemo(() => discoverCounts(), []);

  const academicRecords = user?.academicRecords || [];
  const latestRecord = academicRecords[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DISCOVER_ITEMS.filter((item) => {
      if (tab !== 'All' && item.category !== tab) return false;
      if (grade !== 'all' && !item.grades.includes(grade)) return false;
      if (!q) return true;
      const haystack = [
        item.title,
        item.fieldBadge,
        item.description,
        item.demand,
        ...(item.skillsCovered || []),
        ...(item.institutions || []),
        ...(item.careerOutcomes || []),
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [tab, grade, query]);

  const tabCount = (key: TabKey): number =>
    key === 'All' ? DISCOVER_ITEMS.length : counts[key];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Compass}
        title="Discover"
        subtitle="Explore courses, internships, govt schemes & short certifications tailored to your grade"
        accent="emerald"
        right={
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <Sparkles className="h-3 w-3" /> {DISCOVER_ITEMS.length} opportunities
          </Badge>
        }
      />

      {/* Academic record banner */}
      <Card
        className={cn(
          'border',
          latestRecord
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-amber-200 bg-amber-50'
        )}
      >
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div
            className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0',
              latestRecord ? 'bg-emerald-600' : 'bg-amber-600'
            )}
          >
            {latestRecord ? (
              <CheckCircle2 className="h-5 w-5 text-white" />
            ) : (
              <AlertCircle className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {latestRecord ? (
              <>
                <p className="text-sm font-semibold text-stone-900">
                  Academic record detected — {latestRecord.examName} ·{' '}
                  {latestRecord.percentage.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {latestRecord.institution || 'Verified transcript'} · uploaded{' '}
                  {new Date(latestRecord.uploadedAt).toLocaleDateString()}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-stone-900">
                  No academic record uploaded yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Upload your marksheets to get personalised recommendations and prediction insights.
                </p>
              </>
            )}
          </div>
          {!latestRecord && (
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => setView('analytics')}
            >
              Upload record
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Grade selector */}
        <Select value={grade} onValueChange={setGrade}>
          <SelectTrigger className="w-full sm:w-48">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Select grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All grades</SelectItem>
            {DISCOVER_GRADES.map((g) => (
              <SelectItem key={g.value} value={g.value}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, field, skill, or institution…"
            className="pl-9"
          />
        </div>
      </div>

      {/* Category tabs with counts */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          const Icon = t.key === 'All' ? Compass : CATEGORY_ICON[t.key as DiscoverCategory];
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border transition',
                active
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : 'bg-white border-stone-200 text-stone-600 hover:border-emerald-300 hover:text-emerald-700'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              <Badge
                variant="outline"
                className={cn(
                  'ml-1 text-[10px] h-4 px-1.5 rounded-full',
                  active
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-stone-100 text-stone-600 border-stone-200'
                )}
              >
                {tabCount(t.key)}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-stone-900">{filtered.length}</span> of{' '}
        {DISCOVER_ITEMS.length} opportunities
      </p>

      {/* Card grid (1 / 2 / 3 columns) with left accent bars */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-stone-300">
          <CardContent className="p-10 text-center">
            <Search className="h-8 w-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-stone-900">No opportunities match your filters.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try clearing the search or selecting a different grade / category.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setQuery('');
                setGrade('all');
                setTab('All');
              }}
            >
              Reset filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const CatIcon = CATEGORY_ICON[item.category];
            return (
              <Card
                key={item.id}
                className="border-stone-200 hover:shadow-md transition cursor-pointer relative overflow-hidden"
                onClick={() => setSelected(item)}
              >
                {/* Left accent bar */}
                <div
                  className={cn(
                    'absolute left-0 top-0 bottom-0 w-1.5',
                    ACCENT_BAR[item.accentColor]
                  )}
                />
                <CardContent className="p-5 pl-6">
                  {/* Top row: category icon + demand badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div
                      className={cn(
                        'h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',
                        ACCENT_BADGE[item.accentColor]
                      )}
                    >
                      <CatIcon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 justify-end">
                      <Badge variant="outline" className={cn('text-[10px]', ACCENT_BADGE[item.accentColor])}>
                        {item.fieldBadge}
                      </Badge>
                      <Badge variant="outline" className={cn('text-[10px]', DEMAND_BADGE[item.demand])}>
                        {item.demand}
                      </Badge>
                    </div>
                  </div>

                  {/* Title + description */}
                  <h3 className="font-semibold text-stone-900 leading-snug">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-emerald-50 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium uppercase">
                        <IndianRupee className="h-3 w-3" /> Salary
                      </div>
                      <p className="text-xs text-stone-800 mt-0.5 line-clamp-2">{item.salaryRange}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-[10px] text-blue-700 font-medium uppercase">
                        <TrendingUp className="h-3 w-3" /> Growth
                      </div>
                      <p className="text-xs text-stone-800 mt-0.5 line-clamp-2">{item.growthTrend}</p>
                    </div>
                  </div>

                  {/* Footer row: provider / duration + view button */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                      {item.duration ? (
                        <>
                          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{item.duration}</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">
                            {item.institutions[0] || item.provider || item.category}
                          </span>
                        </>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" className="text-emerald-700 hover:bg-emerald-50">
                      View <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (() => {
            const CatIcon = CATEGORY_ICON[selected.category];
            return (
              <>
                <DialogHeader>
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 border',
                        ACCENT_BADGE[selected.accentColor]
                      )}
                    >
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <Badge variant="outline" className="text-[10px]">
                          {selected.category}
                        </Badge>
                        <Badge variant="outline" className={cn('text-[10px]', ACCENT_BADGE[selected.accentColor])}>
                          {selected.fieldBadge}
                        </Badge>
                        <Badge variant="outline" className={cn('text-[10px]', DEMAND_BADGE[selected.demand])}>
                          {selected.demand}
                        </Badge>
                      </div>
                      <DialogTitle className="text-xl leading-snug">{selected.title}</DialogTitle>
                      <DialogDescription className="mt-1">{selected.description}</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                {/* Quick stat tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selected.duration && (
                    <div className="bg-stone-50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Duration
                      </p>
                      <p className="text-sm font-semibold text-stone-900 mt-0.5">{selected.duration}</p>
                    </div>
                  )}
                  {(selected.cost || selected.provider) && (
                    <div className="bg-stone-50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium flex items-center gap-1">
                        <Award className="h-3 w-3" /> {selected.cost ? 'Cost' : 'Provider'}
                      </p>
                      <p className="text-sm font-semibold text-stone-900 mt-0.5 line-clamp-2">
                        {selected.cost || selected.provider}
                      </p>
                    </div>
                  )}
                  <div className="bg-stone-50 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase font-medium flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Growth
                    </p>
                    <p className="text-sm font-semibold text-stone-900 mt-0.5 line-clamp-2">{selected.growthTrend}</p>
                  </div>
                </div>

                {/* Salary range banner */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-100">
                  <p className="text-[10px] text-emerald-700 uppercase font-medium flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" /> Salary Range
                  </p>
                  <p className="text-sm font-semibold text-stone-900 mt-0.5">{selected.salaryRange}</p>
                </div>

                {/* Career outcomes */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-emerald-600" /> Career Outcomes
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.careerOutcomes.map((c) => (
                      <Badge key={c} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Salary progression */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" /> Salary Progression
                  </h4>
                  <div className="space-y-1.5">
                    {selected.salaryProgression.map((p) => (
                      <div
                        key={p.stage}
                        className="flex items-center justify-between gap-3 bg-stone-50 rounded-lg p-2.5"
                      >
                        <span className="text-xs text-stone-700 font-medium">{p.stage}</span>
                        <span className="text-xs font-semibold text-stone-900">{p.salary}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Institutions */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-amber-600" /> Institutions / Providers
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.institutions.map((i) => (
                      <Badge key={i} variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                        {i}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Skills covered */}
                {selected.skillsCovered && selected.skillsCovered.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Skills Covered
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.skillsCovered.map((s) => (
                        <Badge key={s} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Eligibility */}
                {selected.eligibility && (
                  <div className="bg-stone-50 rounded-lg p-3">
                    <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-stone-600" /> Eligibility
                    </h4>
                    <p className="text-sm text-muted-foreground">{selected.eligibility}</p>
                  </div>
                )}

                {/* Similar courses */}
                {selected.similarCourses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Compass className="h-4 w-4 text-purple-600" /> Similar Opportunities
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.similarCourses.map((s) => (
                        <Badge key={s} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelected(null)}>
                    Close
                  </Button>
                  <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                    <a href={selected.applyLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" /> Apply Now
                    </a>
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
