import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, Bell } from 'lucide-react';

interface PomodoroTimerProps {
  onSessionComplete?: (minutes: number) => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onSessionComplete }) => {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [duration, setDuration] = useState<number>(25 * 60); // 25 mins
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Play gentle sound using Web Audio API
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // AudioContext may be restricted before interaction
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            playChime();
            setIsRunning(false);
            if (mode === 'focus') {
              if (onSessionComplete) onSessionComplete(Math.round(duration / 60));
              setMode('break');
              setDuration(5 * 60);
              return 5 * 60;
            } else {
              setMode('focus');
              setDuration(25 * 60);
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, duration, onSessionComplete]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const selectMode = (newMode: 'focus' | 'break', minutes: number) => {
    setIsRunning(false);
    setMode(newMode);
    setDuration(minutes * 60);
    setTimeLeft(minutes * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const progressPercent = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="relative z-[160]">
      {/* Pill Trigger on Top Bar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/80 border border-[#8C6D23]/25 shadow-sm hover:border-[#8C6D23] transition-colors">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 cursor-pointer text-left"
          title="Pomodoro Study Timer"
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            <svg className="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-stone-200 stroke-current"
                strokeWidth="4"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${mode === 'focus' ? 'text-[#B85C38]' : 'text-[#284E38]'} stroke-current transition-all duration-300`}
                strokeDasharray={`${progressPercent}, 100`}
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <Timer className="w-2.5 h-2.5 text-[#284E38] absolute" />
          </div>
          <span className="font-mono text-xs sm:text-sm font-bold tabular-nums text-[#284E38]">
            {formattedTime}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 hidden sm:inline">
            {mode === 'focus' ? 'Study' : 'Break'}
          </span>
        </button>

        {/* Action button: Start/Pause */}
        <button
          type="button"
          onClick={toggleTimer}
          className={`p-1 rounded-lg text-white transition-colors cursor-pointer ${
            isRunning
              ? 'bg-[#8C6D23] hover:bg-[#725719]'
              : 'bg-[#284E38] hover:bg-[#1E3B2A]'
          }`}
          title={isRunning ? 'Pause' : 'Start'}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={resetTimer}
          className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          title="Reset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Popover Settings */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[165] bg-black/5 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={popoverRef}
            className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-md border border-stone-200 rounded-2xl p-4 shadow-2xl z-[170] ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150 text-left"
          >
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-100">
            <span className="text-xs font-bold text-[#284E38] flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[#8C6D23]" />
              Pomodoro Intervals
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-stone-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => { selectMode('focus', 25); setIsOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'focus' && duration === 25 * 60
                  ? 'bg-[#284E38] text-white shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-100 text-[#1E2922]'
              }`}
            >
              <span>Focus Deep Work</span>
              <span className="font-mono">25 min</span>
            </button>

            <button
              type="button"
              onClick={() => { selectMode('focus', 50); setIsOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'focus' && duration === 50 * 60
                  ? 'bg-[#284E38] text-white shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-100 text-[#1E2922]'
              }`}
            >
              <span>Sprint Focus</span>
              <span className="font-mono">50 min</span>
            </button>

            <button
              type="button"
              onClick={() => { selectMode('break', 5); setIsOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'break' && duration === 5 * 60
                  ? 'bg-[#B85C38] text-white shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-100 text-[#1E2922]'
              }`}
            >
              <span>Short Recharge</span>
              <span className="font-mono">5 min</span>
            </button>
          </div>

          <p className="mt-3 text-[11px] text-stone-500 leading-normal border-t border-stone-100 pt-2">
            Tip: 25-minute study sprints maximize cognitive absorption without mental fatigue.
          </p>
        </div>
        </>
      )}
    </div>
  );
};
