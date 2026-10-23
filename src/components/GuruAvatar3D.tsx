import React, { useState } from 'react';
import { Sparkles, Brain, Cpu, CheckCircle2 } from 'lucide-react';

interface GuruAvatar3DProps {
  status: 'idle' | 'searching' | 'thinking' | 'speaking';
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

export const GuruAvatar3D: React.FC<GuruAvatar3DProps> = ({
  status,
  size = 'md',
  showBadge = true
}) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20; // -10 to +10 deg
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -20;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const sizeClasses = {
    sm: 'w-10 h-10 text-base',
    md: 'w-14 h-14 text-xl',
    lg: 'w-20 h-20 text-3xl'
  };

  const ringPulseClasses = {
    idle: 'ring-2 ring-[#284E38]/20',
    searching: 'ring-4 ring-amber-400/60 animate-pulse',
    thinking: 'ring-4 ring-[#8C6D23]/60 animate-ping duration-1000',
    speaking: 'ring-4 ring-emerald-500/80 animate-pulse'
  };

  const statusLabel = {
    idle: 'Grounded in NCERT Vectors',
    searching: 'Scanning 384-d pgvector...',
    thinking: 'Synthesizing Llama-3...',
    speaking: 'Voicing explanation...'
  };

  return (
    <div className="flex items-center gap-3">
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative perspective-1000 cursor-pointer group shrink-0"
        style={{ perspective: '800px' }}
      >
        {/* Glow halo behind avatar */}
        <div
          className={`absolute -inset-2 rounded-full blur-md opacity-40 transition-all duration-500 ${
            status === 'speaking'
              ? 'bg-emerald-400'
              : status === 'searching'
              ? 'bg-amber-400'
              : status === 'thinking'
              ? 'bg-[#8C6D23]'
              : 'bg-[#284E38]'
          }`}
        />

        {/* 3D Tilting Disc */}
        <div
          className={`relative ${sizeClasses[size]} rounded-2xl bg-gradient-to-br from-[#284E38] via-[#1E3B2A] to-[#122419] text-white flex items-center justify-center font-bold shadow-xl transition-transform duration-200 ease-out border border-[#8C6D23]/40 ${ringPulseClasses[status]}`}
          style={{
            transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Subtle Inner Mandala Ring */}
          <div className="absolute inset-1 rounded-xl border border-amber-300/20 pointer-events-none" />

          {/* Central Emblem: Bow & Arrow with Wisdom Sparkle */}
          <span className="relative z-10 select-none drop-shadow-md">
            🏹
          </span>

          {/* Mini active status dot */}
          <span
            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
              status === 'speaking'
                ? 'bg-emerald-500 animate-ping'
                : status === 'searching' || status === 'thinking'
                ? 'bg-amber-400 animate-bounce'
                : 'bg-emerald-500'
            }`}
          />
        </div>
      </div>

      {showBadge && (
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-extrabold text-[#284E38] tracking-tight">
              Eklavya AI Mentor
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FCECD4] text-[#8C6D23] border border-[#8C6D23]/20">
              <Sparkles className="w-2.5 h-2.5 text-[#B85C38]" />
              Groq Llama-3
            </span>
          </div>
          <p className="text-[11px] font-semibold text-stone-500 flex items-center gap-1 mt-0.5">
            {status === 'searching' ? (
              <Cpu className="w-3 h-3 text-amber-600 animate-spin" />
            ) : status === 'thinking' ? (
              <Brain className="w-3 h-3 text-[#8C6D23] animate-pulse" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            )}
            <span className={status !== 'idle' ? 'text-[#8C6D23] font-bold' : ''}>
              {statusLabel[status]}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};
