import React, { useState } from 'react';
import { 
  ArrowLeft, Play, ShieldAlert, ShieldCheck, 
  Clock, User, RefreshCw, 
  FileText, Activity, HelpCircle
} from 'lucide-react';
import allCases from '../data/all_cases.json';

interface CaseInvestigationDetailProps {
  caseId: string;
  onBack: () => void;
  onSelectCase: (caseId: string) => void;
}

export const CaseInvestigationDetail: React.FC<CaseInvestigationDetailProps> = ({
  caseId,
  onBack,
  onSelectCase
}) => {
  const currentCase = allCases.find((c) => c.case_id === caseId) || allCases[0];

  // Animated Investigation Experience state
  const [isRunningInvestigation, setIsRunningInvestigation] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);

  const workflowStages = [
    { id: 1, title: 'Request Received', desc: 'Validating authorization' },
    { id: 2, title: 'Identity Resolution', desc: 'Recovering historical aliases' },
    { id: 3, title: 'Evidence Ingestion', desc: 'Temporal cutoff gate' },
    { id: 4, title: 'Record Discovery', desc: 'Scanning SQL, logs, JSON' },
    { id: 5, title: 'Policy Evaluation', desc: 'Applying deletion_rules' },
    { id: 6, title: 'Resurrection Check', desc: 'Sync flows & cold backups' },
    { id: 7, title: 'Final Classification', desc: 'Total-ordered plan' }
  ];

  const handleRunInvestigation = () => {
    setIsRunningInvestigation(true);
    setCurrentStepIndex(0);
    setLiveLogs([`[0.00s] Initializing AEGIS forensic engine for ${currentCase.case_id}...`]);

    // Step 1: Request
    setTimeout(() => {
      setCurrentStepIndex(1);
      setLiveLogs(prev => [
        ...prev,
        `[0.21s] Request classified: "${currentCase.request_text.slice(0, 45)}..." -> Authorized: ${currentCase.deletion_status !== 'NOT_APPLICABLE'}`
      ]);
    }, 400);

    // Step 2: Identity
    setTimeout(() => {
      setCurrentStepIndex(2);
      setLiveLogs(prev => [
        ...prev,
        `[0.48s] Resolved Canonical Identity: ${currentCase.user_id} (${currentCase.customer_name})`,
        `[0.55s] Linked ${currentCase.historical_emails.length} historical aliases from user_audit_log.csv`
      ]);
    }, 850);

    // Step 3: Evidence
    setTimeout(() => {
      setCurrentStepIndex(3);
      setLiveLogs(prev => [
        ...prev,
        `[0.82s] Enforced temporal cutoff: ${currentCase.audit_at} (rejected all post-audit files)`
      ]);
    }, 1300);

    // Step 4: Discovery
    setTimeout(() => {
      setCurrentStepIndex(4);
      setLiveLogs(prev => [
        ...prev,
        `[1.15s] Evidence scan complete: ${currentCase.findings_count} surviving records discovered`
      ]);
    }, 1750);

    // Step 5: Policy
    setTimeout(() => {
      setCurrentStepIndex(5);
      setLiveLogs(prev => [
        ...prev,
        `[1.42s] Applied deletion rules -> statutory retention preserved for Rule 12 security audit logs`
      ]);
    }, 2200);

    // Step 6: Resurrection
    setTimeout(() => {
      setCurrentStepIndex(6);
      setLiveLogs(prev => [
        ...prev,
        `[1.78s] Resurrection check: ${currentCase.active_flows_count} active flows, ${currentCase.restore_risks_count} restorable cold backups`
      ]);
    }, 2650);

    // Step 7: Classification
    setTimeout(() => {
      setCurrentStepIndex(7);
      setIsRunningInvestigation(false);
      setLiveLogs(prev => [
        ...prev,
        `[2.05s] AUDIT DECISION DETERMINED: ${currentCase.deletion_status} (${currentCase.steps.length} ordered steps written)`
      ]);
    }, 3100);
  };

  // Group steps by phase
  const findingSteps = currentCase.steps.filter((s: any) => s.phase === 'FINDING');
  const remediationSteps = currentCase.steps.filter((s: any) => s.phase === 'REMEDIATION');
  const verificationSteps = currentCase.steps.filter((s: any) => s.phase === 'VERIFICATION');

  return (
    <div className="space-y-6">
      
      {/* Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#E05822] hover:text-[#C94715] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Case Explorer</span>
        </button>

        <div className="flex items-center gap-2.5">
          <label className="text-xs text-[#717A88] font-medium">Jump to Case:</label>
          <select
            value={currentCase.case_id}
            onChange={(e) => onSelectCase(e.target.value)}
            className="py-1.5 px-3 bg-white border border-[#EFE5DB] rounded-xl text-xs font-mono font-bold text-[#191D24] focus:outline-none focus:border-[#E05822]"
          >
            {allCases.slice(0, 50).map((c) => (
              <option key={c.case_id} value={c.case_id}>
                {c.case_id} - {c.customer_name} ({c.deletion_status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Case Header Dossier Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE5DB] shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-extrabold px-3 py-1 rounded-full bg-[#FFEAE0] text-[#D94E1B] border border-[#FCD2BF]">
                {currentCase.case_id}
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#FAF7F2] text-[#717A88] border border-[#EFE5DB]">
                UID: {currentCase.user_id}
              </span>

              {currentCase.deletion_status === 'COMPLETE' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  COMPLETE (VERIFIED CLEAN)
                </span>
              )}
              {currentCase.deletion_status === 'INCOMPLETE' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  INCOMPLETE (GHOST DATA SURVIVES)
                </span>
              )}
              {currentCase.deletion_status === 'NOT_APPLICABLE' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                  <HelpCircle className="w-3.5 h-3.5" />
                  NOT_APPLICABLE
                </span>
              )}
              
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#FAF7F2] border border-[#EFE5DB] text-[#555E6B]">
                Risk: {currentCase.risk_level}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#191D24] tracking-tight">
              Subject: {currentCase.customer_name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#717A88]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#E05822]" />
                Requested: {currentCase.requested_at ? currentCase.requested_at.replace('T', ' ').slice(0, 19) : '-'}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                Audit Cutoff: {currentCase.audit_at ? currentCase.audit_at.replace('T', ' ').slice(0, 19) : '-'}
              </span>
              <span className="flex items-center gap-1.5 text-[#555E6B]">
                Claimed: <span className="line-through text-[#8C7A6D]">{currentCase.reported_status}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={handleRunInvestigation}
              disabled={isRunningInvestigation}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#E05822] hover:bg-[#C94715] text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isRunningInvestigation ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Auditing Systems...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Forensic Investigation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 7-Stage Workflow Node Sequence */}
      <div className="bg-white rounded-3xl p-6 border border-[#EFE5DB] shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFF5EE] text-[#E05822] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#191D24]">Investigation Execution Workflow</h3>
              <p className="text-[11px] text-[#717A88]">7-stage forensic audit pipeline with real-time temporal verification</p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-[#E05822]">
            {isRunningInvestigation ? 'Pipeline Active' : 'Pipeline Ready'}
          </span>
        </div>

        {/* 7 Workflow Step Nodes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {workflowStages.map((stage) => {
            const isCompleted = currentStepIndex >= stage.id;
            const isCurrent = currentStepIndex === stage.id - 1 && isRunningInvestigation;
            
            return (
              <div 
                key={stage.id}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  isCompleted 
                    ? 'bg-[#FFEAE0] border-[#FCD2BF] text-[#D94E1B]' 
                    : isCurrent 
                      ? 'bg-[#FFF5EE] border-[#E05822] text-[#E05822] shadow-xs animate-pulse font-bold'
                      : 'bg-[#FAF7F2] border-[#EFE5DB] text-[#8C7A6D]'
                }`}
              >
                <div className="flex items-center justify-center mb-1 font-mono text-[10px] font-bold">
                  {isCompleted ? (
                    <span className="w-4 h-4 rounded-full bg-[#E05822] text-white flex items-center justify-center text-[9px]">✓</span>
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-[#D5C7B8] flex items-center justify-center">{stage.id}</span>
                  )}
                </div>
                <div className="text-xs font-bold truncate">{stage.title}</div>
                <div className="text-[9px] opacity-80 truncate mt-0.5">{stage.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Live Terminal Output Box */}
        {liveLogs.length > 0 && (
          <div className="bg-[#191D24] rounded-2xl p-4 border border-[#2D3748] font-mono text-xs text-[#FBD38D] space-y-1 max-h-48 overflow-y-auto">
            {liveLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-[#718096] select-none">&gt;</span>
                <span className={log.includes('AUDIT DECISION') ? 'text-[#68D391] font-bold' : ''}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Case Details Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Request & Identity */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Deletion Request Text */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE5DB] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#717A88] uppercase">
              <FileText className="w-4 h-4 text-[#E05822]" />
              <span>Verbatim Deletion Request</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] text-[#191D24] text-xs sm:text-sm italic leading-relaxed">
              &ldquo;{currentCase.request_text}&rdquo;
            </div>
            <div className="text-[11px] font-mono text-[#717A88] pt-1">
              Classified: <span className="font-bold text-[#E05822]">{currentCase.deletion_status !== 'NOT_APPLICABLE' ? 'Explicit Authorized Erasure' : 'Non-Deletion Request'}</span>
            </div>
          </div>

          {/* Canonical Identity Graph Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE5DB] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#717A88] uppercase">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Canonical Identity Graph</span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE5DB]">
                <span className="text-[#8C7A6D] block text-[10px] uppercase">Primary Email</span>
                <span className="text-[#191D24] font-bold">{currentCase.primary_email}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE5DB]">
                <span className="text-[#8C7A6D] block text-[10px] uppercase">Canonical UID</span>
                <span className="text-[#E05822] font-bold">{currentCase.user_id}</span>
              </div>

              {currentCase.historical_emails && currentCase.historical_emails.length > 0 && (
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE5DB] space-y-1">
                  <span className="text-[#8C7A6D] block text-[10px] uppercase">Historical Audit Aliases</span>
                  {currentCase.historical_emails.map((hem: string, i: number) => (
                    <div key={i} className="text-[#555E6B] text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      {hem}
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE5DB]">
                <span className="text-[#8C7A6D] block text-[10px] uppercase">Phone Number</span>
                <span className="text-[#555E6B]">{currentCase.phone}</span>
              </div>
            </div>
          </div>

          {/* Data Resurrection Threats */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE5DB] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#717A88] uppercase">
              <ShieldAlert className="w-4 h-4 text-[#D94E1B]" />
              <span>Data Resurrection Risks</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFE5DB]">
                <span className="text-[#717A88]">Active Sync Flows</span>
                <span className={`font-bold ${currentCase.active_flows_count > 0 ? 'text-[#D94E1B]' : 'text-[#8C7A6D]'}`}>
                  {currentCase.active_flows_count}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFE5DB]">
                <span className="text-[#717A88]">Restorable Backups</span>
                <span className={`font-bold ${currentCase.restore_risks_count > 0 ? 'text-[#D94E1B]' : 'text-[#8C7A6D]'}`}>
                  {currentCase.restore_risks_count}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFE5DB]">
                <span className="text-[#717A88]">Exposed PII Records</span>
                <span className={`font-bold ${currentCase.exposed_pii_count > 0 ? 'text-amber-700' : 'text-[#8C7A6D]'}`}>
                  {currentCase.exposed_pii_count}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Ordered Audit Plan */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#EFE5DB] pb-4">
              <div>
                <h3 className="text-lg font-black text-[#191D24] tracking-tight">
                  Audited Ground-Truth Action Plan
                </h3>
                <p className="text-xs text-[#717A88] mt-0.5">
                  Ordered hierarchy: Phase 1 (FINDING) &rarr; Phase 2 (REMEDIATION) &rarr; Phase 3 (VERIFICATION)
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 bg-[#FAF7F2] border border-[#EFE5DB] rounded-full text-[#717A88]">
                {currentCase.steps.length} Steps
              </span>
            </div>

            {/* Steps Container */}
            {currentCase.steps.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF7F2] rounded-2xl border border-dashed border-[#EFE5DB] text-xs font-mono text-[#8C7A6D]">
                No steps required (Request classified as NOT_APPLICABLE).
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* 1. FINDING Steps */}
                {findingSteps.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <h4 className="text-xs font-mono font-bold text-amber-800 uppercase tracking-wider">
                        Phase 1: Grounded Findings ({findingSteps.length})
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {findingSteps.map((s: any) => (
                        <div key={s.step_no} className="p-3.5 rounded-2xl bg-[#FFFDFB] border border-[#F2E5D9] flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                              {s.step_no}
                            </span>
                            <div>
                              <div className="font-mono font-bold text-[#191D24]">{s.operation}</div>
                              <div className="text-[11px] text-[#717A88] font-mono">
                                System: <span className="font-bold text-[#191D24]">{s.system_id}</span> &bull; Resource: <span className="font-bold text-[#191D24]">{s.resource_id}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              Evidence: {s.evidence_id || '-'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. REMEDIATION Steps */}
                {remediationSteps.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#E05822]"></span>
                      <h4 className="text-xs font-mono font-bold text-[#D94E1B] uppercase tracking-wider">
                        Phase 2: Prerequisite Remediation Actions ({remediationSteps.length})
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {remediationSteps.map((s: any) => (
                        <div key={s.step_no} className="p-3.5 rounded-2xl bg-[#FFF9F5] border border-[#FCD2BF] flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-[#FFEAE0] text-[#D94E1B] font-mono font-bold flex items-center justify-center text-xs shrink-0">
                              {s.step_no}
                            </span>
                            <div>
                              <div className="font-mono font-bold text-[#D94E1B]">{s.operation}</div>
                              <div className="text-[11px] text-[#717A88] font-mono">
                                System: <span className="font-bold text-[#191D24]">{s.system_id}</span> &bull; Resource: <span className="font-bold text-[#191D24]">{s.resource_id}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FAF7F2] text-[#8C7A6D] border border-[#EFE5DB]">
                              Target State: {s.state}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. VERIFICATION Steps */}
                {verificationSteps.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <h4 className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider">
                        Phase 3: Post-Remediation Verification ({verificationSteps.length})
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {verificationSteps.map((s: any) => (
                        <div key={s.step_no} className="p-3.5 rounded-2xl bg-[#F8FDF9] border border-[#C6F6D5] flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                              {s.step_no}
                            </span>
                            <div>
                              <div className="font-mono font-bold text-emerald-800">{s.operation}</div>
                              <div className="text-[11px] text-[#717A88] font-mono">
                                System: <span className="font-bold text-[#191D24]">{s.system_id}</span> &bull; Resource: <span className="font-bold text-[#191D24]">{s.resource_id}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-emerald-700 border border-emerald-200">
                              Verified: {s.state}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
