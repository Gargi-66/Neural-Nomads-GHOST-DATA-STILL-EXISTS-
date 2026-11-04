import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/product', label: 'Product' },
    { path: '/how-it-works', label: 'How It Works' },
    { path: '/architecture', label: 'Architecture' },
    { path: '/use-cases', label: 'Use Cases' },
    { path: '/research', label: 'Research' },
    { path: '/docs', label: 'Docs' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#FBF8F5]/90 border-b border-[#F0E6DD] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-[#E05822] flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-bold ring-2 ring-orange-200 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.15" />
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-[#1E232A]">AEGIS</span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-semibold transition-all duration-200 relative py-1 ${
                  isActive
                    ? 'text-[#E05822]'
                    : 'text-[#4A5568] hover:text-[#1E232A]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E05822] rounded-full"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action */}
        <div className="flex items-center gap-3">
          <Link
            to="/product"
            className="group hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E05822] hover:bg-[#C94715] text-white text-sm font-bold shadow-md shadow-orange-500/25 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <span>Investigate Now</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 bg-[#FBF8F5] border-b border-[#F0E6DD] space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-800 hover:bg-orange-50 hover:text-[#E05822]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/product"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-center mt-3 py-2.5 rounded-full bg-[#E05822] text-white font-bold text-sm shadow-sm"
          >
            Investigate Now &rarr;
          </Link>
        </div>
      )}
    </header>
  );
};
