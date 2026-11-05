import React from 'react';
import { Database, Fingerprint, GitBranch, FileEdit, CheckCircle2, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      title: 'Ingest & Normalize',
      desc: 'Collect and unify evidence across all 94 evidence artifacts.',
      icon: Database,
    },
    {
      title: 'Resolve Identity',
      desc: 'Recover historical aliases and SHA-256 email hashes.',
      icon: Fingerprint,
    },
    {
      title: 'Analyze & Trace',
      desc: 'Map DAG data lineage and active resuscitation paths.',
      icon: GitBranch,
    },
    {
      title: 'Apply Policy',
      desc: 'Determine delete, redact, anonymize, or statutory retention.',
      icon: FileEdit,
    },
    {
      title: 'Simulate & Verify',
      desc: 'Enforce prerequisite action ordering and final state proof.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="how-it-works" className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          How AEGIS Works
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 font-normal mt-1">
          A multi-stage, evidence-grounded investigation that turns a deletion request into a verified outcome.
        </p>
      </div>

      {/* 5-Step Pipeline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="relative group">
              <div className="h-full bg-white rounded-2xl p-5 border border-stone-200/90 hover:border-stone-300 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 flex flex-col justify-between">
                
                {/* Icon */}
                <div>
                  <div className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-200/60 text-stone-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4 stroke-[1.75]" />
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-sm font-bold text-stone-900 mb-1.5 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

              </div>

              {/* Connecting Desktop Arrow */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-stone-300 pointer-events-none">
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
