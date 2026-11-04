import React, { useState, useEffect } from 'react';
import { 
  X, Play, CheckCircle2, AlertTriangle, 
  Terminal, Database, User, ShieldCheck
} from 'lucide-react';
import { SAMPLE_CASES, type CaseData } from '../data/cases';

interface InvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCaseId?: string;
}

export const InvestigationModal: React.FC<InvestigationModalProps> = ({ isOpen, onClose, initialCaseId = 'case_0412' }) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'lineage' | 'steps' | 'logs'>('overview');

  const currentCase: CaseData = SAMPLE_CASES[selectedCaseId] || SAMPLE_CASES['case_0412'];

  useEffect(() => {
    if (initialCaseId && SAMPLE_CASES[initialCaseId]) {
      setSelectedCaseId(initialCaseId);
    }
  }, [initialCaseId]);

  const runSimulation = () => {
    setIsSimulating(true);
    setSimulationProgress(10);
    setAuditLogs([
      `[${new Date().toISOString()}] Initializing AEGIS Forensic Pipeline for ${currentCase.case_id}...`,
      `[${new Date().toISOString()}] Parsing evidence files from /dataset/evidence/...`
    ]);

    setTimeout(() => {
      setSimulationProgress(35);
      setAuditLogs(prev => [
        ...prev,
        `[${new Date().toISOString()}] Step 1: Ingested SQL dumps & system_activity.csv`,
        `[${new Date().toISOString()}] Step 2: Resolved 3 identities for ${currentCase.customer_name} across user_audit_log`
      ]);
    }, 700);

    setTimeout(() => {
      setSimulationProgress(65);
      setAuditLogs(prev => [
        ...prev,
        `[${new Date().toISOString()}] Step 3: NetworkX DAG detected 2 zombie paths in analytics & cold backup`,
        `[${new Date().toISOString()}] Step 4: Evaluated deletion_rules.csv -> Applied REDACT & DELETE`
      ]);
    }, 1400);

    setTimeout(() => {
      setSimulationProgress(100);
      setIsSimulating(false);
      setAuditLogs(prev => [
        ...prev,
        `[${new Date().toISOString()}] Step 5: Verification complete. All 4 conditions satisfied.`,
        `[${new Date().toISOString()}] Deterministic output formatted for output.csv. Status: COMPLETE.`
      ]);
    }, 2200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F3] rounded-3xl max-w-5xl w-full border border-[#EBE0D3] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-white border-b border-[#EFE5DB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF0E7] text-[#E05822] flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-[#191D24]">AEGIS Forensic Audit Console</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[#FFEAE0] text-[#E05822] font-bold">
                  {currentCase.case_id}
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Subject: {currentCase.customer_name} &bull; Timestamp: {currentCase.audit_at}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Case selector dropdown */}
            <select
              value={selectedCaseId}
              onChange={(e) => {
                setSelectedCaseId(e.target.value);
                setSimulationProgress(0);
                setAuditLogs([]);
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E2D5C7] bg-[#FDFBF9] text-[#2C333E] focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="case_0412">Case #0412 (Elena Rostova - Full Ghost Recovery)</option>
              <option value="case_09">Case #09 (Marcus Vance - Backup Restore Risk)</option>
              <option value="case_05">Case #05 (Sophia Chang - Primary DB Zombie)</option>
            </select>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Sub-nav Tabs */}
        <div className="px-6 py-2.5 bg-[#F5EFE8] border-b border-[#EADBCC] flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'overview' ? 'bg-white text-[#E05822] shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Overview & Identities
            </button>
            <button
              onClick={() => setActiveTab('lineage')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'lineage' ? 'bg-white text-[#E05822] shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Data Lineage DAG
            </button>
            <button
              onClick={() => setActiveTab('steps')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'steps' ? 'bg-white text-[#E05822] shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Audit Steps ({currentCase.steps.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'logs' ? 'bg-white text-[#E05822] shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Agent Execution Logs
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E05822] hover:bg-[#C94715] disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isSimulating ? 'Simulating Engine...' : 'Run AEGIS Engine'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Progress bar if simulating */}
          {simulationProgress > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5 text-[#1E232A]">
                <span>Automated Deletion Audit Progress</span>
                <span className="font-mono text-[#E05822]">{simulationProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-orange-100 overflow-hidden">
                <div
                  className="h-full bg-[#E05822] transition-all duration-300"
                  style={{ width: `${simulationProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Deletion Request Card */}
              <div className="bg-white p-5 rounded-2xl border border-[#EBE0D3] shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#798393] mb-2 block">
                  Original Deletion Request
                </span>
                <p className="text-sm text-[#191D24] font-medium italic bg-[#FBF8F5] p-3 rounded-xl border border-[#F0E6DD]">
                  &ldquo;{currentCase.request_text}&rdquo;
                </p>
              </div>

              {/* Resolved Identity Graph Card */}
              <div className="bg-white p-5 rounded-2xl border border-[#EBE0D3] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#E05822]" />
                    <h4 className="text-sm font-bold text-[#191D24]">Resolved Identity Tree</h4>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                    Disambiguation Confidence: 100%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-[#FAF6F2] border border-[#ECE0D4]">
                    <span className="text-[10px] font-bold uppercase text-[#717A88] block mb-1">Primary Email</span>
                    <span className="font-mono text-xs font-bold text-[#1E232A] break-all">
                      {currentCase.identities.primary_email}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF6F2] border border-[#ECE0D4]">
                    <span className="text-[10px] font-bold uppercase text-[#717A88] block mb-1">Historical Aliases</span>
                    <div className="space-y-1">
                      {currentCase.identities.historical_emails.map((email, i) => (
                        <div key={i} className="font-mono text-xs text-[#4A5568] break-all">{email}</div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF6F2] border border-[#ECE0D4]">
                    <span className="text-[10px] font-bold uppercase text-[#717A88] block mb-1">Connected Account IDs</span>
                    <div className="flex flex-wrap gap-1">
                      {currentCase.identities.account_ids.map((id, i) => (
                        <span key={i} className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-[#E2D5C7] text-[#2C333E]">
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Compliance Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-[#EBE0D3] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#717A88]">Audit Determination</span>
                    <div className="text-base font-black text-emerald-700 mt-0.5">{currentCase.status}</div>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#EBE0D3] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#717A88]">Systems Scanned</span>
                    <div className="text-base font-black text-[#191D24] mt-0.5">{currentCase.systems_checked} Storage Nodes</div>
                  </div>
                  <Database className="w-8 h-8 text-orange-400" />
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#EBE0D3] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#717A88]">Residual Ghost Copies</span>
                    <div className="text-base font-black text-[#E05822] mt-0.5">{currentCase.residual_copies} Identified & Purged</div>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LINEAGE DAG */}
          {activeTab === 'lineage' && (
            <div className="bg-white p-6 rounded-2xl border border-[#EBE0D3] shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#191D24]">Data Flow & Lineage Reachability Graph</h4>
                  <p className="text-xs text-[#6B7280]">Visualizing active replication channels and zombie synchronization loops</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 font-semibold text-red-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    Zombie Sync Detected
                  </span>
                </div>
              </div>

              {/* Interactive Node Graph Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentCase.lineage.nodes.map((node, i) => (
                  <div key={i} className="p-4 rounded-xl border border-[#E8DDCE] bg-[#FDFBF9] shadow-2xs flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#8C5229]">[{node.id}]</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                        {node.type}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-[#191D24]">{node.label}</div>
                    <div className="pt-2 border-t border-[#F0E6DD] text-xs font-mono text-[#525B69]">
                      State: <span className="font-semibold text-emerald-700">{node.state}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Edge connections display */}
              <div className="p-4 rounded-xl bg-[#FAF5EF] border border-[#EADCCC]">
                <span className="text-xs font-bold text-[#4A5568] block mb-2">Replication Links & Flow Vectors:</span>
                <div className="space-y-1.5">
                  {currentCase.lineage.links.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-white border border-[#E2D5C7] text-slate-800">
                        {link.from}
                      </span>
                      <span className="text-[#A0AEC0]">&rarr;</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-[#E2D5C7] text-slate-800">
                        {link.to}
                      </span>
                      <span className="text-[#64748B]">({link.label})</span>
                      {link.isZombie && (
                        <span className="text-red-600 font-bold bg-red-100 px-2 py-0.2 rounded-full text-[10px]">
                          ⚠️ ZOMBIE SYNC BLOCKED
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT STEPS */}
          {activeTab === 'steps' && (
            <div className="bg-white p-6 rounded-2xl border border-[#EBE0D3] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#191D24]">Deterministic Step Execution Sequence</h4>
                  <p className="text-xs text-[#6B7280]">Strict sequence: FINDING &rarr; REMEDIATION &rarr; VERIFICATION with tie-breaker sorting</p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                  output.csv row ready
                </span>
              </div>

              <div className="divide-y divide-[#F2E8DE]">
                {currentCase.steps.map((step) => (
                  <div key={step.step_no} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#FFEAE0] text-[#E05822] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {step.step_no}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            step.phase === 'FINDING' ? 'bg-amber-100 text-amber-800' :
                            step.phase === 'REMEDIATION' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {step.phase}
                          </span>
                          <span className="font-mono text-xs font-bold text-[#191D24]">
                            {step.operation}
                          </span>
                          <span className="text-xs text-[#717A88]">on</span>
                          <span className="font-mono text-xs text-[#E05822]">
                            {step.system_id} / {step.resource_id}
                          </span>
                        </div>
                        {step.details && (
                          <p className="text-xs text-[#525B69] mt-1">{step.details}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {step.state}
                      </span>
                      {step.evidence_id && (
                        <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {step.evidence_id}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: AGENT LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-[#181B20] text-[#E2E8F0] p-5 rounded-2xl border border-[#333C48] font-mono text-xs space-y-2 min-h-[300px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700 text-[#94A3B8]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>aegis-core-agent :: stdout</span>
                </div>
                <span>FastAPI / Python 3.11</span>
              </div>

              {auditLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  Click &quot;Run AEGIS Engine&quot; above to simulate real-time deterministic agent logs.
                </div>
              ) : (
                <div className="space-y-1.5 pt-2">
                  {auditLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {log.includes('COMPLETE') ? (
                        <span className="text-emerald-400 font-bold">{log}</span>
                      ) : log.includes('zombie') ? (
                        <span className="text-amber-400">{log}</span>
                      ) : (
                        <span>{log}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#EFE5DB] flex items-center justify-between text-xs">
          <span className="text-[#717A88] font-medium">
            HackerRank Orchestrate Benchmark &bull; 100% Deterministic Sorting
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
          >
            Close Console
          </button>
        </div>

      </div>
    </div>
  );
};
