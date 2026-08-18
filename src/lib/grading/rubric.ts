// ============================================================================
// Handwritten Step Grading — Rubric + Grading Engine
// ----------------------------------------------------------------------------
// Grades subjective (board-exam style) answers by:
//   1. Splitting the reference solution into discrete steps
//   2. Asking the VLM to identify which steps the student wrote
//   3. Scoring each step against the rubric (correct / partial / wrong / missing)
//   4. Aggregating into a final mark with per-step feedback
//
// Designed for board-exam subjects: Physics long-answer, Chemistry numerical,
// Math proof, Biology diagram explanation, English essay (limited), etc.
// ============================================================================

export type StepStatus = 'correct' | 'partial' | 'wrong' | 'missing';

export interface RubricStep {
  index: number;              // 1-indexed
  description: string;        // what the student should write in this step
  marks: number;              // max marks for this step
  // Key concepts / equations / values that should appear in this step
  keyConcepts: string[];
  // Common mistakes for this specific step (pre-populated hints)
  commonMistakes: string[];
}

export interface GradingRubric {
  problemTitle: string;
  problemStatement: string;
  totalMarks: number;
  subject: string;
  topic: string;
  steps: RubricStep[];
  // Optional model answer for the AI to compare against
  modelAnswer?: string;
}

export interface StepGrade {
  rubricStepIndex: number;
  description: string;
  status: StepStatus;
  awardedMarks: number;
  maxMarks: number;
  // What the student actually wrote (paraphrased by the AI)
  studentWork?: string;
  // Specific feedback for this step
  feedback: string;
  // Concepts the student got right in this step
  conceptsPresent: string[];
  // Concepts the student missed
  conceptsMissing: string[];
  // Mistakes identified
  mistakesIdentified: string[];
}

export interface GradingResult {
  totalAwardedMarks: number;
  totalMaxMarks: number;
  percentage: number;
  stepGrades: StepGrade[];
  // Overall feedback — strengths + areas to improve
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  // Whether the AI was confident in reading the handwriting
  handwritingConfidence: 'high' | 'medium' | 'low';
  // If handwriting was illegible, this is set to true
  illegible: boolean;
  // Audit ID from EduScope
  auditId?: string;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Status colors + icons (used by UI)
// ---------------------------------------------------------------------------

export const STATUS_META: Record<StepStatus, { label: string; color: string; bgClass: string; icon: string }> = {
  correct: { label: 'Correct', color: 'text-emerald-700', bgClass: 'bg-emerald-50 border-emerald-200', icon: '✓' },
  partial: { label: 'Partial', color: 'text-amber-700', bgClass: 'bg-amber-50 border-amber-200', icon: '◐' },
  wrong: { label: 'Wrong', color: 'text-rose-700', bgClass: 'bg-rose-50 border-rose-200', icon: '✗' },
  missing: { label: 'Missing', color: 'text-stone-500', bgClass: 'bg-stone-50 border-stone-200', icon: '—' },
};

// ---------------------------------------------------------------------------
// Awarded-marks computation given a status and max marks
// ---------------------------------------------------------------------------

export function computeAwardedMarks(status: StepStatus, maxMarks: number): number {
  switch (status) {
    case 'correct': return maxMarks;
    case 'partial': return Math.round(maxMarks * 0.5 * 10) / 10;
    case 'wrong': return 0;
    case 'missing': return 0;
  }
}

// ---------------------------------------------------------------------------
// Aggregate step grades into a final result
// ---------------------------------------------------------------------------

export function aggregateStepGrades(
  stepGrades: StepGrade[],
  rubric: GradingRubric,
  handwritingConfidence: 'high' | 'medium' | 'low',
  illegible: boolean,
  auditId?: string,
): GradingResult {
  const totalAwarded = stepGrades.reduce((s, g) => s + g.awardedMarks, 0);
  const totalMax = stepGrades.reduce((s, g) => s + g.maxMarks, 0);
  const percentage = totalMax > 0 ? Math.round((totalAwarded / totalMax) * 100) : 0;

  // Collect strengths + improvements from step feedback
  const strengths: string[] = [];
  const improvements: string[] = [];
  for (const g of stepGrades) {
    if (g.status === 'correct') {
      strengths.push(`Step ${g.rubricStepIndex}: ${g.description} — fully correct`);
    } else if (g.status === 'partial') {
      improvements.push(`Step ${g.rubricStepIndex} (${g.description}): ${g.conceptsMissing.join(', ') || 'partial credit'} — ${g.feedback}`);
    } else if (g.status === 'wrong') {
      improvements.push(`Step ${g.rubricStepIndex} (${g.description}): wrong — ${g.feedback}`);
    } else if (g.status === 'missing') {
      improvements.push(`Step ${g.rubricStepIndex} (${g.description}): missing — ${g.feedback}`);
    }
  }

  let overallFeedback: string;
  if (illegible) {
    overallFeedback = 'The handwriting in the uploaded image is partially illegible. Please re-upload a clearer image for accurate grading. The feedback below is based on what could be read.';
  } else if (percentage >= 90) {
    overallFeedback = `Excellent work — you scored ${totalAwarded}/${totalMax} (${percentage}%). Your solution demonstrates clear understanding of ${rubric.topic}. Continue to label intermediate steps explicitly for full marks in board exams.`;
  } else if (percentage >= 70) {
    overallFeedback = `Good attempt — you scored ${totalAwarded}/${totalMax} (${percentage}%). The core approach is correct; the gaps are in specific steps where partial credit was lost. Focus on the improvements below to push toward a perfect score.`;
  } else if (percentage >= 40) {
    overallFeedback = `Decent attempt — you scored ${totalAwarded}/${totalMax} (${percentage}%). The solution structure is recognisable but several steps have conceptual or procedural errors. Revise the topics flagged below and re-attempt.`;
  } else {
    overallFeedback = `Significant gaps — you scored ${totalAwarded}/${totalMax} (${percentage}%). The solution is missing key steps or contains fundamental errors. Please revisit the topic ${rubric.topic} from NCERT/basics and re-attempt the problem from scratch.`;
  }

  return {
    totalAwardedMarks: Math.round(totalAwarded * 10) / 10,
    totalMaxMarks: totalMax,
    percentage,
    stepGrades,
    overallFeedback,
    strengths,
    improvements,
    handwritingConfidence,
    illegible,
    auditId,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Sample rubrics — pre-populated for common board-exam problems
// ---------------------------------------------------------------------------

export const SAMPLE_RUBRICS: GradingRubric[] = [
  {
    problemTitle: 'Projectile Motion — Range Calculation',
    problemStatement: 'A projectile is launched with speed u at angle θ to the horizontal. Derive an expression for the maximum range R and find the angle for maximum range.',
    totalMarks: 5,
    subject: 'Physics',
    topic: 'Kinematics',
    modelAnswer: 'Resolve velocity into horizontal (u cosθ) and vertical (u sinθ) components. Time of flight T = 2u sinθ/g. Range R = u cosθ × T = u² sin(2θ)/g. Maximum range when sin(2θ) = 1, i.e. θ = 45°.',
    steps: [
      {
        index: 1,
        description: 'Resolve initial velocity into horizontal and vertical components',
        marks: 1,
        keyConcepts: ['u cosθ (horizontal)', 'u sinθ (vertical)'],
        commonMistakes: ['Using sinθ for horizontal', 'Forgetting to resolve into components'],
      },
      {
        index: 2,
        description: 'Compute time of flight using vertical motion (T = 2u sinθ/g)',
        marks: 1,
        keyConcepts: ['T = 2u sinθ/g', 'derived from v = u + gt with v=0 at apex'],
        commonMistakes: ['Using T = u sinθ/g (half the time)', 'Forgetting factor of 2'],
      },
      {
        index: 3,
        description: 'Compute range using horizontal motion (R = u cosθ × T)',
        marks: 1,
        keyConcepts: ['R = u cosθ × T', 'horizontal velocity is constant'],
        commonMistakes: ['Using R = u sinθ × T', 'Mixing horizontal and vertical components'],
      },
      {
        index: 4,
        description: 'Simplify to R = u² sin(2θ)/g using trig identity',
        marks: 1,
        keyConcepts: ['2 sinθ cosθ = sin(2θ)', 'R = u² sin(2θ)/g'],
        commonMistakes: ['Not applying the double-angle identity', 'Wrong algebraic simplification'],
      },
      {
        index: 5,
        description: 'Find angle for maximum range (θ = 45°)',
        marks: 1,
        keyConcepts: ['sin(2θ) max = 1 when 2θ = 90°', 'θ = 45°'],
        commonMistakes: ['Saying θ = 90°', 'Confusing 2θ with θ'],
      },
    ],
  },
  {
    problemTitle: 'Mole Concept — Stoichiometric Calculation',
    problemStatement: 'Calculate the mass of NaCl produced when 5.85 g of NaOH reacts with excess HCl. (Molar masses: NaOH = 40, HCl = 36.5, NaCl = 58.5)',
    totalMarks: 4,
    subject: 'Chemistry',
    topic: 'Stoichiometry',
    modelAnswer: 'NaOH + HCl → NaCl + H₂O. Moles of NaOH = 5.85/40 = 0.14625 mol. From stoichiometry, moles of NaCl = moles of NaOH = 0.14625 mol. Mass of NaCl = 0.14625 × 58.5 = 8.56 g.',
    steps: [
      {
        index: 1,
        description: 'Write the balanced chemical equation',
        marks: 1,
        keyConcepts: ['NaOH + HCl → NaCl + H₂O', '1:1 stoichiometry'],
        commonMistakes: ['Unbalanced equation', 'Wrong products'],
      },
      {
        index: 2,
        description: 'Calculate moles of NaOH (n = mass/molar mass)',
        marks: 1,
        keyConcepts: ['n = 5.85 / 40', 'n = 0.14625 mol'],
        commonMistakes: ['Using wrong molar mass', 'Inverting mass/molar mass'],
      },
      {
        index: 3,
        description: 'Apply stoichiometric ratio to find moles of NaCl',
        marks: 1,
        keyConcepts: ['1:1 ratio from balanced equation', 'moles NaCl = moles NaOH = 0.14625'],
        commonMistakes: ['Using wrong mole ratio', 'Forgetting stoichiometry'],
      },
      {
        index: 4,
        description: 'Calculate mass of NaCl (mass = moles × molar mass)',
        marks: 1,
        keyConcepts: ['mass = 0.14625 × 58.5', 'mass = 8.556 g ≈ 8.56 g'],
        commonMistakes: ['Using wrong molar mass for NaCl', 'Calculation error'],
      },
    ],
  },
  {
    problemTitle: 'Quadratic Equation — Roots via Discriminant',
    problemStatement: 'Find the roots of 2x² - 7x + 3 = 0 using the quadratic formula. Show all steps.',
    totalMarks: 4,
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    modelAnswer: 'Compare to ax² + bx + c = 0: a=2, b=-7, c=3. Discriminant Δ = b²-4ac = 49-24 = 25. √Δ = 5. Roots = (7±5)/4 = 3 or 1/2.',
    steps: [
      {
        index: 1,
        description: 'Identify coefficients a, b, c from the equation',
        marks: 1,
        keyConcepts: ['a = 2', 'b = -7 (note the sign)', 'c = 3'],
        commonMistakes: ['Missing sign on b', 'Confusing coefficients'],
      },
      {
        index: 2,
        description: 'Compute discriminant Δ = b² - 4ac',
        marks: 1,
        keyConcepts: ['Δ = (-7)² - 4(2)(3)', 'Δ = 49 - 24 = 25'],
        commonMistakes: ['Forgetting to square -7', 'Wrong arithmetic'],
      },
      {
        index: 3,
        description: 'Compute √Δ and apply quadratic formula',
        marks: 1,
        keyConcepts: ['√25 = 5', 'x = (-b ± √Δ) / 2a = (7 ± 5) / 4'],
        commonMistakes: ['Forgetting ± sign', 'Using 2a in denominator incorrectly'],
      },
      {
        index: 4,
        description: 'State both roots clearly',
        marks: 1,
        keyConcepts: ['x = (7+5)/4 = 3', 'x = (7-5)/4 = 1/2'],
        commonMistakes: ['Only giving one root', 'Arithmetic error in final step'],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Build the grading prompt for the VLM
// ---------------------------------------------------------------------------

export function buildGradingPrompt(rubric: GradingRubric): string {
  const stepsText = rubric.steps.map(s => {
    return `Step ${s.index} (${s.marks} marks): ${s.description}
  - Key concepts expected: ${s.keyConcepts.join(', ')}
  - Common mistakes: ${s.commonMistakes.join(', ')}`;
  }).join('\n\n');

  return `You are grading a student's handwritten solution to a board-exam problem. Analyse the uploaded image and grade each step against the rubric below.

PROBLEM: ${rubric.problemStatement}
SUBJECT: ${rubric.subject} — ${rubric.topic}
TOTAL MARKS: ${rubric.totalMarks}

RUBRIC STEPS:
${stepsText}

${rubric.modelAnswer ? `MODEL ANSWER (for reference):\n${rubric.modelAnswer}\n` : ''}

For each step in the rubric, determine:
- status: "correct" (step is complete and accurate), "partial" (right idea but minor error), "wrong" (step present but incorrect), or "missing" (step not in the student's work)
- awardedMarks: based on status and partial credit (e.g. 0.5 for partial on a 1-mark step)
- studentWork: brief paraphrase of what the student wrote in this step (≤ 20 words). Empty string if missing.
- feedback: 1-sentence specific feedback for this step
- conceptsPresent: array of key concepts the student correctly included
- conceptsMissing: array of key concepts missing or wrong
- mistakesIdentified: array of specific mistakes (from commonMistakes list or new ones you spot)

ALSO determine:
- handwritingConfidence: "high" (clearly legible), "medium" (some parts hard to read), "low" (most illegible)
- illegible: true if you cannot grade most steps due to illegibility

Return STRICT JSON conforming to:
{
  "handwritingConfidence": "high" | "medium" | "low",
  "illegible": boolean,
  "stepGrades": [
    {
      "rubricStepIndex": number,       // matches rubric step index (1-indexed)
      "status": "correct" | "partial" | "wrong" | "missing",
      "awardedMarks": number,
      "studentWork": string,
      "feedback": string,
      "conceptsPresent": string[],
      "conceptsMissing": string[],
      "mistakesIdentified": string[]
    }
  ]
}

Output ONLY the JSON — no prose, no markdown fences.`;
}

// ---------------------------------------------------------------------------
// Validate parsed JSON against the expected schema
// ---------------------------------------------------------------------------

export function isGradingResult(obj: unknown): obj is {
  handwritingConfidence: 'high' | 'medium' | 'low';
  illegible: boolean;
  stepGrades: Array<{
    rubricStepIndex: number;
    status: StepStatus;
    awardedMarks: number;
    studentWork?: string;
    feedback: string;
    conceptsPresent: string[];
    conceptsMissing: string[];
    mistakesIdentified: string[];
  }>;
} {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  if (!['high', 'medium', 'low'].includes(o.handwritingConfidence as string)) return false;
  if (typeof o.illegible !== 'boolean') return false;
  if (!Array.isArray(o.stepGrades)) return false;
  for (const g of o.stepGrades) {
    if (!g || typeof g !== 'object') return false;
    const gg = g as Record<string, unknown>;
    if (typeof gg.rubricStepIndex !== 'number') return false;
    if (!['correct', 'partial', 'wrong', 'missing'].includes(gg.status as string)) return false;
    if (typeof gg.awardedMarks !== 'number') return false;
    if (typeof gg.feedback !== 'string') return false;
    if (!Array.isArray(gg.conceptsPresent)) return false;
    if (!Array.isArray(gg.conceptsMissing)) return false;
    if (!Array.isArray(gg.mistakesIdentified)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Build a StepGrade[] array from raw VLM output, aligned with the rubric
// ---------------------------------------------------------------------------

export function alignStepGrades(
  raw: {
    stepGrades: Array<{
      rubricStepIndex: number;
      status: StepStatus;
      awardedMarks: number;
      studentWork?: string;
      feedback: string;
      conceptsPresent: string[];
      conceptsMissing: string[];
      mistakesIdentified: string[];
    }>;
  },
  rubric: GradingRubric,
): StepGrade[] {
  const result: StepGrade[] = [];
  for (const rubricStep of rubric.steps) {
    const matched = raw.stepGrades.find(g => g.rubricStepIndex === rubricStep.index);
    if (!matched) {
      // Step not graded — mark as missing
      result.push({
        rubricStepIndex: rubricStep.index,
        description: rubricStep.description,
        status: 'missing',
        awardedMarks: 0,
        maxMarks: rubricStep.marks,
        studentWork: '',
        feedback: 'This step was not detected in your solution.',
        conceptsPresent: [],
        conceptsMissing: rubricStep.keyConcepts,
        mistakesIdentified: [],
      });
      continue;
    }
    // Clamp awardedMarks to [0, maxMarks]
    const clampedMarks = Math.max(0, Math.min(rubricStep.marks, matched.awardedMarks));
    result.push({
      rubricStepIndex: rubricStep.index,
      description: rubricStep.description,
      status: matched.status,
      awardedMarks: clampedMarks,
      maxMarks: rubricStep.marks,
      studentWork: matched.studentWork ?? '',
      feedback: matched.feedback,
      conceptsPresent: matched.conceptsPresent,
      conceptsMissing: matched.conceptsMissing,
      mistakesIdentified: matched.mistakesIdentified,
    });
  }
  return result;
}
