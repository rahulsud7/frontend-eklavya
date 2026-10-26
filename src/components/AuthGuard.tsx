import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BookOpen,
  GraduationCap,
  Award,
  Layers,
  UserPlus,
  LogIn,
  RotateCcw,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { syncUserApi, onboardUserApi, saveLocalDocuments } from '../services/api';

interface AuthGuardProps {
  onSignIn: (user: Partial<UserProfile>) => void;
}

type AuthMode = 'demo' | 'new_fresh' | 'existing';

const DEMO_PERSONAS = [
  {
    id: 'user_rahul_sud',
    name: 'Rahul Sud',
    email: 'rahulsud1210@gmail.com',
    grade: 'Class 10',
    board: 'CBSE',
    subjects: ['Mathematics', 'Science', 'Social Science'],
    xp: 350,
    streak: 6,
    badge: 'Pre-loaded NCERT Vault'
  },
  {
    id: 'user_priya_sharma',
    name: 'Priya Sharma',
    email: 'priya.sharma@eklavya.edu',
    grade: 'Class 12',
    board: 'CBSE (PCM / JEE)',
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    xp: 840,
    streak: 14,
    badge: 'Senior Secondary STEM'
  },
  {
    id: 'user_arjun_patel',
    name: 'Arjun Patel',
    email: 'arjun.patel@eklavya.edu',
    grade: 'Class 11',
    board: 'ICSE (PCB / NEET)',
    subjects: ['Biology', 'Physics', 'Chemistry'],
    xp: 620,
    streak: 8,
    badge: 'Medical Foundation'
  }
];

export const AuthGuard: React.FC<AuthGuardProps> = ({ onSignIn }) => {
  const [mode, setMode] = useState<AuthMode>('demo');
  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number>(0);

  // New fresh user form fields
  const [freshName, setFreshName] = useState('');
  const [freshEmail, setFreshEmail] = useState('');
  const [freshGrade, setFreshGrade] = useState('Class 10');
  const [freshBoard, setFreshBoard] = useState('CBSE');
  const [freshSubjects, setFreshSubjects] = useState<string[]>([
    'Mathematics',
    'Science',
    'Social Science'
  ]);

  // Existing user resume
  const [existingIdentifier, setExistingIdentifier] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleSubject = (sub: string) => {
    setFreshSubjects(prev =>
      prev.includes(sub) ? (prev.length > 1 ? prev.filter(s => s !== sub) : prev) : [...prev, sub]
    );
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // 1. Login with Pre-seeded Demo Persona
  const handleDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    const persona = DEMO_PERSONAS[selectedDemoIndex];

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('eklavya_is_fresh', 'false');
        localStorage.setItem('eklavya_auth_session', 'true');
      }

      await syncUserApi(persona.id, persona.name);
      await onboardUserApi({
        user_id: persona.id,
        class_grade: persona.grade,
        course_type: 'School',
        board: persona.board,
        subjects: persona.subjects
      });

      triggerCelebration();

      const profile: Partial<UserProfile> = {
        user_id: persona.id,
        name: persona.name,
        xp: persona.xp,
        streak: persona.streak,
        board: persona.board,
        class_grade: persona.grade,
        subjects: persona.subjects
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('eklavya_profile', JSON.stringify(profile));
      }

      onSignIn(profile);
    } catch {
      // Offline fallback
      triggerCelebration();
      const profile: Partial<UserProfile> = {
        user_id: persona.id,
        name: persona.name,
        xp: persona.xp,
        streak: persona.streak,
        board: persona.board,
        class_grade: persona.grade,
        subjects: persona.subjects
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('eklavya_profile', JSON.stringify(profile));
      }
      onSignIn(profile);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Create Brand-New Fresh Account (0 Documents, 0 XP)
  const handleFreshCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freshName.trim()) {
      setErrorMessage('Please enter your full student name.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    const freshUserId = `student_fresh_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const cleanName = freshName.trim();

    try {
      if (typeof window !== 'undefined') {
        // Mark as fresh user so document vault starts completely empty
        localStorage.setItem('eklavya_is_fresh', 'true');
        localStorage.setItem('eklavya_documents', JSON.stringify([]));
        localStorage.setItem('eklavya_auth_session', 'true');
      }

      // Sync with Supabase (fresh users start with 0 XP)
      await syncUserApi(freshUserId, cleanName);
      await onboardUserApi({
        user_id: freshUserId,
        class_grade: freshGrade,
        course_type: 'School',
        board: freshBoard,
        subjects: freshSubjects
      });

      // Clear local documents array so user has 0 data and adds data themselves
      saveLocalDocuments([]);

      triggerCelebration();

      const profile: Partial<UserProfile> = {
        user_id: freshUserId,
        name: cleanName,
        xp: 0,
        streak: 1,
        board: freshBoard,
        class_grade: freshGrade,
        subjects: freshSubjects
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('eklavya_profile', JSON.stringify(profile));
      }

      onSignIn(profile);
    } catch {
      triggerCelebration();
      saveLocalDocuments([]);
      const profile: Partial<UserProfile> = {
        user_id: freshUserId,
        name: cleanName,
        xp: 0,
        streak: 1,
        board: freshBoard,
        class_grade: freshGrade,
        subjects: freshSubjects
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('eklavya_profile', JSON.stringify(profile));
      }
      onSignIn(profile);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Resume Existing Account
  const handleExistingLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingIdentifier.trim()) {
      setErrorMessage('Please enter your student name or user ID.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    const cleanId = existingIdentifier.trim();
    const userId = cleanId.startsWith('student_') || cleanId.startsWith('user_')
      ? cleanId
      : `user_${cleanId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    try {
      const syncRes = await syncUserApi(userId, cleanId);
      triggerCelebration();

      const profile: Partial<UserProfile> = {
        user_id: userId,
        name: syncRes.profile?.name || cleanId,
        xp: syncRes.profile?.xp || 150,
        streak: syncRes.profile?.streak || 1,
        board: syncRes.profile?.board || 'CBSE',
        class_grade: syncRes.profile?.class_grade || 'Class 10',
        subjects: syncRes.profile?.subjects?.length ? syncRes.profile.subjects : ['Mathematics', 'Science', 'Social Science']
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('eklavya_auth_session', 'true');
        localStorage.setItem('eklavya_profile', JSON.stringify(profile));
      }

      onSignIn(profile);
    } catch {
      triggerCelebration();
      const profile: Partial<UserProfile> = {
        user_id: userId,
        name: cleanId,
        xp: 150,
        streak: 1,
        board: 'CBSE',
        class_grade: 'Class 10',
        subjects: ['Mathematics', 'Science', 'Social Science']
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('eklavya_auth_session', 'true');
        localStorage.setItem('eklavya_profile', JSON.stringify(profile));
      }
      onSignIn(profile);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF9F5] via-[#FFFDF9] to-[#F5EFE6] flex items-center justify-center p-4 sm:p-6 text-left">
      <div className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-3xl border border-[#8C6D23]/25 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#8C6D23]/5 rounded-bl-full pointer-events-none" />

        {/* Brand Banner */}
        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-stone-100">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#284E38] to-[#1E3B2A] text-white flex items-center justify-center text-2xl font-bold shadow-md shrink-0">
            🏹
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#284E38] tracking-tight">
                Project Eklavya
              </h1>
              <span className="text-[10px] font-bold text-[#8C6D23] bg-[#FCECD4] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Student Portal
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              1-on-1 AI Academic Mentor grounded in Indian Curricula (CBSE / ICSE)
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-stone-100/90 rounded-2xl border border-stone-200/80 mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setMode('demo'); setErrorMessage(null); }}
            className={`py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'demo'
                ? 'bg-white text-[#284E38] shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8C6D23]" />
            <span>Demo Student</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('new_fresh'); setErrorMessage(null); }}
            className={`py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'new_fresh'
                ? 'bg-white text-[#284E38] shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-[#B85C38]" />
            <span>New (Fresh Slate)</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('existing'); setErrorMessage(null); }}
            className={`py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'existing'
                ? 'bg-white text-[#284E38] shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-stone-700" />
            <span>Resume ID</span>
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* ---------------- MODE 1: DEMO PERSONAS ---------------- */}
        {mode === 'demo' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Select Pre-Seeded Student Persona:
              </span>
              <span className="text-[11px] text-stone-400 font-medium">
                Has pre-loaded textbooks &amp; XP
              </span>
            </div>

            <div className="space-y-2.5">
              {DEMO_PERSONAS.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedDemoIndex(idx)}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedDemoIndex === idx
                      ? 'border-[#284E38] bg-emerald-50/50 shadow-xs'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-[#284E38] text-white flex items-center justify-center text-xs font-bold">
                        {p.name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-stone-900">{p.name}</span>
                      <span className="text-[10px] font-bold text-[#8C6D23] bg-[#FCECD4] px-2 py-0.5 rounded-md">
                        {p.grade} · {p.board}
                      </span>
                    </div>
                    {selectedDemoIndex === idx && (
                      <Check className="w-4 h-4 text-[#284E38]" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-500 pl-9">
                    <span>Subjects: {p.subjects.join(', ')}</span>
                    <span className="font-semibold text-emerald-800">{p.xp} XP · {p.streak}d streak</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#284E38] to-[#1E3B2A] hover:from-[#1E3B2A] hover:to-[#14281C] text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Loading Demo Profile...</span>
                </>
              ) : (
                <>
                  <span>Enter as {DEMO_PERSONAS[selectedDemoIndex].name}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* ---------------- MODE 2: FRESH ACCOUNT (ZERO DATA) ---------------- */}
        {mode === 'new_fresh' && (
          <form onSubmit={handleFreshCreate} className="space-y-4">
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed">
              <strong>✨ Fresh Slate Account:</strong> You will start with <strong>0 documents</strong>, <strong>0 XP</strong>, and an empty vault so you can upload your own PDFs and build your curriculum from scratch.
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={freshName}
                onChange={e => setFreshName(e.target.value)}
                placeholder="e.g. Aarav Gupta"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#284E38] focus:ring-1 focus:ring-[#284E38] text-sm text-stone-900 outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Class / Grade
                </label>
                <select
                  value={freshGrade}
                  onChange={e => setFreshGrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-800 focus:border-[#284E38] outline-none"
                >
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10 (Board)</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12 (Board)</option>
                  <option value="Target 2027">JEE / NEET Aspirant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Board
                </label>
                <select
                  value={freshBoard}
                  onChange={e => setFreshBoard(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-800 focus:border-[#284E38] outline-none"
                >
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="State Board">State Board</option>
                  <option value="Cambridge">Cambridge / IB</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Enrolled Subjects (Select all that apply)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Mathematics', 'Science', 'Social Science', 'Physics', 'Chemistry', 'Biology'].map(sub => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleSubject(sub)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      freshSubjects.includes(sub)
                        ? 'bg-[#284E38] text-white border-[#284E38]'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#284E38] to-[#1E3B2A] hover:from-[#1E3B2A] hover:to-[#14281C] text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Creating Fresh Student Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Fresh Student &amp; Enter Portal</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ---------------- MODE 3: RESUME EXISTING ---------------- */}
        {mode === 'existing' && (
          <form onSubmit={handleExistingLogin} className="space-y-4">
            <p className="text-xs text-stone-600 leading-relaxed">
              If you previously created an account or want to log in with your custom student name or ID:
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Student Name or ID
              </label>
              <input
                type="text"
                value={existingIdentifier}
                onChange={e => setExistingIdentifier(e.target.value)}
                placeholder="e.g. Rahul Sud or student_fresh_..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#284E38] focus:ring-1 focus:ring-[#284E38] text-sm text-stone-900 outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Resume Learning Session</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
