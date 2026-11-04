import React, { useState } from 'react';
import { 
  Database, Fingerprint, GitBranch, ShieldCheck, 
  FlaskConical, CheckCircle2
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const [activeStage, setActiveStage] = useState(0);

  const stages = [
    {
      num: '01',
      title: 'Ingest & Normalize Evidence',
      icon: Database,
      tagline: 'Standardizing evidence across SQL databases, logs, support tickets, and storage dumps.',
      description: 'AEGIS ingests SQL dumps from account services and read replicas, parses support desk conversations, indexes elastic documents, and catalogs snapshot schedules into a unified temporal store.',
      invariants: [
        'Enforces temporal admissibility: captured_at <= audit_at',
        'Extracts table snapshots into in-memory SQLite schema',
        'Indexes attachment file hashes and support message metadata'
      ],
      codeSnippet: `def check_admissibility(file_id, audit_at):
    evidence_meta = catalog.get(file_id)
    if evidence_meta.captured_at > audit_at:
        return False  # Strict post-audit exclusion
    return True`
    },
    {
      num: '02',
      title: 'Resolve Identity Graph',
      icon: Fingerprint,
      tagline: 'Linking current and historical identifiers across aliases and audit trails.',
      description: 'Account holders change their emails, phone numbers, and payment details over time. AEGIS traverses the temporal identity graph to link past email addresses and secondary identifiers to the subject.',
      invariants: [
        'Transitive closure over user_identities and user_audit_log',
        'Resolves secondary emails and phone numbers to canonical user_id',
        'Ensures queries cover every alias used by the customer'
      ],
      codeSnippet: `G = nx.Graph()
for audit in user_audit_log:
    G.add_edge(audit.user_id, audit.old_value)
    G.add_edge(audit.user_id, audit.new_value)
connected_aliases = nx.node_connected_component(G, target_email)`
    },
    {
      num: '03',
      title: 'Analyze & Trace Lineage',
      icon: GitBranch,
      tagline: 'Mapping data flow reachability and detecting zombie sync loops.',
      description: 'Even when the primary database drops a record, background synchronization processes (CDC syncs, failover mirror scripts, batch exports) can recreate the record or leak data downstream.',
      invariants: [
        'Traces system_activity.csv for replication vectors',
        'Flags active restore paths on cold backups',
        'Detects zombie sync jobs capable of re-inserting deleted rows'
      ],
      codeSnippet: `for flow in active_data_flows:
    if flow.source_has_record and flow.target_wiped:
        report_active_data_flow(flow.system_id, state="ACTIVE")
        plan_remediation("DISABLE_DATA_FLOW", state="DISABLED")`
    },
    {
      num: '04',
      title: 'Apply Deletion Policy Matrix',
      icon: ShieldCheck,
      tagline: 'Compiling Rules 01–15 into strict deterministic actions.',
      description: 'AEGIS compares every discovered record against the policy matrix to determine whether it must be DELETED, REDACTED, ANONYMIZED, or RETAINED under statutory legal holds.',
      invariants: [
        'Rule 01: User Profile -> DELETE',
        'Rule 05: Support Message with shared context -> REDACT',
        'Rule 12: Security Audit Log -> RETAIN',
        'Rule 15: Account Tombstone -> Strip all PII, retain only user_id'
      ],
      codeSnippet: `action = policy_engine.evaluate(data_category, context)
# Evaluates: DELETE, REDACT, ANONYMIZE, RETAIN
if context.is_security_audit_log and within_retention_period:
    return "RETAIN"`
    },
    {
      num: '05',
      title: 'Simulate & Verify',
      icon: FlaskConical,
      tagline: 'Validating remediation plans before producing output.csv.',
      description: 'Before producing the final audit plan, AEGIS simulates the remediation steps to confirm that data cannot return and generates deterministic verification steps for audit proof.',
      invariants: [
        'Applies negative restore filters on backup archives',
        'Verifies tombstone contains zero direct PII (name, email, phone)',
        'Outputs sorted 3-phase sequence: FINDING -> REMEDIATION -> VERIFICATION'
      ],
      codeSnippet: `sim = RemediationSimulator()
sim.apply_remediations(remediation_steps)
assert sim.verify_no_zombie_sync() == True
assert sim.verify_all_prohibited_records_absent() == True`
    }
  ];

  const current = stages[activeStage];
  const Icon = current.icon;

  return (
    <div className="min-h-screen py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Page Title */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-black uppercase tracking-widest text-[#E05822] block mb-2">
          Investigation Methodology
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-[#191D24] tracking-tight">
          How AEGIS Works
        </h1>
        <p className="text-base text-[#5B6575] mt-3">
          A multi-stage, evidence-first forensic audit that turns an ambiguous deletion request into a verified, deterministic outcome.
        </p>
      </div>

      {/* Stage Navigation Pills */}
      <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2">
        {stages.map((st, idx) => (
          <button
            key={st.num}
            onClick={() => setActiveStage(idx)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeStage === idx
                ? 'bg-[#E05822] text-white shadow-md shadow-orange-500/25'
                : 'bg-white text-slate-600 hover:bg-[#FAF6F2] border border-[#EFE5DB]'
            }`}
          >
            <span>Stage {st.num}</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="hidden sm:inline">{st.title.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Active Stage Detailed Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EFE5DB] shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Narrative & Invariants */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0E7] text-[#E05822] flex items-center justify-center font-bold">
              <Icon className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#E05822] uppercase tracking-wider block">
                Stage {current.num} Pipeline Execution
              </span>
              <h2 className="text-2xl font-black text-[#191D24]">
                {current.title}
              </h2>
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
            {current.tagline}
          </p>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {current.description}
          </p>

          {/* Key Invariants */}
          <div className="p-5 rounded-2xl bg-[#FCFAF7] border border-[#EFE5DB] space-y-2.5">
            <span className="text-xs font-bold uppercase text-[#7C2D12] block mb-1">
              Guaranteed Invariants & Constraints:
            </span>
            {current.invariants.map((inv, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{inv}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Technical Code & Grammar Spec */}
        <div className="lg:col-span-5 bg-[#181B20] text-slate-200 p-6 rounded-2xl border border-slate-800 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
            <span>aegis/core/stage_{current.num}.py</span>
            <span className="text-emerald-400 font-bold">PASSING</span>
          </div>

          <pre className="text-emerald-300 overflow-x-auto py-2 leading-relaxed text-[11px]">
            {current.codeSnippet}
          </pre>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
            <span>Deterministic Python 3.11</span>
            <span>Zero Hallucination Guarantee</span>
          </div>
        </div>

      </div>

    </div>
  );
};
