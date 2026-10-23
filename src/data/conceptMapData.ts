import { ConceptNode, ConceptLink } from '../types';

export const CONCEPT_NODES: ConceptNode[] = [
  // 1. SUBJECT HUBS (Root level)
  {
    id: 'subj-math',
    name: 'Mathematics',
    type: 'subject',
    subject: 'Mathematics',
    description: 'The language of logic, spatial structure, quantitative patterns, and rigorous deduction.',
    val: 38
  },
  {
    id: 'subj-sci',
    name: 'Science',
    type: 'subject',
    subject: 'Science',
    description: 'Empirical study of physical laws, chemical transformations, and biological life mechanisms.',
    val: 38
  },
  {
    id: 'subj-sst',
    name: 'Social Science',
    type: 'subject',
    subject: 'Social Science',
    description: 'Human institutions, economic resource distribution, constitutional democracy, and historical movements.',
    val: 34
  },

  // 2. MATHEMATICS CHAPTERS & CORE CONCEPTS
  {
    id: 'math-real-numbers',
    name: 'Real Numbers',
    type: 'chapter',
    subject: 'Mathematics',
    doc_id: 'doc-math-ch1',
    description: 'Fundamental Theorem of Arithmetic, prime factorizations, and proofs of irrationality (√2, √3, √5).',
    keyFormulas: ['a = bq + r (0 ≤ r < b)', 'HCF(a, b) × LCM(a, b) = a × b'],
    val: 26
  },
  {
    id: 'math-trigonometry',
    name: 'Trigonometry',
    type: 'chapter',
    subject: 'Mathematics',
    doc_id: 'doc-math-ch8',
    description: 'Ratios in right-angled triangles, complementary angles, and fundamental Pythagorean identities.',
    keyFormulas: ['sin²θ + cos²θ = 1', '1 + tan²θ = sec²θ', 'tan θ = sin θ / cos θ'],
    val: 28
  },
  {
    id: 'math-heights-distances',
    name: 'Heights & Distances',
    type: 'concept',
    subject: 'Mathematics',
    description: 'Applications of trigonometry using angles of elevation and depression to calculate unreachable heights.',
    keyFormulas: ['tan(θ) = Height / Distance', 'sin(θ) = Height / Hypotenuse'],
    val: 22
  },
  {
    id: 'math-triangles',
    name: 'Triangles & Similarity',
    type: 'chapter',
    subject: 'Mathematics',
    description: 'Basic Proportionality Theorem (Thales Theorem), AAA, SAS, and SSS similarity criteria.',
    keyFormulas: ['AD/DB = AE/EC', 'Area(Δ1)/Area(Δ2) = (side1/side2)²'],
    val: 24
  },
  {
    id: 'math-coord-geom',
    name: 'Coordinate Geometry',
    type: 'chapter',
    subject: 'Mathematics',
    description: 'Cartesian coordinate plane representations, distance between two points, and section formula.',
    keyFormulas: ['d = √[(x₂ - x₁)² + (y₂ - y₁)²]', 'P(x,y) = ((m₁x₂ + m₂x₁)/(m₁+m₂), (m₁y₂ + m₂y₁)/(m₁+m₂))'],
    val: 24
  },
  {
    id: 'math-statistics',
    name: 'Statistics & Probability',
    type: 'chapter',
    subject: 'Mathematics',
    description: 'Measures of central tendency (Mean, Median, Mode) for grouped data and empirical probability.',
    keyFormulas: ['x̄ = Σ(fᵢxᵢ) / Σfᵢ', 'Mode = l + [(f₁ - f₀)/(2f₁ - f₀ - f₂)] × h', 'P(E) = n(E) / n(S)'],
    val: 22
  },

  // 3. SCIENCE CHAPTERS & CORE CONCEPTS
  {
    id: 'sci-chemical-reactions',
    name: 'Chemical Reactions',
    type: 'chapter',
    subject: 'Science',
    doc_id: 'doc-sci-ch1',
    description: 'Chemical equation stoichiometry, combination, decomposition, displacement, and redox reactions.',
    keyFormulas: ['Fe + CuSO₄ → FeSO₄ + Cu', '2Pb(NO₃)₂ → 2PbO + 4NO₂ + O₂', 'Oxidation: Loss of e⁻ / Gain of O'],
    val: 26
  },
  {
    id: 'sci-light-optics',
    name: 'Light: Optics',
    type: 'chapter',
    subject: 'Science',
    doc_id: 'doc-sci-ch10',
    description: 'Reflection by spherical mirrors, refraction through lenses, Snell’s law, and optical power.',
    keyFormulas: ['1/f = 1/v + 1/u (Mirrors)', '1/f = 1/v - 1/u (Lenses)', 'n = sin(i) / sin(r) = c / v'],
    val: 28
  },
  {
    id: 'sci-total-internal-reflection',
    name: 'Total Internal Reflection',
    type: 'concept',
    subject: 'Science',
    description: 'Optical phenomenon when incident ray in dense medium exceeds critical angle θ_c, powering fiber optics.',
    keyFormulas: ['sin(θ_c) = n₂ / n₁ (n₁ > n₂)', '100% reflectance without metallic absorption'],
    val: 20
  },
  {
    id: 'sci-electricity',
    name: 'Electricity & Ohm’s Law',
    type: 'chapter',
    subject: 'Science',
    description: 'Electric potential, resistance, resistivity factors, series/parallel combinations, and Joule heating.',
    keyFormulas: ['V = I × R', 'R = ρ(L / A)', 'H = I²Rt (Joule Heating)', 'P = V × I'],
    val: 26
  },
  {
    id: 'sci-life-processes',
    name: 'Life Processes',
    type: 'chapter',
    subject: 'Science',
    description: 'Autotrophic photosynthesis, human digestive system, aerobic vs anaerobic cellular respiration.',
    keyFormulas: ['6CO₂ + 12H₂O + sunlight → C₆H₁₂O₆ + 6O₂ + 6H₂O', 'Glucose → Pyruvate → ATP'],
    val: 24
  },
  {
    id: 'sci-acids-bases',
    name: 'Acids, Bases & Salts',
    type: 'chapter',
    subject: 'Science',
    description: 'Arrhenius and Brønsted definitions, pH scale logarithm, indicators, and chlor-alkali manufacturing.',
    keyFormulas: ['pH = -log₁₀[H⁺]', 'Acid + Base → Salt + Water (Neutralization)'],
    val: 22
  },

  // 4. SOCIAL SCIENCE CHAPTERS & CORE CONCEPTS
  {
    id: 'sst-nationalism-europe',
    name: 'Nationalism in Europe',
    type: 'chapter',
    subject: 'Social Science',
    doc_id: 'doc-sst-ch1',
    description: 'French Revolution ideals, Napoleonic Code 1804, Romanticism, Giuseppe Mazzini, and Zollverein customs.',
    keyFormulas: ['Zollverein: Abolished tariff barriers', 'Nation-State sovereignty emergence'],
    val: 24
  },
  {
    id: 'sst-nationalism-india',
    name: 'Nationalism in India',
    type: 'chapter',
    subject: 'Social Science',
    description: 'Satyagraha, Rowlatt Act, Khilafat Movement, Non-Cooperation, and Dandi Salt March (Civil Disobedience).',
    keyFormulas: ['Satyagraha: Soul force of truth', 'Dandi Salt March: 240 miles to sea'],
    val: 26
  },
  {
    id: 'sst-resources-development',
    name: 'Resources & Development',
    type: 'chapter',
    subject: 'Social Science',
    description: 'Classification of natural resources, land degradation, sustainable development, and Indian soil profiles.',
    keyFormulas: ['Regur Black Soil: High moisture & cotton', 'Rio Earth Summit 1992 / Agenda 21'],
    val: 22
  },
  {
    id: 'sst-federalism',
    name: 'Federalism & Polity',
    type: 'chapter',
    subject: 'Social Science',
    description: 'Power-sharing between Union and State governments, Union/State/Concurrent lists, and 73rd Panchayati Raj.',
    keyFormulas: ['3-tier democratic governance', 'Article 246 division of legislative powers'],
    val: 22
  }
];

export const CONCEPT_LINKS: ConceptLink[] = [
  // 1. Math Subject Tree Links
  { source: 'subj-math', target: 'math-real-numbers', relation: 'Core Arithmetic' },
  { source: 'subj-math', target: 'math-trigonometry', relation: 'Geometric Ratios' },
  { source: 'subj-math', target: 'math-triangles', relation: 'Euclidean Geometry' },
  { source: 'subj-math', target: 'math-coord-geom', relation: 'Analytical Geometry' },
  { source: 'subj-math', target: 'math-statistics', relation: 'Empirical Data' },
  { source: 'math-trigonometry', target: 'math-heights-distances', relation: 'Real-world application' },
  { source: 'math-triangles', target: 'math-trigonometry', relation: 'Right-triangle foundations' },
  { source: 'math-real-numbers', target: 'math-coord-geom', relation: 'Cartesian Number Line' },

  // 2. Science Subject Tree Links
  { source: 'subj-sci', target: 'sci-chemical-reactions', relation: 'Molecular Chemistry' },
  { source: 'subj-sci', target: 'sci-light-optics', relation: 'Wave & Ray Physics' },
  { source: 'subj-sci', target: 'sci-electricity', relation: 'Electromagnetism' },
  { source: 'subj-sci', target: 'sci-life-processes', relation: 'Bio-energetics' },
  { source: 'subj-sci', target: 'sci-acids-bases', relation: 'Ionic Equilibria' },
  { source: 'sci-light-optics', target: 'sci-total-internal-reflection', relation: 'Critical angle boundary' },
  { source: 'sci-chemical-reactions', target: 'sci-acids-bases', relation: 'Neutralization reactions' },
  { source: 'sci-chemical-reactions', target: 'sci-electricity', relation: 'Redox & Electrochemistry' },
  { source: 'sci-life-processes', target: 'sci-chemical-reactions', relation: 'Biochemical oxidation' },

  // 3. Social Science Tree Links
  { source: 'subj-sst', target: 'sst-nationalism-europe', relation: 'Modern History' },
  { source: 'subj-sst', target: 'sst-nationalism-india', relation: 'Freedom Struggle' },
  { source: 'subj-sst', target: 'sst-resources-development', relation: 'Geography & Ecology' },
  { source: 'subj-sst', target: 'sst-federalism', relation: 'Political Science' },
  { source: 'sst-nationalism-europe', target: 'sst-nationalism-india', relation: 'Anti-colonial inspiration' },
  { source: 'sst-resources-development', target: 'sst-federalism', relation: 'National mineral & water sharing' },

  // 4. CROSS-SUBJECT BRIDGES (The Magic of Interdisciplinary STEM & Humanities)
  {
    source: 'math-trigonometry',
    target: 'sci-light-optics',
    relation: 'Snell’s Law [sin(i)/sin(r) = n₂/n₁]',
    isCrossSubject: true
  },
  {
    source: 'math-heights-distances',
    target: 'sci-total-internal-reflection',
    relation: 'Optoelectronic Telemetry & Fiber Geometry',
    isCrossSubject: true
  },
  {
    source: 'math-coord-geom',
    target: 'sci-electricity',
    relation: 'V-I Characteristics & Resistance Slope',
    isCrossSubject: true
  },
  {
    source: 'math-statistics',
    target: 'sst-resources-development',
    relation: 'Geospatial Data & Demographic Sampling',
    isCrossSubject: true
  },
  {
    source: 'sci-electricity',
    target: 'sst-resources-development',
    relation: 'Renewable Power Grids & Thermal Coal Planning',
    isCrossSubject: true
  }
];
