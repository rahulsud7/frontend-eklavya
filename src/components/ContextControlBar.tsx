import React, { useState } from 'react';
import { BookOpen, FileText, Globe, Server, Settings2 } from 'lucide-react';
import { DocumentItem, LanguageMode } from '../types';
import { BackendMonitorModal } from './BackendMonitorModal';
import { getApiBaseUrl } from '../services/api';

interface ContextControlBarProps {
  subjects: string[];
  activeSubject: string;
  onSubjectChange: (subj: string) => void;
  documents: DocumentItem[];
  activeDocId: string | null;
  onDocChange: (docId: string | null) => void;
  language: LanguageMode;
  onLanguageChange: (lang: LanguageMode) => void;
  isBackendConnected: boolean;
  onBackendReconnect: () => void;
}

export const ContextControlBar: React.FC<ContextControlBarProps> = ({
  subjects,
  activeSubject,
  onSubjectChange,
  documents,
  activeDocId,
  onDocChange,
  language,
  onLanguageChange,
  isBackendConnected,
  onBackendReconnect
}) => {
  const [showBackendModal, setShowBackendModal] = useState(false);

  // Filter documents by selected subject
  const subjectDocs = documents.filter(
    doc => doc.subject.toLowerCase() === activeSubject.toLowerCase()
  );
  const otherDocs = documents.filter(
    doc => doc.subject.toLowerCase() !== activeSubject.toLowerCase()
  );

  const handleDocSelectChange = (newDocId: string) => {
    if (!newDocId) {
      onDocChange(null);
      return;
    }
    const found = documents.find(d => d.id === newDocId);
    if (found && found.subject.toLowerCase() !== activeSubject.toLowerCase()) {
      onSubjectChange(found.subject);
    }
    onDocChange(newDocId);
  };

  return (
    <div className="sticky top-16 z-20 w-full bg-[#FAF9F5]/95 dark:bg-[#151D18]/95 backdrop-blur-md border-b border-[#8C6D23]/20 dark:border-[#2C3B30] shadow-sm transition-colors duration-300 py-2.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Controls Cluster */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 flex-1">
          {/* 1. Subject Selector */}
          <div className="flex items-center gap-1.5 bg-white/90 dark:bg-[#1A221E] border border-stone-200/90 dark:border-[#2C3B30] rounded-2xl px-3 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-[#284E38]/20 transition-all">
            <BookOpen className="w-4 h-4 text-[#284E38] dark:text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <label htmlFor="subject-select" className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400">
                Subject
              </label>
              <select
                id="subject-select"
                value={activeSubject}
                onChange={e => onSubjectChange(e.target.value)}
                className="text-xs sm:text-sm font-bold text-[#284E38] dark:text-emerald-400 bg-transparent border-none outline-none cursor-pointer pr-4 dark:bg-[#1A221E]"
              >
                {subjects.map(subj => (
                  <option key={subj} value={subj} className="dark:bg-[#1A221E] dark:text-[#EAE8E3]">
                    {subj}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Document Vault Selector (Filtered by subject + "📚 Entire Subject" fallback + Other Uploads) */}
          <div className="flex items-center gap-1.5 bg-white/90 dark:bg-[#1A221E] border border-stone-200/90 dark:border-[#2C3B30] rounded-2xl px-3 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-[#284E38]/20 transition-all">
            <FileText className="w-4 h-4 text-[#8C6D23] dark:text-[#E6B34A] shrink-0" />
            <div className="flex flex-col">
              <label htmlFor="doc-select" className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400">
                Context Document
              </label>
              <select
                id="doc-select"
                value={activeDocId || ''}
                onChange={e => handleDocSelectChange(e.target.value)}
                className="text-xs sm:text-sm font-semibold text-[#1E2922] dark:text-[#EAE8E3] bg-transparent border-none outline-none cursor-pointer max-w-[200px] sm:max-w-xs truncate pr-4 dark:bg-[#1A221E]"
              >
                <option value="" className="dark:bg-[#1A221E] dark:text-[#EAE8E3]">📚 Entire {activeSubject} ({subjectDocs.length} Chapters)</option>
                {subjectDocs.length > 0 && (
                  <optgroup label={`${activeSubject} Chapters`} className="dark:bg-[#1A221E] dark:text-[#EAE8E3]">
                    {subjectDocs.map(doc => (
                      <option key={doc.id} value={doc.id} className="dark:bg-[#1A221E] dark:text-[#EAE8E3]">
                        📄 {doc.custom_name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherDocs.length > 0 && (
                  <optgroup label="Other Uploaded Vault Chapters" className="dark:bg-[#1A221E] dark:text-[#EAE8E3]">
                    {otherDocs.map(doc => (
                      <option key={doc.id} value={doc.id} className="dark:bg-[#1A221E] dark:text-[#EAE8E3]">
                        📄 [{doc.subject}] {doc.custom_name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          {/* 3. Output Language Dropdown (Hinglish, Hindi, English) */}
          <div className="flex items-center gap-1.5 bg-white/90 dark:bg-[#1A221E] border border-stone-200/90 dark:border-[#2C3B30] rounded-2xl px-3 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-[#284E38]/20 transition-all">
            <Globe className="w-4 h-4 text-[#B85C38] dark:text-[#E07048] shrink-0" />
            <div className="flex flex-col">
              <label htmlFor="language-select" className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400">
                AI Language
              </label>
              <select
                id="language-select"
                value={language}
                onChange={e => onLanguageChange(e.target.value as LanguageMode)}
                className="text-xs sm:text-sm font-bold text-[#B85C38] dark:text-[#E07048] bg-transparent border-none outline-none cursor-pointer pr-3 dark:bg-[#1A221E]"
              >
                <option value="Hinglish" className="dark:bg-[#1A221E] dark:text-[#EAE8E3]">Hinglish (Bilingual)</option>
                <option value="Hindi" className="dark:bg-[#1A221E] dark:text-[#EAE8E3]">हिंदी (Hindi)</option>
                <option value="English" className="dark:bg-[#1A221E] dark:text-[#EAE8E3]">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Backend Connectivity Status & Endpoint Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBackendModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/80 dark:bg-[#1A221E] hover:bg-white dark:hover:bg-[#202B24] border border-stone-200/90 dark:border-[#2C3B30] hover:border-[#284E38] transition-all cursor-pointer shadow-xs text-stone-700 dark:text-stone-300"
            title="Configure FastAPI or check status"
          >
            <Server className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span className="hidden md:inline text-stone-600 dark:text-stone-300">Backend:</span>
            {isBackendConnected ? (
              <span className="flex items-center gap-1 text-[#284E38] dark:text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {getApiBaseUrl().includes('onrender.com') ? 'Render Live' : 'FastAPI Live'}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[#8C6D23] dark:text-[#E6B34A] font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Browser Fallback
              </span>
            )}
            <Settings2 className="w-3 h-3 text-stone-400 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Comprehensive Backend Monitor Modal */}
      <BackendMonitorModal
        isOpen={showBackendModal}
        onClose={() => setShowBackendModal(false)}
        isBackendConnected={isBackendConnected}
        onStatusChange={() => onBackendReconnect()}
      />
    </div>
  );
};
