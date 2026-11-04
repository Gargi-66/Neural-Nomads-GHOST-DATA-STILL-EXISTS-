import React from 'react';
import { ArrowRight, Play } from 'lucide-react';

interface HeroProps {
  onStartInvestigation: () => void;
  onSeeHowItWorks: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartInvestigation, onSeeHowItWorks }) => {
  return (
    <section id="hero" className="relative pt-12 pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
          
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFEAE0] border border-[#FCD2BF] shadow-xs">
              <span className="text-base" role="img" aria-label="ghost">👻</span>
              <span className="text-xs font-bold text-[#D94E1B]">
                Ghost Data Still Exists
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-[68px] font-black text-[#191D24] tracking-tight leading-[1.08]">
              Verify, Trace, and <br />
              Truly <span className="text-[#E05822]">Delete.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#525B69] max-w-xl leading-relaxed font-normal">
              An AI-powered deletion audit platform that investigates residual data, verifies policy compliance, and ensures that deletion is truly complete across all systems.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onStartInvestigation}
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#E05822] hover:bg-[#C94715] text-white text-base font-bold shadow-lg shadow-orange-500/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Start an Investigation</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={onSeeHowItWorks}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-white hover:bg-[#FFF5EE] text-[#1E232A] border border-[#E7D6C7] text-base font-bold shadow-xs hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <span>See How It Works</span>
                <div className="w-4 h-4 flex items-center justify-center text-[#E05822]">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </div>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual Graphic using exact uploaded illustration */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            <div className="relative w-full max-w-[500px] flex items-center justify-center animate-float-slow">
              <img
                src="/hero-ghost-illustration.jpg"
                alt="AEGIS Deletion Request Investigation Ghost Illustration"
                className="w-full h-auto object-contain rounded-3xl drop-shadow-md select-none pointer-events-none"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
