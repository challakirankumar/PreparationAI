'use client';

import React, { useState } from 'react';
import {
  Layers,
  Search,
  BookOpen,
  Cpu,
  GraduationCap,
  Building2,
  Award,
  ShieldCheck,
  TrendingUp,
  Terminal,
  Code2,
  Briefcase,
  School,
  Sparkles,
  HeartPulse,
  Landmark,
  FileSpreadsheet,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Flame,
  Zap,
  Filter,
  Check,
  Scale,
  Globe,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import {
  MASTER_EXAM_TAXONOMY,
  MasterExamCategory,
  ExamHierarchyNode,
  StreamOrPaperNode,
  SubjectNode,
  TopicNode,
  SubtopicNode,
  getCSAndAIOpportunities
} from '@/lib/taxonomy/master-taxonomy';
import { searchMasterTaxonomy, getCrossApplicableExamsForSubject } from '@/lib/taxonomy/taxonomy-service';

export default function TaxonomyExplorerView() {
  const setView = useStore((s) => s.setView);
  const user = useStore((s) => s.user);

  // Active navigation state across 5 tiers
  const [selectedCategory, setSelectedCategory] = useState<MasterExamCategory>(MASTER_EXAM_TAXONOMY[0]);
  const [selectedExam, setSelectedExam] = useState<ExamHierarchyNode>(MASTER_EXAM_TAXONOMY[0].exams[0]);
  const [selectedStream, setSelectedStream] = useState<StreamOrPaperNode | null>(
    MASTER_EXAM_TAXONOMY[0].exams[0]?.streamsOrPapers[0] || null
  );
  const [selectedSubject, setSelectedSubject] = useState<SubjectNode | null>(
    MASTER_EXAM_TAXONOMY[0].exams[0]?.streamsOrPapers[0]?.subjects[0] || null
  );
  const [selectedTopic, setSelectedTopic] = useState<TopicNode | null>(
    MASTER_EXAM_TAXONOMY[0].exams[0]?.streamsOrPapers[0]?.subjects[0]?.topics[0] || null
  );

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [csAiOnly, setCsAiOnly] = useState(false);
  const [regionFilter, setRegionFilter] = useState<'All' | 'India' | 'GCC'>('All');

  // Calculate search results
  const searchResults = searchQuery.trim().length >= 2 ? searchMasterTaxonomy(searchQuery) : [];

  // Filtered categories
  const displayedCategories = (csAiOnly
    ? MASTER_EXAM_TAXONOMY.filter(cat => cat.exams.some(e => e.isCSOrAIRelated))
    : MASTER_EXAM_TAXONOMY
  ).filter(cat => {
    if (regionFilter === 'GCC') {
      return ['Engineering & Architecture', 'Medical & Dental', 'Management & Business', 'Overseas Admissions', 'School & Foundation'].includes(cat.title);
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner — Royal Blue Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 border border-blue-600 p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md p-[2px] shadow-lg border border-white/20">
              <div className="w-full h-full bg-white/10 rounded-[14px] flex items-center justify-center">
                <Layers className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  Master Exam Taxonomy & Knowledge Hierarchy
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white text-blue-900 shadow-md">
                  5-Tier Unified Architecture
                </span>
              </div>
              <p className="text-blue-100 text-sm mt-1 max-w-3xl">
                Structured hierarchy: <span className="font-semibold text-white">Exam Family → Exam → Stream/Paper → Subject → Topic → Subtopic</span> with many-to-many cross-exam question bank reusability.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Region Tracker Filter */}
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md p-1 rounded-xl border border-white/30">
              <span className="text-[11px] font-bold text-blue-100 px-2 uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-white" /> Region:
              </span>
              <button
                onClick={() => setRegionFilter('All')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  regionFilter === 'All' ? 'bg-white text-blue-900 shadow-md' : 'text-blue-100 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRegionFilter('India')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                  regionFilter === 'India' ? 'bg-emerald-400 text-emerald-950 shadow-md' : 'text-blue-100 hover:text-white'
                }`}
              >
                <span>🇮🇳 India</span>
              </button>
              <button
                onClick={() => setRegionFilter('GCC')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                  regionFilter === 'GCC' ? 'bg-amber-400 text-amber-950 shadow-md' : 'text-blue-100 hover:text-white'
                }`}
              >
                <span>🇦🇪 GCC</span>
              </button>
            </div>

            <button
              onClick={() => setCsAiOnly(!csAiOnly)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer ${
                csAiOnly
                  ? 'bg-white text-blue-900 border-white shadow-lg'
                  : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>{csAiOnly ? '✓ CS / IT / AI Active' : 'CS / IT / AI'}</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6 relative">
          <Search className="w-5 h-5 text-blue-300 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search across all 5 tiers (e.g. 'CPU Scheduling', 'Machine Learning', 'Fundamental Rights', 'Operating Systems')..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/95 text-slate-900 placeholder-slate-400 border border-white/40 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-md"
          />
        </div>

        {/* Live Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-3 bg-white text-slate-900 border border-blue-200 rounded-2xl p-4 shadow-2xl max-h-80 overflow-y-auto space-y-2 divide-y divide-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase pb-2">
              Found {searchResults.length} Hierarchical Taxonomy Matches:
            </div>
            {searchResults.map((res, i) => (
              <div key={i} className="pt-2.5 flex items-center justify-between hover:bg-blue-50/50 p-2 rounded-xl transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                      {res.level}
                    </span>
                    <span className="font-bold text-sm text-slate-900">{res.name}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-mono">
                    {res.path.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <span>{step}</span>
                        {idx < res.path.length - 1 && <ChevronRight className="w-3 h-3 text-slate-400 inline" />}
                      </React.Fragment>
                    ))}
                  </div>
                  {res.crossApplicableExams && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-amber-700 font-semibold">Cross-Applicable to:</span>
                      {res.crossApplicableExams.slice(0, 4).map((ex, exIdx) => (
                        <span key={exIdx} className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                          {ex}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setView('pyq-archive');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                >
                  <span>Practice Questions</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5-Tier Interactive Visual Navigator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* TIER 1: Categories / Exam Families (Cols 4) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 px-2">
            <span>Tier 1: Exam Domain & Family</span>
            <span>{displayedCategories.length} Domains</span>
          </div>

          <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
            {displayedCategories.map(cat => {
              const isSelected = selectedCategory.id === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat);
                    const firstExam = cat.exams[0] || null;
                    setSelectedExam(firstExam);
                    const firstStream = firstExam?.streamsOrPapers[0] || null;
                    setSelectedStream(firstStream);
                    const firstSub = firstStream?.subjects[0] || null;
                    setSelectedSubject(firstSub);
                    setSelectedTopic(firstSub?.topics[0] || null);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 text-blue-950 shadow-md ring-1 ring-blue-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-sm flex items-center gap-2 text-slate-900">
                      {cat.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                      {cat.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* TIER 2 & 3: Streams, Papers & Subjects (Cols 4) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 px-2">
            <span>Tier 2 & 3: Papers & Subjects</span>
            <span>{selectedExam?.streamsOrPapers.length || 0} Streams</span>
          </div>

          {selectedExam && selectedExam.streamsOrPapers.length > 0 ? (
            <div className="space-y-4 max-h-[680px] overflow-y-auto pr-1">
              {/* Streams selection pill row */}
              <div className="flex flex-wrap gap-2">
                {selectedExam.streamsOrPapers.map(stream => {
                  const isSelected = selectedStream?.id === stream.id;
                  return (
                    <button
                      key={stream.id}
                      onClick={() => {
                        setSelectedStream(stream);
                        const firstSub = stream.subjects[0] || null;
                        setSelectedSubject(firstSub);
                        setSelectedTopic(firstSub?.topics[0] || null);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-extrabold'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      {stream.code}
                    </button>
                  );
                })}
              </div>

              {selectedStream ? (
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 rounded-xl border border-blue-200 shadow-sm">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Selected Stream</span>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedStream.code} - {selectedStream.name}</h4>
                    {selectedStream.eligibleDegrees && (
                      <p className="text-[11px] text-slate-600 mt-1">
                        Eligibility: {selectedStream.eligibleDegrees.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Subjects list */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase px-1">Curriculum Subjects</span>
                    {selectedStream.subjects.length === 0 ? (
                      <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 text-center">
                        Standard official curriculum active for {selectedStream.name}.
                      </div>
                    ) : (
                      selectedStream.subjects.map(subj => {
                        const isSubSelected = selectedSubject?.id === subj.id;
                        return (
                          <button
                            key={subj.id}
                            onClick={() => {
                              setSelectedSubject(subj);
                              setSelectedTopic(subj.topics[0] || null);
                            }}
                            className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                              isSubSelected
                                ? 'bg-blue-50/80 border-blue-500 text-blue-950 font-bold shadow-sm'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-slate-900">{subj.name}</span>
                              <span className="text-xs text-blue-600 font-semibold">{subj.topics.length} Topics</span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2 shadow-sm">
              <Sparkles className="w-8 h-8 text-blue-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">{selectedExam?.name || selectedCategory.title}</h4>
              <p className="text-xs text-slate-500">
                Official syllabus mappings loaded for all stages & optional subjects.
              </p>
            </div>
          )}
        </div>

        {/* TIER 4 & 5: Topics, Subtopics & Cross-Applicability (Cols 4) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 px-2">
            <span>Tier 4 & 5: Topics & Subtopics</span>
            <span className="text-emerald-700">Knowledge Bank</span>
          </div>

          <div className="bg-white rounded-2xl border border-blue-100 p-5 space-y-6 max-h-[680px] overflow-y-auto shadow-sm">
            {selectedSubject && selectedSubject.topics.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Subject Focus</span>
                    <h3 className="text-base font-extrabold text-slate-900">{selectedSubject.name}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Live Engine
                  </span>
                </div>

                {/* Topics Accordion */}
                <div className="space-y-4">
                  {selectedSubject.topics.map(topic => {
                    const crossExams = getCrossApplicableExamsForSubject(selectedSubject.name);
                    return (
                      <div key={topic.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs hover:border-blue-200 transition-colors">
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block shadow-sm" />
                            <span>{topic.name}</span>
                          </h4>
                          {topic.weightagePercent && (
                            <span className="text-[11px] font-mono text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                              ~{topic.weightagePercent}% Weight
                            </span>
                          )}
                        </div>

                        {/* Subtopics */}
                        <div className="space-y-2 pl-3 border-l-2 border-blue-500/40">
                          {topic.subtopics.map(sub => (
                            <div key={sub.id} className="text-xs text-slate-600 flex items-start gap-2">
                              <span className="text-blue-600 mt-0.5">›</span>
                              <span className="leading-relaxed">{sub.name}</span>
                            </div>
                          ))}
                        </div>

                        {/* Cross-Applicable Exams Badge Cluster */}
                        <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-amber-700 uppercase">Shared With:</span>
                          {crossExams.slice(0, 3).map((ex, exIdx) => (
                            <span key={exIdx} className="px-1.5 py-0.5 rounded text-[10px] bg-white text-slate-700 border border-slate-200">
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Direct Action Launchers */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => setView('pyq-archive')}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 transition-all"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Practice 10Y PYQs For This Subject</span>
                  </button>
                  <button
                    onClick={() => setView('mock-exam')}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                  >
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Generate AI Diagnostic Test</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">Select a Stream & Subject</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Click any subject on the left to inspect its detailed topics, subtopics, and many-to-many cross-exam mappings.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
