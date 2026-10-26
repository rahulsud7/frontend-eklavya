import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Sparkles,
  Building,
  Layers,
  CheckCircle2,
  ChevronRight,
  Target,
  ArrowRight,
  BookOpen,
  Award,
  Search,
  Filter,
  X,
  Flame,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CareerMilestone, LanguageMode } from '../../types';
import { getStudyToolsApi, generateCustomCareerRoadmapApi } from '../../services/api';
import { CAREER_ROADMAPS } from '../../data/curriculumData';

interface CareerMapTabProps {
  userId: string;
  activeSubject: string;
  activeDocId: string | null;
  language: LanguageMode;
  onGrantXp?: (amount: number) => void;
  onNavigateToTab?: (tab: string) => void;
}

const MILESTONES_STORAGE_KEY = 'eklavya_career_milestones';

export const CareerMapTab: React.FC<CareerMapTabProps> = ({
  userId,
  activeSubject,
  activeDocId,
  language,
  onGrantXp,
  onNavigateToTab
}) => {
  const [careers, setCareers] = useState<CareerMilestone[]>(CAREER_ROADMAPS);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCareerDetail, setActiveCareerDetail] = useState<CareerMilestone | null>(null);

  // Custom AI Roadmap Generator State
  const [showGeneratorModal, setShowGeneratorModal] = useState<boolean>(false);
  const [dreamRoleInput, setDreamRoleInput] = useState<string>('');
  const [gradeInput, setGradeInput] = useState<string>('Class 10');
  const [targetExamInput, setTargetExamInput] = useState<string>('JEE Advanced');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Completed Milestones state stored in local storage
  const [completedMilestones, setCompletedMilestones] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(MILESTONES_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return {
      'Class 10 Trigonometry': true,
      'Score 95%+ in Class 10 Math & Science': true
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(completedMilestones));
    }
  }, [completedMilestones]);

  const toggleMilestone = (key: string) => {
    setCompletedMilestones(prev => {
      const nextVal = !prev[key];
      if (nextVal) {
        if (onGrantXp) onGrantXp(25);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
      return { ...prev, [key]: nextVal };
    });
  };

  useEffect(() => {
    const fetchCareers = async () => {
      setIsLoading(true);
      try {
        const res = await getStudyToolsApi({
          user_id: userId,
          subject: activeSubject,
          doc_id: activeDocId,
          tool_type: 'career',
          language: language
        });
        if (res.data?.careers && res.data.careers.length > 0) {
          // Merge with canonical rich roadmaps to preserve full roadmapSteps
          const merged = res.data.careers.map((c: CareerMilestone) => {
            const canon = CAREER_ROADMAPS.find(cr => cr.id === c.id || cr.indianJobRole.toLowerCase() === c.indianJobRole.toLowerCase());
            return {
              ...c,
              domainTrack: c.domainTrack || canon?.domainTrack || 'General Tech',
              targetExams: c.targetExams || canon?.targetExams || ['National Competitive Exams'],
              ncertChapters: c.ncertChapters || canon?.ncertChapters || ['NCERT Core Chapters'],
              roadmapSteps: c.roadmapSteps || canon?.roadmapSteps
            };
          });
          setCareers(merged);
        }
      } catch {
        setCareers(CAREER_ROADMAPS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCareers();
  }, [activeSubject, activeDocId, language, userId]);

  // Handle AI Roadmap Generation
  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dreamRoleInput.trim()) return;

    setIsGenerating(true);
    try {
      const generated = await generateCustomCareerRoadmapApi({
        dreamCareer: dreamRoleInput.trim(),
        currentGrade: gradeInput,
        targetExam: targetExamInput,
        subject: activeSubject
      });

      setCareers(prev => [generated, ...prev]);
      setActiveCareerDetail(generated);
      setShowGeneratorModal(false);
      setDreamRoleInput('');
      if (onGrantXp) onGrantXp(50);
      confetti({ particleCount: 75, spread: 70 });
    } catch {
      // Fallback
    } finally {
      setIsGenerating(false);
    }
  };

  // Distinct domain tracks
  const domains = useMemo(() => {
    const set = new Set<string>();
    set.add('All');
    careers.forEach(c => {
      if (c.domainTrack) set.add(c.domainTrack);
    });
    return Array.from(set);
  }, [careers]);

  // Filtered careers
  const filteredCareers = careers.filter(c => {
    const matchesDomain = selectedDomain === 'All' || c.domainTrack === selectedDomain;
    const matchesSearch =
      c.indianJobRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.academicConcept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industryDomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.organizationExamples.some(o => o.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDomain && matchesSearch;
  });

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header Banner & Custom AI Roadmap Trigger */}
      <div className="bg-gradient-to-br from-[#FAF9F5] via-white to-[#FDF4EE] rounded-3xl p-6 sm:p-8 border border-[#8C6D23]/30 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#B85C38] bg-[#FCECD4] px-3 py-1 rounded-full border border-[#8C6D23]/20">
              <Compass className="w-3.5 h-3.5" />
              <span>National Academic-To-Industry Career Pathways</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#284E38]">
              {activeSubject} Academic Foundations & High-Impact Indian Careers
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
              Why study today's textbook theorems? Explore how classroom formulas translate into Indian space launches at ISRO, semiconductor fabs, AI foundation models, and quantitative finance.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setShowGeneratorModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>✨ Generate Custom AI Roadmap</span>
            </button>
          </div>
        </div>

        {/* 4-Stage National Pipeline Milestone Banner */}
        <div className="mt-6 pt-5 border-t border-stone-200/80">
          <span className="text-[11px] font-black uppercase tracking-wider text-stone-500 block mb-3">
            The 4-Stage Indian Scholar Trajectory
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                stage: 'Stage 1',
                name: 'Class 9-10 Foundations',
                desc: 'NCERT Exemplar Mastery, NTSE & National Olympiads',
                color: 'border-amber-200 bg-amber-50/70 text-[#8C6D23]'
              },
              {
                stage: 'Stage 2',
                name: 'Competitive Exam Sprint',
                desc: 'CBSE 95%+, JEE Advanced, NEET-UG, CUET, CLAT',
                color: 'border-orange-200 bg-orange-50/70 text-[#B85C38]'
              },
              {
                stage: 'Stage 3',
                name: 'Premier Institutions',
                desc: 'IITs, AIIMS New Delhi, IISc Bengaluru, NLUs',
                color: 'border-emerald-200 bg-emerald-50/70 text-[#284E38]'
              },
              {
                stage: 'Stage 4',
                name: 'National Leadership',
                desc: 'ISRO Missions, Semiconductor Fabs, AI Labs & Quants',
                color: 'border-indigo-200 bg-indigo-50/70 text-indigo-900'
              }
            ].map(item => (
              <div
                key={item.stage}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between ${item.color}`}
              >
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider opacity-75">
                    {item.stage}
                  </div>
                  <div className="text-xs font-bold mt-0.5">{item.name}</div>
                </div>
                <div className="text-[11px] opacity-80 mt-1 font-medium">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Search & Domain Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
          {domains.map(dom => (
            <button
              key={dom}
              type="button"
              onClick={() => setSelectedDomain(dom)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                selectedDomain === dom
                  ? 'bg-[#284E38] text-white shadow-2xs'
                  : 'bg-white/80 text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {dom}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search roles, skills, companies..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#284E38]"
          />
        </div>
      </div>

      {/* 3. Career Cards Grid */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3 bg-white/70 backdrop-blur-md rounded-3xl border border-stone-200">
          <Sparkles className="w-8 h-8 text-[#8C6D23] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#284E38]">
            Mapping academic curriculum milestones to real Indian engineering & research careers...
          </p>
        </div>
      ) : filteredCareers.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white/70 backdrop-blur-md rounded-3xl border border-stone-200">
          <p className="text-sm font-bold text-stone-700">No career roadmaps matching the filter.</p>
          <button
            type="button"
            onClick={() => { setSelectedDomain('All'); setSearchQuery(''); }}
            className="px-4 py-2 rounded-xl bg-[#284E38] text-white text-xs font-bold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCareers.map(item => (
            <div
              key={item.id}
              className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-sm hover:shadow-xl transition-all text-left flex flex-col justify-between group"
            >
              <div>
                {/* Concept Tag + Salary Range */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold text-[#8C6D23] bg-[#FCECD4] px-3 py-1 rounded-full border border-[#8C6D23]/20">
                    📚 Concept: {item.academicConcept}
                  </span>
                  <span className="text-xs font-black text-[#284E38] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {item.salaryRange}
                  </span>
                </div>

                {/* Job Role Title */}
                <h3 className="text-lg sm:text-xl font-black text-[#284E38] mb-1 flex items-center gap-2 group-hover:text-[#1E3B2A]">
                  <Briefcase className="w-5 h-5 text-[#B85C38] shrink-0" />
                  <span>{item.indianJobRole}</span>
                </h3>

                <p className="text-xs font-bold text-stone-500 mb-3 flex items-center gap-1.5">
                  <span>Industry: <strong>{item.industryDomain}</strong></span>
                  {item.domainTrack && (
                    <>
                      <span className="text-stone-300">·</span>
                      <span className="text-[#8C6D23] font-bold">{item.domainTrack}</span>
                    </>
                  )}
                </p>

                {/* Practical Indian Application */}
                <div className="bg-[#FAF9F5] rounded-2xl p-4 border border-[#8C6D23]/15 mb-4 space-y-1">
                  <h4 className="text-[11px] font-black text-[#8C6D23] uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Real Indian Engineering Application:</span>
                  </h4>
                  <p className="text-xs text-stone-700 leading-relaxed font-medium">
                    {item.practicalApplication}
                  </p>
                </div>

                {/* Target Entrance Exams & Leading Indian Employers */}
                <div className="space-y-3 mb-4">
                  {item.targetExams && item.targetExams.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                        Target Entrance Exams:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.targetExams.map((exam, i) => (
                          <span
                            key={i}
                            className="text-xs font-extrabold text-[#B85C38] bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-lg"
                          >
                            🎯 {exam}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                      Premier Indian Organizations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.organizationExamples.map((org, i) => (
                        <span
                          key={i}
                          className="text-xs font-bold text-[#284E38] bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-lg"
                        >
                          {org}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer: Premier Institutions + Deep-dive Roadmap Button */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3 text-xs">
                <div className="flex-1 truncate">
                  <span className="text-[10px] font-bold text-stone-400 block">
                    Target Institutes:
                  </span>
                  <span className="text-xs font-bold text-[#284E38] truncate block">
                    {item.premierColleges.slice(0, 2).join(' · ')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveCareerDetail(item)}
                  className="px-3.5 py-2 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
                >
                  <span>View 4-Stage Roadmap</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. EXPANSIVE CAREER DETAIL MODAL (Full 4-Stage Timeline) */}
      {activeCareerDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-stone-200 shadow-2xl overflow-hidden text-left">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#FAF9F5] via-white to-[#FCECD4]/30 border-b border-stone-200 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[#8C6D23] bg-[#FCECD4] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {activeCareerDetail.academicConcept}
                  </span>
                  <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {activeCareerDetail.salaryRange}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#284E38]">
                  {activeCareerDetail.indianJobRole}
                </h3>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  Industry: {activeCareerDetail.industryDomain} · Organizations: {activeCareerDetail.organizationExamples.join(', ')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveCareerDetail(null)}
                className="p-1.5 rounded-xl hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Practical Indian Engineering Application */}
              <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#8C6D23]/20">
                <h4 className="text-xs font-bold text-[#8C6D23] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#B85C38]" />
                  <span>Real-World Indian Engineering Application</span>
                </h4>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                  {activeCareerDetail.practicalApplication}
                </p>
              </div>

              {/* Target Exams & Mapped NCERT Chapters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#B85C38] block mb-2">
                    🎯 Target Entrance Examinations
                  </span>
                  <div className="space-y-1">
                    {(activeCareerDetail.targetExams || ['JEE Advanced', 'GATE / National Exam']).map((ex, i) => (
                      <div key={i} className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-[#B85C38]" />
                        <span>{ex}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#284E38] block mb-2">
                    📖 Key NCERT Chapters to Master
                  </span>
                  <div className="space-y-1">
                    {(activeCareerDetail.ncertChapters || ['Class 10 Trigonometry', 'Class 11 Vectors', 'Class 12 Advanced Calculus']).map((ch, i) => (
                      <div key={i} className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-[#284E38]" />
                        <span>{ch}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4-Stage Chronological Roadmap Timeline */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase tracking-wider text-[#284E38] flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-[#8C6D23]" />
                    <span>Comprehensive 4-Stage Milestone Journey</span>
                  </h4>
                  <span className="text-xs font-bold text-stone-400">
                    Tap any milestone to track progress (+25 XP)
                  </span>
                </div>

                <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                  {(activeCareerDetail.roadmapSteps || []).map((step, idx) => (
                    <div key={step.step} className="relative pl-10">
                      <div className="absolute left-2 top-1.5 w-5 h-5 rounded-full bg-[#284E38] text-white text-[10px] font-black flex items-center justify-center -translate-x-1/2 shadow-xs">
                        {step.step}
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-[10px] font-black uppercase text-[#B85C38] tracking-wider">
                            {step.stageName} · <strong className="text-stone-500">{step.timeframe}</strong>
                          </span>
                        </div>

                        <h5 className="text-sm font-bold text-[#1E2922]">
                          {step.title}
                        </h5>

                        <p className="text-xs text-stone-600 leading-relaxed font-medium">
                          {step.description}
                        </p>

                        {/* Interactive Milestone Checkpoints */}
                        {step.keyMilestones && step.keyMilestones.length > 0 && (
                          <div className="pt-2 mt-2 border-t border-stone-100 space-y-1.5">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                              Actionable Checkpoints:
                            </span>
                            {step.keyMilestones.map((ms, mIdx) => {
                              const isChecked = Boolean(completedMilestones[ms]);
                              return (
                                <button
                                  key={mIdx}
                                  type="button"
                                  onClick={() => toggleMilestone(ms)}
                                  className={`w-full text-left p-2 rounded-xl border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                                    isChecked
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                                        isChecked
                                          ? 'bg-emerald-600 border-emerald-600 text-white'
                                          : 'border-stone-300 bg-white'
                                      }`}
                                    >
                                      {isChecked && <Check className="w-3 h-3" />}
                                    </span>
                                    <span className={isChecked ? 'line-through text-stone-400' : ''}>
                                      {ms}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-bold text-[#8C6D23]">
                                    {isChecked ? 'Achieved (+25 XP)' : '+25 XP'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500">
                Targeting Premier Institutes: <strong>{activeCareerDetail.premierColleges.join(', ')}</strong>
              </span>

              <button
                type="button"
                onClick={() => setActiveCareerDetail(null)}
                className="px-4 py-2 rounded-xl bg-[#284E38] text-white text-xs font-bold hover:bg-[#1E3B2A] transition-colors cursor-pointer"
              >
                Done Exploring
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ✨ CUSTOM AI CAREER ROADMAP GENERATOR MODAL */}
      {showGeneratorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-stone-200 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#8C6D23]" />
                <h3 className="text-base font-bold text-[#284E38]">
                  Generate Custom AI Career Roadmap
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGeneratorModal(false)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Enter your dream role or research aspiration. Our pedagogical engine analyzes the Indian academic landscape to formulate a personalized 4-stage roadmap with entrance exam cutoffs, NCERT chapters, and premier Indian institutions.
            </p>

            <form onSubmit={handleGenerateRoadmap} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  What is your dream Indian or global career?
                </label>
                <input
                  type="text"
                  value={dreamRoleInput}
                  onChange={e => setDreamRoleInput(e.target.value)}
                  placeholder="e.g. Spacecraft Propulsion Engineer at ISRO, AI Cancer Researcher, Quant Trader"
                  className="w-full text-xs rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#284E38]"
                  required
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                  Popular Student Aspirations:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'ISRO Flight Dynamics Specialist',
                    'Generative AI Research Scientist',
                    'Semiconductor VLSI Designer',
                    'Neurosurgeon at AIIMS New Delhi',
                    'High Frequency Quant Strategist',
                    'Constitutional Supreme Court Advocate'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDreamRoleInput(preset)}
                      className="text-[11px] font-medium bg-stone-100 hover:bg-amber-50 hover:text-[#8C6D23] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Current Grade
                  </label>
                  <select
                    value={gradeInput}
                    onChange={e => setGradeInput(e.target.value)}
                    className="w-full text-xs rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#284E38]"
                  >
                    <option value="Class 9">Class 9 (Early Foundation)</option>
                    <option value="Class 10">Class 10 (Board Target)</option>
                    <option value="Class 11">Class 11 (Competitive Target)</option>
                    <option value="Class 12">Class 12 (Exam Year)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Target Examination
                  </label>
                  <select
                    value={targetExamInput}
                    onChange={e => setTargetExamInput(e.target.value)}
                    className="w-full text-xs rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#284E38]"
                  >
                    <option value="JEE Advanced">JEE Advanced (IITs / IIST)</option>
                    <option value="NEET-UG">NEET-UG (AIIMS / Medical)</option>
                    <option value="CUET-UG">CUET (Central Universities)</option>
                    <option value="CLAT">CLAT (National Law Universities)</option>
                    <option value="IAT / NEST">IAT / NEST (IISc / IISERs)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGeneratorModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !dreamRoleInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#284E38] hover:bg-[#1E3B2A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Formulating Pipeline...' : 'Generate Roadmap (+50 XP)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
