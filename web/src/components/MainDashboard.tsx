import React from 'react';
import { 
  ShieldAlert, ShieldCheck, FileSearch, Database, Server, 
  AlertTriangle, ArrowRight, Zap, RefreshCw,
  Lock, HardDrive, Cpu, Terminal
} from 'lucide-react';
import metrics from '../data/system_metrics.json';
import allCases from '../data/all_cases.json';

interface MainDashboardProps {
  onNavigate: (view: string, caseId?: string) => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({ onNavigate }) => {
  // Highlighted high-risk cases for quick jump
  const criticalCases = allCases.filter(c => c.risk_level === 'CRITICAL').slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0B0F19] border border-cyan-500/20 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              AEGIS Security Operations Center &bull; Live Audit Engine
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Autonomous Evidence &amp; Identity Governance
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Auditing enterprise deletion claims against physical database snapshots, failover read replicas, search indexes, cold S3 backups, and active data flows. 
              Cutoff temporal enforcement guarantees zero post-audit evidence leakage.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <button
              onClick={() => onNavigate('explorer')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
              <FileSearch className="w-4 h-4" />
              <span>Explore 518 Requests</span>
            </button>
            <button
              onClick={() => onNavigate('lineage')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-all cursor-pointer"
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Relationship Graph</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Primary KPI Counter Grid (Strict Real Data from Dataset) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Deletion Requests */}
        <div className="bg-[#0F172A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">Total Requests</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight mb-1 font-mono">
            {metrics.total_cases}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold">100% Audited</span>
            <span>&bull; Full evaluation set</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>518 Total Target Cases</span>
            <span className="text-slate-500">case_33..case_550</span>
          </div>
        </div>

        {/* Complete (Verified Compliant) */}
        <div className="bg-[#0F172A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">Complete / Compliant</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 tracking-tight mb-1 font-mono">
            {metrics.status_counts.COMPLETE}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">30.3%</span>
            <span>Proven absent or redacted</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Evidence-backed state</span>
            <span className="text-emerald-400">Zero Ghost Data</span>
          </div>
        </div>

        {/* Incomplete (Surviving Residuals & Risks) */}
        <div className="bg-[#0F172A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">Incomplete / Residual</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-400 tracking-tight mb-1 font-mono">
            {metrics.status_counts.INCOMPLETE}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-rose-400 font-bold">33.4%</span>
            <span>Surviving PII / Zombie Sync</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Remediation required</span>
            <span className="text-rose-400">{metrics.total_findings} Residual Findings</span>
          </div>
        </div>

        {/* Not Applicable (Non-Deletion Requests) */}
        <div className="bg-[#0F172A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">Not Applicable</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400 tracking-tight mb-1 font-mono">
            {metrics.status_counts.NOT_APPLICABLE}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">36.3%</span>
            <span>Access / export / opt-out</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Unauthorized for deletion</span>
            <span className="text-amber-400">steps_json = []</span>
          </div>
        </div>

      </div>

      {/* 3. Deep Forensic Threat Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Threat Distribution Card */}
        <div className="bg-[#0F172A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Ghost Data Threat Vector Breakdown</h3>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Actual forensic violations uncovered across the platform where deletion workflows falsely claimed completion:
          </p>

          <div className="space-y-3.5">
            {/* Active Data Flows (Zombie Sync) */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  Active Zombie Sync Flows
                </span>
                <span className="font-bold text-cyan-400">{metrics.total_active_flows} cases</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full" style={{ width: '42%' }}></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Connectors continuously repopulating deleted records downstream</p>
            </div>

            {/* Cold Backup Restore Risks */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300 flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                  Backup Restoration Risks
                </span>
                <span className="font-bold text-indigo-400">{metrics.total_restore_risks} cases</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" style={{ width: '34%' }}></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">S3 archive dumps with restore_allowed=1 capable of resurrecting data</p>
            </div>

            {/* Direct PII Exposure */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Direct PII &amp; Tombstone Leaks
                </span>
                <span className="font-bold text-amber-400">{metrics.total_exposed_pii} cases</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full" style={{ width: '68%' }}></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Raw emails, phone numbers, or names retained in tombstone records</p>
            </div>
          </div>
        </div>

        {/* System-wise Surviving Records */}
        <div className="bg-[#0F172A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Server className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Surviving Records by System</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Distribution of residual personal data across enterprise storage layers:
          </p>

          <div className="space-y-2.5">
            {Object.entries(metrics.system_surviving_counts).map(([system, count]) => (
              <div key={system} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  {system.replace('_', ' ').toUpperCase()}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white">{String(count)}</span>
                  <span className="text-[10px] text-slate-500 font-mono">records</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Infrastructure Inventory */}
        <div className="bg-[#0F172A]/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Evidence Pipeline Status</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              AEGIS extracts ground-truth facts from heterogeneous formats across all regions:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-2xl font-black text-cyan-400 font-mono">24</div>
                <div className="text-[11px] text-slate-400">SQLite Snapshots</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-2xl font-black text-indigo-400 font-mono">28</div>
                <div className="text-[11px] text-slate-400">JSON Bundles</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-2xl font-black text-purple-400 font-mono">26</div>
                <div className="text-[11px] text-slate-400">Trace Logs</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-2xl font-black text-emerald-400 font-mono">4</div>
                <div className="text-[11px] text-slate-400">PDF Attachments</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => onNavigate('evidence')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>Inspect All 94 Evidence Manifest Files</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4. Critical Cases Requiring Immediate Remediation */}
      <div className="bg-[#0F172A]/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Critical Non-Compliant Deletion Cases</h3>
              <p className="text-xs text-slate-400">False-positive "Complete" workflow claims with active data resurrection risks</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('explorer')}
            className="text-xs font-mono font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Cases</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/80">
          {criticalCases.map((c) => (
            <div 
              key={c.case_id}
              onClick={() => onNavigate('investigation', c.case_id)}
              className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/40 cursor-pointer transition-colors group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded">
                    {c.case_id}
                  </span>
                  <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {c.customer_name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({c.user_id})
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    CRITICAL RISK
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1 max-w-2xl">
                  &ldquo;{c.request_text}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono text-slate-500">Claimed vs Actual</div>
                  <div className="text-xs font-mono">
                    <span className="text-slate-400 line-through mr-1.5">{c.reported_status}</span>
                    <span className="text-rose-400 font-bold">{c.deletion_status}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono text-slate-500">Plan Steps</div>
                  <div className="text-xs font-mono font-bold text-cyan-400">
                    {c.steps.length} Steps
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 text-slate-400 flex items-center justify-center transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
