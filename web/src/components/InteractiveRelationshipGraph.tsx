import React, { useState } from 'react';
import { 
  GitBranch, ZoomIn, ZoomOut, Maximize2, X, ShieldCheck, 
  Activity, Layers, CheckCircle2 
} from 'lucide-react';

interface DAGProps {
  initialCaseId?: string;
  onSelectCase?: (caseId: string) => void;
}

export const InteractiveRelationshipGraph: React.FC<DAGProps> = () => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFEAE0] text-[#D94E1B] text-xs font-bold mb-2">
              <GitBranch className="w-3.5 h-3.5" />
              <span>DIRECTED ACYCLIC GRAPH (DAG)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191D24] tracking-tight flex items-center gap-2">
              Medallion Data &amp; Audit Pipeline DAG
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-semibold">
                17 Stages &bull; 0 Cycles
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-[#525B69] mt-0.5 leading-relaxed max-w-3xl">
              End-to-end topological pipeline architecture: From Raw Ingestion to Bronze lakehouse, Silver relational normalization, Gold analytical marts, Gemini RAG reasoning, and the Streamlit SOC Dashboard.
            </p>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center p-1 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] shadow-2xs">
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-white transition-all cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                title="Reset Zoom"
                className="px-2.5 py-1 text-xs font-mono font-bold text-stone-700 hover:text-stone-900"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-white transition-all cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#191D24] hover:bg-stone-800 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </button>
          </div>
        </div>

        {/* Pipeline Highlights Bar */}
        <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#EFE5DB] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-stone-500 font-bold">Key Stages:</span>
            <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200 text-[10px] font-mono font-semibold">
              Raw Data Sources
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#FBE9DC] text-[#B45309] border border-[#EAD5C3] text-[10px] font-mono font-semibold">
              Bronze (SHA-256)
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-mono font-semibold">
              Silver (8 Validated Tables)
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#FEF08A] text-[#854D0E] border border-[#FDE047] text-[10px] font-mono font-semibold">
              Gold (Analytical Marts)
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#FFEAE0] text-[#EA580C] border border-[#FDBA74] text-[10px] font-mono font-semibold">
              RAG + Gemini API
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] text-[10px] font-mono font-semibold">
              Streamlit Dashboard
            </span>
          </div>

          <span className="text-[11px] font-mono text-stone-500">
            Acyclicity Guaranteed &bull; Strict Kahn Sort
          </span>
        </div>
      </div>

      {/* Main Visual Image Display Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EFE5DB] shadow-xs relative overflow-hidden flex flex-col items-center">
        
        <div className="w-full flex items-center justify-between pb-4 mb-6 border-b border-[#EFE5DB]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#EA580C]" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-900 font-mono">
              Pipeline Architecture Diagram
            </h3>
          </div>
          <span className="text-xs font-mono text-stone-500">
            Click image to view in high resolution
          </span>
        </div>

        {/* Crisp Centered High-Resolution Diagram */}
        <div className="w-full flex justify-center items-center py-4 overflow-x-auto">
          <div 
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
            className="transition-transform duration-200 cursor-zoom-in"
            onClick={() => setIsModalOpen(true)}
          >
            <div className="p-3 bg-white rounded-3xl border border-stone-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-lg transition-shadow max-w-[420px] mx-auto">
              <img
                src="/dag-pipeline.jpg"
                alt="Medallion Data & Audit Pipeline DAG"
                className="w-full h-auto object-contain rounded-2xl select-none"
                loading="eager"
              />
            </div>
          </div>
        </div>

        {/* Bottom Detail Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-10 pt-6 border-t border-[#EFE5DB]">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Two Lateral Bypass Flows</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              <strong>Silver Database</strong> feeds direct relational context into <strong>RAG Retrieval</strong>, while <strong>Gold Outputs</strong> stream directly to the <strong>Streamlit Dashboard</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
              <Activity className="w-4 h-4 text-[#EA580C]" />
              <span>Zero-Hallucination Invariant</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Every audit verdict and topological step schedule is deterministically computed in the Gold warehouse. The Gemini API provides natural language explanations without mutating verdicts.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
              <CheckCircle2 className="w-4 h-4 text-[#B45309]" />
              <span>Strict Temporal Boundaries</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              All 94 evidence files and SQL snapshot tables are bounded at each case's <code>audit_at</code> cutoff to eliminate any hindsight bias.
            </p>
          </div>
        </div>

      </div>

      {/* Full-Screen Lightbox Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative bg-white rounded-3xl p-4 sm:p-6 max-h-[92vh] max-w-2xl w-full overflow-y-auto border border-stone-200 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#EA580C]" />
                <h4 className="text-sm font-bold text-stone-900">
                  Medallion Architecture DAG (Full Resolution)
                </h4>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center p-2 bg-[#FAF7F2] rounded-2xl border border-stone-200 w-full">
              <img
                src="/dag-pipeline.jpg"
                alt="Medallion Data & Audit Pipeline DAG (Full Resolution)"
                className="max-h-[80vh] w-auto object-contain rounded-xl select-none shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
