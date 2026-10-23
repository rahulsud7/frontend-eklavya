import React, { useState, useEffect } from 'react';
import { Compass, Briefcase, GraduationCap, TrendingUp, Sparkles, Building, Layers } from 'lucide-react';
import { CareerMilestone, LanguageMode } from '../../types';
import { getStudyToolsApi } from '../../services/api';

interface CareerMapTabProps {
  userId: string;
  activeSubject: string;
  activeDocId: string | null;
  language: LanguageMode;
}

export const CareerMapTab: React.FC<CareerMapTabProps> = ({
  userId,
  activeSubject,
  activeDocId,
  language
}) => {
  const [careers, setCareers] = useState<CareerMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        if (res.data?.careers) {
          setCareers(res.data.careers);
        }
      } catch {
        // Fallback in API
      } finally {
        setIsLoading(false);
      }
    };
    fetchCareers();
  }, [activeSubject, activeDocId, language]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#8C6D23]/20 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B85C38] mb-1">
          <Compass className="w-4 h-4 text-[#B85C38]" />
          Syllabus-To-Industry Career Pathways
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#284E38]">
          {activeSubject} Academic Concepts & Real-World Indian Jobs
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-3xl leading-relaxed">
          Why study this chapter? Discover how classroom theorems power high-impact Indian technology hubs, space missions, semiconductor fabs, and financial engineering.
        </p>
      </div>

      {isLoading ? (
        <div className="py-16 text-center space-y-3 bg-white/70 backdrop-blur-md rounded-3xl border border-stone-200">
          <Sparkles className="w-8 h-8 text-[#8C6D23] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#284E38]">
            Mapping academic curriculum milestones to real Indian engineering & research careers...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {careers.map(item => (
            <div
              key={item.id}
              className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between"
            >
              <div>
                {/* Academic Concept Tag */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold text-[#8C6D23] bg-[#FCECD4] px-3 py-1 rounded-full border border-[#8C6D23]/20">
                    📚 Concept: {item.academicConcept}
                  </span>
                  <span className="text-xs font-extrabold text-[#284E38] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {item.salaryRange}
                  </span>
                </div>

                {/* Job Title & Industry */}
                <h3 className="text-lg font-extrabold text-[#284E38] mb-1 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#B85C38] shrink-0" />
                  {item.indianJobRole}
                </h3>
                <p className="text-xs font-semibold text-stone-500 mb-4">
                  Industry: {item.industryDomain}
                </p>

                {/* Practical Indian Application */}
                <div className="bg-[#FAF9F5] rounded-2xl p-4 border border-[#8C6D23]/15 mb-4">
                  <h4 className="text-xs font-bold text-[#8C6D23] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    How Indian Engineers Apply This:
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                    {item.practicalApplication}
                  </p>
                </div>

                {/* Employers & Skills */}
                <div className="space-y-3 mb-4">
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                      <Building className="w-3.5 h-3.5 text-[#284E38]" />
                      Leading Organizations in India:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.organizationExamples.map((org, i) => (
                        <span
                          key={i}
                          className="text-xs font-semibold text-[#284E38] bg-white border border-stone-200 px-2.5 py-1 rounded-lg shadow-2xs"
                        >
                          {org}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#8C6D23]" />
                      Key Core Skills:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.keySkills.map((skill, i) => (
                        <span
                          key={i}
                          className="text-xs font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Premier College Pathways */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-[#8C6D23]" />
                  Target Institutions:
                </span>
                <span className="text-xs font-semibold text-[#284E38]">
                  {item.premierColleges.join(' · ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
