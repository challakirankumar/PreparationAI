// ============================================================================
// RAG Retrieval Engine — TF-IDF-style ranking with keyword matching
// ----------------------------------------------------------------------------
// For each query, retrieves the top-K most relevant chunks from the document
// store. Uses a simple but effective scoring approach:
//   1. Tokenize the query (remove stopwords, lowercase)
//   2. For each chunk, compute a relevance score based on:
//      - Term frequency overlap (query terms in chunk)
//      - IDF weighting (rare terms score higher)
//      - Boost for subject/topic match if detected in the query
//   3. Return top-K chunks sorted by score
// ============================================================================

import type { RagChunk } from './document-store';
import { getAllChunks } from './document-store';

export interface RetrievedChunk {
  chunk: RagChunk;
  score: number;
  matchedTerms: string[];
}

export interface RetrievalResult {
  query: string;
  totalChunks: number;
  retrievedCount: number;
  chunks: RetrievedChunk[];
  detectedSubject?: string;
  detectedTopic?: string;
}

// ---------------------------------------------------------------------------
// Stopwords (shared with document-store.ts for consistency)
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can',
  'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
  'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just', 'also', 'about', 'above', 'after', 'again',
  'against', 'before', 'below', 'between', 'during', 'further', 'here', 'into', 'off', 'out',
  'over', 'then', 'there', 'under', 'up', 'down', 'if', 'because', 'while', 'any', 'explain',
  'define', 'describe', 'tell', 'me', 'us', 'my', 'our', 'your',
]);

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

// ---------------------------------------------------------------------------
// Subject/topic detection — common keywords that hint at a subject
// ---------------------------------------------------------------------------

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  Physics: ['force', 'motion', 'velocity', 'acceleration', 'energy', 'work', 'power', 'momentum', 'torque', 'rotation', 'gravitation', 'electric', 'magnetic', 'wave', 'optics', 'thermodynamics', 'newton', 'ohm', 'circuit', 'capacitor', 'inductor', 'field'],
  Chemistry: ['atom', 'molecule', 'bond', 'reaction', 'acid', 'base', 'salt', 'oxidation', 'reduction', 'organic', 'inorganic', 'periodic', 'element', 'compound', 'mole', 'stoichiometry', 'equilibrium', 'kinetics', 'electrochemistry', 'hydrocarbon'],
  Mathematics: ['derivative', 'integral', 'function', 'limit', 'continuity', 'differential', 'calculus', 'matrix', 'determinant', 'probability', 'statistics', 'geometry', 'trigonometry', 'algebra', 'equation', 'theorem', 'proof', 'vector'],
  Biology: ['cell', 'tissue', 'organ', 'gene', 'dna', 'rna', 'protein', 'enzyme', 'photosynthesis', 'respiration', 'evolution', 'genetics', 'heredity', 'mutation', 'chromosome', 'mitosis', 'meiosis', 'ecosystem', 'taxonomy'],
};

const TOPIC_KEYWORDS: Record<string, string[]> = {
  'Laws of Motion': ['newton', 'force', 'inertia', 'momentum', 'action', 'reaction', 'f=ma'],
  'Work Energy Power': ['work', 'energy', 'power', 'kinetic', 'potential', 'conservation', 'joule', 'watt'],
  'Rotational Motion': ['rotation', 'torque', 'moment', 'inertia', 'angular', 'axis', 'spin', 'rigid'],
  'Kinematics': ['velocity', 'acceleration', 'displacement', 'motion', 'projectile', 'free fall'],
  'Chemical Bonding': ['bond', 'covalent', 'ionic', 'hybridization', 'lewis', 'vsepr', 'molecule'],
  'Calculus': ['derivative', 'integral', 'differentiation', 'integration', 'limit', 'continuity'],
  'Probability': ['probability', 'bayes', 'conditional', 'independent', 'event', 'random', 'variable'],
  'Genetics': ['gene', 'dna', 'heredity', 'mendel', 'allele', 'genotype', 'phenotype', 'punnett'],
};

function detectSubject(query: string): string | undefined {
  const tokens = tokenize(query);
  const scores: Record<string, number> = {};
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    scores[subject] = 0;
    for (const kw of keywords) {
      if (tokens.some(t => t.includes(kw) || kw.includes(t))) {
        scores[subject]++;
      }
    }
  }
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return top && top[1] > 0 ? top[0] : undefined;
}

function detectTopic(query: string): string | undefined {
  const tokens = tokenize(query);
  const scores: Record<string, number> = {};
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    scores[topic] = 0;
    for (const kw of keywords) {
      if (tokens.some(t => t.includes(kw) || kw.includes(t))) {
        scores[topic]++;
      }
    }
  }
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return top && top[1] > 0 ? top[0] : undefined;
}

// ---------------------------------------------------------------------------
// Compute IDF for each term across the entire chunk corpus
// ---------------------------------------------------------------------------

function computeIdfMap(chunks: RagChunk[]): Record<string, number> {
  const docFreq: Record<string, number> = {};
  for (const chunk of chunks) {
    const uniqueTerms = new Set(Object.keys(chunk.termFreq));
    for (const term of uniqueTerms) {
      docFreq[term] = (docFreq[term] ?? 0) + 1;
    }
  }
  const N = chunks.length;
  const idf: Record<string, number> = {};
  for (const [term, df] of Object.entries(docFreq)) {
    // Standard IDF formula: log(N / df). Add 1 to avoid division by zero.
    idf[term] = Math.log((N + 1) / (df + 1)) + 1;
  }
  return idf;
}

// ---------------------------------------------------------------------------
// Score a chunk against the query
// ---------------------------------------------------------------------------

function scoreChunk(
  chunk: RagChunk,
  queryTokens: string[],
  idf: Record<string, number>,
  detectedSubject?: string,
  detectedTopic?: string,
): { score: number; matchedTerms: string[] } {
  let score = 0;
  const matchedTerms: string[] = [];

  for (const token of queryTokens) {
    // Check for exact match or stem match (simple: starts with token)
    const matchingTerms = Object.keys(chunk.termFreq).filter(t =>
      t === token || t.startsWith(token) || token.startsWith(t)
    );
    if (matchingTerms.length > 0) {
      // Sum TF-IDF for all matching terms
      let termScore = 0;
      for (const mt of matchingTerms) {
        const tf = chunk.termFreq[mt] ?? 0;
        const idfVal = idf[mt] ?? 1;
        termScore += tf * idfVal;
      }
      score += termScore;
      matchedTerms.push(token);
    }
  }

  // Boost for subject/topic match
  if (detectedSubject && chunk.subject === detectedSubject) {
    score *= 1.5;
  }
  if (detectedTopic && chunk.topic === detectedTopic) {
    score *= 2.0;
  }

  return { score, matchedTerms };
}

// ---------------------------------------------------------------------------
// Main retrieval function — returns top-K chunks for a query
// ---------------------------------------------------------------------------

export function retrieve(query: string, topK: number = 5): RetrievalResult {
  const chunks = getAllChunks();
  const queryTokens = tokenize(query);
  const detectedSubject = detectSubject(query);
  const detectedTopic = detectTopic(query);
  const idf = computeIdfMap(chunks);

  const scored = chunks.map(chunk => {
    const { score, matchedTerms } = scoreChunk(chunk, queryTokens, idf, detectedSubject, detectedTopic);
    return { chunk, score, matchedTerms };
  });

  // Filter to chunks with score > 0, sort by score desc, take top K
  const relevant = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return {
    query,
    totalChunks: chunks.length,
    retrievedCount: relevant.length,
    chunks: relevant,
    detectedSubject,
    detectedTopic,
  };
}

// ---------------------------------------------------------------------------
// Build the context string for the LLM — concatenates retrieved chunks with
// source citations
// ---------------------------------------------------------------------------

export interface ContextCitation {
  chunkId: string;
  source: string;
  chapter?: string;
  page?: number;
  subject: string;
  topic: string;
  title: string;
  excerpt: string;  // first 100 chars of the chunk for the UI
}

export function buildContextForLLM(retrieval: RetrievalResult): { context: string; citations: ContextCitation[] } {
  if (retrieval.chunks.length === 0) {
    return { context: '', citations: [] };
  }

  const contextParts: string[] = [];
  const citations: ContextCitation[] = [];

  retrieval.chunks.forEach((rc, idx) => {
    const chunk = rc.chunk;
    const sourceLabel = `${chunk.source}${chunk.page ? `, p. ${chunk.page}` : ''}`;
    contextParts.push(`[Source ${idx + 1}: ${sourceLabel}]\n${chunk.text}`);
    citations.push({
      chunkId: chunk.id,
      source: chunk.source,
      chapter: chunk.chapter,
      page: chunk.page,
      subject: chunk.subject,
      topic: chunk.topic,
      title: chunk.title,
      excerpt: chunk.text.slice(0, 100) + (chunk.text.length > 100 ? '…' : ''),
    });
  });

  const context = contextParts.join('\n\n---\n\n');
  return { context, citations };
}
