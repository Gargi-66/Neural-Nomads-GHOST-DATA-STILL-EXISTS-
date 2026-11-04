import React from 'react';

export const ResearchPage: React.FC = () => {
  return (
    <div className="min-h-screen py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Title */}
      <div className="max-w-3xl">
        <span className="text-xs font-black uppercase tracking-widest text-[#E05822] block mb-2">
          Theoretical Foundations
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-[#191D24] tracking-tight">
          Research & Mathematical Proofs
        </h1>
        <p className="text-base text-[#5B6575] mt-3">
          The mathematical state machine, temporal DAG reachability algorithms, and deterministic sorting proofs powering AEGIS.
        </p>
      </div>

      {/* 1. Mathematical State Machine */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE5DB] shadow-md space-y-4">
        <h2 className="text-xl sm:text-2xl font-black text-[#191D24]">
          1. The 4 Mandatory Conditions for Complete Deletion
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          In AEGIS, a case determination is strictly formulated as a boolean predicate <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[#E05822]">IsComplete(Case, audit_at)</code> evaluated at timestamp <code className="font-mono">audit_at</code>:
        </p>

        <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#EFE5DB] font-mono text-xs text-slate-800 leading-relaxed overflow-x-auto">
          IsComplete(C, t) &hArr; PolicyCompliance(C, t) &and; &not;ZombieSync(C, t) &and; SanitizedTombstone(C, t) &and; LegalRetention(C, t)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-white border border-[#EFE5DB] space-y-1">
            <span className="font-bold text-xs text-slate-900 block">Condition 1: Policy Compliance</span>
            <p className="text-xs text-slate-600">Every resource associated with the subject's identity graph strictly matches the required state in Rules 01–15.</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[#EFE5DB] space-y-1">
            <span className="font-bold text-xs text-slate-900 block">Condition 2: No Zombie Sync</span>
            <p className="text-xs text-slate-600">No active background data flow or unblocked backup archive has reachability to re-create the deleted entity.</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[#EFE5DB] space-y-1">
            <span className="font-bold text-xs text-slate-900 block">Condition 3: Tombstone Sanitization</span>
            <p className="text-xs text-slate-600">The tombstone in account_service retains ONLY the stable internal user_id. Direct PII (name, email, phone) is strictly ABSENT.</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[#EFE5DB] space-y-1">
            <span className="font-bold text-xs text-slate-900 block">Condition 4: Statutory Legal Retention</span>
            <p className="text-xs text-slate-600">Statutorily protected security audit logs and legal hold records remain PRESENT in their required repositories.</p>
          </div>
        </div>
      </div>

      {/* 2. Strict Sorting Hierarchy */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE5DB] shadow-md space-y-4">
        <h2 className="text-xl sm:text-2xl font-black text-[#191D24]">
          2. Strict Step Ordering Hierarchy (Deterministic Grammar)
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Every remediation and verification sequence in <code className="font-mono">output.csv</code> is compiled through a deterministic total-ordering sort function:
        </p>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-[#FAF6F2] border border-[#EFE5DA] flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-[#E05822] text-white font-bold flex items-center justify-center shrink-0">1</span>
            <div>
              <span className="font-bold text-slate-900 block">Phase Order Sequence</span>
              <span className="font-mono text-slate-600">FINDING &rarr; REMEDIATION &rarr; VERIFICATION</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF6F2] border border-[#EFE5DA] flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-[#E05822] text-white font-bold flex items-center justify-center shrink-0">2</span>
            <div>
              <span className="font-bold text-slate-900 block">Operation Order Sequence</span>
              <div className="font-mono text-slate-600 text-[11px] mt-0.5 space-y-0.5">
                <div>FINDING: REPORT_REMAINING_RECORD &rarr; REPORT_EXPOSED_PII &rarr; REPORT_ACTIVE_DATA_FLOW &rarr; REPORT_RESTORE_RISK</div>
                <div>REMEDIATION: DISABLE_DATA_FLOW &rarr; BLOCK_RESTORE &rarr; DELETE_RECORD &rarr; REDACT_RECORD &rarr; ANONYMIZE_RECORD</div>
                <div>VERIFICATION: VERIFY_RECORD_ABSENT &rarr; VERIFY_RECORD_PRESENT &rarr; VERIFY_RECORD_REDACTED &rarr; VERIFY_RECORD_ANONYMIZED &rarr; VERIFY_DATA_FLOW_DISABLED &rarr; VERIFY_RESTORE_BLOCKED</div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF6F2] border border-[#EFE5DA] flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-[#E05822] text-white font-bold flex items-center justify-center shrink-0">3</span>
            <div>
              <span className="font-bold text-slate-900 block">Deterministic Tie-Breaker</span>
              <span className="font-mono text-slate-600">system_id ascending &rarr; resource_id ascending &rarr; step_no consecutive 1-indexed</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
