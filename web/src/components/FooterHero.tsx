import React from 'react';
import { ArrowRight } from 'lucide-react';

interface FooterHeroProps {
  onStartSample: () => void;
}

export const FooterHero: React.FC<FooterHeroProps> = ({ onStartSample }) => {
  return (
    <footer id="docs" className="relative pt-20 overflow-hidden bg-gradient-to-b from-[#FBF8F5] via-[#EEDACE] to-[#2D1F38] text-white">
      
      {/* Upper CTA Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-20 pb-16">
        
        <h2 className="text-3xl sm:text-5xl font-black text-[#191D24] tracking-tight leading-tight mb-4">
          Ready to Investigate <br className="hidden sm:inline" />
          Your Data?
        </h2>
        
        <p className="text-base sm:text-lg text-[#555E6B] max-w-xl mx-auto mb-8 font-normal">
          Go beyond a &quot;deleted&quot; label. Get evidence, trace lineage, and ensure true deletion with AEGIS.
        </p>

        <div>
          <button
            onClick={onStartSample}
            className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#E05822] hover:bg-[#C94715] text-white text-base font-bold shadow-xl shadow-orange-600/30 hover:shadow-orange-600/50 transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0"
          >
            <span>Start a Sample Investigation</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Atmospheric Twilight Landscape Illustration */}
      <div className="relative w-full h-80 sm:h-96 overflow-hidden pointer-events-none select-none">
        
        {/* Glowing Full Moon */}
        <div className="absolute top-10 left-1/3 sm:left-1/4 w-32 h-32 rounded-full bg-gradient-to-tr from-[#FFEBD4] to-[#FFF8F0] shadow-[0_0_80px_rgba(255,235,200,0.6)] opacity-90"></div>

        {/* Flying Bats */}
        <div className="absolute top-12 left-1/2 text-slate-800 text-xs sm:text-sm -rotate-12 animate-float">🦇</div>
        <div className="absolute top-20 left-1/3 text-slate-800 text-sm rotate-12 animate-float-slow" style={{ animationDelay: '1.2s' }}>🦇</div>
        <div className="absolute top-16 right-1/3 text-slate-800 text-xs rotate-6 animate-float" style={{ animationDelay: '0.8s' }}>🦇</div>

        {/* Silhouetted Victorian Haunted Mansion on Hill (Left) */}
        <svg className="absolute bottom-0 left-0 w-80 sm:w-96 text-[#20152B] fill-current" viewBox="0 0 300 200">
          {/* Hill slope */}
          <path d="M 0 160 Q 80 140 180 170 L 180 200 L 0 200 Z" opacity="0.9" />
          {/* House body */}
          <rect x="40" y="80" width="70" height="80" />
          {/* Central tower */}
          <rect x="65" y="45" width="25" height="40" />
          <polygon points="65,45 77,15 90,45" />
          {/* Spire */}
          <line x1="77" y1="15" x2="77" y2="5" stroke="#20152B" strokeWidth="2" />
          {/* Steep roof */}
          <polygon points="35,80 75,55 115,80" />
          {/* Chimney */}
          <rect x="45" y="55" width="8" height="20" />
          {/* Glowing Windows */}
          <rect x="52" y="95" width="10" height="15" rx="3" fill="#FDE047" opacity="0.8" />
          <rect x="88" y="95" width="10" height="15" rx="3" fill="#FDE047" opacity="0.8" />
          <rect x="73" y="55" width="8" height="12" rx="2" fill="#FDE047" opacity="0.9" />
          {/* Spooky Dead Trees next to house */}
          <path d="M 125 170 L 130 110 M 130 140 L 145 125 M 130 130 L 120 115 M 130 120 L 140 105" stroke="#20152B" strokeWidth="3" strokeLinecap="round" />
        </svg>

        {/* Cute Ghost Holding Glowing Lantern (Right) */}
        <div className="absolute bottom-10 right-10 sm:right-28 z-20 flex items-end">
          
          {/* Ghost Figure */}
          <div className="relative animate-float-slow">
            <svg className="w-28 sm:w-36 h-36 sm:h-44 drop-shadow-xl" viewBox="0 0 100 120" fill="none">
              <path
                d="M 50 15 
                   C 25 15, 18 35, 18 60 
                   C 18 85, 20 105, 25 105 
                   C 30 105, 33 98, 38 98 
                   C 43 98, 47 105, 52 105 
                   C 57 105, 61 98, 66 98 
                   C 71 98, 75 105, 80 105 
                   C 85 105, 85 85, 85 60 
                   C 85 35, 75 15, 50 15 Z"
                fill="#FFFFFF"
                stroke="#E2D6CB"
                strokeWidth="1.5"
              />
              <ellipse cx="40" cy="50" rx="3.5" ry="5.5" fill="#2E333D" />
              <ellipse cx="60" cy="50" rx="3.5" ry="5.5" fill="#2E333D" />
              <circle cx="41.5" cy="48" r="1.5" fill="#FFFFFF" />
              <circle cx="61.5" cy="48" r="1.5" fill="#FFFFFF" />
              <ellipse cx="34" cy="56" rx="4" ry="2.5" fill="#FF8A65" fillOpacity="0.4" />
              <ellipse cx="66" cy="56" rx="4" ry="2.5" fill="#FF8A65" fillOpacity="0.4" />
              <path d="M 48 57 Q 50 60 52 57" stroke="#2E333D" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              
              {/* Arm reaching out to lantern */}
              <path d="M 22 65 Q 10 70 8 78" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
            </svg>

            {/* Glowing Lantern dangling from arm */}
            <div className="absolute top-20 -left-6 z-30 animate-candle">
              <svg className="w-10 h-14" viewBox="0 0 40 60" fill="none">
                {/* Chain / wire handle */}
                <path d="M 20 5 L 20 18" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
                {/* Lantern cap */}
                <polygon points="12,18 28,18 24,12 16,12" fill="#78350F" />
                {/* Glass Chamber */}
                <rect x="12" y="18" width="16" height="24" rx="2" fill="#FEF08A" stroke="#78350F" strokeWidth="2" />
                {/* Flame inside with glowing halo */}
                <ellipse cx="20" cy="30" rx="3.5" ry="6" fill="#F97316" />
                <ellipse cx="20" cy="30" rx="2" ry="4" fill="#FEF08A" />
                {/* Base */}
                <rect x="10" y="42" width="20" height="5" rx="1.5" fill="#78350F" />
              </svg>
            </div>
          </div>

          {/* Glowing Pumpkins on Grass */}
          <div className="relative -ml-4 -mb-2 z-20">
            <svg className="w-12 h-10 animate-candle" viewBox="0 0 50 45" fill="none">
              <path d="M 25 8 Q 27 2 32 2" stroke="#4D7C0F" strokeWidth="2.5" strokeLinecap="round" />
              <ellipse cx="25" cy="26" rx="20" ry="15" fill="#EA580C" stroke="#9A3412" strokeWidth="1.5" />
              <polygon points="17,21 21,24 16,25" fill="#FEF08A" />
              <polygon points="33,21 34,25 29,24" fill="#FEF08A" />
              <polygon points="25,24 27,27 23,27" fill="#FEF08A" />
              <path d="M 17 31 Q 25 36 33 31 Q 30 33 27 32 Q 25 34 23 32 Z" fill="#FEF08A" />
            </svg>
          </div>

          <div className="relative -mb-1 ml-2 z-20">
            <svg className="w-8 h-8 animate-candle" style={{ animationDelay: '0.7s' }} viewBox="0 0 50 45" fill="none">
              <ellipse cx="25" cy="26" rx="18" ry="13" fill="#F97316" stroke="#C2410C" strokeWidth="1" />
              <polygon points="18,22 22,24 17,25" fill="#FEF08A" />
              <polygon points="32,22 33,25 28,24" fill="#FEF08A" />
            </svg>
          </div>

        </div>

        {/* Foreground rolling dark purple hill silhouette */}
        <svg className="absolute bottom-0 left-0 w-full text-[#1B1124] fill-current" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M 0 50 Q 250 10 500 50 T 1000 40 T 1200 60 L 1200 120 L 0 120 Z" />
        </svg>

      </div>

      {/* Bottom Footer Credits & Meta Bar */}
      <div className="relative z-30 bg-[#160E1D] border-t border-[#312040] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A898B5]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#E05822] flex items-center justify-center text-white font-bold text-xs">
              A
            </div>
            <span>&copy; {new Date().getFullYear()} AEGIS. Built for HackerRank Orchestrate &mdash; Ghost Data Still Exists.</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Charter</span>
            <span className="hover:text-white transition-colors cursor-pointer">Security Whitepaper</span>
            <span className="hover:text-white transition-colors cursor-pointer">API Docs</span>
            <span className="hover:text-white transition-colors cursor-pointer">HackerRank Challenge</span>
          </div>
        </div>
      </div>

    </footer>
  );
};
