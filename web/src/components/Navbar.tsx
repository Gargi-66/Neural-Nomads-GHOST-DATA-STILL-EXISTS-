import React from 'react';
import { ArrowRight } from 'lucide-react';

interface NavbarProps {
  onOpenInvestigate: () => void;
  activeSection: string;
  setActiveSection: (sec: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenInvestigate, activeSection, setActiveSection }) => {
  const navItems = [
    { id: 'product', label: 'Product' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'use-cases', label: 'Use Cases' },
    { id: 'research', label: 'Research' },
    { id: 'docs', label: 'Docs' },
  ];

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FBF8F5]/90 border-b border-[#F0E6DD] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-[#E05822] flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-bold ring-2 ring-orange-200">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.15" />
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black tracking-tight text-[#1E232A]">AEGIS</span>
            </div>
          </div>
        </div>

        {/* Center Nav Links: Product, How It Works, Architecture, Use Cases, Research, Docs */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-[#E05822]'
                    : 'text-[#4A5568] hover:text-[#1E232A]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right CTA Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenInvestigate}
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E05822] hover:bg-[#C94715] text-white text-sm font-bold shadow-md shadow-orange-500/25 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <span>Investigate Now</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
