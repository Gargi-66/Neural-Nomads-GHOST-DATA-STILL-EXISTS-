import React from 'react';
import { Database, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface RealInvestigationProps {
  onOpenCase: (caseId: string) => void;
}

export const RealInvestigation: React.FC<RealInvestigationProps> = ({ onOpenCase }) => {
  return (
    <section id="research" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div 
        onClick={() => onOpenCase('case_09')}
        className="group relative cursor-pointer bg-white hover:bg-[#FFFDFB] rounded-3xl p-6 sm:p-8 border border-[#EFE5DB] hover:border-[#E8C2AF] shadow-md hover:shadow-xl transition-all duration-300"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Investigation Folder Visual */}
          <div className="lg:col-span-3 flex justify-center lg:justify-start">
            <div className="relative w-48 h-32 bg-gradient-to-br from-[#F5DEBE] to-[#E5BE8C] rounded-2xl border-2 border-[#D4A773] shadow-md p-3 flex flex-col justify-between transform -rotate-1 group-hover:rotate-0 transition-transform">
              {/* Paper tab */}
              <div className="absolute -top-3 left-4 w-20 h-5 bg-[#E8C496] rounded-t-md border-t border-l border-r border-[#D4A977]"></div>
              
              {/* Case badge */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-[#5B3F23] bg-white/70 px-2 py-0.5 rounded-sm">
                  Case #09
                </span>
                <span className="text-[10px] text-[#7A5833] font-mono">CONFIDENTIAL</span>
              </div>

              {/* Resolved Stamp */}
              <div className="my-auto mx-auto transform -rotate-12 border-2 border-[#D94E1B] bg-white/90 px-3 py-1 rounded-sm shadow-xs">
                <span className="font-mono text-xs font-black tracking-widest text-[#D94E1B] uppercase">
                  INVESTIGATED
                </span>
              </div>

              {/* Bottom lines */}
              <div className="flex items-center justify-between text-[9px] text-[#6B4F32] font-mono">
                <span>Subject: Kwame A.</span>
                <span>Audit: 100%</span>
              </div>
            </div>
          </div>

          {/* Middle: Investigation Narrative */}
          <div className="lg:col-span-5 flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#E05822]"></span>
              <h3 className="text-xl sm:text-2xl font-black text-[#191D24]">
                A Real Investigation
              </h3>
            </div>
            <p className="text-sm text-[#555E6B] leading-relaxed">
              A deletion marked &quot;complete&quot; was found to still exist in an analytics export and a backup. AEGIS traced the lineage, applied policy, and generated a verified remediation plan.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-bold text-[#E05822] group-hover:translate-x-1 transition-transform">
              <span>Inspect Full Evidence Graph & Step Plan</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Right: Telemetry / Metric Indicators */}
          <div className="lg:col-span-4 grid grid-cols-1 gap-3 sm:gap-2">
            
            {/* Metric 1 */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF6F2] border border-[#ECE0D4]">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-[#E05822]" />
                <span className="text-xs font-bold text-[#2C333E]">Systems Checked</span>
              </div>
              <span className="font-mono font-black text-sm text-[#191D24]">6</span>
            </div>

            {/* Metric 2 */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF6F0] border border-[#FED7C2]">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-[#2C333E]">Residual Copies</span>
              </div>
              <span className="font-mono font-black text-sm text-[#D94E1B]">2</span>
            </div>

            {/* Metric 3 */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#F0FDF4] border border-emerald-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-800">Verified Deletion</span>
              </div>
              <span className="inline-flex items-center gap-1 font-mono font-black text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                Complete
              </span>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
