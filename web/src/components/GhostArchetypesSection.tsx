import React from 'react';
import { Ghost, RefreshCw, HardDrive, FileText, Bookmark, ArrowRight, ShieldAlert } from 'lucide-react';

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
      remedy: 'DELETE_RECORD on failover replica before verification pass.'
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
      remedy: 'DISABLE_DATA_FLOW on sync connector prior to record removal.'
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
      remedy: 'BLOCK_RESTORE on archive snapshot before clearing primary.'
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
      remedy: 'DELETE_RECORD on storage bucket object & scrub audit trail.'
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
      remedy: 'REDACT_RECORD to strip direct PII while preserving user_id.'
    }
  ];

  return (
    <section className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-5 flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 mb-2 shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-[#EA580C]" />
            <span className="text-[10px] font-mono font-semibold tracking-wider uppercase">
              The 5 Specters of Deleted Data
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Why Ghost Data Still Exists
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 max-w-2xl mt-0.5 leading-relaxed">
            A deletion workflow reports <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Complete</span>, but personal data persists across distributed infrastructure. These are the 5 architectural failure modes modeled in the benchmark.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-full bg-white border border-stone-200 text-stone-600 shadow-2xs shrink-0 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#EA580C]"></span>
          <span>518 Cases Audited &bull; 323 Incomplete Caught</span>
        </div>
      </div>

      {/* 5 Archetype Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {archetypes.map((arch) => {
          const Icon = arch.icon;
          return (
            <div
              key={arch.id}
              className="group bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 hover:border-stone-300 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center transition-transform group-hover:scale-105">
                    <Icon className="w-4 h-4 stroke-[1.75]" />
                  </div>
                  <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-stone-50 text-stone-600 border border-stone-200">
                    {arch.tag}
                  </span>
                </div>

                {/* Titles */}
                <h3 className="text-sm font-bold text-stone-900 tracking-tight leading-snug">
                  {arch.title}
                </h3>
                <p className="text-[11px] font-medium text-stone-500 mb-2">
                  {arch.subtitle}
                </p>

                {/* Description */}
                <p className="text-[11px] text-stone-600 leading-relaxed mb-3">
                  {arch.description}
                </p>
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-stone-400">Evidence:</span>
                  <span className="font-semibold px-1.5 py-0.5 rounded bg-stone-50 text-stone-800 border border-stone-200">
                    {arch.evidenceId}
                  </span>
                </div>

                <button
                  onClick={() => onSelectCase(arch.caseId)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-50 hover:bg-stone-100 text-stone-700 hover:text-stone-900 text-[11px] font-medium transition-all cursor-pointer border border-stone-200/60"
                >
                  <span>{arch.caseId}</span>
                  <ArrowRight className="w-3 h-3 text-stone-400" />
                </button>
              </div>
            </div>
          );
        })}

        {/* 6th Card: Exorcism Engine Summary */}
        <div className="bg-stone-50/80 rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center mb-2.5 shadow-2xs">
              <Ghost className="w-4 h-4 text-[#EA580C]" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 tracking-tight leading-snug">
              Deterministic Exorcism Engine
            </h3>
            <p className="text-[10px] font-semibold text-stone-500 mb-2">
              Topological Remediation &bull; 0 Violations
            </p>
            <p className="text-[11px] text-stone-600 leading-relaxed mb-3">
              Prerequisite DAG ordering ensures active flows are disabled and restore paths blocked <strong className="text-stone-900 font-semibold">before</strong> modifying dependent records, preventing recreation loops.
            </p>
          </div>

          <div className="pt-2.5 border-t border-stone-200 flex items-center justify-between text-xs font-mono">
            <span className="text-[10px] font-semibold text-stone-500">
              100% Benchmark Accuracy
            </span>
            <button
              onClick={() => onSelectCase('case_09')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold shadow-2xs transition-all cursor-pointer"
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
