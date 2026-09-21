// ============================================================================
// RAG Document Store — syllabus PDFs + reference notes
// ----------------------------------------------------------------------------
// Pre-indexed NCERT chapters and reference book excerpts.
// In production: replace with Prisma-backed DB + embeddings.
// For dev: in-memory store with keyword retrieval (TF-IDF ranking).
// ============================================================================

export interface RagDocument {
  id: string;
  title: string;
  subject: string;
  topic: string;
  source: string;          // 'NCERT Class 11 Physics' | 'HC Verma' | etc.
  sourceType: 'ncert' | 'reference-book' | 'notes' | 'pyq';
  // Page or chapter reference for citation
  chapter?: string;
  page?: number;
  // The full text content (will be chunked)
  content: string;
  // Pre-computed chunks
  chunks: RagChunk[];
  createdAt: string;
}

export interface RagChunk {
  id: string;
  documentId: string;
  index: number;            // chunk index within the document
  text: string;
  // Pre-computed term frequencies for retrieval
  termFreq: Record<string, number>;
  // Source citation metadata
  source: string;
  chapter?: string;
  page?: number;
  subject: string;
  topic: string;
  title: string;
}

// ---------------------------------------------------------------------------
// Document chunking — split into ~200-word passages at paragraph boundaries
// ---------------------------------------------------------------------------

const CHUNK_WORD_TARGET = 200;
const CHUNK_WORD_OVERLAP = 30;  // overlap words between adjacent chunks for context continuity

export function chunkDocument(doc: Omit<RagDocument, 'chunks' | 'createdAt'>): RagDocument {
  const chunks: RagChunk[] = [];
  const words = doc.content.split(/\s+/);
  const totalWords = words.length;

  let startIdx = 0;
  let chunkIdx = 0;

  while (startIdx < totalWords) {
    const endIdx = Math.min(startIdx + CHUNK_WORD_TARGET, totalWords);
    const chunkText = words.slice(startIdx, endIdx).join(' ');
    const termFreq = computeTermFrequencies(chunkText);

    chunks.push({
      id: `${doc.id}_chunk_${chunkIdx}`,
      documentId: doc.id,
      index: chunkIdx,
      text: chunkText,
      termFreq,
      source: doc.source,
      chapter: doc.chapter,
      page: doc.page ? doc.page + Math.floor(chunkIdx / 2) : undefined,  // estimate page progression
      subject: doc.subject,
      topic: doc.topic,
      title: doc.title,
    });

    // Move forward by (target - overlap) for next chunk
    startIdx += CHUNK_WORD_TARGET - CHUNK_WORD_OVERLAP;
    chunkIdx++;
  }

  return {
    ...doc,
    chunks,
    createdAt: new Date().toISOString(),
  };
}

function computeTermFrequencies(text: string): Record<string, number> {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
    'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
    'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'also', 'about', 'above', 'after', 'again',
    'against', 'before', 'below', 'between', 'during', 'further', 'here', 'into', 'off', 'out',
    'over', 'then', 'there', 'under', 'up', 'down', 'if', 'because', 'while', 'any', 'each',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
  ]);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] ?? 0) + 1;
  }

  // Normalize by total word count
  const total = words.length || 1;
  for (const k of Object.keys(freq)) {
    freq[k] = freq[k] / total;
  }

  return freq;
}

// ---------------------------------------------------------------------------
// In-memory document store (seeded with NCERT + reference excerpts)
// ---------------------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var
  var __rag_store__: { documents: RagDocument[]; chunks: RagChunk[] } | undefined;
}

function getStore(): { documents: RagDocument[]; chunks: RagChunk[] } {
  if (!globalThis.__rag_store__) {
    const docs: RagDocument[] = [];
    const allChunks: RagChunk[] = [];

    // Seed with NCERT + reference excerpts
    const seedDocs = [
      // Physics — Newton's Laws
      {
        id: 'ncert_phy_laws_motion',
        title: 'Laws of Motion',
        subject: 'Physics',
        topic: 'Laws of Motion',
        source: 'NCERT Class 11 Physics, Chapter 5',
        sourceType: 'ncert' as const,
        chapter: 'Chapter 5: Laws of Motion',
        page: 87,
        content: `Newton's first law of motion states that every body continues in its state of rest or of uniform motion in a straight line unless compelled by some external force to act otherwise. This law is also called the law of inertia. The term inertia is used to describe the tendency of a body to remain in its state of motion.

The first law of motion provides a qualitative definition of force. A force is something that changes the state of rest or uniform motion of a body. The first law also defines an inertial frame of reference — a frame in which the first law holds true.

Newton's second law of motion states that the rate of change of momentum of a body is directly proportional to the applied force and takes place in the direction in which the force acts. If F is the force applied, dp/dt is the rate of change of momentum, then F = dp/dt. For a body of constant mass m, this becomes F = ma, where a is the acceleration.

The second law provides a quantitative definition of force. The SI unit of force is newton (N). One newton is defined as the force that produces an acceleration of 1 m/s² in a body of mass 1 kg. The second law also shows that force is a vector quantity — it has both magnitude and direction.

Newton's third law of motion states that to every action, there is an equal and opposite reaction. Forces always occur in pairs. If body A exerts a force F on body B, then body B exerts a force -F on body A. The action and reaction forces act on different bodies, so they do not cancel each other.

The third law is useful in understanding the motion of rockets, the recoil of a gun, and the propulsion of swimming. When a swimmer pushes water backward, the water pushes the swimmer forward with an equal and opposite force.`,
      },
      // Physics — Work, Energy, Power
      {
        id: 'ncert_phy_work_energy',
        title: 'Work, Energy and Power',
        subject: 'Physics',
        topic: 'Work Energy Power',
        source: 'NCERT Class 11 Physics, Chapter 6',
        sourceType: 'ncert' as const,
        chapter: 'Chapter 6: Work, Energy and Power',
        page: 110,
        content: `The work done by a force is defined as the product of the magnitude of the force and the displacement of the body in the direction of the force. If F is the force, s is the displacement, and θ is the angle between them, then work W = F·s·cos(θ). Work is a scalar quantity and its SI unit is joule (J).

Work done by a force can be positive, negative, or zero. When the angle between force and displacement is acute (θ < 90°), work is positive. When the angle is obtuse (θ > 90°), work is negative. When θ = 90°, work is zero — for example, the work done by centripetal force in circular motion is zero.

The work-energy theorem states that the work done by all forces acting on a body equals the change in its kinetic energy. If a body of mass m moving with velocity v has kinetic energy K = ½mv², then the work done W = ΔK = K_final - K_initial.

Conservation of mechanical energy: The total mechanical energy (sum of kinetic and potential energy) of a system remains constant if the forces acting on it are conservative. Conservative forces are those for which the work done depends only on the initial and final positions, not on the path taken. Examples include gravitational force, spring force, and electrostatic force.

Non-conservative forces, like friction, dissipate mechanical energy as heat. The work done against friction depends on the path taken. In real systems, mechanical energy decreases over time due to friction and other dissipative forces.

Power is the rate at which work is done. If work W is done in time t, then power P = W/t. The SI unit of power is watt (W). One watt equals one joule per second. The instantaneous power is P = F·v, where F is the force and v is the velocity.`,
      },
      // Physics — Rotational Motion
      {
        id: 'hcverma_rotational',
        title: 'Rotational Mechanics',
        subject: 'Physics',
        topic: 'Rotational Motion',
        source: 'HC Verma, Concepts of Physics Vol 1, Chapter 10',
        sourceType: 'reference-book' as const,
        chapter: 'Chapter 10: Rotational Mechanics',
        page: 220,
        content: `A rigid body is one in which the distance between any two particles remains constant. When a rigid body rotates about a fixed axis, all particles describe circular paths about the axis. The angular velocity ω is the same for all particles of the body, but the linear velocity v = rω depends on the distance r from the axis.

The moment of inertia of a body about an axis is defined as I = Σ m_i r_i², where m_i is the mass of the i-th particle and r_i is its perpendicular distance from the axis. Moment of inertia depends on the mass distribution relative to the axis — it is larger when mass is farther from the axis.

For common shapes: a solid sphere about its diameter has I = (2/5)MR²; a hollow sphere has I = (2/3)MR²; a solid cylinder about its axis has I = (1/2)MR²; a thin rod about its center has I = (1/12)ML².

The parallel axis theorem states that the moment of inertia about any axis parallel to an axis through the center of mass is I = I_cm + Md², where d is the distance between the two axes. This is useful for computing moments of inertia about axes that do not pass through the center of mass.

The perpendicular axis theorem applies to planar bodies: the moment of inertia about an axis perpendicular to the plane is the sum of the moments of inertia about two mutually perpendicular axes in the plane, all meeting at the same point.

Torque (or moment of force) is the rotational analogue of force. If a force F acts at a point with position vector r relative to the axis, the torque is τ = r × F. The magnitude of torque is τ = rF sin(θ), where θ is the angle between r and F. Torque is a vector quantity.

The rotational analogue of Newton's second law is τ = Iα, where τ is the torque, I is the moment of inertia, and α is the angular acceleration. This is the rotational equation of motion.

Angular momentum L = Iω is conserved when no external torque acts on the system. This is the rotational analogue of linear momentum conservation. A figure skater pulling in their arms reduces their moment of inertia, causing angular velocity to increase (since Iω remains constant).`,
      },
      // Chemistry — Chemical Bonding
      {
        id: 'ncert_chem_bonding',
        title: 'Chemical Bonding and Molecular Structure',
        subject: 'Chemistry',
        topic: 'Chemical Bonding',
        source: 'NCERT Class 11 Chemistry, Chapter 4',
        sourceType: 'ncert' as const,
        chapter: 'Chapter 4: Chemical Bonding and Molecular Structure',
        page: 65,
        content: `A chemical bond is the force of attraction that holds atoms together in a molecule or compound. The main types of chemical bonds are ionic bonds, covalent bonds, metallic bonds, and coordinate (dative) bonds.

Ionic bonds form when one atom transfers electrons to another, creating oppositely charged ions that attract each other. For example, in NaCl, sodium loses one electron to become Na⁺, and chlorine gains that electron to become Cl⁻. The electrostatic attraction between Na⁺ and Cl⁻ forms the ionic bond.

Covalent bonds form when two atoms share electrons. In a single covalent bond, two atoms share one pair of electrons. In a double bond, they share two pairs, and in a triple bond, three pairs. The shared electrons are attracted by both nuclei, holding the atoms together.

The Lewis structure represents the arrangement of electrons in a molecule using dots for valence electrons. The octet rule states that atoms tend to gain, lose, or share electrons to achieve a stable configuration of 8 valence electrons (like noble gases).

Hybridization is the mixing of atomic orbitals to form new hybrid orbitals suitable for bonding. The type of hybridization determines the geometry of the molecule:
- sp hybridization: linear geometry, 180° bond angle (e.g., BeCl₂, CO₂)
- sp² hybridization: trigonal planar, 120° (e.g., BF₃, ethene)
- sp³ hybridization: tetrahedral, 109.5° (e.g., CH₄, NH₃, H₂O)

VSEPR theory (Valence Shell Electron Pair Repulsion) predicts molecular geometry based on minimizing repulsion between electron pairs. Lone pairs repel more than bonding pairs, which explains why NH₃ is pyramidal (not tetrahedral) and H₂O is bent (not linear).

Hydrogen bonds form when a hydrogen atom bonded to an electronegative atom (N, O, or F) is attracted to another electronegative atom. Hydrogen bonds are stronger than van der Waals forces but weaker than covalent bonds. They are responsible for the high boiling point of water and the structure of DNA.`,
      },
      // Math — Calculus (Differentiation)
      {
        id: 'ncert_math_diff',
        title: 'Differentiation',
        subject: 'Mathematics',
        topic: 'Calculus',
        source: 'NCERT Class 12 Mathematics, Chapter 5',
        sourceType: 'ncert' as const,
        chapter: 'Chapter 5: Continuity and Differentiability',
        page: 95,
        content: `The derivative of a function f(x) at a point x is defined as the limit: f'(x) = lim(h→0) [f(x+h) - f(x)] / h, provided the limit exists. Geometrically, the derivative represents the slope of the tangent to the curve y = f(x) at the point (x, f(x)).

A function is differentiable at a point if the derivative exists there. Differentiability implies continuity, but continuity does not imply differentiability. For example, |x| is continuous at x=0 but not differentiable.

The basic rules of differentiation are:
- Power rule: d/dx [x^n] = n·x^(n-1)
- Sum rule: d/dx [f+g] = f' + g'
- Product rule: d/dx [f·g] = f·g' + f'·g
- Quotient rule: d/dx [f/g] = (f'·g - f·g') / g²
- Chain rule: d/dx [f(g(x))] = f'(g(x))·g'(x)

Standard derivatives:
- d/dx [sin x] = cos x
- d/dx [cos x] = -sin x
- d/dx [tan x] = sec²x
- d/dx [e^x] = e^x
- d/dx [ln x] = 1/x

The chain rule is one of the most powerful tools in differentiation. It allows us to differentiate composite functions. For example, to differentiate sin(x²), we let u = x², then d/dx [sin(u)] = cos(u) · du/dx = cos(x²) · 2x.

Implicit differentiation is used when y cannot be easily isolated as a function of x. For example, to differentiate x² + y² = 1 (circle), differentiate both sides: 2x + 2y·(dy/dx) = 0, so dy/dx = -x/y.

Higher-order derivatives: the second derivative f''(x) is the derivative of f'(x). It represents the rate of change of the slope, which is related to concavity. If f''(x) > 0, the function is concave up; if f''(x) < 0, it is concave down. The second derivative test uses this to classify critical points as maxima or minima.`,
      },
      // Math — Probability
      {
        id: 'ncert_math_prob',
        title: 'Probability',
        subject: 'Mathematics',
        topic: 'Probability',
        source: 'NCERT Class 12 Mathematics, Chapter 13',
        sourceType: 'ncert' as const,
        chapter: 'Chapter 13: Probability',
        page: 380,
        content: `Probability is a measure of the likelihood of an event occurring. The probability of an event E, denoted P(E), lies between 0 and 1. P(E) = 0 means the event is impossible, P(E) = 1 means it is certain.

Conditional probability: P(A|B) is the probability of A occurring given that B has occurred. It is defined as P(A|B) = P(A ∩ B) / P(B), provided P(B) > 0. Conditional probability is fundamental to understanding dependent events.

The multiplication rule: P(A ∩ B) = P(B) · P(A|B) = P(A) · P(B|A). This is useful for computing the probability of two events both occurring.

Two events A and B are independent if the occurrence of one does not affect the probability of the other: P(A|B) = P(A) and P(B|A) = P(B). For independent events, P(A ∩ B) = P(A) · P(B).

Bayes' theorem relates conditional probabilities: P(A|B) = [P(B|A) · P(A)] / P(B). It is the foundation of Bayesian inference and is widely used in medical testing, spam filtering, and machine learning.

The law of total probability: if B1, B2, ..., Bn are mutually exclusive and exhaustive events, then P(A) = Σ P(Bi) · P(A|Bi). This is useful for decomposing a probability into conditional components.

A random variable is a function that assigns a real number to each outcome of a random experiment. The probability distribution of a random variable X lists the values of X and their corresponding probabilities. The expected value (mean) is E(X) = Σ x_i · P(X = x_i).

The variance of a random variable measures the spread of its distribution: Var(X) = E(X²) - [E(X)]². The standard deviation is the square root of the variance: σ = √Var(X).

The binomial distribution models the number of successes in n independent Bernoulli trials, each with probability p of success. The probability of k successes is: P(X = k) = C(n,k) · p^k · (1-p)^(n-k). The mean is np and the variance is np(1-p).`,
      },
      // Biology — Genetics
      {
        id: 'ncert_bio_genetics',
        title: 'Principles of Inheritance and Variation',
        subject: 'Biology',
        topic: 'Genetics',
        source: 'NCERT Class 12 Biology, Chapter 5',
        sourceType: 'ncert' as const,
        chapter: 'Chapter 5: Principles of Inheritance',
        page: 70,
        content: `Genetics is the study of heredity and variation. Heredity is the transmission of traits from parents to offspring, while variation refers to the differences among individuals of the same species.

Mendel's laws of inheritance:
1. Law of dominance: In a cross between parents with contrasting traits, only one form of the trait appears in the F1 generation. The trait that appears is called dominant, and the one that does not is recessive.
2. Law of segregation: The two alleles for a trait separate during gamete formation, with each gamete receiving only one allele. This is also called the law of purity of gametes.
3. Law of independent assortment: Alleles for different traits segregate independently of each other during gamete formation. This law applies only to genes on different chromosomes or far apart on the same chromosome.

A Punnett square is a diagram used to predict the genotypes of offspring from a particular cross. For a monohybrid cross (Aa × Aa), the genotypic ratio is 1:2:1 (AA : Aa : aa) and the phenotypic ratio is 3:1 (dominant : recessive).

Incomplete dominance occurs when the heterozygote has an intermediate phenotype. For example, in snapdragons, crossing red (RR) with white (rr) gives pink (Rr) flowers in the F1 generation.

Codominance occurs when both alleles are fully expressed in the heterozygote. For example, in human blood types, IA and IB are codominant, so a person with genotype IAIB has blood type AB.

Multiple alleles: Some genes have more than two alleles in the population. The ABO blood group system has three alleles: IA, IB, and i. The possible genotypes are IAIA, IAi (type A); IBIB, IBi (type B); IAIB (type AB); ii (type O).

Sex-linked inheritance: Genes located on the X chromosome show a distinctive pattern of inheritance. Males (XY) inherit their X chromosome from their mother, so X-linked traits like color blindness and hemophilia are more common in males.

DNA (deoxyribonucleic acid) is the genetic material. It is a double helix with two antiparallel strands held together by hydrogen bonds between complementary base pairs: A-T (2 bonds) and G-C (3 bonds). The structure was discovered by Watson and Crick in 1953, based on X-ray diffraction data by Rosalind Franklin.`,
      },
    ];

    for (const seed of seedDocs) {
      const doc = chunkDocument(seed);
      docs.push(doc);
      allChunks.push(...doc.chunks);
    }

    globalThis.__rag_store__ = { documents: docs, chunks: allChunks };
  }
  return globalThis.__rag_store__;
}

// ---------------------------------------------------------------------------
// Public read API
// ---------------------------------------------------------------------------

export function listDocuments(): RagDocument[] {
  return getStore().documents;
}

export function getDocument(id: string): RagDocument | undefined {
  return getStore().documents.find(d => d.id === id);
}

export function getAllChunks(): RagChunk[] {
  return getStore().chunks;
}

export function getChunksForDocument(documentId: string): RagChunk[] {
  return getStore().chunks.filter(c => c.documentId === documentId);
}

// ---------------------------------------------------------------------------
// Add a new document (for future PDF upload feature)
// ---------------------------------------------------------------------------

export function addDocument(input: Omit<RagDocument, 'chunks' | 'createdAt'>): RagDocument {
  const store = getStore();
  const doc = chunkDocument(input);
  store.documents.push(doc);
  store.chunks.push(...doc.chunks);
  return doc;
}
