import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isActive: boolean;
  color?: string;
  barCount?: number;
  height?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive,
  color = '#284E38',
  barCount = 18,
  height = 36
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const ch = canvas.height;
      const barWidth = width / (barCount * 1.6);
      const gap = (width - barWidth * barCount) / (barCount - 1);

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap);
        let barHeight = 4; // idle height

        if (isActive) {
          // Dynamic harmonic wave simulation
          const wave1 = Math.sin(phase + i * 0.45);
          const wave2 = Math.cos(phase * 1.2 + i * 0.2);
          const amp = (Math.abs(wave1 * 0.6 + wave2 * 0.4) + 0.15);
          barHeight = Math.max(5, amp * (ch * 0.88));
        }

        const y = (ch - barHeight) / 2;

        // Draw rounded bar with gradient
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, color);
        grad.addColorStop(1, '#8C6D23');

        ctx.fillStyle = grad;
        ctx.beginPath();
        const r = Math.min(barWidth / 2, 3);
        ctx.roundRect(x, y, barWidth, barHeight, r);
        ctx.fill();
      }

      phase += isActive ? 0.14 : 0.03;
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isActive, color, barCount, height]);

  return (
    <canvas
      ref={canvasRef}
      width={180}
      height={height}
      className="inline-block transition-opacity duration-300"
    />
  );
};
