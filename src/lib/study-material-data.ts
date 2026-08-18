// Study Material data for Preparation AI
// Covers 10 exams: jee-main, neet, sat, gre, gmat, gate, cat, upsc, ielts, toefl
// All links are Google search URLs (safe fallback) so they never 404.

// Helper: returns a Google search URL as a safe, never-404 link
function searchLink(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export interface SyllabusTopic {
  topic: string;
  weight: number; // 0-1, fraction of subject weightage
  subtopics: string[];
}

export interface SyllabusSubject {
  subject: string;
  weight: number; // 0-1, fraction of overall paper
  topics: SyllabusTopic[];
}

export interface StudyBook {
  title: string;
  author: string;
  edition?: string;
  subject?: string;
  link: string;
}

export interface VideoCourse {
  channel: string;
  title: string;
  focus: string;
  link: string;
}

export interface OnlineCourse {
  platform: string;
  course: string;
  price?: string;
  link: string;
}

export interface PracticeResource {
  name: string;
  provider: string;
  type: string;
  link: string;
}

export interface MobileApp {
  name: string;
  developer: string;
  rating?: string;
  link: string;
}

export interface ImportantDate {
  event: string;
  date: string;
}

export interface StudyMaterial {
  examId: string;
  examName: string;
  examOverview: string;
  examPattern: string;
  totalMarks: number;
  difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Very Hard';
  negativeMarking: string;
  syllabus: SyllabusSubject[];
  books: StudyBook[];
  videoCourses: VideoCourse[];
  onlineCourses: OnlineCourse[];
  practiceResources: PracticeResource[];
  mobileApps: MobileApp[];
  studyTips: string[];
  examDayStrategy: string[];
  importantDates: ImportantDate[];
}

// ============================================================
// JEE MAIN
// ============================================================
const jeeMain: StudyMaterial = {
  examId: 'jee-main',
  examName: 'JEE Main',
  examOverview:
    'JEE Main is the national-level engineering entrance conducted by NTA for admission to NITs, IIITs, CFTIs and as a qualifier for JEE Advanced. Held twice a year (January and April sessions), the better of the two scores is used for ranking. Top 2.5 lakh candidates become eligible for JEE Advanced.',
  examPattern:
    'Computer-based test (CBT), 3 hours, 75 questions (25 each in Physics, Chemistry, Mathematics). Each question carries 4 marks; -1 for incorrect MCQ; numerical-value questions have no negative marking. B.Tech (Paper 1) is conducted in 13 languages.',
  totalMarks: 300,
  difficulty: 'Hard',
  negativeMarking: '−1 per wrong MCQ; numerical-value questions: no negative marking',
  syllabus: [
    {
      subject: 'Physics',
      weight: 0.333,
      topics: [
        { topic: 'Mechanics', weight: 0.30, subtopics: ['Kinematics', 'Laws of Motion', 'Work Energy Power', 'Rotational Motion', 'Gravitation'] },
        { topic: 'Thermodynamics & KTG', weight: 0.12, subtopics: ['First Law', 'Second Law', 'Carnot Engine', 'Kinetic Theory of Gases'] },
        { topic: 'Electrodynamics', weight: 0.28, subtopics: ['Electrostatics', 'Current Electricity', 'Magnetism', 'EM Induction', 'AC'] },
        { topic: 'Optics & Waves', weight: 0.15, subtopics: ['Ray Optics', 'Wave Optics', 'SHM', 'Sound Waves'] },
        { topic: 'Modern Physics', weight: 0.15, subtopics: ['Dual Nature', 'Atoms', 'Nuclei', 'Semiconductors'] },
      ],
    },
    {
      subject: 'Chemistry',
      weight: 0.333,
      topics: [
        { topic: 'Physical Chemistry', weight: 0.35, subtopics: ['Mole Concept', 'Atomic Structure', 'Thermodynamics', 'Equilibrium', 'Electrochemistry', 'Kinetics'] },
        { topic: 'Inorganic Chemistry', weight: 0.30, subtopics: ['Periodic Table', 'Chemical Bonding', 'p-Block', 'd & f Block', 'Coordination Compounds'] },
        { topic: 'Organic Chemistry', weight: 0.35, subtopics: ['GOC', 'Hydrocarbons', 'Haloalkanes', 'Alcohols Phenols Ethers', 'Biomolecules', 'Amines'] },
      ],
    },
    {
      subject: 'Mathematics',
      weight: 0.334,
      topics: [
        { topic: 'Algebra', weight: 0.25, subtopics: ['Quadratic', 'Sequences Series', 'Complex Numbers', 'Permutations Combinations', 'Binomial', 'Matrices Determinants'] },
        { topic: 'Calculus', weight: 0.30, subtopics: ['Limits', 'Continuity Differentiability', 'Differentiation', 'Application of Derivatives', 'Integration', 'Differential Equations'] },
        { topic: 'Coordinate Geometry', weight: 0.18, subtopics: ['Straight Lines', 'Circles', 'Parabola', 'Ellipse', 'Hyperbola'] },
        { topic: 'Trigonometry', weight: 0.10, subtopics: ['Trigonometric Ratios', 'Inverse Trig', 'Heights Distances'] },
        { topic: 'Vectors & 3D', weight: 0.10, subtopics: ['Vector Algebra', 'Dot Cross Products', '3D Geometry', 'Lines Planes'] },
        { topic: 'Probability', weight: 0.07, subtopics: ['Bayes Theorem', 'Random Variables', 'Distributions'] },
      ],
    },
  ],
  books: [
    { title: 'Concepts of Physics (Vol 1 & 2)', author: 'H. C. Verma', edition: 'Reprint 2022', subject: 'Physics', link: searchLink('Concepts of Physics H C Verma') },
    { title: 'Understanding Physics Series (5 Books)', author: 'D. C. Pandey (Arihant)', edition: '2023-24', subject: 'Physics', link: searchLink('DC Pandey Understanding Physics Arihant JEE') },
    { title: 'Problems in General Physics', author: 'I. E. Irodov', edition: 'Classic', subject: 'Physics', link: searchLink('Irodov Problems in General Physics') },
    { title: 'Organic Chemistry', author: 'Morrison & Boyd', edition: '7th', subject: 'Chemistry', link: searchLink('Morrison Boyd Organic Chemistry') },
    { title: 'Concise Inorganic Chemistry', author: 'J. D. Lee', edition: '5th', subject: 'Chemistry', link: searchLink('JD Lee Concise Inorganic Chemistry') },
    { title: 'Physical Chemistry', author: 'P. Bahadur', edition: 'Revised', subject: 'Chemistry', link: searchLink('P Bahadur Physical Chemistry Numerical') },
    { title: 'Objective Mathematics (Vol 1 & 2)', author: 'R. D. Sharma', edition: '2024', subject: 'Mathematics', link: searchLink('RD Sharma Objective Mathematics JEE') },
    { title: 'Skills in Mathematics Series', author: 'Arihant (Amit Agarwal et al.)', edition: '2024', subject: 'Mathematics', link: searchLink('Arihant Skills in Mathematics series JEE') },
  ],
  videoCourses: [
    { channel: 'Physics Wallah - Alakh Pandey', title: 'JEE Wallah — Complete Physics + Chemistry + Math', focus: 'Full free batch aligned with JEE Main syllabus', link: searchLink('Physics Wallah Alakh Pandey JEE YouTube channel') },
    { channel: 'Unacademy JEE', title: 'JEE Live — Daily Free Classes + PYQ marathons', focus: 'Live lectures by India\'s top educators', link: searchLink('Unacademy JEE YouTube channel') },
    { channel: 'Vedantu JEE', title: 'Vedantu Math & Physics Crash Courses', focus: 'Crash courses + formula revision', link: searchLink('Vedantu JEE YouTube channel') },
    { channel: 'ATP STAR by Vipin Sharma', title: 'JEE Advanced & Main Physics', focus: 'Conceptual Physics deep-dives', link: searchLink('ATP STAR Vipin Sharma JEE Physics') },
    { channel: 'Mathongo JEE', title: 'Mathongo — JEE Math by Nishant Vora', focus: 'Smart shortcuts + Mathematics PYQs', link: searchLink('Mathongo JEE Mathematics YouTube') },
  ],
  onlineCourses: [
    { platform: 'Unacademy', course: 'Iconic / Plus — JEE Crash Course + Test Series', price: '₹3,000-₹25,000', link: searchLink('Unacademy JEE Plus subscription') },
    { platform: 'Physics Wallah', course: 'Lakshya / Yakeen JEE 2025 Batch', price: '₹2,000-₹5,000', link: searchLink('Physics Wallah Lakshya JEE batch') },
    { platform: 'Vedantu', course: 'JEE Crash Course + Pro Subscription', price: '₹2,500-₹15,000', link: searchLink('Vedantu JEE subscription') },
    { platform: 'Byjus', course: 'BYJU\'S JEE The Learning App package', price: '₹5,000-₹30,000', link: searchLink('Byjus JEE learning app') },
    { platform: 'Allen Digital', course: 'ALLEN Digital + Test Series (Pre-Senior)', price: '₹3,500-₹18,000', link: searchLink('Allen Digital JEE course') },
  ],
  practiceResources: [
    { name: 'Allen Career Institute — Major Tests', provider: 'Allen', type: 'Test Series + DPP', link: searchLink('Allen JEE Main test series DLP') },
    { name: 'Resonance — DLP & Test Series', provider: 'Resonance', type: 'Distance Learning + Tests', link: searchLink('Resonance DLP JEE Main') },
    { name: 'FIITJEE — AITS + Big Bang Edge', provider: 'FIITJEE', type: 'All India Test Series', link: searchLink('FIITJEE AITS JEE Main') },
    { name: 'Aakash iTutor — JEE Practice Pack', provider: 'Aakash', type: 'Video Lectures + Question Bank', link: searchLink('Aakash iTutor JEE practice') },
    { name: 'NTA Abhyas App + Mock Tests', provider: 'National Testing Agency', type: 'Official mock tests on nta.ac.in', link: searchLink('NTA Abhyas app JEE mock test') },
  ],
  mobileApps: [
    { name: 'Physics Wallah', developer: 'PW (Alakh Pandey)', rating: '4.6/5', link: searchLink('Physics Wallah app play store') },
    { name: 'Unacademy Learner\'s App', developer: 'Unacademy', rating: '4.5/5', link: searchLink('Unacademy app play store JEE') },
    { name: 'Vedantu: Live Learning', developer: 'Vedantu', rating: '4.4/5', link: searchLink('Vedantu app play store JEE') },
    { name: 'NTA Abhyas', developer: 'National Testing Agency', rating: '4.3/5', link: searchLink('NTA Abhyas app play store') },
    { name: 'Mathongo JEE', developer: 'Mathongo Educare', rating: '4.6/5', link: searchLink('Mathongo app play store') },
  ],
  studyTips: [
    'Build a master formula sheet per subject; revise it daily for 15 minutes before sleeping to leverage spaced repetition.',
    'Solve at least 30 previous-year JEE Main questions every day — the NTA question pattern repeats heavily across sessions.',
    'Use the Feynman technique: explain tough concepts (Rotational Motion, Coordination Compounds, Calculus) aloud to a study buddy.',
    'Maintain a "mistake notebook" — log every wrong answer from mocks with the reason and revisit it every Sunday.',
    'Aim for 8-10 hours of focused study with the 50/10 Pomodoro cycle; take a real 5-minute walk between cycles to reset focus.',
    'Allocate 40% time to concept building, 30% to problem-solving and 30% to revision + mock analysis in the last 90 days.',
    'Don\'t skip NCERT for Chemistry Inorganic — direct line-by-line questions are picked from Class 11/12 NCERT.',
  ],
  examDayStrategy: [
    'Reach the centre 60 minutes early; carry printed admit card, photo ID, passport-size photo, and a transparent water bottle.',
    'Attempt Chemistry first (most scoring + factual), then Physics, then Mathematics — this manages time pressure and momentum.',
    'Use the "3-pass" rule: Round 1 attempt only questions you are 100% sure of; Round 2 pick moderate-confidence ones; Round 3 try numerical-value questions (no negative marking).',
    'Avoid blind guessing — with -1 penalty, random guesses hurt your percentile more than they help.',
    'Save 10 minutes at the end to review marked questions and recheck numerical answers for unit errors.',
  ],
  importantDates: [
    { event: 'JEE Main Session 1 (January)', date: 'Late January (registration opens November)' },
    { event: 'JEE Main Session 2 (April)', date: 'Early April (registration opens February)' },
    { event: 'JEE Advanced Registration', date: 'Late April – Early May' },
    { event: 'JEE Advanced Exam', date: 'Late May (3rd Sunday)' },
  ],
};

// ============================================================
// NEET
// ============================================================
const neet: StudyMaterial = {
  examId: 'neet',
  examName: 'NEET (UG)',
  examOverview:
    'NEET-UG is the single national entrance for MBBS, BDS, AYUSH and BVSc seats across India, conducted by NTA. Single-session, pen-and-paper OMR-based, in 13 languages. Biology (Botany + Zoology) carries 50% weightage, making NCERT Biology the highest-ROI subject.',
  examPattern:
    '180 questions in 200 minutes. Physics 45, Chemistry 45, Biology 90 (Botany 45 + Zoology 45). Each question +4, −1 for wrong. Maximum 720 marks. Class 11 & 12 NCERT forms ~85% of Biology and ~70% of Chemistry.',
  totalMarks: 720,
  difficulty: 'Hard',
  negativeMarking: '−1 per wrong answer; unattempted = 0',
  syllabus: [
    {
      subject: 'Physics',
      weight: 0.25,
      topics: [
        { topic: 'Mechanics', weight: 0.30, subtopics: ['Kinematics', 'Laws of Motion', 'Work Energy Power', 'Rotational Motion', 'Gravitation'] },
        { topic: 'Electrodynamics', weight: 0.28, subtopics: ['Electrostatics', 'Current Electricity', 'Magnetism', 'EM Induction', 'AC'] },
        { topic: 'Thermodynamics & Optics', weight: 0.22, subtopics: ['Thermodynamics Laws', 'Ray Optics', 'Wave Optics'] },
        { topic: 'Modern Physics', weight: 0.20, subtopics: ['Dual Nature', 'Atoms', 'Nuclei', 'Semiconductors'] },
      ],
    },
    {
      subject: 'Chemistry',
      weight: 0.25,
      topics: [
        { topic: 'Physical Chemistry', weight: 0.35, subtopics: ['Mole Concept', 'Thermodynamics', 'Equilibrium', 'Electrochemistry', 'Kinetics'] },
        { topic: 'Organic Chemistry', weight: 0.35, subtopics: ['GOC', 'Hydrocarbons', 'Biomolecules', 'Amines', 'Polymers'] },
        { topic: 'Inorganic Chemistry', weight: 0.30, subtopics: ['Periodic Table', 'Chemical Bonding', 'p-Block', 'Coordination Compounds'] },
      ],
    },
    {
      subject: 'Botany',
      weight: 0.25,
      topics: [
        { topic: 'Cell Biology', weight: 0.20, subtopics: ['Cell Structure', 'Cell Cycle', 'Biomolecules'] },
        { topic: 'Plant Physiology', weight: 0.25, subtopics: ['Photosynthesis', 'Respiration', 'Plant Growth', 'Mineral Nutrition'] },
        { topic: 'Genetics & Reproduction', weight: 0.25, subtopics: ['Mendel\'s Laws', 'Molecular Basis', 'Plant Reproduction'] },
        { topic: 'Ecology & Diversity', weight: 0.30, subtopics: ['Plant Kingdom', 'Morphology', 'Anatomy', 'Ecology'] },
      ],
    },
    {
      subject: 'Zoology',
      weight: 0.25,
      topics: [
        { topic: 'Human Physiology', weight: 0.35, subtopics: ['Digestion', 'Breathing', 'Body Fluids', 'Excretion', 'Neural Control', 'Chemical Coordination'] },
        { topic: 'Animal Kingdom', weight: 0.15, subtopics: ['Phylum Classification', 'Animal Tissues'] },
        { topic: 'Reproduction & Genetics', weight: 0.25, subtopics: ['Human Reproduction', 'Reproductive Health', 'Principles of Inheritance'] },
        { topic: 'Biotechnology & Health', weight: 0.25, subtopics: ['Biotech Principles', 'Human Health Disease', 'Strategies for Enhancement'] },
      ],
    },
  ],
  books: [
    { title: 'NCERT Biology (Class 11 & 12)', author: 'NCERT', edition: 'Latest', subject: 'Biology', link: searchLink('NCERT Biology Class 11 12 NEET') },
    { title: 'Trueman\'s Elementary Biology (Vol 1 & 2)', author: 'K. N. Bhatia & M. P. Tyagi', edition: 'Latest', subject: 'Biology', link: searchLink('Trueman Elementary Biology NEET') },
    { title: 'Objective Biology (NSP)', author: 'Disha Experts', edition: '2024', subject: 'Biology', link: searchLink('Disha Objective Biology NEET') },
    { title: 'Concepts of Physics (Vol 1 & 2)', author: 'H. C. Verma', edition: 'Reprint 2022', subject: 'Physics', link: searchLink('HC Verma Concepts of Physics NEET') },
    { title: 'NEET Physics — D. C. Pandey', author: 'D. C. Pandey (Arihant)', edition: '2024', subject: 'Physics', link: searchLink('DC Pandey NEET Physics Arihant') },
    { title: 'Physical Chemistry for NEET', author: 'O. P. Tandon (GRB)', edition: 'Latest', subject: 'Chemistry', link: searchLink('OP Tandon Physical Chemistry NEET') },
    { title: 'Organic Chemistry for NEET', author: 'Morrison & Boyd / O. P. Tandon', edition: 'Latest', subject: 'Chemistry', link: searchLink('Organic Chemistry Morrison Boyd NEET') },
    { title: 'MTG NEET Champion — Biology', author: 'MTG Editorial Board', edition: '2024', subject: 'Biology', link: searchLink('MTG NEET Champion Biology PYQ') },
  ],
  videoCourses: [
    { channel: 'Physics Wallah — NEET Wallah', title: 'Yakeen NEET Batch (Biology + Physics + Chem)', focus: 'Complete free Biology batch aligned with NCERT', link: searchLink('Physics Wallah NEET Wallah YouTube') },
    { channel: 'Unacademy NEET', title: 'NEET 2025 Free Live Classes', focus: 'Live classes for Bio, Physics, Chemistry', link: searchLink('Unacademy NEET YouTube channel') },
    { channel: 'Vedantu Biotonic NEET', title: 'NEET Biology Crash Course', focus: 'Quick revision of NCERT Biology line-by-line', link: searchLink('Vedantu Biotonic NEET YouTube') },
    { channel: 'Khan Academy Biology', title: 'High School Biology playlist', focus: 'Conceptual clarity for Genetics & Physiology', link: searchLink('Khan Academy Biology YouTube playlist') },
    { channel: 'Vipin Sharma Biology (ATP STAR)', title: 'NEET Biology deep dives', focus: 'Molecular biology + Genetics in depth', link: searchLink('Vipin Sharma ATP STAR NEET Biology') },
  ],
  onlineCourses: [
    { platform: 'Physics Wallah', course: 'Yakeen NEET 2025 — Lakshya Batch', price: '₹2,500-₹5,000', link: searchLink('Physics Wallah Yakeen NEET batch') },
    { platform: 'Unacademy', course: 'NEET Plus / Iconic Subscription', price: '₹3,000-₹20,000', link: searchLink('Unacademy NEET Plus subscription') },
    { platform: 'Aakash Digital', course: 'iACST + iTutor NEET Course', price: '₹5,000-₹40,000', link: searchLink('Aakash Digital NEET course') },
    { platform: 'Allen Digital', course: 'ALLEN Digital NEET (Pre-Nurture)', price: '₹3,500-₹25,000', link: searchLink('Allen Digital NEET course') },
    { platform: 'Byjus', course: 'BYJU\'S NEET The Learning App', price: '₹5,000-₹30,000', link: searchLink('Byjus NEET learning app') },
  ],
  practiceResources: [
    { name: 'Allen NEET — DLP & Test Series', provider: 'Allen', type: 'Distance Learning + Tests', link: searchLink('Allen NEET DLP test series') },
    { name: 'Aakash AIATS — All India Test Series', provider: 'Aakash', type: 'All India Mock Tests', link: searchLink('Aakash AIATS NEET test series') },
    { name: 'MTG NEET Previous Year Papers', provider: 'MTG', type: 'PYQ Book + Practice', link: searchLink('MTG NEET previous year question bank') },
    { name: 'NTA NEET Mock Tests', provider: 'National Testing Agency', type: 'Official nta.ac.in mocks', link: searchLink('NTA NEET official mock tests') },
    { name: 'Disha 41 Years NEET Solved Papers', provider: 'Disha Publication', type: 'PYQ + Topic-wise', link: searchLink('Disha 41 years NEET solved papers') },
  ],
  mobileApps: [
    { name: 'Physics Wallah (NEET Wallah)', developer: 'PW', rating: '4.6/5', link: searchLink('Physics Wallah app NEET') },
    { name: 'Darwin — NEET 2025 Preparation', developer: 'MCQdb', rating: '4.7/5', link: searchLink('Darwin NEET app play store') },
    { name: 'NEET 2025 Prep App — NEETprep', developer: 'NEETprep', rating: '4.5/5', link: searchLink('NEETprep app play store') },
    { name: 'Aakash iTutor', developer: 'Aakash Edutech', rating: '4.4/5', link: searchLink('Aakash iTutor app play store') },
    { name: 'Unacademy Learner\'s App', developer: 'Unacademy', rating: '4.5/5', link: searchLink('Unacademy app NEET play store') },
  ],
  studyTips: [
    'Read NCERT Biology line-by-line including examples, scientist names and diagrams — at least 80% Biology questions are directly from NCERT.',
    'Make labelled diagrams of Human Heart, Nephron, Brain, Eye, Ear, Reproductive system — at least one diagram-based question appears every year.',
    'For Physics, focus on numerical-heavy chapters (Mechanics, Electrodynamics, Modern Physics) which contribute 60% of Physics marks.',
    'Maintain a "Biomolecules & Genetics facts" sheet — mnemonics for amino acids, codons, vitamins and hormones save precious time.',
    'Take at least 25 full-length mocks (180 questions in 200 minutes) before the actual exam — stamina is the #1 differentiator in NEET.',
    'Use the 90-45-45 rule: 90 minutes Biology (high accuracy), 45 minutes Chemistry, 45 minutes Physics (numerical heavy).',
    'Revise NCERT summary tables, biological classifications and examples every weekend — they\'re easy marks if memorised.',
  ],
  examDayStrategy: [
    'Attempt Biology first (90 questions in 75 min), then Chemistry (45 in 45 min), then Physics (45 in 40 min) — keep 10 min buffer for review.',
    'Mark OMR immediately after each subject — do NOT wait until the end (NEET has had OMR-filling disasters in past years).',
    'Skip lengthy Physics numericals initially; circle back in the last 15 minutes. Answer Biology factual questions first for confidence.',
    'Never leave a Biology question unattempted if you can rule out 2 options — even 50-50 guesses have positive expected value at NEET scale.',
    'Carry only permitted items: transparent water bottle, admit card, passport photo, postcard-size photo, photo ID. No watch, no jewellery.',
  ],
  importantDates: [
    { event: 'NEET-UG Notification', date: 'Mid-February' },
    { event: 'NEET-UG Exam', date: 'First Sunday of May' },
    { event: 'NEET-UG Result', date: 'Mid-June' },
    { event: 'Counselling (MCC) Starts', date: 'Mid-July' },
  ],
};

// ============================================================
// SAT
// ============================================================
const sat: StudyMaterial = {
  examId: 'sat',
  examName: 'SAT',
  examOverview:
    'The SAT is a globally recognised US college admissions test administered by the College Board. Since 2024, the SAT is fully digital (Digital SAT) — adaptive, shorter (2 hr 14 min), and section-adaptive. Score range 400-1600. Most US universities (including all Ivies since 2025) require or strongly recommend SAT scores.',
  examPattern:
    'Digital adaptive test: Reading & Writing (54 questions, 64 min) and Math (44 questions, 70 min). Each section has two modules; performance on module 1 determines difficulty of module 2. Total 2 hr 14 min. Calculator allowed for entire Math section. Score range 400-1600 (each section 200-800).',
  totalMarks: 1600,
  difficulty: 'Moderate',
  negativeMarking: 'No negative marking — attempt every question',
  syllabus: [
    {
      subject: 'Reading & Writing',
      weight: 0.5,
      topics: [
        { topic: 'Reading Comprehension', weight: 0.40, subtopics: ['Main Idea', 'Inference', 'Detail Evidence', 'Author Purpose'] },
        { topic: 'Vocabulary in Context', weight: 0.15, subtopics: ['Word Meaning', 'Tone', 'Connotation'] },
        { topic: 'Grammar & Punctuation', weight: 0.25, subtopics: ['Subject-Verb Agreement', 'Pronouns', 'Commas', 'Apostrophes', 'Semicolons'] },
        { topic: 'Expression of Ideas', weight: 0.20, subtopics: ['Transitions', 'Sentence Order', 'Rhetorical Purpose'] },
      ],
    },
    {
      subject: 'Math',
      weight: 0.5,
      topics: [
        { topic: 'Algebra', weight: 0.35, subtopics: ['Linear Equations', 'Systems of Equations', 'Inequalities', 'Functions'] },
        { topic: 'Advanced Math', weight: 0.30, subtopics: ['Quadratics', 'Polynomials', 'Exponentials', 'Rational Expressions'] },
        { topic: 'Problem Solving & Data', weight: 0.20, subtopics: ['Ratios Proportions', 'Percentages', 'Data Interpretation', 'Probability'] },
        { topic: 'Geometry & Trigonometry', weight: 0.15, subtopics: ['Lines Angles', 'Triangles', 'Circles', 'Trig Ratios'] },
      ],
    },
  ],
  books: [
    { title: 'The Official SAT Study Guide', author: 'College Board', edition: '2024 Edition (Digital)', subject: 'All', link: searchLink('College Board Official SAT Study Guide digital') },
    { title: 'SAT Prep Plus 2025', author: 'Kaplan Test Prep', edition: '2025', subject: 'All', link: searchLink('Kaplan SAT Prep Plus 2025') },
    { title: 'Princeton Review SAT Premium Prep', author: 'Princeton Review', edition: '2025', subject: 'All', link: searchLink('Princeton Review SAT Premium Prep 2025') },
    { title: 'Barron\'s SAT Study Guide Premium', author: 'Sharon Weiner Green et al.', edition: '2025', subject: 'All', link: searchLink('Barrons SAT Study Guide Premium 2025') },
    { title: 'The Critical Reader: Complete SAT Reading', author: 'Erica L. Meltzer', edition: '5th', subject: 'Reading', link: searchLink('Erica Meltzer SAT Reading Critical Reader') },
    { title: 'The Ultimate Guide to SAT Grammar', author: 'Erica L. Meltzer', edition: '6th', subject: 'Writing', link: searchLink('Erica Meltzer Ultimate Guide SAT Grammar') },
    { title: 'The College Panda\'s SAT Math', author: 'Nielson Phu', edition: '2024', subject: 'Math', link: searchLink('College Panda SAT Math workbook') },
    { title: 'Digital SAT Mega Prep', author: 'Ivy Global', edition: '2024', subject: 'All', link: searchLink('Ivy Global Digital SAT prep book') },
  ],
  videoCourses: [
    { channel: 'Khan Academy SAT', title: 'Official Digital SAT Practice (with College Board)', focus: 'Free, official partner of College Board', link: searchLink('Khan Academy SAT YouTube channel') },
    { channel: 'Princeton Review SAT', title: 'Free SAT classes + tips videos', focus: 'Strategy videos + practice walkthroughs', link: searchLink('Princeton Review SAT YouTube') },
    { channel: 'Kaplan SAT', title: 'SAT Prep Live Stream + Strategy', focus: 'Test-taking strategies + timing', link: searchLink('Kaplan SAT YouTube channel') },
    { channel: 'PrepScholar SAT', title: 'How to Get a Perfect 1600', focus: 'High-scorer strategy videos', link: searchLink('PrepScholar SAT YouTube channel') },
    { channel: 'Scalar Learning — Hubert Lee', title: 'Digital SAT Math Walkthroughs', focus: 'Step-by-step Math problem explanations', link: searchLink('Scalar Learning SAT YouTube') },
  ],
  onlineCourses: [
    { platform: 'Khan Academy', course: 'Official Digital SAT Practice (free)', price: 'Free', link: searchLink('Khan Academy Official SAT Practice') },
    { platform: 'Princeton Review', course: 'SAT 1500+ Course / Self-Paced', price: '$299-$1,599', link: searchLink('Princeton Review SAT online course') },
    { platform: 'Kaplan', course: 'SAT Live Online / Self-Paced', price: '$199-$999', link: searchLink('Kaplan SAT online course') },
    { platform: 'PrepScholar', course: 'Complete SAT Prep Online', price: '$397-$997', link: searchLink('PrepScholar SAT online prep') },
    { platform: 'Magoosh SAT', course: 'SAT Self-Paced 6-Month Access', price: '$129-$179', link: searchLink('Magoosh SAT online course') },
  ],
  practiceResources: [
    { name: 'Official College Board Question Bank', provider: 'College Board', type: 'Free official question bank (Bluebook)', link: searchLink('College Board SAT Question Bank Bluebook') },
    { name: 'Khan Academy Digital SAT Practice', provider: 'Khan Academy + College Board', type: 'Adaptive practice sets + videos', link: searchLink('Khan Academy Digital SAT practice') },
    { name: 'Princeton Review SAT Practice Tests', provider: 'Princeton Review', type: 'Free full-length mock tests', link: searchLink('Princeton Review SAT free practice tests') },
    { name: 'CrackSAT', provider: 'CrackSAT.net', type: 'Archive of past SAT QAS tests', link: searchLink('CrackSAT past SAT QAS papers') },
    { name: 'Erica Meltzer Blog', provider: 'The Critical Reader', type: 'Reading/Writing strategy blog + exercises', link: searchLink('Erica Meltzer Critical Reader blog SAT') },
  ],
  mobileApps: [
    { name: 'Khan Academy — Official SAT Practice', developer: 'Khan Academy', rating: '4.6/5', link: searchLink('Khan Academy SAT app play store') },
    { name: 'Daily Practice for the SAT', developer: 'College Board', rating: '4.2/5', link: searchLink('College Board Daily Practice SAT app') },
    { name: 'Ready4 SAT', developer: 'Ready4', rating: '4.4/5', link: searchLink('Ready4 SAT app play store') },
    { name: 'Magoosh SAT Flashcards', developer: 'Magoosh', rating: '4.5/5', link: searchLink('Magoosh SAT Flashcards app') },
    { name: 'SAT Up', developer: 'Prep4', rating: '4.3/5', link: searchLink('SAT Up app play store') },
  ],
  studyTips: [
    'Take the Bluebook digital mock from College Board first — it perfectly mirrors the real adaptive experience and helps you build stamina for the 2 hr 14 min format.',
    'Memorise the SAT Math formula sheet in advance (linear, quadratic, Pythagoras, circle, area, volume) — it\'s at the start of every Math module.',
    'For Reading, do NOT read the whole passage — read the blurb, then scan for keyword anchors before answering the question.',
    'Practice 4-6 full-length mocks under timed conditions (2 hr 14 min, no breaks except the 10-min break) to master pacing.',
    'Learn the "Transition Word" framework (however, therefore, for instance, in contrast) — ~6 Writing questions per test hinge on this.',
    'Use process of elimination aggressively — with no negative marking, you should NEVER leave a bubble blank.',
    'Practice mental math (multiplication tables to 20, squares to 30, cubes to 12) to save calculator-time on easy questions.',
  ],
  examDayStrategy: [
    'Bring an acceptable photo ID, printed admission ticket, fully-charged laptop/tablet with Bluebook app pre-downloaded, and a power cord.',
    'Use the 10-minute break between R&W and Math wisely — hydrate, stretch, eat a small snack (banana or dark chocolate).',
    'In Reading, attempt questions about specific line references first; leave "main idea" and "purpose" questions for last per passage.',
    'For Math, do easy questions first (usually front-loaded in each module); flag hard ones and use the review screen at the end.',
    'You can flag questions and return within the same module — but once you advance to module 2, you cannot go back to module 1.',
  ],
  importantDates: [
    { event: 'SAT School Day (Fall)', date: 'October (school-administered)' },
    { event: 'SAT National Test Dates', date: 'August, October, November, December, March, May, June' },
    { event: 'Score Release', date: '~2 weeks after test date (digital)' },
    { event: 'Regular Registration Deadline', date: '~3-4 weeks before each test date' },
  ],
};

// ============================================================
// GRE
// ============================================================
const gre: StudyMaterial = {
  examId: 'gre',
  examName: 'GRE General Test',
  examOverview:
    'The GRE General Test (shortened since Sept 2023 to ~1 hr 58 min) is a graduate-school admissions test accepted by thousands of master\'s and PhD programmes worldwide in STEM, business, social sciences and humanities. Administered by ETS at Prometric centres or at home with online proctoring.',
  examPattern:
    'Computer-delivered test (~1 hr 58 min). Analytical Writing (1 essay, 30 min); Verbal Reasoning (27 questions, 41 min across 2 sections); Quantitative Reasoning (27 questions, 47 min across 2 sections). Verbal & Quant are section-level adaptive — performance on section 1 determines difficulty of section 2. Score range 260-340 (Verbal 130-170, Quant 130-170, AW 0-6).',
  totalMarks: 340,
  difficulty: 'Moderate',
  negativeMarking: 'No negative marking; answer every question',
  syllabus: [
    {
      subject: 'Verbal Reasoning',
      weight: 0.4,
      topics: [
        { topic: 'Reading Comprehension', weight: 0.50, subtopics: ['Main Idea', 'Inference', 'Author Tone', 'Detail', 'Function'] },
        { topic: 'Text Completion', weight: 0.25, subtopics: ['Single-Blank', 'Two-Blank', 'Three-Blank'] },
        { topic: 'Sentence Equivalence', weight: 0.25, subtopics: ['Synonym Pairs', 'Sentence Logic'] },
      ],
    },
    {
      subject: 'Quantitative Reasoning',
      weight: 0.4,
      topics: [
        { topic: 'Arithmetic', weight: 0.25, subtopics: ['Number Properties', 'Ratios', 'Percentages', 'Exponents Roots'] },
        { topic: 'Algebra', weight: 0.25, subtopics: ['Linear Equations', 'Quadratics', 'Inequalities', 'Functions', 'Coordinate Geometry'] },
        { topic: 'Geometry', weight: 0.25, subtopics: ['Lines Angles', 'Triangles', 'Polygons', 'Circles', 'Solids'] },
        { topic: 'Data Analysis', weight: 0.25, subtopics: ['Statistics', 'Probability', 'Counting', 'Data Interpretation', 'Permutations'] },
      ],
    },
    {
      subject: 'Analytical Writing',
      weight: 0.2,
      topics: [
        { topic: 'Analyze an Issue', weight: 1.0, subtopics: ['Argument construction', 'Evidence', 'Counterexamples'] },
      ],
    },
  ],
  books: [
    { title: 'The Official Guide to the GRE General Test', author: 'Educational Testing Service (ETS)', edition: '3rd', subject: 'All', link: searchLink('ETS Official Guide GRE General Test 3rd edition') },
    { title: 'Official GRE Verbal Reasoning Practice Questions (Vol 1)', author: 'ETS', edition: '2nd', subject: 'Verbal', link: searchLink('ETS Official GRE Verbal Reasoning Practice Questions') },
    { title: 'Official GRE Quantitative Reasoning Practice Questions (Vol 1)', author: 'ETS', edition: '2nd', subject: 'Quant', link: searchLink('ETS Official GRE Quantitative Reasoning Practice Questions') },
    { title: '5 lb. Book of GRE Practice Problems', author: 'Manhattan Prep', edition: 'Latest', subject: 'Quant', link: searchLink('Manhattan Prep 5 lb GRE Practice Problems') },
    { title: 'GRE Prep Plus', author: 'Kaplan Test Prep', edition: '2025', subject: 'All', link: searchLink('Kaplan GRE Prep Plus 2025') },
    { title: 'Cracking the GRE', author: 'Princeton Review', edition: '2025', subject: 'All', link: searchLink('Princeton Review Cracking the GRE 2025') },
    { title: 'Manhattan Prep GRE Math Strategies', author: 'Manhattan Prep', edition: 'Latest', subject: 'Quant', link: searchLink('Manhattan Prep GRE Math Strategies') },
    { title: 'Barron\'s GRE', author: 'Sharon Weiner Green, Ira K. Wolf', edition: 'Latest', subject: 'All', link: searchLink('Barrons GRE 23rd edition') },
  ],
  videoCourses: [
    { channel: 'Greg Mat+', title: 'GRE Strategy & Walkthroughs', focus: 'The most popular GRE YouTuber; cheap subscription', link: searchLink('Greg Mat GRE YouTube channel') },
    { channel: 'Magoosh GRE', title: 'GRE Verbal + Quant Strategy', focus: 'Free strategy videos + concept refreshers', link: searchLink('Magoosh GRE YouTube channel') },
    { channel: 'Manhattan Prep GRE', title: 'GRE Free Classes + Problem Walkthroughs', focus: 'Instructors walk through official problems', link: searchLink('Manhattan Prep GRE YouTube') },
    { channel: 'Kaplan Test Prep', title: 'GRE Live Classes + Strategy', focus: 'Live strategy sessions + Q&A', link: searchLink('Kaplan GRE YouTube channel') },
    { channel: 'PrepScholar GRE', title: 'GRE Strategy & High-Scorer Tips', focus: 'Targeted strategies for 160+ scores', link: searchLink('PrepScholar GRE YouTube') },
  ],
  onlineCourses: [
    { platform: 'Greg Mat+', course: 'Full GRE Course ($5/month)', price: '$5 / month', link: searchLink('Greg Mat Plus GRE course subscription') },
    { platform: 'Magoosh GRE', course: 'GRE Premium / Self-Paced', price: '$129-$199', link: searchLink('Magoosh GRE premium course') },
    { platform: 'Manhattan Prep', course: 'GRE Self-Paced / Live Course', price: '$499-$1,399', link: searchLink('Manhattan Prep GRE online course') },
    { platform: 'Kaplan', course: 'GRE Live Online / Self-Paced', price: '$299-$1,199', link: searchLink('Kaplan GRE online course') },
    { platform: 'Princeton Review', course: 'GRE Self-Paced / GRE 165+', price: '$499-$1,499', link: searchLink('Princeton Review GRE online course') },
  ],
  practiceResources: [
    { name: 'ETS PowerPrep Online (Free)', provider: 'ETS', type: '2 free official computer-delivered practice tests', link: searchLink('ETS PowerPrep Online free GRE practice test') },
    { name: 'PowerPrep PLUS Online', provider: 'ETS', type: '3 paid official tests ($39.95 each)', link: searchLink('ETS PowerPrep PLUS GRE practice test paid') },
    { name: 'Magoosh GRE Flashcards App', provider: 'Magoosh', type: 'Free vocab + math flashcards', link: searchLink('Magoosh GRE Flashcards app') },
    { name: 'Manhattan Prep GRE Practice Test (Free)', provider: 'Manhattan Prep', type: 'Free full-length mock exam', link: searchLink('Manhattan Prep GRE free practice test') },
    { name: 'ETS Official Quant / Verbal Question Banks', provider: 'ETS', type: 'Official question banks (paid books)', link: searchLink('ETS GRE official question banks') },
  ],
  mobileApps: [
    { name: 'Magoosh GRE Flashcards', developer: 'Magoosh', rating: '4.7/5', link: searchLink('Magoosh GRE Flashcards app play store') },
    { name: 'Manhattan Prep GRE', developer: 'Manhattan Prep', rating: '4.5/5', link: searchLink('Manhattan Prep GRE app play store') },
    { name: 'Ready4 GRE', developer: 'Ready4', rating: '4.4/5', link: searchLink('Ready4 GRE app play store') },
    { name: 'Greg Mat+ Mobile', developer: 'Greg Mat', rating: '4.8/5', link: searchLink('Greg Mat Plus mobile app') },
    { name: 'Vocab Genius by Brainscape', developer: 'Brainscape', rating: '4.6/5', link: searchLink('Brainscape Vocab Genius GRE app') },
  ],
  studyTips: [
    'Master high-frequency GRE vocabulary (Magoosh 1000, Manhattan 500, Greg Mat\'s list) — Text Completion & Sentence Equivalence are pure vocab tests.',
    'Memorise Quant formulas cold: arithmetic, geometry, statistics, probability, combinatorics. Speed is what separates 160 from 165+.',
    'Always eliminate wrong answer choices in Reading Comprehension — the correct answer is rarely the "extreme" or "absolute" option.',
    'Practice with the on-screen calculator before test day; it lacks order-of-operations, so you must track intermediate results mentally.',
    'Use a single analytical writing template (intro-3 body-conclusion) — graders reward clear structure over creative flair.',
    'Take PowerPrep mock 1 early to baseline, mock 2 mid-prep, and PowerPrep PLUS mock 3-4 days before the real exam for accurate prediction.',
    'For sentence equivalence, ALWAYS pick two synonymous words; if only one word in your pair "fits", you\'ve likely misread the sentence.',
  ],
  examDayStrategy: [
    'Arrive 30 minutes early; carry passport (mandatory for non-US test takers) and confirmation email. At-home test takers: prep room in advance (clear desk, no phone).',
    'Skip and mark hard questions — the GRE\'s "Mark" and "Review" features let you return within a section. Budget ~1.5 min/question for Verbal, ~1.75 min for Quant.',
    'For the 3-blank Text Completion, attempt only if you know all 3 blanks — partial credit doesn\'t exist; a wrong guess wastes precious time.',
    'In Quant, ALWAYS double-check units (inches vs cm, $ vs $ thousands) — ETS loves to test attention to detail.',
    'Use the 30-second essay brainstorm rule: write a one-line thesis, then 3 supporting reasons, then a quick counterargument. Don\'t start writing until your outline is clear.',
  ],
  importantDates: [
    { event: 'GRE General Test — Available Year-round', date: 'Available at Prometric centres year-round' },
    { event: 'At-Home GRE', date: 'Available 24/7 (subject to proctor availability)' },
    { event: 'Score Release', date: '8-10 days after test date' },
    { event: 'GRE Score Validity', date: '5 years from test date' },
  ],
};

// ============================================================
// GMAT
// ============================================================
const gmat: StudyMaterial = {
  examId: 'gmat',
  examName: 'GMAT (Focus Edition)',
  examOverview:
    'The GMAT Focus Edition (launched Nov 2023) is the standardised test for global MBA admissions, accepted by 7,700+ programmes at 2,400+ business schools. Shorter (2 hr 15 min) and now composed of 3 sections: Quantitative, Verbal, and Data Insights. Score range 205-805.',
  examPattern:
    'Computer-adaptive test, ~2 hr 15 min. Quantitative Reasoning (21 questions, 45 min); Verbal Reasoning (23 questions, 45 min); Data Insights (20 questions, 45 min). You can review and change up to 3 answers per section. Score range 205-805; section scores 60-90 each.',
  totalMarks: 805,
  difficulty: 'Hard',
  negativeMarking: 'No negative marking; section-adaptive — question difficulty adapts to your answer',
  syllabus: [
    {
      subject: 'Quantitative Reasoning',
      weight: 0.33,
      topics: [
        { topic: 'Arithmetic', weight: 0.35, subtopics: ['Number Properties', 'Ratios', 'Percentages', 'Time Speed Distance'] },
        { topic: 'Algebra', weight: 0.30, subtopics: ['Linear Equations', 'Quadratics', 'Inequalities', 'Exponents Roots'] },
        { topic: 'Word Problems', weight: 0.35, subtopics: ['Work Rate', 'Mixture Problems', 'Profit Loss', 'Sets Venn Diagrams'] },
      ],
    },
    {
      subject: 'Verbal Reasoning',
      weight: 0.34,
      topics: [
        { topic: 'Reading Comprehension', weight: 0.35, subtopics: ['Main Idea', 'Inference', 'Detail', 'Author Tone'] },
        { topic: 'Critical Reasoning', weight: 0.45, subtopics: ['Argument Structure', 'Assumption', 'Strengthen/Weaken', 'Inference'] },
        { topic: 'Sentence Correction', weight: 0.20, subtopics: ['Grammar', 'Meaning Clarity', 'Conciseness', 'Parallelism'] },
      ],
    },
    {
      subject: 'Data Insights',
      weight: 0.33,
      topics: [
        { topic: 'Data Sufficiency', weight: 0.40, subtopics: ['Quant Sufficiency', 'Logic', 'Number Properties'] },
        { topic: 'Graphics Interpretation', weight: 0.30, subtopics: ['Charts', 'Graphs', 'Statistics'] },
        { topic: 'Multi-Source Reasoning', weight: 0.30, subtopics: ['Tabbed Data', 'Two-Part Analysis', 'Table Analysis'] },
      ],
    },
  ],
  books: [
    { title: 'GMAT Official Guide 2024-2025 Bundle', author: 'GMAC', edition: 'Latest', subject: 'All', link: searchLink('GMAC GMAT Official Guide 2024 2025 bundle') },
    { title: 'GMAT Official Advance Questions', author: 'GMAC', edition: 'Latest', subject: 'All', link: searchLink('GMAC GMAT Official Advance Questions') },
    { title: 'All the GMAT (Manhattan Prep)', author: 'Manhattan Prep', edition: '7th', subject: 'All', link: searchLink('Manhattan Prep All the GMAT 7th edition') },
    { title: 'GMAT Prep Plus', author: 'Kaplan Test Prep', edition: '2024-2025', subject: 'All', link: searchLink('Kaplan GMAT Prep Plus 2024 2025') },
    { title: 'Power Score Critical Reasoning Bible', author: 'David M. Killoran', edition: 'Latest', subject: 'Verbal', link: searchLink('Power Score Critical Reasoning Bible GMAT') },
    { title: 'GMAT Reading Comprehension (Manhattan Prep)', author: 'Manhattan Prep', edition: 'Latest', subject: 'Verbal', link: searchLink('Manhattan Prep GMAT Reading Comprehension') },
    { title: 'Foundations of GMAT Math', author: 'Manhattan Prep', edition: 'Latest', subject: 'Quant', link: searchLink('Manhattan Prep Foundations of GMAT Math') },
    { title: 'GMAT Sentence Correction (Manhattan Prep)', author: 'Manhattan Prep', edition: 'Latest', subject: 'Verbal', link: searchLink('Manhattan Prep GMAT Sentence Correction') },
  ],
  videoCourses: [
    { channel: 'GMAT Ninja', title: 'GMAT Strategy & Tutoring', focus: 'Verbal + Quant strategies with official problem walkthroughs', link: searchLink('GMAT Ninja YouTube channel') },
    { channel: 'Magoosh GMAT', title: 'GMAT Concept + Strategy', focus: 'Free concept refreshers + test-taking strategy', link: searchLink('Magoosh GMAT YouTube channel') },
    { channel: 'Manhattan Prep GMAT', title: 'Free GMAT Classes', focus: 'Live free sessions with instructors', link: searchLink('Manhattan Prep GMAT YouTube') },
    { channel: 'Kaplan GMAT', title: 'GMAT Strategy + Q&A', focus: 'Pacing + adaptive strategies', link: searchLink('Kaplan GMAT YouTube channel') },
    { channel: 'PrepScholar GMAT', title: 'GMAT High-Scorer Tips', focus: '700+ score strategies', link: searchLink('PrepScholar GMAT YouTube') },
  ],
  onlineCourses: [
    { platform: 'Magoosh GMAT', course: 'GMAT Self-Paced / Premium', price: '$179-$249', link: searchLink('Magoosh GMAT online course') },
    { platform: 'Manhattan Prep', course: 'GMAT Self-Paced / Live Course', price: '$499-$1,499', link: searchLink('Manhattan Prep GMAT online course') },
    { platform: 'Kaplan', course: 'GMAT Live Online / Self-Paced', price: '$399-$1,499', link: searchLink('Kaplan GMAT online course') },
    { platform: 'Princeton Review', course: 'GMAT Self-Paced / GMAT 760+', price: '$499-$1,799', link: searchLink('Princeton Review GMAT online course') },
    { platform: 'Target Test Prep (TTP)', course: 'GMAT Quant Self-Paced', price: '$149-$499', link: searchLink('Target Test Prep GMAT online course') },
  ],
  practiceResources: [
    { name: 'GMAT Official Practice Exams (1-6)', provider: 'GMAC (mba.com)', type: 'Official computer-adaptive mocks', link: searchLink('GMAC GMAT official practice exams mba.com') },
    { name: 'GMAT Official Starter Kit (Free)', provider: 'GMAC', type: '90 free official practice questions + 1 mock', link: searchLink('GMAC GMAT Official Starter Kit free') },
    { name: 'Magoosh GMAT Idiom Flashcards', provider: 'Magoosh', type: 'Free Sentence Correction idiom list', link: searchLink('Magoosh GMAT Idioms flashcards') },
    { name: 'Manhattan Prep Free GMAT Practice Test', provider: 'Manhattan Prep', type: 'Free full-length mock', link: searchLink('Manhattan Prep GMAT free practice test') },
    { name: 'GMAT Club Forum', provider: 'GMAT Club', type: 'Community Q&A + thousands of solved problems', link: searchLink('GMAT Club forum practice questions') },
  ],
  mobileApps: [
    { name: 'Official GMAT Prep App', developer: 'GMAC', rating: '4.3/5', link: searchLink('Official GMAT Prep app play store') },
    { name: 'Magoosh GMAT Flashcards', developer: 'Magoosh', rating: '4.6/5', link: searchLink('Magoosh GMAT Flashcards app') },
    { name: 'Ready4 GMAT', developer: 'Ready4', rating: '4.5/5', link: searchLink('Ready4 GMAT app play store') },
    { name: 'Manhattan Prep GMAT', developer: 'Manhattan Prep', rating: '4.4/5', link: searchLink('Manhattan Prep GMAT app play store') },
    { name: 'GMAT Club Forum App', developer: 'GMAT Club', rating: '4.5/5', link: searchLink('GMAT Club forum mobile app') },
  ],
  studyTips: [
    'Master Data Sufficiency logic first — the "AD / BCE" decision tree saves 15-20 seconds per question.',
    'Memorise prime numbers up to 100 and perfect squares/cubes up to 20 — these unlock ~30% of Quant questions in seconds.',
    'For Critical Reasoning, identify the conclusion (look for "therefore", "thus", "so") before reading answer choices; ~80% of wrong answers are out of scope.',
    'Maintain a 30-page "Idioms + Common Traps" cheat sheet (subject-verb agreement, modifier placement, parallelism) and revise it daily.',
    'Take 6-8 official GMAC mocks (not third-party) — GMAT\'s adaptive algorithm is unique and only official mocks replicate it.',
    'For Sentence Correction, read for meaning first; ~25% of correct answers fix logical errors, not grammatical ones.',
    'Use the "3-answer-change" feature sparingly — research shows changing answers usually lowers your score; trust your first instinct.',
  ],
  examDayStrategy: [
    'Arrive 30 min early; carry passport (mandatory for international test takers). Online test takers: prep the room as per Pearson VUE requirements.',
    'Spend < 2 minutes per Quant question; if stuck, mark and move on. Bank time for trickier Data Insights questions.',
    'In Reading Comprehension, read the passage actively — note each paragraph\'s main idea in 5-6 words in the margin.',
    'For Critical Reasoning, predict the answer before reading choices — most wrong answers sound plausible but don\'t address the assumption.',
    'In Data Insights, attempt Data Sufficiency and Table Analysis first; they\'re fastest to verify; leave Multi-Source Reasoning for last.',
  ],
  importantDates: [
    { event: 'GMAT Focus Edition Available', date: 'Year-round at test centres / online' },
    { event: 'Score Release', date: 'Unofficial score immediately; official in 3-5 days (excludes AWA)' },
    { event: 'Score Validity', date: '5 years from test date' },
    { event: 'Maximum Retakes', date: '5 times per rolling 12 months; 8 lifetime' },
  ],
};

// ============================================================
// GATE
// ============================================================
const gate: StudyMaterial = {
  examId: 'gate',
  examName: 'GATE (Computer Science)',
  examOverview:
    'GATE is a national-level PG engineering entrance conducted jointly by IISc Bangalore and 7 IITs for admission to M.Tech / MS / PhD programmes and recruitment by PSUs (IOCL, NTPC, BHEL etc.). Held once a year (February). Valid for 3 years for admissions and PG scholarships.',
  examPattern:
    'Computer-based test, 3 hours, 65 questions, 100 marks. General Aptitude (15 marks, 10 questions) + Subject (85 marks, 55 questions). Mix of MCQs (+1 or +2; −1/3 or −2/3 negative), Multiple-Select (MSQ) and Numerical Answer Type (NAT — no negative).',
  totalMarks: 100,
  difficulty: 'Very Hard',
  negativeMarking: 'MCQ: −1/3 for 1-mark, −2/3 for 2-mark; MSQ & NAT: no negative marking',
  syllabus: [
    {
      subject: 'General Aptitude',
      weight: 0.15,
      topics: [
        { topic: 'Verbal Aptitude', weight: 0.25, subtopics: ['English Grammar', 'Vocabulary', 'Reading Comprehension'] },
        { topic: 'Quantitative Aptitude', weight: 0.25, subtopics: ['Number System', 'Time Speed', 'Percentages', 'Geometry'] },
        { topic: 'Analytical Aptitude', weight: 0.25, subtopics: ['Logic', 'Blood Relations', 'Series'] },
        { topic: 'Spatial Aptitude', weight: 0.25, subtopics: ['Mirror Images', '3D Visualisation'] },
      ],
    },
    {
      subject: 'Computer Science',
      weight: 0.85,
      topics: [
        { topic: 'Engineering Mathematics', weight: 0.15, subtopics: ['Discrete Math', 'Linear Algebra', 'Calculus', 'Probability'] },
        { topic: 'Digital Logic', weight: 0.07, subtopics: ['Boolean Algebra', 'Combinational Circuits', 'Sequential Circuits'] },
        { topic: 'Computer Organization & Architecture', weight: 0.10, subtopics: ['Machine Instructions', 'Addressing Modes', 'Pipelining', 'Cache', 'Memory Hierarchy'] },
        { topic: 'Programming & Data Structures', weight: 0.12, subtopics: ['C Programming', 'Recursion', 'Trees', 'Graphs', 'Stacks Queues'] },
        { topic: 'Algorithms', weight: 0.13, subtopics: ['Asymptotic Analysis', 'Divide Conquer', 'Greedy', 'Dynamic Programming', 'Graph Algorithms'] },
        { topic: 'Theory of Computation', weight: 0.08, subtopics: ['Finite Automata', 'Regular Languages', 'CFG', 'Turing Machines'] },
        { topic: 'Compiler Design', weight: 0.08, subtopics: ['Lexical Analysis', 'Parsing', 'Syntax Directed Translation', 'Code Generation'] },
        { topic: 'Operating System', weight: 0.10, subtopics: ['Process Scheduling', 'Synchronisation', 'Deadlocks', 'Memory Management', 'File Systems'] },
        { topic: 'Databases', weight: 0.08, subtopics: ['ER Model', 'Relational Algebra', 'Normalization', 'SQL', 'Transactions'] },
        { topic: 'Computer Networks', weight: 0.09, subtopics: ['OSI TCP-IP', 'IP Addressing', 'Routing', 'TCP UDP', 'Application Layer'] },
      ],
    },
  ],
  books: [
    { title: 'Introduction to Algorithms (CLRS)', author: 'Cormen, Leiserson, Rivest, Stein', edition: '4th (2022)', subject: 'Algorithms', link: searchLink('CLRS Introduction to Algorithms 4th edition') },
    { title: 'Operating System Concepts (Silberschatz)', author: 'Galvin, Silberschatz, Gagne', edition: '10th', subject: 'OS', link: searchLink('Silberschatz Operating System Concepts 10th edition') },
    { title: 'Database System Concepts', author: 'Silberschatz, Korth, Sudarshan', edition: '7th', subject: 'DBMS', link: searchLink('Silberschatz Korth Database System Concepts 7th edition') },
    { title: 'Computer Networks: A Top-Down Approach', author: 'Kurose & Ross', edition: '8th', subject: 'Networks', link: searchLink('Kurose Ross Computer Networks Top Down 8th edition') },
    { title: 'Computer Organization and Design', author: 'Patterson & Hennessy', edition: 'RISC-V Edition', subject: 'COA', link: searchLink('Patterson Hennessy Computer Organization Design RISC-V') },
    { title: 'Introduction to Automata Theory, Languages, and Computation', author: 'Hopcroft, Motwani, Ullman', edition: '3rd', subject: 'TOC', link: searchLink('Hopcroft Ullman Introduction Automata Theory 3rd') },
    { title: 'Compilers: Principles, Techniques, and Tools (Dragon Book)', author: 'Aho, Lam, Sethi, Ullman', edition: '2nd', subject: 'Compiler', link: searchLink('Dragon Book Compilers Aho Lam Sethi Ullman') },
    { title: 'GATE Computer Science & IT (Made Easy)', author: 'Made Easy Editorial', edition: 'Latest', subject: 'GATE PYQ + Theory', link: searchLink('Made Easy GATE Computer Science book') },
  ],
  videoCourses: [
    { channel: 'Gate Smashers', title: 'GATE CS Complete Lectures', focus: 'Concept-first YouTube lectures for all CS subjects', link: searchLink('Gate Smashers YouTube channel CS') },
    { channel: 'Neso Academy', title: 'Computer Networks + OS Playlists', focus: 'Detailed animated concept videos', link: searchLink('Neso Academy YouTube GATE Computer Science') },
    { channel: 'Knowledge Gate (Sanchit Sir)', title: 'GATE CS Theory + PYQ', focus: 'Compact theory + PYQ walkthroughs', link: searchLink('Knowledge Gate Sanchit Sir GATE CS YouTube') },
    { channel: 'Unacademy GATE & ESE', title: 'Daily Free GATE Classes', focus: 'Live classes by India\'s top faculty', link: searchLink('Unacademy GATE YouTube channel') },
    { channel: 'The Gate Hub', title: 'GATE CS Concept Videos', focus: 'Short concept refreshers', link: searchLink('The Gate Hub YouTube channel CS') },
  ],
  onlineCourses: [
    { platform: 'Made Easy Live Online', course: 'GATE CS Live Classes + Test Series', price: '₹15,000-₹40,000', link: searchLink('Made Easy GATE CS live online course') },
    { platform: 'ACE Engineering Academy', course: 'GATE CS Online Course', price: '₹18,000-₹45,000', link: searchLink('ACE Engineering Academy GATE CS online') },
    { platform: 'Unacademy Plus', course: 'GATE CS Subscription', price: '₹5,000-₹20,000', link: searchLink('Unacademy GATE Plus subscription') },
    { platform: 'GeeksforGeeks', course: 'GATE CS 2025 Test Series + Course', price: '₹3,000-₹10,000', link: searchLink('GeeksforGeeks GATE CS course') },
    { platform: 'Testbook', course: 'GATE CS 2025 Smart Course + Test Series', price: '₹3,500-₹12,000', link: searchLink('Testbook GATE CS course') },
  ],
  practiceResources: [
    { name: 'Made Easy Previous Year GATE Solved Papers', provider: 'Made Easy', type: 'Last 30 years solved GATE papers', link: searchLink('Made Easy GATE previous year solved papers') },
    { name: 'GO PDF (GATE Overflow)', provider: 'GATE Overflow', type: 'Free community-solved GATE questions (2008-2024)', link: searchLink('GATE Overflow GO PDF questions') },
    { name: 'GATE CS Test Series (Made Easy)', provider: 'Made Easy', type: '40+ topic + full-length tests', link: searchLink('Made Easy GATE CS test series') },
    { name: 'Testbook GATE Test Series', provider: 'Testbook', type: 'Topic + section + full mocks', link: searchLink('Testbook GATE CS test series') },
    { name: 'GeeksforGeeks GATE PYQ Section', provider: 'GeeksforGeeks', type: 'Free PYQ subject-wise', link: searchLink('GeeksforGeeks GATE previous year questions') },
  ],
  mobileApps: [
    { name: 'Made Easy Live App', developer: 'Made Easy Publications', rating: '4.3/5', link: searchLink('Made Easy Live app play store') },
    { name: 'Gate Smashers Notes App', developer: 'Gate Smashers', rating: '4.6/5', link: searchLink('Gate Smashers app play store') },
    { name: 'Unacademy Learner\'s App', developer: 'Unacademy', rating: '4.5/5', link: searchLink('Unacademy GATE app play store') },
    { name: 'Testbook Exam Preparation', developer: 'Testbook', rating: '4.6/5', link: searchLink('Testbook app play store GATE') },
    { name: 'GATE Overflow App', developer: 'GATE Overflow', rating: '4.4/5', link: searchLink('GATE Overflow app play store') },
  ],
  studyTips: [
    'Solve the last 25 years of GATE PYQs at least twice — question style and topic weights repeat heavily; ~70% of concepts recur yearly.',
    'Master Engineering Mathematics + Aptitude (combined 25 marks) — these are higher-ROI than chasing the toughest TOC or Compiler topic.',
    'Maintain a "Formula + Concept" sheet per subject; revise it every Sunday — GATE tests breadth of recall under time pressure.',
    'Practice NAT (Numerical Answer Type) questions daily — no options means you can\'t eliminate; you must compute precisely.',
    'Use short notes (1-2 pages per subject) for last-week revision — Made Easy and GeeksforGeeks both publish free PDFs.',
    'Take at least 20 full-length mocks (3 hours each) with strict timing and analysis — stamina is what separates AIR <1000 from AIR <5000.',
    'For Algorithms, hand-trace examples on paper (mergesort, quicksort, Dijkstra, Bellman-Ford) — GATE rewards algorithmic thinking over rote formula recall.',
  ],
  examDayStrategy: [
    'Carry printed admit card + original photo ID; reach the centre 60 min early for biometric verification.',
    'Attempt General Aptitude first (15 marks in ~20 min) — it\'s the fastest-scoring section and warms you up for the tougher subject section.',
    'In the subject section, scan all questions first; mark easy 1-mark questions and NAT (no negative marking) for priority attempt.',
    'Skip long MSQ questions initially — they\'re traps if you haven\'t fully revised all options.',
    'Reserve the last 10 minutes to revisit marked-for-review questions, NOT to attempt new ones.',
  ],
  importantDates: [
    { event: 'GATE Online Application Opens', date: 'Late August / Early September' },
    { event: 'GATE Admit Card Release', date: 'First week of January' },
    { event: 'GATE Exam (Two Weekends)', date: 'First two Saturdays & Sundays of February' },
    { event: 'GATE Result', date: 'Third week of March' },
  ],
};

// ============================================================
// CAT
// ============================================================
const cat: StudyMaterial = {
  examId: 'cat',
  examName: 'CAT (Common Admission Test)',
  examOverview:
    'CAT is the entrance for the 21 IIMs and 1,200+ B-schools in India. Conducted annually by one of the older IIMs (on rotation) on the last Sunday of November in three sessions. Test duration 2 hours; computer-based, mixed MCQ + TITA (type-in-the-answer).',
  examPattern:
    '2 hours (120 min), 66 questions across 3 sections: VARC (24 Q, 40 min), DILR (20 Q, 40 min), QA (22 Q, 40 min). Sectional time limits — you cannot switch sections. +3 per correct, −1 per wrong MCQ; TITA (non-MCQ) questions have no negative marking. Max 198 marks.',
  totalMarks: 198,
  difficulty: 'Very Hard',
  negativeMarking: '−1 per wrong MCQ; TITA (non-MCQ) — no negative marking',
  syllabus: [
    {
      subject: 'VARC (Verbal Ability & Reading Comprehension)',
      weight: 0.33,
      topics: [
        { topic: 'Reading Comprehension', weight: 0.67, subtopics: ['Inference', 'Main Idea', 'Author Tone', 'Detail', 'Title'] },
        { topic: 'Para Jumbles', weight: 0.12, subtopics: ['TITA Parajumbles', 'Sentence Rearrangement'] },
        { topic: 'Para Summary', weight: 0.10, subtopics: ['Passage Summary', 'Tone Match'] },
        { topic: 'Odd Sentence Out', weight: 0.06, subtopics: ['Identify Mismatched Sentence'] },
        { topic: 'Vocabulary & Grammar', weight: 0.05, subtopics: ['Word Usage', 'Fill in the Blanks'] },
      ],
    },
    {
      subject: 'DILR (Data Interpretation & Logical Reasoning)',
      weight: 0.33,
      topics: [
        { topic: 'Data Interpretation', weight: 0.50, subtopics: ['Tables', 'Bar Graphs', 'Pie Charts', 'Line Charts', 'Venn Diagrams', 'Combination Sets'] },
        { topic: 'Logical Reasoning', weight: 0.50, subtopics: ['Seating Arrangement', 'Puzzles', 'Games Tournaments', 'Scheduling', 'Networks', 'Blood Relations'] },
      ],
    },
    {
      subject: 'QA (Quantitative Aptitude)',
      weight: 0.34,
      topics: [
        { topic: 'Arithmetic', weight: 0.40, subtopics: ['Percentages', 'Profit Loss', 'Time Work', 'Time Speed Distance', 'Ratio Proportion', 'Averages'] },
        { topic: 'Algebra', weight: 0.20, subtopics: ['Linear Equations', 'Quadratics', 'Inequalities', 'Logarithms', 'Progressions'] },
        { topic: 'Geometry & Mensuration', weight: 0.25, subtopics: ['Triangles', 'Circles', 'Polygons', 'Coordinate Geometry', 'Mensuration'] },
        { topic: 'Number System', weight: 0.10, subtopics: ['Divisibility', 'Remainders', 'LCM HCF', 'Number Properties'] },
        { topic: 'Modern Math', weight: 0.05, subtopics: ['Permutations Combinations', 'Probability', 'Set Theory'] },
      ],
    },
  ],
  books: [
    { title: 'How to Prepare for Quantitative Aptitude for CAT', author: 'Arun Sharma', edition: 'Latest (TMH)', subject: 'QA', link: searchLink('Arun Sharma Quantitative Aptitude CAT book') },
    { title: 'How to Prepare for Verbal Ability and Reading Comprehension for CAT', author: 'Arun Sharma & Meenakshi Upadhyay', edition: 'Latest', subject: 'VARC', link: searchLink('Arun Sharma Verbal Ability CAT book') },
    { title: 'How to Prepare for Data Interpretation for CAT', author: 'Arun Sharma', edition: 'Latest', subject: 'DILR', link: searchLink('Arun Sharma Data Interpretation CAT book') },
    { title: 'Logical Reasoning and Data Interpretation for CAT', author: 'Nishit K. Sinha (Pearson)', edition: 'Latest', subject: 'DILR', link: searchLink('Nishit Sinha Logical Reasoning Data Interpretation CAT') },
    { title: 'Quantitative Aptitude for CAT', author: 'Nishit K. Sinha (Pearson)', edition: 'Latest', subject: 'QA', link: searchLink('Nishit Sinha Quantitative Aptitude CAT Pearson') },
    { title: 'Word Power Made Easy', author: 'Norman Lewis', edition: 'Latest', subject: 'VARC', link: searchLink('Norman Lewis Word Power Made Easy') },
    { title: 'High School English Grammar & Composition', author: 'Wren & Martin', edition: 'Latest', subject: 'VARC', link: searchLink('Wren Martin English Grammar book') },
    { title: 'TIME / CL Material (Foundation + Advanced)', author: 'T.I.M.E. / Career Launcher', edition: 'Latest', subject: 'All', link: searchLink('TIME Career Launcher CAT study material') },
  ],
  videoCourses: [
    { channel: 'Rodha', title: 'CAT DILR by Ravi Prakash', focus: 'Excellent DILR puzzle breakdowns (free)', link: searchLink('Rodha YouTube CAT DILR') },
    { channel: 'Elites Grid (Hunny sir)', title: 'CAT Quant Concept + Practice', focus: 'Free Quant concept videos + practice', link: searchLink('Elites Grid CAT YouTube channel') },
    { channel: 'Cracku', title: 'Free CAT Classes + Daily Targets', focus: 'Free daily targets + PYQ walkthroughs', link: searchLink('Cracku CAT YouTube channel') },
    { channel: 'IIM Skills / Career Launcher', title: 'CAT Strategy Webinars', focus: 'Strategy + mock analysis videos', link: searchLink('Career Launcher CAT YouTube channel') },
    { channel: '2IIM CAT Preparation', title: 'CAT Quant Concept Videos', focus: 'Detailed Quant concept lectures', link: searchLink('2IIM CAT Preparation YouTube') },
  ],
  onlineCourses: [
    { platform: 'TIME', course: 'CAT Classroom / Correspondence / Online', price: '₹15,000-₹45,000', link: searchLink('TIME CAT online course') },
    { platform: 'Career Launcher', course: 'CAT Smart Test Prep / Online Coaching', price: '₹15,000-₹50,000', link: searchLink('Career Launcher CAT online course') },
    { platform: 'Cracku', course: 'CAT 2025 Smart Course + Test Series', price: '₹4,000-₹12,000', link: searchLink('Cracku CAT online course') },
    { platform: 'Elites Grid', course: 'CAT 2025 Online Batch', price: '₹5,000-₹15,000', link: searchLink('Elites Grid CAT online course') },
    { platform: 'IMS Learning', course: 'CAT Classroom / Online / Test Series', price: '₹15,000-₹50,000', link: searchLink('IMS CAT online course') },
  ],
  practiceResources: [
    { name: 'TIME / CL / IMS Mock Series (SIMCAT / AIMCAT / Mocks)', provider: 'TIME / CL / IMS', type: '40-50 sectional + full-length mocks', link: searchLink('TIME AIMCAT Career Launcher SIMCAT mock series') },
    { name: 'Cracku Free Daily Targets', provider: 'Cracku', type: 'Daily free practice + concept videos', link: searchLink('Cracku free daily targets CAT') },
    { name: 'Past 30 Years CAT Papers', provider: 'TIME / Cracku / Career Launcher', type: 'Solved PYQ PDFs', link: searchLink('CAT previous year papers 30 years solved') },
    { name: '2IIM Question Bank', provider: '2IIM', type: 'Free + paid topic-wise questions', link: searchLink('2IIM CAT question bank') },
    { name: 'MBA Preparation Books — Sectional Practice', provider: 'Arihant / Disha', type: 'Topic-wise practice workbooks', link: searchLink('Arihant CAT sectional practice books') },
  ],
  mobileApps: [
    { name: 'TIME — T.I.M.E. Mobile App', developer: 'Triumphant Institute', rating: '4.2/5', link: searchLink('TIME CAT app play store') },
    { name: 'Career Launcher App', developer: 'Career Launcher', rating: '4.3/5', link: searchLink('Career Launcher app play store CAT') },
    { name: 'Cracku — CAT Preparation', developer: 'Cracku', rating: '4.6/5', link: searchLink('Cracku app play store CAT') },
    { name: 'Testbook — CAT Preparation', developer: 'Testbook', rating: '4.5/5', link: searchLink('Testbook CAT app play store') },
    { name: 'Byju\'s Exam Prep (formerly Gradeup)', developer: 'Byjus', rating: '4.4/5', link: searchLink('Byjus Exam Prep CAT app') },
  ],
  studyTips: [
    'Build a daily reading habit — read The Hindu editorial, Aeon essays, and The Atlantic articles for 45 min every morning; VARC is fundamentally a reading habit test.',
    'For DILR, focus on "set selection" — choose 4 of the 5 sets wisely in 3-4 minutes; a wrong set choice wastes 10+ minutes.',
    'Memorise squares (1-30), cubes (1-15), square roots, cube roots, prime factorisations — saves precious seconds in QA.',
    'Maintain a "DI Calculation Speed" practice session daily: 20 mins of pure mental math (fractions to percentages, divisions, multiplications).',
    'Take 30-40 full-length mocks (2 hr) and analyse each for at least 90 minutes — mock analysis > mock count.',
    'TITA questions are a free roll — never leave them blank; even a 30-second guess can earn 3 marks with no downside.',
    'Solve last 15 years\' CAT papers (1990-2008 are tougher; recent ones test strategy); older quant questions form the backbone of T.I.M.E. + CL mock sets.',
  ],
  examDayStrategy: [
    'Within VARC, attempt Reading Comprehension first (~24 min for 16 RC questions), then Verbal Ability (~16 min for VA).',
    'In DILR, scan all 5 sets in the first 3 minutes; pick the 4 you can solve. Leave the hardest set untouched.',
    'For QA, attempt Arithmetic first (high ROI), then Number System, then Geometry; skip Algebra if time-crunched (variable difficulty).',
    'Mark-and-forward tough questions — don\'t get stuck; CAT penalises you doubly on a 4-min question because you lose 3 easier ones downstream.',
    'Carry admit card + photo ID only; no watch, no calculator. The on-screen calculator exists but is slow — use it sparingly.',
  ],
  importantDates: [
    { event: 'CAT Notification Released', date: 'Last Sunday of July' },
    { event: 'Registration Window', date: 'Early August – Mid September' },
    { event: 'Admit Card Release', date: 'Last week of October' },
    { event: 'CAT Exam', date: 'Last Sunday of November' },
  ],
};

// ============================================================
// UPSC
// ============================================================
const upsc: StudyMaterial = {
  examId: 'upsc',
  examName: 'UPSC Civil Services (Prelims)',
  examOverview:
    'The UPSC Civil Services Examination is the entrance for IAS, IPS, IFS and 20+ Group A & B services. Three stages: Prelims (objective, qualifying), Mains (descriptive, 9 papers), and Personality Test (interview). Prelims has two papers — GS Paper 1 (ranked) and CSAT Paper 2 (qualifying, 33%).',
  examPattern:
    'Prelims: 2 papers of 2 hours each. GS Paper 1: 100 questions, 200 marks, +2/−0.66. CSAT (Paper 2): 80 questions, 200 marks, +2.5/−0.83, qualifying at 33%. Mains: 9 descriptive papers (1750 marks) + Personality Test (275 marks). Total 2025 marks for final ranking.',
  totalMarks: 200,
  difficulty: 'Very Hard',
  negativeMarking: 'GS Paper 1: −0.66 per wrong; CSAT: −0.83 per wrong',
  syllabus: [
    {
      subject: 'General Studies (Paper 1)',
      weight: 1.0,
      topics: [
        { topic: 'History (Ancient, Medieval, Modern, Culture)', weight: 0.15, subtopics: ['Indus Valley', 'Mauryan', 'Gupta', 'Delhi Sultanate', 'Mughals', 'Freedom Struggle', 'Art & Culture'] },
        { topic: 'Geography (Indian + World)', weight: 0.15, subtopics: ['Physical Geography', 'Indian Geography', 'Climatology', 'Oceanography', 'Mapping'] },
        { topic: 'Indian Polity & Governance', weight: 0.15, subtopics: ['Constitution', 'Parliament', 'Judiciary', 'Federalism', 'Local Govt', 'Constitutional Bodies'] },
        { topic: 'Economy', weight: 0.15, subtopics: ['Macroeconomics', 'Banking', 'Fiscal Policy', 'Monetary Policy', 'Inflation', 'Budget'] },
        { topic: 'Environment & Ecology', weight: 0.10, subtopics: ['Biodiversity', 'Conservation', 'Climate Change', 'Pollution', 'Environmental Laws'] },
        { topic: 'Science & Technology', weight: 0.10, subtopics: ['Biotech', 'Space', 'Defence', 'IT', 'Health', 'Nuclear'] },
        { topic: 'Current Affairs (Last 12 months)', weight: 0.20, subtopics: ['National Schemes', 'International Relations', 'Indices Reports', 'Defence Exercises', 'Sports', 'Awards'] },
      ],
    },
  ],
  books: [
    { title: 'Indian Polity', author: 'M. Laxmikanth', edition: '7th (2023)', subject: 'Polity', link: searchLink('Laxmikanth Indian Polity 7th edition') },
    { title: 'A Brief History of Modern India', author: 'Rajiv Ahir (Spectrum)', edition: 'Latest', subject: 'Modern History', link: searchLink('Spectrum Modern History Rajiv Ahir UPSC') },
    { title: 'Indian Art and Culture', author: 'Nitin Singhania', edition: 'Latest', subject: 'Culture', link: searchLink('Nitin Singhania Indian Art Culture UPSC') },
    { title: 'Geography of India', author: 'Majid Husain', edition: 'Latest', subject: 'Geography', link: searchLink('Majid Husain Geography of India UPSC') },
    { title: 'Certificate Physical and Human Geography', author: 'Goh Cheng Leong', edition: 'Latest', subject: 'Geography', link: searchLink('Goh Cheng Leong Certificate Physical Human Geography') },
    { title: 'Indian Economy', author: 'Ramesh Singh', edition: '15th (2024)', subject: 'Economy', link: searchLink('Ramesh Singh Indian Economy 15th edition UPSC') },
    { title: 'Environment and Ecology', author: 'Shankar IAS Academy', edition: 'Latest', subject: 'Environment', link: searchLink('Shankar IAS Environment Ecology book') },
    { title: 'NCERT Class 6-12 (selected)', author: 'NCERT', edition: 'Latest', subject: 'Foundation', link: searchLink('NCERT books Class 6 to 12 UPSC list') },
  ],
  videoCourses: [
    { channel: 'Mrunal Patel', title: 'Economy + Geography + Current Affairs', focus: 'Free lectures with exam-aligned depth', link: searchLink('Mrunal Patel UPSC YouTube channel') },
    { channel: 'Unacademy UPSC', title: 'Free Live Classes', focus: 'Live classes by top educators', link: searchLink('Unacademy UPSC YouTube channel') },
    { channel: 'Study IQ IAS', title: 'Daily Current Affairs + Concept', focus: 'Daily current affairs digest', link: searchLink('Study IQ IAS UPSC YouTube') },
    { channel: 'Drishti IAS', title: 'UPSC Concept + Hindi/English', focus: 'Available in Hindi and English', link: searchLink('Drishti IAS UPSC YouTube channel') },
    { channel: 'Vision IAS', title: 'Current Affairs + Magazine Discussions', focus: 'Monthly current affairs compilations', link: searchLink('Vision IAS UPSC YouTube') },
  ],
  onlineCourses: [
    { platform: 'Unacademy Plus', course: 'UPSC CSE GS Foundation', price: '₹15,000-₹80,000', link: searchLink('Unacademy Plus UPSC CSE subscription') },
    { platform: 'Vision IAS', course: 'GS Foundation (Online / Offline)', price: '₹1.0-1.5 lakh', link: searchLink('Vision IAS GS Foundation course') },
    { platform: 'Drishti Learning', course: 'UPSC Foundation (Hindi / English)', price: '₹40,000-₹1.2 lakh', link: searchLink('Drishti IAS online learning UPSC') },
    { platform: 'Vajiram & Ravi', course: 'GS Classroom + Online', price: '₹1.5 lakh+', link: searchLink('Vajiram Ravi GS classroom online UPSC') },
    { platform: 'Byju\'s IAS', course: 'Tablet + Online Classes', price: '₹70,000-₹1.5 lakh', link: searchLink('Byjus IAS tablet course') },
  ],
  practiceResources: [
    { name: 'Vision IAS Monthly Current Affairs', provider: 'Vision IAS', type: 'Monthly PDF magazine (free + paid)', link: searchLink('Vision IAS monthly current affairs magazine') },
    { name: 'Vision IAS PT 365 (Yearly Current Affairs)', provider: 'Vision IAS', type: 'Subject-wise yearly compilation', link: searchLink('Vision IAS PT 365 yearly current affairs') },
    { name: 'Insights IAS Daily Current Affairs + Secure', provider: 'Insights IAS', type: 'Daily answer-writing practice + CA notes', link: searchLink('Insights IAS Secure daily current affairs') },
    { name: ' Shankar IAS Prelims Test Series', provider: 'Shankar IAS', type: 'Sectional + full-length prelims mocks', link: searchLink('Shankar IAS prelims test series') },
    { name: 'Vision IAS Prelims Test Series', provider: 'Vision IAS', type: '30+ prelims mocks + PYQ analysis', link: searchLink('Vision IAS prelims test series') },
  ],
  mobileApps: [
    { name: 'Vision IAS', developer: 'Vision IAS', rating: '4.5/5', link: searchLink('Vision IAS app play store') },
    { name: 'Unacademy Learner\'s App', developer: 'Unacademy', rating: '4.5/5', link: searchLink('Unacademy UPSC app play store') },
    { name: 'Drishti Learning', developer: 'Drishti IAS', rating: '4.6/5', link: searchLink('Drishti Learning app play store') },
    { name: 'ClearIAS', developer: 'ClearIAS.com', rating: '4.6/5', link: searchLink('ClearIAS app play store') },
    { name: 'Byju\'s — The Learning App', developer: 'Byjus', rating: '4.4/5', link: searchLink('Byjus app play store UPSC') },
  ],
  studyTips: [
    'Master NCERT Class 6-12 (selected) before any advanced book — they form the conceptual base for History, Geography, Polity, Economy.',
    'Read Indian Polity (Laxmikanth) cover-to-cover at least 3 times; ~15 prelims questions are direct from this single book.',
    'Maintain a "One Liner Notes" file per subject — prelims rewards breadth, not depth; one-line recall is gold.',
    'Make current affairs a daily habit — 90 minutes daily with Vision IAS monthly magazine + Insights IAS Secure; never postpone current affairs.',
    'Practice 30-50 prelims mocks (PT 365 + Vision/Shankar test series); analyse each mock for 60 min — pattern recognition > memorisation.',
    'Use map-based revision for Geography — locate rivers, national parks, straits, mountain ranges; UPSC loves factual map questions.',
    'For Mains answer writing, follow the "intro-body-conclusion" structure with sub-headings, diagrams, maps and stats — 7 minutes per 250-mark answer.',
  ],
  examDayStrategy: [
    'Carry admit card + photo ID; reach the centre 60 min early — UPSC centres have strict frisking and document checks.',
    'In GS Paper 1, attempt the easiest questions first (current affairs + factual); skip "unknown" statements — every wrong answer costs 0.66 + opportunity cost.',
    'Use elimination aggressively — if 2 of 4 statements are clearly wrong, attempt even with 50-50 confidence (positive expected value at this scale).',
    'For CSAT (Paper 2), attempt Reading Comprehension LAST — RC passages in CSAT are time-sinks and often ambiguous.',
    'CSAT is qualifying (33%) — don\'t over-prepare; solve past 5 years\' CSAT papers and Basic Math/Reasoning from RS Aggarwal.',
  ],
  importantDates: [
    { event: 'UPSC Civil Services Notification', date: '14 February (annual)' },
    { event: 'Prelims Application Deadline', date: 'Early March' },
    { event: 'UPSC Prelims Exam', date: 'Late May / Early June' },
    { event: 'Mains Exam', date: 'Mid-September (over 5 days)' },
    { event: 'Personality Test (Interview)', date: 'December – February' },
  ],
};

// ============================================================
// IELTS
// ============================================================
const ielts: StudyMaterial = {
  examId: 'ielts',
  examName: 'IELTS (Academic)',
  examOverview:
    'IELTS (International English Language Testing System) is the world\'s most popular English proficiency test for higher education and global migration, jointly owned by British Council, IDP IELTS and Cambridge. Two streams: Academic (study abroad) and General Training (work/migration). Band score 0-9.',
  examPattern:
    '4 sections: Listening (40 Q, 30 min + 10 min transfer), Reading (40 Q, 60 min), Writing (2 tasks, 60 min), Speaking (11-14 min face-to-face). Total ~2 hr 45 min. Each section scored 0-9; overall band = average (rounded). Most universities require 6.5-7.5 band.',
  totalMarks: 9,
  difficulty: 'Moderate',
  negativeMarking: 'No negative marking; each correct answer = 1 raw mark (Listening/Reading)',
  syllabus: [
    {
      subject: 'Listening',
      weight: 0.25,
      topics: [
        { topic: 'Social Survival', weight: 0.25, subtopics: ['Section 1: Daily Conversation', 'Form Filling', 'Notes Completion'] },
        { topic: 'Academic Survival', weight: 0.25, subtopics: ['Section 2: Monologue', 'Map Labelling', 'Matching'] },
        { topic: 'Academic Discussion', weight: 0.25, subtopics: ['Section 3: Group Conversation', 'Multiple Choice', 'Diagram Labelling'] },
        { topic: 'Academic Lecture', weight: 0.25, subtopics: ['Section 4: Lecture', 'Note Completion', 'Sentence Completion'] },
      ],
    },
    {
      subject: 'Reading (Academic)',
      weight: 0.25,
      topics: [
        { topic: 'Skimming & Scanning', weight: 0.20, subtopics: ['Locating Information', 'Identifying Main Ideas'] },
        { topic: 'Detail Comprehension', weight: 0.25, subtopics: ['Short Answer', 'Sentence Completion', 'Summary Completion'] },
        { topic: 'Inference & Author Purpose', weight: 0.25, subtopics: ['Yes No Not Given', 'Identifying Writer\'s Views'] },
        { topic: 'Vocabulary in Context', weight: 0.15, subtopics: ['Matching Headings', 'Matching Information'] },
        { topic: 'Logical Reasoning', weight: 0.15, subtopics: ['Matching Sentence Endings', 'Multiple Choice'] },
      ],
    },
    {
      subject: 'Writing (Academic)',
      weight: 0.25,
      topics: [
        { topic: 'Task 1 — Describe Visual Data', weight: 0.35, subtopics: ['Line Graph', 'Bar Chart', 'Pie Chart', 'Table', 'Process Diagram', 'Map'] },
        { topic: 'Task 2 — Argumentative Essay', weight: 0.65, subtopics: ['Opinion Essay', 'Discussion Essay', 'Problem Solution', 'Advantages Disadvantages', 'Two-Part Question'] },
      ],
    },
    {
      subject: 'Speaking',
      weight: 0.25,
      topics: [
        { topic: 'Part 1 — Personal Questions', weight: 0.25, subtopics: ['Hometown', 'Studies', 'Work', 'Hobbies', 'Family'] },
        { topic: 'Part 2 — Long Turn (Cue Card)', weight: 0.40, subtopics: ['Describe a Person Place Object', '1-min Prep + 2-min Talk'] },
        { topic: 'Part 3 — Discussion', weight: 0.35, subtopics: ['Opinion on Abstract Topics', 'Speculation', 'Hypothetical'] },
      ],
    },
  ],
  books: [
    { title: 'The Official Cambridge Guide to IELTS', author: 'Pauline Cullen, Amanda French, Vanessa Jakeman', edition: 'Latest', subject: 'All', link: searchLink('Official Cambridge Guide to IELTS Pauline Cullen') },
    { title: 'Cambridge IELTS 1-19 (Practice Tests)', author: 'Cambridge University Press', edition: 'With Answers + Audio', subject: 'Practice Tests', link: searchLink('Cambridge IELTS 1-19 practice tests with answers') },
    { title: 'Barron\'s IELTS Superpack', author: 'Dr. Lin Lougheed', edition: '4th', subject: 'All', link: searchLink('Barrons IELTS Superpack Lin Lougheed') },
    { title: 'Target Band 7: IELTS Academic', author: 'Simone Braverman', edition: 'Latest', subject: 'Strategy', link: searchLink('Simone Braverman Target Band 7 IELTS') },
    { title: 'IELTS Vocabulary Up to Band 6', author: 'Pauline Cullen (Cambridge)', edition: 'Latest', subject: 'Vocabulary', link: searchLink('Cambridge IELTS Vocabulary Up to Band 6') },
    { title: 'English Vocabulary in Use (Advanced)', author: 'Michael McCarthy, Felicity O\'Dell', edition: 'Latest', subject: 'Vocabulary', link: searchLink('English Vocabulary in Use Advanced Cambridge') },
    { title: 'IELTS Advantage Writing Skills', author: 'Richard Brown, Lewis Richards', edition: 'Latest', subject: 'Writing', link: searchLink('IELTS Advantage Writing Skills Brown Richards') },
  ],
  videoCourses: [
    { channel: 'IELTS Liz', title: 'Free IELTS Lessons + Tips', focus: 'The most popular free IELTS YouTube channel', link: searchLink('IELTS Liz YouTube channel') },
    { channel: 'IELTS Advantage', title: 'IELTS Writing + Speaking Strategy', focus: 'Writing Task 1 & 2 walkthroughs', link: searchLink('IELTS Advantage YouTube channel') },
    { channel: 'E2 IELTS', title: 'Academic + General IELTS Strategy', focus: 'Method videos for all 4 sections', link: searchLink('E2 IELTS YouTube channel') },
    { channel: 'IELTS Daily', title: 'Live Classes + Mock Speaking', focus: 'Free live classes by ex-examiners', link: searchLink('IELTS Daily YouTube channel') },
    { channel: 'Fastrack Education', title: 'IELTS Reading + Listening Strategy', focus: 'Question-type strategy videos', link: searchLink('Fastrack Education IELTS YouTube') },
  ],
  onlineCourses: [
    { platform: 'IELTS Liz', course: 'IELTS Video + E-book Course', price: '$30-$99', link: searchLink('IELTS Liz online course') },
    { platform: 'E2 IELTS (E2 Test Prep)', course: 'IELTS Academic Course + Mocks', price: '$30-$99', link: searchLink('E2 IELTS online course') },
    { platform: 'Magoosh IELTS', course: 'IELTS 6-Month Premium', price: '$129-$159', link: searchLink('Magoosh IELTS online course') },
    { platform: 'British Council', course: 'IELTS Coach (Online Tutor-led)', price: '₹5,000-₹25,000', link: searchLink('British Council IELTS Coach online') },
    { platform: 'Kaplan IELTS', course: 'IELTS Prep Plus Self-Paced', price: '$99-$199', link: searchLink('Kaplan IELTS online course') },
  ],
  practiceResources: [
    { name: 'Official Cambridge IELTS Practice Materials (1-19)', provider: 'Cambridge University Press', type: 'Official past papers with audio', link: searchLink('Cambridge IELTS practice materials books') },
    { name: 'British Council Road to IELTS (Free)', provider: 'British Council', type: 'Free online practice with mock tests', link: searchLink('British Council Road to IELTS free') },
    { name: 'IELTS Liz Free Practice', provider: 'IELTS Liz', type: 'Free practice questions + sample answers', link: searchLink('IELTS Liz free practice questions') },
    { name: 'IDP IELTS Free Practice Tests', provider: 'IDP Education', type: 'Free official-style mock tests', link: searchLink('IDP IELTS free practice tests') },
    { name: 'TakeIELTS (British Council) Free Resources', provider: 'British Council', type: 'Free webinars + sample tests', link: searchLink('British Council TakeIELTS free resources') },
  ],
  mobileApps: [
    { name: 'IELTS Prep by British Council', developer: 'British Council', rating: '4.6/5', link: searchLink('IELTS Prep British Council app') },
    { name: 'IELTS Liz App', developer: 'IELTS Liz', rating: '4.5/5', link: searchLink('IELTS Liz app play store') },
    { name: 'Magoosh IELTS Flashcards', developer: 'Magoosh', rating: '4.6/5', link: searchLink('Magoosh IELTS Flashcards app') },
    { name: 'IELTS Practice Band 9', developer: 'LT Software', rating: '4.5/5', link: searchLink('IELTS Practice Band 9 app play store') },
    { name: 'E2 IELTS App', developer: 'E2 Test Prep', rating: '4.5/5', link: searchLink('E2 IELTS app play store') },
  ],
  studyTips: [
    'Practise Listening with Cambridge IELTS 1-19 audio only — no other source matches the accent, speed and question style of the real exam.',
    'For Reading, master the "Yes / No / Not Given" question type — it\'s the #1 reason test takers lose marks; never guess "Not Given" if the passage supports or contradicts.',
    'For Writing Task 1, use a 4-paragraph structure: intro (paraphrase prompt) → overview (2 key features) → body 1 → body 2. Never include personal opinions.',
    'For Task 2 essays, always include a clear thesis in the intro, 2-3 body paragraphs with topic sentences + examples, and a 2-line conclusion. Aim for ~270 words.',
    'Record yourself speaking for 2 minutes daily on a random cue card — listen back for hesitation fillers (um, ah, you know) and pronunciation.',
    'Build a personal vocabulary notebook with 5-8 collocations per topic (Education, Technology, Health, Environment) — examiners reward natural phrasing.',
    'Time yourself strictly in mocks — Listening is exactly 30 min (no pauses), Reading is exactly 60 min, Writing is 60 min (20 for Task 1, 40 for Task 2).',
  ],
  examDayStrategy: [
    'Carry passport (mandatory), admit card printout, and pencils + eraser ( Listening/Reading are paper-based for paper-based IELTS).',
    'For Listening, READ the questions during the 30-40 second gap before each section — predict answer types (number, name, noun).',
    'In Reading, scan the questions first; locate keywords in passage; remember answers come in order (usually).',
    'In Writing Task 1, leave 3-4 minutes to proofread for grammar, spelling, and "a/an/the" articles — they matter for the Lexical Resource band.',
    'For Speaking, expand answers with "Why? When? Example?" — examiners reward extended, natural discourse over short, robotic answers.',
  ],
  importantDates: [
    { event: 'IELTS Test Dates (Computer-delivered)', date: 'Available 7 days a week, 4 times a day' },
    { event: 'IELTS Test Dates (Paper-based)', date: 'Up to 4 fixed dates per month (Saturdays + Thursdays)' },
    { event: 'Score Release (Computer)', date: '3-5 days after test' },
    { event: 'Score Release (Paper)', date: '13 days after test' },
  ],
};

// ============================================================
// TOEFL
// ============================================================
const toefl: StudyMaterial = {
  examId: 'toefl',
  examName: 'TOEFL iBT',
  examOverview:
    'The TOEFL iBT (Test of English as a Foreign Language) is an English-proficiency test for non-native speakers applying to US, Canadian and European universities. Administered by ETS at Prometric centres or as TOEFL iBT Home Edition. Score range 0-120; most top universities require 100+.',
  examPattern:
    'Computer-based test, ~2 hours (since July 2023). 4 sections: Reading (20 Q, 35 min), Listening (28 Q, 36 min), Speaking (4 tasks, 16 min), Writing (2 tasks, 29 min). Each section scored 0-30; total = sum. No negative marking. Reading and Listening are computer-adaptive within section.',
  totalMarks: 120,
  difficulty: 'Moderate',
  negativeMarking: 'No negative marking; attempt every question',
  syllabus: [
    {
      subject: 'Reading',
      weight: 0.25,
      topics: [
        { topic: 'Detail Comprehension', weight: 0.30, subtopics: ['Factual', 'Negative Factual', 'Sentence Simplification'] },
        { topic: 'Inference & Vocabulary', weight: 0.35, subtopics: ['Inference', 'Vocabulary Context', 'Reference'] },
        { topic: 'Author Purpose & Rhetoric', weight: 0.15, subtopics: ['Rhetorical Purpose', 'Author Purpose'] },
        { topic: 'Reading to Learn', weight: 0.20, subtopics: ['Prose Summary', 'Fill in a Table', 'Main Idea'] },
      ],
    },
    {
      subject: 'Listening',
      weight: 0.25,
      topics: [
        { topic: 'Social Conversations', weight: 0.30, subtopics: ['Office Hours', 'Service Encounters'] },
        { topic: 'Academic Lectures', weight: 0.40, subtopics: ['Arts', 'Life Science', 'Physical Science', 'Social Science'] },
        { topic: 'Detail & Inference', weight: 0.20, subtopics: ['Detail', 'Function', 'Stance', 'Inference'] },
        { topic: 'Organisation & Connecting', weight: 0.10, subtopics: ['Organisation', 'Connecting Content'] },
      ],
    },
    {
      subject: 'Speaking',
      weight: 0.25,
      topics: [
        { topic: 'Independent Speaking', weight: 0.25, subtopics: ['Personal Experience', 'Personal Preference'] },
        { topic: 'Integrated Speaking (Read-Listen-Speak)', weight: 0.50, subtopics: ['Campus Situation', 'Academic Reading + Listening'] },
        { topic: 'Integrated Listening-Speaking', weight: 0.25, subtopics: ['Listen then Speak (Academic)'] },
      ],
    },
    {
      subject: 'Writing',
      weight: 0.25,
      topics: [
        { topic: 'Integrated Writing', weight: 0.40, subtopics: ['Read → Listen → Summarise', 'Contrast Reading vs Listening'] },
        { topic: 'Independent Writing (Academic Discussion)', weight: 0.60, subtopics: ['Express Opinion', 'Support with Examples', 'Engage Classmates'] },
      ],
    },
  ],
  books: [
    { title: 'The Official Guide to the TOEFL iBT Test', author: 'Educational Testing Service (ETS)', edition: '6th (2023)', subject: 'All', link: searchLink('ETS Official Guide to the TOEFL iBT Test 6th edition') },
    { title: 'Official TOEFL iBT Tests Volume 1', author: 'ETS', edition: '5th', subject: 'Practice Tests', link: searchLink('ETS Official TOEFL iBT Tests Volume 1') },
    { title: 'Official TOEFL iBT Tests Volume 2', author: 'ETS', edition: '4th', subject: 'Practice Tests', link: searchLink('ETS Official TOEFL iBT Tests Volume 2') },
    { title: 'Barron\'s TOEFL iBT', author: 'Pamela Sharpe', edition: '18th (2024)', subject: 'All', link: searchLink('Barrons TOEFL iBT Pamela Sharpe 18th edition') },
    { title: 'Kaplan TOEFL iBT Premier', author: 'Kaplan Test Prep', edition: '2024-2025', subject: 'All', link: searchLink('Kaplan TOEFL iBT Premier 2024 2025') },
    { title: 'Princeton Review TOEFL iBT Prep', author: 'Princeton Review', edition: '2025', subject: 'All', link: searchLink('Princeton Review TOEFL iBT Prep 2025') },
    { title: 'Delta\'s Key to the TOEFL iBT', author: 'Nancy Gallagher', edition: 'Latest', subject: 'All', link: searchLink('Delta Key to the TOEFL iBT Nancy Gallagher') },
    { title: 'Essential Words for the TOEFL', author: 'Steven J. Matthiesen', edition: 'Latest (Barron\'s)', subject: 'Vocabulary', link: searchLink('Barrons Essential Words for the TOEFL Matthiesen') },
  ],
  videoCourses: [
    { channel: 'TOEFL TV (ETS Official)', title: 'Official TOEFL Tips + Walkthroughs', focus: 'Direct from ETS — official strategies', link: searchLink('TOEFL TV ETS official YouTube') },
    { channel: 'Notefull TOEFL', title: 'TOEFL Strategy + Free Classes', focus: 'Strategy templates for Speaking + Writing', link: searchLink('Notefull TOEFL YouTube channel') },
    { channel: 'Magoosh TOEFL', title: 'TOEFL Concept Videos + Strategy', focus: 'Section-by-section strategy videos', link: searchLink('Magoosh TOEFL YouTube channel') },
    { channel: 'Linguamarina', title: 'TOEFL Speaking + Writing Walkthroughs', focus: 'Real speaking responses + scorer feedback', link: searchLink('Linguamarina TOEFL YouTube channel') },
    { channel: 'Test Prep Insight', title: 'TOEFL Reading + Listening Strategy', focus: 'Question-type strategy walkthroughs', link: searchLink('Test Prep Insight TOEFL YouTube') },
  ],
  onlineCourses: [
    { platform: 'Magoosh TOEFL', course: 'TOEFL Self-Paced 6-Month', price: '$129-$159', link: searchLink('Magoosh TOEFL online course') },
    { platform: 'Kaplan', course: 'TOEFL Live Online / Self-Paced', price: '$199-$899', link: searchLink('Kaplan TOEFL online course') },
    { platform: 'Princeton Review', course: 'TOEFL Self-Paced / Live Course', price: '$299-$1,099', link: searchLink('Princeton Review TOEFL online course') },
    { platform: 'BestMyTest', course: 'TOEFL Self-Study Course', price: '$79-$299', link: searchLink('BestMyTest TOEFL online course') },
    { platform: 'ETS Official TOEFL Online Prep', course: 'TOEFL Test Prep (Official)', price: '$50-$200', link: searchLink('ETS Official TOEFL online prep course') },
  ],
  practiceResources: [
    { name: 'ETS Official TOEFL Free Practice Set', provider: 'ETS', type: 'Free official practice questions + sample test', link: searchLink('ETS official TOEFL free practice set') },
    { name: 'ETS TOEFL Practice Online (TPO)', provider: 'ETS', type: 'Paid official full-length mocks ($45 each)', link: searchLink('ETS TOEFL Practice Online TPO') },
    { name: 'Magoosh Free TOEFL Practice Test', provider: 'Magoosh', type: 'Free full-length mock with diagnostics', link: searchLink('Magoosh TOEFL free practice test') },
    { name: 'BestMyTest TOEFL Practice Tests', provider: 'BestMyTest', type: 'Free + paid full mocks', link: searchLink('BestMyTest TOEFL practice tests') },
    { name: 'Notefull Free Practice + Strategy', provider: 'Notefull', type: 'Free templates + practice questions', link: searchLink('Notefull TOEFL free practice') },
  ],
  mobileApps: [
    { name: 'Magoosh TOEFL Flashcards', developer: 'Magoosh', rating: '4.7/5', link: searchLink('Magoosh TOEFL Flashcards app') },
    { name: 'Official TOEFL Prep App', developer: 'ETS', rating: '4.3/5', link: searchLink('Official TOEFL Prep app play store') },
    { name: 'Ready4 TOEFL', developer: 'Ready4', rating: '4.4/5', link: searchLink('Ready4 TOEFL app play store') },
    { name: 'TestDEN TOEFL Trainer', developer: 'TestDEN', rating: '4.2/5', link: searchLink('TestDEN TOEFL app play store') },
    { name: 'TOEFL Vocabulary Flashcards', developer: ' galofalo LLC', rating: '4.5/5', link: searchLink('TOEFL Vocabulary flashcards app') },
  ],
  studyTips: [
    'Take ETS\'s free Official TOEFL Practice Set early to baseline; then a paid TPO 3-4 weeks before test day for accurate score prediction.',
    'For Speaking tasks 2-4 (Integrated), build a 3-sentence template: "The reading states X. The professor explains Y. This connects to Z." Practice the template until automatic.',
    'For Integrated Writing, NEVER include personal opinion — the task is purely about summarising the listening passage and contrasting it with the reading.',
    'Build a TOEFL-specific vocabulary of 500-700 academic words (Barron\'s Essential Words is gold) — they recur in Reading and Listening passages.',
    'Practice note-taking during Listening — split your page into 2 columns: main points (left) and supporting details (right) for fast reference during questions.',
    'For Speaking Independent Task, structure answers as "Opinion → Reason 1 + Example → Reason 2 + Example → Conclusion" — fits the 45-second limit perfectly.',
    'Type practice is critical — write timed essays on a QWERTY keyboard; 700+ words in 30 min requires muscle memory, not just vocabulary.',
  ],
  examDayStrategy: [
    'For at-home test: prep room per ETS requirements (clear desk, no phone, no other people, photo ID visible). Test in a quiet room with stable internet.',
    'In Reading, scan questions before reading the passage; remember that questions follow passage order — you don\'t need to read everything upfront.',
    'In Listening, take notes only on main ideas and supporting examples — don\'t try to transcribe every word; you\'ll miss key transitions.',
    'In Speaking, never restart your answer — partial credit is awarded; if you stumble, briefly say "Sorry, what I mean is..." and continue.',
    'In Writing, leave 2-3 minutes to proofread for spelling, articles, and subject-verb agreement — grammatical range is 25% of the writing score.',
  ],
  importantDates: [
    { event: 'TOEFL iBT Available', date: 'Year-round (50+ test dates per year)' },
    { event: 'TOEFL iBT Home Edition', date: 'Available 24/7 (subject to proctor availability)' },
    { event: 'Score Release (Reading + Listening)', date: 'Immediately after test' },
    { event: 'Full Score Release (incl. Speaking + Writing)', date: '4-8 days after test (computer) / 6 days (paper)' },
  ],
};

export const STUDY_MATERIALS: Record<string, StudyMaterial> = {
  'jee-main': jeeMain,
  'neet': neet,
  'sat': sat,
  'gre': gre,
  'gmat': gmat,
  'gate': gate,
  'cat': cat,
  'upsc': upsc,
  'ielts': ielts,
  'toefl': toefl,
};

export const STUDY_MATERIAL_EXAM_IDS = Object.keys(STUDY_MATERIALS);
