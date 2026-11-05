import React from 'react';
import { Ghost, RefreshCw, HardDrive, FileText, Bookmark, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

interface GhostArchetypesSectionProps {
  onSelectCase: (caseId: string) => void;
}

export const GhostArchetypesSection: React.FC<GhostArchetypesSectionProps> = ({ onSelectCase }) => {
  const archetypes = [
    {
      id: 'phantom-replicas',
      title: 'Phantom Replicas',
      subtitle: 'Replication Drift & Failover Lag',
      icon: Ghost,
      tag: 'DATABASE ASYNC',
      caseId: 'case_05',
      evidenceId: 'evidence_54',
      system: 'account_service',
      description: 'The master PostgreSQL instance deletes the user row and marks the ticket COMPLETE. However, failover replicas with network lag fail to consume the WAL stream, leaving the record intact.',
      remedyOp: 'DELETE_RECORD',
      remedyShort: 'Failover replica purge before verify pass',
      // Color styling
      gradientBar: 'from-indigo-500 via-purple-500 to-indigo-600',
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-200/70 group-hover:scale-105',
      tagStyle: 'bg-indigo-50/90 text-indigo-700 border-indigo-200/80',
      cardHover: 'hover:border-indigo-300 hover:shadow-[0_8px_30px_rgba(99,102,241,0.12)]',
      remedyBg: 'bg-indigo-50/60 text-indigo-800 border-indigo-200/70',
      remedyDot: 'bg-indigo-500',
      evidenceStyle: 'bg-indigo-50/80 text-indigo-900 border-indigo-200',
      buttonHover: 'hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300'
    },
    {
      id: 'zombie-sync',
      title: 'Zombie Sync Pipelines',
      subtitle: 'Automated Resuscitation Cron Jobs',
      icon: RefreshCw,
      tag: 'ACTIVE DATA FLOW',
      caseId: 'case_11',
      evidenceId: 'evidence_93',
      system: 'integration_service',
      description: 'An automated ETL worker detects the missing user row and automatically "heals" downstream clusters by re-inserting the ghost record from an upstream cache.',
      remedyOp: 'DISABLE_DATA_FLOW',
      remedyShort: 'Sever sync connector before record purge',
      // Color styling
      gradientBar: 'from-amber-500 via-orange-500 to-amber-600',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/70 group-hover:scale-105',
      tagStyle: 'bg-amber-50/90 text-amber-700 border-amber-200/80',
      cardHover: 'hover:border-amber-300 hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)]',
      remedyBg: 'bg-amber-50/60 text-amber-800 border-amber-200/70',
      remedyDot: 'bg-amber-500',
      evidenceStyle: 'bg-amber-50/80 text-amber-900 border-amber-200',
      buttonHover: 'hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300'
    },
    {
      id: 'haunted-backups',
      title: 'Haunted Cold Backups',
      subtitle: 'Disaster Recovery Snapshot Inundation',
      icon: HardDrive,
      tag: 'RESTORE RISK',
      caseId: 'case_09',
      evidenceId: 'evidence_03',
      system: 'backup_service',
      description: 'Periodic S3 backup snapshots taken 48h prior remain with restore_allowed=1. Subsequent DR drills silently rehydrate erased customer PII into search indices.',
      remedyOp: 'BLOCK_RESTORE',
      remedyShort: 'Blacklist snapshot re-hydration in cold storage',
      // Color styling
      gradientBar: 'from-rose-500 via-red-500 to-rose-600',
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-200/70 group-hover:scale-105',
      tagStyle: 'bg-rose-50/90 text-rose-700 border-rose-200/80',
      cardHover: 'hover:border-rose-300 hover:shadow-[0_8px_30px_rgba(244,63,94,0.12)]',
      remedyBg: 'bg-rose-50/60 text-rose-800 border-rose-200/70',
      remedyDot: 'bg-rose-500',
      evidenceStyle: 'bg-rose-50/80 text-rose-900 border-rose-200',
      buttonHover: 'hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
    },
    {
      id: 'spectral-logs',
      title: 'Spectral Logs & Exports',
      subtitle: 'Orphaned Attachments & Zip Exports',
      icon: FileText,
      tag: 'ORPHANED STORAGE',
      caseId: 'case_07',
      evidenceId: 'evidence_58',
      system: 'support_platform',
      description: 'Customer profiles are closed in tickets, but multi-part delivery attachments (ID scans, invoices, proof of address PDFs) linger indefinitely in S3 without lifecycle rules.',
      remedyOp: 'DELETE_RECORD',
      remedyShort: 'Scrub object store buckets & audit receipts',
      // Color styling
      gradientBar: 'from-sky-500 via-cyan-500 to-sky-600',
      iconBg: 'bg-sky-50 text-sky-600 border border-sky-200/70 group-hover:scale-105',
      tagStyle: 'bg-sky-50/90 text-sky-700 border-sky-200/80',
      cardHover: 'hover:border-sky-300 hover:shadow-[0_8px_30px_rgba(14,165,233,0.12)]',
      remedyBg: 'bg-sky-50/60 text-sky-800 border-sky-200/70',
      remedyDot: 'bg-sky-500',
      evidenceStyle: 'bg-sky-50/80 text-sky-900 border-sky-200',
      buttonHover: 'hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300'
    },
    {
      id: 'tombstone-apparitions',
      title: 'Tombstone Apparitions',
      subtitle: 'Incomplete Anonymization & PII Leakage',
      icon: Bookmark,
      tag: 'POLICY VIOLATION',
      caseId: 'case_32',
      evidenceId: 'evidence_51',
      system: 'identity_service',
      description: 'An ACCOUNT_TOMBSTONE preserves legal financial logs with a stable user_id, but naively retains the user\'s real name, email hash, and telephone number.',
      remedyOp: 'REDACT_RECORD',
      remedyShort: 'Strip direct PII while retaining immutable UUID',
      // Color styling
      gradientBar: 'from-emerald-500 via-teal-500 to-emerald-600',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/70 group-hover:scale-105',
      tagStyle: 'bg-emerald-50/90 text-emerald-700 border-emerald-200/80',
      cardHover: 'hover:border-emerald-300 hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)]',
      remedyBg: 'bg-emerald-50/60 text-emerald-800 border-emerald-200/70',
      remedyDot: 'bg-emerald-500',
      evidenceStyle: 'bg-emerald-50/80 text-emerald-900 border-emerald-200',
      buttonHover: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
    }
  ];

  return (
    <section className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-5 flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50/80 border border-orange-200 text-orange-800 mb-2 shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-[#EA580C]" />
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
              The 5 Specters of Deleted Data
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Why Ghost Data <span className="text-[#EA580C]">Still Exists</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl mt-0.5 leading-relaxed">
            A deletion workflow reports <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Complete</span>, but personal data persists across distributed infrastructure. These are the 5 architectural failure modes modeled in the benchmark.
          </p>
        </div>

        <div className="text-xs font-mono px-3.5 py-1.5 rounded-full bg-white border border-stone-200 text-stone-700 shadow-2xs shrink-0 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse"></span>
          <span className="font-semibold">518 Cases Audited &bull; 323 Incomplete Caught</span>
        </div>
      </div>

      {/* 5 Archetype Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {archetypes.map((arch) => {
          const Icon = arch.icon;
          return (
            <div
              key={arch.id}
              className={`group relative bg-white rounded-2xl overflow-hidden border border-stone-200/90 ${arch.cardHover} shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-300 flex flex-col justify-between`}
            >
              {/* Subtle Color Accent Top Bar */}
              <div className={`h-1 w-full bg-gradient-to-r ${arch.gradientBar}`} />

              <div className="p-4 sm:p-5">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform ${arch.iconBg}`}>
                    <Icon className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${arch.tagStyle}`}>
                    {arch.tag}
                  </span>
                </div>

                {/* Titles */}
                <h3 className="text-sm font-bold text-stone-900 tracking-tight leading-snug">
                  {arch.title}
                </h3>
                <p className="text-[11px] font-semibold text-stone-500 mb-2">
                  {arch.subtitle}
                </p>

                {/* Description */}
                <p className="text-[11px] text-stone-600 leading-relaxed mb-3">
                  {arch.description}
                </p>

                {/* Kahn DAG Remediation Pill */}
                <div className={`text-[10px] font-mono px-2.5 py-1.5 rounded-lg border flex items-center gap-2 ${arch.remedyBg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${arch.remedyDot}`}></span>
                  <span className="font-bold tracking-tight">{arch.remedyOp}</span>
                  <span className="text-stone-400">&bull;</span>
                  <span className="truncate text-stone-600">{arch.remedyShort}</span>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="px-4 sm:px-5 py-3 border-t border-stone-100 bg-stone-50/40 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-stone-400">Evidence:</span>
                  <span className={`font-semibold px-1.5 py-0.5 rounded border ${arch.evidenceStyle}`}>
                    {arch.evidenceId}
                  </span>
                </div>

                <button
                  onClick={() => onSelectCase(arch.caseId)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-stone-700 text-[11px] font-medium transition-all cursor-pointer border border-stone-200/80 shadow-2xs ${arch.buttonHover}`}
                >
                  <span className="font-semibold">{arch.caseId}</span>
                  <ArrowRight className="w-3 h-3 text-stone-400" />
                </button>
              </div>
            </div>
          );
        })}

        {/* 6th Card: Exorcism Engine Summary */}
        <div className="group relative bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white rounded-2xl overflow-hidden border border-stone-800 shadow-sm flex flex-col justify-between">
          {/* Vibrant Orange Gradient Top Bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[#EA580C] via-amber-500 to-rose-500" />

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-800/90 text-[#EA580C] border border-stone-700 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <Ghost className="w-4 h-4 text-[#EA580C]" />
              </div>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EA580C]/20 text-orange-300 border border-[#EA580C]/40 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-[#EA580C]" />
                AUTONOMOUS DAG
              </span>
            </div>

            <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
              Deterministic Exorcism Engine
            </h3>
            <p className="text-[10px] font-semibold text-orange-300/90 mb-2">
              Topological Remediation &bull; 0 Violations
            </p>
            <p className="text-[11px] text-stone-300 leading-relaxed mb-3">
              Prerequisite DAG ordering ensures active flows are disabled and restore paths blocked <strong className="text-white font-semibold">before</strong> modifying dependent records, preventing recreation loops.
            </p>

            <div className="text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-stone-800 bg-stone-800/60 flex items-center gap-2 text-stone-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-ping"></span>
              <span className="text-[#EA580C] font-bold">KAHN ALGORITHM</span>
              <span className="text-stone-500">&bull;</span>
              <span className="truncate text-stone-400">Strict dependency resolution</span>
            </div>
          </div>

          <div className="px-4 sm:px-5 py-3 border-t border-stone-800/80 bg-stone-950/60 flex items-center justify-between text-xs font-mono">
            <span className="text-[10px] font-semibold text-stone-400">
              100% Benchmark Accuracy
            </span>
            <button
              onClick={() => onSelectCase('case_09')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EA580C] hover:bg-[#c2410c] text-white text-[11px] font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <span>Exorcise</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
