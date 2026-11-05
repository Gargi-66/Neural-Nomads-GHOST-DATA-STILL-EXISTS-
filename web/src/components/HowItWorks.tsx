import React, { useState } from 'react';
import { 
  Database, Fingerprint, GitBranch, ShieldCheck, CheckCircle2, 
  ArrowRight, Sparkles, ShieldAlert, Cpu, Check, Terminal
} from 'lucide-react';

interface StageDetail {
  id: number;
  phase: string;
  phaseBadge: string;
  title: string;
  tagline: string;
  desc: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  activeBorder: string;
  iconBg: string;
  iconColor: string;
  icon: React.ElementType;
  inputs: string;
  outputs: string;
  operations: string[];
  rules: string[];
  sampleInput: string;
  sampleAction: string;
  sampleOutput: string;
}

export const HowItWorks: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<number>(0);

  const stages: StageDetail[] = [
    {
      id: 0,
      phase: 'STAGE 01',
      phaseBadge: 'BRONZE INGESTION',
      title: 'Ingest & Normalize',
      tagline: 'Multi-Modal Evidence Extraction & Cutoff Filtering',
      desc: 'Collects, OCRs, and parses all 94 evidence files across diverse formats (SQLite dumps, support ticket PDFs, application screenshots, access logs, JSON exports) into structured Bronze datasets.',
      color: 'blue',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      borderColor: 'border-blue-200',
      activeBorder: 'border-blue-500 ring-2 ring-blue-500/20',
      iconBg: 'bg-blue-100/70 text-blue-700',
      iconColor: 'text-blue-600',
      icon: Database,
      inputs: '94 raw files: SQLite snapshots, PDF tickets, JSON event streams, system logs',
      outputs: 'Normalized Bronze relational records with SHA-256 integrity hashes',
      operations: [
        'Multi-modal OCR on support attachments & invoices',
        'Relational SQLite snapshot table schema extraction',
        'Strict temporal cutoff gate (discards post-audit evidence)'
      ],
      rules: [
        'Evidence without valid captured_at timestamp is classified as inadmissible',
        'Evidence captured after the case audit_cutoff cannot prove deletion completion',
        'Self-reported platform statuses are treated as claims until verified'
      ],
      sampleInput: 'evidence_03.sql (snapshot 2026-08-20T04:00:00Z) + ticket_44.pdf',
      sampleAction: 'Parsed 12 SQL tables, OCR extracted PII in support thread, verified capture date <= audit cutoff',
      sampleOutput: 'Silver entity rows created in fact_evidence & fact_activity with link_status=VERIFIED'
    },
    {
      id: 1,
      phase: 'STAGE 02',
      phaseBadge: 'SILVER RESOLUTION',
      title: 'Resolve Identity',
      tagline: 'Cross-System Alias Tracking & Tombstone Modeling',
      desc: 'Correlates the request email against current identity snapshots and historical audit changelogs. Resolves historical aliases, phone numbers, and salted SHA-256 hashes to guarantee complete coverage.',
      color: 'purple',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700',
      borderColor: 'border-purple-200',
      activeBorder: 'border-purple-500 ring-2 ring-purple-500/20',
      iconBg: 'bg-purple-100/70 text-purple-700',
      iconColor: 'text-purple-600',
      icon: Fingerprint,
      inputs: 'Current snapshot (dim_customer), historical changelog (dim_identity_history)',
      outputs: 'Disambiguated customer identity tree with all historical identifiers mapped',
      operations: [
        'Bidirectional matching of request email against current and historical records',
        'Recover salted SHA-256 hashes used in analytics and fraud stores',
        'Account tombstone extraction (preserve user_id, scrub prohibited direct PII)'
      ],
      rules: [
        'A deletion request text is checked to ensure it authorizes deletion under GDPR/CCPA',
        'Non-deletion requests (access, export, marketing opt-out) evaluate to NOT_APPLICABLE',
        'Tombstones preserve internal user_id while scrubbing name, email, phone, and hash'
      ],
      sampleInput: 'Request email: user101_alt@domain.com (requested_at: 2026-08-03)',
      sampleAction: 'Resolved historical alias to primary user_99, matched SHA-256 hash e8f12a..., linked 2 resources',
      sampleOutput: 'Customer identity mapped to dim_customer with identity_resolution_status=VERIFIED'
    },
    {
      id: 2,
      phase: 'STAGE 03',
      phaseBadge: 'LINEAGE ANALYSIS',
      title: 'Analyze & Trace',
      tagline: 'Topological Lineage & Ghost Resuscitation Detection',
      desc: 'Builds a Directed Acyclic Graph (DAG) across 18 microservices to uncover surviving ghost data in replicas, asynchronous replication drift, active sync crons, and cold disaster-recovery backup paths.',
      color: 'orange',
      badgeBg: 'bg-orange-50',
      badgeText: 'text-[#EA580C]',
      borderColor: 'border-orange-200',
      activeBorder: 'border-[#EA580C] ring-2 ring-[#EA580C]/20',
      iconBg: 'bg-orange-100/70 text-[#EA580C]',
      iconColor: 'text-[#EA580C]',
      icon: GitBranch,
      inputs: '18 microservices, fact_case_data_link, active sync crons, backup manifests',
      outputs: 'Multi-service dependency DAG with ghost leakage vectors and resuscitation paths',
      operations: [
        'Detect 320ms replication lag drift between primary and failover replicas',
        'Flag zombie synchronization crons capable of recreating deleted records',
        'Scan cold backup archives capable of restoring unpurged historical snapshots'
      ],
      rules: [
        'Resources are strictly scoped via fact_case_data_link to prevent cross-customer leakage',
        'Active data flows must be disabled before deleting target records in remediation',
        'Backup restoration risks must be blocked before modifying source databases'
      ],
      sampleInput: 'account_service (deleted) -> search_service (index entry PRESENT) + active sync cron',
      sampleAction: 'Detected ghost data in search index (REPORT_REMAINING_RECORD) and active sync (REPORT_ACTIVE_DATA_FLOW)',
      sampleOutput: 'Topological dependency graph mapped with 2 finding steps generated'
    },
    {
      id: 3,
      phase: 'STAGE 04',
      phaseBadge: 'POLICY COMPLIANCE',
      title: 'Apply Policy',
      tagline: 'Multi-Jurisdictional Deletion & Retention Rules',
      desc: 'Evaluates each scoped resource against dim_deletion_policy. Distinguishes records that must be purged from those subject to statutory financial retention, security audit logs, or anonymization.',
      color: 'amber',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      borderColor: 'border-amber-200',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20',
      iconBg: 'bg-amber-100/70 text-amber-700',
      iconColor: 'text-amber-600',
      icon: ShieldCheck,
      inputs: 'Scoped resource states, dim_deletion_policy, statutory hold manifests',
      outputs: 'Deterministic operation assignments (DELETE, REDACT, ANONYMIZE, RETAIN)',
      operations: [
        'Match resource category to applicable policy rules and conditions',
        'Identify legal hold exceptions (e.g., 7-year financial audit ledger retention)',
        'Classify compliant retention as COMPLETE_WITH_EXCEPTION rather than failure'
      ],
      rules: [
        'Never delete data that policy explicitly mandates to be retained or archived',
        'Anonymized records must be irreversibly unlinked from user identifiers',
        'Redacted records keep required business fields while scrubbing personal identifiers'
      ],
      sampleInput: 'security_audit_log (retained) + user_profile (present) + dim_deletion_policy',
      sampleAction: 'Rule #12 requires RETAIN for security logs; Rule #01 requires DELETE for user profiles',
      sampleOutput: 'Classified security log as VERIFY_RECORD_PRESENT; flagged profile as REPORT_REMAINING_RECORD'
    },
    {
      id: 4,
      phase: 'STAGE 05',
      phaseBadge: 'GOLD VERIFICATION',
      title: 'Simulate & Verify',
      tagline: 'Deterministic Remediation Planning & Proof Output',
      desc: 'Simulates the ordered remediation plan (FINDING -> REMEDIATION -> VERIFICATION) with strict topological precedence. Produces the final, 100% deterministic output.csv with evidence attribution.',
      color: 'emerald',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20',
      iconBg: 'bg-emerald-100/70 text-emerald-700',
      iconColor: 'text-emerald-600',
      icon: CheckCircle2,
      inputs: 'Remediation plan steps, verification checks, warehouse audit results',
      outputs: 'Submission-grade output.csv with exact case determinations and steps_json',
      operations: [
        'Enforce 4-tier step ordering (phase -> operation -> system_id -> resource_id)',
        'Consecutive 1..N step numbering without missing or unordered operations',
        'Grounded evidence attribution (evidence_id only for findings/verified proofs)'
      ],
      rules: [
        'Remediation steps use empty evidence_id since they describe proposed actions',
        'COMPLETE cases include only evidence-backed verification steps proving absence',
        'Zero temporal leakage guarantees decisions rely strictly on pre-cutoff evidence'
      ],
      sampleInput: 'Case case_09: 3 findings, 3 remediation operations, 3 post-remediation verification checks',
      sampleAction: 'Numbered steps 1..9 consecutively, validated JSON serialization, confirmed 0 syntax violations',
      sampleOutput: 'output.csv row formatted: case_09,INCOMPLETE,"[{""step_no"":1,""phase"":""FINDING""...}]"'
    }
  ];

  const current = stages[selectedStage];
  const CurrentIcon = current.icon;

  return (
    <section id="how-it-works" className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFEAE0] text-[#D94E1B] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EVIDENCE-GROUNDED AUDIT PIPELINE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            How AEGIS Works
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-normal mt-1 max-w-2xl">
            A 5-phase zero-trust forensic investigation engine that transforms raw deletion requests into mathematically verifiable compliance decisions.
          </p>
        </div>

        {/* Quick Execution Stat Strip */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-full bg-white border border-[#EFE5DB] text-stone-700 shadow-2xs font-semibold">
            94 Evidence Files Grounded
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white border border-[#EFE5DB] text-stone-700 shadow-2xs font-semibold">
            18 Infrastructure Systems
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
            0 Temporal Leakage
          </span>
        </div>
      </div>

      {/* 5-Step Pipeline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isSelected = selectedStage === idx;

          return (
            <div 
              key={stage.id} 
              onClick={() => setSelectedStage(idx)}
              className={`group relative bg-white rounded-3xl p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xs ${
                isSelected 
                  ? `${stage.activeBorder} shadow-sm bg-white` 
                  : 'border-[#EFE5DB] hover:border-stone-400 hover:shadow-sm'
              }`}
            >
              <div>
                {/* Top Badge & Number */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${stage.badgeBg} ${stage.badgeText} border ${stage.borderColor}`}>
                    {stage.phaseBadge}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-stone-400">
                    {stage.phase}
                  </span>
                </div>

                {/* Stage Icon */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3.5 transition-transform group-hover:scale-105 shadow-2xs ${stage.iconBg}`}>
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>

                {/* Stage Title */}
                <h3 className="text-base font-extrabold text-stone-900 mb-1 leading-snug">
                  {stage.title}
                </h3>

                {/* Tagline */}
                <div className="text-[11px] font-semibold text-[#EA580C] mb-2 leading-tight">
                  {stage.tagline}
                </div>

                {/* Description */}
                <p className="text-xs text-stone-500 leading-relaxed mb-4">
                  {stage.desc}
                </p>
              </div>

              {/* Operations Bullet Chips */}
              <div className="pt-3 border-t border-stone-100 space-y-1.5">
                {stage.operations.slice(0, 2).map((op, oIdx) => (
                  <div key={oIdx} className="text-[10px] text-stone-600 flex items-start gap-1.5 leading-tight font-medium">
                    <span className="text-[#EA580C] mt-0.5">&bull;</span>
                    <span className="truncate">{op}</span>
                  </div>
                ))}
              </div>

              {/* Connecting Desktop Arrow */}
              {idx < stages.length - 1 && (
                <div className="hidden lg:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full bg-white border border-[#EFE5DB] text-stone-400 items-center justify-center shadow-2xs pointer-events-none">
                  <ArrowRight className="w-3 h-3 text-stone-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive Deep-Dive Inspector Box for Selected Stage */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-5">
        
        {/* Detail Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFE5DB]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${current.iconBg} shadow-2xs`}>
              <CurrentIcon className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${current.badgeBg} ${current.badgeText}`}>
                  {current.phase} DEEP-DIVE INSPECTION
                </span>
                <span className="text-xs text-stone-400 font-mono">Stage {current.id + 1} of 5</span>
              </div>
              <h3 className="text-xl font-extrabold text-stone-900 tracking-tight mt-0.5">
                {current.title} &mdash; {current.tagline}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedStage((prev) => (prev > 0 ? prev - 1 : 4))}
              className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              &larr; Prev Stage
            </button>
            <button
              onClick={() => setSelectedStage((prev) => (prev < 4 ? prev + 1 : 0))}
              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <span>Next Stage</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 3-Column Inspection Grid: Operations, Rules, Live Data Transformation */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Col 1: Core Operations & Inputs/Outputs (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] space-y-3">
              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider block">
                Primary Algorithmic Tasks
              </span>
              <ul className="space-y-2">
                {current.operations.map((op, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-stone-800 leading-relaxed font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{op}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#EFE5DB] space-y-2 shadow-2xs">
              <div className="text-[10px] font-mono uppercase font-bold text-stone-500">Inputs &amp; Preconditions</div>
              <p className="text-xs text-stone-700 font-mono leading-relaxed bg-[#FAF7F2] p-2.5 rounded-xl border border-stone-200/60">
                {current.inputs}
              </p>
              <div className="text-[10px] font-mono uppercase font-bold text-stone-500 pt-1">Resulting State</div>
              <p className="text-xs text-stone-700 font-mono leading-relaxed bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/60 text-emerald-900">
                {current.outputs}
              </p>
            </div>
          </div>

          {/* Col 2: Strict Enforcement Invariants (4 cols) */}
          <div className="md:col-span-4 p-4 rounded-2xl bg-white border border-[#EFE5DB] flex flex-col justify-between shadow-2xs">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#EA580C] uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <ShieldAlert className="w-3.5 h-3.5 text-[#EA580C]" />
                Zero-Trust Audit Invariants
              </span>
              <div className="space-y-2.5">
                {current.rules.map((rule, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#FFF9F5] border border-[#F6DCD0] text-xs text-stone-800 leading-relaxed">
                    <span className="font-bold text-[#EA580C] mr-1.5 font-mono">[{idx + 1}]</span>
                    {rule}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-stone-400" />
              <span>Evaluated deterministically in Medallion Gold engine</span>
            </div>
          </div>

          {/* Col 3: Live Data Transformation Trace (4 cols) */}
          <div className="md:col-span-4 p-4 rounded-2xl bg-stone-950 text-stone-200 border border-stone-800 flex flex-col justify-between shadow-sm font-mono">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-800">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  Live Execution Trace
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                  PASS
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 block uppercase font-semibold">Incoming Claim / Payload</span>
                  <div className="text-stone-300 text-[11px] bg-stone-900/90 p-2.5 rounded-xl border border-stone-800 mt-1 leading-relaxed break-all">
                    {current.sampleInput}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-amber-400 block uppercase font-semibold">AEGIS Internal Processing</span>
                  <div className="text-stone-300 text-[11px] bg-stone-900/90 p-2.5 rounded-xl border border-stone-800 mt-1 leading-relaxed">
                    {current.sampleAction}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-emerald-400 block uppercase font-semibold">Grounded Output Artifact</span>
                  <div className="text-emerald-300 text-[11px] bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/40 mt-1 leading-relaxed break-all font-semibold">
                    {current.sampleOutput}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-800 text-[10px] text-stone-500 flex items-center justify-between">
              <span>Deterministic Validation</span>
              <span className="text-emerald-400 font-bold">&check; 0 Hallucination</span>
            </div>
          </div>

        </div>

      </div>

    </section>
  );
};
