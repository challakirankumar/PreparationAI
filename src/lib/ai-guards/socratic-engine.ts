// ============================================================================
// Misconception Taxonomy + Detection Engine
// ----------------------------------------------------------------------------
// Categorises student errors into pedagogically meaningful types so the
// Socratic mentor can tailor its scaffolding. Based on established work:
//   - Hestenes, Wells & Swackhamer (1992) Force Concept Inventory
//   - Berezansky & Berman (2002) error taxonomy
//   - Yates & Marek (2014) misconceptions in biology
//
// Taxonomy: 8 categories of student errors
// ============================================================================

export type MisconceptionType =
  | 'conceptual'           // wrong mental model — e.g. force implies motion (Aristotelian)
  | 'procedural'           // right concept, wrong execution — sign errors, algebra slips
  | 'factual'              // forgot a formula, constant, or definition
  | 'arithmetical'         // computation slip — 7×8=54 instead of 56
  | 'visual-spatial'       // misread diagram, vector direction wrong, geometry inversion
  | 'semantic'             // misunderstood the question — "decreases by" vs "decreases to"
  | 'overgeneralisation'   // applied a rule outside its scope — V=IR for non-ohmic
  | 'strategic'            // picked wrong approach entirely — kinematics for energy problem
  | 'careless'             // no identifiable misconception — just attention lapse
  | 'unclassified';        // engine couldn't categorise confidently

export interface MisconceptionDetection {
  type: MisconceptionType;
  confidence: number;        // 0-1
  diagnosis: string;         // 1-sentence description for the student
  // Why this category was chosen (for the AI mentor to use in its response)
  evidence: string;
  // Suggested Socratic strategy to deploy next
  suggestedStrategy: SocraticStrategy;
  // Common sub-patterns (e.g. "force implies motion" specific misconception)
  subPattern?: string;
}

export type SocraticStrategy =
  | 'probe-understanding'    // ask student to explain their reasoning
  | 'confront-contradiction' // present a counter-example that breaks their model
  | 'scaffold-steps'         // break the problem into smaller steps
  | 'analogical-prompt'      // draw analogy to a familiar concept
  | 'limit-case'             // ask what happens at an extreme (zero, infinity, etc.)
  | 'review-definition'     // prompt to revisit the formal definition
  | 'redraw-diagram'         // ask student to redraw / restate the setup
  | 'verify-calculation'     // ask student to re-check arithmetic
  | 'try-alternative';       // suggest a different solution path

// ---------------------------------------------------------------------------
// Heuristic detector — uses keyword/pattern matching on the student's answer
// + problem context to categorise. Not perfect but produces reasonable signals
// that the LLM can refine via Socratic conversation.
// ---------------------------------------------------------------------------

interface DetectionContext {
  question: string;          // the original question text
  studentAnswer: string;     // the student's answer (or attempt description)
  correctAnswer?: string;    // the correct answer (if known)
  subject?: string;          // subject hint
  topic?: string;            // topic hint
  // Optional: prior misconception history for this student (enables pattern detection)
  priorMisconceptions?: MisconceptionType[];
}

// ---------------------------------------------------------------------------
// Per-category detectors
// ---------------------------------------------------------------------------

function detectConceptual(ctx: DetectionContext): { score: number; evidence: string; subPattern?: string } {
  const ans = ctx.studentAnswer.toLowerCase();
  const q = ctx.question.toLowerCase();
  let score = 0;
  let subPattern: string | undefined;

  // Aristotelian force-motion misconception: "force causes motion" or "constant force needed"
  if (/force.*(cause|need|require).*(motion|moving|speed)/.test(ans) ||
      /need.*force.*to keep.*moving/.test(ans)) {
    score += 0.8;
    subPattern = 'force-implies-motion (Aristotelian)';
  }
  // Heavier objects fall faster
  if (/heavier.*fall.*faster|more mass.*accelerat/.test(ans) ||
      (q.includes('free fall') && /mass|weight/.test(ans))) {
    score += 0.7;
    subPattern = 'mass-affects-fall-rate';
  }
  // Action-reaction cancellation: "action cancels reaction"
  if (/action.*reaction.*cancel|equal.*opposite.*cancel/.test(ans)) {
    score += 0.8;
    subPattern = 'action-reaction-cancellation';
  }
  // Current "used up" in a circuit
  if (/current.*used up|less current.*after.*bulb/.test(ans)) {
    score += 0.7;
    subPattern = 'current-consumed-in-circuit';
  }
  // Evolution = "organisms try to adapt"
  if (/tr(y|ied).*adapt|want.*to evolve|need.*caused.*evolution/.test(ans)) {
    score += 0.7;
    subPattern = 'teleological-evolution';
  }
  // Natural=good fallacy
  if (/natural.*(is|means).*(good|safe|healthy)/.test(ans)) {
    score += 0.6;
    subPattern = 'naturalistic-fallacy';
  }

  return {
    score,
    evidence: subPattern ? `Pattern detected: ${subPattern}` : 'Possible conceptual gap',
    subPattern,
  };
}

function detectProcedural(ctx: DetectionContext): { score: number; evidence: string; subPattern?: string } {
  const ans = ctx.studentAnswer.toLowerCase();
  let score = 0;
  let subPattern: string | undefined;

  // Sign error: "forgot the negative"
  if (/forgot.*negative|sign.*error|negative.*should.*positive|wrong sign/.test(ans)) {
    score += 0.7;
    subPattern = 'sign-error';
  }
  // Unit error
  if (/wrong unit|forgot.*unit|conversion.*wrong/.test(ans)) {
    score += 0.6;
    subPattern = 'unit-conversion';
  }
  // Order of operations
  if (/order.*operation|pemdas|bodmas/.test(ans)) {
    score += 0.5;
    subPattern = 'order-of-operations';
  }
  // Cross-multiplied incorrectly
  if (/cross.*multipl|cross.*mult.*wrong/.test(ans)) {
    score += 0.6;
    subPattern = 'cross-multiplication';
  }
  // Algebra: distributed incorrectly
  if (/distribut|expansion.*wrong|expand.*wrong/.test(ans)) {
    score += 0.6;
    subPattern = 'distribution-error';
  }
  // If correct answer known and student's answer is close but off by a small algebra slip
  if (ctx.correctAnswer) {
    const corr = ctx.correctAnswer.trim();
    const ans_ = ctx.studentAnswer.trim();
    if (corr !== ans_ && Math.abs(parseFloat(corr) - parseFloat(ans_)) < Math.abs(parseFloat(corr)) * 0.1) {
      score += 0.4;
      subPattern = 'small-algebra-slip';
    }
  }

  return {
    score,
    evidence: subPattern ? `Pattern detected: ${subPattern}` : 'Procedural execution slip',
    subPattern,
  };
}

function detectFactual(ctx: DetectionContext): { score: number; evidence: string; subPattern?: string } {
  const ans = ctx.studentAnswer.toLowerCase();
  let score = 0;
  let subPattern: string | undefined;

  if (/forgot.*(formula|equation|definition|value|constant)/.test(ans) ||
      /don.*t.*remember|can.*t.*recall|not sure.*formula/.test(ans)) {
    score += 0.7;
    subPattern = 'forgot-formula-or-definition';
  }
  // Wrong constant value (e.g. g=10 instead of 9.8)
  if (/used.*g\s*=\s*(10|8|9)\b.*instead/.test(ans)) {
    score += 0.6;
    subPattern = 'wrong-constant';
  }
  // Confused two formulas
  if (/confused.*(formula|equation)|mixed up.*(formula|equation)/.test(ans)) {
    score += 0.6;
    subPattern = 'formula-confusion';
  }

  return {
    score,
    evidence: subPattern ? `Pattern detected: ${subPattern}` : 'Possible factual gap',
    subPattern,
  };
}

function detectArithmetical(ctx: DetectionContext): { score: number; evidence: string; subPattern?: string } {
  const ans = ctx.studentAnswer.toLowerCase();
  let score = 0;
  let subPattern: string | undefined;

  if (/calculation.*mistake|arithmetic.*error|added.*wrong|multipl.*wrong|divid.*wrong/.test(ans)) {
    score += 0.7;
    subPattern = 'arithmetic-slip';
  }
  if (/decimal.*point|decimal.*wrong|decimal.*shift/.test(ans)) {
    score += 0.6;
    subPattern = 'decimal-place-error';
  }
  // If correct answer known, check if last-digit arithmetic slip
  if (ctx.correctAnswer) {
    const corr = parseFloat(ctx.correctAnswer);
    const ansN = parseFloat(ctx.studentAnswer);
    if (!isNaN(corr) && !isNaN(ansN) && Math.abs(corr - ansN) < 5 && corr !== ansN) {
      score += 0.5;
      subPattern = 'near-miss-arithmetic';
    }
  }

  return {
    score: Math.min(1, score),
    evidence: subPattern ? `Pattern detected: ${subPattern}` : 'Possible arithmetic error',
    subPattern,
  };
}

function detectVisualSpatial(ctx: DetectionContext): { score: number; evidence: string; subPattern?: string } {
  const ans = ctx.studentAnswer.toLowerCase();
  const q = ctx.question.toLowerCase();
  let score = 0;
  let subPattern: string | undefined;

  if (/vector.*direction.*wrong|direction.*reversed|pointing.*wrong/.test(ans)) {
    score += 0.7;
    subPattern = 'vector-direction-error';
  }
  if (/misread.*diagram|diagram.*wrong|wrong.*axis/.test(ans)) {
    score += 0.6;
    subPattern = 'diagram-misread';
  }
  if (/angle.*wrong|measured.*wrong/.test(ans)) {
    score += 0.6;
    subPattern = 'angle-measurement-error';
  }
  if (/geometry|coordinate|reflection|rotation/.test(q) && /sign|direction|position/.test(ans)) {
    score += 0.4;
    subPattern = 'spatial-confusion';
  }

  return {
    score: Math.min(1, score),
    evidence: subPattern ? `Pattern detected: ${subPattern}` : 'Possible visual/spatial error',
    subPattern,
  };
}

function detectSemantic(ctx: DetectionContext): { score: number; evidence: string; subPattern?: string } {
  const ans = ctx.studentAnswer.toLowerCase();
  const q = ctx.question.toLowerCase();
  let score = 0;
  let subPattern: string | undefined;

  if (/misread.*question|understood.*wrong|interpret.*wrong/.test(ans)) {
    score += 0.7;
    subPattern = 'question-misinterpretation';
  }
  // "decreases by" vs "decreases to"
  if (/decreases by|increases by/.test(q) && /decreases to|increases to|equal to/.test(ans)) {
    score += 0.8;
    subPattern = 'by-vs-to-confusion';
  }
  // "integer" vs "whole number" vs "natural number"
  if (/integer|whole number|natural number/.test(q) && /integer|whole number|natural number/.test(ans)) {
    score += 0.5;
    subPattern = 'number-set-confusion';
  }
  // "not" missed
  if (/didn.*t.*see.*not|missed.*not|forgot.*not/.test(ans)) {
    score += 0.6;
    subPattern = 'negation-missed';
  }

  return {
    score: Math.min(1, score),
    evidence: subPattern ? `Pattern detected: ${subPattern}` : 'Possible semantic misunderstanding',
    subPattern,
  };
}

function detectOvergeneralisation(ctx: DetectionContext): { score: number; evidence: string; subPattern?: string } {
  const ans = ctx.studentAnswer.toLowerCase();
  let score = 0;
  let subPattern: string | undefined;

  if (/ohm.*law.*always|v\s*=\s*i\s*r.*always/.test(ans)) {
    score += 0.7;
    subPattern = 'ohms-law-universal';
  }
  if (/always works|always true|universal/.test(ans)) {
    score += 0.4;
    subPattern = 'universal-rule-assumed';
  }
  if (/kinematic.*equation.*any/.test(ans)) {
    score += 0.5;
    subPattern = 'kinematic-outside-uniform-accel';
  }
  // Energy conservation applied where it shouldn't be
  if (/energy.*conserved.*always/.test(ans)) {
    score += 0.5;
    subPattern = 'energy-conservation-misapplied';
  }

  return {
    score: Math.min(1, score),
    evidence: subPattern ? `Pattern detected: ${subPattern}` : 'Possible overgeneralisation',
    subPattern,
  };
}

function detectStrategic(ctx: DetectionContext): { score: number; evidence: string; subPattern?: string } {
  const ans = ctx.studentAnswer.toLowerCase();
  const q = ctx.question.toLowerCase();
  let score = 0;
  let subPattern: string | undefined;

  if (/used.*wrong.*method|wrong.*approach|wrong.*formula|should.*have.*used/.test(ans)) {
    score += 0.6;
    subPattern = 'wrong-approach';
  }
  // Subject-specific misroutes
  if (q.includes('energy') && /used.*kinematic|kinematic.*instead/.test(ans)) {
    score += 0.7;
    subPattern = 'kinematic-for-energy-problem';
  }
  if (q.includes('momentum') && /used.*energy|energy.*instead/.test(ans)) {
    score += 0.7;
    subPattern = 'energy-for-momentum-problem';
  }
  if (/integration.*when.*should.*differentiat|derivat.*when.*should.*integrat/.test(ans)) {
    score += 0.6;
    subPattern = 'calc-technique-mismatch';
  }

  return {
    score: Math.min(1, score),
    evidence: subPattern ? `Pattern detected: ${subPattern}` : 'Wrong strategy chosen',
    subPattern,
  };
}

// ---------------------------------------------------------------------------
// Strategy selection per misconception type
// ---------------------------------------------------------------------------

const STRATEGY_BY_TYPE: Record<MisconceptionType, SocraticStrategy> = {
  conceptual: 'confront-contradiction',
  procedural: 'scaffold-steps',
  factual: 'review-definition',
  arithmetical: 'verify-calculation',
  'visual-spatial': 'redraw-diagram',
  semantic: 'probe-understanding',
  overgeneralisation: 'limit-case',
  strategic: 'try-alternative',
  careless: 'verify-calculation',
  unclassified: 'probe-understanding',
};

const DIAGNOSIS_TEMPLATE: Record<MisconceptionType, string> = {
  conceptual: 'You may have a conceptual gap — your mental model seems to predict something the physics doesn\'t.',
  procedural: 'Your concept is right, but the execution has a procedural slip (sign, unit, or algebra).',
  factual: 'You seem to be missing a key formula, definition, or constant.',
  arithmetical: 'This looks like an arithmetic slip — the approach was sound.',
  'visual-spatial': 'There may be a visual-spatial misread — the diagram or direction might be off.',
  semantic: 'You may have misinterpreted the question wording.',
  overgeneralisation: 'You\'re applying a valid rule outside its scope.',
  strategic: 'You chose the wrong solution strategy for this problem type.',
  careless: 'No clear misconception — this looks like an attention lapse.',
  unclassified: 'Let me ask a clarifying question first.',
};

// ---------------------------------------------------------------------------
// Main detect function — runs all detectors, picks the highest-scoring one
// ---------------------------------------------------------------------------

export function detectMisconception(ctx: DetectionContext): MisconceptionDetection {
  const detectors = [
    { type: 'conceptual' as const, result: detectConceptual(ctx) },
    { type: 'procedural' as const, result: detectProcedural(ctx) },
    { type: 'factual' as const, result: detectFactual(ctx) },
    { type: 'arithmetical' as const, result: detectArithmetical(ctx) },
    { type: 'visual-spatial' as const, result: detectVisualSpatial(ctx) },
    { type: 'semantic' as const, result: detectSemantic(ctx) },
    { type: 'overgeneralisation' as const, result: detectOvergeneralisation(ctx) },
    { type: 'strategic' as const, result: detectStrategic(ctx) },
  ];

  // Pick the highest-scoring detector (max score wins, ties broken by priority order)
  const sorted = [...detectors].sort((a, b) => b.result.score - a.result.score);
  const top = sorted[0];

  // If no detector fired above 0.3 confidence, mark as careless/unclassified
  if (!top || top.result.score < 0.3) {
    return {
      type: 'unclassified',
      confidence: 0,
      diagnosis: DIAGNOSIS_TEMPLATE.unclassified,
      evidence: 'No specific misconception pattern detected yet — probe to learn more.',
      suggestedStrategy: 'probe-understanding',
    };
  }

  return {
    type: top.type,
    confidence: top.result.score,
    diagnosis: DIAGNOSIS_TEMPLATE[top.type],
    evidence: top.result.evidence,
    subPattern: top.result.subPattern,
    suggestedStrategy: STRATEGY_BY_TYPE[top.type],
  };
}

// ---------------------------------------------------------------------------
// Strategy descriptions — used in the prompt to the LLM
// ---------------------------------------------------------------------------

export const STRATEGY_DESCRIPTIONS: Record<SocraticStrategy, string> = {
  'probe-understanding': 'Ask the student to explain their reasoning step-by-step before giving any hint.',
  'confront-contradiction': 'Present a counter-example or limit case that contradicts the student\'s model. Let them notice the contradiction themselves.',
  'scaffold-steps': 'Break the problem into 2-3 smaller steps. Ask them to solve step 1 first, then check in.',
  'analogical-prompt': 'Draw an analogy to a familiar real-world scenario the student already understands.',
  'limit-case': 'Ask what happens at an extreme (zero, infinity, very large) — this exposes the rule\'s scope.',
  'review-definition': 'Prompt the student to revisit the formal definition of the key concept.',
  'redraw-diagram': 'Ask the student to redraw the setup, label all forces/vectors/quantities, and re-examine.',
  'verify-calculation': 'Ask the student to re-check their arithmetic one step at a time without changing the method.',
  'try-alternative': 'Suggest the student try a different solution path (e.g. energy instead of kinematics) and see if they get a consistent answer.',
};

// ---------------------------------------------------------------------------
// Socratic dialogue state machine — tracks where in the conversation we are
// ---------------------------------------------------------------------------

export type SocraticPhase =
  | 'initial'           // first exchange — gather context
  | 'probing'           // asking diagnostic questions
  | 'diagnosing'        // just identified the misconception
  | 'scaffolding'       // providing hints, one at a time
  | 'confirming'        // student solved it — verify understanding
  | 'closed';           // session complete

export interface SocraticState {
  phase: SocraticPhase;
  hintCount: number;          // how many hints have been given (max 3 before direct answer)
  lastMisconception?: MisconceptionDetection;
  misconceptionHistory: MisconceptionType[];  // all detected so far in this session
  // Whether the student has explicitly asked for the direct answer (override)
  directAnswerRequested: boolean;
  // Whether the student has attempted at least once since the last hint
  attemptsSinceLastHint: number;
}

export const INITIAL_SOCRATIC_STATE: SocraticState = {
  phase: 'initial',
  hintCount: 0,
  misconceptionHistory: [],
  directAnswerRequested: false,
  attemptsSinceLastHint: 0,
};

// ---------------------------------------------------------------------------
// State transition rules
// ---------------------------------------------------------------------------

export interface SocraticTransition {
  newState: SocraticState;
  // What the LLM should do next
  instruction: string;
  // Whether to reveal the final answer now (only in extreme cases)
  allowDirectAnswer: boolean;
}

export function transitionSocratic(
  current: SocraticState,
  event:
    | { type: 'student_attempted'; misconception: MisconceptionDetection }
    | { type: 'student_correct' }
    | { type: 'student_asks_for_answer' }
    | { type: 'hint_given' }
    | { type: 'session_reset' }
): SocraticTransition {
  // Reset takes precedence
  if (event.type === 'session_reset') {
    return {
      newState: { ...INITIAL_SOCRATIC_STATE },
      instruction: 'Start a fresh Socratic dialogue.',
      allowDirectAnswer: false,
    };
  }

  // Student asks for the direct answer — log it but still try to scaffold one more time
  if (event.type === 'student_asks_for_answer') {
    const newState: SocraticState = {
      ...current,
      directAnswerRequested: true,
      hintCount: current.hintCount + 1,
    };
    // If we've already given 3 hints OR student has asked twice, allow direct answer
    if (current.hintCount >= 3) {
      return {
        newState: { ...newState, phase: 'closed' },
        instruction: 'The student has explicitly asked for the answer after 3+ hints. Reveal the final answer with a clear worked-out explanation, but frame it as "here\'s how I would solve it" rather than just the answer.',
        allowDirectAnswer: true,
      };
    }
    return {
      newState,
      instruction: 'The student asked for the direct answer. Acknowledge the request, then provide ONE more scaffolded hint that makes the next step obvious. Tell them: "Try this hint — if you\'re still stuck after one more attempt, I\'ll walk you through the full solution."',
      allowDirectAnswer: false,
    };
  }

  // Student got it right — close the loop
  if (event.type === 'student_correct') {
    const newState: SocraticState = {
      ...current,
      phase: 'confirming',
      attemptsSinceLastHint: 0,
    };
    return {
      newState,
      instruction: 'The student reached the correct answer (or correct reasoning). Don\'t just say "correct" — ask them to articulate WHY their approach worked, and confirm they understand the underlying concept. Then offer to move to a related problem to verify transfer.',
      allowDirectAnswer: false,
    };
  }

  // Student attempted but still wrong
  if (event.type === 'student_attempted') {
    const newHistory = [...current.misconceptionHistory];
    if (!newHistory.includes(event.misconception.type)) {
      newHistory.push(event.misconception.type);
    }
    const newState: SocraticState = {
      ...current,
      phase: current.phase === 'initial' ? 'probing' : 'scaffolding',
      lastMisconception: event.misconception,
      misconceptionHistory: newHistory,
      attemptsSinceLastHint: current.attemptsSinceLastHint + 1,
    };
    // If we've given 3 hints and student still can't get it, transition to closed + allow direct
    if (current.hintCount >= 3 && current.attemptsSinceLastHint >= 1) {
      return {
        newState: { ...newState, phase: 'closed' },
        instruction: 'The student has received 3 hints and still can\'t solve it. Time to reveal the full worked solution. Walk through each step, explicitly connect each step back to the misconception that was blocking them.',
        allowDirectAnswer: true,
      };
    }
    return {
      newState,
      instruction: `The student attempted again but still has a ${event.misconception.type} misconception. Use the "${event.misconception.suggestedStrategy}" strategy: ${STRATEGY_DESCRIPTIONS[event.misconception.suggestedStrategy]} Provide only ONE hint (not multiple), then wait for their next attempt.`,
      allowDirectAnswer: false,
    };
  }

  // Hint given
  if (event.type === 'hint_given') {
    const newState: SocraticState = {
      ...current,
      phase: 'scaffolding',
      hintCount: current.hintCount + 1,
      attemptsSinceLastHint: 0,
    };
    return {
      newState,
      instruction: 'You just gave a hint. Wait for the student\'s next attempt before giving more. Do not pile on hints.',
      allowDirectAnswer: false,
    };
  }

  // Fallback
  return {
    newState: current,
    instruction: 'Continue the Socratic dialogue.',
    allowDirectAnswer: false,
  };
}
