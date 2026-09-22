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
      // Show exams conducted in GCC centers or NRI DASA eligible (Engineering, Medical, Overseas)
      return ['Engineering & Architecture', 'Medical & Dental', 'Management & Business', 'Overseas Admissions', 'School & Foundation'].includes(cat.categoryName);
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Layers className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  Master Exam Taxonomy & Knowledge Hierarchy
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md">
                  5-Tier Unified Architecture
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-1 max-w-3xl">
                Structured hierarchy: <span className="font-semibold text-cyan-300">Exam Family → Exam → Stream/Paper → Subject → Topic → Subtopic</span> with many-to-many cross-exam question bank reusability.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Region Tracker Filter */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-cyan-400" /> Region:
              </span>
              <button
                onClick={() => setRegionFilter('All')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  regionFilter === 'All' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRegionFilter('India')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                  regionFilter === 'India' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🇮🇳 India</span>
              </button>
              <button
                onClick={() => setRegionFilter('GCC')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                  regionFilter === 'GCC' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🇦🇪 GCC</span>
              </button>
            </div>

            <button
              onClick={() => setCsAiOnly(!csAiOnly)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer ${
                csAiOnly
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-800/80 text-cyan-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>{csAiOnly ? '✓ CS / IT / AI Active' : 'CS / IT / AI'}</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search across all 5 tiers (e.g. 'CPU Scheduling', 'Machine Learning', 'Fundamental Rights', 'Operating Systems')..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner"
          />
        </div>

        {/* Live Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-3 bg-slate-900 border border-indigo-500/40 rounded-2xl p-4 shadow-2xl max-h-80 overflow-y-auto space-y-2 divide-y divide-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 uppercase pb-2">
              Found {searchResults.length} Hierarchical Taxonomy Matches:
            </div>
            {searchResults.map((res, i) => (
              <div key={i} className="pt-2.5 flex items-center justify-between hover:bg-slate-800/50 p-2 rounded-xl transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {res.level}
                    </span>
                    <span className="font-bold text-sm text-white">{res.name}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-mono">
                    {res.path.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <span>{step}</span>
                        {idx < res.path.length - 1 && <ChevronRight className="w-3 h-3 text-slate-600 inline" />}
                      </React.Fragment>
                    ))}
                  </div>
                  {res.crossApplicableExams && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-amber-400 font-semibold">Cross-Applicable to:</span>
                      {res.crossApplicableExams.slice(0, 4).map((ex, exIdx) => (
                        <span key={exIdx} className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
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
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
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
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
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
                      ? 'bg-gradient-to-r from-indigo-950 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/20 text-white'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      {cat.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-800 text-cyan-300 border border-slate-700">
                      {cat.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* TIER 2 & 3: Streams, Papers & Subjects (Cols 4) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
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
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {stream.code}
                    </button>
                  );
                })}
              </div>

              {selectedStream ? (
                <div className="space-y-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-cyan-400 uppercase">Selected Stream</span>
                    <h4 className="text-sm font-extrabold text-white mt-0.5">{selectedStream.code} - {selectedStream.name}</h4>
                    {selectedStream.eligibleDegrees && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Eligibility: {selectedStream.eligibleDegrees.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Subjects list */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase px-1">Curriculum Subjects</span>
                    {selectedStream.subjects.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500 text-center">
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
                                ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-md'
                                : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-850'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm">{subj.name}</span>
                              <span className="text-xs text-indigo-300 font-semibold">{subj.topics.length} Topics</span>
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
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-cyan-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">{selectedExam?.name || selectedCategory.title}</h4>
              <p className="text-xs text-slate-400">
                Official syllabus mappings loaded for all stages & optional subjects.
              </p>
            </div>
          )}
        </div>

        {/* TIER 4 & 5: Topics, Subtopics & Cross-Applicability (Cols 4) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
            <span>Tier 4 & 5: Topics & Subtopics</span>
            <span className="text-emerald-400">Knowledge Bank</span>
          </div>

          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-6 max-h-[680px] overflow-y-auto">
            {selectedSubject && selectedSubject.topics.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">Subject Focus</span>
                    <h3 className="text-base font-extrabold text-white">{selectedSubject.name}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Engine
                  </span>
                </div>

                {/* Topics Accordion */}
                <div className="space-y-4">
                  {selectedSubject.topics.map(topic => {
                    const crossExams = getCrossApplicableExamsForSubject(selectedSubject.name);
                    return (
                      <div key={topic.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                            <span>{topic.name}</span>
                          </h4>
                          {topic.weightagePercent && (
                            <span className="text-[11px] font-mono text-cyan-400 font-bold">
                              ~{topic.weightagePercent}% Weight
                            </span>
                          )}
                        </div>

                        {/* Subtopics */}
                        <div className="space-y-2 pl-3 border-l-2 border-indigo-500/30">
                          {topic.subtopics.map(sub => (
                            <div key={sub.id} className="text-xs text-slate-300 flex items-start gap-2">
                              <span className="text-indigo-400 mt-0.5">›</span>
                              <span className="leading-relaxed">{sub.name}</span>
                            </div>
                          ))}
                        </div>

                        {/* Cross-Applicable Exams Badge Cluster */}
                        <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-amber-400 uppercase">Many-to-Many Shared With:</span>
                          {crossExams.slice(0, 3).map((ex, exIdx) => (
                            <span key={exIdx} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-300 border border-slate-800">
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
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Practice 10Y PYQs For This Subject</span>
                  </button>
                  <button
                    onClick={() => setView('mock-exam')}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Generate AI Diagnostic Test</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <Layers className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">Select a Stream & Subject</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
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
