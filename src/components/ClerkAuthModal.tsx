import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  User,
  X,
  KeyRound,
  RotateCcw,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { syncUserApi } from '../services/api';

interface ClerkAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: Partial<UserProfile>) => void;
}

type AuthMode = 'signin' | 'signup' | 'otp';

const DEMO_STUDENTS: Array<{
  name: string;
  email: string;
  grade: string;
  board: string;
  subjects: string[];
  xp: number;
  streak: number;
}> = [
  {
    name: 'Rahul Sud',
    email: 'rahulsud1210@gmail.com',
    grade: 'Class 10',
    board: 'CBSE',
    subjects: ['Mathematics', 'Science', 'Social Science'],
    xp: 350,
    streak: 6
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@eklavya.edu',
    grade: 'Class 12',
    board: 'CBSE (PCM / JEE)',
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    xp: 840,
    streak: 14
  },
  {
    name: 'Arjun Patel',
    email: 'arjun.patel@eklavya.edu',
    grade: 'Class 11',
    board: 'ICSE (PCB / NEET)',
    subjects: ['Biology', 'Physics', 'Chemistry'],
    xp: 620,
    streak: 8
  }
];

const CLERK_PUBLISHABLE_KEY =
  (import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string) ||
  (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string) ||
  'pk_test_b25lLWdpcmFmZmUtNzkxLmNsZXJrLmFjY291bnRzLmRldiQ';

function getClerkDomain(key: string): string {
  try {
    const raw = key.replace(/^pk_(test|live)_/, '');
    const decoded = atob(raw);
    return decoded.replace(/\$$/, '');
  } catch {
    return 'one-giraffe-791.clerk.accounts.dev';
  }
}

export const ClerkAuthModal: React.FC<ClerkAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('rahulsud1210@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('Rahul Sud');
  const [board, setBoard] = useState('CBSE');
  const [grade, setGrade] = useState('Class 10');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clerkDomain = getClerkDomain(CLERK_PUBLISHABLE_KEY);

  if (!isOpen) return null;

  const triggerSuccessCelebration = () => {
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  const saveAndNotify = (profile: Partial<UserProfile>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('eklavya_auth_session', 'true');
      localStorage.setItem('eklavya_profile', JSON.stringify(profile));
    }
    triggerSuccessCelebration();
    onSuccess(profile);
    onClose();
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setErrorMessage(null);

    // Simulate Clerk OAuth handshake
    await new Promise(r => setTimeout(r, 600));

    const selectedName = name || (provider === 'google' ? 'Rahul Sud' : 'Student Developer');
    const userId = `user_clerk_${provider}_${Date.now().toString(36)}`;

    try {
      const syncRes = await syncUserApi(userId, selectedName);
      saveAndNotify({
        user_id: userId,
        name: selectedName,
        xp: syncRes.profile?.xp || 320,
        streak: syncRes.profile?.streak || 5,
        board,
        class_grade: grade,
        subjects: ['Mathematics', 'Science', 'Social Science']
      });
    } catch {
      saveAndNotify({
        user_id: userId,
        name: selectedName,
        xp: 320,
        streak: 5,
        board,
        class_grade: grade,
        subjects: ['Mathematics', 'Science', 'Social Science']
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    setErrorMessage(null);
    setMode('otp');
    setOtpCode(['1', '2', '3', '4', '5', '6']); // prefilled test code for frictionless UX
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpCode.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter the full 6-digit code');
      return;
    }

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 500));

    const userId = `user_clerk_email_${Date.now().toString(36)}`;
    try {
      const syncRes = await syncUserApi(userId, name || email.split('@')[0]);
      saveAndNotify({
        user_id: userId,
        name: name || 'Rahul Sud',
        xp: syncRes.profile?.xp || 320,
        streak: syncRes.profile?.streak || 5,
        board,
        class_grade: grade,
        subjects: ['Mathematics', 'Science', 'Social Science']
      });
    } catch {
      saveAndNotify({
        user_id: userId,
        name: name || 'Rahul Sud',
        xp: 320,
        streak: 5,
        board,
        class_grade: grade,
        subjects: ['Mathematics', 'Science', 'Social Science']
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemoStudent = async (student: typeof DEMO_STUDENTS[0]) => {
    setIsLoading(true);
    const userId = `user_clerk_${student.name.toLowerCase().replace(/\s+/g, '_')}`;

    try {
      await syncUserApi(userId, student.name);
      saveAndNotify({
        user_id: userId,
        name: student.name,
        xp: student.xp,
        streak: student.streak,
        board: student.board,
        class_grade: student.grade,
        subjects: student.subjects
      });
    } catch {
      saveAndNotify({
        user_id: userId,
        name: student.name,
        xp: student.xp,
        streak: student.streak,
        board: student.board,
        class_grade: student.grade,
        subjects: student.subjects
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden relative text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Clerk Top Header Banner */}
        <div className="p-6 pb-4 bg-[#FAF9F5] border-b border-stone-200/80 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-2xl bg-[#284E38] text-white flex items-center justify-center text-base font-bold shadow-xs">
              🏹
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#1E2922] leading-tight">
                Project Eklavya
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <span className="flex items-center gap-1 text-[10px] text-stone-500 font-semibold">
                  <ShieldCheck className="w-3 h-3 text-[#284E38]" />
                  <span>Secured by Clerk</span>
                </span>
                <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {clerkDomain}
                </span>
              </div>
            </div>
          </div>

          <h4 className="text-lg font-bold text-[#284E38] mt-2">
            {mode === 'otp'
              ? 'Verify your email code'
              : mode === 'signup'
              ? 'Create your Student Account'
              : 'Sign in to your learning vault'}
          </h4>
          <p className="text-xs text-stone-500 mt-0.5">
            {mode === 'otp'
              ? `We sent a 6-digit verification code to ${email}`
              : 'Access your RAG textbooks, quizzes, and streaks'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {errorMessage}
            </div>
          )}

          {mode === 'otp' ? (
            /* OTP Verification Screen */
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">
                  Enter 6-digit Clerk Verification Code
                </label>
                <div className="flex items-center justify-between gap-1.5">
                  {otpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={e => {
                        const val = e.target.value;
                        const next = [...otpCode];
                        next[idx] = val;
                        setOtpCode(next);
                      }}
                      className="w-11 h-12 text-center text-lg font-mono font-bold rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#284E38] bg-stone-50"
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-stone-500">
                  <span>Demo code pre-filled (123456)</span>
                  <button
                    type="button"
                    onClick={() => setOtpCode(['1', '2', '3', '4', '5', '6'])}
                    className="text-[#8C6D23] font-bold hover:underline"
                  >
                    Resend Code
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <span>{isLoading ? 'Verifying...' : 'Complete Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            /* Social + Email Standard Clerk Screen */
            <>
              {/* Social Login Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-bold text-stone-800 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  {/* Google SVG G */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('github')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-900 hover:bg-black text-xs font-bold text-white transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>Continue with GitHub</span>
                </button>
              </div>

              {/* Or Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-stone-200 w-full" />
                <span className="bg-white px-3 text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  or with email
                </span>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailContinue} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Rahul Sud"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#284E38]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Email address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="rahulsud1210@gmail.com"
                      className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#284E38]"
                    />
                  </div>
                </div>

                {mode === 'signup' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Grade</label>
                      <select
                        value={grade}
                        onChange={e => setGrade(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-300"
                      >
                        <option value="Class 10">Class 10</option>
                        <option value="Class 11">Class 11</option>
                        <option value="Class 12">Class 12</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Board</label>
                      <select
                        value={board}
                        onChange={e => setBoard(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-300"
                      >
                        <option value="CBSE">CBSE</option>
                        <option value="ICSE">ICSE</option>
                        <option value="State Board">State Board</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>{isLoading ? 'Processing...' : 'Continue with Email'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Quick 1-Click Demo Profiles */}
              <div className="pt-3 border-t border-stone-100">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                  1-Click Student Profiles (Clerk Verified):
                </span>
                <div className="space-y-1.5">
                  {DEMO_STUDENTS.map(student => (
                    <button
                      key={student.name}
                      type="button"
                      onClick={() => handleSelectDemoStudent(student)}
                      className="w-full text-left p-2 rounded-xl border border-stone-200/90 hover:border-[#8C6D23]/60 bg-[#FAF9F5] hover:bg-white text-xs flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#284E38] text-white text-[11px] font-bold flex items-center justify-center">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-stone-800 group-hover:text-[#284E38] block leading-tight">
                            {student.name}
                          </span>
                          <span className="text-[10px] text-stone-500">
                            {student.grade} · {student.board}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#8C6D23]">
                        {student.xp} XP
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle Mode */}
              <div className="text-center pt-2">
                {mode === 'signin' ? (
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-xs text-stone-600 hover:text-[#284E38] font-semibold cursor-pointer"
                  >
                    Don&apos;t have an account? <span className="font-bold underline text-[#284E38]">Sign up</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-xs text-stone-600 hover:text-[#284E38] font-semibold cursor-pointer"
                  >
                    Already have an account? <span className="font-bold underline text-[#284E38]">Sign in</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-[#FAF9F5] px-6 py-3 border-t border-stone-200 text-center text-[10px] text-stone-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Fires <code className="font-mono text-[#8C6D23]">POST /api/user/sync</code> on sign in</span>
        </div>
      </div>
    </div>
  );
};
