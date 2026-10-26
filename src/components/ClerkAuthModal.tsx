import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  X,
  UserPlus,
  LogIn,
  RotateCcw,
  Check,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { syncUserApi, onboardUserApi, saveLocalDocuments } from '../services/api';

interface ClerkAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: Partial<UserProfile>) => void;
}

type AuthTab = 'demo' | 'fresh' | 'existing';

const DEMO_STUDENTS = [
  {
    id: 'user_rahul_sud',
    name: 'Rahul Sud',
    email: 'rahulsud1210@gmail.com',
    grade: 'Class 10',
    board: 'CBSE',
    subjects: ['Mathematics', 'Science', 'Social Science'],
    xp: 350,
    streak: 6
  },
  {
    id: 'user_priya_sharma',
    name: 'Priya Sharma',
    email: 'priya.sharma@eklavya.edu',
    grade: 'Class 12',
    board: 'CBSE (PCM / JEE)',
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    xp: 840,
    streak: 14
  },
  {
    id: 'user_arjun_patel',
    name: 'Arjun Patel',
    email: 'arjun.patel@eklavya.edu',
    grade: 'Class 11',
    board: 'ICSE (PCB / NEET)',
    subjects: ['Biology', 'Physics', 'Chemistry'],
    xp: 620,
    streak: 8
  }
];

export const ClerkAuthModal: React.FC<ClerkAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [tab, setTab] = useState<AuthTab>('demo');
  const [selectedDemoIndex, setSelectedDemoIndex] = useState(0);

  // Fresh user states
  const [freshName, setFreshName] = useState('');
  const [freshGrade, setFreshGrade] = useState('Class 10');
  const [freshBoard, setFreshBoard] = useState('CBSE');
  const [freshSubjects, setFreshSubjects] = useState<string[]>([
    'Mathematics',
    'Science',
    'Social Science'
  ]);

  // Existing user state
  const [existingId, setExistingId] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSubject = (sub: string) => {
    setFreshSubjects(prev =>
      prev.includes(sub) ? (prev.length > 1 ? prev.filter(s => s !== sub) : prev) : [...prev, sub]
    );
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  const handleSelectDemo = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const demo = DEMO_STUDENTS[selectedDemoIndex];

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('eklavya_is_fresh', 'false');
        localStorage.setItem('eklavya_auth_session', 'true');
      }

      await syncUserApi(demo.id, demo.name);
      await onboardUserApi({
        user_id: demo.id,
        class_grade: demo.grade,
        course_type: 'School',
        board: demo.board,
        subjects: demo.subjects
      });

      triggerCelebration();

      const profile: Partial<UserProfile> = {
        user_id: demo.id,
        name: demo.name,
        xp: demo.xp,
        streak: demo.streak,
        board: demo.board,
        class_grade: demo.grade,
        subjects: demo.subjects
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('eklavya_profile', JSON.stringify(profile));
      }

      onSuccess(profile);
      onClose();
    } catch {
      triggerCelebration();
      const profile: Partial<UserProfile> = {
        user_id: demo.id,
        name: demo.name,
        xp: demo.xp,
        streak: demo.streak,
        board: demo.board,
        class_grade: demo.grade,
        subjects: demo.subjects
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('eklavya_profile', JSON.stringify(profile));
      }
      onSuccess(profile);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFresh = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freshName.trim()) {
      setErrorMsg('Please enter student name');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);

    const freshUserId = `student_fresh_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const cleanName = freshName.trim();

    try {
      if (typeof window !== 'undefined') {
        // Zero data flag
        localStorage.setItem('eklavya_is_fresh', 'true');
        localStorage.setItem('eklavya_documents', JSON.stringify([]));
        localStorage.setItem('eklavya_auth_session', 'true');
      }

      await syncUserApi(freshUserId, cleanName);
      await onboardUserApi({
        user_id: freshUserId,
        class_grade: freshGrade,
        course_type: 'School',
        board: freshBoard,
        subjects: freshSubjects
      });

      // Clear local documents array so student has zero data and adds data themselves
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

      onSuccess(profile);
      onClose();
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
      onSuccess(profile);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingId.trim()) {
      setErrorMsg('Please enter a student name or ID');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);

    const clean = existingId.trim();
    const userId = clean.startsWith('student_') || clean.startsWith('user_')
      ? clean
      : `user_${clean.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    try {
      const syncRes = await syncUserApi(userId, clean);
      triggerCelebration();

      const profile: Partial<UserProfile> = {
        user_id: userId,
        name: syncRes.profile?.name || clean,
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

      onSuccess(profile);
      onClose();
    } catch {
      triggerCelebration();
      const profile: Partial<UserProfile> = {
        user_id: userId,
        name: clean,
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
      onSuccess(profile);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[200] animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-stone-200 shadow-2xl relative text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#284E38] text-white flex items-center justify-center font-bold text-sm">
              🏹
            </div>
            <div>
              <h3 className="text-base font-bold text-[#284E38]">
                Switch or Create Student Account
              </h3>
              <p className="text-[11px] text-stone-500">
                Choose a pre-loaded demo or start a fresh zero-data account
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-stone-100 rounded-xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setTab('demo'); setErrorMsg(null); }}
            className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
              tab === 'demo' ? 'bg-white text-[#284E38] shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Demo Accounts
          </button>
          <button
            type="button"
            onClick={() => { setTab('fresh'); setErrorMsg(null); }}
            className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
              tab === 'fresh' ? 'bg-white text-[#284E38] shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            ✨ New (0 Data)
          </button>
          <button
            type="button"
            onClick={() => { setTab('existing'); setErrorMsg(null); }}
            className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
              tab === 'existing' ? 'bg-white text-[#284E38] shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Resume ID
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Tab 1: Demo */}
        {tab === 'demo' && (
          <div className="space-y-3">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              Select Demo Persona (Pre-Loaded NCERT Vault):
            </span>
            <div className="space-y-2">
              {DEMO_STUDENTS.map((d, idx) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDemoIndex(idx)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedDemoIndex === idx
                      ? 'border-[#284E38] bg-emerald-50/50 shadow-2xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">{d.name}</span>
                    <span className="text-[10px] font-bold text-[#8C6D23] bg-[#FCECD4] px-2 py-0.5 rounded-md">
                      {d.grade} · {d.board}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
                    <span>{d.subjects.join(', ')}</span>
                    <span className="font-semibold text-emerald-800">{d.xp} XP</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSelectDemo}
              disabled={isLoading}
              className="w-full mt-3 py-2.5 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading Demo Persona...</span>
                </>
              ) : (
                <>
                  <span>Switch to {DEMO_STUDENTS[selectedDemoIndex].name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 2: Fresh Zero Data */}
        {tab === 'fresh' && (
          <form onSubmit={handleCreateFresh} className="space-y-3">
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
              <strong>✨ Fresh Student Account:</strong> Starts with 0 documents and 0 XP. You can upload custom PDFs in the Vault.
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                value={freshName}
                onChange={e => setFreshName(e.target.value)}
                placeholder="e.g. Aarav Gupta"
                required
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 outline-none focus:border-[#284E38]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Class / Grade
                </label>
                <select
                  value={freshGrade}
                  onChange={e => setFreshGrade(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 outline-none"
                >
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                  <option value="Target 2027">JEE / NEET Aspirant</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Board
                </label>
                <select
                  value={freshBoard}
                  onChange={e => setFreshBoard(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 outline-none"
                >
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="State Board">State Board</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Subjects
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {['Mathematics', 'Science', 'Social Science', 'Physics', 'Chemistry', 'Biology'].map(sub => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleSubject(sub)}
                    className={`py-1 px-1.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                      freshSubjects.includes(sub)
                        ? 'bg-[#284E38] text-white border-[#284E38]'
                        : 'bg-stone-50 text-stone-600 border-stone-200'
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
              className="w-full mt-2 py-2.5 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Fresh Student...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Fresh Student (Zero Data)</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 3: Resume Existing */}
        {tab === 'existing' && (
          <form onSubmit={handleResumeExisting} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Student Name or ID
              </label>
              <input
                type="text"
                value={existingId}
                onChange={e => setExistingId(e.target.value)}
                placeholder="e.g. Rahul Sud or student_fresh_..."
                required
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 outline-none focus:border-[#284E38]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Resuming Account...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Resume Student Account</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
