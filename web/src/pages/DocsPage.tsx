import React, { useState } from 'react';
import { Search } from 'lucide-react';

export const DocsPage: React.FC = () => {
  const [filterQuery, setFilterQuery] = useState('');

  const rules = [
    { id: 'rule_01', category: 'USER_PROFILE', condition: 'Always', action: 'DELETE' },
    { id: 'rule_02', category: 'SECONDARY_IDENTIFIER', condition: 'Always', action: 'DELETE' },
    { id: 'rule_03', category: 'SEARCH_INDEX_ENTRY', condition: 'Always', action: 'DELETE' },
    { id: 'rule_04', category: 'CACHE_ENTRY', condition: 'Always', action: 'DELETE' },
    { id: 'rule_05', category: 'SUPPORT_MESSAGE', condition: 'Conversation contains shared customer, agent, or order context', action: 'REDACT' },
    { id: 'rule_06', category: 'SUPPORT_ATTACHMENT', condition: 'Attachment belongs only to the deletion subject', action: 'DELETE' },
    { id: 'rule_07', category: 'ANALYTICS_PROFILE', condition: 'Record is still attributable to a user', action: 'ANONYMIZE' },
    { id: 'rule_08', category: 'PRODUCT_TELEMETRY', condition: 'Record is still attributable to a user', action: 'ANONYMIZE' },
    { id: 'rule_09', category: 'USER_EXPORT', condition: 'Always', action: 'DELETE' },
    { id: 'rule_10', category: 'MARKETING_PROFILE', condition: 'Always', action: 'DELETE' },
    { id: 'rule_11', category: 'EMAIL_DELIVERY_LOG', condition: 'Log contains a user email address', action: 'REDACT' },
    { id: 'rule_12', category: 'SECURITY_AUDIT_LOG', condition: 'Record is within the supplied retention period', action: 'RETAIN' },
    { id: 'rule_13', category: 'LEGAL_HOLD_RECORD', condition: 'A supplied legal hold is active', action: 'RETAIN' },
    { id: 'rule_14', category: 'BACKUP_ARCHIVE', condition: 'Restore access can be blocked', action: 'RETAIN' },
    { id: 'rule_15', category: 'ACCOUNT_TOMBSTONE', condition: 'Account is deleted and only stable internal user_id is needed', action: 'REDACT' },
  ];

  const filteredRules = rules.filter(r => 
    r.id.toLowerCase().includes(filterQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(filterQuery.toLowerCase()) ||
    r.action.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Title */}
      <div className="max-w-3xl">
        <span className="text-xs font-black uppercase tracking-widest text-[#E05822] block mb-2">
          Technical Reference
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-[#191D24] tracking-tight">
          AEGIS Documentation & Rules Matrix
        </h1>
        <p className="text-base text-[#5B6575] mt-3">
          The complete policy compiler reference, operation taxonomy, and deterministic grading contracts.
        </p>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE5DB] shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0E6DD]">
          <div>
            <h2 className="text-xl font-black text-[#191D24]">deletion_rules.csv Reference Matrix</h2>
            <p className="text-xs text-slate-500">The 15 canonical rules evaluated against each discovered resource</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter rules..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-[#FAF6F2] border border-[#EFE3D8] text-xs focus:outline-none focus:ring-2 focus:ring-[#E05822]/40"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#F0E6DD] text-slate-500 uppercase text-[10px]">
                <th className="py-2.5 px-3">Rule ID</th>
                <th className="py-2.5 px-3">Data Category</th>
                <th className="py-2.5 px-3">Condition</th>
                <th className="py-2.5 px-3">Required Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EFE8]">
              {filteredRules.map((r) => (
                <tr key={r.id} className="hover:bg-[#FCFAF7] transition-colors">
                  <td className="py-2.5 px-3 font-bold text-[#E05822]">{r.id}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{r.category}</td>
                  <td className="py-2.5 px-3 text-slate-600 font-sans">{r.condition}</td>
                  <td className="py-2.5 px-3 font-bold">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      r.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                      r.action === 'REDACT' ? 'bg-amber-100 text-amber-800' :
                      r.action === 'ANONYMIZE' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {r.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CLI Engine Command Reference */}
      <div className="bg-[#181B20] text-slate-200 p-6 sm:p-8 rounded-3xl border border-slate-800 font-mono text-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
          <span>Autonomous CLI Execution</span>
          <span className="text-emerald-400 font-bold">Python 3.11</span>
        </div>

        <p className="text-slate-400 text-xs font-sans leading-relaxed">
          The Python investigation engine executes completely independent of the frontend dashboard. To execute the deterministic benchmark run and produce output.csv:
        </p>

        <pre className="bg-black/50 p-4 rounded-xl text-emerald-300 overflow-x-auto leading-relaxed">
          # Run the full 518-case audit pipeline{'\n'}
          python code/main.py{'\n'}{'\n'}
          # Execute the test suite (99 passing tests){'\n'}
          pytest code/tests
        </pre>
      </div>

    </div>
  );
};
