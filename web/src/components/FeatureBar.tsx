import React from 'react';
import { Search, GitBranch, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const FeatureBar: React.FC = () => {
  const features = [
    {
      title: 'Find Residual Data',
      desc: 'Detect remaining rows across 94 evidence artifacts.',
      icon: Search,
    },
    {
      title: 'Trace Data Lineage',
      desc: 'Analyze DAG dependencies and recreation paths.',
      icon: GitBranch,
    },
    {
      title: 'Apply Policy Rules',
      desc: 'Compile statutory retention, redaction & tombstones.',
      icon: ShieldCheck,
    },
    {
      title: 'Verify Deletion',
      desc: 'Enforce prerequisite ordering before record purging.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="py-3 sm:py-4 border-y border-stone-200/80 bg-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative bg-white hover:bg-stone-50 rounded-2xl p-3.5 border border-stone-200 shadow-2xs hover:shadow-xs transition-all duration-200 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="w-4 h-4 stroke-[1.75]" />
                </div>
                <div className="flex flex-col space-y-0.5">
                  <h3 className="text-xs font-bold text-stone-900 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-stone-500 leading-normal font-normal">
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
