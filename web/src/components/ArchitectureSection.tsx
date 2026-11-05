import React, { useState } from 'react';
import { 
  Database, FileText, HardDrive, FileCode, ScanLine, Scan, Hash, Pencil,
  FileCheck2, Link2, Network, PieChart, Clock, LayoutDashboard, BarChart3,
  Folder, Sparkles, Bot, Layers, GitBranch
} from 'lucide-react';
import { MedallionArchitectureSection } from './MedallionArchitectureSection';

export const ArchitectureSection: React.FC = () => {
  const [viewMode, setViewMode] = useState<'medallion' | 'pipeline'>('pipeline');

  return (
    <section id="architecture" className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-[#FFEAE0] text-[#D94E1B] flex items-center justify-center">
              <Database className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#191D24] tracking-tight">
              Medallion Data &amp; Audit Pipeline
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#5B6575]">
            Data Transformation (Bronze &rarr; Silver &rarr; Gold) coupled with automated deletion-audit and forensic verification.
          </p>
        </div>

        {/* View Mode Switcher: Medallion Pipeline vs Pipeline Flow */}
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
            <span>Medallion Pipeline</span>
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

      {/* Render Medallion Architecture */}
      {viewMode === 'medallion' && (
        <MedallionArchitectureSection />
      )}

      {/* Render 6-Stage Medallion Pipeline Flow */}
      {viewMode === 'pipeline' && (
        <div className="bg-white/80 backdrop-blur-xs rounded-3xl p-5 sm:p-7 border border-[#EBE0D3] shadow-sm space-y-6">
          
          {/* Main 6-Stage Flow Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-stretch relative">
            
            {/* Stage 1: Data Sources (Evidence) */}
            <div className="bg-[#FFF9F5] rounded-2xl p-4 border border-[#F6DFC8] flex flex-col justify-between shadow-2xs">
              <div>
                <div className="mb-3.5">
                  <h4 className="text-xs font-bold text-[#A84A1E] tracking-tight">1. Data Sources</h4>
                  <span className="text-[11px] text-[#8C7A6D] block -mt-0.5">(Evidence)</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EFE3D6] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <Database className="w-3.5 h-3.5 text-stone-600" />
                    <span>Databases</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EFE3D6] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <FileText className="w-3.5 h-3.5 text-stone-600" />
                    <span>Logs</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EFE3D6] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <HardDrive className="w-3.5 h-3.5 text-stone-600" />
                    <span>Backups</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EFE3D6] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <FileCode className="w-3.5 h-3.5 text-stone-600" />
                    <span>CSV/JSON</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EFE3D6] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <ScanLine className="w-3.5 h-3.5 text-stone-600" />
                    <span>OCR Docs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stage 2: Bronze Layer (Raw Ingestion) */}
            <div className="bg-[#FFF9F5] rounded-2xl p-4 border border-[#F6DFC8] flex flex-col justify-between shadow-2xs">
              <div>
                <div className="mb-3.5">
                  <h4 className="text-xs font-bold text-[#A84A1E] tracking-tight">2. Bronze Layer</h4>
                  <span className="text-[11px] text-[#8C7A6D] block -mt-0.5">(Raw Ingestion)</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EFE3D6] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <Layers className="w-3.5 h-3.5 text-stone-600" />
                    <span>Raw Ingestion</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EFE3D6] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <Hash className="w-3.5 h-3.5 text-stone-600" />
                    <span>SHA-256 Hashes</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EFE3D6] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <Pencil className="w-3.5 h-3.5 text-stone-600" />
                    <span>Metadata</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EFE3D6] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <Scan className="w-3.5 h-3.5 text-stone-600" />
                    <span>OCR</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stage 3: Silver Layer (Validated Data) */}
            <div className="bg-[#F4F5F7] rounded-2xl p-4 border border-[#E2E6EC] flex flex-col justify-between shadow-2xs">
              <div>
                <div className="mb-3.5">
                  <h4 className="text-xs font-bold text-[#3B4455] tracking-tight">3. Silver Layer</h4>
                  <span className="text-[11px] text-[#717E93] block -mt-0.5">(Validated Data)</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#D9DFE8] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <FileCheck2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Validated Data</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#D9DFE8] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <Link2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Relational Links</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#D9DFE8] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <Network className="w-3.5 h-3.5 text-slate-600" />
                    <span>8 Entities</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stage 4: Gold Layer (Audit Warehouse) */}
            <div className="bg-[#FFF8EE] rounded-2xl p-4 border border-[#F6E6C9] flex flex-col justify-between shadow-2xs">
              <div>
                <div className="mb-3.5">
                  <h4 className="text-xs font-bold text-[#9A6214] tracking-tight">4. Gold Layer</h4>
                  <span className="text-[11px] text-[#8C7A6D] block -mt-0.5">(Audit Warehouse)</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EFE3D6] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <Database className="w-3.5 h-3.5 text-amber-700" />
                    <span>Audit Warehouse</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EFE3D6] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <PieChart className="w-3.5 h-3.5 text-amber-700" />
                    <span>Compliance Metrics</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EFE3D6] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Retention Exceptions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stage 5: Streamlit */}
            <div className="bg-[#FFF9F5] rounded-2xl p-4 border border-[#F6DFC8] flex flex-col justify-between shadow-2xs">
              <div>
                <div className="mb-3.5 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#A84A1E] tracking-tight">5. Streamlit</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-red-500 font-black text-xs">👑</span>
                    <LayoutDashboard className="w-3 h-3 text-[#E05822]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EFE3D6] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <LayoutDashboard className="w-3.5 h-3.5 text-stone-600" />
                    <span>Audit Dashboard</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EFE3D6] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <BarChart3 className="w-3.5 h-3.5 text-stone-600" />
                    <span>KPI Cards</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EFE3D6] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <Folder className="w-3.5 h-3.5 text-stone-600" />
                    <span>Case Explorer</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stage 6: RAG + Gemini */}
            <div className="bg-[#FFF8EE] rounded-2xl p-4 border border-[#F6E6C9] flex flex-col justify-between shadow-2xs">
              <div>
                <div className="mb-3.5 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#9A6214] tracking-tight">6. RAG + Gemini</h4>
                  </div>
                  <div className="flex items-center gap-1 text-[#E05822]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EFE3D6] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <Bot className="w-3.5 h-3.5 text-amber-700" />
                    <span>Grounded AI Assistant</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#EFE3D6] text-xs font-medium text-[#2C333E] shadow-2xs">
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    <span>Evidence Citations</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </section>
  );
};
