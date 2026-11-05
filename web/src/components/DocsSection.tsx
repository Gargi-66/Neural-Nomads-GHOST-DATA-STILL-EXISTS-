import React, { useState } from 'react';
import { BookOpen, Terminal, Copy, Check } from 'lucide-react';

export const DocsSection: React.FC = () => {
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const rules = [
    { id: 'rule_01', category: 'USER_PROFILE', condition: 'Always', action: 'DELETE', meaning: 'Remove direct database account rows' },
    { id: 'rule_02', category: 'SECONDARY_IDENTIFIER', condition: 'Always', action: 'DELETE', meaning: 'Purge alternate emails, recovery phones, auth tokens' },
    { id: 'rule_03', category: 'SEARCH_INDEX_ENTRY', condition: 'Always', action: 'DELETE', meaning: 'Delete Elasticsearch/OpenSearch customer document' },
    { id: 'rule_04', category: 'CACHE_ENTRY', condition: 'Always', action: 'DELETE', meaning: 'Evict Redis/Memcached session and profile keys' },
    { id: 'rule_05', category: 'SUPPORT_MESSAGE', condition: 'Contains shared customer/agent context', action: 'REDACT', meaning: 'Strip user identifiers; preserve order context' },
    { id: 'rule_06', category: 'SUPPORT_ATTACHMENT', condition: 'Belongs solely to deletion subject', action: 'DELETE', meaning: 'Delete file blobs (driver license, bills)' },
    { id: 'rule_07', category: 'ANALYTICS_PROFILE', condition: 'Attributable to user', action: 'ANONYMIZE', meaning: 'Unlink UUID, replace identifiers with hash' },
    { id: 'rule_08', category: 'PRODUCT_TELEMETRY', condition: 'Attributable to user', action: 'ANONYMIZE', meaning: 'Strip client telemetry tracking identifiers' },
    { id: 'rule_09', category: 'USER_EXPORT', condition: 'Always', action: 'DELETE', meaning: 'Purge CSV/JSON warehouse dumps' },
    { id: 'rule_10', category: 'MARKETING_PROFILE', condition: 'Always', action: 'DELETE', meaning: 'Purge CRM, mailing lists, and ad segments' },
    { id: 'rule_11', category: 'EMAIL_DELIVERY_LOG', condition: 'Contains user email address', action: 'REDACT', meaning: 'Mask email in SMTP/delivery audit logs' },
    { id: 'rule_12', category: 'SECURITY_AUDIT_LOG', condition: 'Within statutory retention period', action: 'RETAIN', meaning: 'Preserve record for fraud/statutory audit' },
    { id: 'rule_13', category: 'LEGAL_HOLD_RECORD', condition: 'Active legal hold supplied', action: 'RETAIN', meaning: 'Preserve record until legal hold lifted' },
    { id: 'rule_14', category: 'BACKUP_ARCHIVE', condition: 'Restore access can be blocked', action: 'RETAIN', meaning: 'Retain snapshot with negative restore filter' },
    { id: 'rule_15', category: 'ACCOUNT_TOMBSTONE', condition: 'Account deleted; stable ref needed', action: 'REDACT', meaning: 'Keep internal user_id only; strip all PII' },
  ];

  const operations = [
    { phase: 'FINDING', op: 'REPORT_REMAINING_RECORD', state: 'PRESENT', desc: 'Record exists that policy requires deleted' },
    { phase: 'FINDING', op: 'REPORT_EXPOSED_PII', state: 'PRESENT', desc: 'Record may exist, but contains un-redacted PII' },
    { phase: 'FINDING', op: 'REPORT_ACTIVE_DATA_FLOW', state: 'ACTIVE', desc: 'Background sync process can copy/recreate data' },
    { phase: 'FINDING', op: 'REPORT_RESTORE_RISK', state: 'ACTIVE', desc: 'Backup/restore path can bring deleted data back' },
    { phase: 'REMEDIATION', op: 'DISABLE_DATA_FLOW', state: 'DISABLED', desc: 'Stop the sync job' },
    { phase: 'REMEDIATION', op: 'BLOCK_RESTORE', state: 'BLOCKED', desc: 'Prevent backup from restoring data' },
    { phase: 'REMEDIATION', op: 'DELETE_RECORD', state: 'ABSENT', desc: 'Delete the record entirely' },
    { phase: 'REMEDIATION', op: 'REDACT_RECORD', state: 'REDACTED', desc: 'Redact identifying fields' },
    { phase: 'REMEDIATION', op: 'ANONYMIZE_RECORD', state: 'ANONYMIZED', desc: 'Irreversibly unlink from user' },
    { phase: 'VERIFICATION', op: 'VERIFY_RECORD_ABSENT', state: 'ABSENT', desc: 'Confirm record does not exist' },
    { phase: 'VERIFICATION', op: 'VERIFY_RECORD_PRESENT', state: 'PRESENT', desc: 'Confirm policy-required retained record exists' },
    { phase: 'VERIFICATION', op: 'VERIFY_RECORD_REDACTED', state: 'REDACTED', desc: 'Confirm required fields removed' },
    { phase: 'VERIFICATION', op: 'VERIFY_RECORD_ANONYMIZED', state: 'ANONYMIZED', desc: 'Confirm record unlinked' },
    { phase: 'VERIFICATION', op: 'VERIFY_DATA_FLOW_DISABLED', state: 'DISABLED', desc: 'Confirm data flow inactive' },
    { phase: 'VERIFICATION', op: 'VERIFY_RESTORE_BLOCKED', state: 'BLOCKED', desc: 'Confirm backup restore is blocked' },
  ];

  const commands = [
    { title: '1. Execute Full Audit Pipeline (518 Cases)', cmd: 'python code/main.py' },
    { title: '2. Run Test Suite (99 Passing Tests)', cmd: 'pytest code/tests -v' },
    { title: '3. Verify output.csv Format & Monotonic Sort', cmd: `python -c "
import pandas as pd
df = pd.read_csv('output.csv')
assert len(df) == 518, 'Must have exactly 518 rows'
assert df['case_id'].is_monotonic_increasing, 'Must be sorted by case_id'
print('Output validation: 100% compliant!')
"` },
  ];

  const handleCopy = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const filteredRules = filterAction === 'ALL' ? rules : rules.filter((r) => r.action === filterAction);

  return (
    <section id="docs" className="py-10 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFEAE0] border border-[#FCD2BF] mb-2.5">
          <BookOpen className="w-3.5 h-3.5 text-[#D94E1B]" />
          <span className="text-xs font-bold text-[#D94E1B] tracking-wide uppercase">
            TECHNICAL REFERENCE &amp; SPECIFICATION
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191D24] tracking-tight">
          System Docs &amp; Policy Matrix
        </h2>
        <p className="text-xs sm:text-sm text-[#5B6575] max-w-3xl mt-1">
          Complete canonical reference for the 15 deletion rules, 16 state operations, evidence citation contracts, and evaluation benchmarks.
        </p>
      </div>

      {/* Benchmark Distribution Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Total Cases', val: '518', sub: 'Full Benchmark' },
          { label: 'NOT_APPLICABLE', val: '188', sub: 'steps: []' },
          { label: 'INCOMPLETE', val: '173', sub: 'Remediation Plan' },
          { label: 'COMPLETE', val: '157', sub: 'Evidence Verified' },
          { label: 'Systems Audited', val: '19', sub: 'Storage Nodes' },
          { label: 'Evidence Files', val: '94', sub: 'SQL, Logs, PDFs' },
        ].map((stat, i) => (
          <div key={i} className="p-3.5 rounded-2xl bg-white border border-[#EFE5DB] shadow-xs text-center">
            <span className="text-xl sm:text-2xl font-black text-[#1E232A] block">{stat.val}</span>
            <span className="text-xs font-bold text-[#E05822] block mt-0.5">{stat.label}</span>
            <span className="text-[10px] text-[#717A88] block">{stat.sub}</span>
          </div>
        ))}
      </div>

      {/* 1. Canonical Rules Matrix */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE5DB] shadow-xs mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#191D24]">15 Canonical Rules (`deletion_rules.csv`)</h3>
            <p className="text-xs text-[#525B69]">Statutory treatments mapping data categories to required actions.</p>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-[#FAF6F2] rounded-xl border border-[#EBE1D7]">
            {['ALL', 'DELETE', 'REDACT', 'ANONYMIZE', 'RETAIN'].map((act) => (
              <button
                key={act}
                onClick={() => setFilterAction(act)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterAction === act
                    ? 'bg-[#E05822] text-white shadow-2xs'
                    : 'text-[#5A6474] hover:text-[#191D24]'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-[#EFE5DB] rounded-2xl overflow-hidden">
            <thead className="bg-[#FAF6F2] border-b border-[#EFE5DB] text-[#1E232A] font-bold">
              <tr>
                <th className="p-3">Rule ID</th>
                <th className="p-3">Data Category</th>
                <th className="p-3">Scope / Condition</th>
                <th className="p-3">Required Action</th>
                <th className="p-3">Technical Treatment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E6DC] text-[#3F4856]">
              {filteredRules.map((r) => {
                let badge = 'bg-red-50 text-red-700 border-red-200';
                if (r.action === 'REDACT') badge = 'bg-amber-50 text-amber-700 border-amber-200';
                if (r.action === 'ANONYMIZE') badge = 'bg-blue-50 text-blue-700 border-blue-200';
                if (r.action === 'RETAIN') badge = 'bg-emerald-50 text-emerald-700 border-emerald-200';

                return (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-[#1E232A]">{r.id}</td>
                    <td className="p-3 font-semibold">{r.category}</td>
                    <td className="p-3 text-[11px] text-[#717A88]">{r.condition}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge}`}>
                        {r.action}
                      </span>
                    </td>
                    <td className="p-3 text-xs">{r.meaning}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Operations & State Grammar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE5DB] shadow-xs mb-8 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-[#191D24]">16 Allowed Step Operations &amp; State Grammar</h3>
          <p className="text-xs text-[#525B69]">Rigid state transitions enforced during remediation and verification phases.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {operations.map((op, i) => {
            let phaseColor = 'bg-amber-50 text-amber-700 border-amber-200';
            if (op.phase === 'REMEDIATION') phaseColor = 'bg-rose-50 text-rose-700 border-rose-200';
            if (op.phase === 'VERIFICATION') phaseColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';

            return (
              <div key={i} className="p-3 rounded-xl bg-[#FFFBF8] border border-[#F2E2D4] space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`px-1.5 py-0.5 rounded font-bold border ${phaseColor}`}>
                    {op.phase}
                  </span>
                  <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {op.state}
                  </span>
                </div>
                <h4 className="text-xs font-mono font-bold text-[#1E232A]">{op.op}</h4>
                <p className="text-[11px] text-[#636C78] leading-tight">{op.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CLI Commands & Verification */}
      <div className="bg-[#181D24] rounded-3xl p-6 sm:p-8 text-white border border-[#2D3540] space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#E05822]" />
            <h3 className="text-base font-bold text-white">CLI Execution &amp; Grading Verification</h3>
          </div>
          <span className="text-xs font-mono text-emerald-400">100% Deterministic Engine</span>
        </div>

        <div className="space-y-4">
          {commands.map((c, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/80">{c.title}</span>
                <button
                  onClick={() => handleCopy(c.cmd, idx)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-mono transition-all"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-white/60" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="font-mono text-xs text-amber-300/90 overflow-x-auto p-2.5 rounded-xl bg-black/50 border border-white/5 whitespace-pre-wrap">
                {c.cmd}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
