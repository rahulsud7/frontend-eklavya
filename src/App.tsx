import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Brain,
  FolderLock,
  Calendar as CalendarIcon,
  Layers,
  Award,
  Compass,
  Mic,
  User,
  Info,
  Flame,
  Trophy,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Server,
  ShieldCheck
} from 'lucide-react';
import { UserProfile, DocumentItem, LanguageMode } from './types';
import {
  syncUserApi,
  getDocumentsApi,
  checkBackendHealth,
  getIsBackendLive,
  DEFAULT_USER
} from './services/api';

import { AuthGuard } from './components/AuthGuard';
import { PomodoroTimer } from './components/PomodoroTimer';
import { ContextControlBar } from './components/ContextControlBar';
import { ServerBar } from './components/ServerBar';
import { ClerkAuthModal } from './components/ClerkAuthModal';

import { MentorTab } from './components/tabs/MentorTab';
import { VaultTab } from './components/tabs/VaultTab';
import { ScheduleTab } from './components/tabs/ScheduleTab';
import { QuizTab } from './components/tabs/QuizTab';
import { FlashcardsTab } from './components/tabs/FlashcardsTab';
import { CareerMapTab } from './components/tabs/CareerMapTab';
import { VoiceTab } from './components/tabs/VoiceTab';
import { ProfileTab } from './components/tabs/ProfileTab';
import { AboutTab } from './components/tabs/AboutTab';

export type ActiveTab =
  | 'mentor'
  | 'vault'
  | 'schedule'
  | 'flashcards'
  | 'quiz'
  | 'roadmap'
  | 'voice'
  | 'profile'
  | 'about';

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return Boolean(localStorage.getItem('eklavya_auth_session'));
    }
    return false;
  });
  const [user, setUser] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('eklavya_profile');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return DEFAULT_USER;
  });
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('mentor');
  const [activeSubject, setActiveSubject] = useState<string>('Mathematics');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [language, setLanguage] = useState<LanguageMode>('Hinglish');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [showClerkModal, setShowClerkModal] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Initialize data and check backend connectivity
  const initApp = useCallback(async () => {
    const isLive = await checkBackendHealth();
    setIsBackendConnected(isLive);

    const syncRes = await syncUserApi(user.user_id, user.name);
    if (syncRes.profile) {
      setUser(syncRes.profile);
      if (syncRes.profile.subjects && syncRes.profile.subjects.length > 0) {
        if (!syncRes.profile.subjects.includes(activeSubject)) {
          setActiveSubject(syncRes.profile.subjects[0]);
        }
      }
    }

    const docs = await getDocumentsApi(user.user_id);
    setDocuments(docs);
  }, [user.user_id, user.name, activeSubject]);

  useEffect(() => {
    initApp();

    // Auto-poll backend health every 8s to detect when user runs `uvicorn main:app --reload`
    const pollInterval = setInterval(async () => {
      const isLive = await checkBackendHealth();
      setIsBackendConnected(isLive);
    }, 8000);

    return () => clearInterval(pollInterval);
  }, [initApp]);

  const refreshDocuments = async () => {
    const docs = await getDocumentsApi(user.user_id);
    setDocuments(docs);
  };

  const handleGrantXp = (amount: number) => {
    setUser(prev => ({
      ...prev,
      xp: prev.xp + amount
    }));
  };

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('eklavya_auth_session');
    }
    setIsSignedIn(false);
    setShowUserMenu(false);
  };

  const handleSignIn = (newUser: Partial<UserProfile>) => {
    const fullUser: UserProfile = {
      ...DEFAULT_USER,
      ...newUser
    };
    setUser(fullUser);
    setIsSignedIn(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('eklavya_auth_session', 'true');
      localStorage.setItem('eklavya_profile', JSON.stringify(fullUser));
    }
    if (fullUser.subjects && fullUser.subjects.length > 0) {
      setActiveSubject(fullUser.subjects[0]);
    }
    refreshDocuments();
  };

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'mentor', label: 'Mentor', icon: Brain },
    { id: 'vault', label: 'Vault', icon: FolderLock },
    { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'quiz', label: 'Quiz', icon: Award },
    { id: 'roadmap', label: 'Roadmap', icon: Compass },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'about', label: 'About', icon: Info }
  ];

  if (!isSignedIn) {
    return <AuthGuard onSignIn={handleSignIn} />;
  }

  return (
    <div className="min-h-screen eklavya-doodle-bg flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-[#1E2922] relative">
      {/* Subtle Floating STEM Aesthetic Emblems */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none opacity-25">
        <span className="absolute top-28 left-8 text-4xl font-serif text-[#8C6D23]">π</span>
        <span className="absolute top-48 right-16 text-3xl font-serif text-[#284E38]">∑</span>
        <span className="absolute top-96 left-12 text-3xl font-serif text-[#B85C38]">∫</span>
        <span className="absolute bottom-40 right-24 text-2xl font-serif text-[#8C6D23]">λ</span>
        <span className="absolute bottom-20 left-1/4 text-2xl font-serif text-[#284E38]">sin θ</span>
        <span className="absolute top-1/2 right-10 text-xl font-mono text-[#B85C38]">Δ</span>
      </div>

      {/* Top Server Connection Gateway Bar */}
      <ServerBar
        isBackendConnected={isBackendConnected}
        onServerChange={async () => {
          await initApp();
        }}
        onGrantXp={handleGrantXp}
      />

      {/* 1. Global Header */}
      <header className="sticky top-0 z-[150] w-full bg-white/95 backdrop-blur-md border-b border-[#8C6D23]/20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 relative z-[155]">
          {/* Brand Wordmark & Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveTab('mentor'); }}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#284E38] to-[#1E3B2A] text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
                🏹
              </div>
              <div className="text-left">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#284E38] whitespace-nowrap block leading-tight">
                  Project Eklavya
                </span>
                <span className="text-[10px] text-[#8C6D23] font-bold tracking-wide uppercase block -mt-0.5">
                  Guru for Modern India
                </span>
              </div>
            </a>
          </div>

          {/* Center/Right Zone: Pomodoro, Gamification & Clerk User Button */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            {/* Pomodoro Timer */}
            <PomodoroTimer
              onSessionComplete={(mins) => {
                handleGrantXp(mins * 2);
              }}
            />

            {/* Streak Counter */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/85 border border-amber-300/70 shadow-xs text-xs font-bold text-[#B85C38]"
              title="Daily Learning Streak"
            >
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
              <span className="font-mono tabular-nums text-sm font-extrabold">{user.streak}</span>
              <span className="text-[10px] font-bold text-stone-500 hidden sm:inline">Days</span>
            </div>

            {/* XP Counter */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/85 border border-[#8C6D23]/30 shadow-xs text-xs font-bold text-[#8C6D23]"
              title="Total Learning XP"
            >
              <Trophy className="w-4 h-4 text-[#8C6D23]" />
              <span className="font-mono tabular-nums text-sm font-extrabold">{user.xp}</span>
              <span className="text-[10px] font-bold text-stone-500 hidden sm:inline">XP</span>
            </div>

            {/* Clerk-style User Avatar / Dropdown */}
            <div className="relative z-[160]" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-expanded={showUserMenu}
                aria-haspopup="true"
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-stone-100 transition-colors cursor-pointer border border-transparent hover:border-stone-200"
              >
                <div className="w-7 h-7 rounded-xl bg-[#284E38] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user.name.charAt(0)}
                </div>
                <span className="text-xs font-bold text-[#284E38] hidden md:inline max-w-[100px] truncate">
                  {user.name}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-stone-500 hidden sm:inline transition-transform duration-150 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <>
                  {/* Backdrop to prevent interaction with underlying elements and close cleanly */}
                  <div
                    className="fixed inset-0 z-[165] bg-black/10 cursor-default"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-stone-200/90 p-2 z-[170] ring-1 ring-black/10 animate-in fade-in slide-in-from-top-1 text-left">
                    <div className="px-3.5 py-2.5 border-b border-stone-100 bg-[#FAF9F5] rounded-xl mb-1">
                      <p className="text-xs font-bold text-stone-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-[#8C6D23] font-semibold">{user.board} · {user.class_grade}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-stone-500 font-mono">
                        <span className="font-bold text-[#284E38] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                          {user.xp} XP
                        </span>
                        <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                          {user.streak}d streak
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('profile'); setShowUserMenu(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-[#284E38] rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-[#284E38]" />
                      Academic Profile & Badges
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowClerkModal(true); setShowUserMenu(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-[#8C6D23] rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#8C6D23]" />
                      Switch Account (Clerk)
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors mt-0.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Sticky Context Control Bar with Backend Link */}
      <ContextControlBar
        subjects={user.subjects}
        activeSubject={activeSubject}
        onSubjectChange={(subj) => {
          setActiveSubject(subj);
          setActiveDocId(null);
        }}
        documents={documents}
        activeDocId={activeDocId}
        onDocChange={(docId) => setActiveDocId(docId)}
        language={language}
        onLanguageChange={(lang) => setLanguage(lang)}
        isBackendConnected={isBackendConnected}
        onBackendReconnect={async () => {
          const live = await checkBackendHealth();
          setIsBackendConnected(live);
        }}
      />

      {/* 3. Main Split Viewport with Sidebar Navigation */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col lg:flex-row gap-6 relative">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 space-y-2">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-3 border border-[#8C6D23]/20 shadow-xs space-y-1">
            <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
              Learning Modules
            </div>

            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#284E38] text-white shadow-md'
                      : 'text-stone-700 hover:bg-stone-100 hover:text-[#284E38]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-[#8C6D23]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Syllabus Focus Widget */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-4 border border-stone-200/80 text-left shadow-2xs">
            <span className="text-[10px] font-bold text-[#8C6D23] uppercase tracking-wider block mb-1">
              Active Focus
            </span>
            <div className="text-xs font-bold text-[#284E38] truncate">{activeSubject}</div>
            <div className="text-[11px] text-stone-500 mt-1 line-clamp-2">
              {activeDocId
                ? documents.find(d => d.id === activeDocId)?.custom_name
                : `All ${documents.filter(d => d.subject === activeSubject).length} Chapters Vectorized`}
            </div>
          </div>
        </aside>

        {/* Mobile Slide-down Nav Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white/95 rounded-3xl p-3 border border-stone-200 shadow-xl grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#284E38] text-white shadow-sm'
                      : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-[#8C6D23]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Active Tab Viewport Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'mentor' && (
            <MentorTab
              userId={user.user_id}
              activeSubject={activeSubject}
              activeDocId={activeDocId}
              documents={documents}
              language={language}
              onGrantXp={handleGrantXp}
              onNavigateToTab={(tab) => setActiveTab(tab as ActiveTab)}
              onSelectDocId={(docId, subject) => {
                setActiveSubject(subject);
                setActiveDocId(docId);
              }}
            />
          )}

          {activeTab === 'vault' && (
            <VaultTab
              userId={user.user_id}
              subjects={user.subjects}
              activeSubject={activeSubject}
              documents={documents}
              onRefreshDocs={refreshDocuments}
              onGrantXp={handleGrantXp}
              onNavigateToSchedule={() => setActiveTab('schedule')}
              onSubjectChange={setActiveSubject}
              onSelectDocId={(docId, subject) => {
                setActiveSubject(subject);
                setActiveDocId(docId);
              }}
              onNavigateToTab={(tab) => setActiveTab(tab as ActiveTab)}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleTab
              documents={documents}
              onSelectDocId={(docId, subject) => {
                setActiveSubject(subject);
                setActiveDocId(docId);
              }}
              onNavigateToTab={(tab) => setActiveTab(tab as ActiveTab)}
              onGrantXp={handleGrantXp}
            />
          )}

          {activeTab === 'flashcards' && (
            <FlashcardsTab
              userId={user.user_id}
              activeSubject={activeSubject}
              activeDocId={activeDocId}
              documents={documents}
              language={language}
              onGrantXp={handleGrantXp}
            />
          )}

          {activeTab === 'quiz' && (
            <QuizTab
              userId={user.user_id}
              activeSubject={activeSubject}
              activeDocId={activeDocId}
              documents={documents}
              language={language}
              onGrantXp={handleGrantXp}
            />
          )}

          {activeTab === 'roadmap' && (
            <CareerMapTab
              userId={user.user_id}
              activeSubject={activeSubject}
              activeDocId={activeDocId}
              language={language}
            />
          )}

          {activeTab === 'voice' && (
            <VoiceTab
              userId={user.user_id}
              activeSubject={activeSubject}
              activeDocId={activeDocId}
              language={language}
              onGrantXp={handleGrantXp}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              user={user}
              onUpdateProfile={(updated) => setUser(updated)}
              onGrantXp={handleGrantXp}
            />
          )}

          {activeTab === 'about' && <AboutTab />}
        </main>
      </div>

      {/* Clerk Switch Account Modal */}
      <ClerkAuthModal
        isOpen={showClerkModal}
        onClose={() => setShowClerkModal(false)}
        onSuccess={handleSignIn}
      />
    </div>
  );
}
