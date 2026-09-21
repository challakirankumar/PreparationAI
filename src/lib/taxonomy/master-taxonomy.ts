export interface SubtopicNode {
  id: string;
  name: string;
  difficulty?: 'Foundational' | 'Intermediate' | 'Advanced' | 'Mastery';
  estimatedHours?: number;
  questionCount?: number;
}

export interface TopicNode {
  id: string;
  name: string;
  weightagePercent?: number;
  subtopics: SubtopicNode[];
}

export interface SubjectNode {
  id: string;
  name: string;
  code?: string;
  description?: string;
  totalMarks?: number;
  topics: TopicNode[];
}

export interface StreamOrPaperNode {
  id: string;
  code: string;
  name: string;
  category?: string;
  eligibleDegrees?: string[];
  subjects: SubjectNode[];
}

export interface ExamHierarchyNode {
  id: string;
  code: string;
  name: string;
  fullName: string;
  conductingBody: string;
  category: 'gate' | 'upsc' | 'ssc' | 'banking' | 'regulatory' | 'railways' | 'state-psc' | 'state-subordinate' | 'police' | 'defence' | 'ugc-net' | 'csir-net' | 'technical-psu' | 'teaching' | 'management' | 'pg-engineering' | 'cuet-pg' | 'law' | 'medical' | 'nursing' | 'agriculture' | 'statistics-economics' | 'insurance' | 'judiciary' | 'district-govt' | 'phd-research' | 'cs-ai-hub' | 'corporate-it' | 'professional' | 'specialized-pg';
  stateOrRegion: string;
  notificationFrequency: 'Annual' | 'Bi-Annual' | 'Rolling / As Notified' | 'Triennial';
  isCSOrAIRelated?: boolean;
  streamsOrPapers: StreamOrPaperNode[];
}

export interface MasterExamCategory {
  id: string;
  title: string;
  description: string;
  iconName: string;
  badge: string;
  examCount: number;
  exams: ExamHierarchyNode[];
}

// ============================================================================
// 1. GATE (30 PAPERS FULL TAXONOMY)
// ============================================================================
export const GATE_PAPERS_30: StreamOrPaperNode[] = [
  {
    id: 'gate-cs',
    code: 'CS',
    name: 'Computer Science & Information Technology',
    eligibleDegrees: ['B.Tech/BE in CS/IT/ECE/EE', 'MCA', 'M.Sc (CS/IT)'],
    subjects: [
      {
        id: 'gate-cs-os',
        name: 'Operating Systems',
        topics: [
          {
            id: 'gate-cs-os-pm',
            name: 'Process Management',
            weightagePercent: 18,
            subtopics: [
              { id: 'cs-os-cpu-sched', name: 'CPU Scheduling Algorithms (FCFS, SJF, SRTF, RR, Priority, Multilevel)' },
              { id: 'cs-os-threads', name: 'Threads, Process Synchronization & Critical Section' },
              { id: 'cs-os-semaphores', name: 'Semaphores, Mutex & Classical IPC Problems (Dining Philosophers, Readers-Writers)' },
              { id: 'cs-os-deadlocks', name: 'Deadlock Detection, Prevention, Avoidance (Banker\'s Algorithm) & Recovery' }
            ]
          },
          {
            id: 'gate-cs-os-mm',
            name: 'Memory Management',
            weightagePercent: 15,
            subtopics: [
              { id: 'cs-os-paging', name: 'Paging, Segmentation & Multi-level Paging' },
              { id: 'cs-os-vmem', name: 'Virtual Memory, Page Replacement (FIFO, LRU, Optimal, Second Chance)' },
              { id: 'cs-os-thrashing', name: 'Thrashing & Working Set Model' }
            ]
          },
          {
            id: 'gate-cs-os-fs',
            name: 'File Systems & I/O Systems',
            weightagePercent: 10,
            subtopics: [
              { id: 'cs-os-disk-sched', name: 'Disk Scheduling (FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK)' },
              { id: 'cs-os-file-alloc', name: 'File Allocation Methods (Contiguous, Linked, Indexed)' }
            ]
          }
        ]
      },
      {
        id: 'gate-cs-dsa',
        name: 'Data Structures & Algorithms',
        topics: [
          {
            id: 'gate-cs-algo-design',
            name: 'Algorithm Design & Analysis',
            weightagePercent: 22,
            subtopics: [
              { id: 'cs-algo-asymptotic', name: 'Asymptotic Analysis (Big-O, Omega, Theta, Master Theorem)' },
              { id: 'cs-algo-divide-conquer', name: 'Divide and Conquer (Merge Sort, Quick Sort, Binary Search)' },
              { id: 'cs-algo-greedy', name: 'Greedy Algorithms (Huffman, Prim\'s, Kruskal\'s, Dijkstra\'s)' },
              { id: 'cs-algo-dp', name: 'Dynamic Programming (0/1 Knapsack, LCS, Matrix Chain Multiplication, Floyd-Warshall)' },
              { id: 'cs-algo-graphs', name: 'Graph Traversals (BFS, DFS, Topological Sort, Strongly Connected Components)' }
            ]
          },
          {
            id: 'gate-cs-ds-core',
            name: 'Data Structures',
            weightagePercent: 18,
            subtopics: [
              { id: 'cs-ds-trees', name: 'Binary Search Trees, AVL Trees, B/B+ Trees & Heaps' },
              { id: 'cs-ds-hashing', name: 'Hash Tables, Collision Resolution & Open Addressing' }
            ]
          }
        ]
      },
      {
        id: 'gate-cs-dbms',
        name: 'Database Management Systems',
        topics: [
          {
            id: 'gate-cs-dbms-sql-rel',
            name: 'Relational Model & SQL',
            weightagePercent: 15,
            subtopics: [
              { id: 'cs-dbms-rel-alg', name: 'Relational Algebra & Tuple Relational Calculus' },
              { id: 'cs-dbms-sql-queries', name: 'Complex SQL, Subqueries, Joins & Aggregations' },
              { id: 'cs-dbms-normalization', name: 'Functional Dependencies, 1NF, 2NF, 3NF, BCNF, 4NF' },
              { id: 'cs-dbms-transactions', name: 'ACID Properties, Concurrency Control, 2PL, Serializability & Recovery' }
            ]
          }
        ]
      },
      {
        id: 'gate-cs-cn',
        name: 'Computer Networks',
        topics: [
          {
            id: 'gate-cs-cn-layers',
            name: 'Network Protocols & Architecture',
            weightagePercent: 14,
            subtopics: [
              { id: 'cs-cn-ip-routing', name: 'IPv4/IPv6 Addressing, Subnetting, CIDR & Routing Algorithms (DVR, LSR)' },
              { id: 'cs-cn-transport', name: 'TCP/UDP, Flow Control (Sliding Window, Go-Back-N, SR), Congestion Control' },
              { id: 'cs-cn-app', name: 'Application Protocols (DNS, HTTP, SMTP, FTP, DHCP)' }
            ]
          }
        ]
      },
      {
        id: 'gate-cs-toc-cd',
        name: 'Theory of Computation & Compiler Design',
        topics: [
          {
            id: 'gate-cs-toc-aut',
            name: 'Automata & Formal Languages',
            weightagePercent: 16,
            subtopics: [
              { id: 'cs-toc-fa-re', name: 'DFA, NFA, Regular Expressions & Pumping Lemma' },
              { id: 'cs-toc-cfg-pda', name: 'Context-Free Grammars, Pushdown Automata & Turing Machines' },
              { id: 'cs-toc-undecidability', name: 'Decidability, Halting Problem & Reducibility' },
              { id: 'cs-cd-parsing', name: 'Lexical Analysis, LL(1), LR(0), SLR(1), LALR(1), CLR(1) Parsing' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'gate-da',
    code: 'DA',
    name: 'Data Science & Artificial Intelligence',
    eligibleDegrees: ['B.Tech/BE in CS/IT/Data Science/AI/ECE/EE/Math', 'MCA', 'M.Sc (Stats/CS/Math)'],
    subjects: [
      {
        id: 'gate-da-ml',
        name: 'Machine Learning',
        topics: [
          {
            id: 'gate-da-ml-sup',
            name: 'Supervised Learning',
            weightagePercent: 25,
            subtopics: [
              { id: 'da-ml-classification', name: 'Classification (Logistic Regression, Decision Trees, Random Forests, SVM, Naive Bayes)' },
              { id: 'da-ml-regression', name: 'Linear Regression, Ridge, Lasso, ElasticNet, Polynomial Regression' },
              { id: 'da-ml-eval', name: 'Model Evaluation (Confusion Matrix, Precision-Recall, ROC-AUC, Bias-Variance Tradeoff)' }
            ]
          },
          {
            id: 'gate-da-ml-unsup',
            name: 'Unsupervised Learning',
            weightagePercent: 15,
            subtopics: [
              { id: 'da-ml-clustering', name: 'Clustering (K-Means, Hierarchical, DBSCAN, Gaussian Mixture Models)' },
              { id: 'da-ml-dim-reduction', name: 'Dimensionality Reduction (PCA, t-SNE, SVD, Autoencoders)' }
            ]
          }
        ]
      },
      {
        id: 'gate-da-ai',
        name: 'Artificial Intelligence',
        topics: [
          {
            id: 'gate-da-ai-search',
            name: 'Search & Knowledge Representation',
            weightagePercent: 18,
            subtopics: [
              { id: 'da-ai-uninformed', name: 'Uninformed Search (BFS, DFS, Uniform Cost, Iterative Deepening)' },
              { id: 'da-ai-informed', name: 'Informed Search (A*, Greedy Best-First, IDA*, Heuristics)' },
              { id: 'da-ai-adversarial', name: 'Adversarial Search (Minimax Algorithm, Alpha-Beta Pruning)' },
              { id: 'da-ai-logic', name: 'Propositional & First-Order Predicate Logic, Inference & Resolution' }
            ]
          }
        ]
      },
      {
        id: 'gate-da-prob-stat',
        name: 'Probability & Statistics',
        topics: [
          {
            id: 'gate-da-prob-dist',
            name: 'Probability Distributions & Inference',
            weightagePercent: 20,
            subtopics: [
              { id: 'da-prob-bayes', name: 'Conditional Probability, Bayes Theorem, Independent Events' },
              { id: 'da-prob-rv', name: 'Random Variables, PDF, CDF, Expectation, Variance, Covariance' },
              { id: 'da-prob-dists', name: 'Distributions (Bernoulli, Binomial, Poisson, Normal, Exponential, Chi-Square, t, F)' },
              { id: 'da-prob-hypo', name: 'Hypothesis Testing (z-test, t-test, ANOVA, Chi-Square Test, p-value)' }
            ]
          }
        ]
      },
      {
        id: 'gate-da-la-calc',
        name: 'Linear Algebra & Calculus',
        topics: [
          {
            id: 'gate-da-la-core',
            name: 'Matrix Operations & Vector Spaces',
            weightagePercent: 14,
            subtopics: [
              { id: 'da-la-vec', name: 'Vector Spaces, Subspaces, Linear Independence, Basis & Dimension' },
              { id: 'da-la-eigen', name: 'Eigenvalues, Eigenvectors, Diagonalization, SVD & Positive Definite Matrices' },
              { id: 'da-calc-multivar', name: 'Partial Derivatives, Gradient, Hessian, Jacobian & Optimization (Lagrange Multipliers)' }
            ]
          }
        ]
      }
    ]
  },
  { id: 'gate-ec', code: 'EC', name: 'Electronics & Communication Engineering', subjects: [] },
  { id: 'gate-ee', code: 'EE', name: 'Electrical Engineering', subjects: [] },
  { id: 'gate-me', code: 'ME', name: 'Mechanical Engineering', subjects: [] },
  { id: 'gate-ce', code: 'CE', name: 'Civil Engineering', subjects: [] },
  { id: 'gate-ch', code: 'CH', name: 'Chemical Engineering', subjects: [] },
  { id: 'gate-in', code: 'IN', name: 'Instrumentation Engineering', subjects: [] },
  { id: 'gate-ae', code: 'AE', name: 'Aerospace Engineering', subjects: [] },
  { id: 'gate-ag', code: 'AG', name: 'Agricultural Engineering', subjects: [] },
  { id: 'gate-ar', code: 'AR', name: 'Architecture & Planning', subjects: [] },
  { id: 'gate-bm', code: 'BM', name: 'Biomedical Engineering', subjects: [] },
  { id: 'gate-bt', code: 'BT', name: 'Biotechnology', subjects: [] },
  { id: 'gate-cy', code: 'CY', name: 'Chemistry', subjects: [] },
  { id: 'gate-es', code: 'ES', name: 'Environmental Science & Engineering', subjects: [] },
  { id: 'gate-ey', code: 'EY', name: 'Ecology & Evolution', subjects: [] },
  { id: 'gate-ge', code: 'GE', name: 'Geomatics Engineering', subjects: [] },
  { id: 'gate-gg', code: 'GG', name: 'Geology & Geophysics', subjects: [] },
  { id: 'gate-ma', code: 'MA', name: 'Mathematics', subjects: [] },
  { id: 'gate-mn', code: 'MN', name: 'Mining Engineering', subjects: [] },
  { id: 'gate-mt', code: 'MT', name: 'Metallurgical Engineering', subjects: [] },
  { id: 'gate-nm', code: 'NM', name: 'Naval Architecture & Marine Engineering', subjects: [] },
  { id: 'gate-pe', code: 'PE', name: 'Petroleum Engineering', subjects: [] },
  { id: 'gate-ph', code: 'PH', name: 'Physics', subjects: [] },
  { id: 'gate-pi', code: 'PI', name: 'Production & Industrial Engineering', subjects: [] },
  { id: 'gate-st', code: 'ST', name: 'Statistics', subjects: [] },
  { id: 'gate-tf', code: 'TF', name: 'Textile Engineering & Fibre Science', subjects: [] },
  { id: 'gate-xe', code: 'XE', name: 'Engineering Sciences', subjects: [] },
  { id: 'gate-xh', code: 'XH', name: 'Humanities & Social Sciences', subjects: [] },
  { id: 'gate-xl', code: 'XL', name: 'Life Sciences', subjects: [] }
];

// ============================================================================
// 2. MASTER 30 CATEGORIES TAXONOMY SPECIFICATION
// ============================================================================
export const MASTER_EXAM_TAXONOMY: MasterExamCategory[] = [
  {
    id: 'cat-gate',
    title: '1. GATE (Graduate Aptitude Test in Engineering)',
    description: '30 specialized engineering, science, humanities, and data science domains with deep topic hierarchies.',
    iconName: 'Cpu',
    badge: '30 Papers',
    examCount: 30,
    exams: [
      {
        id: 'exam-gate-master',
        code: 'GATE',
        name: 'GATE Exam Matrix',
        fullName: 'Graduate Aptitude Test in Engineering (All 30 Disciplines)',
        conductingBody: 'IISc & IITs (Joint Committee)',
        category: 'gate',
        stateOrRegion: 'All-India',
        notificationFrequency: 'Annual',
        isCSOrAIRelated: true,
        streamsOrPapers: GATE_PAPERS_30
      }
    ]
  },
  {
    id: 'cat-upsc',
    title: '2. UPSC & Central Government Services',
    description: 'Civil Services (Prelims GS-1/CSAT, Mains GS 1-4 & Optionals), IFS, ESE, CDS, CAPF, CMS, IES/ISS.',
    iconName: 'Landmark',
    badge: '10+ Exams',
    examCount: 12,
    exams: [
      {
        id: 'exam-upsc-cse',
        code: 'UPSC CSE',
        name: 'Civil Services Examination',
        fullName: 'UPSC Civil Services Examination (IAS, IPS, IFS, IRS)',
        conductingBody: 'Union Public Service Commission',
        category: 'upsc',
        stateOrRegion: 'All-India',
        notificationFrequency: 'Annual',
        streamsOrPapers: [
          {
            id: 'upsc-cse-prelims-gs1',
            code: 'PRELIMS-GS1',
            name: 'Prelims General Studies Paper 1',
            subjects: [
              {
                id: 'upsc-polity',
                name: 'Indian Polity & Governance',
                topics: [
                  {
                    id: 'upsc-fr-fd-dpsp',
                    name: 'Fundamental Rights, Duties & DPSP',
                    subtopics: [
                      { id: 'fr-articles-12-35', name: 'Articles 12-35, Basic Structure Doctrine, Judicial Review' },
                      { id: 'dpsp-socialist-gandhian', name: 'Part IV DPSPs (Articles 36-51), Conflict with Fundamental Rights' },
                      { id: 'fd-swaran-singh', name: 'Article 51A Fundamental Duties & Enforceability' }
                    ]
                  },
                  {
                    id: 'upsc-judiciary',
                    name: 'Union & State Judiciary',
                    subtopics: [
                      { id: 'sc-jurisdiction', name: 'Supreme Court Original, Appellate, Advisory & Writ Jurisdiction' },
                      { id: 'collegium-system', name: 'NJAC & Collegium Appointment System' }
                    ]
                  }
                ]
              },
              { id: 'upsc-history', name: 'History of India & Indian National Movement', topics: [] },
              { id: 'upsc-economy', name: 'Economic & Social Development', topics: [] },
              { id: 'upsc-environment', name: 'Environment, Ecology, Biodiversity & Climate Change', topics: [] }
            ]
          },
          {
            id: 'upsc-cse-prelims-csat',
            code: 'PRELIMS-CSAT',
            name: 'Prelims Paper 2 (CSAT Qualifying 33%)',
            subjects: [
              { id: 'csat-reasoning', name: 'Logical Reasoning & Analytical Ability', topics: [] },
              { id: 'csat-math', name: 'Basic Numeracy & Data Interpretation (Class X Level)', topics: [] },
              { id: 'csat-comprehension', name: 'Reading Comprehension & Decision Making', topics: [] }
            ]
          },
          { id: 'upsc-cse-mains-essay', code: 'MAINS-ESSAY', name: 'Mains Essay Paper (250 Marks)', subjects: [] },
          { id: 'upsc-cse-mains-gs1', code: 'MAINS-GS1', name: 'Mains GS-I (Indian Heritage, History, Geography & Society)', subjects: [] },
          { id: 'upsc-cse-mains-gs2', code: 'MAINS-GS2', name: 'Mains GS-II (Governance, Constitution, Polity, Social Justice & IR)', subjects: [] },
          { id: 'upsc-cse-mains-gs3', code: 'MAINS-GS3', name: 'Mains GS-III (Technology, Economic Development, Biodiversity, Security)', subjects: [] },
          { id: 'upsc-cse-mains-gs4', code: 'MAINS-GS4', name: 'Mains GS-IV (Ethics, Integrity & Aptitude)', subjects: [] }
        ]
      },
      { id: 'exam-upsc-ese', code: 'UPSC ESE', name: 'Engineering Services Examination (IES)', fullName: 'UPSC Engineering Services Exam (Civil, Mech, Electrical, E&T)', conductingBody: 'UPSC', category: 'upsc', stateOrRegion: 'All-India', notificationFrequency: 'Annual', streamsOrPapers: [] },
      { id: 'exam-upsc-cds', code: 'UPSC CDS', name: 'Combined Defence Services', fullName: 'UPSC Combined Defence Services Exam (IMA, INA, AFA, OTA)', conductingBody: 'UPSC', category: 'defence', stateOrRegion: 'All-India', notificationFrequency: 'Bi-Annual', streamsOrPapers: [] },
      { id: 'exam-upsc-capf', code: 'UPSC CAPF', name: 'CAPF (Assistant Commandants)', fullName: 'Central Armed Police Forces AC Examination', conductingBody: 'UPSC', category: 'defence', stateOrRegion: 'All-India', notificationFrequency: 'Annual', streamsOrPapers: [] }
    ]
  },
  {
    id: 'cat-ssc',
    title: '3. SSC (Staff Selection Commission)',
    description: 'CGL, CHSL, CPO, MTS, GD Constable, Junior Engineer (JE), Stenographer, JHT, and Selection Posts.',
    iconName: 'Award',
    badge: 'Graduate & Tech',
    examCount: 9,
    exams: [
      {
        id: 'exam-ssc-cgl',
        code: 'SSC CGL',
        name: 'Combined Graduate Level Examination',
        fullName: 'Staff Selection Commission Combined Graduate Level Exam (Tier 1 & Tier 2)',
        conductingBody: 'Staff Selection Commission (SSC)',
        category: 'ssc',
        stateOrRegion: 'All-India',
        notificationFrequency: 'Annual',
        streamsOrPapers: [
          {
            id: 'ssc-cgl-tier1',
            code: 'TIER-1',
            name: 'SSC CGL Tier 1 Computer Based Exam',
            subjects: [
              { id: 'ssc-quant', name: 'Quantitative Aptitude (Arithmetic & Advanced Math)', topics: [] },
              { id: 'ssc-reasoning', name: 'General Intelligence & Reasoning', topics: [] },
              { id: 'ssc-english', name: 'English Comprehension & Grammar', topics: [] },
              { id: 'ssc-ga', name: 'General Awareness & Current Affairs', topics: [] }
            ]
          },
          {
            id: 'ssc-cgl-tier2',
            code: 'TIER-2',
            name: 'SSC CGL Tier 2 Main Examination',
            subjects: [
              { id: 'ssc-t2-math-reasoning', name: 'Section I: Mathematical Abilities & Reasoning', topics: [] },
              { id: 'ssc-t2-english-ga', name: 'Section II: English Language & General Awareness', topics: [] },
              { id: 'ssc-t2-computer', name: 'Section III: Computer Knowledge Module', topics: [] },
              { id: 'ssc-t2-stats', name: 'Paper II: Statistics (For JSO Posts)', topics: [] }
            ]
          }
        ]
      },
      { id: 'exam-ssc-je', code: 'SSC JE', name: 'Junior Engineer (Civil, Electrical, Mechanical)', fullName: 'SSC Junior Engineer Examination', conductingBody: 'SSC', category: 'ssc', stateOrRegion: 'All-India', notificationFrequency: 'Annual', streamsOrPapers: [] },
      { id: 'exam-ssc-cpo', code: 'SSC CPO', name: 'Central Police Organization (SI in Delhi Police & CAPF)', fullName: 'SSC CPO Sub-Inspector Examination', conductingBody: 'SSC', category: 'police', stateOrRegion: 'All-India', notificationFrequency: 'Annual', streamsOrPapers: [] }
    ]
  },
  {
    id: 'cat-banking',
    title: '4. Banking & Financial Sector Examinations',
    description: 'IBPS PO/Clerk/SO (IT, Agri, Law, HR, Marketing), SBI PO/Clerk/SO, IBPS RRB Officers Scale I-III & Assistant.',
    iconName: 'Building2',
    badge: '15+ Roles',
    examCount: 14,
    exams: [
      {
        id: 'exam-ibps-po',
        code: 'IBPS PO',
        name: 'IBPS Probationary Officer (CRP PO/MT)',
        fullName: 'Institute of Banking Personnel Selection PO Prelims & Mains',
        conductingBody: 'IBPS',
        category: 'banking',
        stateOrRegion: 'All-India',
        notificationFrequency: 'Annual',
        streamsOrPapers: []
      },
      {
        id: 'exam-ibps-so',
        code: 'IBPS SO',
        name: 'IBPS Specialist Officer (All Streams)',
        fullName: 'IBPS Specialist Officer (IT Officer, AFO, Law, HR, Marketing, Rajbhasha)',
        conductingBody: 'IBPS',
        category: 'banking',
        stateOrRegion: 'All-India',
        notificationFrequency: 'Annual',
        isCSOrAIRelated: true,
        streamsOrPapers: [
          { id: 'ibps-so-it', code: 'IT-OFFICER', name: 'IT Officer Scale I (DBMS, Networks, OS, Security, SE)', subjects: [] },
          { id: 'ibps-so-afo', code: 'AFO', name: 'Agriculture Field Officer Scale I', subjects: [] },
          { id: 'ibps-so-law', code: 'LAW-OFFICER', name: 'Law Officer Scale I', subjects: [] },
          { id: 'ibps-so-hr', code: 'HR-OFFICER', name: 'HR / Personnel Officer Scale I', subjects: [] }
        ]
      },
      { id: 'exam-sbi-po', code: 'SBI PO', name: 'State Bank of India PO', fullName: 'SBI Probationary Officer Prelims & Mains', conductingBody: 'State Bank of India', category: 'banking', stateOrRegion: 'All-India', notificationFrequency: 'Annual', streamsOrPapers: [] }
    ]
  },
  {
    id: 'cat-regulatory',
    title: '5. Financial Regulators (RBI, SEBI, NABARD, SIDBI, PFRDA)',
    description: 'RBI Grade B & Assistant, SEBI Grade A (General/IT/Legal/Research), NABARD Grade A/B, SIDBI, IFSCA, PFRDA.',
    iconName: 'ShieldCheck',
    badge: 'Apex Regulators',
    examCount: 8,
    exams: [
      { id: 'exam-rbi-grade-b', code: 'RBI Grade B', name: 'RBI Grade B Officer (General, DEPR, DSIM)', fullName: 'Reserve Bank of India Grade B Officers Exam', conductingBody: 'RBI Services Board', category: 'regulatory', stateOrRegion: 'All-India', notificationFrequency: 'Annual', streamsOrPapers: [] },
      { id: 'exam-sebi-grade-a', code: 'SEBI Grade A', name: 'SEBI Grade A Assistant Manager (General, IT, Legal, Engineering)', fullName: 'Securities and Exchange Board of India Assistant Manager', conductingBody: 'SEBI', category: 'regulatory', stateOrRegion: 'All-India', notificationFrequency: 'Annual', isCSOrAIRelated: true, streamsOrPapers: [] }
    ]
  },
  {
    id: 'cat-railways',
    title: '6. Railway Recruitment Boards (RRB)',
    description: 'RRB NTPC (Graduate & Undergraduate), RRB JE (Civil/Mech/Electrical/Electronics/CS), RRB ALP, Technician, RPF SI/Constable.',
    iconName: 'TrendingUp',
    badge: 'Indian Railways',
    examCount: 10,
    exams: [
      { id: 'exam-rrb-ntpc', code: 'RRB NTPC', name: 'RRB Non-Technical Popular Categories (Graduate)', fullName: 'Railway Recruitment Board NTPC Stage 1 & Stage 2', conductingBody: 'Railway Recruitment Boards', category: 'railways', stateOrRegion: 'All-India', notificationFrequency: 'Annual', streamsOrPapers: [] },
      { id: 'exam-rrb-je', code: 'RRB JE', name: 'RRB Junior Engineer (IT, Civil, Mech, Electrical, Electronics)', fullName: 'Railway Recruitment Board Junior Engineer Exam', conductingBody: 'Railway Recruitment Boards', category: 'railways', stateOrRegion: 'All-India', notificationFrequency: 'Annual', isCSOrAIRelated: true, streamsOrPapers: [] }
    ]
  },
  {
    id: 'cat-state-psc',
    title: '7. State Public Service Commissions (28 States & 8 UTs)',
    description: 'State civil services, Group 1/2/3/4 services across all 28 Indian States (KPSC, TNPSC, UPPSC, MPSC, BPSC, APPSC, TSPSC, WBPSC, GPSC, etc.).',
    iconName: 'Layers',
    badge: '28 States',
    examCount: 28,
    exams: [
      { id: 'exam-kpsc-kas', code: 'KPSC KAS', name: 'Karnataka PSC (KAS / Gazetted Probationers)', fullName: 'Karnataka Public Service Commission Gazetted Probationers Exam', conductingBody: 'KPSC', category: 'state-psc', stateOrRegion: 'Karnataka', notificationFrequency: 'Annual', streamsOrPapers: [] },
      { id: 'exam-tnpsc-group1', code: 'TNPSC G1', name: 'Tamil Nadu PSC Group 1 Services', fullName: 'Tamil Nadu Public Service Commission Combined Civil Services Exam I', conductingBody: 'TNPSC', category: 'state-psc', stateOrRegion: 'Tamil Nadu', notificationFrequency: 'Annual', streamsOrPapers: [] },
      { id: 'exam-uppsc-pcs', code: 'UPPSC PCS', name: 'Uttar Pradesh Combined State / Upper Subordinate', fullName: 'UPPSC Combined State / Upper Subordinate Services (PCS)', conductingBody: 'UPPSC', category: 'state-psc', stateOrRegion: 'Uttar Pradesh', notificationFrequency: 'Annual', streamsOrPapers: [] },
      { id: 'exam-mpsc-rajyaseva', code: 'MPSC State Services', name: 'Maharashtra PSC (Rajyaseva)', fullName: 'Maharashtra Public Service Commission State Services Exam', conductingBody: 'MPSC', category: 'state-psc', stateOrRegion: 'Maharashtra', notificationFrequency: 'Annual', streamsOrPapers: [] },
      { id: 'exam-bpsc-cce', code: 'BPSC CCE', name: 'Bihar Combined Competitive Exam', fullName: 'Bihar Public Service Commission Combined Competitive Exam', conductingBody: 'BPSC', category: 'state-psc', stateOrRegion: 'Bihar', notificationFrequency: 'Annual', streamsOrPapers: [] },
      { id: 'exam-appsc-group1', code: 'APPSC Group 1', name: 'Andhra Pradesh PSC Group 1 Services', fullName: 'Andhra Pradesh Public Service Commission Group 1 Services', conductingBody: 'APPSC', category: 'state-psc', stateOrRegion: 'Andhra Pradesh', notificationFrequency: 'Annual', streamsOrPapers: [] },
      { id: 'exam-tspsc-group1', code: 'TSPSC Group 1', name: 'Telangana PSC Group 1 Services', fullName: 'Telangana State Public Service Commission Group 1 Services', conductingBody: 'TSPSC', category: 'state-psc', stateOrRegion: 'Telangana', notificationFrequency: 'Annual', streamsOrPapers: [] },
      { id: 'exam-wbpsc-wbcrs', code: 'WBPSC WBCS', name: 'West Bengal Civil Service (Executive)', fullName: 'West Bengal Public Service Commission Civil Service Exam', conductingBody: 'WBPSC', category: 'state-psc', stateOrRegion: 'West Bengal', notificationFrequency: 'Annual', streamsOrPapers: [] }
    ]
  },
  {
    id: 'cat-state-subordinate',
    title: '8. State Subordinate Recruitment Boards',
    description: 'UPSSSC, RSSB, BSSC, JSSC, OSSC, OSSSC, HSSC, PSSSB, MPESB (Vyapam), CG Vyapam for Assistant, Clerk, JE, Revenue, and IT posts.',
    iconName: 'FileSpreadsheet',
    badge: 'State Boards',
    examCount: 16,
    exams: [
      { id: 'exam-upsssc-pet', code: 'UPSSSC PET', name: 'UPSSSC Preliminary Eligibility Test', fullName: 'Uttar Pradesh Subordinate Services Selection Commission PET', conductingBody: 'UPSSSC', category: 'state-subordinate', stateOrRegion: 'Uttar Pradesh', notificationFrequency: 'Annual', streamsOrPapers: [] },
      { id: 'exam-rssb-cet', code: 'RSSB CET', name: 'Rajasthan Staff Selection Board (CET Graduate Level)', fullName: 'Rajasthan Staff Selection Board Common Eligibility Test', conductingBody: 'RSSB', category: 'state-subordinate', stateOrRegion: 'Rajasthan', notificationFrequency: 'Annual', streamsOrPapers: [] }
    ]
  },
  {
    id: 'cat-ugc-net',
    title: '11. UGC NET (National Eligibility Test)',
    description: 'Paper 1 (Teaching & Research Aptitude - 10 Units) + 80+ dynamic subject papers (Computer Science, Management, Commerce, Economics, etc.).',
    iconName: 'GraduationCap',
    badge: '80+ Subjects',
    examCount: 85,
    exams: [
      {
        id: 'exam-ugc-net-cs',
        code: 'UGC-NET-CS',
        name: 'UGC NET Computer Science & Applications (Subject Code 87)',
        fullName: 'NTA UGC NET Assistant Professor & JRF in Computer Science & Applications',
        conductingBody: 'National Testing Agency (NTA)',
        category: 'ugc-net',
        stateOrRegion: 'All-India',
        notificationFrequency: 'Bi-Annual',
        isCSOrAIRelated: true,
        streamsOrPapers: []
      }
    ]
  },
  {
    id: 'cat-csir-net',
    title: '12. CSIR-UGC NET (Scientific Domains)',
    description: 'Chemical Sciences, Earth/Atmospheric/Ocean/Planetary Sciences, Life Sciences, Mathematical Sciences, and Physical Sciences.',
    iconName: 'Sparkles',
    badge: '5 Domains',
    examCount: 5,
    exams: [
      { id: 'exam-csir-ls', code: 'CSIR-LS', name: 'CSIR NET Life Sciences', fullName: 'Joint CSIR-UGC NET for JRF and Lectureship in Life Sciences', conductingBody: 'NTA', category: 'csir-net', stateOrRegion: 'All-India', notificationFrequency: 'Bi-Annual', streamsOrPapers: [] },
      { id: 'exam-csir-math', code: 'CSIR-MATH', name: 'CSIR NET Mathematical Sciences', fullName: 'Joint CSIR-UGC NET for JRF in Mathematical Sciences', conductingBody: 'NTA', category: 'csir-net', stateOrRegion: 'All-India', notificationFrequency: 'Bi-Annual', streamsOrPapers: [] },
      { id: 'exam-csir-chem', code: 'CSIR-CHEM', name: 'CSIR NET Chemical Sciences', fullName: 'Joint CSIR-UGC NET in Chemical Sciences', conductingBody: 'NTA', category: 'csir-net', stateOrRegion: 'All-India', notificationFrequency: 'Bi-Annual', streamsOrPapers: [] },
      { id: 'exam-csir-phy', code: 'CSIR-PHY', name: 'CSIR NET Physical Sciences', fullName: 'Joint CSIR-UGC NET in Physical Sciences', conductingBody: 'NTA', category: 'csir-net', stateOrRegion: 'All-India', notificationFrequency: 'Bi-Annual', streamsOrPapers: [] }
    ]
  },
  {
    id: 'cat-technical-psu',
    title: '13. Technical & Scientific PSU Recruitment',
    description: 'ISRO (ICRB), DRDO (RAC/CEPTAM), BARC (OCES/DGFS), NIC/NIELIT (Scientist B & Scientific Assistant), C-DAC, BEL, BHEL, IOCL, ONGC, NTPC, GAIL, PowerGrid.',
    iconName: 'Terminal',
    badge: 'Premier PSUs',
    examCount: 18,
    exams: [
      { id: 'exam-isro-cs', code: 'ISRO CS', name: 'ISRO Scientist/Engineer \'SC\' (Computer Science)', fullName: 'ISRO Centralised Recruitment Board Scientist/Engineer SC in CS', conductingBody: 'ISRO ICRB', category: 'technical-psu', stateOrRegion: 'All-India', notificationFrequency: 'Rolling / As Notified', isCSOrAIRelated: true, streamsOrPapers: [] },
      { id: 'exam-drdo-cs', code: 'DRDO Scientist B', name: 'DRDO Scientist \'B\' (Computer Science & IT)', fullName: 'DRDO Recruitment & Assessment Centre (RAC) Scientist B in CS/IT', conductingBody: 'DRDO RAC', category: 'technical-psu', stateOrRegion: 'All-India', notificationFrequency: 'Annual', isCSOrAIRelated: true, streamsOrPapers: [] },
      { id: 'exam-nic-scientist-b', code: 'NIC Scientist B', name: 'NIC / NIELIT Scientist \'B\' & Scientific Officer', fullName: 'National Informatics Centre Scientist B & Scientific/Technical Assistant A', conductingBody: 'NIELIT', category: 'technical-psu', stateOrRegion: 'All-India', notificationFrequency: 'Rolling / As Notified', isCSOrAIRelated: true, streamsOrPapers: [] },
      { id: 'exam-barc-oces', code: 'BARC OCES', name: 'BARC OCES / DGFS (Nuclear Science & Engineering)', fullName: 'Bhabha Atomic Research Centre Scientific Officers Training Scheme', conductingBody: 'BARC', category: 'technical-psu', stateOrRegion: 'All-India', notificationFrequency: 'Annual', isCSOrAIRelated: true, streamsOrPapers: [] }
    ]
  },
  {
    id: 'cat-cs-ai-hub',
    title: '27. CS / IT / AI Dedicated Candidate Opportunity Hub',
    description: 'Unified cross-mapped studio connecting GATE CS, GATE DA, ISRO CS, DRDO CS, NIC Scientist B, Bank IT Officers, PSU IT, UGC NET CS, and Corporate Assessments.',
    iconName: 'Code2',
    badge: 'Unified CS/AI',
    examCount: 16,
    exams: [
      {
        id: 'exam-cs-ai-unified',
        code: 'CS-AI-HUB',
        name: 'CS / IT / AI Master Core Knowledge Engine',
        fullName: 'Central Cross-Exam Knowledge & PYQ Matrix for CS, Data Science & AI',
        conductingBody: 'Unified Preparation AI Cross-Taxonomy Engine',
        category: 'cs-ai-hub',
        stateOrRegion: 'All-India',
        notificationFrequency: 'Annual',
        isCSOrAIRelated: true,
        streamsOrPapers: GATE_PAPERS_30.filter(p => p.code === 'CS' || p.code === 'DA')
      }
    ]
  },
  {
    id: 'cat-management',
    title: '15. MBA & Management Entrance Exams',
    description: 'CAT (VARC, DILR, QA), XAT, CMAT, MAT, NMAT by GMAC, SNAP, IIFT, MICAT.',
    iconName: 'Briefcase',
    badge: 'IIMs & Top B-Schools',
    examCount: 8,
    exams: [
      { id: 'exam-cat', code: 'CAT', name: 'Common Admission Test (IIMs)', fullName: 'IIM Common Admission Test (VARC, DILR, Quantitative Aptitude)', conductingBody: 'IIMs', category: 'management', stateOrRegion: 'All-India', notificationFrequency: 'Annual', streamsOrPapers: [] },
      { id: 'exam-xat', code: 'XAT', name: 'Xavier Aptitude Test (XLRI)', fullName: 'XLRI Xavier Aptitude Test (Decision Making, QA/DI, VALR, GK)', conductingBody: 'XLRI Jamshedpur', category: 'management', stateOrRegion: 'All-India', notificationFrequency: 'Annual', streamsOrPapers: [] }
    ]
  },
  {
    id: 'cat-cuet-pg',
    title: '17. CUET PG (Common University Entrance Test PG)',
    description: 'Post-graduate central university admissions spanning Computer Science/IT, Data Science, Mathematics, Life Sciences, Economics, Law, Commerce, and Arts.',
    iconName: 'School',
    badge: 'Central Universities',
    examCount: 50,
    exams: [
      { id: 'exam-cuet-pg-cs', code: 'CUET PG SCQP09', name: 'CUET PG Computer Science & Information Technology', fullName: 'NTA CUET PG Test Paper for MCA and M.Sc Computer Science', conductingBody: 'NTA', category: 'cuet-pg', stateOrRegion: 'All-India', notificationFrequency: 'Annual', isCSOrAIRelated: true, streamsOrPapers: [] }
    ]
  },
  {
    id: 'cat-law-judiciary',
    title: '18 & 24. Law, Judicial Services & Court Recruitment',
    description: 'CLAT PG, AILET PG, State Judicial Services (Civil Judge / PCS-J), High Court and Supreme Court Law Officers & Clerks.',
    iconName: 'Scale',
    badge: 'Judiciary & Law',
    examCount: 15,
    exams: [
      { id: 'exam-clat-pg', code: 'CLAT PG', name: 'Common Law Admission Test PG (LLM)', fullName: 'Consortium of NLUs Common Law Admission Test for Post Graduate', conductingBody: 'Consortium of NLUs', category: 'law', stateOrRegion: 'All-India', notificationFrequency: 'Annual', streamsOrPapers: [] },
      { id: 'exam-state-judiciary', code: 'PCS-J', name: 'State Judicial Services (Civil Judge Junior Division)', fullName: 'State Public Service Commission Judicial Service Examination', conductingBody: 'High Courts / State PSCs', category: 'judiciary', stateOrRegion: 'State-Wise', notificationFrequency: 'Annual', streamsOrPapers: [] }
    ]
  },
  {
    id: 'cat-medical-pg',
    title: '19 & 20. Medical PG, Dental & Healthcare',
    description: 'NEET PG, INI-CET, NEET MDS, NORCET AIIMS Nursing Officer, State Staff Nurse, CHO, Pharmacist, Lab Technician.',
    iconName: 'HeartPulse',
    badge: 'Medical & Nursing',
    examCount: 12,
    exams: [
      { id: 'exam-neet-pg', code: 'NEET PG', name: 'National Eligibility cum Entrance Test (PG)', fullName: 'National Board of Examinations NEET PG for MD/MS/DNB', conductingBody: 'NBEMS', category: 'medical', stateOrRegion: 'All-India', notificationFrequency: 'Annual', streamsOrPapers: [] },
      { id: 'exam-norcet-aiims', code: 'NORCET AIIMS', name: 'Nursing Officer Recruitment Common Eligibility Test', fullName: 'AIIMS New Delhi NORCET for Central Government Hospitals', conductingBody: 'AIIMS New Delhi', category: 'nursing', stateOrRegion: 'All-India', notificationFrequency: 'Bi-Annual', streamsOrPapers: [] }
    ]
  },
  {
    id: 'cat-corporate-it',
    title: '28. Private & Corporate IT Graduate Assessments',
    description: 'TCS NQT / Digital / Prime, Infosys Springboard / Specialist, Wipro Elite, Accenture, Cognizant, Capgemini, HCLTech hiring assessments.',
    iconName: 'Code',
    badge: 'IT Giants',
    examCount: 10,
    exams: [
      { id: 'exam-tcs-nqt', code: 'TCS NQT', name: 'TCS National Qualifier Test (Ninja / Digital / Prime)', fullName: 'Tata Consultancy Services National Qualifier Test for B.Tech/MCA/M.Sc Graduates', conductingBody: 'TCS iON', category: 'corporate-it', stateOrRegion: 'All-India', notificationFrequency: 'Rolling / As Notified', isCSOrAIRelated: true, streamsOrPapers: [] }
    ]
  }
];

// Helper to query all CS/AI related examinations across the entire taxonomy
export function getCSAndAIOpportunities(): ExamHierarchyNode[] {
  const results: ExamHierarchyNode[] = [];
  for (const cat of MASTER_EXAM_TAXONOMY) {
    for (const exam of cat.exams) {
      if (exam.isCSOrAIRelated) {
        results.push(exam);
      }
    }
  }
  return results;
}
