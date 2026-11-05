import React from 'react';
import { Download, Sparkles, Radar, Search, GitBranch, BarChart3, type LucideIcon } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onDownloadOutput: () => void;
  onOpenSampleCase?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onDownloadOutput,
  onOpenSampleCase
}) => {
  const mainNavItems: NavItem[] = [
    { id: 'product', label: 'Product' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'use-cases', label: 'Use Cases' },
    { id: 'research', label: 'Research' },
    { id: 'docs', label: 'Docs' },
  ];

  const toolNavItems: NavItem[] = [
    { id: 'radar', label: 'Radar', icon: Radar },
    { id: 'explorer', label: 'Cases (518)', icon: Search },
    { id: 'lineage', label: 'DAG', icon: GitBranch },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAFAF9]/95 backdrop-blur-md border-b border-stone-200/80 transition-all select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        
        {/* Left: Brand Logo */}
        <div 
          onClick={() => onNavigate('product')}
          className="flex items-center gap-2 cursor-pointer group select-none shrink-0"
        >
          <span className="w-2 h-2 rounded-full bg-[#EA580C]"></span>
          <span className="text-base font-extrabold tracking-tight text-stone-900 group-hover:text-[#EA580C] transition-colors">
            AEGIS
          </span>
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200/80 hidden sm:inline-block">
            v3.0 &bull; Forensic
          </span>
        </div>

        {/* Center: Space-Optimized Navigation without any scrollbars */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 py-1 shrink">
          {mainNavItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium tracking-tight transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-white text-stone-950 font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-stone-300'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="h-3.5 w-px bg-stone-300 mx-1 xl:mx-1.5"></div>

          {/* Forensic Investigation Tools */}
          {toolNavItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 opacity-80" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenSampleCase && (
            <button
              onClick={onOpenSampleCase}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-orange-400" />
              <span>Sample Case</span>
            </button>
          )}

          <button
            onClick={onDownloadOutput}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 hover:text-stone-900 text-xs font-semibold transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            title="Download the official verified output.csv"
          >
            <Download className="w-3 h-3 text-[#EA580C]" />
            <span className="hidden sm:inline">output.csv</span>
          </button>
        </div>

      </div>

      {/* Mobile Sub-Navigation Bar (Scrollbar completely hidden) */}
      <div className="lg:hidden flex items-center gap-1 bg-[#FAFAF9] border-t border-stone-200/80 px-3 py-1.5 overflow-x-auto text-xs no-scrollbar">
        {[...mainNavItems, ...toolNavItems].map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                isActive
                  ? 'bg-white text-stone-900 border border-stone-300 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-800'
              }`}
            >
              {Icon && <Icon className="w-3 h-3 opacity-80" />}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
