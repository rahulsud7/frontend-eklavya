import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  Target,
  CheckCircle2,
  Eye,
  EyeOff,
  ThumbsUp,
  RotateCcw,
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface FormattedMessageProps {
  content: string;
  onSelfTestSuccess?: () => void;
}

/**
 * Normalize LaTeX delimiters so remark-math + rehype-katex render EVERY equation emitted by LLMs:
 * - Preserves fenced code blocks (```...```) and inline code (`...`) untouched.
 * - Converts \[ ... \] (single-line or multi-line) into $$\n...\n$$
 * - Converts \( ... \) (including expressions with \frac, \sqrt, \theta, etc.) into $...$ with trimmed inner spaces
 * - Trims accidental spaces inside $ ... $ (Pandoc remark-math requires no space next to single $)
 * - Wraps standalone \begin{equation|align|aligned|gather}... environments in $$...$$
 */
export function normalizeLatexDelimiters(markdown: string): string {
  if (!markdown) return '';

  // Split around fenced code blocks and inline code spans so code is never altered
  const segments = markdown.split(/(```[\s\S]*?```|`[^`\n]+`)/g);

  return segments
    .map((segment, index) => {
      // Odd indices are matched code segments
      if (index % 2 === 1) return segment;

      let text = segment;

      // 1. Convert \[ ... \] display math into $$ ... $$ on its own lines
      text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => {
        const cleaned = String(inner).trim();
        return cleaned ? `\n\n$$\n${cleaned}\n$$\n\n` : '';
      });

      // 2. Convert \( ... \) inline math into $...$ (trimming inner spaces so remark-math parses reliably)
      text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => {
        const cleaned = String(inner).trim();
        return cleaned ? `$${cleaned}$` : '';
      });

      // 3. Wrap bare LaTeX math environments not already wrapped in $$...$$
      text = text.replace(
        /(^|\n)[ \t]*(\\begin\{(?:equation\*?|align\*?|aligned|gather\*?|cases)\}[\s\S]*?\\end\{(?:equation\*?|align\*?|aligned|gather\*?|cases)\})/g,
        (_m, prefix, envBlock) => `${prefix}\n$$\n${envBlock.trim()}\n$$\n`
      );

      // 4. Normalize multiline $$...$$ blocks so they have clean blank lines around them
      text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner) => {
        const cleaned = String(inner).trim();
        return cleaned ? `\n\n$$\n${cleaned}\n$$\n\n` : '';
      });

      // 5. Fix single-dollar inline math that has inner padding like `$ a^2 + b^2 $` (avoiding currency like `$5 and $10`)
      text = text.replace(/(?<!\$)\$(?!\$)[ \t]+([^$\n]+?)[ \t]+\$(?!\$)/g, (match, inner) => {
        const trimmed = String(inner).trim();
        // Only treat as math if it looks mathematical (contains operators, backslashes, letters+digits, ^, _)
        if (/[\\^_=+\-*/<>a-zA-Z]/.test(trimmed)) {
          return `$${trimmed}$`;
        }
        return match;
      });

      return text;
    })
    .join('');
}

const MarkdownMathContent: React.FC<{ content: string; compact?: boolean }> = ({ content, compact = false }) => {
  const normalized = useMemo(() => normalizeLatexDelimiters(content), [content]);

  return (
    <div className={`eklavya-markdown ${compact ? 'text-xs sm:text-sm' : 'text-xs sm:text-sm'} text-[#1E2922] leading-relaxed break-words`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false, trust: true }]]}
        components={{
          h1: ({ children }) => (
            <h2 className="text-base sm:text-lg font-extrabold text-[#1E3B2A] mt-4 mb-2 pb-1.5 border-b border-stone-200/80 first:mt-0">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h3 className="text-sm sm:text-base font-bold text-[#1E3B2A] mt-4 mb-2 pb-1 border-b border-stone-100 first:mt-0">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-xs sm:text-sm font-bold text-[#284E38] mt-3.5 mb-1.5 first:mt-0">
              {children}
            </h4>
          ),
          h4: ({ children }) => (
            <h5 className="text-[11px] sm:text-xs font-bold text-[#8C6D23] uppercase tracking-wider mt-3 mb-1 first:mt-0">
              {children}
            </h5>
          ),
          p: ({ children }) => (
            <p className="my-2 text-[#1E2922] leading-relaxed first:mt-0 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-[#1E3B2A]">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-stone-700">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="my-2 space-y-1.5 pl-5 list-disc marker:text-[#284E38]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 space-y-1.5 pl-5 list-decimal marker:text-[#8C6D23] marker:font-bold">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-stone-800 leading-relaxed pl-0.5">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-4 border-[#8C6D23] bg-amber-50/60 pl-3.5 pr-3 py-2 rounded-r-2xl text-stone-700 italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-stone-200/80" />,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-2xl border border-stone-200/90 shadow-2xs bg-white">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#FAF9F5] border-b border-stone-200 text-[#1E3B2A]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-stone-100">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-amber-50/30 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[11px] text-[#284E38] whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2.5 text-stone-700 align-top">{children}</td>
          ),
          pre: ({ children }) => (
            <pre className="p-3.5 bg-[#1E2922] text-emerald-200 font-mono text-xs rounded-2xl overflow-x-auto my-3 shadow-2xs border border-emerald-900/30">
              {children}
            </pre>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = Boolean(className && className.includes('language-'));
            if (isBlock) {
              return (
                <code className={`font-mono text-xs ${className || ''}`} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className="font-mono text-[11px] sm:text-xs px-1.5 py-0.5 bg-stone-100 text-[#8C6D23] border border-stone-200/80 rounded font-semibold"
                {...props}
              >
                {children}
              </code>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#284E38] font-semibold underline decoration-[#8C6D23]/50 underline-offset-2 hover:text-[#8C6D23] transition-colors"
            >
              {children}
            </a>
          )
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
};

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, onSelfTestSuccess }) => {
  // Robust match for any variation of Active-Recall Checkpoint header
  const checkpointRegex = /(?:^|\n)(?:[-*_]{3,}\s*\n)?(?:#{1,6}\s*)?(?:🎯|\*|•)?\s*(?:\*\*)?Active[- ]Recall Checkpoint(?:\*\*)?[:\s]*/i;
  const match = content.match(checkpointRegex);

  if (!match || match.index === undefined) {
    return <MarkdownMathContent content={content} />;
  }

  const mainText = content.slice(0, match.index).trim();
  const checkpointContent = content.slice(match.index + match[0].length).trim();

  return (
    <div className="space-y-4">
      {/* 1. Main explanation content rendered with full Markdown + KaTeX */}
      {mainText && <MarkdownMathContent content={mainText} />}

      {/* 2. Clear Visual Separation Divider before the Active-Recall section */}
      {checkpointContent && (
        <div className="pt-2">
          <div className="relative py-2.5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#8C6D23]/25 border-dashed" />
            </div>
            <div className="relative bg-white px-3.5 py-1 rounded-full border border-[#8C6D23]/30 shadow-2xs flex items-center gap-1.5 text-[10px] font-bold text-[#8C6D23] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#B85C38]" />
              <span>Active-Recall Knowledge Check</span>
            </div>
          </div>

          {/* 3. Dedicated Card Styling for Active-Recall Section */}
          <ActiveRecallCard
            rawContent={checkpointContent}
            onSelfTestSuccess={onSelfTestSuccess}
          />
        </div>
      )}
    </div>
  );
};

const ActiveRecallCard: React.FC<{ rawContent: string; onSelfTestSuccess?: () => void }> = ({
  rawContent,
  onSelfTestSuccess
}) => {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [rated, setRated] = useState<'knew' | 'relearn' | null>(null);

  // Split question vs answer if marked with Question/Answer, Q/A, or *Answer:*
  let questionPart = rawContent.trim();
  let answerPart = '';

  const answerRegex = /(?:^|\n)\s*(?:\*{1,2})?(?:A|Answer|Ans|Solution|उत्तर)(?:\*{1,2})?\s*:\s*([\s\S]*)/i;
  const answerMatch = rawContent.match(answerRegex);

  if (answerMatch && answerMatch.index !== undefined) {
    questionPart = rawContent.slice(0, answerMatch.index).trim();
    answerPart = (answerMatch[1] || '').replace(/^\*+|\*+$/g, '').trim();
  }

  // Clean leading prefixes like Q: / Question: / **Question:**
  questionPart = questionPart
    .replace(/^(?:[-*_]{3,}\s*)*/, '')
    .replace(/^(?:#{1,6}\s*)?/, '')
    .replace(/^(?:\*{1,2})?(?:Q|Question|प्रश्न)(?:\*{1,2})?\s*:\s*/i, '')
    .trim();

  const handleRate = (choice: 'knew' | 'relearn') => {
    setRated(choice);
    if (choice === 'knew' && onSelfTestSuccess) {
      onSelfTestSuccess();
    }
  };

  return (
    <div className="rounded-3xl border-2 border-[#B85C38]/30 bg-gradient-to-br from-[#FFFDF9] via-[#FAF6F0] to-[#F5EEE6] p-5 sm:p-6 shadow-md shadow-[#B85C38]/10 text-left relative overflow-hidden transition-all duration-200">
      {/* Subtle corner watermark illustration */}
      <div className="absolute -top-6 -right-6 w-28 h-28 bg-[#B85C38]/5 rounded-full pointer-events-none blur-sm" />

      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3.5 border-b border-[#B85C38]/15">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#B85C38] to-[#9E4624] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#B85C38]">
                Self-Test Challenge
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300/60">
                <Sparkles className="w-3 h-3 text-[#B85C38]" />
                <span>Active Retrieval</span>
              </span>
            </div>
            <p className="text-xs text-stone-600 font-medium mt-0.5">
              Pause and formulate your answer mentally before revealing the solution
            </p>
          </div>
        </div>

        {rated === 'knew' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mastered (+15 XP)</span>
          </span>
        )}
      </div>

      {/* Question Prompt */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C6D23] uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Checkpoint Question:</span>
        </div>
        <div className="text-sm sm:text-base font-semibold text-[#1E2922] leading-relaxed pl-1">
          <MarkdownMathContent content={questionPart} compact />
        </div>
      </div>

      {/* Answer Reveal Button & Hidden Content */}
      {answerPart && (
        <div className="mt-4 pt-3.5 border-t border-[#B85C38]/15">
          {!isAnswerRevealed ? (
            <button
              type="button"
              onClick={() => setIsAnswerRevealed(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-amber-50/80 border border-[#B85C38]/30 text-xs font-bold text-[#B85C38] shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-98"
            >
              <Eye className="w-4 h-4" />
              <span>Reveal Verified Solution &amp; Explanation</span>
            </button>
          ) : (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#284E38] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Curriculum Solution:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAnswerRevealed(false)}
                  className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
                >
                  <EyeOff className="w-3 h-3" />
                  <span>Hide</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white/95 border border-[#284E38]/20 text-xs sm:text-sm text-[#1E2922] leading-relaxed font-medium shadow-2xs">
                <MarkdownMathContent content={answerPart} compact />
              </div>

              {/* Self-Rating for Spaced Repetition */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-stone-500 font-semibold">
                  How well did you recall this theorem/concept?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRate('knew')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      rated === 'knew'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Recalled Accurately (+15 XP)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRate('relearn')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      rated === 'relearn'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Review Later</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
