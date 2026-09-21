import { MASTER_EXAM_TAXONOMY, MasterExamCategory, ExamHierarchyNode, StreamOrPaperNode, SubjectNode, TopicNode, SubtopicNode } from './master-taxonomy';

export interface TaxonomySearchResult {
  level: 'category' | 'exam' | 'stream' | 'subject' | 'topic' | 'subtopic';
  path: string[];
  id: string;
  name: string;
  description?: string;
  matchedExamId?: string;
  crossApplicableExams?: string[];
}

export function getAllCategories(): MasterExamCategory[] {
  return MASTER_EXAM_TAXONOMY;
}

export function getCategoryById(categoryId: string): MasterExamCategory | undefined {
  return MASTER_EXAM_TAXONOMY.find(c => c.id === categoryId);
}

export function getAllExams(): ExamHierarchyNode[] {
  const exams: ExamHierarchyNode[] = [];
  for (const cat of MASTER_EXAM_TAXONOMY) {
    exams.push(...cat.exams);
  }
  return exams;
}

export function getExamById(examId: string): ExamHierarchyNode | undefined {
  for (const cat of MASTER_EXAM_TAXONOMY) {
    const found = cat.exams.find(e => e.id === examId || e.code.toLowerCase() === examId.toLowerCase());
    if (found) return found;
  }
  return undefined;
}

// 5-Tier Hierarchical Drill-down Search
export function searchMasterTaxonomy(query: string): TaxonomySearchResult[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const results: TaxonomySearchResult[] = [];

  for (const cat of MASTER_EXAM_TAXONOMY) {
    if (cat.title.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q)) {
      results.push({
        level: 'category',
        path: [cat.title],
        id: cat.id,
        name: cat.title,
        description: cat.description
      });
    }

    for (const exam of cat.exams) {
      if (exam.name.toLowerCase().includes(q) || exam.fullName.toLowerCase().includes(q) || exam.code.toLowerCase().includes(q)) {
        results.push({
          level: 'exam',
          path: [cat.title, exam.name],
          id: exam.id,
          name: exam.name,
          description: exam.fullName,
          matchedExamId: exam.id
        });
      }

      for (const stream of exam.streamsOrPapers) {
        if (stream.name.toLowerCase().includes(q) || stream.code.toLowerCase().includes(q)) {
          results.push({
            level: 'stream',
            path: [cat.title, exam.name, `${stream.code} - ${stream.name}`],
            id: stream.id,
            name: `${stream.code} - ${stream.name}`,
            matchedExamId: exam.id
          });
        }

        for (const subject of stream.subjects) {
          if (subject.name.toLowerCase().includes(q)) {
            results.push({
              level: 'subject',
              path: [cat.title, exam.name, stream.code, subject.name],
              id: subject.id,
              name: subject.name,
              matchedExamId: exam.id
            });
          }

          for (const topic of subject.topics) {
            if (topic.name.toLowerCase().includes(q)) {
              results.push({
                level: 'topic',
                path: [cat.title, exam.name, stream.code, subject.name, topic.name],
                id: topic.id,
                name: topic.name,
                matchedExamId: exam.id,
                crossApplicableExams: getCrossApplicableExamsForSubject(subject.name)
              });
            }

            for (const subtopic of topic.subtopics) {
              if (subtopic.name.toLowerCase().includes(q)) {
                results.push({
                  level: 'subtopic',
                  path: [cat.title, exam.name, stream.code, subject.name, topic.name, subtopic.name],
                  id: subtopic.id,
                  name: subtopic.name,
                  matchedExamId: exam.id,
                  crossApplicableExams: getCrossApplicableExamsForSubject(subject.name)
                });
              }
            }
          }
        }
      }
    }
  }

  return results.slice(0, 40);
}

// Cross-Exam Knowledge Reusability (Many-to-Many Mapping)
export function getCrossApplicableExamsForSubject(subjectName: string): string[] {
  const s = subjectName.toLowerCase();
  if (s.includes('operating system') || s.includes('data structure') || s.includes('algorithm') || s.includes('database') || s.includes('network')) {
    return ['GATE CS', 'ISRO CS', 'DRDO CS', 'NIC Scientist B', 'IBPS SO IT Officer', 'UGC NET CS', 'BARC CS', 'CUET PG CS'];
  }
  if (s.includes('polity') || s.includes('constitution') || s.includes('governance')) {
    return ['UPSC CSE Prelims', 'UPSC CAPF', 'SSC CGL', 'State PSCs (All 28 States)', 'CLAT PG', 'Judicial Services'];
  }
  if (s.includes('machine learning') || s.includes('artificial intelligence') || s.includes('probability')) {
    return ['GATE DA', 'IIT M.Tech AI', 'DRDO AI Lab', 'C-DAC AI Specialist', 'CUET PG AI'];
  }
  if (s.includes('quantitative') || s.includes('reasoning') || s.includes('english')) {
    return ['CAT', 'SSC CGL', 'IBPS PO', 'SBI PO', 'RRB NTPC', 'UPSC CSAT', 'State Subordinate Boards'];
  }
  return ['Cross-Disciplinary Reusable Module'];
}
