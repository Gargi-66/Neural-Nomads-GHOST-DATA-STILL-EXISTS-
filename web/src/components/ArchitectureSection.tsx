import React, { useState } from 'react';
import { 
  Database, FileText, HardDrive, UploadCloud, 
  Paperclip, Search, Bot, ShieldCheck, 
  ArrowRight, BarChart2, TrendingUp, Archive, User, GitBranch, FlaskConical, CheckCircle2,
  Layers
} from 'lucide-react';
import { MedallionArchitectureSection } from './MedallionArchitectureSection';

export const ArchitectureSection: React.FC = () => {
  const [viewMode, setViewMode] = useState<'medallion' | 'pipeline'>('medallion');

  return (
    <section id="architecture" className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-md bg-[#FFF0E7] text-[#E05822] flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#191D24] tracking-tight">
              Enterprise System Architecture
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#5B6575]">
            Medallion Data Architecture (Bronze &rarr; Silver &rarr; Gold) coupled with deterministic DAG planning and grounded RAG.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="inline-flex items-center p-1 rounded-full bg-stone-100 border border-stone-200 text-xs">
          <button
            onClick={() => setViewMode('medallion')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
              viewMode === 'medallion'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3 h-3 text-[#EA580C]" />
            <span>Medallion Warehouse</span>
          </button>

          <button
            onClick={() => setViewMode('pipeline')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
              viewMode === 'pipeline'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <GitBranch className="w-3 h-3 text-blue-500" />
            <span>Pipeline Flow</span>
          </button>
        </div>
      </div>

      {/* Render Medallion Architecture (Default) */}
      {viewMode === 'medallion' && (
        <MedallionArchitectureSection />
      )}

      {/* Render Original Pipeline Flow */}
      {viewMode === 'pipeline' && (
      <div className="bg-white/60 rounded-2xl p-4 sm:p-6 border border-[#EFE5DB] shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          
          {/* Column 1: Data Sources (Evidence) */}
          <div className="lg:col-span-3 bg-[#FFFBF8] rounded-2xl p-4 border border-[#F2E2D4]">
            <div className="mb-3">
              <span className="text-xs font-bold text-[#E05822] block leading-tight">Data Sources</span>
              <span className="text-[11px] text-[#8C7A6D]">(Evidence)</span>
            </div>
            
            <div className="space-y-2">
              {[
                { name: 'Databases', icon: Database },
                { name: 'Logs', icon: FileText },
                { name: 'Attachments', icon: Paperclip },
                { name: 'Search Index', icon: Search },
                { name: 'Backups', icon: HardDrive },
                { name: 'Exports', icon: UploadCloud },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-[#EFE5DA] text-xs font-medium text-[#2C333E]">
                    <Icon className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Arrow 1 */}
          <div className="hidden lg:flex lg:col-span-1 justify-center text-[#CBD5E1]">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* Column 2: AEGIS Investigation Engine (Center) */}
          <div className="lg:col-span-5 bg-[#FFF7F0]/80 rounded-2xl p-5 border border-[#F6DCCB] relative">
            
            {/* Header */}
            <div className="text-center mb-4">
              <span className="text-xs font-black text-[#D94E1B] tracking-wide">
                AEGIS Investigation Engine
              </span>
            </div>

            {/* Top row: Ingestion -> Identity -> Lineage -> Policy */}
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              <div className="p-2 rounded-xl bg-white border border-[#F0DFD3] text-center flex flex-col items-center">
                <Database className="w-3.5 h-3.5 text-[#E05822] mb-1" />
                <span className="text-[9px] font-bold text-[#1E232A] leading-tight">Ingestion & Preparation</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-[#F0DFD3] text-center flex flex-col items-center">
                <User className="w-3.5 h-3.5 text-[#E05822] mb-1" />
                <span className="text-[9px] font-bold text-[#1E232A] leading-tight">Identity Resolution</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-[#F0DFD3] text-center flex flex-col items-center">
                <GitBranch className="w-3.5 h-3.5 text-[#E05822] mb-1" />
                <span className="text-[9px] font-bold text-[#1E232A] leading-tight">Graph & Lineage</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-[#F0DFD3] text-center flex flex-col items-center">
                <ShieldCheck className="w-3.5 h-3.5 text-[#E05822] mb-1" />
                <span className="text-[9px] font-bold text-[#1E232A] leading-tight">Policy & Risk Engine</span>
              </div>
            </div>

            {/* Central Card: AI Investigation Agent */}
            <div className="p-3 my-3 rounded-2xl bg-gradient-to-r from-[#FFE8DA] via-[#FFDFCC] to-[#FFE8DA] border border-[#F8C1A0] text-center shadow-xs">
              <div className="flex items-center justify-center gap-2 text-xs font-black text-[#D94E1B]">
                <Bot className="w-4 h-4 text-[#E05822]" />
                <span>AI Investigation Agent</span>
              </div>
              <span className="text-[10px] text-[#7C2D12] block mt-0.5 font-medium">
                (LLM + Tools + Evidence Validation)
              </span>
            </div>

            {/* Bottom row: Remediation -> Verification -> Output Generation */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="p-2 rounded-xl bg-white border border-[#F0DFD3] text-center flex flex-col items-center">
                <FlaskConical className="w-3.5 h-3.5 text-[#E05822] mb-1" />
                <span className="text-[9px] font-bold text-[#1E232A] leading-tight">Remediation Simulator</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-[#F0DFD3] text-center flex flex-col items-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E05822] mb-1" />
                <span className="text-[9px] font-bold text-[#1E232A] leading-tight">Verification & Evaluation</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-[#F0DFD3] text-center flex flex-col items-center">
                <FileText className="w-3.5 h-3.5 text-[#E05822] mb-1" />
                <span className="text-[9px] font-bold text-[#1E232A] leading-tight">Output Generation (CSV + Reports)</span>
              </div>
            </div>
          </div>

          {/* Arrow 2 */}
          <div className="hidden lg:flex lg:col-span-1 justify-center text-[#CBD5E1]">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* Column 3: Outputs */}
          <div className="lg:col-span-2 bg-[#FFFBF8] rounded-2xl p-4 border border-[#F2E2D4]">
            <div className="mb-3">
              <span className="text-xs font-bold text-[#E05822] block leading-tight">Outputs</span>
            </div>
            
            <div className="space-y-2">
              {[
                { name: 'output.csv', icon: FileText },
                { name: 'evaluation report.md', icon: BarChart2 },
                { name: 'usage report.md', icon: TrendingUp },
                { name: 'agent-trace.zip', icon: Archive },
                { name: 'log.txt', icon: FileText },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EFE5DA] text-xs font-mono font-medium text-[#2C333E]">
                    <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
      )}
    </section>
  );
};
