import React, { useState, useMemo } from 'react';
import casesData from '../data/cases_518.json';
import { Search, User } from 'lucide-react';

interface CaseItem {
  case_id: string;
  email: string;
  requested_at: string;
  reported_status: string;
  reported_at: string;
  audit_at: string;
  request_text: string;
  deletion_status: string;
  steps_count: number;
  steps: Array<{
    step_no: number;
    phase: string;
    system_id: string;
    resource_id: string;
    operation: string;
    state: string;
    evidence_id?: string;
  }>;
  user_id: string | null;
  historical_emails: string[];
  historical_phones: string[];
}

export const ProductPage: React.FC = () => {
  const allCases: CaseItem[] = casesData as CaseItem[];

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETE' | 'INCOMPLETE' | 'NOT_APPLICABLE'>('ALL');
  const [selectedCaseId, setSelectedCaseId] = useState<string>(allCases[0]?.case_id || 'case_01');
  const [activeInspectorTab, setActiveInspectorTab] = useState<'overview' | 'steps' | 'identities'>('overview');

  const filteredCases = useMemo(() => {
    return allCases.filter((c) => {
      const matchesSearch = 
        c.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.request_text.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || c.deletion_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allCases, searchQuery, statusFilter]);

  const selectedCase = useMemo(() => {
    return allCases.find((c) => c.case_id === selectedCaseId) || allCases[0];
  }, [allCases, selectedCaseId]);

  const stats = useMemo(() => {
    const total = allCases.length;
    const complete = allCases.filter(c => c.deletion_status === 'COMPLETE').length;
    const incomplete = allCases.filter(c => c.deletion_status === 'INCOMPLETE').length;
    const na = allCases.filter(c => c.deletion_status === 'NOT_APPLICABLE').length;
    return { total, complete, incomplete, na };
  }, [allCases]);

  return (
    <div className="min-h-screen py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Workbench Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#EFE5DB]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/60 border border-orange-200 text-xs font-bold text-[#E05822] mb-2">
            <span>AEGIS Ground-Truth Engine</span>
            <span>&bull;</span>
            <span className="font-mono">518 Benchmark Cases</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#191D24] tracking-tight">
            Forensic Investigation Workbench
          </h1>
          <p className="text-sm text-[#5B6575] mt-1 max-w-2xl">
            Audit residual ghost records, verify historical identity chains, and inspect deterministic remediation sequences across the complete benchmark dataset.
          </p>
        </div>

        {/* Global Dataset Metrics */}
        <div className="flex items-center gap-2 sm:gap-3 bg-white p-2 rounded-2xl border border-[#EAE0D5] shadow-xs">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-center">
            <span className="text-[10px] font-bold uppercase block">Complete</span>
            <span className="text-sm font-black font-mono">{stats.complete}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-center">
            <span className="text-[10px] font-bold uppercase block">Incomplete</span>
            <span className="text-sm font-black font-mono">{stats.incomplete}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-center">
            <span className="text-[10px] font-bold uppercase block">Not App.</span>
            <span className="text-sm font-black font-mono">{stats.na}</span>
          </div>
        </div>
      </div>

      {/* Main Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Case Browser */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-[#EFE5DB] shadow-xs space-y-4">
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by case ID, email or request..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#EFE3D8] text-xs font-medium text-[#1E232A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E05822]/40"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(['ALL', 'COMPLETE', 'INCOMPLETE', 'NOT_APPLICABLE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  statusFilter === st
                    ? 'bg-[#E05822] text-white'
                    : 'bg-[#FAF6F2] text-slate-600 hover:bg-[#F2E8DE]'
                }`}
              >
                {st === 'NOT_APPLICABLE' ? 'N/A' : st}
              </button>
            ))}
          </div>

          <div className="max-h-[600px] overflow-y-auto space-y-2 pr-1">
            {filteredCases.slice(0, 50).map((c) => {
              const isSelected = c.case_id === selectedCaseId;
              return (
                <div
                  key={c.case_id}
                  onClick={() => setSelectedCaseId(c.case_id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#FFF8F3] border-[#E05822] shadow-xs'
                      : 'bg-white hover:bg-[#FAF6F2] border-[#EFE3D8]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-black text-[#1E232A]">
                      {c.case_id}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        c.deletion_status === 'COMPLETE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.deletion_status === 'INCOMPLETE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.deletion_status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 font-mono truncate mb-1">
                    {c.email}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Audit: {c.audit_at?.split('T')[0] || c.audit_at}</span>
                    <span className="font-bold text-[#E05822]">
                      {c.steps_count} steps
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredCases.length > 50 && (
              <div className="text-center py-2 text-xs text-slate-500 font-medium">
                Showing top 50 matches out of {filteredCases.length} cases
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Case Detail Inspector */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-md space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFE5DB]">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-black text-[#191D24]">
                  {selectedCase.case_id}
                </span>
                <span
                  className={`text-xs font-extrabold uppercase px-2.5 py-1 rounded-md ${
                    selectedCase.deletion_status === 'COMPLETE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedCase.deletion_status === 'INCOMPLETE'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {selectedCase.deletion_status}
                </span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Requested: {selectedCase.requested_at} &bull; Audit: {selectedCase.audit_at}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Reported Status</span>
              <span className="text-xs font-mono font-semibold text-slate-700">{selectedCase.reported_status}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-[#F0E6DD] pb-2 text-xs font-bold">
            {[
              { id: 'overview', label: 'Case Overview' },
              { id: 'steps', label: `Step Plan (${selectedCase.steps.length})` },
              { id: 'identities', label: 'Identity Graph' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveInspectorTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeInspectorTab === tab.id
                    ? 'bg-[#FFEBE0] text-[#E05822]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeInspectorTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#EFE3D8]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Original Subject Request Text
                </span>
                <p className="text-sm font-medium text-slate-800 italic bg-white p-3 rounded-xl border border-[#ECE0D4]">
                  &ldquo;{selectedCase.request_text}&rdquo;
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#EFE3D8] space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Ground-Truth Determination Rationale:
                </span>
                {selectedCase.deletion_status === 'NOT_APPLICABLE' ? (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    The request text does not contain an unambiguous, legally authorized request to delete account records. Per the grading contract, step plan is strictly empty (<code className="font-mono">[]</code>).
                  </p>
                ) : selectedCase.deletion_status === 'INCOMPLETE' ? (
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Audit inspection at timestamp <code className="font-mono">{selectedCase.audit_at}</code> revealed un-purged records, active restoration risks, or un-redacted PII across storage systems. AEGIS has constructed a deterministic remediation sequence followed by verification steps.
                  </p>
                ) : (
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    All 4 conditions for verified deletion are satisfied at audit time. Tombstones are sanitized, no active zombie sync jobs exist, and legally required logs remain preserved.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeInspectorTab === 'steps' && (
            <div className="space-y-3">
              {selectedCase.steps.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No steps required (Case is NOT_APPLICABLE).
                </div>
              ) : (
                <div className="divide-y divide-[#F2E8DE]">
                  {selectedCase.steps.map((st) => (
                    <div key={st.step_no} className="py-3 flex items-start justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#FFEAE0] text-[#E05822] text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {st.step_no}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                st.phase === 'FINDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : st.phase === 'REMEDIATION'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {st.phase}
                            </span>
                            <span className="font-mono font-bold text-slate-900">{st.operation}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1 font-mono">
                            {st.system_id} &rarr; <span className="text-[#E05822] font-semibold">{st.resource_id}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 block">
                          {st.state}
                        </span>
                        {st.evidence_id && (
                          <span className="font-mono text-[10px] text-blue-600 block mt-1">
                            {st.evidence_id}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeInspectorTab === 'identities' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#EFE3D8] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <User className="w-4 h-4 text-[#E05822]" />
                  <span>Resolved Identity Graph</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-[#EFE5DA]">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Primary Email</span>
                    <span className="font-mono font-bold text-slate-900 break-all">{selectedCase.email}</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#EFE5DA]">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Internal User ID</span>
                    <span className="font-mono font-bold text-slate-900">{selectedCase.user_id || 'unlinked'}</span>
                  </div>
                </div>

                {selectedCase.historical_emails.length > 0 && (
                  <div className="p-3 bg-white rounded-xl border border-[#EFE5DA] text-xs">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Historical Email Aliases</span>
                    <div className="space-y-1">
                      {selectedCase.historical_emails.map((e, idx) => (
                        <div key={idx} className="font-mono text-slate-700">{e}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
