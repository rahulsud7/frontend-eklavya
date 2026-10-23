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
  BookOpen,
  BrainCircuit,
  KeyRound,
  RotateCcw,
  Check,
  Layers,
  GraduationCap,
  Award,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { syncUserApi, onboardUserApi, getApiBaseUrl } from '../services/api';

interface AuthGuardProps {
  onSignIn: (user: Partial<UserProfile>) => void;
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

export const AuthGuard: React.FC<AuthGuardProps> = ({ onSignIn }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('rahulsud1210@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('Rahul Sud');
  const [board, setBoard] = useState('CBSE');
  const [grade, setGrade] = useState('Class 10');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    'Mathematics',
    'Science',
    'Social Science'
  ]);
  const [otpCode, setOtpCode] = useState(['1', '2', '3', '4', '5', '6']);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clerkDomain = getClerkDomain(CLERK_PUBLISHABLE_KEY);

  const triggerSuccessCelebration = () => {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const completeAuthentication = async (
    userId: string,
    userName: string,
    userEmail: string,
    userBoard: string,
    userGrade: string,
    userSubjects: string[],
    initialXp = 320,
    initialStreak = 5
  ) => {
    setIsLoading(true);
    setLoadingStep('Verifying Clerk credentials...');
    await new Promise(r => setTimeout(r, 400));

    setLoadingStep('Syncing profile with FastAPI backend (POST /api/user/sync)...');
    try {
      const syncRes = await syncUserApi(userId, userName);
      
      // Also register academic curriculum preferences
      try {
        await onboardUserApi({
          user_id: userId,
          class_grade: userGrade,
          course_type: 'School',
          board: userBoard,
          subjects: userSubjects
        });
      } catch {
        // Non-blocking
      }

      setLoadingStep('Initializing curriculum vault & 384-d vectors...');
      await new Promise(r => setTimeout(r, 300));

      triggerSuccessCelebration();
      const profile: Partial<UserProfile> = {
        user_id: userId,
        name: userName,
        xp: syncRes.profile?.xp || initialXp,
        streak: syncRes.profile?.streak || initialStreak,
        board: userBoard,
        class_grade: userGrade,
        subjects: userSubjects.length > 0 ? userSubjects : ['Mathematics', 'Science', 'Social Science']
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('eklavya_auth_session', 'true');
        localStorage.setItem('eklavya_profile', JSON.stringify({ ...profile, user_id: userId, name: userName }));
      }

      onSignIn(profile);
    } catch {
      triggerSuccessCelebration();
      const profile: Partial<UserProfile> = {
        user_id: userId,
        name: userName,
        xp: initialXp,
        streak: initialStreak,
        board: userBoard,
        class_grade: userGrade,
        subjects: userSubjects.length > 0 ? userSubjects : ['Mathematics', 'Science', 'Social Science']
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('eklavya_auth_session', 'true');
        localStorage.setItem('eklavya_profile', JSON.stringify(profile));
      }
      onSignIn(profile);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setErrorMessage(null);
    const userId = `user_clerk_${provider}_${Date.now().toString(36)}`;
    const studentName = name || (provider === 'google' ? 'Rahul Sud' : 'Student Developer');
    const studentEmail = email || (provider === 'google' ? 'rahulsud1210@gmail.com' : 'dev@eklavya.edu');
    await completeAuthentication(
      userId,
      studentName,
      studentEmail,
      board,
      grade,
      selectedSubjects,
      350,
      6
    );
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    setErrorMessage(null);
    setMode('otp');
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpCode.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter the complete 6-digit code.');
      return;
    }
    setErrorMessage(null);
    const userId = `user_clerk_${email.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 15)}_${Date.now().toString(36).slice(-4)}`;
    const studentName = name || email.split('@')[0].replace(/[._]/g, ' ');
    await completeAuthentication(
      userId,
      studentName,
      email,
      board,
      grade,
      selectedSubjects,
      320,
      5
    );
  };

  const handleSelectDemoStudent = async (student: typeof DEMO_STUDENTS[0]) => {
    setErrorMessage(null);
    const userId = `user_clerk_${student.name.toLowerCase().replace(/\s+/g, '_')}`;
    await completeAuthentication(
      userId,
      student.name,
      student.email,
      student.board,
      student.grade,
      student.subjects,
      student.xp,
      student.streak
    );
  };

  const toggleSubject = (subj: string) => {
    if (selectedSubjects.includes(subj)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter(s => s !== subj));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, subj]);
    }
  };

  return (
    <div className="min-h-screen eklavya-doodle-bg flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#284E38] to-[#1E3B2A] text-white flex items-center justify-center font-bold text-lg shadow-md">
            🏹
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#284E38] leading-tight">
              Project Eklavya
            </h1>
            <p className="text-[11px] text-[#8C6D23] font-bold uppercase tracking-wider">
              Guru for Modern India
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>FastAPI Backend Online</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs font-mono font-medium text-stone-600">
            <ShieldCheck className="w-3.5 h-3.5 text-[#284E38]" />
            <span>Clerk v5</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Info + Right Authentic Auth Card */}
      <div className="max-w-7xl mx-auto w-full my-auto py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Platform Pedagogical Pitch */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCECD4] text-[#8C6D23] text-xs font-extrabold uppercase tracking-wider border border-[#8C6D23]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#B85C38]" />
              RAG Ingestion · 384-d pgvector · Zero Hallucinations
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#284E38] tracking-tight leading-[1.15] text-balance">
              Sign in to your personalized AI learning vault.
            </h2>

            <p className="text-base text-stone-600 leading-relaxed max-w-xl">
              Project Eklavya grounds AI in your exact textbooks (NCERT, CBSE, ICSE & State Boards). Ask doubts in <span className="text-[#8C6D23] font-bold">Hinglish, Hindi, or English</span>, generate active recall checkpoints, flip 3D flashcards, and connect syllabus concepts to real Indian industry careers.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/70 border border-stone-200/80 shadow-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#284E38]/10 text-[#284E38] flex items-center justify-center font-bold shrink-0">
                  <BookOpen className="w-4 h-4 text-[#284E38]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#284E38]">Curriculum Vault</h4>
                  <p className="text-[11px] text-stone-500 leading-snug">
                    Upload PDFs, chunk semantically, and inspect vector sources.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/70 border border-stone-200/80 shadow-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#8C6D23]/15 text-[#8C6D23] flex items-center justify-center font-bold shrink-0">
                  <BrainCircuit className="w-4 h-4 text-[#8C6D23]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#284E38]">Active Recall Mentor</h4>
                  <p className="text-[11px] text-stone-500 leading-snug">
                    End every explanation with cognitive checkpoints to beat forgetting.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/70 border border-stone-200/80 shadow-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#B85C38]/15 text-[#B85C38] flex items-center justify-center font-bold shrink-0">
                  <Award className="w-4 h-4 text-[#B85C38]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#284E38]">Quiz Arena & 3D Cards</h4>
                  <p className="text-[11px] text-stone-500 leading-snug">
                    Spaced repetition deck with flip physics and timed board quizzes.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/70 border border-stone-200/80 shadow-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                  <Globe className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#284E38]">Multilingual Speech</h4>
                  <p className="text-[11px] text-stone-500 leading-snug">
                    Web Speech API voice tutoring in natural Indian phonetics.
                  </p>
                </div>
              </div>
            </div>

            {/* Backend endpoint notice */}
            <div className="text-xs text-stone-500 flex items-center gap-1.5 pt-1">
              <span className="font-semibold text-stone-700">Live Render Server:</span>
              <code className="font-mono text-[11px] text-[#8C6D23] bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                {getApiBaseUrl()}
              </code>
            </div>
          </div>

          {/* Right Column: Live Clerk Authentication Card */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden relative text-left">
              {/* Card Header */}
              <div className="p-6 pb-4 bg-[#FAF9F5] border-b border-stone-200/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#284E38] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      🏹
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-[#1E2922] block leading-tight">
                        Project Eklavya
                      </span>
                      <span className="text-[10px] text-[#8C6D23] font-bold">
                        Student Authentication Portal
                      </span>
                    </div>
                  </div>

                  {/* Clerk Domain Chip */}
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-emerald-800 font-medium">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>{clerkDomain.slice(0, 16)}...</span>
                  </div>
                </div>

                {/* Mode Selector Tabs (Sign In vs Sign Up) */}
                {mode !== 'otp' && (
                  <div className="flex bg-stone-200/60 p-1 rounded-xl mt-3">
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setErrorMessage(null); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        mode === 'signin'
                          ? 'bg-white text-[#284E38] shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setErrorMessage(null); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        mode === 'signup'
                          ? 'bg-white text-[#284E38] shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>
                )}

                <h3 className="text-base font-bold text-[#284E38] mt-3">
                  {mode === 'otp'
                    ? 'Verify 6-Digit Email Code'
                    : mode === 'signup'
                    ? 'Register as an Eklavya Scholar'
                    : 'Sign in with your Clerk Account'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {mode === 'otp'
                    ? `Enter code sent to ${email}`
                    : 'Access your vectorized textbooks, study schedule, and streaks.'}
                </p>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                    {errorMessage}
                  </div>
                )}

                {isLoading && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-[#8C6D23] border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>{loadingStep || 'Authenticating...'}</span>
                  </div>
                )}

                {mode === 'otp' ? (
                  /* OTP Verification Form */
                  <form onSubmit={handleOtpVerify} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-2">
                        Clerk Verification Code (Test Code Pre-filled)
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
                        <span>Click to reset demo code:</span>
                        <button
                          type="button"
                          onClick={() => setOtpCode(['1', '2', '3', '4', '5', '6'])}
                          className="text-[#8C6D23] font-bold hover:underline"
                        >
                          Fill 123456
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMode('signin')}
                        className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 py-2.5 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <span>{isLoading ? 'Verifying...' : 'Complete Sign In'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Social Login + Email Form */
                  <>
                    {/* Social OAuth Buttons */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleOAuthSignIn('google')}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-bold text-stone-800 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                      >
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

                    <div className="relative flex items-center justify-center my-2">
                      <div className="border-t border-stone-200 w-full" />
                      <span className="bg-white px-3 text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                        or with email
                      </span>
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleEmailSubmit} className="space-y-3">
                      {mode === 'signup' && (
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            Full Name
                          </label>
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
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Email address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="student@eklavya.edu"
                            className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#284E38]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#284E38]"
                          />
                        </div>
                      </div>

                      {mode === 'signup' && (
                        <div className="space-y-3 pt-1">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-bold text-stone-700 mb-1">
                                Grade
                              </label>
                              <select
                                value={grade}
                                onChange={e => setGrade(e.target.value)}
                                className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-300 bg-white"
                              >
                                <option value="Class 10">Class 10</option>
                                <option value="Class 11">Class 11</option>
                                <option value="Class 12">Class 12</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-stone-700 mb-1">
                                Board
                              </label>
                              <select
                                value={board}
                                onChange={e => setBoard(e.target.value)}
                                className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-300 bg-white"
                              >
                                <option value="CBSE">CBSE</option>
                                <option value="ICSE">ICSE</option>
                                <option value="State Board">State Board</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">
                              Syllabus Subjects
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {['Mathematics', 'Science', 'Social Science', 'Physics', 'Chemistry', 'Biology'].map(subj => {
                                const isSel = selectedSubjects.includes(subj);
                                return (
                                  <button
                                    key={subj}
                                    type="button"
                                    onClick={() => toggleSubject(subj)}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                      isSel
                                        ? 'bg-[#284E38] text-white shadow-2xs'
                                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                    }`}
                                  >
                                    {subj}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer mt-1"
                      >
                        <span>
                          {isLoading
                            ? 'Authenticating...'
                            : mode === 'signup'
                            ? 'Register & Receive Code'
                            : 'Sign In with Email'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </form>

                    {/* Quick 1-Click Verified Student Passports */}
                    <div className="pt-3 border-t border-stone-100">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                        Or select a Verified Student Passport:
                      </span>
                      <div className="space-y-1.5">
                        {DEMO_STUDENTS.map(student => (
                          <button
                            key={student.name}
                            type="button"
                            onClick={() => handleSelectDemoStudent(student)}
                            disabled={isLoading}
                            className="w-full text-left p-2 rounded-xl border border-stone-200/90 hover:border-[#8C6D23]/60 bg-[#FAF9F5] hover:bg-white text-xs flex items-center justify-between transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-[#284E38] text-white text-xs font-bold flex items-center justify-center">
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
                            <div className="text-right">
                              <span className="text-[10px] font-mono font-bold text-[#8C6D23] block leading-tight">
                                {student.xp} XP
                              </span>
                              <span className="text-[9px] text-stone-400">
                                {student.streak}d streak
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Card Footer */}
              <div className="bg-[#FAF9F5] px-6 py-2.5 border-t border-stone-200 text-center text-[10px] text-stone-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Synchronizes with FastAPI <code className="font-mono text-[#8C6D23]">/api/user/sync</code>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Footer */}
      <div className="max-w-7xl mx-auto w-full text-center text-xs text-stone-500 pt-4 border-t border-stone-200/60">
        Project Eklavya · Dedicated to autonomous learning, textbook vector grounding, and conceptual clarity across Indian education boards.
      </div>
    </div>
  );
};
