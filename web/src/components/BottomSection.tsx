import React from 'react';
import { Terminal, Zap, Database, Share2, Bot, Atom, ArrowRight } from 'lucide-react';

interface BottomSectionProps {
  onOpenSampleCase: () => void;
}

export const BottomSection: React.FC<BottomSectionProps> = ({ onOpenSampleCase }) => {
  const stack = [
    { name: 'Python', role: 'Core engine', icon: Terminal },
    { name: 'FastAPI', role: 'API & services', icon: Zap },
    { name: 'DuckDB', role: 'Data processing', icon: Database },
    { name: 'NetworkX', role: 'Graph analysis', icon: Share2 },
    { name: 'LLM', role: 'Investigation agent', icon: Bot },
    { name: 'React', role: 'User interface', icon: Atom },
  ];

  return (
    <section className="relative pt-6 pb-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        
        {/* Two-column split row: Tech Stack on Left, Live Investigation on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Tech Stack */}
          <div className="lg:col-span-6 bg-white/80 rounded-3xl p-6 border border-[#EFE5DB] shadow-xs flex flex-col justify-between">
            <h3 className="text-base font-extrabold text-[#191D24] mb-4">
              Tech Stack
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {stack.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex flex-col items-center text-center p-2 rounded-xl hover:bg-[#FFF6F0] transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF5EF] text-[#2C333E] flex items-center justify-center mb-2">
                      <Icon className="w-4 h-4 text-slate-700" />
                    </div>
                    <span className="text-xs font-bold text-[#1E232A] leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-[#717A88] mt-0.5 leading-tight">
                      {item.role}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Explore a Live Investigation Card */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#EFE5DB] shadow-xs flex items-center justify-between relative overflow-hidden">
            
            {/* Text & Button */}
            <div className="max-w-[280px] sm:max-w-xs z-10">
              <h3 className="text-lg font-black text-[#191D24] mb-1.5">
                Explore a Live Investigation
              </h3>
              <p className="text-xs text-[#525B69] leading-relaxed mb-4">
                Walk through a real case, see the evidence, and understand the decision.
              </p>
              <button
                onClick={onOpenSampleCase}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E05822] hover:bg-[#C94715] text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Try a Sample Case</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Ghost with Lantern Graphic on Right */}
            <div className="relative flex items-end justify-center shrink-0">
              <div className="relative animate-float-slow">
                <img
                  src="/bottom-ghost-lantern.jpg"
                  alt="Ghost holding lantern"
                  className="w-24 sm:w-28 h-auto object-contain rounded-2xl select-none pointer-events-none drop-shadow-xs"
                />
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Atmospheric Twilight Landscape at the bottom */}
      <div className="relative w-full h-48 -mt-8 pointer-events-none select-none">
        
        {/* Flying bats */}
        <div className="absolute top-4 left-1/4 text-slate-800 text-xs animate-float">🦇</div>
        <div className="absolute top-10 left-1/3 text-slate-800 text-xs animate-float-slow">🦇</div>

        {/* Haunted Castle on the left */}
        <svg className="absolute bottom-0 left-6 sm:left-12 w-48 sm:w-60 text-[#30233D] fill-current" viewBox="0 0 300 200">
          <path d="M 0 160 Q 80 140 180 170 L 180 200 L 0 200 Z" opacity="0.9" />
          <rect x="40" y="80" width="70" height="80" />
          <rect x="65" y="45" width="25" height="40" />
          <polygon points="65,45 77,15 90,45" />
          <line x1="77" y1="15" x2="77" y2="5" stroke="#30233D" strokeWidth="2" />
          <polygon points="35,80 75,55 115,80" />
          <rect x="52" y="95" width="10" height="15" rx="3" fill="#FDE047" opacity="0.8" />
          <rect x="88" y="95" width="10" height="15" rx="3" fill="#FDE047" opacity="0.8" />
          <path d="M 125 170 L 130 110 M 130 140 L 145 125 M 130 130 L 120 115" stroke="#30233D" strokeWidth="2.5" strokeLinecap="round" />
        </svg>

        {/* Rolling ground hill at the very bottom */}
        <svg className="absolute bottom-0 left-0 w-full text-[#241830] fill-current" viewBox="0 0 1200 80" preserveAspectRatio="none">
          <path d="M 0 40 Q 300 10 600 40 T 1200 30 L 1200 80 L 0 80 Z" />
        </svg>
      </div>

    </section>
  );
};
