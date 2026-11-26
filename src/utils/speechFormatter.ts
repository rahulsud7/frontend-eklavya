import { LanguageMode } from '../types';

/**
 * Extract a balanced `{...}` group starting at `startIndex` (which must point to `{`).
 * Returns the inner content and the index immediately after the closing `}`.
 */
function readBraceGroup(str: string, startIndex: number): { content: string; nextIndex: number } | null {
  if (str[startIndex] !== '{') return null;
  let depth = 0;
  let i = startIndex;
  for (; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') {
      depth--;
      if (depth === 0) {
        return {
          content: str.slice(startIndex + 1, i),
          nextIndex: i + 1
        };
      }
    }
  }
  return null;
}

/**
 * Replace `\frac{num}{den}` (including nested fractions) with natural spoken words.
 */
function replaceFractions(expr: string): string {
  let result = expr;
  let safety = 0;
  while (result.includes('\\frac') || result.includes('\\dfrac') || result.includes('\\tfrac')) {
    if (++safety > 20) break;
    const match = /\\(?:d|t)?frac\s*/.exec(result);
    if (!match) break;
    const cmdStart = match.index;
    const afterCmd = cmdStart + match[0].length;
    const numGroup = readBraceGroup(result, afterCmd);
    if (!numGroup) {
      result = result.slice(0, cmdStart) + ' divided by ' + result.slice(afterCmd);
      continue;
    }
    let denStart = numGroup.nextIndex;
    while (denStart < result.length && /\s/.test(result[denStart])) denStart++;
    const denGroup = readBraceGroup(result, denStart);
    if (!denGroup) {
      result = result.slice(0, cmdStart) + numGroup.content + result.slice(numGroup.nextIndex);
      continue;
    }
    const spoken = ` ${numGroup.content} divided by ${denGroup.content} `;
    result = result.slice(0, cmdStart) + spoken + result.slice(denGroup.nextIndex);
  }
  return result;
}

/**
 * Replace `\sqrt{x}` and `\sqrt[n]{x}` with natural spoken words.
 */
function replaceSquareRoots(expr: string): string {
  let result = expr;
  let safety = 0;
  while (result.includes('\\sqrt')) {
    if (++safety > 20) break;
    const match = /\\sqrt\s*(?:\[([^\]]+)\])?\s*/.exec(result);
    if (!match) break;
    const cmdStart = match.index;
    const rootDegree = match[1]?.trim();
    const afterCmd = cmdStart + match[0].length;
    const argGroup = readBraceGroup(result, afterCmd);
    const prefix = rootDegree === '3'
      ? 'cube root of'
      : rootDegree
      ? `${rootDegree}th root of`
      : 'square root of';
    if (!argGroup) {
      result = result.slice(0, cmdStart) + ` ${prefix} ` + result.slice(afterCmd);
      continue;
    }
    const spoken = ` ${prefix} ${argGroup.content} `;
    result = result.slice(0, cmdStart) + spoken + result.slice(argGroup.nextIndex);
  }
  return result;
}

/**
 * Unwrap formatting commands like `\text{...}`, `\mathrm{...}`, `\mathbf{...}`, `\boxed{...}`, `\ce{...}`.
 */
function unwrapLatexWrappers(expr: string): string {
  let result = expr;
  const wrappers = /\\(?:text|mathrm|mathbf|mathit|mathsf|textbf|textit|operatorname|boxed|ce|underline|overline)\s*/;
  let safety = 0;
  while (wrappers.test(result)) {
    if (++safety > 40) break;
    const match = wrappers.exec(result);
    if (!match) break;
    const cmdStart = match.index;
    const afterCmd = cmdStart + match[0].length;
    const group = readBraceGroup(result, afterCmd);
    if (!group) {
      result = result.slice(0, cmdStart) + ' ' + result.slice(afterCmd);
      continue;
    }
    result = result.slice(0, cmdStart) + ` ${group.content} ` + result.slice(group.nextIndex);
  }
  return result;
}

/**
 * Convert a LaTeX or Unicode mathematical/chemical expression into natural spoken phrasing.
 */
export function mathToNaturalSpeech(rawExpr: string): string {
  let s = rawExpr.trim();

  // Strip environment wrappers like \begin{aligned} ... \end{aligned}
  s = s.replace(/\\begin\{[^}]+\}/g, ' ').replace(/\\end\{[^}]+\}/g, ' ');
  s = s.replace(/\\\\/g, ', ').replace(/&/g, ' ');

  // Unwrap text/math font/chemistry wrappers & recursive fractions/roots
  s = unwrapLatexWrappers(s);
  s = replaceFractions(s);
  s = replaceSquareRoots(s);

  // Chemical / reaction arrows with labels like \xrightarrow{\Delta}
  s = s.replace(/\\xrightarrow\s*\{[^}]*(?:\\Delta|Δ|heat)[^}]*\}/gi, ' on heating gives ');
  s = s.replace(/\\xrightarrow\s*\{([^}]+)\}/g, ' with $1 gives ');
  s = s.replace(/\\xleftarrow\s*\{([^}]+)\}/g, ' from $1 ');

  // Remove sizing/spacing LaTeX tokens
  s = s.replace(/\\(?:left|right|big|Big|bigg|Bigg|quad|qquad|displaystyle|limits)\b/g, ' ');
  s = s.replace(/\\[,;:! ]/g, ' ');

  // Powers & degrees before general symbol replacement
  s = s
    .replace(/\^\s*\{\s*\\circ\s*\}/g, ' degrees ')
    .replace(/\^\s*\\circ/g, ' degrees ')
    .replace(/\\degree\b/g, ' degrees ')
    .replace(/\^\s*\{\s*2\s*\}/g, ' squared ')
    .replace(/\^\s*2\b/g, ' squared ')
    .replace(/²/g, ' squared ')
    .replace(/\^\s*\{\s*3\s*\}/g, ' cubed ')
    .replace(/\^\s*3\b/g, ' cubed ')
    .replace(/³/g, ' cubed ')
    .replace(/\^\s*\{\s*-1\s*\}/g, ' inverse ')
    .replace(/\^\s*\{([^}]+)\}/g, ' to the power of $1 ')
    .replace(/\^\s*([a-zA-Z0-9])/g, ' to the power of $1 ');

  // Subscripts (chemical formulas & indexed variables)
  s = s
    .replace(/_\s*\{([^}]+)\}/g, ' $1 ')
    .replace(/_([a-zA-Z0-9])/g, ' $1 ');

  // Convert Unicode superscripts & subscripts
  const unicodeMap: Record<string, string> = {
    '⁰': ' to the power of 0 ', '¹': ' to the power of 1 ', '⁴': ' to the power of 4 ',
    '⁵': ' to the power of 5 ', '⁶': ' to the power of 6 ', '⁷': ' to the power of 7 ',
    '⁸': ' to the power of 8 ', '⁹': ' to the power of 9 ', 'ⁿ': ' to the power of n ',
    '₀': ' 0 ', '₁': ' 1 ', '₂': ' 2 ', '₃': ' 3 ', '₄': ' 4 ',
    '₅': ' 5 ', '₆': ' 6 ', '₇': ' 7 ', '₈': ' 8 ', '₉': ' 9 '
  };
  s = s.replace(/[⁰¹⁴⁵⁶⁷⁸⁹ⁿ₀₁₂₃₄₅₆₇₈₉]/g, ch => unicodeMap[ch] || ch);

  // Trig, log & calculus functions
  s = s
    .replace(/\\arcsin\b/g, ' arc sine ')
    .replace(/\\arccos\b/g, ' arc cosine ')
    .replace(/\\arctan\b/g, ' arc tangent ')
    .replace(/\\sin\b/g, ' sine ')
    .replace(/\\cos\b/g, ' cosine ')
    .replace(/\\tan\b/g, ' tangent ')
    .replace(/\\cot\b/g, ' cotangent ')
    .replace(/\\sec\b/g, ' secant ')
    .replace(/\\csc\b|\\cosec\b/g, ' cosecant ')
    .replace(/\\log\b/g, ' log ')
    .replace(/\\ln\b/g, ' natural log ')
    .replace(/\\lim\b/g, ' limit ')
    .replace(/\\sum\b/g, ' sum of ')
    .replace(/\\int\b/g, ' integral of ');

  // Greek letters & geometry/logic symbols
  s = s
    .replace(/\\theta\b|θ/g, ' theta ')
    .replace(/\\alpha\b|α/g, ' alpha ')
    .replace(/\\beta\b|β/g, ' beta ')
    .replace(/\\gamma\b|γ/g, ' gamma ')
    .replace(/\\Delta\b|Δ/g, ' delta ')
    .replace(/\\delta\b|δ/g, ' delta ')
    .replace(/\\pi\b|π/g, ' pi ')
    .replace(/\\lambda\b|λ/g, ' lambda ')
    .replace(/\\mu\b|μ/g, ' mu ')
    .replace(/\\sigma\b|σ/g, ' sigma ')
    .replace(/\\omega\b|ω/g, ' omega ')
    .replace(/\\Omega\b|Ω/g, ' ohm ')
    .replace(/\\phi\b|\\varphi\b|φ/g, ' phi ')
    .replace(/\\rho\b|ρ/g, ' rho ')
    .replace(/\\infty\b|∞/g, ' infinity ')
    .replace(/\\angle\b|∠/g, ' angle ')
    .replace(/\\triangle\b/g, ' triangle ')
    .replace(/\\perp\b|⊥/g, ' is perpendicular to ')
    .replace(/\\parallel\b|∥/g, ' is parallel to ')
    .replace(/\\cong\b|≅/g, ' is congruent to ')
    .replace(/\\sim\b/g, ' is similar to ')
    .replace(/\\therefore\b|∴/g, ' therefore ')
    .replace(/\\because\b|∵/g, ' because ');

  // Mathematical operators & arrows
  s = s
    .replace(/\\pm\b|±/g, ' plus or minus ')
    .replace(/\\mp\b|∓/g, ' minus or plus ')
    .replace(/\\times\b|×/g, ' times ')
    .replace(/\\cdot\b|·/g, ' times ')
    .replace(/\\div\b|÷/g, ' divided by ')
    .replace(/\\neq\b|≠/g, ' is not equal to ')
    .replace(/\\leq\b|\\le\b|≤/g, ' is less than or equal to ')
    .replace(/\\geq\b|\\ge\b|≥/g, ' is greater than or equal to ')
    .replace(/\\approx\b|≈/g, ' is approximately equal to ')
    .replace(/\\equiv\b|≡/g, ' is equivalent to ')
    .replace(/\\propto\b|∝/g, ' is proportional to ')
    .replace(/\\Rightarrow\b|\\implies\b|⇒|=>/g, ' implies ')
    .replace(/\\Leftrightarrow\b|\\iff\b|⇔/g, ' if and only if ')
    .replace(/\\rightleftharpoons\b|⇌/g, ' is in equilibrium with ')
    .replace(/\\rightarrow\b|\\to\b|→|->/g, ' gives ')
    .replace(/\\leftarrow\b|←/g, ' from ')
    .replace(/√\(([^)]+)\)/g, ' square root of $1 ')
    .replace(/√([a-zA-Z0-9]+)/g, ' square root of $1 ')
    .replace(/°/g, ' degrees ')
    .replace(/=/g, ' equals ')
    .replace(/\+/g, ' plus ')
    .replace(/</g, ' is less than ')
    .replace(/>/g, ' is greater than ');

  // Replace minus signs cleanly (both unary and binary)
  s = s.replace(/\s*-\s*/g, ' minus ');

  // Clean up any leftover LaTeX commands or braces
  s = s.replace(/\\[a-zA-Z]+/g, ' ');
  s = s.replace(/[{}()[\]\\]/g, ' ');

  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Convert a Markdown table block into natural spoken sentences without reading pipes or dashes.
 */
function convertMarkdownTablesToSpeech(text: string): string {
  const lines = text.split('\n');
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('|') && trimmed.includes('|')) {
      const tableRows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableRows.push(lines[i].trim());
        i++;
      }

      if (tableRows.length >= 2) {
        const parseRow = (row: string) =>
          row
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map(cell => cell.trim())
            .filter(Boolean);

        const headers = parseRow(tableRows[0]);
        const startIdx = /^\|?[\s:-]+(?:\|[\s:-]+)+\|?$/.test(tableRows[1]) ? 2 : 1;

        for (let r = startIdx; r < tableRows.length; r++) {
          const cells = parseRow(tableRows[r]);
          if (cells.length === 0) continue;
          const parts = cells.map((cell, idx) => {
            const colName = headers[idx];
            return colName && idx > 0 ? `${colName}: ${cell}` : cell;
          });
          output.push(parts.join(', ') + '.');
        }
        continue;
      }
    }
    output.push(lines[i]);
    i++;
  }

  return output.join('\n');
}

/**
 * Transform full Markdown + LaTeX + Science text into clean, natural spoken prose.
 * Zero raw asterisks, hashes, backticks, backslashes, pipes, or emojis.
 */
export function formatTextForSpeech(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Replace fenced code blocks with clean readable text
  text = text.replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, (_m, code) => {
    return `. ${String(code).replace(/\n+/g, ', ')}. `;
  });

  // 2. Convert Display Math blocks: \[ ... \] and $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, expr) => `. ${mathToNaturalSpeech(expr)}. `);
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_m, expr) => `. ${mathToNaturalSpeech(expr)}. `);

  // 3. Convert Inline Math: \( ... \) and $ ... $
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, expr) => ` ${mathToNaturalSpeech(expr)} `);
  text = text.replace(/\$([^$\n]+?)\$/g, (_m, expr) => ` ${mathToNaturalSpeech(expr)} `);

  // 4. Convert Markdown tables into spoken sentences
  text = convertMarkdownTablesToSpeech(text);

  // 5. Make Active-Recall Checkpoint header read smoothly
  text = text.replace(
    /(?:^|\n)(?:[-*_]{3,}\s*\n)?(?:#{1,6}\s*)?(?:🎯|\*|•)?\s*(?:\*\*)?Active[- ]Recall Checkpoint(?:\*\*)?[:\s]*/gi,
    '\nActive Recall Checkpoint. '
  );

  // 6. Strip Markdown images and unwrap links [label](url) -> label
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 7. Convert Markdown headings into natural spoken pauses
  text = text.replace(/^\s*#{1,6}\s+(.+)$/gm, (_m, heading) => `${heading.trim()}.`);

  // 8. Remove horizontal rules and blockquote markers
  text = text.replace(/^\s*[-*_]{3,}\s*$/gm, ' ');
  text = text.replace(/^\s*>\s?/gm, '');

  // 9. Clean unordered and ordered list markers into smooth spoken items
  text = text.replace(/^\s*[-*•+]\s+(.+)$/gm, (_m, item) => `${item.trim()}.`);
  text = text.replace(/^\s*(\d+)[.)]\s+(.+)$/gm, (_m, num, item) => `Point ${num}. ${item.trim()}.`);

  // 10. Strip inline Markdown formatting: bold, italic, strikethrough, inline code
  text = text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*\*([\s\S]+?)\*\*\*/g, '$1')
    .replace(/\*\*([\s\S]+?)\*\*/g, '$1')
    .replace(/__([\s\S]+?)__/g, '$1')
    .replace(/\*([^*\n]+?)\*/g, '$1')
    .replace(/(^|\s)_([^_\n]+?)_(\s|$|[.,!?;:])/g, '$1$2$3')
    .replace(/~~([\s\S]+?)~~/g, '$1');

  // 11. Convert any remaining bare math/science symbols outside delimiters
  text = text
    .replace(/\b([a-zA-Z0-9]+)\^\{?2\}?\b/g, '$1 squared')
    .replace(/\b([a-zA-Z0-9]+)\^\{?3\}?\b/g, '$1 cubed')
    .replace(/²/g, ' squared')
    .replace(/³/g, ' cubed')
    .replace(/√\(([^)]+)\)/g, 'square root of $1')
    .replace(/√([a-zA-Z0-9]+)/g, 'square root of $1')
    .replace(/→|->/g, ' gives ')
    .replace(/=>|⇒/g, ' implies ')
    .replace(/±/g, ' plus or minus ')
    .replace(/×/g, ' times ')
    .replace(/÷/g, ' divided by ')
    .replace(/≠/g, ' is not equal to ')
    .replace(/≤/g, ' is less than or equal to ')
    .replace(/≥/g, ' is greater than or equal to ')
    .replace(/≈/g, ' is approximately equal to ')
    .replace(/°/g, ' degrees ')
    .replace(/∠/g, ' angle ')
    .replace(/⊥/g, ' perpendicular to ')
    .replace(/Δ/g, ' triangle ')
    .replace(/θ/g, ' theta ')
    .replace(/π/g, ' pi ')
    .replace(/₀/g, ' 0 ')
    .replace(/₁/g, ' 1 ')
    .replace(/₂/g, ' 2 ')
    .replace(/₃/g, ' 3 ')
    .replace(/₄/g, ' 4 ')
    .replace(/₅/g, ' 5 ')
    .replace(/₆/g, ' 6 ')
    .replace(/₇/g, ' 7 ')
    .replace(/₈/g, ' 8 ')
    .replace(/₉/g, ' 9 ');

  // 12. Strip HTML tags and emojis/pictographs so TTS never reads "target emoji"
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, ' ');

  // 13. Remove any stray markdown punctuation characters (*, #, |, `, ~, \)
  text = text.replace(/[*#|`~\\]/g, ' ');

  // 14. Normalize punctuation and whitespace for crisp cadence
  text = text
    .replace(/\n+/g, '. ')
    .replace(/\s+([.,!?;:।])/g, '$1')
    .replace(/\.{2,}/g, '.')
    .replace(/,\s*\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

/**
 * Split cleaned speech text into browser-safe sentence chunks (avoids Chrome 15s cutoff).
 */
export function splitIntoSpeechChunks(cleanText: string, maxChunkLen = 220): string[] {
  if (!cleanText.trim()) return [];

  // Split on English/Hindi sentence terminators while keeping punctuation
  const rawSentences = cleanText.match(/[^.!?।]+[.!?।]*/g) || [cleanText];
  const chunks: string[] = [];

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxChunkLen) {
      chunks.push(trimmed);
      continue;
    }

    // Break overly long sentences cleanly on commas or word boundaries
    const words = trimmed.split(/\s+/);
    let current = '';
    for (const word of words) {
      if ((current + ' ' + word).trim().length > maxChunkLen && current) {
        chunks.push(current.trim());
        current = word;
      } else {
        current = current ? `${current} ${word}` : word;
      }
    }
    if (current.trim()) {
      chunks.push(current.trim());
    }
  }

  return chunks;
}

function selectPreferredVoice(targetLang: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const exact = voices.find(v => v.lang.toLowerCase() === targetLang.toLowerCase());
  if (exact) return exact;

  const prefix = targetLang.split('-')[0].toLowerCase();
  const byPrefix = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
  return byPrefix || null;
}

export interface SpeechPlaybackCallbacks {
  onChunkStart?: (chunk: string) => void;
  onEnd?: () => void;
  onError?: () => void;
}

/**
 * Speak the full cleaned text sequentially chunk-by-chunk with clean cancellation support.
 * Returns a `cancel` function that immediately stops playback and prevents subsequent chunks.
 */
export function speakTextChunked(
  rawText: string,
  language: LanguageMode,
  callbacks?: SpeechPlaybackCallbacks
): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    callbacks?.onEnd?.();
    return () => {};
  }

  window.speechSynthesis.cancel();

  const cleaned = formatTextForSpeech(rawText);
  const chunks = splitIntoSpeechChunks(cleaned);

  if (chunks.length === 0) {
    callbacks?.onEnd?.();
    return () => {};
  }

  // Detect whether text actually contains Devanagari (e.g., if user clicks Listen on an older Hindi message)
  const hasDevanagari = /[\u0900-\u097F]/.test(cleaned);
  const targetLang = hasDevanagari || language === 'Hindi' ? 'hi-IN' : 'en-IN';
  const preferredVoice = selectPreferredVoice(targetLang);

  let cancelled = false;
  let currentIndex = 0;

  const speakNext = () => {
    if (cancelled) return;
    if (currentIndex >= chunks.length) {
      callbacks?.onEnd?.();
      return;
    }

    const chunk = chunks[currentIndex];
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = targetLang;
    utterance.rate = 0.96;
    utterance.pitch = 1.0;
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      if (!cancelled) {
        callbacks?.onChunkStart?.(chunk);
      }
    };

    utterance.onend = () => {
      if (cancelled) return;
      currentIndex++;
      speakNext();
    };

    utterance.onerror = () => {
      if (cancelled) return;
      cancelled = true;
      callbacks?.onError?.();
    };

    window.speechSynthesis.speak(utterance);
  };

  speakNext();

  return () => {
    cancelled = true;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };
}
