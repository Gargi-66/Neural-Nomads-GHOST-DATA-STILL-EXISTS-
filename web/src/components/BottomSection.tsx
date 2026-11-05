import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface BottomSectionProps {
  onOpenSampleCase: () => void;
}

// Authentic brand icons
const PythonIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-stone-700" fill="currentColor">
    <path d="M11.927 0c-3.14 0-5.074 1.378-5.074 3.424v2.53h5.18v.758H4.258C2.184 6.712 0 8.358 0 11.233c0 2.876 1.776 4.394 4.092 4.394h2.15v-2.072c0-2.316 1.95-4.242 4.32-4.242h5.13V6.76c0-2.42-2.128-3.336-3.765-3.336zM9.49 2.05a.86.86 0 1 1 0 1.72.86.86 0 0 1 0-1.72z" />
    <path d="M12.073 24c3.14 0 5.074-1.378 5.074-3.424v-2.53h-5.18v-.758h7.775C21.816 17.288 24 15.642 24 12.767c0-2.876-1.776-4.394-4.092-4.394h-2.15v2.072c0 2.316-1.95 4.242-4.32 4.242H8.308v2.552c0 2.42 2.128 3.336 3.765 3.336zM14.51 21.95a.86.86 0 1 1 0-1.72.86.86 0 0 1 0 1.72z" />
  </svg>
);

const FastApiIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const DuckDbIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);

const NetworkXIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const LlmIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-stone-700" fill="currentColor">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.259 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7466-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.5045 4.5045 0 0 1-4.4945 4.4947zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3428 7.897a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1683a.0757.0757 0 0 1-.071 0l-4.8303-2.7866A4.504 4.504 0 0 1 2.3428 7.897zm16.5991 3.8558L13.1038 8.384 15.1192 7.22a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6726a.79.79 0 0 0-.4022-.6899zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2312V6.8988a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.6602zm-12.641 4.135l-2.02-1.1636a.0804.0804 0 0 1-.038-.0568V6.074a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.6069 1.4997-2.602-1.4997z" />
  </svg>
);

const ReactIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" strokeWidth="1.5">
    <ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" stroke="currentColor" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" stroke="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

export const BottomSection: React.FC<BottomSectionProps> = ({ onOpenSampleCase }) => {
  const stack = [
    { name: 'Python', role: 'Core engine', icon: PythonIcon },
    { name: 'FastAPI', role: 'API service', icon: FastApiIcon },
    { name: 'DuckDB', role: 'Data engine', icon: DuckDbIcon },
    { name: 'NetworkX', role: 'DAG sorting', icon: NetworkXIcon },
    { name: 'LLM', role: 'Agent tool', icon: LlmIcon },
    { name: 'React', role: 'UI console', icon: ReactIcon },
  ];

  return (
    <section className="relative pt-4 sm:pt-6 pb-0 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        
        {/* Two-column split row: Tech Stack on Left, Live Investigation on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
          
          {/* Left Column: Tech Stack */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                Tech Stack
              </h3>
              <span className="text-[10px] font-mono text-stone-500">
                Deterministic &bull; Zero Hallucination
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2 items-center">
              {stack.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex flex-col items-center text-center group cursor-default">
                    <div className="w-8 h-8 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105">
                      <Icon />
                    </div>
                    <span className="text-[11px] font-bold text-stone-800 leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[9px] text-stone-500 mt-0.5 leading-tight">
                      {item.role}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Explore a Live Investigation Card (Exact match to Screenshot 2 & 4) */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center justify-between relative overflow-hidden">
            
            {/* Text & Button */}
            <div className="max-w-[270px] sm:max-w-xs z-10">
              <div className="flex items-center gap-1.5 text-[#EA580C] text-xs font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-mono tracking-wider">Interactive Walkthrough</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-snug mb-1">
                Explore a Live Investigation
              </h3>
              <p className="text-[11px] text-stone-600 leading-relaxed mb-3.5">
                Walk through a real case, inspect physical evidence, and understand the verified decision.
              </p>
              <button
                onClick={onOpenSampleCase}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>Try a Sample Case</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </button>
            </div>

            {/* Cute Ghost with Lantern Graphic on Right: Perfectly proportioned and seamless */}
            <div className="relative flex items-end justify-center shrink-0 select-none pointer-events-none">
              <div className="relative animate-float-slow">
                <img
                  src="/ghost-lantern-final.png"
                  alt="Cute Ghost holding lantern"
                  className="w-24 sm:w-28 h-auto object-contain select-none pointer-events-none"
                />
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Atmospheric Twilight Landscape Panorama spanning the bottom, overlapping with the section above */}
      <div className="relative w-full overflow-hidden -mt-10 sm:-mt-16 lg:-mt-24 pointer-events-none select-none z-10 flex justify-center">
        <img
          src="/footer-landscape-panorama.jpg"
          alt="Atmospheric Twilight Halloween Landscape with Castle"
          className="w-full max-w-7xl h-auto object-contain object-bottom mix-blend-multiply"
        />
      </div>

    </section>
  );
};
