'use client';

import { useMemo, useState } from 'react';
import {
  BookOpen,
  Library,
  Video,
  GraduationCap,
  Dumbbell,
  Smartphone,
  Lightbulb,
  FileText,
  ExternalLink,
  Calendar,
  Target,
  TrendingUp,
  AlertTriangle,
  Award,
  Clock,
  Layers,
  CheckCircle2,
  ListChecks,
  Star,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared';
import {
  STUDY_MATERIALS,
  STUDY_MATERIAL_EXAM_IDS,
} from '@/lib/study-material-data';
import type {
  StudyMaterial,
  StudyBook,
  VideoCourse,
  OnlineCourse,
  PracticeResource,
  MobileApp,
  SyllabusSubject,
} from '@/lib/study-material-data';
import { useStore, userExamGoals } from '@/lib/store';
import { getPattern } from '@/lib/exams/patterns';
import { cn } from '@/lib/utils';

type TabId = 'syllabus' | 'books' | 'videos' | 'courses' | 'practice' | 'apps' | 'tips';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
  { id: 'books', label: 'Books', icon: Library },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'courses', label: 'Courses', icon: GraduationCap },
  { id: 'practice', label: 'Practice', icon: Dumbbell },
  { id: 'apps', label: 'Apps', icon: Smartphone },
  { id: 'tips', label: 'Tips', icon: Lightbulb },
];

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: 'bg-teal-50 text-teal-700 border-teal-200',
  Moderate: 'bg-amber-50 text-amber-700 border-amber-200',
  Hard: 'bg-blue-50 text-blue-700 border-blue-200',
  'Very Hard': 'bg-rose-50 text-rose-700 border-rose-200',
};

// ============================================================
// Reusable card components per resource type
// ============================================================

function BookCard({ book, idx }: { book: StudyBook; idx: number }) {
  return (
    <Card className="card-lift border-stone-200 hover:border-blue-300 overflow-hidden h-full flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
            <Library className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-semibold text-blue-700">#{idx + 1}</span>
              {book.subject && (
                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                  {book.subject}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-stone-900 leading-snug line-clamp-2">{book.title}</h3>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          <span className="font-medium text-stone-700">{book.author}</span>
          {book.edition && <span className="text-stone-500"> · {book.edition}</span>}
        </p>
        <div className="mt-auto pt-4">
          <Button size="sm" variant="outline" className="w-full text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-800" asChild>
            <a href={book.link} target="_blank" rel="noopener noreferrer">
              Find book <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function VideoCard({ video, idx }: { video: VideoCourse; idx: number }) {
  return (
    <Card className="card-lift border-stone-200 hover:border-blue-300 overflow-hidden h-full flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center flex-shrink-0">
            <Video className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200 mb-1">
              #{idx + 1} · YouTube
            </Badge>
            <h3 className="font-semibold text-stone-900 leading-snug line-clamp-2">{video.channel}</h3>
          </div>
        </div>
        <p className="text-sm text-stone-700 mt-2 line-clamp-2">{video.title}</p>
        <div className="bg-blue-50 rounded-lg p-2 mt-3">
          <p className="text-[10px] text-blue-700 font-medium uppercase flex items-center gap-1">
            <Target className="h-3 w-3" /> Focus
          </p>
          <p className="text-xs text-stone-700 mt-0.5 line-clamp-2">{video.focus}</p>
        </div>
        <div className="mt-auto pt-4">
          <Button size="sm" variant="outline" className="w-full text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-800" asChild>
            <a href={video.link} target="_blank" rel="noopener noreferrer">
              Open channel <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function OnlineCourseCard({ course, idx }: { course: OnlineCourse; idx: number }) {
  return (
    <Card className="card-lift border-stone-200 hover:border-blue-300 overflow-hidden h-full flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 mb-1">
              #{idx + 1} · {course.platform}
            </Badge>
            <h3 className="font-semibold text-stone-900 leading-snug line-clamp-2">{course.course}</h3>
          </div>
        </div>
        {course.price && (
          <div className="bg-blue-50 rounded-lg p-2 mt-3">
            <p className="text-[10px] text-blue-700 font-medium uppercase flex items-center gap-1">
              <Award className="h-3 w-3" /> Price
            </p>
            <p className="text-xs text-stone-800 mt-0.5">{course.price}</p>
          </div>
        )}
        <div className="mt-auto pt-4">
          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" asChild>
            <a href={course.link} target="_blank" rel="noopener noreferrer">
              Enroll <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PracticeCard({ resource, idx }: { resource: PracticeResource; idx: number }) {
  return (
    <Card className="card-lift border-stone-200 hover:border-blue-300 overflow-hidden h-full flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
            <Dumbbell className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-700 border-teal-200 mb-1">
              #{idx + 1} · {resource.provider}
            </Badge>
            <h3 className="font-semibold text-stone-900 leading-snug line-clamp-2">{resource.name}</h3>
          </div>
        </div>
        <div className="bg-stone-50 rounded-lg p-2 mt-3">
          <p className="text-[10px] text-stone-600 font-medium uppercase flex items-center gap-1">
            <Layers className="h-3 w-3" /> Type
          </p>
          <p className="text-xs text-stone-700 mt-0.5 line-clamp-2">{resource.type}</p>
        </div>
        <div className="mt-auto pt-4">
          <Button size="sm" variant="outline" className="w-full text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-800" asChild>
            <a href={resource.link} target="_blank" rel="noopener noreferrer">
              Get access <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MobileAppCard({ app, idx }: { app: MobileApp; idx: number }) {
  return (
    <Card className="card-lift border-stone-200 hover:border-blue-300 overflow-hidden h-full flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
            <Smartphone className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 mb-1">
              #{idx + 1} · App
            </Badge>
            <h3 className="font-semibold text-stone-900 leading-snug line-clamp-2">{app.name}</h3>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">by <span className="text-stone-700 font-medium">{app.developer}</span></p>
        {app.rating && (
          <div className="flex items-center gap-1 mt-2">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-amber-700">{app.rating}</span>
          </div>
        )}
        <div className="mt-auto pt-4">
          <Button size="sm" variant="outline" className="w-full text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-800" asChild>
            <a href={app.link} target="_blank" rel="noopener noreferrer">
              Get app <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TipCard({ idx, text, type }: { idx: number; text: string; type: 'tip' | 'strategy' }) {
  const isStrategy = type === 'strategy';
  return (
    <Card className="card-lift border-stone-200 hover:border-blue-300 overflow-hidden h-full">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className={cn(
            'h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm',
            isStrategy
              ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
              : 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white'
          )}>
            {idx + 1}
          </div>
          <div className="min-w-0 flex-1">
            <Badge variant="outline" className={cn(
              'text-[10px] mb-1.5',
              isStrategy
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            )}>
              {isStrategy ? (
                <><AlertTriangle className="h-2.5 w-2.5" /> Exam Day Strategy</>
              ) : (
                <><Lightbulb className="h-2.5 w-2.5" /> Study Tip</>
              )}
            </Badge>
            <p className="text-sm text-stone-800 leading-relaxed">{text}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SyllabusCard({ subject }: { subject: SyllabusSubject }) {
  const weightPct = Math.round(subject.weight * 100);
  return (
    <Card className="card-lift border-stone-200 hover:border-blue-300 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">{subject.subject}</h3>
              <p className="text-[11px] text-muted-foreground">{subject.topics.length} topics</p>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200" variant="outline">
            {weightPct}% weight
          </Badge>
        </div>

        <div className="space-y-3">
          {subject.topics.map((t) => {
            const tPct = Math.round(t.weight * 100);
            return (
              <div key={t.topic} className="border-l-2 border-blue-200 pl-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium text-stone-800">{t.topic}</p>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{tPct}%</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {t.subtopics.map((s) => (
                    <Badge key={s} variant="outline" className="text-[10px] bg-stone-50 text-stone-600 border-stone-200">
                      {s}
                    </Badge>
                  ))}
                </div>
                <div className="mt-1.5 h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                    style={{ width: `${tPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main view
// ============================================================

export function StudyMaterialView() {
  const user = useStore((s) => s.user);

  // Build list of exam IDs the user has access to: their goals ∩ available study materials.
  // If none match (or user has no goals), fall back to showing all 10.
  const availableExams = useMemo(() => {
    const goals = userExamGoals(user);
    const ids = goals.length > 0 ? goals : STUDY_MATERIAL_EXAM_IDS;
    const filtered = ids.filter((id) => STUDY_MATERIALS[id]);
    return filtered.length > 0 ? filtered : STUDY_MATERIAL_EXAM_IDS;
  }, [user]);

  const [preferredExam, setPreferredExam] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('syllabus');

  // Derive the effective exam id during render — avoids a setState-in-effect
  // cascade while still respecting the user's preferred exam when it is valid.
  const activeExam =
    preferredExam && availableExams.includes(preferredExam)
      ? preferredExam
      : availableExams[0];

  const material: StudyMaterial | undefined = STUDY_MATERIALS[activeExam];
  const pattern = getPattern(activeExam);

  if (!material) {
    return (
      <div className="space-y-6">
        <PageHeader icon={BookOpen} title="Study Material" subtitle="Curated prep resources for every exam" accent="emerald" />
        <Card className="p-10 border-stone-200 text-center">
          <FileText className="h-10 w-10 text-stone-400 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No study material available for this exam.</p>
        </Card>
      </div>
    );
  }

  const difficultyClass = DIFFICULTY_STYLES[material.difficulty] || DIFFICULTY_STYLES.Moderate;
  const examDurationMin = pattern ? Math.round(pattern.durationSec / 60) : null;
  const totalQuestions = pattern?.totalQuestions ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        title="Study Material"
        subtitle="Curated books, video courses, apps, and strategies for every exam"
        accent="emerald"
        right={
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            {STUDY_MATERIAL_EXAM_IDS.length} exams curated
          </Badge>
        }
      />

      {/* ============================================================ */}
      {/* Hero overview + exam selector */}
      {/* ============================================================ */}
      <Card className="border-stone-200 overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-5 sm:p-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="outline" className="bg-white/15 text-white border-white/30 text-[10px]">
                  {pattern?.category === 'school' ? 'School' : pattern?.category === 'grad' ? 'Grad / Pro' : pattern?.category}
                </Badge>
                <Badge variant="outline" className={cn('text-[10px] border-none', difficultyClass)}>
                  {material.difficulty}
                </Badge>
              </div>
              <h2 className="text-2xl font-bold leading-tight">{material.examName}</h2>
              <p className="text-sm text-blue-100 mt-1 line-clamp-2 sm:line-clamp-none">{material.examOverview}</p>
            </div>
            <div className="w-full sm:w-64 flex-shrink-0">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-blue-100 mb-1">
                Select exam
              </label>
              <Select value={activeExam} onValueChange={setPreferredExam}>
                <SelectTrigger className="w-full bg-white/95 border-white/40 text-stone-900 h-10">
                  <SelectValue placeholder="Pick an exam" />
                </SelectTrigger>
                <SelectContent>
                  {availableExams.map((id) => {
                    const m = STUDY_MATERIALS[id];
                    if (!m) return null;
                    return (
                      <SelectItem key={id} value={id}>
                        {m.examName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-blue-100 mt-1.5">
                {availableExams.length} exam{availableExams.length === 1 ? '' : 's'} available
              </p>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-blue-100">
                <Award className="h-3 w-3" /> Total Marks
              </div>
              <p className="text-xl font-bold mt-0.5">{material.totalMarks}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-blue-100">
                <ListChecks className="h-3 w-3" /> Questions
              </div>
              <p className="text-xl font-bold mt-0.5">{totalQuestions ?? '—'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-blue-100">
                <Clock className="h-3 w-3" /> Duration
              </div>
              <p className="text-xl font-bold mt-0.5">{examDurationMin ? `${Math.round(examDurationMin / 60)}h ${examDurationMin % 60}m` : '—'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-blue-100">
                <AlertTriangle className="h-3 w-3" /> Negative
              </div>
              <p className="text-xs font-bold mt-0.5 leading-tight">{material.negativeMarking}</p>
            </div>
          </div>
        </div>

        {/* Exam pattern + important dates */}
        <CardContent className="p-5 grid sm:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-1.5">
              <FileText className="h-4 w-4 text-blue-600" /> Exam Pattern
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{material.examPattern}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-1.5">
              <Calendar className="h-4 w-4 text-amber-600" /> Important Dates
            </h4>
            <div className="space-y-1.5">
              {material.importantDates.map((d) => (
                <div key={d.event} className="flex items-start gap-2 text-xs">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="font-medium text-stone-800">{d.event}</span>
                    <span className="text-muted-foreground"> — {d.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Tabs */}
      {/* ============================================================ */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="w-full">
        <TabsList className="bg-stone-100 p-1 flex flex-wrap h-auto gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm',
                  active ? 'bg-blue-600 text-white' : 'text-stone-600 hover:text-blue-700'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ---- Syllabus tab ---- */}
        <TabsContent value="syllabus" className="mt-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {material.syllabus.map((subj) => (
              <SyllabusCard key={subj.subject} subject={subj} />
            ))}
          </div>
        </TabsContent>

        {/* ---- Books tab ---- */}
        <TabsContent value="books" className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              <Library className="h-4 w-4 inline-block mr-1.5 text-blue-600" />
              {material.books.length} recommended books across {material.syllabus.length} subjects
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {material.books.map((book, i) => (
              <BookCard key={`${book.title}-${i}`} book={book} idx={i} />
            ))}
          </div>
        </TabsContent>

        {/* ---- Videos tab ---- */}
        <TabsContent value="videos" className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              <Video className="h-4 w-4 inline-block mr-1.5 text-rose-600" />
              {material.videoCourses.length} YouTube channels with free structured lessons
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {material.videoCourses.map((v, i) => (
              <VideoCard key={`${v.channel}-${i}`} video={v} idx={i} />
            ))}
          </div>
        </TabsContent>

        {/* ---- Courses tab ---- */}
        <TabsContent value="courses" className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4 inline-block mr-1.5 text-amber-600" />
              {material.onlineCourses.length} online platforms with structured prep courses
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {material.onlineCourses.map((c, i) => (
              <OnlineCourseCard key={`${c.platform}-${i}`} course={c} idx={i} />
            ))}
          </div>
        </TabsContent>

        {/* ---- Practice tab ---- */}
        <TabsContent value="practice" className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              <Dumbbell className="h-4 w-4 inline-block mr-1.5 text-teal-600" />
              {material.practiceResources.length} practice resources — mock tests, PYQs, question banks
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {material.practiceResources.map((r, i) => (
              <PracticeCard key={`${r.name}-${i}`} resource={r} idx={i} />
            ))}
          </div>
        </TabsContent>

        {/* ---- Apps tab ---- */}
        <TabsContent value="apps" className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4 inline-block mr-1.5 text-blue-600" />
              {material.mobileApps.length} mobile apps for daily practice + revision
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {material.mobileApps.map((a, i) => (
              <MobileAppCard key={`${a.name}-${i}`} app={a} idx={i} />
            ))}
          </div>
        </TabsContent>

        {/* ---- Tips tab ---- */}
        <TabsContent value="tips" className="mt-4 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2 text-stone-900">
                <Lightbulb className="h-4 w-4 text-blue-600" /> Study Tips
                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">{material.studyTips.length}</Badge>
              </h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {material.studyTips.map((tip, i) => (
                <TipCard key={`tip-${i}`} idx={i} text={tip} type="tip" />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2 text-stone-900">
                <CheckCircle2 className="h-4 w-4 text-amber-600" /> Exam Day Strategy
                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">{material.examDayStrategy.length}</Badge>
              </h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {material.examDayStrategy.map((s, i) => (
                <TipCard key={`strat-${i}`} idx={i} text={s} type="strategy" />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer CTA */}
      <Card className="border-stone-200 p-5 bg-gradient-to-br from-blue-50 to-amber-50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold text-stone-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" /> Build a personalised plan
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Use these resources alongside an AI-generated study plan and AI mentor guidance for best results.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => useStore.getState().setView('planner')}>
              <Calendar className="h-4 w-4" /> Open Planner
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => useStore.getState().setView('mentor')}>
              <Target className="h-4 w-4" /> Ask AI Mentor
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
