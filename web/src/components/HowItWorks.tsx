import React from 'react';
import { Database, Fingerprint, GitBranch, FileEdit, CheckCircle2, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      title: 'Ingest & Normalize',
      desc: 'Collect and unify evidence from all sources.',
      icon: Database,
    },
    {
      title: 'Resolve Identity',
      desc: 'Link current and historical identifiers.',
      icon: Fingerprint,
    },
    {
      title: 'Analyze & Trace',
      desc: 'Map data lineage and recreation paths.',
      icon: GitBranch,
    },
    {
      title: 'Apply Policy',
      desc: 'Determine delete, redact, anonymize or retain.',
      icon: FileEdit,
    },
    {
      title: 'Simulate & Verify',
      desc: 'Test the plan and confirm complete deletion.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="how-it-works" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-[#191D24] tracking-tight">
          How AEGIS Works
        </h2>
        <p className="text-sm sm:text-base text-[#626C7A] font-normal mt-1">
          A multi-stage, AI-powered investigation that turns a deletion request into a verified outcome.
        </p>
      </div>

      {/* 5-Step Pipeline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="relative group">
              <div className="h-full bg-white rounded-2xl p-5 border border-[#EFE3D8] hover:border-[#E8C2AF] shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                
                {/* Icon */}
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#FFF6F0] text-[#E05822] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-sm font-bold text-[#1E232A] mb-2 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#636C78] leading-relaxed">
                    {item.desc}
                  </p>
                </div>

              </div>

              {/* Connecting Desktop Arrow */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-[#CBD5E1] pointer-events-none">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
