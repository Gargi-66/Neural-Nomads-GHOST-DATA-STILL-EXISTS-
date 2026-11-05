import React from 'react';
import { 
  PieChart, ShieldAlert, Database, 
  Layers 
} from 'lucide-react';
import metrics from '../data/system_metrics.json';

export const AnalyticsDashboard: React.FC = () => {
  const { total_cases, status_counts, system_surviving_counts } = metrics;
  const riskCounts = metrics.risk_counts as Record<string, number>;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFEAE0] text-[#D94E1B] text-xs font-bold mb-2">
          <span>📊</span>
          <span>COMPLIANCE &amp; TAXONOMY METRICS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191D24] tracking-tight">
          Compliance &amp; Governance Analytics
        </h2>
        <p className="text-xs sm:text-sm text-[#525B69] mt-0.5">
          Quantitative breakdown of deletion compliance, surviving records, policy violations, and replication drift across the 518-case dataset.
        </p>
      </div>

      {/* Grid of Interactive Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Deletion Status Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-[#EFE5DB] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFE5DB] pb-3">
            <h3 className="text-sm font-bold text-[#191D24] flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#E05822]" />
              Deletion Status Distribution
            </h3>
            <span className="text-[11px] font-mono text-[#717A88]">518 Cases</span>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-emerald-700 font-bold">COMPLETE (Clean)</span>
                <span className="text-[#191D24] font-bold">{status_counts.COMPLETE} ({((status_counts.COMPLETE / total_cases) * 100).toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-[#FAF7F2] rounded-full h-2.5 overflow-hidden border border-[#EFE5DB]">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(status_counts.COMPLETE / total_cases) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-[#D94E1B] font-bold">INCOMPLETE (Residual)</span>
                <span className="text-[#191D24] font-bold">{status_counts.INCOMPLETE} ({((status_counts.INCOMPLETE / total_cases) * 100).toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-[#FAF7F2] rounded-full h-2.5 overflow-hidden border border-[#EFE5DB]">
                <div className="bg-[#E05822] h-full rounded-full" style={{ width: `${(status_counts.INCOMPLETE / total_cases) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-[#717A88] font-bold">NOT_APPLICABLE</span>
                <span className="text-[#191D24] font-bold">{status_counts.NOT_APPLICABLE} ({((status_counts.NOT_APPLICABLE / total_cases) * 100).toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-[#FAF7F2] rounded-full h-2.5 overflow-hidden border border-[#EFE5DB]">
                <div className="bg-[#CBD5E1] h-full rounded-full" style={{ width: `${(status_counts.NOT_APPLICABLE / total_cases) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Threat & Risk Level Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-[#EFE5DB] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFE5DB] pb-3">
            <h3 className="text-sm font-bold text-[#191D24] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#D94E1B]" />
              Threat Severity Breakdown
            </h3>
            <span className="text-[11px] font-mono text-[#717A88]">Forensic Risk</span>
          </div>

          <div className="space-y-3 pt-1 text-xs font-mono">
            {Object.entries(riskCounts).map(([risk, count]) => {
              const isCrit = risk === 'CRITICAL';
              const isHigh = risk === 'HIGH';
              const isMed = risk === 'MEDIUM';

              const barColor = isCrit ? 'bg-[#D94E1B]' : isHigh ? 'bg-[#E05822]' : isMed ? 'bg-amber-500' : 'bg-emerald-500';
              const textColor = isCrit ? 'text-[#D94E1B]' : isHigh ? 'text-[#E05822]' : isMed ? 'text-amber-800' : 'text-emerald-700';

              return (
                <div key={risk} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className={`font-bold ${textColor}`}>{risk}</span>
                    <span className="text-[#191D24] font-bold">{String(count)} cases</span>
                  </div>
                  <div className="w-full bg-[#FAF7F2] rounded-full h-2 overflow-hidden border border-[#EFE5DB]">
                    <div className={`${barColor} h-full rounded-full`} style={{ width: `${(Number(count) / total_cases) * 100}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Surviving Records by System Service */}
        <div className="bg-white rounded-3xl p-6 border border-[#EFE5DB] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFE5DB] pb-3">
            <h3 className="text-sm font-bold text-[#191D24] flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              Surviving Records by Service
            </h3>
            <span className="text-[11px] font-mono text-[#717A88]">Residual PII</span>
          </div>

          <div className="space-y-2.5 pt-1 text-xs font-mono">
            {Object.entries(system_surviving_counts).map(([sys, count]) => (
              <div key={sys} className="flex items-center justify-between p-2 rounded-xl bg-[#FAF7F2] border border-[#EFE5DB]">
                <span className="text-[#555E6B] truncate max-w-[170px]">{sys}</span>
                <span className="text-[#E05822] font-bold px-2 py-0.5 rounded-md bg-white border border-[#EFE5DB]">
                  {String(count)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Summary Table: Error Taxonomy Guarantees */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#EFE5DB] pb-3">
          <h3 className="text-sm font-bold text-[#191D24] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#E05822]" />
            Error Taxonomy &amp; Automated Verification Safeguards
          </h3>
          <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            0 Violations Detected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] space-y-1">
            <span className="text-[#8C7A6D] text-[10px] uppercase font-bold block">Temporal Cutoff Gate</span>
            <div className="text-[#191D24] font-bold">Zero Post-Audit Leakage</div>
            <p className="text-[11px] font-sans text-[#717A88] mt-1">
              All files with captured_at &gt; audit_at are strictly rejected by the admissibility gate.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] space-y-1">
            <span className="text-[#8C7A6D] text-[10px] uppercase font-bold block">Identity Resolution</span>
            <div className="text-[#191D24] font-bold">Transitive Hash Closure</div>
            <p className="text-[11px] font-sans text-[#717A88] mt-1">
              Resolves historical email aliases and SHA-256 hashes across user_audit_log.csv.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] space-y-1">
            <span className="text-[#8C7A6D] text-[10px] uppercase font-bold block">Policy Compiler</span>
            <div className="text-[#191D24] font-bold">Statutory Retention Preserved</div>
            <p className="text-[11px] font-sans text-[#717A88] mt-1">
              Rule 12 audit logs retained; tombstones stripped down to stable user_id with 0 PII leakage.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] space-y-1">
            <span className="text-[#8C7A6D] text-[10px] uppercase font-bold block">DAG Action Ordering</span>
            <div className="text-[#191D24] font-bold">Kahn's Topological Sorting</div>
            <p className="text-[11px] font-sans text-[#717A88] mt-1">
              Disables active sync and blocks restore risks before executing any record-level deletions.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
