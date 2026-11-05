import React from 'react';
import { ArrowRight, Play, Sparkles, Ghost, ShieldAlert } from 'lucide-react';

interface HeroProps {
  onStartInvestigation: () => void;
  onSeeHowItWorks: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartInvestigation, onSeeHowItWorks }) => {
  return (
    <section id="hero" className="relative pt-6 sm:pt-8 pb-8 sm:pb-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-6 flex flex-col items-start space-y-4.5">
            
            {/* Minimalist Aesthetic Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 shadow-2xs">
              <span className="text-xs" role="img" aria-label="ghost">👻</span>
              <span className="text-[11px] font-semibold tracking-wide uppercase">
                Ghost Data Still Exists &bull; Deletion-Audit
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] xl:text-[50px] font-extrabold text-stone-900 tracking-tight leading-[1.14]">
              Verify, Trace, and <br />
              Truly <span className="text-[#EA580C]">Exorcise</span> Residual Data.
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl font-normal">
              When a company claims account deletion is <strong className="text-stone-900 font-semibold">Complete</strong>, personal data still haunts read replicas, cold backups, sync crons, and unrotated logs. AEGIS establishes ground truth at audit cutoff and restores total compliance.
            </p>

            {/* Minimalist Metric Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <Ghost className="w-3.5 h-3.5 text-[#EA580C]" />
                <span><strong className="text-stone-900">518</strong> Evaluation Cases</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span><strong className="text-stone-900">323</strong> Incomplete Identified</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span><strong className="text-stone-900">0</strong> Cutoff Leakage</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onStartInvestigation}
                className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>Explore 518 Cases</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={onSeeHowItWorks}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 hover:text-stone-900 text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-sm transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>See How It Works</span>
                <Play className="w-3 h-3 text-[#EA580C] fill-current ml-0.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual Graphic (Bigger & More Prominent Space) */}
          <div className="lg:col-span-6 relative flex justify-center items-center">
            <div className="relative w-full max-w-[560px] xl:max-w-[600px] flex items-center justify-center animate-ghost-float select-none group">
              <img
                src="/hero-ghost-illustration.jpg"
                alt="AEGIS Deletion Request Investigation Ghost Illustration"
                className="w-full h-auto object-contain rounded-3xl mix-blend-multiply border-0 pointer-events-none transition-transform duration-500 group-hover:scale-[1.02]"
              />

              {/* Minimalist Speech Bubble */}
              <div className="absolute -top-3 -right-1 sm:right-2 px-3.5 py-1.5 rounded-full bg-white text-stone-800 text-[11px] font-mono font-medium shadow-[0_2px_12px_rgba(0,0,0,0.07)] border border-stone-200 select-none pointer-events-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                <span>Residual row caught &bull; 👻</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
