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
    academicConcept: 'Trigonometry & Coordinate Geometry',
    indianJobRole: 'Satellite Trajectory & Orbital Specialist',
    industryDomain: 'Aerospace & Space Tech',
    organizationExamples: ['ISRO (URSC Bengaluru)', 'Skyroot Aerospace', 'Agnikul Cosmos'],
    salaryRange: '₹14 LPA - ₹32 LPA',
    keySkills: ['Vector Calculus', 'Euler Angles', 'Orbital Mechanics', 'C++ / MATLAB', 'Telemetry Analysis'],
    premierColleges: ['IIST Thiruvananthapuram', 'IIT Bombay Aerospace', 'IIT Madras'],
    practicalApplication: 'Calculating spacecraft injection angles for Chandrayaan and Aditya-L1 missions using trigonometrical vector projections and coordinate frame transformations.'
  },
  {
    id: 'career-2',
    subject: 'Mathematics',
    academicConcept: 'Linear Algebra & Probability',
    indianJobRole: 'High-Frequency Quantitative Trader / Risk Analyst',
    industryDomain: 'Fintech & Capital Markets',
    organizationExamples: ['Tower Research Capital (Gurugram)', 'Graviton Research Capital', 'Jane Street / NSE Tech'],
    salaryRange: '₹28 LPA - ₹75+ LPA',
    keySkills: ['Stochastic Calculus', 'Statistical Arbitrage', 'Low Latency C++', 'Python Data Science'],
    premierColleges: ['ISI Kolkata', 'IIT Delhi Maths & Computing', 'IIT Kanpur'],
    practicalApplication: 'Developing mathematical algorithms that price derivatives and execute statistical arbitrage across Indian equity markets in sub-millisecond windows.'
  },
  {
    id: 'career-3',
    subject: 'Science',
    academicConcept: 'Optics, Wave Propagation & Semiconductor Physics',
    indianJobRole: 'Photonic Circuit & Optical Sensor Engineer',
    industryDomain: 'Semiconductor & Telecom',
    organizationExamples: ['Tata Electronics', 'Sterlite Optical Technologies', 'Tejas Networks (Bengaluru)'],
    salaryRange: '₹12 LPA - ₹28 LPA',
    keySkills: ['Fiber Optics', 'Total Internal Reflection', 'Waveguides', 'VLSI Design', 'Lithography'],
    premierColleges: ['IIT Madras Electrical', 'IISc Bengaluru', 'IIT Kharagpur'],
    practicalApplication: 'Engineering fiber-optic transceivers and indigenous semiconductor chips powering 5G/6G communication backbones across India.'
  },
  {
    id: 'career-4',
    subject: 'Science',
    academicConcept: 'Chemical Energetics, Electrochemistry & Redox Reactions',
    indianJobRole: 'EV Battery Management & Cathode Material Scientist',
    industryDomain: 'Clean Mobility & Renewable Energy',
    organizationExamples: ['Ola Electric Tech Centre', 'Tata Power EV', 'Ather Energy', 'Exide Energy'],
    salaryRange: '₹10 LPA - ₹26 LPA',
    keySkills: ['Lithium-Ion Chemistry', 'Redox Kinetics', 'Thermal Runaway Prevention', 'Battery Modeling'],
    premierColleges: ['IIT Roorkee Chemical', 'ICT Mumbai', 'IIT Hyderabad'],
    practicalApplication: 'Designing high energy-density battery cells tailored for tropical Indian summer temperatures with thermal mitigation algorithms.'
  },
  {
    id: 'career-5',
    subject: 'Mathematics',
    academicConcept: 'Algorithms, Discrete Mathematics & Graph Theory',
    indianJobRole: 'Supply Chain Optimization & Logistics Architect',
    industryDomain: 'E-Commerce & Quick Commerce',
    organizationExamples: ['Zepto / Blinkit (B2C Logistics)', 'Delhivery', 'Flipkart / Amazon India'],
    salaryRange: '₹16 LPA - ₹38 LPA',
    keySkills: ['Dijkstra & Travelling Salesman', 'Network Flow', 'Combinatorial Optimization', 'Python PuLP'],
    premierColleges: ['IIT Bombay CS', 'IIT Madras', 'BITS Pilani'],
    practicalApplication: 'Solving routing matrices for 10-minute grocery delivery riders across dense metropolitan Indian traffic networks using topological graph shortest-paths.'
  }
];
