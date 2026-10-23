import React, { useState } from 'react';
import { Brain, ArrowRight, Database, Cpu, FileText, CheckCircle2, Zap, Sparkles } from 'lucide-react';

export const AboutTab: React.FC = () => {
  const [activeCurveTab, setActiveCurveTab] = useState<'standard' | 'eklavya'>('eklavya');

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Intro Header */}
      <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#8C6D23]/20 shadow-md text-left">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8C6D23] bg-[#FCECD4] px-3 py-1 rounded-full border border-[#8C6D23]/20 mb-3">
          <Brain className="w-3.5 h-3.5 text-[#B85C38]" />
          Pedagogical Philosophy & Engineering Architecture
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#284E38]">
          The Science Behind Project Eklavya
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-3xl leading-relaxed">
          Inspired by the legendary archer Eklavya who attained supreme mastery through relentless self-directed practice, this platform pairs <strong>Cognitive Science principles</strong> with high-performance <strong>Retrieval-Augmented Generation (RAG)</strong> to deliver deep conceptual retention.
        </p>
      </div>

      {/* 1. Visual Data Flow Diagram (DFD) */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-md text-left">
        <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-lg font-bold text-[#284E38] flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#B85C38]" />
              End-to-End System Data Flow Diagram (DFD)
            </h3>
            <p className="text-xs text-stone-500">
              PDF Text Extraction · Sentence Transformers · Supabase pgvector · Groq LLM
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#8C6D23] bg-[#FAF9F5] px-2.5 py-1 rounded-lg border border-[#8C6D23]/20">
            Vector Dim: 384
          </span>
        </div>

        {/* DFD Horizontal Pipeline Flexbox */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
          {/* Node 1: PDF Document Ingestion */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border-2 border-[#284E38]/20 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-xl bg-[#284E38] text-white flex items-center justify-center font-bold text-xs mb-2 shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-[#284E38] uppercase tracking-wider mb-1">
                1. PDF Ingestion
              </h4>
              <p className="text-xs text-stone-600 leading-snug">
                Extracts raw textbook text from NCERT or classroom notes. Removes formatting artifacts and parses tables.
              </p>
            </div>
            <div className="text-[10px] font-mono text-stone-400 mt-3 pt-2 border-t border-stone-200">
              POST /api/upload
            </div>
          </div>

          {/* Node 2: Chunking & Embeddings */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border-2 border-[#8C6D23]/30 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-xl bg-[#8C6D23] text-white flex items-center justify-center font-bold text-xs mb-2 shadow-xs">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-[#8C6D23] uppercase tracking-wider mb-1">
                2. Semantic Chunking
              </h4>
              <p className="text-xs text-stone-600 leading-snug">
                Segments text into 500-token semantic chunks. Encoded with <code>paraphrase-multilingual-MiniLM-L12-v2</code>.
              </p>
            </div>
            <div className="text-[10px] font-mono text-stone-400 mt-3 pt-2 border-t border-stone-200">
              Embedding: 384 floats
            </div>
          </div>

          {/* Node 3: Supabase pgvector */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border-2 border-emerald-600/30 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs mb-2 shadow-xs">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                3. Supabase pgvector
              </h4>
              <p className="text-xs text-stone-600 leading-snug">
                Executes cosine similarity indexing (HNSW). Filters by <code>user_id</code> and <code>doc_id</code> for scoped queries.
              </p>
            </div>
            <div className="text-[10px] font-mono text-stone-400 mt-3 pt-2 border-t border-stone-200">
              1 - (embedding &lt;=&gt; query)
            </div>
          </div>

          {/* Node 4: Groq Llama 3 Inference */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border-2 border-[#B85C38]/30 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-xl bg-[#B85C38] text-white flex items-center justify-center font-bold text-xs mb-2 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-[#B85C38] uppercase tracking-wider mb-1">
                4. Groq LLM Inference
              </h4>
              <p className="text-xs text-stone-600 leading-snug">
                Retrieves top chunks into Llama-3 prompt. Streams bilingual Hinglish output with Active-Recall Checkpoint.
              </p>
            </div>
            <div className="text-[10px] font-mono text-stone-400 mt-3 pt-2 border-t border-stone-200">
              POST /api/query
            </div>
          </div>
        </div>

        {/* Visual Arrow Strip */}
        <div className="hidden md:flex items-center justify-around py-3 text-stone-400 text-xs font-bold">
          <span className="flex items-center gap-1">Token Stream <ArrowRight className="w-4 h-4 text-[#8C6D23]" /></span>
          <span className="flex items-center gap-1">Vector Array <ArrowRight className="w-4 h-4 text-[#8C6D23]" /></span>
          <span className="flex items-center gap-1">Cosine Retrieval <ArrowRight className="w-4 h-4 text-[#8C6D23]" /></span>
          <span className="flex items-center gap-1">Bilingual Response <CheckCircle2 className="w-4 h-4 text-emerald-600" /></span>
        </div>
      </div>

      {/* 2. Ebbinghaus Forgetting Curve Visualizer */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-md text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-bold text-[#284E38]">
              The Ebbinghaus Forgetting Curve & Spaced Repetition
            </h3>
            <p className="text-xs text-stone-500">
              Without active review, humans forget over 70% of new information within 48 hours.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveCurveTab('standard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeCurveTab === 'standard'
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Passive Reading (Standard)
            </button>
            <button
              type="button"
              onClick={() => setActiveCurveTab('eklavya')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeCurveTab === 'eklavya'
                  ? 'bg-[#284E38] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Eklavya Active Recall
            </button>
          </div>
        </div>

        {/* Visual Graph Schematic */}
        <div className="relative h-56 bg-[#FAF9F5] rounded-2xl p-5 border border-stone-200 flex flex-col justify-between overflow-hidden">
          {/* Axis Labels */}
          <div className="absolute top-3 left-4 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            Retention (%)
          </div>
          <div className="absolute bottom-2 right-4 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            Days Elapsed →
          </div>

          {/* SVG Curve Comparison */}
          <svg className="w-full h-full overflow-visible" viewBox="0 0 600 160">
            {/* Gridlines */}
            <line x1="40" y1="20" x2="580" y2="20" stroke="#e5e7eb" strokeDasharray="3 3" />
            <line x1="40" y1="60" x2="580" y2="60" stroke="#e5e7eb" strokeDasharray="3 3" />
            <line x1="40" y1="100" x2="580" y2="100" stroke="#e5e7eb" strokeDasharray="3 3" />
            <line x1="40" y1="140" x2="580" y2="140" stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Passive Curve (Drops sharply) */}
            <path
              d="M 40 20 Q 100 110, 200 130 T 580 145"
              fill="none"
              stroke="#ef4444"
              strokeWidth={activeCurveTab === 'standard' ? '3.5' : '1.5'}
              strokeOpacity={activeCurveTab === 'standard' ? '1' : '0.2'}
              strokeDasharray={activeCurveTab === 'standard' ? 'none' : '4 4'}
              className="transition-all duration-300"
            />

            {/* Eklavya Spaced Repetition Curve (Bounces back up at each review) */}
            <path
              d="M 40 20 Q 90 70, 140 85 L 140 30 Q 210 65, 280 75 L 280 32 Q 400 50, 580 42"
              fill="none"
              stroke="#284E38"
              strokeWidth={activeCurveTab === 'eklavya' ? '3.5' : '1.5'}
              strokeOpacity={activeCurveTab === 'eklavya' ? '1' : '0.25'}
              className="transition-all duration-300"
            />

            {/* Checkpoint nodes on Eklavya curve */}
            <circle cx="140" cy="30" r="5" fill="#8C6D23" />
            <circle cx="280" cy="32" r="5" fill="#8C6D23" />
            <circle cx="580" cy="42" r="5" fill="#284E38" />

            <text x="145" y="25" fontSize="10" fontWeight="bold" fill="#8C6D23">Review 1 (Day 1)</text>
            <text x="285" y="27" fontSize="10" fontWeight="bold" fill="#8C6D23">Review 2 (Day 3)</text>
            <text x="500" y="38" fontSize="10" fontWeight="bold" fill="#284E38">92% Retention</text>
          </svg>

          {/* Retention Stats */}
          <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-stone-200">
            <span className="text-stone-500">Day 0: 100% Absorbed</span>
            <span className="text-stone-500">Day 1: Flashcard Test</span>
            <span className="text-stone-500">Day 3: Quiz Arena</span>
            <span className="font-bold text-[#284E38]">Day 7+: Long-Term Memory Consolidates</span>
          </div>
        </div>
      </div>

      {/* 3. Sweller's Cognitive Load Theory */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-md text-left">
        <h3 className="text-lg font-bold text-[#284E38] mb-2">
          Sweller&apos;s Cognitive Load Theory (CLT)
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 mb-6 leading-relaxed">
          Human working memory can hold only 4±1 novel pieces of information at once. Project Eklavya optimizes cognitive architecture across three distinct loads:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="text-xs font-extrabold uppercase tracking-wider text-blue-700 mb-1">
              1. Intrinsic Load
            </div>
            <h4 className="text-sm font-bold text-stone-900 mb-2">Inherent Complexity</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              The inherent conceptual difficulty of equations and definitions. We break multi-step proofs into bite-sized intuitive steps without dumbing down the syllabus.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#B85C38] mb-1">
              2. Extraneous Load
            </div>
            <h4 className="text-sm font-bold text-stone-900 mb-2">Zero Friction (Eliminated)</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Mental fatigue caused by confusing UI, unnecessary clutter, or poorly translated jargon. Eklavya eliminates this with a serene warm beige canvas and bilingual Hinglish clarity.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 mb-1">
              3. Germane Load
            </div>
            <h4 className="text-sm font-bold text-stone-900 mb-2">Schema Building (Maximized)</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              The mental processing that builds lasting neurological schemas. Triggered dynamically by <strong>Active-Recall Checkpoints</strong> and 3D flashcard retrieval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
