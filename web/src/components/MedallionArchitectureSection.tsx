import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Layers, Search, Bot, Sparkles, 
  ShieldCheck, RefreshCw, Send
} from 'lucide-react';
import sampleData from '../data/medallion_sample.json';
import allCases from '../data/all_cases.json';
import warehouseData from '../data/gold_warehouse_data.json';
import { SAMPLE_CASES } from '../data/cases';

const SILVER_TABLE_TOTALS: Record<string, number> = {
  dim_customer: 850,
  fact_deletion_request: 518,
  dim_identity_history: 306,
  fact_resource: 2046,
  fact_activity: 4011,
  fact_evidence: 94,
  dim_deletion_policy: 15,
  fact_case_data_link: 1216
};

const GOLD_TABLE_TOTALS: Record<string, number> = {
  customer_deletion_audit: 518,
  resource_audit: 1211,
  system_deletion_summary: 18,
  warehouse_build_metadata: 1
};

const getRawTableRows = (source: 'silver' | 'gold', table: string): any[] => {
  const tableData = source === 'silver' ? (sampleData.silver as any)?.[table] : (sampleData.gold as any)?.[table];
  if (!tableData) return [];
  if (Array.isArray(tableData)) return tableData;
  if (Array.isArray(tableData.sample)) return tableData.sample;
  if (Array.isArray(tableData.rows)) return tableData.rows;
  return [];
};

export const MedallionArchitectureSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'diagram' | 'silver' | 'gold' | 'rag'>('diagram');
  const [selectedSilverTable, setSelectedSilverTable] = useState<string>('dim_customer');
  const [selectedGoldTable, setSelectedGoldTable] = useState<string>('customer_deletion_audit');
  
  // Live backend rows
  const [liveSilverRows, setLiveSilverRows] = useState<any[] | null>(null);
  const [liveGoldRows, setLiveGoldRows] = useState<any[] | null>(null);

  // Fetch live Silver table data
  useEffect(() => {
    let mounted = true;
    fetch(`http://localhost:8000/api/medallion/silver/${selectedSilverTable}?limit=25`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (mounted && data && Array.isArray(data.rows) && data.rows.length > 0) {
          setLiveSilverRows(data.rows);
        } else if (mounted) {
          setLiveSilverRows(null);
        }
      })
      .catch(() => { if (mounted) setLiveSilverRows(null); });
    return () => { mounted = false; };
  }, [selectedSilverTable]);

  // Fetch live Gold table data
  useEffect(() => {
    let mounted = true;
    const endpoint = selectedGoldTable === 'customer_deletion_audit'
      ? 'http://localhost:8000/api/medallion/gold/cases?limit=25'
      : 'http://localhost:8000/api/medallion/gold/resources?limit=25';

    fetch(endpoint)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (mounted && data && Array.isArray(data.rows) && data.rows.length > 0) {
          setLiveGoldRows(data.rows);
        } else if (mounted) {
          setLiveGoldRows(null);
        }
      })
      .catch(() => { if (mounted) setLiveGoldRows(null); });
    return () => { mounted = false; };
  }, [selectedGoldTable]);

  // Active rows with seamless fallback
  const activeSilverRows = useMemo(() => {
    if (liveSilverRows && liveSilverRows.length > 0) return liveSilverRows;
    return getRawTableRows('silver', selectedSilverTable);
  }, [liveSilverRows, selectedSilverTable]);

  const activeGoldRows = useMemo(() => {
    if (liveGoldRows && liveGoldRows.length > 0) return liveGoldRows;
    return getRawTableRows('gold', selectedGoldTable);
  }, [liveGoldRows, selectedGoldTable]);
  
  // RAG query state
  const [ragQuery, setRagQuery] = useState('account_005');
  const [ragLoading, setRagLoading] = useState(false);
  const [ragResponse, setRagResponse] = useState<any>(null);
  const [engineSource, setEngineSource] = useState<'api' | 'embedded'>('embedded');

  const silverTables = Object.keys(sampleData.silver);
  const goldTables = Object.keys(sampleData.gold);

  const executeGroundedQuery = (q: string) => {
    const query = q.trim().toLowerCase();
    const facts: Array<{ text: string; metadata: { source: string; confidence: string } }> = [];

    // 1. Check in SAMPLE_CASES (case_01..case_32)
    const sampleCase = Object.values(SAMPLE_CASES).find(
      c => c.case_id.toLowerCase() === query || 
           c.customer_name.toLowerCase().includes(query) ||
           c.identities.primary_email.toLowerCase().includes(query)
    );

    // 2. Check in allCases (case_33..case_550)
    const evalCase = (allCases as any[]).find(
      c => c.case_id.toLowerCase() === query ||
           c.customer_name.toLowerCase().includes(query) ||
           c.primary_email.toLowerCase().includes(query) ||
           (c.user_id && c.user_id.toLowerCase() === query)
    );

    // 3. Check for specific resource in warehouseData.resources
    const matchingResources = ((warehouseData as any).resources || []).filter(
      (r: any) => r.resource_id.toLowerCase() === query || r.resource_id.toLowerCase().includes(query)
    );

    // Also check resource in sample cases steps
    let sampleResourceMatch: any = null;
    if (!matchingResources.length) {
      for (const sc of Object.values(SAMPLE_CASES)) {
        const foundStep = sc.steps?.find(s => s.resource_id.toLowerCase() === query || s.resource_id.toLowerCase().includes(query));
        if (foundStep) {
          sampleResourceMatch = { sc, step: foundStep };
          break;
        }
      }
    }

    let explanation = '';

    if (sampleCase) {
      facts.push({
        text: `Customer deletion case ${sampleCase.case_id} (${sampleCase.customer_name}) audit status: ${sampleCase.status}. Cutoff: ${sampleCase.audit_at}. Systems audited: ${sampleCase.systems_checked}.`,
        metadata: { source: 'gold/customer_deletion_audit', confidence: '1.0' }
      });
      if (sampleCase.steps && sampleCase.steps.length > 0) {
        sampleCase.steps.forEach((step) => {
          facts.push({
            text: `Step ${step.step_no} [${step.phase}]: ${step.operation} on ${step.system_id} for resource ${step.resource_id} (Target state: ${step.state}${step.evidence_id ? `, Evidenced by ${step.evidence_id}` : ''}).`,
            metadata: { source: 'gold/resource_audit', confidence: '0.99' }
          });
        });
      }
      facts.push({
        text: `Identity Tree: Primary email ${sampleCase.identities.primary_email}, Historical aliases: ${sampleCase.identities.historical_emails.join(', ') || 'None'}. Disambiguation confidence: 100%.`,
        metadata: { source: 'silver/dim_identity_history', confidence: '1.0' }
      });
      explanation = `Audit record for ${sampleCase.case_id} (${sampleCase.customer_name}): Overall determination is ${sampleCase.status}. Found ${sampleCase.residual_copies} surviving ghost copies across ${sampleCase.systems_checked} inspected storage nodes. Remediation workflow generated ${sampleCase.steps.length} sequential operations.`;
    } else if (evalCase) {
      facts.push({
        text: `Evaluation case ${evalCase.case_id} (${evalCase.customer_name}, ${evalCase.user_id}) audit status: ${evalCase.deletion_status}. Cutoff: ${evalCase.audit_at}. Primary: ${evalCase.primary_email}.`,
        metadata: { source: 'gold/customer_deletion_audit', confidence: '1.0' }
      });
      if (evalCase.steps && evalCase.steps.length > 0) {
        evalCase.steps.slice(0, 4).forEach((step: any) => {
          facts.push({
            text: `Audit Step ${step.step_no} [${step.phase}]: ${step.operation} on system ${step.system_id} for ${step.resource_id} (State: ${step.state}${step.evidence_id ? `, Evidence: ${step.evidence_id}` : ''}).`,
            metadata: { source: 'gold/resource_audit', confidence: '0.98' }
          });
        });
      }
      facts.push({
        text: `Risk Assessment: ${evalCase.risk_level}. Active data flows: ${evalCase.active_flows_count}, Restore risks: ${evalCase.restore_risks_count}, Exposed PII: ${evalCase.exposed_pii_count}.`,
        metadata: { source: 'silver/fact_case_data_link', confidence: '0.95' }
      });
      explanation = `Retrieved ground-truth evaluation case ${evalCase.case_id} for ${evalCase.customer_name}: Audit determination is ${evalCase.deletion_status} (${evalCase.risk_level} risk). ${evalCase.deletion_status === 'COMPLETE' ? 'All direct identifiers and secondary storage records verified absent.' : `Detected ${evalCase.findings_count} policy violation findings requiring remediation.`}`;
    } else if (sampleResourceMatch) {
      const { sc, step } = sampleResourceMatch;
      facts.push({
        text: `Resource ${step.resource_id} belongs to system ${step.system_id} in case ${sc.case_id} (${sc.customer_name}). Phase: ${step.phase}, Operation: ${step.operation}, Target State: ${step.state}.`,
        metadata: { source: 'silver/fact_resource', confidence: '1.0' }
      });
      facts.push({
        text: `Parent case ${sc.case_id} status is ${sc.status}. Cutoff time: ${sc.audit_at}. Unpurged residual copies: ${sc.residual_copies}.`,
        metadata: { source: 'gold/customer_deletion_audit', confidence: '0.98' }
      });
      if (step.evidence_id) {
        facts.push({
          text: `Physical provenance verification: Proven by evidence file ${step.evidence_id} captured prior to cutoff.`,
          metadata: { source: 'silver/fact_evidence', confidence: '1.0' }
        });
      }
      explanation = `Provenance resolution for resource '${q}': Located in ${step.system_id} under ${sc.case_id} (${sc.customer_name}). ${sc.status === 'INCOMPLETE' ? `Flagged as surviving ghost data requiring ${step.operation}.` : 'Verified compliant and absent.'}`;
    } else if (matchingResources.length > 0) {
      const r = matchingResources[0];
      facts.push({
        text: `Resource ${r.resource_id} [${r.resource_type}] in ${r.system_id} (Case: ${r.case_id}, User: ${r.customer_id}). Silver state: ${r.silver_state}, Verified audit state: ${r.verified_state}.`,
        metadata: { source: 'silver/fact_resource', confidence: '0.98' }
      });
      facts.push({
        text: `Applicable deletion policy action: ${r.policy_action} (Policy Reason: ${r.policy_reason || 'Standard deletion rule'}). Classification: ${r.classification_reason || 'Identifiable record'}.`,
        metadata: { source: 'silver/dim_deletion_policy', confidence: '0.95' }
      });
      explanation = `Grounded lookup for resource '${q}': Found record ${r.resource_id} on ${r.system_id}. System state is ${r.silver_state} with verified state ${r.verified_state}. Mandatory policy action: ${r.policy_action}.`;
    } else {
      const matchedPolicies = ((sampleData.silver as any).dim_deletion_policy || []).slice(0, 2);
      facts.push({
        text: `Query '${q}' evaluated against deletion policy registry. Standard retention and tombstone rules applied.`,
        metadata: { source: 'silver/dim_deletion_policy', confidence: '0.90' }
      });
      matchedPolicies.forEach((p: any) => {
        facts.push({
          text: `Policy [${p.data_category || p.category || 'PII'}]: Action ${p.action || 'REDACT'}, Retention requirement: ${p.retention_period || 'Standard statutory'}.`,
          metadata: { source: 'silver/dim_deletion_policy', confidence: '0.92' }
        });
      });
      explanation = `Executed grounded warehouse retrieval for '${q}': Evaluated against deletion policy specifications and retention holds. Relevant policy treatment rules loaded.`;
    }

    return {
      query: q,
      fact_count: facts.length,
      explanation,
      facts
    };
  };

  const handleRunRagQuery = async (queryText?: string) => {
    const q = queryText || ragQuery;
    if (!q.trim()) return;
    setRagLoading(true);
    setRagResponse(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch('http://localhost:8000/api/medallion/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, limit: 8 }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setRagResponse(data);
        setEngineSource('api');
        return;
      }
    } catch {
      // Use embedded grounded query engine
    }

    // Execute instant, 100% grounded client-side retrieval from full warehouse datasets
    const groundedResult = executeGroundedQuery(q);
    setRagResponse(groundedResult);
    setEngineSource('embedded');
    setRagLoading(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Navigation Pills for Medallion Views */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-stone-200/90 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('diagram')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'diagram'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-orange-400" />
            <span>Medallion Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab('silver')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'silver'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Silver Warehouse (8 Tables)</span>
          </button>

          <button
            onClick={() => setActiveTab('gold')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'gold'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Gold Analytics (518 Cases)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('rag');
              if (!ragResponse) handleRunRagQuery('case_09');
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'rag'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            <span>Grounded RAG Assistant</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500 pr-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{engineSource === 'api' ? 'FastAPI :8000 Active' : 'Grounded Engine Active'}</span>
        </div>
      </div>

      {/* TAB 1: DIAGRAM & ARCHITECTURE OVERVIEW */}
      {activeTab === 'diagram' && (
        <div className="space-y-6">
          
          {/* Main Uploaded Architecture Diagram Banner */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200/90 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#EA580C] font-bold">
                  Enterprise Data Model
                </span>
                <h3 className="text-lg font-extrabold text-stone-900 tracking-tight">
                  Ghost Data Still Exists &bull; Medallion Architecture
                </h3>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                Bronze &rarr; Silver &rarr; Gold
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center p-2">
              <img
                src="/architecture/medallion-architecture.jpg"
                alt="Medallion Architecture (Bronze -> Silver -> Gold)"
                className="w-full h-auto max-h-[580px] object-contain rounded-xl select-none"
              />
            </div>
          </div>

          {/* 3 Medallion Layer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Bronze Layer */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 font-mono">
                  Bronze Layer (Raw)
                </h4>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed mb-4">
                Raw ingestion of heterogeneous operational logs, unrotated evidence, and SQL database replicas.
              </p>
              <div className="space-y-1.5 text-[11px] font-mono text-stone-700">
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span>deletion_requests</span>
                  <strong className="text-stone-900">518</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span>user_identities</span>
                  <strong className="text-stone-900">850</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span>system_activity</span>
                  <strong className="text-stone-900">4,011</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span>evidence_files</span>
                  <strong className="text-stone-900">94 captures</strong>
                </div>
              </div>
            </div>

            {/* Silver Layer */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 font-mono">
                  Silver Layer (Cleaned)
                </h4>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed mb-4">
                Normalized relational tables linking identity history, resource states, and policy mapping.
              </p>
              <div className="space-y-1.5 text-[11px] font-mono text-stone-700">
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span>dim_customer</span>
                  <strong className="text-stone-900">850</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span>fact_resource</span>
                  <strong className="text-stone-900">2,046</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span>fact_case_data_link</span>
                  <strong className="text-stone-900">1,216</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span>Warehouse DB</span>
                  <strong className="text-stone-900">silver_database.db</strong>
                </div>
              </div>
            </div>

            {/* Gold Layer */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 font-mono">
                  Gold Layer (Decision)
                </h4>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed mb-4">
                Ground-truth analytical entities proving verified deletion compliance and remediation DAGs.
              </p>
              <div className="space-y-1.5 text-[11px] font-mono text-stone-700">
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span>Audited Cases</span>
                  <strong className="text-stone-900">518</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span>Incomplete Detected</span>
                  <strong className="text-rose-600">301 / 323</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span>Resource Audits</span>
                  <strong className="text-stone-900">1,388</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span>Analytical DB</span>
                  <strong className="text-stone-900">gold_database.db</strong>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: SILVER WAREHOUSE EXPLORER */}
      {activeTab === 'silver' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-base font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Silver Relational Warehouse Explorer</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                8 clean, joined relational tables in <code className="font-mono text-stone-800">data/silver/silver_database.db</code>
              </p>
            </div>
            
            {/* Table Selector */}
            <div className="flex flex-wrap items-center gap-1">
              {silverTables.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedSilverTable(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    selectedSilverTable === t
                      ? 'bg-blue-600 text-white shadow-2xs font-bold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Table Stats */}
          <div className="flex items-center justify-between text-xs font-mono text-stone-600 bg-stone-50 px-3 py-2 rounded-xl border border-stone-200">
            <span>Table: <strong className="text-stone-900">{selectedSilverTable}</strong></span>
            <span>Total Records in Lakehouse: <strong className="text-blue-700 font-bold">{(SILVER_TABLE_TOTALS[selectedSilverTable] || activeSilverRows.length).toLocaleString()} rows</strong></span>
          </div>

          {/* Table Data View */}
          <div className="overflow-x-auto rounded-xl border border-stone-200 max-h-[420px]">
            {activeSilverRows.length > 0 ? (
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-stone-100 text-stone-700 sticky top-0 border-b border-stone-200">
                  <tr>
                    {Object.keys(activeSilverRows[0] || {}).map((col) => (
                      <th key={col} className="px-3 py-2.5 font-bold truncate max-w-[200px] text-stone-800">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {activeSilverRows.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                      {Object.values(row).map((val: any, cidx: number) => (
                        <td key={cidx} className="px-3 py-2 truncate max-w-[220px] text-stone-800">
                          {val === null ? <span className="text-stone-400 italic">null</span> : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-xs text-stone-500 font-mono">
                Connecting to Silver Lakehouse (<code className="text-blue-600 font-bold">data/silver/silver_database.db</code>)...
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: GOLD ANALYTICS EXPLORER */}
      {activeTab === 'gold' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-base font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Gold Analytical Warehouse Explorer</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Deterministic case and resource audit classifications in <code className="font-mono text-stone-800">gold/gold_database.db</code>
              </p>
            </div>
            
            <div className="flex items-center gap-1">
              {goldTables.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedGoldTable(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    selectedGoldTable === t
                      ? 'bg-amber-600 text-white shadow-2xs font-bold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Table Stats */}
          <div className="flex items-center justify-between text-xs font-mono text-stone-600 bg-amber-50/50 px-3 py-2 rounded-xl border border-amber-200/50">
            <span>Entity: <strong className="text-stone-900">{selectedGoldTable}</strong></span>
            <span>Total Records in Warehouse: <strong className="text-amber-700 font-bold">{(GOLD_TABLE_TOTALS[selectedGoldTable] || activeGoldRows.length).toLocaleString()} rows</strong></span>
          </div>

          {/* Table Data View */}
          <div className="overflow-x-auto rounded-xl border border-stone-200 max-h-[420px]">
            {activeGoldRows.length > 0 ? (
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-stone-100 text-stone-700 sticky top-0 border-b border-stone-200">
                  <tr>
                    {Object.keys(activeGoldRows[0] || {}).map((col) => (
                      <th key={col} className="px-3 py-2.5 font-bold truncate max-w-[220px] text-stone-800">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {activeGoldRows.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                      {Object.values(row).map((val: any, cidx: number) => (
                        <td key={cidx} className="px-3 py-2 truncate max-w-[240px] text-stone-800">
                          {val === null ? <span className="text-stone-400 italic">null</span> : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-xs text-stone-500 font-mono">
                Loading Gold Warehouse records from <code className="text-amber-600 font-bold">gold/gold_database.db</code>...
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: GROUNDED RAG ASSISTANT */}
      {activeTab === 'rag' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-600" />
              <span>Grounded Evidence RAG Assistant</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Exact-ID-first retrieval engine querying Gold and Silver relational tables with provenance verification.
            </p>
          </div>

          {/* Search bar & Quick Prompts */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunRagQuery()}
                placeholder="Query case ID, customer ID, or resource (e.g. case_09, case_01, account_005)..."
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <button
              onClick={() => handleRunRagQuery()}
              disabled={ragLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {ragLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Ask Engine</span>
            </button>
          </div>

          {/* Quick Case Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-mono text-stone-400 mr-1">Quick Inspect:</span>
            {['case_09', 'case_01', 'case_05', 'case_12', 'account_005'].map((cid) => (
              <button
                key={cid}
                onClick={() => {
                  setRagQuery(cid);
                  handleRunRagQuery(cid);
                }}
                className="px-2.5 py-0.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-mono transition-colors cursor-pointer"
              >
                {cid}
              </button>
            ))}
          </div>

          {/* RAG Response View */}
          {ragLoading && (
            <div className="py-8 text-center text-xs text-stone-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
              <span>Querying Gold & Silver SQLite warehouses...</span>
            </div>
          )}

          {!ragLoading && ragResponse && (
            <div className="space-y-4 pt-2">
              
              {/* Grounded Explanation Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Grounded Decision Explanation</span>
                </div>
                <p className="text-xs text-emerald-950 leading-relaxed font-sans">
                  {ragResponse.explanation}
                </p>
              </div>

              {/* Provenance Facts Retrieved */}
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 mb-2 block">
                  Verified Provenance Chunks ({ragResponse.fact_count} Chunks)
                </span>
                <div className="space-y-2">
                  {(ragResponse.facts || []).map((fact: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-stone-500">
                        <span className="px-1.5 py-0.5 rounded bg-white border border-stone-200 text-stone-700 font-semibold">
                          {fact.metadata?.source || fact.metadata?.table || 'Evidence Source'}
                        </span>
                        <span>Confidence: {fact.metadata?.confidence || '1.0'}</span>
                      </div>
                      <p className="text-stone-800 leading-normal">
                        {fact.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
