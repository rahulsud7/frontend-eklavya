import React, { useState } from 'react';
import { Target, CheckCircle2, Eye, EyeOff, ThumbsUp, RotateCcw, Sparkles } from 'lucide-react';

interface FormattedMessageProps {
  content: string;
  onSelfTestSuccess?: () => void;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, onSelfTestSuccess }) => {
  const checkpointMarker = '🎯 Active-Recall Checkpoint';
  const hasCheckpoint = content.includes(checkpointMarker);

  if (!hasCheckpoint) {
    return <div className="space-y-3 leading-relaxed">{renderRichText(content)}</div>;
  }

  const parts = content.split(checkpointMarker);
  const mainText = parts[0];
  const checkpointContent = parts.slice(1).join(checkpointMarker);

  return (
    <div className="space-y-4">
      {/* Main explanation content */}
      {mainText.trim() && (
        <div className="space-y-3 leading-relaxed text-[#2C3E35]">
          {renderRichText(mainText)}
        </div>
      )}

      {/* Distinct 3D-Elevated Active-Recall Checkpoint Callout Card */}
      <ActiveRecallCard
        rawContent={checkpointContent}
        onSelfTestSuccess={onSelfTestSuccess}
      />
    </div>
  );
};

const ActiveRecallCard: React.FC<{ rawContent: string; onSelfTestSuccess?: () => void }> = ({
  rawContent,
  onSelfTestSuccess
}) => {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [rated, setRated] = useState<'knew' | 'relearn' | null>(null);

  // Split question vs answer if marked with *Answer: or *उत्तर:
  let questionPart = rawContent.trim();
  let answerPart = '';

  const answerMatch = rawContent.match(/(\*(?:Answer|उत्तर):[\s\S]*)/i);
  if (answerMatch && answerMatch.index !== undefined) {
    questionPart = rawContent.slice(0, answerMatch.index).trim();
    answerPart = answerMatch[1].replace(/^\*(?:Answer|उत्तर):\s*/i, '').replace(/\*$/, '').trim();
  }

  const handleRate = (choice: 'knew' | 'relearn') => {
    setRated(choice);
    if (choice === 'knew' && onSelfTestSuccess) {
      onSelfTestSuccess();
    }
  };

  return (
    <div className="mt-4 rounded-3xl border-2 border-[#B85C38]/30 bg-gradient-to-br from-[#FFF9F5] via-[#FFFDFB] to-[#FDF4EE] p-5 sm:p-6 shadow-md hover:shadow-lg transition-all text-left relative overflow-hidden group">
      {/* Subtle 3D gradient highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#B85C38]/5 rounded-bl-full pointer-events-none" />

      <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-[#B85C38]/15">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#B85C38] to-[#9E4624] text-white flex items-center justify-center font-bold shadow-xs">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-[#B85C38] tracking-tight uppercase flex items-center gap-1.5">
              Active-Recall Checkpoint
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#FCECD4] text-[#8C6D23] lowercase">
                memory test
              </span>
            </h4>
            <p className="text-[11px] text-[#8C6D23] font-medium">
              Formulate your response mentally before revealing
            </p>
          </div>
        </div>

        {answerPart && (
          <button
            type="button"
            onClick={() => setIsAnswerRevealed(!isAnswerRevealed)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-[#B85C38] hover:bg-[#A04E2E] active:scale-95 text-white transition-all shadow-xs cursor-pointer whitespace-nowrap"
          >
            {isAnswerRevealed ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                Hide
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                Reveal Answer
              </>
            )}
          </button>
        )}
      </div>

      {/* Question / Prompt */}
      <div className="text-xs sm:text-sm text-[#284E38] font-bold leading-relaxed mb-3">
        {renderRichText(questionPart)}
      </div>

      {/* Revealed Solution / Answer */}
      {answerPart && (
        <div
          className={`transition-all duration-300 overflow-hidden ${
            isAnswerRevealed ? 'max-h-96 opacity-100 mt-3 pt-3 border-t border-[#B85C38]/15' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-[#8C6D23]/25 shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C6D23] uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Curriculum Solution & Verification:</span>
            </div>

            <div className="text-xs sm:text-sm text-[#1E2922] font-semibold leading-relaxed pl-1">
              {renderRichText(answerPart)}
            </div>

            {/* Self-Rating micro buttons */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-500 font-medium">How did you do?</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRate('knew')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    rated === 'knew'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>Nailed It (+10 XP)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRate('relearn')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    rated === 'relearn'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Review Later</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper: parse **bold text** into custom highlighted spans and format markdown elements
function renderRichText(text: string): React.ReactNode[] {
  const lines = text.split('\n');

  return lines.map((line, lineIndex) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={lineIndex} className="h-2" />;
    }

    // Markdown Headers
    if (trimmed.startsWith('### ')) {
      return (
        <h4 key={lineIndex} className="text-sm sm:text-base font-bold text-[#284E38] mt-3 mb-1">
          {parseInlineFormatting(trimmed.substring(4))}
        </h4>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h3 key={lineIndex} className="text-base sm:text-lg font-bold text-[#284E38] mt-4 mb-2">
          {parseInlineFormatting(trimmed.substring(3))}
        </h3>
      );
    }

    // Unordered lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <div key={lineIndex} className="flex items-start gap-2 text-xs sm:text-sm text-[#2C3E35] pl-2 my-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8C6D23] mt-2 shrink-0" />
          <span>{parseInlineFormatting(trimmed.substring(2))}</span>
        </div>
      );
    }

    // Numbered lists
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      return (
        <div key={lineIndex} className="flex items-start gap-2 text-xs sm:text-sm text-[#2C3E35] pl-2 my-0.5">
          <span className="text-xs font-bold text-[#8C6D23] mt-0.5 tabular-nums min-w-[1.2rem]">
            {numMatch[1]}.
          </span>
          <span>{parseInlineFormatting(numMatch[2])}</span>
        </div>
      );
    }

    // Math block or regular paragraph
    return (
      <p key={lineIndex} className="text-xs sm:text-sm text-[#2C3E35] leading-relaxed">
        {parseInlineFormatting(line)}
      </p>
    );
  });
}

// Convert **bold** into bg-[#FCECD4] text-[#8C6D23] highlighted span
function parseInlineFormatting(str: string): React.ReactNode[] {
  const tokens = str.split(/(\*\*.*?\*\*)/g);

  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      const boldText = token.slice(2, -2);
      return (
        <span
          key={idx}
          className="bg-[#FCECD4] text-[#8C6D23] font-bold px-1.5 py-0.5 rounded-md inline-block my-0.5 border border-[#8C6D23]/15 shadow-2xs"
        >
          {boldText}
        </span>
      );
    }
    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
}
