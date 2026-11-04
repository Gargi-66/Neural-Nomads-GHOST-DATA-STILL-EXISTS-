import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#160E1D] border-t border-[#312040] text-[#A898B5] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-[#2D1F38]">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-black text-lg">
              <div className="w-7 h-7 rounded-lg bg-[#E05822] flex items-center justify-center text-white text-xs">A</div>
              <span>AEGIS</span>
            </div>
            <p className="text-xs text-[#8E7E9C] leading-relaxed">
              Autonomous Evidence Graph & Identity Synapse. Built for HackerRank Orchestrate — Ghost Data Still Exists.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/product" className="hover:text-white transition-colors">Forensic Workbench</Link></li>
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">5-Stage Pipeline</Link></li>
              <li><Link to="/architecture" className="hover:text-white transition-colors">Architecture Flow</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/use-cases" className="hover:text-white transition-colors">Enterprise Use Cases</Link></li>
              <li><Link to="/research" className="hover:text-white transition-colors">Mathematical State Machine</Link></li>
              <li><Link to="/docs" className="hover:text-white transition-colors">Rules 01–15 & Taxonomy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Integrity & Standard</h4>
            <div className="p-3 rounded-xl bg-[#20152B] border border-[#38264A] text-[11px] text-[#A898B5] leading-relaxed">
              <span className="text-emerald-400 font-bold block mb-1">Evidence-First Assurance</span>
              Zero synthetic claims. All 518 cases verified against ground-truth multi-format dataset.
            </div>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#716280] gap-4">
          <span>&copy; {new Date().getFullYear()} AEGIS. All rights reserved. HackerRank Orchestrate 2026.</span>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px]">Strict 3-Phase Hierarchy Enforced</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
