import React, { useState } from 'react';
import {
  Target,
  CheckCircle2,
  Eye,
  EyeOff,
  ThumbsUp,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  Calculator
} from 'lucide-react';

interface FormattedMessageProps {
  content: string;
  onSelfTestSuccess?: () => void;
}

/**
 * Format LaTeX mathematical formulas into elegant, readable symbols & typography
 * Solves raw \[ c^{2}=a^{2}+b^{2} \] syntax glitches cleanly!
 */
export function formatMathExpression(formula: string): string {
  let cleaned = formula.trim();

  // Strip wrapping delimiters if present
  if (cleaned.startsWith('\\[') && cleaned.endsWith('\\]')) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (cleaned.startsWith('$$') && cleaned.endsWith('$$')) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (cleaned.startsWith('\\(') && cleaned.endsWith('\\)')) {
    cleaned = cleaned.slice(2, -2).trim();
  }

  // Remove \boxed{...}
  cleaned = cleaned.replace(/\\boxed\{([^}]+)\}/g, '$1');

  // Remove \text{...} or \mathrm{...}
  cleaned = cleaned.replace(/\\text\{([^}]+)\}/g, '$1');
  cleaned = cleaned.replace(/\\mathrm\{([^}]+)\}/g, '$1');
  cleaned = cleaned.replace(/\\mathbf\{([^}]+)\}/g, '$1');

  // Fractions: \frac{a}{b} -> (a / b) or a/b
  cleaned = cleaned.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1 / $2)');

  // Square roots: \sqrt{...} -> √( ... )
  cleaned = cleaned.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');

  // Greek letters
  cleaned = cleaned
    .replace(/\\theta/g, 'θ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\pi/g, 'π')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\infty/g, '∞');

  // Common Math Operators
  cleaned = cleaned
    .replace(/\\pm/g, '±')
    .replace(/\\mp/g, '∓')
    .replace(/\\times/g, ' × ')
    .replace(/\\cdot/g, ' · ')
    .replace(/\\div/g, ' ÷ ')
    .replace(/\\approx/g, ' ≈ ')
    .replace(/\\neq/g, ' ≠ ')
    .replace(/\\leq/g, ' ≤ ')
    .replace(/\\geq/g, ' ≥ ')
    .replace(/\\equiv/g, ' ≡ ')
    .replace(/\\to/g, ' → ')
    .replace(/\\rightarrow/g, ' → ')
    .replace(/\\degree/g, '°')
    .replace(/\^\\circ/g, '°');

  // Superscripts replacement: e.g. c^{2} -> c², a^{2} -> a², x^{3} -> x³
  const supMap: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ'
  };

  // Convert ^{single_digit_or_char}
  cleaned = cleaned.replace(/\^\{([0-9nix+\-()]+)\}/g, (_, p1) => {
    return p1.split('').map((char: string) => supMap[char] || `^${char}`).join('');
  });
  // Convert ^digit without braces e.g. c^2 -> c²
  cleaned = cleaned.replace(/\^([0-9nix])/g, (_, p1) => supMap[p1] || `^${p1}`);

  // Subscripts: e.g. x_{1} -> x₁
  const subMap: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
    'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ'
  };
  cleaned = cleaned.replace(/_\{([0-9aeox+\-()]+)\}/g, (_, p1) => {
    return p1.split('').map((char: string) => subMap[char] || `_${char}`).join('');
  });
  cleaned = cleaned.replace(/_([0-9aeox])/g, (_, p1) => subMap[p1] || `_${p1}`);

  // Clean spacing around = and + and - if compacted
  cleaned = cleaned
    .replace(/([^\s=+*/<>-])=([^\s=+*/<>-])/g, '$1 = $2')
    .replace(/([^\s=+*/<>-])\+([^\s=+*/<>-])/g, '$1 + $2')
    .replace(/([a-zA-Z0-9⁰¹²³⁴⁵⁶⁷⁸⁹])-(?=[a-zA-Z0-9])/g, '$1 - ');

  return cleaned;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, onSelfTestSuccess }) => {
  // Robust match for any variation of Active-Recall Checkpoint header
  const checkpointRegex = /(?:^|\n)(?:[-*_]{3,}\s*\n)?(?:#{1,6}\s*)?(?:🎯|\*|•)?\s*(?:\*\*)?Active[- ]Recall Checkpoint(?:\*\*)?[:\s]*/i;
  const match = content.match(checkpointRegex);

  if (!match || match.index === undefined) {
    return <div className="space-y-3 leading-relaxed text-[#1E2922] dark:text-[#EAE8E3]">{renderRichText(content)}</div>;
  }

  const mainText = content.slice(0, match.index).trim();
  const checkpointContent = content.slice(match.index + match[0].length).trim();

  return (
    <div className="space-y-4">
      {/* 1. Main explanation content with refined typography & spacing */}
      {mainText && (
        <div className="space-y-3 leading-relaxed text-[#1E2922] dark:text-[#EAE8E3]">
          {renderRichText(mainText)}
        </div>
      )}

      {/* 2. Clear Visual Separation Divider before the Active-Recall section */}
      {checkpointContent && (
        <div className="pt-3">
          <div className="relative py-2.5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#8C6D23]/25 dark:border-[#8C6D23]/40 border-dashed" />
            </div>
            <div className="relative bg-white dark:bg-[#1A221D] px-3.5 py-1 rounded-full border border-[#8C6D23]/30 dark:border-[#8C6D23]/50 shadow-2xs flex items-center gap-1.5 text-[10px] font-bold text-[#8C6D23] dark:text-[#E6B34A] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#B85C38] dark:text-[#E07048]" />
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

  // Split question vs answer if marked with Question/Answer, Q/A, or Answer:*
  let questionPart = rawContent.trim();
  let answerPart = '';

  const answerRegex = /(?:^|\n)\s*(?:\*\*)?(?:A|Answer|Ans|Solution|उत्तर)(?:\*\*)?\s*:\s*([\s\S]*)/i;
  const answerMatch = rawContent.match(answerRegex) || rawContent.match(/(\*(?:Answer|उत्तर):[\s\S]*)/i);

  if (answerMatch && answerMatch.index !== undefined) {
    questionPart = rawContent.slice(0, answerMatch.index).trim();
    if (answerMatch[1]) {
      answerPart = answerMatch[1].replace(/^\*(?:Answer|उत्तर):\s*/i, '').replace(/\*$/, '').trim();
    } else {
      answerPart = answerMatch[0].replace(/^[\s\S]*?(?:A|Answer|Ans|Solution|उत्तर)[*:]*\s*/i, '').replace(/\*$/, '').trim();
    }
  }

  // Clean leading prefixes like Q: / Question: / **Q:**
  questionPart = questionPart
    .replace(/^(?:[-*_]{3,}\s*)*/, '')
    .replace(/^(?:#{1,6}\s*)?/, '')
    .replace(/^(?:\*\*)?(?:Q|Question|प्रश्न)(?:\*\*)?\s*:\s*/i, '')
    .trim();

  const handleRate = (choice: 'knew' | 'relearn') => {
    setRated(choice);
    if (choice === 'knew' && onSelfTestSuccess) {
      onSelfTestSuccess();
    }
  };

  return (
    <div className="rounded-3xl border-2 border-[#B85C38]/30 dark:border-[#B85C38]/50 bg-gradient-to-br from-[#FFFDF9] via-[#FAF6F0] to-[#F5EEE6] dark:from-[#1E2620] dark:via-[#19201B] dark:to-[#151B17] p-5 sm:p-6 shadow-md shadow-[#B85C38]/10 dark:shadow-black/40 text-left relative overflow-hidden transition-all duration-200">
      {/* Subtle corner watermark illustration */}
      <div className="absolute -top-6 -right-6 w-28 h-28 bg-[#B85C38]/5 dark:bg-[#B85C38]/10 rounded-full pointer-events-none blur-sm" />

      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3.5 border-b border-[#B85C38]/15 dark:border-[#B85C38]/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#B85C38] to-[#9E4624] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#B85C38] dark:text-[#E07048]">
                Self-Test Challenge
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300/60 dark:border-amber-700/60">
                <Sparkles className="w-3 h-3 text-[#B85C38] dark:text-amber-400" />
                <span>Active Retrieval</span>
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 font-medium mt-0.5">
              Pause and formulate your answer mentally before revealing the solution
            </p>
          </div>
        </div>

        {rated === 'knew' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-300/80 dark:border-emerald-700/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Mastered (+15 XP)</span>
          </span>
        )}
      </div>

      {/* Question Prompt */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C6D23] dark:text-[#E6B34A] uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Checkpoint Question:</span>
        </div>
        <div className="text-sm sm:text-base font-semibold text-[#1E2922] dark:text-[#F3F2EE] leading-relaxed pl-1">
          {renderRichText(questionPart)}
        </div>
      </div>

      {/* Answer Reveal Button & Hidden Content */}
      {answerPart && (
        <div className="mt-4 pt-3.5 border-t border-[#B85C38]/15 dark:border-[#B85C38]/30">
          {!isAnswerRevealed ? (
            <button
              type="button"
              onClick={() => setIsAnswerRevealed(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#1A221D] hover:bg-amber-50/80 dark:hover:bg-[#232F27] border border-[#B85C38]/30 dark:border-[#B85C38]/50 text-xs font-bold text-[#B85C38] dark:text-[#E07048] shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-98"
            >
              <Eye className="w-4 h-4" />
              <span>Reveal Verified Solution & Explanation</span>
            </button>
          ) : (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#284E38] dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Curriculum Solution:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAnswerRevealed(false)}
                  className="text-[11px] text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer"
                >
                  <EyeOff className="w-3 h-3" />
                  <span>Hide</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#1A221D]/95 border border-[#284E38]/20 dark:border-emerald-700/30 text-xs sm:text-sm text-[#1E2922] dark:text-[#EAE8E3] leading-relaxed font-medium shadow-2xs">
                {renderRichText(answerPart)}
              </div>

              {/* Self-Rating for Spaced Repetition */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-stone-500 dark:text-stone-400 font-semibold">
                  How well did you recall this theorem/concept?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRate('knew')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      rated === 'knew'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800'
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
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
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

// Math Formula Block with Copy and Clean Typography
export const MathFormulaBlock: React.FC<{ formula: string }> = ({ formula }) => {
  const [copied, setCopied] = useState(false);
  const formatted = formatMathExpression(formula);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl border border-[#8C6D23]/30 dark:border-[#8C6D23]/50 bg-gradient-to-r from-[#FAF9F5] via-white to-[#FAF9F5] dark:from-[#18211C] dark:via-[#1B2520] dark:to-[#18211C] p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all text-left group">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#8C6D23]/15 dark:border-[#8C6D23]/30">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#8C6D23] dark:text-[#E6B34A] flex items-center gap-1.5">
          <Calculator className="w-3.5 h-3.5 text-[#B85C38] dark:text-[#E07048]" />
          <span>Curriculum Formula / Derivation</span>
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-stone-500 dark:text-stone-400 hover:text-[#284E38] dark:hover:text-emerald-400 bg-white dark:bg-[#141C17] border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
          title="Copy formatted mathematical formula"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div className="py-2 px-3 text-center sm:text-left overflow-x-auto">
        <span className="font-serif italic text-base sm:text-lg font-bold text-[#1E3B2A] dark:text-[#F3F2EE] tracking-wide select-all">
          {formatted}
        </span>
      </div>
    </div>
  );
};

// Inline tokenizer for Markdown formatting with inline math handling
function parseInlineFormatting(str: string): React.ReactNode[] {
  // Matches:
  // 1. **bold**
  // 2. `inline code`
  // 3. $inline math$ or \(inline math\)
  // 4. *italic*
  const tokenRegex = /(\*\*[\s\S]+?\*\*|`[^`]+`|\$[^$\n]+\$|\\\([^\\]+\\\)|\*[^*]+?\*)/g;
  const parts = str.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Bold text
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={idx} className="font-bold text-[#1E3B2A] dark:text-[#EAE8E3]">
          {inner}
        </strong>
      );
    }

    // Inline Code
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={idx}
          className="font-mono text-xs px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-[#8C6D23] dark:text-[#E6B34A] border border-stone-200/80 dark:border-stone-700 rounded font-semibold"
        >
          {inner}
        </code>
      );
    }

    // Inline Math: $formula$ or \(formula\)
    if ((part.startsWith('$') && part.endsWith('$') && part.length >= 2) ||
        (part.startsWith('\\(') && part.endsWith('\\)') && part.length >= 4)) {
      const raw = part.startsWith('\\(') ? part.slice(2, -2) : part.slice(1, -1);
      const mathFormatted = formatMathExpression(raw);
      return (
        <span
          key={idx}
          className="font-serif italic font-semibold text-[#1E3B2A] dark:text-[#F3F2EE] bg-amber-50/90 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200/70 dark:border-amber-700/60 mx-0.5"
        >
          {mathFormatted}
        </span>
      );
    }

    // Italic text: *italic*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={idx} className="italic text-stone-700 dark:text-stone-300">
          {inner}
        </em>
      );
    }

    // Check if part contains standalone exponents like c^2 or a^2
    if (/[a-zA-Z]\^[0-9]/.test(part) || /[a-zA-Z]\^\{[0-9]+\}/.test(part)) {
      return <React.Fragment key={idx}>{formatMathExpression(part)}</React.Fragment>;
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

// Complete structural Markdown renderer with multi-line display math, tables & clean typography
function renderRichText(text: string): React.ReactNode[] {
  // Preprocess multi-line display math blocks like:
  // \[
  // c^{2}=a^{2}+b^{2}
  // \]
  // and $$ ... $$ across line breaks!
  const blockMathRegex = /(?:\\\[\s*([\s\S]*?)\s*\\\]|\$\$\s*([\s\S]*?)\s*\$\$)/g;
  const sections: { type: 'math' | 'text'; content: string }[] = [];

  let lastIndex = 0;
  let blockMatch: RegExpExecArray | null;

  while ((blockMatch = blockMathRegex.exec(text)) !== null) {
    if (blockMatch.index > lastIndex) {
      sections.push({
        type: 'text',
        content: text.slice(lastIndex, blockMatch.index)
      });
    }
    const mathContent = blockMatch[1] || blockMatch[2] || '';
    sections.push({
      type: 'math',
      content: mathContent.trim()
    });
    lastIndex = blockMatch.index + blockMatch[0].length;
  }

  if (lastIndex < text.length) {
    sections.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  const elements: React.ReactNode[] = [];

  sections.forEach((sec, sIdx) => {
    if (sec.type === 'math') {
      elements.push(<MathFormulaBlock key={`mb-${sIdx}`} formula={sec.content} />);
      return;
    }

    const lines = sec.content.split('\n');
    let inCodeBlock = false;
    let codeBlockLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      // Stray \[ or \] on a single line that wasn't closed
      if (trimmed === '\\[' || trimmed === '\\]' || trimmed === '$$') {
        continue;
      }

      // Code blocks
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre
              key={`code-${sIdx}-${i}`}
              className="p-3.5 bg-[#1E2922] dark:bg-[#121815] text-emerald-300 font-mono text-xs rounded-2xl overflow-x-auto my-3 shadow-2xs border border-emerald-900/40"
            >
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          );
          codeBlockLines = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockLines.push(rawLine);
        continue;
      }

      // Single line display math (e.g. \[ c^2 = a^2 + b^2 \])
      if ((trimmed.startsWith('\\[') && trimmed.endsWith('\\]') && trimmed.length >= 4) ||
          (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length >= 4)) {
        const mathInner = (trimmed.startsWith('\\[') ? trimmed.slice(2, -2) : trimmed.slice(2, -2)).trim();
        elements.push(<MathFormulaBlock key={`single-math-${sIdx}-${i}`} formula={mathInner} />);
        continue;
      }

      // Table detection: starts and ends with |
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const tableLines: string[] = [trimmed];
        let j = i + 1;
        while (j < lines.length && lines[j].trim().startsWith('|') && lines[j].trim().endsWith('|')) {
          tableLines.push(lines[j].trim());
          j++;
        }

        if (tableLines.length >= 2) {
          const headerRow = tableLines[0].split('|').slice(1, -1).map(c => c.trim());
          const secondRow = tableLines[1];
          const isSeparator = /^\|(?:\s*:?-+:?\s*\|)+$/.test(secondRow);

          const bodyRows = (isSeparator ? tableLines.slice(2) : tableLines.slice(1)).map(rowStr =>
            rowStr.split('|').slice(1, -1).map(c => c.trim())
          );

          elements.push(
            <div key={`tbl-${sIdx}-${i}`} className="my-4 overflow-x-auto rounded-2xl border border-stone-200/90 dark:border-stone-700/80 shadow-2xs bg-white dark:bg-[#1A221D]">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead className="bg-[#FAF9F5] dark:bg-[#151D18] border-b border-stone-200 dark:border-stone-700 text-[#1E3B2A] dark:text-[#EAE8E3]">
                  <tr>
                    {headerRow.map((h, hi) => (
                      <th key={hi} className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[11px] text-[#284E38] dark:text-emerald-400">
                        {parseInlineFormatting(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {bodyRows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-amber-50/20 dark:hover:bg-stone-800/40 transition-colors">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3.5 py-2.5 text-stone-700 dark:text-stone-300 align-top">
                          {parseInlineFormatting(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );

          i = j - 1;
          continue;
        }
      }

      // Empty lines
      if (!trimmed) {
        elements.push(<div key={`sp-${sIdx}-${i}`} className="h-1.5" />);
        continue;
      }

      // Horizontal Rule
      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        elements.push(<hr key={`hr-${sIdx}-${i}`} className="my-3 border-stone-200/80 dark:border-stone-700/80" />);
        continue;
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote
            key={`quote-${sIdx}-${i}`}
            className="border-l-4 border-[#8C6D23] dark:border-[#D4A346] bg-amber-50/50 dark:bg-amber-950/20 pl-3.5 py-2 rounded-r-2xl my-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300 italic"
          >
            {parseInlineFormatting(trimmed.substring(2))}
          </blockquote>
        );
        continue;
      }

      // Markdown Headers
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h2 key={`h1-${sIdx}-${i}`} className="text-base sm:text-lg font-extrabold text-[#1E3B2A] dark:text-[#EAE8E3] mt-4 mb-2 pb-1.5 border-b border-stone-200/70 dark:border-stone-700/70">
            {parseInlineFormatting(trimmed.substring(2))}
          </h2>
        );
        continue;
      }
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h3 key={`h2-${sIdx}-${i}`} className="text-sm sm:text-base font-bold text-[#1E3B2A] dark:text-[#EAE8E3] mt-3.5 mb-1.5 pb-1 border-b border-stone-100 dark:border-stone-800">
            {parseInlineFormatting(trimmed.substring(3))}
          </h3>
        );
        continue;
      }
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={`h3-${sIdx}-${i}`} className="text-xs sm:text-sm font-bold text-[#284E38] dark:text-emerald-400 mt-3 mb-1">
            {parseInlineFormatting(trimmed.substring(4))}
          </h4>
        );
        continue;
      }
      if (trimmed.startsWith('#### ')) {
        elements.push(
          <h5 key={`h4-${sIdx}-${i}`} className="text-[11px] sm:text-xs font-bold text-[#8C6D23] dark:text-[#E6B34A] uppercase tracking-wider mt-2.5 mb-0.5">
            {parseInlineFormatting(trimmed.substring(5))}
          </h5>
        );
        continue;
      }

      // Unordered lists (- , * , • )
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        elements.push(
          <div key={`li-${sIdx}-${i}`} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-800 dark:text-stone-200 pl-2 my-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#284E38] dark:bg-emerald-400 mt-2 shrink-0" />
            <span className="leading-relaxed">{parseInlineFormatting(trimmed.substring(2))}</span>
          </div>
        );
        continue;
      }

      // Numbered lists (1. , 2. )
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        elements.push(
          <div key={`num-${sIdx}-${i}`} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-800 dark:text-stone-200 pl-2 my-1">
            <span className="text-xs font-bold text-[#8C6D23] dark:text-[#E6B34A] font-mono mt-0.5 tabular-nums min-w-[1.2rem] shrink-0">
              {numMatch[1]}.
            </span>
            <span className="leading-relaxed">{parseInlineFormatting(numMatch[2])}</span>
          </div>
        );
        continue;
      }

      // Regular paragraph
      elements.push(
        <p key={`p-${sIdx}-${i}`} className="text-xs sm:text-sm text-[#1E2922] dark:text-[#EAE8E3] leading-relaxed my-1">
          {parseInlineFormatting(rawLine)}
        </p>
      );
    }
  });

  return elements;
}
