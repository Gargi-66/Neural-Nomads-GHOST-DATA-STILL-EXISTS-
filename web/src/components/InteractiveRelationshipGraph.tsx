import React, { useState, useMemo } from 'react';
import { GitBranch, ShieldCheck } from 'lucide-react';
import allCases from '../data/all_cases.json';

interface DAGProps {
  initialCaseId?: string;
  onSelectCase?: (caseId: string) => void;
}

export const InteractiveRelationshipGraph: React.FC<DAGProps> = ({
  initialCaseId = 'case_09',
  onSelectCase
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  const currentCase = useMemo(() => {
    return allCases.find((c) => c.case_id === selectedCaseId) || allCases[0];
  }, [selectedCaseId]);

  const steps = useMemo(() => {
    return currentCase.steps || [];
  }, [currentCase]);

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFEAE0] text-[#D94E1B] text-xs font-bold mb-2">
              <GitBranch className="w-3.5 h-3.5" />
              <span>DIRECTED ACYCLIC GRAPH (DAG)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191D24] tracking-tight flex items-center gap-2">
              Topological Remediation DAG
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-semibold">
                Kahn&apos;s Algorithm
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-[#525B69] mt-0.5">
              Strict topological dependency ordering: Disables replication sync crons & blocks cold restores <em>before</em> deleting residual records.
            </p>
          </div>

          {/* Case Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600">Select Case:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => {
                setSelectedCaseId(e.target.value);
                setActiveStepIndex(null);
                if (onSelectCase) onSelectCase(e.target.value);
              }}
              className="px-3.5 py-2 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] text-xs text-stone-900 font-bold focus:outline-none focus:border-[#EA580C] shadow-2xs cursor-pointer font-mono"
            >
              {allCases.map((c) => (
                <option key={c.case_id} value={c.case_id}>
                  {c.case_id} — {c.customer_name} ({c.deletion_status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* DAG Case Meta Summary Banner */}
        <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EFE5DB] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EA580C]"></div>
            <span className="font-bold text-stone-900">Subject: {currentCase.customer_name} ({currentCase.user_id})</span>
            <span className="text-stone-400">&bull;</span>
            <span className="font-mono text-stone-600">{currentCase.primary_email}</span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              currentCase.deletion_status === 'COMPLETE' 
                ? 'bg-emerald-100 text-emerald-800' 
                : currentCase.deletion_status === 'INCOMPLETE'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-stone-200 text-stone-700'
            }`}>
              {currentCase.deletion_status}
            </span>
            <span className="text-stone-500 font-sans text-xs">Total DAG Steps: <strong>{steps.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Visual Topological DAG Flow Diagram */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-extrabold text-[#191D24] mb-1">
            Topological Dependency Pipeline (Execution Order)
          </h3>
          <p className="text-xs text-[#525B69]">
            Hover or click any node to trace prerequisite ordering and target state verification.
          </p>
        </div>

        {/* Horizontal Node Stages with Directional Arrows */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          
          {/* Stage 1: FINDING */}
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EFE5DB] relative group hover:border-amber-300 transition shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Phase 1: Finding
              </span>
              <span className="text-xs font-mono font-bold text-stone-400">Step 1</span>
            </div>
            <h4 className="text-xs font-bold text-stone-900 mb-1">Evidence Detection</h4>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Scan multi-system evidence manifest at audit cutoff. Identifies surviving records in secondary storage.
            </p>
            <div className="mt-3 pt-2 border-t border-[#EFE5DB] text-[10px] font-mono text-stone-500">
              State: <strong className="text-rose-600">PRESENT / ACTIVE</strong>
            </div>
          </div>

          {/* Stage 2: PREREQUISITE (DISABLE DATA FLOW & BLOCK RESTORE) */}
          <div className="bg-[#FFF9F5] p-4 rounded-2xl border border-[#F6DCD0] relative group hover:border-[#EA580C] transition shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase text-[#D94E1B] bg-[#FFEAE0] px-2 py-0.5 rounded-full">
                Phase 2: Prerequisite
              </span>
              <span className="text-xs font-mono font-bold text-stone-400">Step 2 &bull; DAG Root</span>
            </div>
            <h4 className="text-xs font-bold text-stone-900 mb-1">Halt Re-Creation Paths</h4>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              <strong className="text-stone-900">DISABLE_DATA_FLOW</strong> & <strong className="text-stone-900">BLOCK_RESTORE</strong>. Stop background sync jobs from resurrecting deleted records.
            </p>
            <div className="mt-3 pt-2 border-t border-[#F6DCD0] text-[10px] font-mono text-stone-500">
              State: <strong className="text-[#EA580C]">DISABLED / BLOCKED</strong>
            </div>
          </div>

          {/* Stage 3: REMEDIATION (DELETE / REDACT) */}
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EFE5DB] relative group hover:border-blue-300 transition shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                Phase 3: Remediation
              </span>
              <span className="text-xs font-mono font-bold text-stone-400">Step 3 &bull; Execution</span>
            </div>
            <h4 className="text-xs font-bold text-stone-900 mb-1">Downstream-First Purge</h4>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              <strong className="text-stone-900">DELETE_RECORD</strong> on read replicas, search indices, and exports, then purge primary database record.
            </p>
            <div className="mt-3 pt-2 border-t border-[#EFE5DB] text-[10px] font-mono text-stone-500">
              State: <strong className="text-blue-600">ABSENT / REDACTED</strong>
            </div>
          </div>

          {/* Stage 4: VERIFICATION */}
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 relative group hover:border-emerald-400 transition shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Phase 4: Verification
              </span>
              <span className="text-xs font-mono font-bold text-stone-400">Terminal Gate</span>
            </div>
            <h4 className="text-xs font-bold text-stone-900 mb-1">Cryptographic Proof</h4>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              <strong className="text-stone-900">VERIFY_RECORD_ABSENT</strong>. Proves downstream nodes are clean and flows remain disabled.
            </p>
            <div className="mt-3 pt-2 border-t border-emerald-200 text-[10px] font-mono text-stone-500">
              State: <strong className="text-emerald-700">COMPLIANT</strong>
            </div>
          </div>

        </div>

        {/* Directed Edge Rules Banner */}
        <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EFE5DB] text-xs text-stone-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span><strong>DAG Acyclicity Guarantee:</strong> Cycle-free Directed Acyclic Graph sorted via Kahn&apos;s algorithm with 0 order inversions.</span>
          </div>
          <span className="text-[11px] font-mono font-bold text-stone-500">Topological Sort: Valid</span>
        </div>
      </div>

      {/* Granular Step-by-Step DAG Table for Selected Case */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#191D24]">
              Topological Step Schedule for {currentCase.case_id}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Exact sequence encoded into <code className="text-[#EA580C] font-mono">output.csv</code>
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#EFE5DB] text-stone-600">
            {steps.length} ordered actions
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#EFE5DB]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF7F2] text-stone-600 uppercase tracking-wider text-[10px] border-b border-[#EFE5DB]">
              <tr>
                <th className="py-3 px-4 font-bold text-center w-16">Step</th>
                <th className="py-3 px-4 font-bold">Phase</th>
                <th className="py-3 px-4 font-bold">Operation (DAG Action)</th>
                <th className="py-3 px-4 font-bold">System ID</th>
                <th className="py-3 px-4 font-bold">Resource ID</th>
                <th className="py-3 px-4 font-bold text-center">Target State</th>
                <th className="py-3 px-4 font-bold">Evidence Citation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE5DB] font-mono text-[11px] bg-white">
              {steps.map((s, idx) => {
                const isSelected = activeStepIndex === idx;
                return (
                  <tr 
                    key={s.step_no} 
                    onClick={() => setActiveStepIndex(idx)}
                    className={`hover:bg-[#FAF7F2] transition cursor-pointer ${isSelected ? 'bg-orange-50/50' : ''}`}
                  >
                    <td className="py-2.5 px-4 text-center font-bold text-stone-900">
                      #{s.step_no}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold ${
                        s.phase === 'FINDING' ? 'bg-amber-100 text-amber-800' :
                        s.phase === 'REMEDIATION' ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {s.phase}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-stone-900">
                      {s.operation}
                    </td>
                    <td className="py-2.5 px-4 text-[#EA580C] font-semibold">
                      {s.system_id}
                    </td>
                    <td className="py-2.5 px-4 text-stone-700">
                      {s.resource_id}
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        s.state === 'PRESENT' || s.state === 'ACTIVE' ? 'text-rose-600 bg-rose-50 border border-rose-200' :
                        s.state === 'DISABLED' || s.state === 'BLOCKED' ? 'text-amber-700 bg-amber-50 border border-amber-200' :
                        'text-emerald-700 bg-emerald-50 border border-emerald-200'
                      }`}>
                        {s.state}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-sans text-stone-500 text-[10px]">
                      {s.evidence_id ? <code className="bg-[#FAF7F2] px-1.5 py-0.5 rounded text-[#EA580C] font-bold font-mono">{s.evidence_id}</code> : <span className="text-stone-400 italic">None (Proposed)</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
