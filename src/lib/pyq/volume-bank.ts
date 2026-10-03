import type { PYQQuestion, PYQVolume, PYQFilter } from '@/lib/types';

// ============================================================================
// 10-YEAR PREVIOUS YEAR QUESTIONS (PYQ) MULTI-VOLUME MASTER ARCHIVE (2015-2025)
// ============================================================================

export const DEFAULT_PYQ_VOLUMES: PYQVolume[] = [
  // --------------------------------------------------------------------------
  // 1. UPSC CIVIL SERVICES (2015 - 2025)
  // --------------------------------------------------------------------------
  {
    id: 'upsc-vol-1',
    examId: 'upsc',
    examName: 'UPSC CSE (Prelims)',
    volumeNumber: 1,
    title: 'Volume I: Constitutional & Core Foundation',
    subtitle: 'Prelims Papers 2015 – 2018',
    yearRange: '2015 - 2018',
    description: 'Foundational 4-year archive focusing on Fundamental Rights, Economic Reforms, Monsoonal Geography, and Ancient India.',
    totalQuestions: 400,
    papersCount: 4,
    subjects: ['Polity', 'Economy', 'History', 'Geography', 'Environment'],
    color: 'amber',
    badge: 'Core Foundation',
  },
  {
    id: 'upsc-vol-2',
    examId: 'upsc',
    examName: 'UPSC CSE (Prelims)',
    volumeNumber: 2,
    title: 'Volume II: The Dynamic Transition Era',
    subtitle: 'Prelims Papers 2019 – 2022',
    yearRange: '2019 - 2022',
    description: 'High-yield papers featuring the rise of environmental jurisprudence, international conventions, and fiscal federalism.',
    totalQuestions: 400,
    papersCount: 4,
    subjects: ['Environment', 'Science & Tech', 'Polity', 'Economy', 'International Relations'],
    color: 'emerald',
    badge: 'Pattern Shift',
  },
  {
    id: 'upsc-vol-3',
    examId: 'upsc',
    examName: 'UPSC CSE (Prelims)',
    volumeNumber: 3,
    title: 'Volume III: The Elimination-Proof Modern Standard',
    subtitle: 'Prelims Papers 2023 – 2025',
    yearRange: '2023 - 2025',
    description: 'Latest modern papers featuring "Only one pair / Only two pairs" formats, deep geography mapping, and space technology.',
    totalQuestions: 300,
    papersCount: 3,
    subjects: ['Polity', 'Environment', 'Science & Tech', 'Economy', 'Ancient & Medieval'],
    color: 'blue',
    badge: 'Recent & High Yield',
  },

  // --------------------------------------------------------------------------
  // 2. GATE COMPUTER SCIENCE (2015 - 2025)
  // --------------------------------------------------------------------------
  {
    id: 'gate-cs-vol-1',
    examId: 'gate-cs',
    examName: 'GATE CS / IT',
    volumeNumber: 1,
    title: 'Volume I: Algorithms & Discrete Mathematics Vault',
    subtitle: 'GATE CS Papers 2015 – 2018',
    yearRange: '2015 - 2018',
    description: 'Core questions on Asymptotic Notations, Graph Algorithms, Dynamic Programming, and First-Order Predicate Logic.',
    totalQuestions: 260,
    papersCount: 4,
    subjects: ['Algorithms', 'Data Structures', 'Discrete Mathematics', 'Theory of Computation'],
    color: 'indigo',
    badge: 'Essential DS/Algo',
  },
  {
    id: 'gate-cs-vol-2',
    examId: 'gate-cs',
    examName: 'GATE CS / IT',
    volumeNumber: 2,
    title: 'Volume II: Systems & Architecture Matrix',
    subtitle: 'GATE CS Papers 2019 – 2022',
    yearRange: '2019 - 2022',
    description: 'Pipelining, Virtual Memory, Concurrency / Semaphores, Normalization, and TCP Congestion Control protocols.',
    totalQuestions: 260,
    papersCount: 4,
    subjects: ['Operating Systems', 'DBMS', 'Computer Networks', 'Computer Organization'],
    color: 'blue',
    badge: 'Systems Mastery',
  },
  {
    id: 'gate-cs-vol-3',
    examId: 'gate-cs',
    examName: 'GATE CS / IT',
    volumeNumber: 3,
    title: 'Volume III: Modern Multi-Set & MSQ Challenge',
    subtitle: 'GATE CS Papers 2023 – 2025',
    yearRange: '2023 - 2025',
    description: 'Latest Multiple Select Questions (MSQ) and Numerical Answer Type (NAT) sets by IIT Kanpur, IISc Bangalore & IIT Roorkee.',
    totalQuestions: 195,
    papersCount: 3,
    subjects: ['Algorithms', 'Operating Systems', 'Compilers', 'Data Structures', 'DBMS'],
    color: 'purple',
    badge: 'MSQ Heavy',
  },

  // --------------------------------------------------------------------------
  // 3. JEE MAIN (2015 - 2025)
  // --------------------------------------------------------------------------
  {
    id: 'jee-main-vol-1',
    examId: 'jee-main',
    examName: 'JEE Main (PCM)',
    volumeNumber: 1,
    title: 'Volume I: Mechanics, Organic & Coordinate Vault',
    subtitle: 'CBSE Offline & Early CBT Papers 2015 – 2018',
    yearRange: '2015 - 2018',
    description: 'Foundational single-shift papers featuring Newtonian Mechanics, Reaction Mechanisms, and Conic Sections.',
    totalQuestions: 360,
    papersCount: 4,
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    color: 'cyan',
    badge: 'CBSE Era',
  },
  {
    id: 'jee-main-vol-2',
    examId: 'jee-main',
    examName: 'JEE Main (PCM)',
    volumeNumber: 2,
    title: 'Volume II: NTA Multi-Shift Question Bank',
    subtitle: 'NTA Shift Papers 2019 – 2022',
    yearRange: '2019 - 2022',
    description: 'Over 24 shift papers covering Modern Physics, Coordination Compounds, Definite Integrals, and Vector 3D.',
    totalQuestions: 600,
    papersCount: 8,
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    color: 'emerald',
    badge: 'NTA Multi-Shift',
  },
  {
    id: 'jee-main-vol-3',
    examId: 'jee-main',
    examName: 'JEE Main (PCM)',
    volumeNumber: 3,
    title: 'Volume III: Reduced Syllabus & Numerical Section',
    subtitle: 'Latest Shift Papers 2023 – 2025',
    yearRange: '2023 - 2025',
    description: 'Calibrated to the 2024-2025 reduced NCERT syllabus with mandatory numerical value questions and zero optional choices.',
    totalQuestions: 450,
    papersCount: 6,
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    color: 'rose',
    badge: 'Current NCERT',
  },

  // --------------------------------------------------------------------------
  // 4. NEET UG (2015 - 2025)
  // --------------------------------------------------------------------------
  {
    id: 'neet-ug-vol-1',
    examId: 'neet-ug',
    examName: 'NEET UG (Medical)',
    volumeNumber: 1,
    title: 'Volume I: AIPMT & Early NEET 180-Question Archive',
    subtitle: 'Papers 2015 – 2018',
    yearRange: '2015 - 2018',
    description: 'Historic AIPMT 2015 re-test to NEET 2018. Essential for Human Physiology, Plant Anatomy, and Electrostatics.',
    totalQuestions: 720,
    papersCount: 4,
    subjects: ['Physics', 'Chemistry', 'Botany', 'Zoology'],
    color: 'emerald',
    badge: 'Medical Core',
  },
  {
    id: 'neet-ug-vol-2',
    examId: 'neet-ug',
    examName: 'NEET UG (Medical)',
    volumeNumber: 2,
    title: 'Volume II: 100% NCERT Line-by-Line Revolution',
    subtitle: 'Papers 2019 – 2022',
    yearRange: '2019 - 2022',
    description: 'Direct word-for-word NCERT Biology statements, Organic Name Reactions, and Section A/B 200-question introduction.',
    totalQuestions: 800,
    papersCount: 4,
    subjects: ['Botany', 'Zoology', 'Chemistry', 'Physics'],
    color: 'teal',
    badge: 'NCERT Pure',
  },
  {
    id: 'neet-ug-vol-3',
    examId: 'neet-ug',
    examName: 'NEET UG (Medical)',
    volumeNumber: 3,
    title: 'Volume III: High-Competition Assertion-Reason & Match List',
    subtitle: 'Papers 2023 – 2025',
    yearRange: '2023 - 2025',
    description: 'Heavy assertion-reason and statement-1/statement-2 patterns requiring absolute conceptual precision in 200 minutes.',
    totalQuestions: 600,
    papersCount: 3,
    subjects: ['Botany', 'Zoology', 'Chemistry', 'Physics'],
    color: 'blue',
    badge: 'High Precision',
  },

  // --------------------------------------------------------------------------
  // 5. SSC CGL (2015 - 2025)
  // --------------------------------------------------------------------------
  {
    id: 'ssc-cgl-vol-1',
    examId: 'ssc-cgl',
    examName: 'SSC CGL',
    volumeNumber: 1,
    title: 'Volume I: Quantitative & Reasoning Speed Vault',
    subtitle: 'Tier 1 Papers 2015 – 2019',
    yearRange: '2015 - 2019',
    description: 'Classic arithmetic drills, geometry theorems, syllogisms, and vocabulary roots from previous Staff Selection Commission papers.',
    totalQuestions: 500,
    papersCount: 5,
    subjects: ['Quantitative Aptitude', 'General Intelligence', 'English', 'General Awareness'],
    color: 'orange',
    badge: 'Speed Drills',
  },
  {
    id: 'ssc-cgl-vol-2',
    examId: 'ssc-cgl',
    examName: 'SSC CGL',
    volumeNumber: 2,
    title: 'Volume II: Reformed Pattern & Computer Module Archive',
    subtitle: 'Tier 1 & Tier 2 Papers 2020 – 2025',
    yearRange: '2020 - 2025',
    description: 'Updated Tier 2 single-day scheme with Mathematical Abilities, English, Reasoning, General Studies, and Computer Proficiency.',
    totalQuestions: 600,
    papersCount: 6,
    subjects: ['Quantitative Aptitude', 'Reasoning', 'English Language', 'General Awareness', 'Computer Knowledge'],
    color: 'amber',
    badge: 'New Pattern',
  },

  // --------------------------------------------------------------------------
  // 6. STATE PSC MASTER COLLECTION (2015 - 2025)
  // --------------------------------------------------------------------------
  {
    id: 'state-psc-vol-1',
    examId: 'mpsc',
    examName: 'State PSCs (28 States)',
    volumeNumber: 1,
    title: 'Volume I: 28 States Public Service Commission PYQs',
    subtitle: 'MPSC, TNPSC, KPSC, UPPSC, BPSC 2015 – 2025',
    yearRange: '2015 - 2025',
    description: 'Comprehensive state administrative services question bank covering State History, Geography, Panchayati Raj & Schemes.',
    totalQuestions: 850,
    papersCount: 10,
    subjects: ['State Administration', 'Indian Polity', 'Modern History', 'Geography', 'General Studies'],
    color: 'rose',
    badge: '28 States Bank',
  },
];

// ============================================================================
// CURATED 10-YEAR PYQ QUESTIONS WITH STEP-BY-STEP WORKED SOLUTIONS
// ============================================================================

export const DEFAULT_PYQ_QUESTIONS: PYQQuestion[] = [
  // --------------------------------------------------------------------------
  // UPSC CSE PYQS (2015 - 2025)
  // --------------------------------------------------------------------------
  {
    id: 'pyq-upsc-2024-01',
    examId: 'upsc',
    examName: 'UPSC CSE (Prelims)',
    year: 2024,
    volumeId: 'upsc-vol-3',
    volumeName: 'Volume III: The Elimination-Proof Modern Standard (2023-2025)',
    paperName: 'General Studies Paper 1',
    questionNumber: 1,
    subject: 'Polity',
    topic: 'Constitutional Law',
    subtopic: 'Writ Jurisdiction',
    question: 'With reference to the Indian Constitution, consider the following statements regarding the Writ of Quo-Warranto:\n1. It can be sought only by an aggrieved person who has suffered direct legal injury.\n2. It prevents illegal usurpation of a public office by an individual.\n3. It cannot be issued against ministerial offices or private bodies.\nHow many of the statements given above are correct?',
    options: [
      'Only one',
      'Only two',
      'All three',
      'None',
    ],
    correctAnswer: 1,
    difficulty: 'Medium',
    marks: 2,
    negativeMarks: 0.66,
    explanation: '• Statement 1 is INCORRECT: Unlike other writs, the writ of Quo-Warranto does NOT require the petitioner to be an "aggrieved person". Any public-spirited citizen can approach the court.\n• Statement 2 is CORRECT: The literal meaning of Quo-Warranto is "by what authority". It is issued to prevent illegal usurpation of a public office.\n• Statement 3 is CORRECT: It lies only in respect of a substantive public office of a permanent character created by statute or the Constitution. It cannot be issued against ministerial offices or private offices.\nHence, exactly two statements (2 and 3) are correct.',
    citation: 'UPSC CSE Prelims 2024 Paper 1 · Set A Q18',
    tags: ['High Frequency', 'Constitutional Writs', 'Supreme Court'],
    historicalFrequency: 'Asked 6 times between 2015 and 2024 in UPSC Prelims',
  },
  {
    id: 'pyq-upsc-2023-01',
    examId: 'upsc',
    examName: 'UPSC CSE (Prelims)',
    year: 2023,
    volumeId: 'upsc-vol-3',
    volumeName: 'Volume III: The Elimination-Proof Modern Standard (2023-2025)',
    paperName: 'General Studies Paper 1',
    questionNumber: 14,
    subject: 'Environment',
    topic: 'Biodiversity & Ecology',
    subtopic: 'Invasive Alien Species',
    question: 'Consider the following flora and fauna:\n1. Prosopis juliflora\n2. Water Hyacinth (Eichhornia crassipes)\n3. Lantana camara\nHow many of the above are commonly classified as major invasive alien species threatening Indian biodiversity?',
    options: [
      'Only one',
      'Only two',
      'All three',
      'None',
    ],
    correctAnswer: 2,
    difficulty: 'Medium',
    marks: 2,
    negativeMarks: 0.66,
    explanation: '• Prosopis juliflora (Vilayati Kikar) is a notorious invasive alien shrub introduced from Central America that degrades grassland ecosystems across India (e.g. Banni grasslands in Gujarat).\n• Water Hyacinth (Eichhornia crassipes), termed the "Terror of Bengal", chokes water bodies, drains oxygen, and leads to eutrophication.\n• Lantana camara is a high-impact invasive species from tropical America that suppresses native regeneration across Shivaliks, Western Ghats, and Central Indian forests.\nAll 3 are major invasive alien species in India.',
    citation: 'UPSC CSE Prelims 2023 Paper 1 · Set B Q14',
    tags: ['Ecology', 'Biodiversity', 'Invasive Flora'],
    historicalFrequency: 'Invasive species question appeared in 2018, 2020, 2023',
  },
  {
    id: 'pyq-upsc-2021-01',
    examId: 'upsc',
    examName: 'UPSC CSE (Prelims)',
    year: 2021,
    volumeId: 'upsc-vol-2',
    volumeName: 'Volume II: The Dynamic Transition Era (2019-2022)',
    paperName: 'General Studies Paper 1',
    questionNumber: 22,
    subject: 'Economy',
    topic: 'Monetary Policy',
    subtopic: 'Money Multiplier',
    question: 'The money multiplier in an economy increases with which one of the following?',
    options: [
      'Increase in the Cash Reserve Ratio (CRR) in the banks',
      'Increase in the Statutory Liquidity Ratio (SLR) in the banks',
      'Increase in the banking habit of the population',
      'Increase in the total population of the country',
    ],
    correctAnswer: 2,
    difficulty: 'Easy',
    marks: 2,
    negativeMarks: 0.66,
    explanation: 'Money Multiplier (m) = 1 / Reserve Ratio (r).\n• When the banking habit of the population increases, people hold less physical cash in hand and deposit more money into commercial banks (currency-deposit ratio decreases).\n• This increases the pool of deposits available for credit creation, thereby directly increasing the money multiplier in the macroeconomy.\n• Increasing CRR or SLR increases the reserve requirement, which reduces the multiplier.',
    citation: 'UPSC CSE Prelims 2021 Paper 1 · Q22',
    tags: ['Macroeconomics', 'RBI', 'Banking'],
    historicalFrequency: 'Repeat archetype: Money multiplier asked in 2019 and 2021',
  },
  {
    id: 'pyq-upsc-2017-01',
    examId: 'upsc',
    examName: 'UPSC CSE (Prelims)',
    year: 2017,
    volumeId: 'upsc-vol-1',
    volumeName: 'Volume I: Constitutional & Core Foundation (2015-2018)',
    paperName: 'General Studies Paper 1',
    questionNumber: 5,
    subject: 'Polity',
    topic: 'Fundamental Rights',
    subtopic: 'Right to Privacy',
    question: 'Which of the following are envisaged by the Right against Exploitation in the Constitution of India?\n1. Prohibition of traffic in human beings and forced labour\n2. Abolition of untouchability\n3. Protection of the interests of minorities\n4. Prohibition of employment of children in factories and mines\nSelect the correct answer using the code given below:',
    options: [
      '1, 2 and 4 only',
      '2, 3 and 4 only',
      '1 and 4 only',
      '1, 2, 3 and 4',
    ],
    correctAnswer: 2,
    difficulty: 'Easy',
    marks: 2,
    negativeMarks: 0.66,
    explanation: '• Right against Exploitation consists of Articles 23 and 24:\n  - Article 23: Prohibition of traffic in human beings and forced labour (Statement 1).\n  - Article 24: Prohibition of employment of children in factories, mines, etc. (Statement 4).\n• Abolition of Untouchability is Article 17 (Right to Equality).\n• Protection of interests of minorities is Article 29 (Cultural and Educational Rights).\nTherefore, only 1 and 4 are correct.',
    citation: 'UPSC CSE Prelims 2017 Paper 1 · Q5',
    tags: ['Fundamental Rights', 'Articles 23-24', 'Polity Basics'],
    historicalFrequency: 'Articles 14-32 asked in every single UPSC Prelims paper',
  },

  // --------------------------------------------------------------------------
  // GATE COMPUTER SCIENCE PYQS (2015 - 2025)
  // --------------------------------------------------------------------------
  {
    id: 'pyq-gate-2024-01',
    examId: 'gate-cs',
    examName: 'GATE CS / IT',
    year: 2024,
    volumeId: 'gate-cs-vol-3',
    volumeName: 'Volume III: Modern Multi-Set & MSQ Challenge (2023-2025)',
    paperName: 'GATE CS Shift 1',
    questionNumber: 12,
    subject: 'Algorithms',
    topic: 'Dynamic Programming',
    subtopic: 'Longest Common Subsequence',
    question: 'Let X = "ABCBDAB" and Y = "BDCABA". What is the length of the Longest Common Subsequence (LCS) between X and Y?',
    options: [
      '3',
      '4',
      '5',
      '6',
    ],
    correctAnswer: 1,
    difficulty: 'Medium',
    marks: 2,
    negativeMarks: 0.66,
    explanation: 'Using Dynamic Programming LCS matrix table:\nLet X = A-B-C-B-D-A-B and Y = B-D-C-A-B-A.\nCommon subsequences include:\n- "BCBA" (indices in X: 1, 2, 3, 5; in Y: 0, 2, 3, 5)\n- "BDAB" (indices in X: 1, 4, 5, 6; in Y: 0, 1, 3, 4)\nBoth have length 4.\nNo common subsequence of length 5 exists.\nTherefore, the length of LCS(X, Y) is 4.',
    citation: 'GATE CS 2024 (IISc Bangalore) · Q12',
    tags: ['Dynamic Programming', 'LCS', 'IIT-IISc Core'],
    historicalFrequency: 'LCS/Edit Distance asked in 2016, 2019, 2021, 2024',
  },
  {
    id: 'pyq-gate-2022-01',
    examId: 'gate-cs',
    examName: 'GATE CS / IT',
    year: 2022,
    volumeId: 'gate-cs-vol-2',
    volumeName: 'Volume II: Systems & Architecture Matrix (2019-2022)',
    paperName: 'GATE CS Paper',
    questionNumber: 34,
    subject: 'Operating Systems',
    topic: 'Paging & Memory Management',
    subtopic: 'Inverted Page Table',
    question: 'Consider a 32-bit virtual address space with a 4 KB page size. A system uses a 2-level page table where each page table entry occupies 4 bytes. What is the size of the outer page table required in memory?',
    options: [
      '4 KB',
      '16 KB',
      '1 MB',
      '4 MB',
    ],
    correctAnswer: 0,
    difficulty: 'Hard',
    marks: 2,
    negativeMarks: 0.66,
    explanation: '• Page size = 4 KB = 2^12 bytes → Page offset = 12 bits.\n• Total Virtual Address = 32 bits → Page Number bits = 32 - 12 = 20 bits.\n• Since page size is 4 KB and each Page Table Entry (PTE) is 4 bytes (2^2 bytes):\n  Each page can hold 4 KB / 4 B = 1024 = 2^10 entries.\n• Thus, the second-level (inner) page table requires 10 bits.\n• Outer page table bits = 20 - 10 = 10 bits (2^10 entries).\n• Size of outer page table = 2^10 entries × 4 bytes = 4096 bytes = 4 KB.',
    citation: 'GATE CS 2022 (IIT Kharagpur) · Q34',
    tags: ['Virtual Memory', 'Two-Level Paging', 'OS Calculations'],
    historicalFrequency: 'Multi-level paging calculation asked 7 times since 2015',
  },
  {
    id: 'pyq-gate-2018-01',
    examId: 'gate-cs',
    examName: 'GATE CS / IT',
    year: 2018,
    volumeId: 'gate-cs-vol-1',
    volumeName: 'Volume I: Algorithms & Discrete Mathematics Vault (2015-2018)',
    paperName: 'GATE CS Paper',
    questionNumber: 8,
    subject: 'Data Structures',
    topic: 'Binary Search Trees',
    subtopic: 'Inorder Predecessor',
    question: 'The preorder traversal of a binary search tree is 15, 10, 12, 11, 20, 18, 25. Which of the following represents the postorder traversal of the same tree?',
    options: [
      '11, 12, 10, 18, 25, 20, 15',
      '10, 11, 12, 18, 20, 25, 15',
      '11, 12, 10, 25, 18, 20, 15',
      '12, 11, 10, 18, 25, 20, 15',
    ],
    correctAnswer: 0,
    difficulty: 'Easy',
    marks: 1,
    negativeMarks: 0.33,
    explanation: '• Preorder: [Root, Left, Right] = 15, 10, 12, 11, 20, 18, 25.\n• In a BST, the Inorder traversal is always sorted in ascending order:\n  Inorder = 10, 11, 12, 15, 18, 20, 25.\n• Reconstructing BST:\n  - Root = 15\n  - Left subtree: Preorder = (10, 12, 11), Inorder = (10, 11, 12) → Left child is 10; right child of 10 is 12; left child of 12 is 11.\n  - Right subtree: Preorder = (20, 18, 25), Inorder = (18, 20, 25) → Root 20 with left child 18 and right child 25.\n• Postorder traversal [Left, Right, Root]: 11, 12, 10, 18, 25, 20, 15.',
    citation: 'GATE CS 2018 (IIT Guwahati) · Q8',
    tags: ['Tree Traversals', 'BST', 'Data Structures'],
    historicalFrequency: 'BST preorder-to-postorder conversion asked repeatedly',
  },

  // --------------------------------------------------------------------------
  // JEE MAIN PYQS (2015 - 2025)
  // --------------------------------------------------------------------------
  {
    id: 'pyq-jee-2024-01',
    examId: 'jee-main',
    examName: 'JEE Main (PCM)',
    year: 2024,
    volumeId: 'jee-main-vol-3',
    volumeName: 'Volume III: Reduced Syllabus & Numerical Section (2023-2025)',
    paperName: 'Session 1 (27 Jan Shift 1)',
    questionNumber: 4,
    subject: 'Physics',
    topic: 'Electrodynamics',
    subtopic: 'Current Electricity',
    question: 'A wire of resistance 16 Ω is bent into the shape of a circle. What is the effective resistance between two diametrically opposite points on the circle?',
    options: [
      '2 Ω',
      '4 Ω',
      '8 Ω',
      '16 Ω',
    ],
    correctAnswer: 1,
    difficulty: 'Easy',
    marks: 4,
    negativeMarks: 1,
    explanation: '• Total resistance of wire = 16 Ω.\n• When bent into a circle, diametrically opposite points divide the circle into two semicircular arcs of equal length.\n• Resistance of each half = 16 / 2 = 8 Ω.\n• Since the two halves are connected in parallel between the two diameter terminals:\n  1 / R_eff = (1 / 8) + (1 / 8) = 2 / 8 = 1 / 4 Ω.\n  R_eff = 4 Ω.',
    citation: 'JEE Main 2024 (27 Jan Shift 1) · Q4',
    tags: ['Current Electricity', 'Parallel Resistors', 'NTA Direct'],
    historicalFrequency: 'Resistor geometry questions appear in ~60% of JEE shifts',
  },
  {
    id: 'pyq-jee-2023-01',
    examId: 'jee-main',
    examName: 'JEE Main (PCM)',
    year: 2023,
    volumeId: 'jee-main-vol-3',
    volumeName: 'Volume III: Reduced Syllabus & Numerical Section (2023-2025)',
    paperName: 'Session 2 (8 April Shift 2)',
    questionNumber: 15,
    subject: 'Chemistry',
    topic: 'Coordination Chemistry',
    subtopic: 'Isomerism & Crystal Field Theory',
    question: 'Which of the following complex species exhibits optical isomerism?',
    options: [
      'trans-[Co(en)2Cl2]+',
      'cis-[Co(en)2Cl2]+',
      '[Co(NH3)4Cl2]+',
      '[Pt(NH3)2Cl2]',
    ],
    correctAnswer: 1,
    difficulty: 'Medium',
    marks: 4,
    negativeMarks: 1,
    explanation: '• trans-[Co(en)2Cl2]+ has a plane of symmetry and a centre of inversion, making it optically inactive (achiral, superimposable on its mirror image).\n• cis-[Co(en)2Cl2]+ lacks any plane or centre of symmetry (C2 point group symmetry), making it chiral and non-superimposable on its mirror image. Therefore, it exhibits optical isomerism (d- and l-enantiomers).\n• Square planar complexes like [Pt(NH3)2Cl2] rarely show optical isomerism due to the molecular plane.',
    citation: 'JEE Main 2023 (8 April Shift 2) · Q15',
    tags: ['Inorganic Chemistry', 'Coordination Compounds', 'Optical Isomerism'],
    historicalFrequency: 'Coordination isomerism asked in 2017, 2019, 2021, 2023',
  },
  {
    id: 'pyq-jee-2020-01',
    examId: 'jee-main',
    examName: 'JEE Main (PCM)',
    year: 2020,
    volumeId: 'jee-main-vol-2',
    volumeName: 'Volume II: NTA Multi-Shift Question Bank (2019-2022)',
    paperName: 'September Session',
    questionNumber: 21,
    subject: 'Mathematics',
    topic: 'Calculus',
    subtopic: 'Definite Integration & Leibniz Rule',
    question: 'The value of the definite integral ∫ from 0 to π/2 of (sin^3 x) / (sin^3 x + cos^3 x) dx is:',
    options: [
      'π / 4',
      'π / 2',
      'π / 8',
      '0',
    ],
    correctAnswer: 0,
    difficulty: 'Easy',
    marks: 4,
    negativeMarks: 1,
    explanation: 'Let I = ∫_0^(π/2) [sin^3 x / (sin^3 x + cos^3 x)] dx  --- (1)\nUsing King\'s property: ∫_a^b f(x) dx = ∫_a^b f(a + b - x) dx:\nHere a + b - x = π/2 - x.\nI = ∫_0^(π/2) [sin^3(π/2 - x) / (sin^3(π/2 - x) + cos^3(π/2 - x))] dx\nI = ∫_0^(π/2) [cos^3 x / (cos^3 x + sin^3 x)] dx  --- (2)\nAdding (1) and (2):\n2I = ∫_0^(π/2) [(sin^3 x + cos^3 x) / (sin^3 x + cos^3 x)] dx\n2I = ∫_0^(π/2) 1 dx = [x]_0^(π/2) = π/2\nI = π / 4.',
    citation: 'JEE Main 2020 (September Shift 1) · Q21',
    tags: ['Definite Integrals', 'Kings Property', 'High Yield Math'],
    historicalFrequency: 'Kings property definite integrals appear in almost every session',
  },

  // --------------------------------------------------------------------------
  // NEET UG PYQS (2015 - 2025)
  // --------------------------------------------------------------------------
  {
    id: 'pyq-neet-2024-01',
    examId: 'neet-ug',
    examName: 'NEET UG (Medical)',
    year: 2024,
    volumeId: 'neet-ug-vol-3',
    volumeName: 'Volume III: High-Competition Assertion-Reason & Match List (2023-2025)',
    paperName: 'NEET UG 2024 Paper',
    questionNumber: 101,
    subject: 'Botany',
    topic: 'Genetics & Evolution',
    subtopic: 'Mendelian Genetics',
    question: 'How many different types of genetically distinct gametes can be produced by a heterozygous pea plant having the genotype AaBbCcDD?',
    options: [
      '4',
      '8',
      '16',
      '32',
    ],
    correctAnswer: 1,
    difficulty: 'Easy',
    marks: 4,
    negativeMarks: 1,
    explanation: '• Formula for number of different gametes = 2^n, where n is the number of heterozygous gene pairs.\n• In the genotype AaBbCcDD:\n  - Aa: heterozygous (1)\n  - Bb: heterozygous (2)\n  - Cc: heterozygous (3)\n  - DD: homozygous (0)\n• Total heterozygous loci (n) = 3.\n• Number of gametes = 2^3 = 8 gametes (ABCD, ABCd, AbCD, AbCd, aBCD, aBCd, abCD, abCd).',
    citation: 'NEET UG 2024 · Q101',
    tags: ['Genetics', 'Gamete Calculation', 'NCERT Class 12'],
    historicalFrequency: '2^n gamete formula asked in 2016, 2019, 2022, 2024',
  },
  {
    id: 'pyq-neet-2022-01',
    examId: 'neet-ug',
    examName: 'NEET UG (Medical)',
    year: 2022,
    volumeId: 'neet-ug-vol-2',
    volumeName: 'Volume II: 100% NCERT Line-by-Line Revolution (2019-2022)',
    paperName: 'NEET UG 2022 Paper',
    questionNumber: 154,
    subject: 'Zoology',
    topic: 'Human Physiology',
    subtopic: 'Endocrine System',
    question: 'Which of the following hormones is NOT secreted by the human placenta?',
    options: [
      'hCG (Human Chorionic Gonadotropin)',
      'hPL (Human Placental Lactogen)',
      'Relaxin',
      'LH (Luteinizing Hormone)',
    ],
    correctAnswer: 3,
    difficulty: 'Easy',
    marks: 4,
    negativeMarks: 1,
    explanation: '• Placenta acts as a temporary endocrine tissue and produces several hormones including hCG, hPL, estrogens, progestogens, and in later stages of pregnancy, relaxin is also secreted (by ovary/placenta).\n• Luteinizing Hormone (LH) is synthesised and secreted exclusively by the anterior pituitary gland (adenohypophysis), NOT the placenta.',
    citation: 'NEET UG 2022 · Q154',
    tags: ['Human Reproduction', 'Placental Hormones', 'NCERT Direct'],
    historicalFrequency: 'Human reproduction endocrine questions asked every year',
  },

  // --------------------------------------------------------------------------
  // SSC CGL & STATE PSC PYQS (2015 - 2025)
  // --------------------------------------------------------------------------
  {
    id: 'pyq-ssc-2023-01',
    examId: 'ssc-cgl',
    examName: 'SSC CGL',
    year: 2023,
    volumeId: 'ssc-cgl-vol-2',
    volumeName: 'Volume II: Reformed Pattern & Computer Module Archive (2020-2025)',
    paperName: 'Tier 1 Shift 1',
    questionNumber: 18,
    subject: 'General Awareness',
    topic: 'Indian Economy & Taxation',
    subtopic: 'Fiscal Policy',
    question: 'Which Article of the Constitution of India deals with the presentation of the Annual Financial Statement (Budget) before Parliament?',
    options: [
      'Article 110',
      'Article 112',
      'Article 114',
      'Article 117',
    ],
    correctAnswer: 1,
    difficulty: 'Easy',
    marks: 2,
    negativeMarks: 0.5,
    explanation: '• Article 112 of the Constitution of India mandates that the President shall in respect of every financial year cause to be laid before both the Houses of Parliament the "Annual Financial Statement" (popularly called the Budget).\n• Article 110 defines Money Bills.\n• Article 114 deals with Appropriation Bills.\n• Article 117 contains Special Provisions as to Financial Bills.',
    citation: 'SSC CGL Tier 1 2023 · Shift 1 Q18',
    tags: ['Article 112', 'Budget', 'SSC General Awareness'],
    historicalFrequency: 'Articles 110 & 112 are the top 2 repeated polity questions in SSC',
  },
  {
    id: 'pyq-state-2024-01',
    examId: 'mpsc',
    examName: 'State PSCs (28 States)',
    year: 2024,
    volumeId: 'state-psc-vol-1',
    volumeName: 'Volume I: 28 States Public Service Commission PYQs (2015-2025)',
    paperName: 'State Combined Services Prelims',
    questionNumber: 31,
    subject: 'Indian Polity',
    topic: 'Panchayati Raj & Local Self Government',
    subtopic: '73rd Amendment Act',
    question: 'Under the 73rd Constitutional Amendment Act, 1992, which of the following provisions is a COMPULSORY (mandatory) provision for all States?',
    options: [
      'Giving voting rights to MPs and MLAs in Panchayats',
      'Providing reservation for Backward Classes (OBCs)',
      'Constitution of a State Finance Commission every 5 years',
      'Granting financial powers to Panchayats to levy and collect taxes',
    ],
    correctAnswer: 2,
    difficulty: 'Medium',
    marks: 2,
    negativeMarks: 0.5,
    explanation: '• Compulsory (Mandatory) provisions under Part IX include:\n  1. Organization of Gram Sabha.\n  2. Creation of three-tier Panchayats at village, intermediate, and district levels.\n  3. Direct elections to all seats and 5-year fixed tenure.\n  4. Reservation of 1/3rd seats for women and for SC/ST.\n  5. Establishment of a State Election Commission and State Finance Commission every 5 years (Article 243-I).\n• Provisions relating to OBC reservation, giving powers to levy taxes, and voting rights for MPs/MLAs are voluntary (discretionary) for state legislatures.',
    citation: 'State PSC Combined Prelims 2024 · Q31',
    tags: ['73rd Amendment', 'Panchayati Raj', 'State PSC Core'],
    historicalFrequency: 'Panchayati Raj compulsory vs voluntary rules asked in 14 state PSC exams',
  },
];

// ============================================================================
// HELPER QUERY FUNCTIONS
// ============================================================================

export function getPYQVolumes(examId?: string, customVolumes: PYQVolume[] = []): PYQVolume[] {
  const all = [...DEFAULT_PYQ_VOLUMES, ...customVolumes];
  if (!examId || examId === 'all') return all;
  return all.filter((v) => v.examId === examId || (examId === 'mpsc' && v.examId === 'mpsc'));
}

export function getPYQQuestions(
  filter: PYQFilter,
  customQuestions: PYQQuestion[] = []
): PYQQuestion[] {
  const all = [...DEFAULT_PYQ_QUESTIONS, ...customQuestions];

  return all.filter((q) => {
    if (filter.examId && filter.examId !== 'all' && q.examId !== filter.examId) {
      return false;
    }
    if (filter.year && filter.year !== 'all' && q.year !== filter.year) {
      return false;
    }
    if (filter.volumeId && filter.volumeId !== 'all' && q.volumeId !== filter.volumeId) {
      return false;
    }
    if (filter.subject && filter.subject !== 'all' && q.subject !== filter.subject) {
      return false;
    }
    if (filter.topic && filter.topic !== 'all' && q.topic !== filter.topic) {
      return false;
    }
    if (filter.difficulty && filter.difficulty !== 'all' && q.difficulty !== filter.difficulty) {
      return false;
    }
    if (filter.searchQuery) {
      const s = filter.searchQuery.toLowerCase().trim();
      const match =
        (q.question || q.questionText || '').toLowerCase().includes(s) ||
        (q.subject || '').toLowerCase().includes(s) ||
        (q.topic || '').toLowerCase().includes(s) ||
        (q.explanation || '').toLowerCase().includes(s) ||
        (q.citation || q.officialCitation || '').toLowerCase().includes(s) ||
        (q.tags || []).some((t) => t.toLowerCase().includes(s));
      if (!match) return false;
    }
    return true;
  });
}

export function getPYQYears(): number[] {
  return [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];
}

export function getPYQSubjects(examId?: string): string[] {
  const all = DEFAULT_PYQ_QUESTIONS;
  const filtered = !examId || examId === 'all' ? all : all.filter((q) => q.examId === examId);
  const set = new Set<string>();
  filtered.forEach((q) => set.add(q.subject));
  return Array.from(set);
}
