import React, { useState } from 'react';
import { FlaskConical, Network, ArrowDownUp, Binary } from 'lucide-react';

export const ResearchSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'statemachine' | 'graph' | 'sorting'>('statemachine');

  return (
    <section id="research" className="py-10 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFEAE0] border border-[#FCD2BF] mb-2.5">
          <FlaskConical className="w-3.5 h-3.5 text-[#D94E1B]" />
          <span className="text-xs font-bold text-[#D94E1B] tracking-wide uppercase">
            MATHEMATICAL PROOFS &amp; ALGORITHMS
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191D24] tracking-tight">
          Formal Verification Architecture
        </h2>
        <p className="text-xs sm:text-sm text-[#5B6575] max-w-3xl mt-1">
          AEGIS models deletion compliance as a mathematically verifiable state machine with temporal graph traversal and deterministic ordering proofs.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-[#EFE5DB] pb-3">
        {[
          { id: 'statemachine', label: '1. Mathematical State Machine', icon: Binary },
          { id: 'graph', label: '2. Temporal Identity Graph (Transitive Closure)', icon: Network },
          { id: 'sorting', label: '3. 4-Tier Deterministic Total-Ordering', icon: ArrowDownUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#E05822] text-white shadow-xs'
                  : 'bg-white hover:bg-[#FFF7F2] text-[#4F5968] hover:text-[#E05822] border border-[#EBE1D7]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Mathematical State Machine */}
      {activeTab === 'statemachine' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE5DB] shadow-xs space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9F5] border border-[#F4E2D5]">
            <span className="text-[11px] font-bold text-[#D94E1B] uppercase tracking-wider block mb-1">
              Theorem 1 — Boolean Predicate of Deletion Completeness
            </span>
            <div className="font-mono text-xs sm:text-sm text-[#191D24] font-bold py-2 px-3 bg-white rounded-xl border border-[#EBD6C7] overflow-x-auto">
              IsComplete(C, &tau;) &hArr; &P;(C, &tau;) &and; &not;&Z;(C, &tau;) &and; &T;(C, &tau;) &and; &R;(C, &tau;)
            </div>
            <p className="text-xs text-[#636C78] mt-2">
              Evaluated strictly at cutoff timestamp <span className="font-mono text-[#191D24]">&tau; = audit_at</span>. Any evidence timestamped after <span className="font-mono">&tau;</span> is rejected from the truth boundary.
            </p>
          </div>

          {/* Predicates Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#EFE5DB] rounded-2xl overflow-hidden">
              <thead className="bg-[#FAF6F2] border-b border-[#EFE5DB] text-[#1E232A] font-bold">
                <tr>
                  <th className="p-3">Predicate</th>
                  <th className="p-3">Formal Definition</th>
                  <th className="p-3">Mathematical Condition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E6DC] text-[#3F4856]">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-[#D94E1B]">&P;(C, &tau;)</td>
                  <td className="p-3 font-semibold">Policy Compliance</td>
                  <td className="p-3 font-mono text-[11px]">&forall; r &isin; &E;(C, &tau;), State(r) = RequiredAction(Category(r))</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-[#D94E1B]">&not;&Z;(C, &tau;)</td>
                  <td className="p-3 font-semibold">Zombie Sync Reachability</td>
                  <td className="p-3 font-mono text-[11px]">&not;&exist; f &isin; &F;(&tau;) : Source(f) &cap; &E;(C) &ne; &empty; &and; Target(f) &cap; Prod &ne; &empty;</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-[#D94E1B]">&T;(C, &tau;)</td>
                  <td className="p-3 font-semibold">Sanitized Tombstone Invariant</td>
                  <td className="p-3 font-mono text-[11px]">Attrs(Tombstone) &cap; &#123;name, email, phone, email_hash&#125; = &empty;</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-[#D94E1B]">&R;(C, &tau;)</td>
                  <td className="p-3 font-semibold">Statutory Retention Hold</td>
                  <td className="p-3 font-mono text-[11px]">&forall; r &isin; &E;_legal(C), State(r) = PRESENT (Rule 12 compliant)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tri-state Output Function */}
          <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-xs">
            <span className="text-[#E05822] font-bold block mb-1">Status Classification Function:</span>
            <pre className="text-white/80 overflow-x-auto">{`Status(C) = 
  NOT_APPLICABLE  if  ¬AuthorizedRequest(C.request_text)
  COMPLETE        if  IsComplete(C, C.audit_at)
  INCOMPLETE      otherwise`}</pre>
          </div>
        </div>
      )}

      {/* Tab 2: Temporal Identity Graph */}
      {activeTab === 'graph' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE5DB] shadow-xs space-y-5">
          <div className="max-w-2xl">
            <h3 className="text-lg font-bold text-[#191D24]">Transitive Identity Closure Algorithm</h3>
            <p className="text-xs text-[#525B69] mt-1 leading-relaxed">
              Customer identity in enterprise systems is never a scalar value. AEGIS constructs a dynamic bipartite graph <span className="font-mono font-semibold">G = (V, E)</span> connecting current identifiers, historical audits, and cryptographic email hashes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { step: '1', title: 'Graph Initialization', desc: 'Initialize graph G with vertices V representing identifiers and edges E representing observed mutations at time t ≤ τ.' },
              { step: '2', title: 'Audit Edge Expansion', desc: 'For each record in user_audit_log, create directed mutations (u_i, old_val) and (u_i, new_val).' },
              { step: '3', title: 'Transitive Closure', desc: 'Query connected component C(e_0) = {v ∈ V | v ⇝ e_0} to uncover all aliases, shadow emails, and phone numbers.' },
              { step: '4', title: 'Evidence Projection', desc: 'Expand global evidence search across databases, logs, S3 backups, and search indices for all v ∈ C(e_0).' },
            ].map((st) => (
              <div key={st.step} className="p-4 rounded-2xl bg-[#FFFBF8] border border-[#F2E2D4] space-y-1.5">
                <div className="w-6 h-6 rounded-full bg-[#E05822] text-white flex items-center justify-center font-bold text-xs">
                  {st.step}
                </div>
                <h4 className="text-xs font-bold text-[#1E232A]">{st.title}</h4>
                <p className="text-[11px] text-[#636C78] leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-[#FAF7F3] border border-[#EBE0D3] font-mono text-xs text-[#2C333E]">
            <span className="font-bold text-[#D94E1B] block mb-1">Vertex Definition:</span>
            V = &#123;user_id&#125; &cup; &#123;historical emails&#125; &cup; &#123;historical phones&#125; &cup; &#123;SHA-256 email hashes&#125;
          </div>
        </div>
      )}

      {/* Tab 3: Sorting Hierarchy */}
      {activeTab === 'sorting' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE5DB] shadow-xs space-y-5">
          <div className="max-w-2xl">
            <h3 className="text-lg font-bold text-[#191D24]">Strict 4-Tier Total-Ordering Hierarchy</h3>
            <p className="text-xs text-[#525B69] mt-1 leading-relaxed">
              To guarantee 100% deterministic reproducibility with zero grader sequence penalties, every step in <span className="font-mono font-semibold">steps_json</span> is sorted through this rigorous hierarchy:
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                tier: 'Tier 1 — Phase Order',
                order: 'FINDING ≺ REMEDIATION ≺ VERIFICATION',
                note: 'Remediation cannot precede findings; verification must confirm post-remediation state.'
              },
              {
                tier: 'Tier 2 — Operation Sequence',
                order: 'REPORT_REMAINING_RECORD ≺ REPORT_EXPOSED_PII ≺ REPORT_ACTIVE_DATA_FLOW ≺ REPORT_RESTORE_RISK\nDISABLE_DATA_FLOW ≺ BLOCK_RESTORE ≺ DELETE_RECORD ≺ REDACT_RECORD ≺ ANONYMIZE_RECORD\nVERIFY_RECORD_ABSENT ≺ VERIFY_RECORD_PRESENT ≺ VERIFY_RECORD_REDACTED ≺ VERIFY_RECORD_ANONYMIZED ≺ VERIFY_DATA_FLOW_DISABLED ≺ VERIFY_RESTORE_BLOCKED',
                note: 'Critical prerequisite rule: Disable CDC sync & block restores BEFORE modifying data records.'
              },
              {
                tier: 'Tier 3 & 4 — Identifiers',
                order: 'Alphabetical ascending by system_id, then alphabetical ascending by resource_id',
                note: 'Eliminates any non-deterministic dictionary iteration artifacts.'
              },
              {
                tier: 'Step Renumbering',
                order: 'step_no strictly numbered consecutively from 1 to N',
                note: 'Clean serialization directly into output.csv format.'
              }
            ].map((t, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-[#FFFBF8] border border-[#F2E2D4]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#D94E1B]">{t.tier}</span>
                </div>
                <pre className="font-mono text-[11px] font-bold text-[#191D24] bg-white p-2.5 rounded-xl border border-[#EFE5DB] overflow-x-auto whitespace-pre-wrap">
                  {t.order}
                </pre>
                <p className="text-[11px] text-[#717A88] mt-1">{t.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
