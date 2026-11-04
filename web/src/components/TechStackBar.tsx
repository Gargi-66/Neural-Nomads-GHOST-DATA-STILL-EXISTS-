import React from 'react';
import { Layers, Terminal, Zap, Database, Share2, Bot, Atom } from 'lucide-react';

export const TechStackBar: React.FC = () => {
  const stack = [
    {
      name: 'Python',
      role: 'Core Engine',
      icon: Terminal,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      name: 'FastAPI',
      role: 'APIs & Services',
      icon: Zap,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      name: 'DuckDB / SQLite',
      role: 'Data Processing',
      icon: Database,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      name: 'NetworkX',
      role: 'Graph Analysis',
      icon: Share2,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      name: 'LLM (Tool-calling)',
      role: 'Investigation Agent',
      icon: Bot,
      color: 'text-[#E05822]',
      bg: 'bg-orange-50',
    },
    {
      name: 'React',
      role: 'User Interface',
      icon: Atom,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
    },
  ];

  return (
    <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-[#EFE5DB] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Label */}
        <div className="flex items-center gap-2.5 shrink-0 px-2">
          <div className="w-8 h-8 rounded-lg bg-[#FFF2EB] text-[#E05822] flex items-center justify-center">
            <Layers className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-sm font-extrabold text-[#191D24]">Tech Stack</span>
        </div>

        {/* Stack Items Grid / Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full">
          {stack.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-[#FAF6F2] hover:bg-white border border-[#EDE2D6] hover:border-orange-200 transition-all shadow-2xs"
              >
                <div className={`w-7 h-7 rounded-lg ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#1E232A] truncate leading-tight">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-[#717A88] truncate font-medium">
                    {item.role}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

