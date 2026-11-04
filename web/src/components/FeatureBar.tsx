import React from 'react';
import { Search, GitBranch, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const FeatureBar: React.FC = () => {
  const features = [
    {
      title: 'Find Residual Data',
      desc: 'Detect remaining traces across all data sources.',
      icon: Search,
    },
    {
      title: 'Trace Data Lineage',
      desc: 'Understand how data moves and can reappear.',
      icon: GitBranch,
    },
    {
      title: 'Apply Policy',
      desc: 'Determine the right treatment (delete, redact, anonymize, retain).',
      icon: ShieldCheck,
    },
    {
      title: 'Verify Deletion',
      desc: 'Confirm completion with evidence and audit trails.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="py-6 border-y border-[#EFE5DB] bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative bg-white hover:bg-[#FFFDFB] rounded-2xl p-5 border border-[#EFE3D8] hover:border-[#E8C2AF] shadow-xs hover:shadow-md transition-all duration-200 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FFF0E7] text-[#E05822] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="flex flex-col space-y-1">
                  <h3 className="text-sm font-bold text-[#1E232A] leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#636C78] leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
