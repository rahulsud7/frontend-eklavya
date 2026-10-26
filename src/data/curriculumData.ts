import { DocumentItem, QuizQuestion, FlashcardItem, CareerMilestone } from '../types';

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-math-ch1',
    user_id: 'user_123',
    filename: 'NCERT_Class10_Math_Ch1_Real_Numbers.pdf',
    custom_name: 'Real Numbers & Fundamental Theorem',
    subject: 'Mathematics',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    total_chunks: 38,
    file_size: '2.4 MB'
  },
  {
    id: 'doc-math-ch8',
    user_id: 'user_123',
    filename: 'NCERT_Class10_Math_Ch8_Trigonometry.pdf',
    custom_name: 'Introduction to Trigonometry & Ratios',
    subject: 'Mathematics',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    total_chunks: 46,
    file_size: '3.1 MB'
  },
  {
    id: 'doc-sci-ch1',
    user_id: 'user_123',
    filename: 'NCERT_Class10_Science_Ch1_Chemical_Reactions.pdf',
    custom_name: 'Chemical Reactions & Balancing Equations',
    subject: 'Science',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    total_chunks: 52,
    file_size: '3.8 MB'
  },
  {
    id: 'doc-sci-ch10',
    user_id: 'user_123',
    filename: 'NCERT_Class10_Science_Ch10_Light_Reflection.pdf',
    custom_name: 'Light: Reflection, Refraction & Lens Formula',
    subject: 'Science',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    total_chunks: 64,
    file_size: '4.2 MB'
  },
  {
    id: 'doc-sst-ch1',
    user_id: 'user_123',
    filename: 'NCERT_Class10_History_Rise_of_Nationalism.pdf',
    custom_name: 'The Rise of Nationalism in Europe',
    subject: 'Social Science',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    total_chunks: 41,
    file_size: '2.9 MB'
  }
];

export const CURRICULUM_FLASHCARDS: FlashcardItem[] = [
  {
    id: 'fc-1',
    subject: 'Mathematics',
    topic: 'Real Numbers',
    question: 'What does the Fundamental Theorem of Arithmetic state?',
    answer: 'Every composite number can be expressed (factorised) as a product of primes uniquely, apart from the order in which the prime factors occur. For example: 30 = 2 × 3 × 5.',
    doc_id: 'doc-math-ch1'
  },
  {
    id: 'fc-2',
    subject: 'Mathematics',
    topic: 'Trigonometry',
    question: 'What is the relationship between sin²θ and cos²θ?',
    answer: 'sin²θ + cos²θ = 1 for any angle 0° ≤ θ ≤ 90°. From this, 1 + tan²θ = sec²θ and 1 + cot²θ = cosec²θ are derived.',
    doc_id: 'doc-math-ch8'
  },
  {
    id: 'fc-3',
    subject: 'Mathematics',
    topic: 'Trigonometry',
    question: 'What is tan(45°) and what does it signify in real-world heights and distances?',
    answer: 'tan(45°) = 1. In navigation and surveying, if the angle of elevation to a tower top is 45°, the distance from the observer equals the height of the tower!',
    doc_id: 'doc-math-ch8'
  },
  {
    id: 'fc-4',
    subject: 'Science',
    topic: 'Chemical Reactions',
    question: 'Why does copper sulfate solution change color when an iron nail is immersed in it?',
    answer: 'Displacement reaction occurs! Iron is more reactive than copper (Fe + CuSO₄ → FeSO₄ + Cu). Blue copper sulfate turns light greenish ferrous sulfate while reddish-brown copper deposits on the iron nail.',
    doc_id: 'doc-sci-ch1'
  },
  {
    id: 'fc-5',
    subject: 'Science',
    topic: 'Light & Optics',
    question: 'State Snell’s Law of Refraction and the constant n.',
    answer: 'The ratio of sine of angle of incidence to sine of angle of refraction is a constant for given pair of media: sin(i) / sin(r) = constant (n₂₁). This constant is the refractive index.',
    doc_id: 'doc-sci-ch10'
  },
  {
    id: 'fc-6',
    subject: 'Science',
    topic: 'Light & Optics',
    question: 'What is the difference between convex and concave mirror focal lengths in the Cartesian sign convention?',
    answer: 'By sign convention: Focal length of a Concave Mirror is always Negative (f < 0). Focal length of a Convex Mirror is always Positive (f > 0).',
    doc_id: 'doc-sci-ch10'
  }
];

export const CURRICULUM_QUIZZES: Record<string, QuizQuestion[]> = {
  Mathematics: [
    {
      id: 1,
      topic: 'Real Numbers',
      question: 'If two positive integers a and b are written as a = x³y² and b = xy³, where x, y are prime numbers, then HCF(a, b) is:',
      options: ['xy', 'xy²', 'x³y³', 'x²y²'],
      correctAnswerIndex: 1,
      explanation: 'HCF is the product of the smallest power of each common prime factor involved in the numbers. Smallest power of x is x¹, and smallest power of y is y². Therefore, HCF(a, b) = xy².'
    },
    {
      id: 2,
      topic: 'Trigonometry',
      question: 'If sin θ + cos θ = √2 cos θ, then what is the value of (cos θ - sin θ)?',
      options: ['√2 sin θ', '√2 cos θ', '2 sin θ', '1/√2'],
      correctAnswerIndex: 0,
      explanation: 'Squaring both sides or rearranging: sin θ = (√2 - 1) cos θ. Multiply numerator and denominator by (√2 + 1) to get (cos θ - sin θ) = √2 sin θ.'
    },
    {
      id: 3,
      topic: 'Trigonometry',
      question: 'The value of (sin 30° + cos 60°) - (tan 45°) is equal to:',
      options: ['1', '0', '-1', '1/2'],
      correctAnswerIndex: 1,
      explanation: 'sin 30° = 1/2, cos 60° = 1/2, tan 45° = 1. So (1/2 + 1/2) - 1 = 1 - 1 = 0.'
    },
    {
      id: 4,
      topic: 'Real Numbers',
      question: 'According to Euclid\'s Division Lemma, for integers a and b (b > 0), there exist unique integers q and r such that a = bq + r, where r satisfies:',
      options: ['0 < r < b', '0 ≤ r ≤ b', '0 ≤ r < b', '0 < r ≤ b'],
      correctAnswerIndex: 2,
      explanation: 'The remainder r can be zero or positive, but strictly smaller than the divisor b: 0 ≤ r < b.'
    }
  ],
  Science: [
    {
      id: 1,
      topic: 'Chemical Reactions',
      question: 'When lead nitrate crystals are heated strongly in a dry test tube, which observations are noted?',
      options: [
        'White fumes are released with no residue',
        'Brown fumes of NO₂ gas and yellow residue of PbO',
        'Colorless gas turns lime water milky',
        'Green crystals turn blue'
      ],
      correctAnswerIndex: 1,
      explanation: 'Thermal decomposition: 2Pb(NO₃)₂ (s) → 2PbO (s) [yellow residue] + 4NO₂ (g) [pungent brown fumes] + O₂ (g).'
    },
    {
      id: 2,
      topic: 'Light & Optics',
      question: 'A concave mirror produces three times magnified real image of an object placed at 10 cm in front of it. Where is the image located?',
      options: ['-30 cm', '+30 cm', '-15 cm', '-60 cm'],
      correctAnswerIndex: 0,
      explanation: 'Magnification m = -v/u. Since image is real, m = -3. Given u = -10 cm. -3 = -v / (-10) ⇒ -3 = v/10 ⇒ v = -30 cm in front of mirror.'
    },
    {
      id: 3,
      topic: 'Chemical Reactions',
      question: 'Which of the following is an example of an endothermic reaction?',
      options: [
        'Respiration in living cells',
        'Decomposition of calcium carbonate (heating limestone)',
        'Burning of natural gas (Methane)',
        'Reaction of quicklime with water'
      ],
      correctAnswerIndex: 1,
      explanation: 'Decomposition of limestone CaCO₃ (s) + Heat → CaO (s) + CO₂ (g) requires heat absorption from surroundings, making it endothermic.'
    },
    {
      id: 4,
      topic: 'Light & Optics',
      question: 'The power of a lens is -2.0 D. Its focal length and nature are:',
      options: [
        '+50 cm, Convex lens',
        '-50 cm, Concave lens',
        '-20 cm, Concave lens',
        '+20 cm, Convex lens'
      ],
      correctAnswerIndex: 1,
      explanation: 'Power P = 1/f (in meters). f = 1/(-2.0) = -0.5 m = -50 cm. Negative focal length indicates a diverging Concave Lens.'
    }
  ],
  'Social Science': [
    {
      id: 1,
      topic: 'Nationalism in Europe',
      question: 'Who was described by Metternich as "the most dangerous enemy of our social order"?',
      options: ['Giuseppe Garibaldi', 'Giuseppe Mazzini', 'Count Cavour', 'Otto von Bismarck'],
      correctAnswerIndex: 1,
      explanation: 'Giuseppe Mazzini, founder of Young Italy and Young Europe secret societies, advocated for democratic republics and terrified Austrian Chancellor Metternich.'
    },
    {
      id: 2,
      topic: 'Nationalism in Europe',
      question: 'What did the custom union named "Zollverein" formed in 1834 abolish?',
      options: ['Feudal dues', 'Tariff barriers and reduced currencies from over thirty to two', 'Monarchy in Prussia', 'Compulsory military service'],
      correctAnswerIndex: 1,
      explanation: 'Initiated at the proposal of Prussia, the Zollverein abolished internal tariff barriers and reduced currency types from over 30 down to 2.'
    },
    {
      id: 3,
      topic: 'Nationalism in India',
      question: 'Why did Mahatma Gandhi organize the Salt March from Sabarmati to Dandi in 1930?',
      options: [
        'To demand complete commercial autonomy',
        'To defy the British state salt monopoly which affected both rich and poor',
        'To support mill workers of Ahmedabad',
        'To protest against partition of Bengal'
      ],
      correctAnswerIndex: 1,
      explanation: 'Salt was an indispensable item of food taxed heavily by the colonial monopoly. Defying the salt tax united the entire Indian populace across caste and class lines.'
    },
    {
      id: 4,
      topic: 'Resources & Development',
      question: 'Which soil type is known as "Regur Soil" and is ideal for growing cotton in Maharashtra and Gujarat?',
      options: ['Laterite Soil', 'Black Soil', 'Alluvial Soil', 'Arid Soil'],
      correctAnswerIndex: 1,
      explanation: 'Black soil, also known as Regur soil (from Telugu "reguda"), has high clay content, moisture retention, and is renowned for cotton cultivation.'
    }
  ]
};

export const CAREER_ROADMAPS: CareerMilestone[] = [
  {
    id: 'career-1',
    subject: 'Mathematics',
    domainTrack: 'Aerospace & Deep Tech',
    academicConcept: 'Trigonometry & Coordinate Geometry',
    indianJobRole: 'Satellite Trajectory & Orbital Specialist',
    industryDomain: 'Aerospace & Space Tech',
    organizationExamples: ['ISRO (URSC Bengaluru)', 'Skyroot Aerospace', 'Agnikul Cosmos', 'Pixxel Space'],
    salaryRange: '₹14 LPA - ₹32 LPA',
    keySkills: ['Vector Calculus', 'Euler Angles', 'Orbital Mechanics', 'C++ / MATLAB', 'Telemetry Analysis'],
    premierColleges: ['IIST Thiruvananthapuram', 'IIT Bombay Aerospace', 'IIT Madras', 'IISc Bengaluru'],
    targetExams: ['JEE Advanced (Rank < 2500 for IIST/IIT Aerospace)', 'GATE Aerospace'],
    ncertChapters: ['Class 10 Trigonometry', 'Class 11 Coordinate Geometry', 'Class 12 Vectors & 3D Geometry'],
    practicalApplication: 'Calculating spacecraft injection angles for Chandrayaan and Aditya-L1 missions using trigonometrical vector projections and coordinate frame transformations.',
    roadmapSteps: [
      {
        step: 1,
        stageName: 'Class 9-10 Foundation',
        timeframe: 'Grades 9 & 10',
        title: 'Master Trigonometric Identities & Kinematics',
        description: 'Establish flawless understanding of trigonometric ratios, coordinate geometry distances, and Newton’s laws of motion in NCERT Science.',
        keyMilestones: ['Complete NCERT Exemplar Trigonometry', 'Participate in National Space Science Olympiad (NSSO)', 'Score 95%+ in Class 10 Math & Science']
      },
      {
        step: 2,
        stageName: 'Class 11-12 Board & JEE Prep',
        timeframe: 'Grades 11 & 12',
        title: 'Rigorous Classical Mechanics & Vector Calculus',
        description: 'Prepare intensely for JEE Main & Advanced focusing on gravitation, rotational dynamics, vectors, and differential equations.',
        keyMilestones: ['Crack KVPY / IAT or JEE Main with 99+ percentile', 'Master 3D Geometry & Vectors in JEE Advanced', 'Secure admission to IIST Thiruvananthapuram or Top 5 IITs']
      },
      {
        step: 3,
        stageName: 'Premier Undergraduate Degree',
        timeframe: 'Undergraduate (4 Years)',
        title: 'B.Tech Aerospace / Avionics Engineering',
        description: 'Study orbital transfer maneuvers, attitude determination and control systems (ADCS), and participate in student satellite payload launches.',
        keyMilestones: ['Maintain CGPA > 8.5 for ISRO campus absorption', 'Build CubeSat or CanSat payload projects', 'Complete URSC Bengaluru summer internship']
      },
      {
        step: 4,
        stageName: 'National Space Mission Leadership',
        timeframe: 'Career Progression',
        title: 'Scientist / Engineer ‘SC’ at ISRO',
        description: 'Lead trajectory computations for interplanetary probes, Gaganyaan crew module re-entry, and commercial LEO constellation launches.',
        keyMilestones: ['Design trans-lunar injection maneuvers', 'Publish research on low-thrust orbital transfers', 'Spearhead deep-space telemetry architecture']
      }
    ]
  },
  {
    id: 'career-2',
    subject: 'Mathematics',
    domainTrack: 'FinTech & Quant Finance',
    academicConcept: 'Linear Algebra, Probability & Statistics',
    indianJobRole: 'High-Frequency Quantitative Researcher',
    industryDomain: 'Fintech & Capital Markets',
    organizationExamples: ['Tower Research Capital (Gurugram)', 'Graviton Research Capital', 'Jane Street / NSE Tech', 'WorldQuant India'],
    salaryRange: '₹35 LPA - ₹90+ LPA',
    keySkills: ['Stochastic Calculus', 'Statistical Arbitrage', 'Low Latency Modern C++', 'Python Data Science', 'Microstructure Alpha'],
    premierColleges: ['ISI Kolkata (B.Stat / M.Stat)', 'IIT Delhi Maths & Computing', 'IIT Kanpur', 'IIT Bombay CS'],
    targetExams: ['JEE Advanced (AIR < 500 for IIT MnC)', 'ISI Admission Test'],
    ncertChapters: ['Class 10 Statistics & Probability', 'Class 11 Permutations & Combinations', 'Class 12 Probability & Matrices'],
    practicalApplication: 'Developing mathematical algorithms that price derivatives and execute statistical arbitrage across Indian equity markets in sub-millisecond windows.',
    roadmapSteps: [
      {
        step: 1,
        stageName: 'Class 9-10 Foundation',
        timeframe: 'Grades 9 & 10',
        title: 'Olympiad-Level Combinatorics & Logic',
        description: 'Build deep intuition in probability, mean/median deviation, and competitive discrete mathematics.',
        keyMilestones: ['Solve IOQM / RMO problem sets', 'Master probability trees and permutations', 'Maintain 98%+ in Class 10 Mathematics']
      },
      {
        step: 2,
        stageName: 'Class 11-12 Board & JEE Prep',
        timeframe: 'Grades 11 & 12',
        title: 'Matrices, Determinants & Bayes’ Theorem Mastery',
        description: 'Target top percentiles in JEE Advanced with special focus on calculus, matrix algebra, and conditional probability distributions.',
        keyMilestones: ['Achieve Top 500 AIR in JEE Advanced or qualify ISI Kolkata', 'Win medals in Indian National Mathematical Olympiad (INMO)', 'Master C++ programming basics']
      },
      {
        step: 3,
        stageName: 'Premier Undergraduate Degree',
        timeframe: 'Undergraduate (4 Years)',
        title: 'B.Tech Mathematics & Computing / B.Stat at ISI',
        description: 'Study measure-theoretic probability, continuous-time stochastic processes, algorithm design, and ultra-low-latency Linux networking.',
        keyMilestones: ['Solve LeetCode hard + Codeforces Candidate Master', 'Implement order-book matching engine simulator', 'Secure summer internship at top algorithmic trading firm']
      },
      {
        step: 4,
        stageName: 'Industry Leadership',
        timeframe: 'Career Progression',
        title: 'Principal Quantitative Strategist',
        description: 'Design and deploy statistical alpha strategies generating market-neutral Sharpe ratios > 3.5 on Indian and global exchanges.',
        keyMilestones: ['Deploy algorithmic execution models on NSE/BSE colocation', 'Manage multi-crore quantitative portfolios', 'Lead quantitative research pods in Gurugram/Bengaluru']
      }
    ]
  },
  {
    id: 'career-3',
    subject: 'Science',
    domainTrack: 'Semiconductors & Deep Tech',
    academicConcept: 'Optics, Wave Propagation & Semiconductor Physics',
    indianJobRole: 'Photonic & VLSI Microchip Architect',
    industryDomain: 'Semiconductor & Telecom',
    organizationExamples: ['Tata Electronics Semiconductor Fabs', 'Texas Instruments India', 'Intel Bengaluru', 'Tejas Networks'],
    salaryRange: '₹16 LPA - ₹38 LPA',
    keySkills: ['Fiber Optics', 'Total Internal Reflection', 'CMOS VLSI Design', 'Verilog / SystemVerilog', 'Nanofabrication Lithography'],
    premierColleges: ['IIT Madras Electrical (Shakti Core)', 'IISc Bengaluru CeNSE', 'IIT Kharagpur', 'IIT Bombay'],
    targetExams: ['JEE Advanced (AIR < 1200 for Electrical)', 'GATE ECE'],
    ncertChapters: ['Class 10 Light: Reflection & Refraction', 'Class 12 Wave Optics', 'Class 12 Semiconductor Electronics'],
    practicalApplication: 'Engineering fiber-optic transceivers and indigenous silicon chips (such as India Semiconductor Mission 28nm/7nm nodes) powering high-speed networks.',
    roadmapSteps: [
      {
        step: 1,
        stageName: 'Class 9-10 Foundation',
        timeframe: 'Grades 9 & 10',
        title: 'Optics, Snell’s Law & Electricity Foundations',
        description: 'Understand ray diagrams, refractive indices, electric circuits, and Ohm’s law from NCERT Class 10 with experimental lab work.',
        keyMilestones: ['Build home breadboard LED circuits', 'Score 95%+ in Class 10 Physics', 'National Science Talent Search Examination (NSTSE)']
      },
      {
        step: 2,
        stageName: 'Class 11-12 Board & JEE Prep',
        timeframe: 'Grades 11 & 12',
        title: 'P-N Junction Diodes, Band Theory & EM Waves',
        description: 'Master solid-state electronic devices, logic gates, wave optics interference, and Maxwell’s equations for JEE Advanced.',
        keyMilestones: ['Score 95%+ in CBSE Physics with full marks in Semiconductors', 'Crack JEE Advanced Electrical / Electronics seat', 'Study fundamental CMOS logic switches']
      },
      {
        step: 3,
        stageName: 'Premier Undergraduate Degree',
        timeframe: 'Undergraduate (4 Years)',
        title: 'B.Tech Electrical & Electronics / Microelectronics',
        description: 'Hands-on cleanroom semiconductor fabrication at IISc CeNSE or IIT Madras Shakti lab; ASIC synthesis and FPGA tape-outs.',
        keyMilestones: ['Design 32-bit RISC-V processor core in Verilog', 'Complete internship at Texas Instruments or Qualcomm', 'Maintain CGPA > 8.8']
      },
      {
        step: 4,
        stageName: 'India Semiconductor Mission',
        timeframe: 'Career Progression',
        title: 'Lead Silicon Design & Tape-Out Engineer',
        description: 'Spearhead indigenous semiconductor tape-outs at Dholera & Morigaon semiconductor mega-fabs for 5G modems and AI accelerators.',
        keyMilestones: ['Deliver zero-defect silicon tape-outs', 'Patent novel low-power photonic interconnects', 'Lead national mission for self-reliant Indian chip design']
      }
    ]
  },
  {
    id: 'career-4',
    subject: 'Science',
    domainTrack: 'Medicine & Healthcare AI',
    academicConcept: 'Genetics, Molecular Biology & Life Processes',
    indianJobRole: 'Genomics Bioinformatician & Precision Medicine Specialist',
    industryDomain: 'Biotechnology & Clinical Genomics',
    organizationExamples: ['AIIMS New Delhi Genomics Lab', 'MedGenome Bengaluru', 'Strand Life Sciences', 'Biocon'],
    salaryRange: '₹14 LPA - ₹34 LPA',
    keySkills: ['CRISPR-Cas9 Modeling', 'Next-Gen Sequencing (NGS)', 'Python BioPython', 'Pharmacogenomics', 'Structural Biology'],
    premierColleges: ['AIIMS New Delhi', 'IISc Bengaluru Bioengineering', 'IIT Delhi Biotech', 'CMC Vellore'],
    targetExams: ['NEET-UG (Score > 685 for AIIMS)', 'JEE Advanced / IAT for IISc Bioengineering'],
    ncertChapters: ['Class 10 Life Processes', 'Class 10 Heredity and Evolution', 'Class 12 Principles of Inheritance'],
    practicalApplication: 'Analyzing whole genome sequence variations to diagnose rare pediatric Indian genetic diseases and prescribe targeted immuno-therapies.',
    roadmapSteps: [
      {
        step: 1,
        stageName: 'Class 9-10 Foundation',
        timeframe: 'Grades 9 & 10',
        title: 'Cell Biology, DNA Heredity & Human Anatomy',
        description: 'Establish thorough mastery of Mendel’s laws of inheritance, chromosome structure, cellular respiration, and DNA replication basics.',
        keyMilestones: ['Complete NCERT Class 10 Life Processes & Heredity', 'Participate in National Biology Olympiad (NSEB junior)', 'Score 95%+ in Science']
      },
      {
        step: 2,
        stageName: 'Class 11-12 Board & NEET Prep',
        timeframe: 'Grades 11 & 12',
        title: 'Molecular Basis of Inheritance & Recombinant DNA',
        description: 'Master central dogma (transcription/translation), biotechnology tools (restriction enzymes, PCR, vectors), and organic chemistry.',
        keyMilestones: ['Score 350+ out of 360 in NEET-UG Biology', 'Master NCERT line-by-line for 100% textbook retention', 'Secure admission to AIIMS or IISc BS-MS Bio']
      },
      {
        step: 3,
        stageName: 'Premier Undergraduate Degree',
        timeframe: 'Undergraduate (4-5 Years)',
        title: 'MBBS / B.Tech Biotechnology at AIIMS or IISc',
        description: 'Learn molecular diagnostic assays, NGS pipeline sequencing, clinical variant classification, and machine learning for genomics.',
        keyMilestones: ['Publish research in Indian Journal of Medical Research', 'Run variant call formats (VCF) on high-performance compute clusters', 'ICMR student research fellowship']
      },
      {
        step: 4,
        stageName: 'Clinical Genome Leadership',
        timeframe: 'Career Progression',
        title: 'Head of Molecular Diagnostics & Precision Oncology',
        description: 'Lead national genome sequencing initiatives (GenomeIndia project) enabling personalized cancer therapies across Indian hospital networks.',
        keyMilestones: ['Establish AI-driven rare disease diagnostic panels', 'Lead multi-centric clinical trials in India', 'Consult for Ministry of Health genomics roadmaps']
      }
    ]
  },
  {
    id: 'career-5',
    subject: 'Mathematics',
    domainTrack: 'Computer Science & Generative AI',
    academicConcept: 'Linear Algebra, Matrix Calculus & Optimization',
    indianJobRole: 'Foundational AI & Large Language Model Research Engineer',
    industryDomain: 'Artificial Intelligence & Cloud Computing',
    organizationExamples: ['Google DeepMind India', 'Microsoft Research India (Bengaluru)', 'Sarvam AI (Indian Bhashini LLMs)', 'Krutrim AI'],
    salaryRange: '₹32 LPA - ₹85+ LPA',
    keySkills: ['Attention Mechanism & Transformers', 'Distributed PyTorch / JAX', 'Matrix Eigenvalues & SVD', 'CUDA Kernel Optimization'],
    premierColleges: ['IIT Bombay CS', 'IIT Delhi CS', 'IIT Madras', 'IIIT Hyderabad (CVIT / LTRC)'],
    targetExams: ['JEE Advanced (AIR < 200 for IIT CSE)', 'UGEE for IIIT Hyderabad'],
    ncertChapters: ['Class 10 Polynomials & Quadratic Equations', 'Class 12 Matrices & Determinants', 'Class 12 Continuity & Derivatives'],
    practicalApplication: 'Training multi-lingual foundation models in 22 official Indian languages using gradient descent optimization across GPU clusters.',
    roadmapSteps: [
      {
        step: 1,
        stageName: 'Class 9-10 Foundation',
        timeframe: 'Grades 9 & 10',
        title: 'Algorithmic Thinking & Python Basics',
        description: 'Master polynomial roots, coordinate systems, and write clean Python code implementing sorting, recursion, and mathematical functions.',
        keyMilestones: ['Participate in Zonal Informatics Olympiad (ZIO)', 'Build simple math graphing apps in Python', 'Score 98%+ in Class 10 Math']
      },
      {
        step: 2,
        stageName: 'Class 11-12 Board & JEE Prep',
        timeframe: 'Grades 11 & 12',
        title: 'Differential Calculus & High-Performance Problem Solving',
        description: 'Intensive preparation for JEE Advanced focusing on maxima/minima, matrix transformations, vectors, and algorithmic coding in INOI.',
        keyMilestones: ['Secure Top 200 AIR in JEE Advanced or qualify INOI', 'Master matrix multiplication properties and calculus proofs', 'Earn 95%+ in CBSE Boards']
      },
      {
        step: 3,
        stageName: 'Premier Undergraduate Degree',
        timeframe: 'Undergraduate (4 Years)',
        title: 'B.Tech Computer Science & Engineering',
        description: 'Deep dive into machine learning theory, backpropagation calculus, distributed systems, GPU CUDA acceleration, and NLP.',
        keyMilestones: ['Publish paper in NeurIPS / ICML / ACL', 'Contribute to open-source PyTorch or Hugging Face transformers', 'Win international competitive programming hackathons']
      },
      {
        step: 4,
        stageName: 'Research & AI Frontier',
        timeframe: 'Career Progression',
        title: 'Staff Research Scientist — Generative Foundation Models',
        description: 'Architect next-generation sovereign Indian AI systems capable of real-time multi-modal reasoning across Indic speech and dialect nuances.',
        keyMilestones: ['Deploy foundation models serving 100M+ Indian citizens', 'Keynote speaker at national AI summits', 'Pioneer breakthrough parameter-efficient fine-tuning architectures']
      }
    ]
  },
  {
    id: 'career-6',
    subject: 'Social Science',
    domainTrack: 'Law, Public Policy & Governance',
    academicConcept: 'Democratic Politics, Federalism & Constitution of India',
    indianJobRole: 'Supreme Court Constitutional Advocate / Policy Secretary',
    industryDomain: 'Legal Practice, Judicial Services & Public Policy',
    organizationExamples: ['Supreme Court of India Bar', 'NITI Aayog (Policy Division)', 'Trilegal / Shardul Amarchand Mangaldas', 'IAS / Civil Services of India'],
    salaryRange: '₹18 LPA - ₹55+ LPA',
    keySkills: ['Constitutional Jurisprudence', 'Statutory Interpretation', 'Public Policy Drafting', 'Socio-Legal Advocacy', 'Judicial Precedent Research'],
    premierColleges: ['NLSIU Bengaluru', 'NALSAR Hyderabad', 'WBNUJS Kolkata', 'Faculty of Law Delhi University'],
    targetExams: ['CLAT (AIR < 75 for NLSIU Bengaluru)', 'UPSC Civil Services Examination'],
    ncertChapters: ['Class 10 Power Sharing & Federalism', 'Class 10 Democracy & Diversity', 'Class 11 Indian Constitution at Work'],
    practicalApplication: 'Drafting landmark constitutional briefs on fundamental rights, digital data protection (DPDP Act), and advising national economic policy at NITI Aayog.',
    roadmapSteps: [
      {
        step: 1,
        stageName: 'Class 9-10 Foundation',
        timeframe: 'Grades 9 & 10',
        title: 'Constitutional Foundations & Parliamentary Debate',
        description: 'Understand the Preamble, separation of powers, fundamental rights, and directive principles from NCERT Democratic Politics.',
        keyMilestones: ['Participate in Youth Parliament and Model UN', 'Win inter-school English & Hindi debates', 'Score 95%+ in Social Science']
      },
      {
        step: 2,
        stageName: 'Class 11-12 Board & CLAT Prep',
        timeframe: 'Grades 11 & 12',
        title: 'Legal Reasoning, Current Affairs & Logical Analysis',
        description: 'Rigorous preparation for CLAT focusing on critical reading comprehension, legal maxims, and landmark Supreme Court verdicts.',
        keyMilestones: ['Score AIR < 75 in Common Law Admission Test (CLAT)', 'Maintain 95%+ in CBSE Class 12 Boards', 'Secure admission to NLSIU Bengaluru']
      },
      {
        step: 3,
        stageName: 'Premier Law Degree (B.A. LL.B)',
        timeframe: 'Undergraduate (5 Years)',
        title: 'B.A. LL.B (Hons.) at National Law School of India',
        description: 'Moot court competitions (Philip C. Jessup), judicial clerkship under Supreme Court judges, and socio-economic policy research.',
        keyMilestones: ['Win national moot court championship', 'Publish articles in Indian Journal of Constitutional Law', 'Intern with Attorney General of India']
      },
      {
        step: 4,
        stageName: 'Constitutional & Policy Leadership',
        timeframe: 'Career Progression',
        title: 'Senior Advocate / Chief Legal Counsel',
        description: 'Argue milestone constitutional bench matters before the Supreme Court of India and draft white papers shaping statutory legislation.',
        keyMilestones: ['Designated Senior Advocate at High Court / Supreme Court', 'Draft national policy frameworks on AI & data ethics', 'Deliver lectures at National Judicial Academy']
      }
    ]
  }
];
