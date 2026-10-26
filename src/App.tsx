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
  ShieldCheck,
  UserPlus,
  Sun,
  Moon
} from 'lucide-react';
import { UserProfile, DocumentItem, LanguageMode } from './types';
import {
  syncUserApi,
  getDocumentsApi,
  checkBackendHealth,
  getIsBackendLive,
  DEFAULT_USER
} from './services/api';
import { getThemeCookie, saveThemeCookie } from './services/cookies';

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

  // Dark Mode Theme State (hydrated from cookies and localStorage)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const fromCookie = getThemeCookie();
      if (fromCookie) return fromCookie;
      const fromStorage = localStorage.getItem('eklavya_theme');
      if (fromStorage === 'dark' || fromStorage === 'light') return fromStorage;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
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

  // Apply dark mode class to document element and persist in cookies & localStorage
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      saveThemeCookie(theme);
      localStorage.setItem('eklavya_theme', theme);
    }
  }, [theme]);

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

    const pollInterval = setInterval(async () => {
      const isLive = await checkBackendHealth();
      setIsBackendConnected(isLive);
    }, 8000);

    return () => clearInterval(pollInterval);
  }, [initApp]);

  // Refresh documents whenever activeTab changes or user changes
  useEffect(() => {
    getDocumentsApi(user.user_id).then(docs => {
      setDocuments(docs);
    });
  }, [activeTab, user.user_id]);

  // Handle XP gain with local storage update
  const handleGrantXp = (amount: number) => {
    setUser(prev => {
      const updated = {
        ...prev,
        xp: prev.xp + amount,
        streak: prev.streak > 0 ? prev.streak : 1
      };
      localStorage.setItem('eklavya_profile', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSignOut = () => {
    localStorage.removeItem('eklavya_auth_session');
    setIsSignedIn(false);
    setShowUserMenu(false);
  };

  const navItems: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'mentor', label: 'AI Mentor', icon: Brain },
    { id: 'vault', label: 'Curriculum Vault', icon: FolderLock },
    { id: 'schedule', label: 'Study Planner', icon: CalendarIcon },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'quiz', label: 'Quiz Arena', icon: Award },
    { id: 'roadmap', label: 'Career Roadmap', icon: Compass },
    { id: 'voice', label: 'Voice Mode', icon: Mic },
    { id: 'profile', label: 'Profile & XP', icon: User },
    { id: 'about', label: 'Architecture', icon: Info }
  ];

  if (!isSignedIn) {
    return (
      <div className={`min-h-screen eklavya-doodle-bg flex flex-col justify-center items-center p-4 transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
        <AuthGuard
          onSignIn={(loggedInUser) => {
            setUser(prev => ({ ...prev, ...loggedInUser }));
            setIsSignedIn(true);
            initApp();
          }}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen eklavya-doodle-bg flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Top Server Connection Gateway Bar */}
      <ServerBar
        isBackendConnected={isBackendConnected}
        onServerChange={async () => {
          await initApp();
        }}
        onGrantXp={handleGrantXp}
      />

      {/* 1. Global Header */}
      <header className="sticky top-0 z-[150] w-full bg-white/95 dark:bg-[#151D18]/95 backdrop-blur-md border-b border-[#8C6D23]/20 dark:border-[#2C3B30] shadow-xs transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 relative z-[155]">
          {/* Brand Wordmark & Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#1E2922]"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveTab('mentor'); }}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#284E38] to-[#1E3B2A] dark:from-[#36684B] dark:to-[#1F3D2C] text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
                🏹
              </div>
              <div className="text-left">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#284E38] dark:text-emerald-400 whitespace-nowrap block leading-tight">
                  Project Eklavya
                </span>
                <span className="text-[10px] text-[#8C6D23] dark:text-[#E6B34A] font-bold tracking-wide uppercase block -mt-0.5">
                  Guru for Modern India
                </span>
              </div>
            </a>
          </div>

          {/* Center/Right Zone: Dark Mode Toggle, Pomodoro, Gamification & User Avatar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Dark Mode Night Study Toggle */}
            <button
              type="button"
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/90 dark:bg-[#1A221E] border border-stone-200/90 dark:border-[#2C3B30] shadow-xs text-xs font-bold text-stone-700 dark:text-stone-200 hover:text-[#284E38] dark:hover:text-[#E6B34A] transition-all cursor-pointer"
              title={theme === 'dark' ? 'Switch to Day Light Mode' : 'Switch to Late-Night Study Dark Mode (Eye-friendly)'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                  <span className="hidden md:inline">Day</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#8C6D23]" />
                  <span className="hidden md:inline">Night</span>
                </>
              )}
            </button>

            {/* Pomodoro Timer */}
            <PomodoroTimer
              onSessionComplete={(mins) => {
                handleGrantXp(mins * 2);
              }}
            />

            {/* Streak Counter */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/85 dark:bg-[#1A221E] border border-amber-300/70 dark:border-amber-700/60 shadow-xs text-xs font-bold text-[#B85C38] dark:text-[#E07048]"
              title="Daily Learning Streak"
            >
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
              <span className="font-mono tabular-nums text-sm font-extrabold">{user.streak}</span>
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 hidden sm:inline">Days</span>
            </div>

            {/* XP Counter */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/85 dark:bg-[#1A221E] border border-[#8C6D23]/30 dark:border-[#8C6D23]/50 shadow-xs text-xs font-bold text-[#8C6D23] dark:text-[#E6B34A]"
              title="Total Learning XP"
            >
              <Trophy className="w-4 h-4 text-[#8C6D23] dark:text-[#E6B34A]" />
              <span className="font-mono tabular-nums text-sm font-extrabold">{user.xp}</span>
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 hidden sm:inline">XP</span>
            </div>

            {/* User Avatar / Dropdown */}
            <div className="relative z-[160]" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-expanded={showUserMenu}
                aria-haspopup="true"
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-stone-100 dark:hover:bg-[#1E2922] transition-colors cursor-pointer border border-transparent hover:border-stone-200 dark:hover:border-stone-700"
              >
                <div className="w-7 h-7 rounded-xl bg-[#284E38] dark:bg-[#36684B] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user.name.charAt(0)}
                </div>
                <span className="text-xs font-bold text-[#284E38] dark:text-emerald-300 hidden md:inline max-w-[100px] truncate">
                  {user.name}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-stone-500 dark:text-stone-400 hidden sm:inline transition-transform duration-150 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-[165] bg-black/10 cursor-default"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#1A221E] rounded-2xl shadow-2xl border border-stone-200/90 dark:border-[#2C3B30] p-2 z-[170] ring-1 ring-black/10 animate-in fade-in slide-in-from-top-1 text-left">
                    <div className="px-3.5 py-2.5 border-b border-stone-100 dark:border-stone-800 bg-[#FAF9F5] dark:bg-[#151D18] rounded-xl mb-1">
                      <p className="text-xs font-bold text-stone-900 dark:text-[#EAE8E3] truncate">{user.name}</p>
                      <p className="text-[11px] text-[#8C6D23] dark:text-[#E6B34A] font-semibold">{user.board} · {user.class_grade}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-stone-500 font-mono">
                        <span className="font-bold text-[#284E38] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800">
                          {user.xp} XP
                        </span>
                        <span className="text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-800">
                          {user.streak}d streak
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('profile'); setShowUserMenu(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#202B24] hover:text-[#284E38] dark:hover:text-emerald-400 rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-[#284E38] dark:text-emerald-400" />
                      Academic Profile & Badges
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowClerkModal(true); setShowUserMenu(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#202B24] hover:text-[#8C6D23] dark:hover:text-[#E6B34A] rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-[#8C6D23] dark:text-[#E6B34A]" />
                      Switch / Create Student
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors mt-0.5"
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

      {/* 2. Sticky Context Control Bar */}
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
          <div className="bg-white/80 dark:bg-[#161D19]/90 backdrop-blur-md rounded-3xl p-3 border border-[#8C6D23]/20 dark:border-[#2C3B30] shadow-xs space-y-1">
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
                      ? 'bg-[#284E38] text-white shadow-md dark:bg-[#2A573C]'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#1E2922] hover:text-[#284E38] dark:hover:text-emerald-400'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-[#8C6D23] dark:text-[#E6B34A]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Syllabus Focus Widget */}
          <div className="bg-white/70 dark:bg-[#161D19]/70 backdrop-blur-md rounded-3xl p-4 border border-stone-200/80 dark:border-[#2C3B30] text-left shadow-2xs">
            <span className="text-[10px] font-bold text-[#8C6D23] dark:text-[#E6B34A] uppercase tracking-wider block mb-1">
              Active Focus
            </span>
            <div className="text-xs font-bold text-[#284E38] dark:text-emerald-400 truncate">{activeSubject}</div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
              {activeDocId
                ? documents.find(d => d.id === activeDocId)?.custom_name
                : `All ${documents.filter(d => d.subject === activeSubject).length} Chapters Vectorized`}
            </div>
          </div>
        </aside>

        {/* Mobile Slide-down Nav Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white/95 dark:bg-[#161D19]/95 rounded-3xl p-3 border border-stone-200 dark:border-[#2C3B30] shadow-xl grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
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
                      ? 'bg-[#284E38] text-white shadow-sm dark:bg-[#2A573C]'
                      : 'bg-stone-50 dark:bg-[#1A221E] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#202D26]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-[#8C6D23] dark:text-[#E6B34A]'}`} />
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
              onRefreshDocs={() => {
                initApp();
                handleGrantXp(25);
              }}
              onGrantXp={handleGrantXp}
              onSelectDocId={(docId, subject) => {
                setActiveSubject(subject);
                setActiveDocId(docId);
                setActiveTab('mentor');
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
              onGrantXp={handleGrantXp}
              onNavigateToTab={(tab) => setActiveTab(tab as ActiveTab)}
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
              onUpdateProfile={(updated) => {
                setUser(updated);
                localStorage.setItem('eklavya_profile', JSON.stringify(updated));
              }}
              onGrantXp={handleGrantXp}
            />
          )}

          {activeTab === 'about' && <AboutTab />}
        </main>
      </div>

      {/* Manual / Clerk Auth Switch Modal */}
      {showClerkModal && (
        <ClerkAuthModal
          isOpen={showClerkModal}
          onClose={() => setShowClerkModal(false)}
          onSuccess={(selectedUser) => {
            setUser(prev => ({ ...prev, ...selectedUser }));
            localStorage.setItem('eklavya_auth_session', 'true');
            localStorage.setItem('eklavya_profile', JSON.stringify(selectedUser));
            initApp();
            setShowClerkModal(false);
          }}
        />
      )}
    </div>
  );
}
