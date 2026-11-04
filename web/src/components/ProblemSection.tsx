import React from 'react';
import { User, Database, FileText, UploadCloud, X } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  return (
    <section id="product" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        
        {/* Left Column: Heading and Description */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <span className="text-xs font-black uppercase tracking-widest text-[#E05822]">
            THE PROBLEM
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#191D24] tracking-tight leading-tight">
            Deletion Isn't Always <br />
            the End.
          </h2>
          <p className="text-base text-[#555E6B] leading-relaxed">
            Even after an account is deleted, personal data can still survive in backups, logs, exports, and other connected systems — and may even return.
          </p>
        </div>

        {/* Right Column: Visual Diagram matching user image */}
        <div className="lg:col-span-7 flex items-center justify-center">
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 p-6 bg-white/70 rounded-3xl border border-[#EFE5DB] shadow-xs">
            
            {/* Primary System (Account Deleted) */}
            <div className="w-44 bg-white rounded-2xl p-5 border border-[#E8DDCE] shadow-xs flex flex-col items-center text-center">
              <div className="relative mb-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <User className="w-6 h-6" />
                </div>
                {/* Red X Badge on User */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#E05822] text-white flex items-center justify-center ring-2 ring-white">
                  <X className="w-3 h-3 stroke-[3]" />
                </div>
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#191D24]">Primary System</h4>
              <span className="text-[11px] text-[#717A88] mt-0.5">Account Deleted</span>
            </div>

            {/* Dashed Arrow */}
            <div className="flex items-center text-[#A0AEC0] px-1">
              <div className="hidden sm:flex items-center gap-1">
                <span className="w-8 border-t-2 border-dashed border-[#CBD5E1]"></span>
                <span className="text-xs">&rarr;</span>
              </div>
              <div className="sm:hidden text-lg">&darr;</div>
            </div>

            {/* But data can still exist in... container */}
            <div className="flex-1 bg-[#F5F3FF]/70 rounded-2xl p-4 sm:p-5 border border-[#EDE9FE]">
              <span className="text-xs font-semibold text-[#6D28D9] block mb-3">
                But data can still exist in...
              </span>
              
              <div className="flex items-center gap-2.5">
                {/* Card 1: Backups */}
                <div className="flex-1 bg-white rounded-xl p-3 border border-[#E9D5FF] flex flex-col items-center justify-center shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center mb-1.5">
                    <Database className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-[#1E232A]">Backups</span>
                </div>

                {/* Card 2: Logs */}
                <div className="flex-1 bg-white rounded-xl p-3 border border-[#E9D5FF] flex flex-col items-center justify-center shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center mb-1.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-[#1E232A]">Logs</span>
                </div>

                {/* Card 3: Exports */}
                <div className="flex-1 bg-white rounded-xl p-3 border border-[#E9D5FF] flex flex-col items-center justify-center shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center mb-1.5">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-[#1E232A]">Exports</span>
                </div>

                {/* Ellipsis */}
                <span className="text-slate-400 font-bold px-1 text-sm tracking-widest">...</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
