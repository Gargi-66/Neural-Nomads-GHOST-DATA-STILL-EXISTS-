import React from 'react';
import { User, Database, FileText, UploadCloud, X } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  return (
    <section id="problem" className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
        
        {/* Left Column: Heading and Description */}
        <div className="lg:col-span-5 flex flex-col space-y-2.5">
          <span className="text-[10px] font-mono font-semibold tracking-wider uppercase text-[#EA580C]">
            The Failure Mode
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-tight">
            Deletion Isn't Always <br />
            the End.
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
            Even after an account is deleted, personal data can still survive in secondary read replicas, cold backups, unrotated logs, and active sync pipelines — and can even be resurrected.
          </p>
        </div>

        {/* Right Column: Visual Diagram */}
        <div className="lg:col-span-7 flex items-center justify-center">
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 p-4 sm:p-5 bg-white rounded-3xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            
            {/* Primary System (Account Deleted) */}
            <div className="w-44 bg-stone-50/80 rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col items-center text-center">
              <div className="relative mb-2.5">
                <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 shadow-2xs">
                  <User className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#EA580C] text-white flex items-center justify-center ring-2 ring-white">
                  <X className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>
              <h4 className="font-bold text-xs text-stone-900">Primary Database</h4>
              <span className="text-[10px] text-stone-500 mt-0.5">Row Deleted</span>
            </div>

            {/* Arrow */}
            <div className="flex items-center text-stone-400 px-1">
              <div className="hidden sm:flex items-center gap-1">
                <span className="w-6 border-t border-dashed border-stone-300"></span>
                <span className="text-xs">&rarr;</span>
              </div>
              <div className="sm:hidden text-xs">&darr;</div>
            </div>

            {/* But data can still exist in... container */}
            <div className="flex-1 bg-stone-50/80 rounded-2xl p-4 border border-stone-200">
              <span className="text-[11px] font-semibold text-stone-700 block mb-2.5">
                Residual traces survive in...
              </span>
              
              <div className="flex items-center gap-2">
                {/* Card 1: Backups */}
                <div className="flex-1 bg-white rounded-xl p-2.5 border border-stone-200 flex flex-col items-center justify-center shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center mb-1">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-stone-800">Backups</span>
                </div>

                {/* Card 2: Logs */}
                <div className="flex-1 bg-white rounded-xl p-2.5 border border-stone-200 flex flex-col items-center justify-center shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center mb-1">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-stone-800">Logs</span>
                </div>

                {/* Card 3: Exports */}
                <div className="flex-1 bg-white rounded-xl p-2.5 border border-stone-200 flex flex-col items-center justify-center shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center mb-1">
                    <UploadCloud className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-stone-800">Exports</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
