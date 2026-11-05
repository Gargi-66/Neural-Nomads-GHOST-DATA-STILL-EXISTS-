import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ChevronLeft, ChevronRight, ShieldAlert, ShieldCheck, HelpCircle, ArrowRight, Sparkles
} from 'lucide-react';
import allCases from '../data/all_cases.json';

interface InvestigationExplorerProps {
  onSelectCase: (caseId: string) => void;
}

export const InvestigationExplorer: React.FC<InvestigationExplorerProps> = ({ onSelectCase }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [liveCasesList, setLiveCasesList] = useState<any[]>([]);
  const itemsPerPage = 12;

  // Listen for live intake creation events and query API
  useEffect(() => {
    const fetchLiveCases = async () => {
      try {
        const res = await fetch('/api/live/requests');
        if (res.ok) {
          const data = await res.json();
          if (data && data.requests) {
            const mapped = data.requests.map((r: any) => ({
              case_id: r.ticket_id,
              user_id: r.customer_id || 'live_intake',
              customer_name: r.full_name,
              primary_email: r.email,
              deletion_status: r.status,
              risk_level: r.status === 'INCOMPLETE' ? 'CRITICAL' : 'COMPLIANT',
              reported_status: 'PENDING_AUDIT',
              audit_cutoff: r.submitted_at,
              source: 'live',
              is_live: true,
            }));
            setLiveCasesList(mapped);
          }
        }
      } catch (_) {}
    };

    fetchLiveCases();

    const handleNewLiveCase = (e: any) => {
      if (e.detail) {
        const d = e.detail;
        const newCase = {
          case_id: d.ticket_id,
          user_id: d.customer_id || 'live_intake',
          customer_name: d.full_name,
          primary_email: d.email,
          deletion_status: d.status,
          risk_level: d.status === 'INCOMPLETE' ? 'CRITICAL' : 'COMPLIANT',
          reported_status: 'PENDING_AUDIT',
          audit_cutoff: d.submitted_at,
          source: 'live',
          is_live: true,
        };
        setLiveCasesList(prev => [newCase, ...prev.filter(x => x.case_id !== newCase.case_id)]);
      }
    };

    window.addEventListener('aegis_live_case_created', handleNewLiveCase);
    return () => window.removeEventListener('aegis_live_case_created', handleNewLiveCase);
  }, []);

  // Filtered cases combining live and benchmark
  const filteredCases = useMemo(() => {
    const combined = [...liveCasesList, ...allCases];
    return combined.filter((c: any) => {
      // Search matching
      const matchesSearch = 
        c.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.user_id && c.user_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.customer_name && c.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.primary_email && c.primary_email.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status matching
      const matchesStatus = statusFilter === 'ALL' || c.deletion_status === statusFilter;

      // Risk matching
      const matchesRisk = riskFilter === 'ALL' || c.risk_level === riskFilter;

      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [searchTerm, statusFilter, riskFilter, liveCasesList]);


  // Pagination
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage) || 1;
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCases.slice(start, start + itemsPerPage);
  }, [filteredCases, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFEAE0] text-[#D94E1B] text-xs font-bold mb-2">
              <span>🔍</span>
              <span>518 CASE REGISTRY</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191D24] tracking-tight">
              Forensic Case Explorer
            </h2>
            <p className="text-xs sm:text-sm text-[#525B69] mt-0.5">
              Inspect grounded evidence records, chronological cutoff dates, and complete verification plans for all 518 evaluation cases.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-[#FAF7F2] border border-[#EFE5DB] text-[#717A88]">
              {filteredCases.length} of {allCases.length} cases matching
            </span>
          </div>
        </div>

        {/* Search Input & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7A6D]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search case_id, user_id, email, or customer name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] text-xs text-[#191D24] placeholder-[#8C7A6D] focus:outline-none focus:border-[#E05822] focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] text-xs text-[#191D24] font-bold focus:outline-none focus:border-[#E05822] focus:bg-white transition-all"
            >
              <option value="ALL">Status: All Statuses (518)</option>
              <option value="INCOMPLETE">INCOMPLETE (323)</option>
              <option value="COMPLETE">COMPLETE (190)</option>
              <option value="NOT_APPLICABLE">NOT_APPLICABLE (5)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={riskFilter}
              onChange={(e) => { setRiskFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] text-xs text-[#191D24] font-bold focus:outline-none focus:border-[#E05822] focus:bg-white transition-all"
            >
              <option value="ALL">Risk Level: All Levels</option>
              <option value="CRITICAL">CRITICAL Risk</option>
              <option value="HIGH">HIGH Risk</option>
              <option value="MEDIUM">MEDIUM Risk</option>
              <option value="COMPLIANT">COMPLIANT (Clean)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Case Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedCases.map((c) => {
          const isComplete = c.deletion_status === 'COMPLETE';
          const isIncomplete = c.deletion_status === 'INCOMPLETE';

          return (
            <div
              key={c.case_id}
              onClick={() => onSelectCase(c.case_id)}
              className="group bg-white rounded-2xl p-5 border border-[#EFE5DB] hover:border-[#E8C2AF] shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-[#191D24] group-hover:text-[#E05822] transition-colors">
                      {c.case_id}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#717A88] border border-[#EFE5DB]">
                      {c.user_id}
                    </span>
                    {(c.is_live || c.source === 'live' || String(c.case_id).startsWith('CASE-LIVE-')) && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                        LIVE
                      </span>
                    )}
                  </div>

                  {isComplete ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" />
                      COMPLETE
                    </span>
                  ) : isIncomplete ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      <ShieldAlert className="w-3 h-3" />
                      INCOMPLETE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      <HelpCircle className="w-3 h-3" />
                      NOT_APPLICABLE
                    </span>
                  )}
                </div>

                {/* Subject Info */}
                <div className="space-y-1 mb-3">
                  <h4 className="text-sm font-bold text-[#191D24] truncate">
                    {c.customer_name}
                  </h4>
                  <p className="text-xs font-mono text-[#717A88] truncate">
                    {c.primary_email}
                  </p>
                </div>

                {/* Claim vs Ground Truth Verdict */}
                <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#F2E8DF] mb-3 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#8C7A6D]">Claimed:</span>
                    <span className="font-mono font-bold text-[#555E6B]">{c.reported_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C7A6D]">Cutoff Date:</span>
                    <span className="font-mono text-[#555E6B]">{c.audit_at.split('T')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C7A6D]">Forensic Steps:</span>
                    <span className="font-mono font-bold text-[#E05822]">{c.steps.length} verified steps</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="pt-2 border-t border-[#F5EFEA] flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono font-semibold text-[#8C7A6D]">
                  Risk: <strong className="text-[#191D24]">{c.risk_level}</strong>
                </span>
                <span className="inline-flex items-center gap-1 text-[#E05822] font-bold group-hover:translate-x-1 transition-transform">
                  <span>Dossier</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      <div className="bg-white rounded-2xl p-4 border border-[#EFE5DB] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-[#717A88] font-mono">
          Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> &bull; Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredCases.length)} of {filteredCases.length} cases
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-xl border border-[#EFE5DB] bg-[#FAF7F2] hover:bg-white text-[#191D24] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-mono font-bold px-3 py-1 bg-[#FFF5EE] text-[#E05822] rounded-xl border border-[#FCD2BF]">
            {currentPage}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl border border-[#EFE5DB] bg-[#FAF7F2] hover:bg-white text-[#191D24] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
