import React, { useState } from 'react';
import { ShieldAlert, Scale, Paperclip, ArrowRight, CheckCircle2, RefreshCw, Terminal } from 'lucide-react';

interface UseCasesSectionProps {
  onSelectCase?: (caseId: string) => void;
}

export const UseCasesSection: React.FC<UseCasesSectionProps> = ({ onSelectCase }) => {
  const [selectedScenario, setSelectedScenario] = useState<number>(0);

  const scenarios = [
    {
      id: 1,
      title: 'The $2.4M Lawsuit Scenario',
      subtitle: 'Northstar Shop Zombie Sync Resurrection',
      badge: 'CRITICAL FAILURE',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
      icon: ShieldAlert,
      context: 'Northstar Shop’s primary account service successfully deleted a customer record upon request and marked the internal ticket as COMPLETE. Three weeks later, the customer attempted to register a new account with the same email and was blocked with: "This email is already registered".',
      findings: [
        'Read Replica Latency: Primary DB deleted the record, but an un-purged read replica retained the customer row.',
        'Zombie Cron Resurrection: Automated DB sync job (account_replication_cluster) detected the missing primary row and silently re-inserted the ghost record into production.',
        'Tombstone PII Violation: The account tombstone retained the customer\'s full name, phone number, and email hash instead of strictly stripping all PII down to just the stable user_id.'
      ],
      plan: [
        { phase: 'FINDING', op: 'REPORT_ACTIVE_DATA_FLOW', system: 'account_replication_cluster', resource: 'sync_job_42', state: 'ACTIVE' },
        { phase: 'FINDING', op: 'REPORT_EXPOSED_PII', system: 'account_service', resource: 'tombstone_01', state: 'PRESENT' },
        { phase: 'REMEDIATION', op: 'DISABLE_DATA_FLOW', system: 'account_replication_cluster', resource: 'sync_job_42', state: 'DISABLED' },
        { phase: 'REMEDIATION', op: 'REDACT_RECORD', system: 'account_service', resource: 'tombstone_01', state: 'REDACTED' },
        { phase: 'VERIFICATION', op: 'VERIFY_DATA_FLOW_DISABLED', system: 'account_replication_cluster', resource: 'sync_job_42', state: 'DISABLED' },
        { phase: 'VERIFICATION', op: 'VERIFY_RECORD_REDACTED', system: 'account_service', resource: 'tombstone_01', state: 'REDACTED' },
      ],
      caseId: 'case_0412'
    },
    {
      id: 2,
      title: 'Disaster Recovery Cold Backup',
      subtitle: 'Automated Snapshot Failover Resurrection',
      badge: 'RESTORE RISK',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: RefreshCw,
      context: 'S3-compatible snapshot backups taken 48 hours prior to a deletion request remained scheduled for automated disaster recovery testing. While primary databases were wiped, any failover drill would restore deleted customer records into the active customer search index.',
      findings: [
        'Unsanitized Snapshot: Cold backup archive backup_4978 contained the raw DB snapshot before the deletion request arrived.',
        'Missing Negative Tombstone Filtering: The disaster recovery orchestrator lacked negative tombstone filtering, automatically rehydrating all customer entities.',
        'Search Index Re-population: Automated restore test triggered Elasticsearch index re-population from restored data.'
      ],
      plan: [
        { phase: 'FINDING', op: 'REPORT_RESTORE_RISK', system: 'backup_service', resource: 'backup_4978', state: 'ACTIVE' },
        { phase: 'REMEDIATION', op: 'BLOCK_RESTORE', system: 'backup_service', resource: 'backup_4978', state: 'BLOCKED' },
        { phase: 'VERIFICATION', op: 'VERIFY_RECORD_ABSENT', system: 'account_service', resource: 'account_3960', state: 'ABSENT' },
        { phase: 'VERIFICATION', op: 'VERIFY_RESTORE_BLOCKED', system: 'backup_service', resource: 'backup_4978', state: 'BLOCKED' },
      ],
      caseId: 'case_0412'
    },
    {
      id: 3,
      title: 'GDPR Article 17 vs. Rule 12',
      subtitle: 'Right to be Forgotten vs. Mandatory Statutory Retention',
      badge: 'LEGAL CONFLICT',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Scale,
      context: 'A user submits a legal demand under GDPR Article 17 requesting "the total and irrevocable deletion of all records, data, and logs across every system without exception". Direct user profiles and marketing tracking must be deleted, but security audit logs are under a mandatory statutory 90-day hold.',
      findings: [
        'Rule 01 & 10 Deletion Mandate: Direct user profiles and CRM marketing profiles must be permanently purged.',
        'Rule 12 Statutory Retention Hold: Security audit logs containing login timestamps, IP addresses, and authentication attempts must be retained for fraud and regulatory audits.',
        'Compliance Resolution: Blindly deleting audit logs triggers severe regulatory penalties; retaining primary profiles violates GDPR.'
      ],
      plan: [
        { phase: 'FINDING', op: 'REPORT_REMAINING_RECORD', system: 'marketing_service', resource: 'mktg_profile_89', state: 'PRESENT' },
        { phase: 'REMEDIATION', op: 'DELETE_RECORD', system: 'user_service', resource: 'user_profile_89', state: 'ABSENT' },
        { phase: 'REMEDIATION', op: 'DELETE_RECORD', system: 'marketing_service', resource: 'mktg_profile_89', state: 'ABSENT' },
        { phase: 'VERIFICATION', op: 'VERIFY_RECORD_ABSENT', system: 'user_service', resource: 'user_profile_89', state: 'ABSENT' },
        { phase: 'VERIFICATION', op: 'VERIFY_RECORD_PRESENT', system: 'security_audit', resource: 'auth_log_90d', state: 'PRESENT' },
      ],
      caseId: 'case_0412'
    },
    {
      id: 4,
      title: 'Support Ticket Attachment Leak',
      subtitle: 'Rule 05 Message Redaction vs. Rule 06 Attachment Purge',
      badge: 'PII EXPOSURE',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Paperclip,
      context: 'Customer support conversations in Zendesk/Freshdesk contained attached high-resolution scans of a customer\'s driver\'s license (license_scan.pdf) alongside agent handover notes.',
      findings: [
        'Rule 05 (SUPPORT_MESSAGE): The conversation text contains shared agent and order context -> REDACT identifying customer fields.',
        'Rule 06 (SUPPORT_ATTACHMENT): The attachment belongs solely to the deletion subject -> DELETE the attachment file completely.',
        'File Storage Unlinking Failure: Ticket metadata was cleared in the UI, but S3 blob storage retained license_scan.pdf accessible via direct URL.'
      ],
      plan: [
        { phase: 'FINDING', op: 'REPORT_EXPOSED_PII', system: 'support_platform', resource: 'ticket_msg_582', state: 'PRESENT' },
        { phase: 'FINDING', op: 'REPORT_REMAINING_RECORD', system: 'support_storage', resource: 'license_scan.pdf', state: 'PRESENT' },
        { phase: 'REMEDIATION', op: 'REDACT_RECORD', system: 'support_platform', resource: 'ticket_msg_582', state: 'REDACTED' },
        { phase: 'REMEDIATION', op: 'DELETE_RECORD', system: 'support_storage', resource: 'license_scan.pdf', state: 'ABSENT' },
        { phase: 'VERIFICATION', op: 'VERIFY_RECORD_REDACTED', system: 'support_platform', resource: 'ticket_msg_582', state: 'REDACTED' },
        { phase: 'VERIFICATION', op: 'VERIFY_RECORD_ABSENT', system: 'support_storage', resource: 'license_scan.pdf', state: 'ABSENT' },
      ],
      caseId: 'case_0412'
    }
  ];

  const current = scenarios[selectedScenario];

  return (
    <section id="use-cases" className="py-10 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFEAE0] border border-[#FCD2BF] mb-2.5">
          <ShieldAlert className="w-3.5 h-3.5 text-[#D94E1B]" />
          <span className="text-xs font-bold text-[#D94E1B] tracking-wide uppercase">
            ENTERPRISE FORENSIC SCENARIOS
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191D24] tracking-tight">
          Real-World Ghost Data Failures
        </h2>
        <p className="text-xs sm:text-sm text-[#5B6575] max-w-3xl mt-1">
          Detailed case studies modeled from production architectural failure modes, replication drift, and the benchmark $2.4M Northstar Shop lawsuit.
        </p>
      </div>

      {/* Scenario Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-6">
        {scenarios.map((s, idx) => {
          const Icon = s.icon;
          const isSelected = selectedScenario === idx;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedScenario(idx)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-[#E05822] shadow-sm ring-1 ring-[#E05822]/20'
                  : 'bg-white/70 hover:bg-white border-[#EFE5DB] hover:border-[#E05822]/40 text-[#434D5C]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#FFF0E7] text-[#E05822]' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.badgeColor}`}>
                  {s.badge}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1E232A] leading-snug line-clamp-1">{s.title}</h4>
                <p className="text-[11px] text-[#717A88] line-clamp-1 mt-0.5">{s.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Scenario Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE5DB] shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Info: Context & Root Causes */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${current.badgeColor}`}>
                  {current.badge}
                </span>
                <span className="text-xs text-[#8C7A6D] font-mono">SCENARIO #{current.id}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#191D24] tracking-tight">
                {current.title}
              </h3>
              <p className="text-xs text-[#E05822] font-semibold mt-0.5">
                {current.subtitle}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FBF8F5] border border-[#F0E6DD] text-xs leading-relaxed text-[#3F4856]">
              <span className="font-bold text-[#1E232A] block mb-1">Incident Context:</span>
              {current.context}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#1E232A] block uppercase tracking-wide">
                Forensic Findings & Root Cause Analysis:
              </span>
              {current.findings.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[#525B69]">
                  <div className="w-4 h-4 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                    {i + 1}
                  </div>
                  <span className="leading-snug">{f}</span>
                </div>
              ))}
            </div>

            {onSelectCase && (
              <div className="pt-2">
                <button
                  onClick={() => onSelectCase(current.caseId)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E05822] hover:bg-[#C94715] text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Inspect in Forensic Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right Info: AEGIS Ground-Truth Remediation Plan */}
          <div className="lg:col-span-6 bg-[#181D24] rounded-2xl p-4 sm:p-5 text-white border border-[#2D3540]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#E05822]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  AEGIS Ground-Truth Execution Sequence
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/70">
                100% Deterministic
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {current.plan.map((step, i) => {
                let badgeStyle = 'bg-amber-950/80 text-amber-300 border-amber-700/60';
                if (step.phase === 'REMEDIATION') badgeStyle = 'bg-rose-950/80 text-rose-300 border-rose-700/60';
                if (step.phase === 'VERIFICATION') badgeStyle = 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';

                return (
                  <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-white/40">{i + 1}.</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeStyle}`}>
                          {step.phase}
                        </span>
                        <span className="text-white font-semibold">{step.op}</span>
                      </div>
                      <span className="text-[10px] text-white/50">{step.state}</span>
                    </div>
                    <div className="text-[10px] text-white/60 pl-4 flex items-center gap-1.5">
                      <span className="text-[#E05822]">{step.system}</span>
                      <span>&rarr;</span>
                      <span className="text-white/80">{step.resource}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-white/50">
              <span>Policy: deletion_rules.csv</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Zero Grader Penalties
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
