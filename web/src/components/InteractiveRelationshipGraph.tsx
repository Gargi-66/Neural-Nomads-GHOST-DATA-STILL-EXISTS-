import React, { useState } from 'react';
import { 
  GitBranch, Database, HardDrive, FileSpreadsheet, Layers, 
  CheckCheck, Fingerprint, Link2, ShieldCheck, Scale, BarChart2, 
  CheckCircle2, Search, FileText, Sparkles, Bot, LayoutDashboard, 
  Sliders, ArrowDown, ArrowRight, CornerDownRight, CornerRightDown
} from 'lucide-react';
import allCases from '../data/all_cases.json';

interface DAGNode {
  id: string;
  stepNo: number;
  title: string;
  subtitle: string;
  layer: 'Bronze' | 'Silver' | 'Gold' | 'RAG / AI' | 'Dashboard';
  color: string;
  badgeBg: string;
  badgeText: string;
  icon: React.ElementType;
  inputs: string;
  outputs: string;
  desc: string;
  branchesTo?: string[];
  branchesFrom?: string[];
}

interface DAGProps {
  initialCaseId?: string;
  onSelectCase?: (caseId: string) => void;
}

export const InteractiveRelationshipGraph: React.FC<DAGProps> = ({
  initialCaseId = 'case_09',
  onSelectCase
}) => {
  const [dagViewMode, setDagViewMode] = useState<'pipeline_dag' | 'case_schedule'>('pipeline_dag');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('silver_db');
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  const currentCase = allCases.find((c) => c.case_id === selectedCaseId) || allCases[0];
  const steps = currentCase.steps || [];

  const nodes: DAGNode[] = [
    {
      id: 'raw_data',
      stepNo: 1,
      title: 'Raw Data Sources',
      subtitle: 'CSV, Images, PDFs, Logs',
      layer: 'Bronze',
      color: 'blue',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      icon: FileSpreadsheet,
      inputs: '518 deletion requests, 94 evidence files, SQL database dumps, event streams',
      outputs: 'Unstructured and semi-structured evidence artifacts',
      desc: 'Heterogeneous input collection from 18 platform microservices and external participant artifacts.',
      branchesTo: ['bronze_layer']
    },
    {
      id: 'bronze_layer',
      stepNo: 2,
      title: 'Bronze Layer',
      subtitle: 'Raw Storage + Metadata + SHA-256',
      layer: 'Bronze',
      color: 'blue',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      icon: HardDrive,
      inputs: 'Raw participant datasets from dataset/',
      outputs: 'Immutable raw store with SHA-256 cryptographic verification hashes',
      desc: 'Raw staging layer that preserves source provenance, file metadata, and tamper-proof checksums.',
      branchesTo: ['silver_ingestion']
    },
    {
      id: 'silver_ingestion',
      stepNo: 3,
      title: 'Silver Ingestion',
      subtitle: 'Stream & Batch Normalization',
      layer: 'Silver',
      color: 'purple',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700',
      icon: Layers,
      inputs: 'Bronze storage blobs and SQLite database snapshots',
      outputs: 'Structured tabular record streams',
      desc: 'Extracts relational schemas, parses event JSON payloads, and stages records into typed buffers.',
      branchesTo: ['data_cleaning']
    },
    {
      id: 'data_cleaning',
      stepNo: 4,
      title: 'Data Cleaning & Validation',
      subtitle: 'Temporal Cutoff & Deduplication',
      layer: 'Silver',
      color: 'purple',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700',
      icon: CheckCheck,
      inputs: 'Structured tabular record streams + case audit_cutoff timestamps',
      outputs: 'Temporally-admissible, deduplicated relational records',
      desc: 'Enforces strict admissibility rules: discards evidence without valid timestamps or captured after audit cutoff.',
      branchesTo: ['identity_res']
    },
    {
      id: 'identity_res',
      stepNo: 5,
      title: 'Identity Resolution',
      subtitle: 'Alias Recovery & Hash Matching',
      layer: 'Silver',
      color: 'purple',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700',
      icon: Fingerprint,
      inputs: 'dim_customer current snapshot & dim_identity_history audit changelogs',
      outputs: 'Unified identity graph with historical email aliases and SHA-256 hashes',
      desc: 'Correlates request email against current and historical identities to uncover all pseudonyms and accounts.',
      branchesTo: ['resource_linking']
    },
    {
      id: 'resource_linking',
      stepNo: 6,
      title: 'Resource & Evidence Linking',
      subtitle: 'Scoped fact_case_data_link Mapping',
      layer: 'Silver',
      color: 'purple',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700',
      icon: Link2,
      inputs: 'Verified customer IDs, fact_resource, fact_evidence, fact_activity',
      outputs: 'Grounded relational linkages scoping each resource strictly to its case',
      desc: 'Uses fact_case_data_link to prevent accidental customer-level resource duplication across cases.',
      branchesTo: ['silver_db']
    },
    {
      id: 'silver_db',
      stepNo: 7,
      title: 'Silver Database',
      subtitle: '8 Validated Entities',
      layer: 'Silver',
      color: 'purple',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700',
      icon: Database,
      inputs: 'Fully conformed and relational linked datasets',
      outputs: 'Normalized SQLite warehouse: silver_database.db',
      desc: 'Houses 8 relational entities: fact_deletion_request, dim_customer, dim_identity_history, fact_resource, fact_activity, fact_evidence, dim_deletion_policy, fact_case_data_link.',
      branchesTo: ['gold_layer', 'rag_retrieval']
    },
    {
      id: 'gold_layer',
      stepNo: 8,
      title: 'Gold Layer',
      subtitle: 'Read-only Analytics',
      layer: 'Gold',
      color: 'amber',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      icon: ShieldCheck,
      inputs: 'Read-only connection to Silver database tables',
      outputs: 'Analytical audit fact tables and classification state buffers',
      desc: 'Deterministic warehouse builder applying zero-trust verification rules without mutating Silver records.',
      branchesTo: ['audit_class']
    },
    {
      id: 'audit_class',
      stepNo: 9,
      title: 'Audit Classification',
      subtitle: 'Temporal Admissibility & Conflict Logic',
      layer: 'Gold',
      color: 'amber',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      icon: Scale,
      inputs: 'Scoped case resources, activity logs, evidence timestamps, dim_deletion_policy',
      outputs: 'Verified resource states (DELETED, ANONYMIZED, ARCHIVED, RETAINED, INCOMPLETE, UNVERIFIED)',
      desc: 'Resolves conflicting observations chronologically; enforces policy rules (DELETE, REDACT, ANONYMIZE, RETAIN).',
      branchesTo: ['completion_metrics']
    },
    {
      id: 'completion_metrics',
      stepNo: 10,
      title: 'Completion Metrics',
      subtitle: 'Complete / Partial / Incomplete / Pending',
      layer: 'Gold',
      color: 'amber',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      icon: BarChart2,
      inputs: 'Classified resource states & linguistic request authorization check',
      outputs: 'Case-level status determination & completion percentages',
      desc: 'Evaluates overall case compliance, isolating active violations, unverified claims, and partial completions.',
      branchesTo: ['gold_outputs']
    },
    {
      id: 'gold_outputs',
      stepNo: 11,
      title: 'Gold Analytical Outputs',
      subtitle: 'customer_deletion_audit & resource_audit',
      layer: 'Gold',
      color: 'amber',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      icon: CheckCircle2,
      inputs: 'Case determinations, resource audits, microservice counts, build metadata',
      outputs: 'Gold warehouse database (gold_database.db) & JSON extracts',
      desc: 'Generates customer_deletion_audit, resource_audit, system_deletion_summary, and warehouse_build_metadata.',
      branchesTo: ['rag_retrieval', 'streamlit_dashboard']
    },
    {
      id: 'rag_retrieval',
      stepNo: 12,
      title: 'RAG Retrieval',
      subtitle: 'Hybrid Identifier & Context Retrieval',
      layer: 'RAG / AI',
      color: 'orange',
      badgeBg: 'bg-orange-50',
      badgeText: 'text-[#EA580C]',
      icon: Search,
      inputs: 'Queries normalized across CASE001, case_01, CUST001 + Silver & Gold DBs',
      outputs: 'Customer-isolated evidence chunks & activity context',
      desc: 'Retrieves relevant evidence and historical activities while enforcing strict cross-customer context boundaries.',
      branchesTo: ['relevant_evidence'],
      branchesFrom: ['silver_db', 'gold_outputs']
    },
    {
      id: 'relevant_evidence',
      stepNo: 13,
      title: 'Relevant Evidence + Policies',
      subtitle: 'Grounded Context Assembly',
      layer: 'RAG / AI',
      color: 'orange',
      badgeBg: 'bg-orange-50',
      badgeText: 'text-[#EA580C]',
      icon: FileText,
      inputs: 'Retrieved evidence metadata, audit cutoff timestamps, dim_deletion_policy rules',
      outputs: 'Grounded prompt context payload',
      desc: 'Pairs each finding with its proving file_id, activity_id, or statutory policy retention rule.',
      branchesTo: ['gemini_api']
    },
    {
      id: 'gemini_api',
      stepNo: 14,
      title: 'Gemini API',
      subtitle: 'Zero-Hallucination LLM Reasoner',
      layer: 'RAG / AI',
      color: 'orange',
      badgeBg: 'bg-orange-50',
      badgeText: 'text-[#EA580C]',
      icon: Sparkles,
      inputs: 'Grounded prompt payload with system constraints',
      outputs: 'Structured explanation vectors',
      desc: 'Executes under strict system prompt: document content is treated as untrusted evidence; decisions come solely from Gold.',
      branchesTo: ['natural_lang']
    },
    {
      id: 'natural_lang',
      stepNo: 15,
      title: 'Natural Language Explanations',
      subtitle: 'Evidence-Grounded Audit Reasoning',
      layer: 'RAG / AI',
      color: 'orange',
      badgeBg: 'bg-orange-50',
      badgeText: 'text-[#EA580C]',
      icon: Bot,
      inputs: 'Structured LLM outputs',
      outputs: 'Plain-English forensic explanations with source citations',
      desc: 'Synthesizes why a case is complete or incomplete, detailing residual systems and necessary verification checks.',
      branchesTo: ['streamlit_dashboard']
    },
    {
      id: 'streamlit_dashboard',
      stepNo: 16,
      title: 'Streamlit Dashboard',
      subtitle: 'Interactive SOC Audit Portal',
      layer: 'Dashboard',
      color: 'emerald',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-800',
      icon: LayoutDashboard,
      inputs: 'Gold analytical outputs + Gemini natural language explanations',
      outputs: 'Real-time analyst inspection interface',
      desc: 'Interactive SOC portal providing dual-perspective analysis, case drill-down, and evidence verification.',
      branchesTo: ['charts_filters'],
      branchesFrom: ['gold_outputs', 'natural_lang']
    },
    {
      id: 'charts_filters',
      stepNo: 17,
      title: 'Charts, Filters, Search',
      subtitle: 'Case & Customer Analysis',
      layer: 'Dashboard',
      color: 'emerald',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-800',
      icon: Sliders,
      inputs: 'Streamlit dashboard query engines',
      outputs: 'Dynamic visualizations, microservice leakage matrices, case drill-down',
      desc: 'Enables auditors to filter by system_id, examine retention exceptions, and export compliant CSV records.'
    }
  ];

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[6];
  const SelectedIcon = selectedNode.icon;

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFEAE0] text-[#D94E1B] text-xs font-bold mb-2">
              <GitBranch className="w-3.5 h-3.5" />
              <span>DIRECTED ACYCLIC GRAPH (DAG)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191D24] tracking-tight flex items-center gap-2">
              Medallion Data &amp; Audit Pipeline DAG
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-semibold">
                17 Topological Stages
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-[#525B69] mt-0.5">
              Complete acyclic flow from Raw Ingestion to Silver Database, Gold Analytics, Gemini RAG, and SOC Dashboard.
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="inline-flex items-center p-1 rounded-full bg-[#FAF7F2] border border-[#EFE5DB] text-xs font-semibold">
            <button
              onClick={() => setDagViewMode('pipeline_dag')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                dagViewMode === 'pipeline_dag'
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>Pipeline Flow DAG</span>
            </button>

            <button
              onClick={() => setDagViewMode('case_schedule')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                dagViewMode === 'case_schedule'
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Case Remediation Schedule</span>
            </button>
          </div>
        </div>

        {/* Quick Legend Bar */}
        <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#EFE5DB] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-stone-500 font-medium">Layers:</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-semibold">Bronze (Raw)</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-mono font-semibold">Silver (Normalized)</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono font-semibold">Gold (Analytical)</span>
            <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] border border-orange-200 text-[10px] font-mono font-semibold">RAG + Gemini AI</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-semibold">Dashboard Portal</span>
          </div>

          <span className="text-[11px] font-mono text-stone-500">
            Acyclicity: <strong>Guaranteed (0 cycles)</strong>
          </span>
        </div>
      </div>

      {/* VIEW 1: FULL PIPELINE DAG (Exact Matching the Uploaded Diagram with Website Styling) */}
      {dagViewMode === 'pipeline_dag' && (
        <div className="space-y-6">
          
          {/* Main Visual DAG Flow Canvas */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE5DB] shadow-xs space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#EFE5DB]">
              <div>
                <h3 className="text-base font-extrabold text-[#191D24]">
                  Topological Architecture Flowchart
                </h3>
                <p className="text-xs text-stone-500">
                  Click any node to inspect inputs, outputs, and algorithmic transformation logic.
                </p>
              </div>

              <div className="text-xs font-mono text-stone-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active Branching: Silver &rarr; RAG &amp; Gold &rarr; Streamlit</span>
              </div>
            </div>

            {/* Responsive DAG Layout: Left Column (Medallion Engine), Right Column (RAG & Gemini), Bottom (Dashboard) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
              
              {/* Left Column: Medallion Backbone (Nodes 1 to 11) */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center gap-2 mb-2 pb-1 border-b border-stone-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]"></span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 font-mono">
                    Medallion Data &amp; Warehouse Backbone (Stages 1 &ndash; 11)
                  </h4>
                </div>

                {nodes.slice(0, 11).map((node, idx) => {
                  const Icon = node.icon;
                  const isSelected = selectedNodeId === node.id;
                  const isSilverDb = node.id === 'silver_db';
                  const isGoldOutputs = node.id === 'gold_outputs';

                  return (
                    <div key={node.id} className="relative">
                      <div
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs ${
                          isSelected
                            ? 'bg-white border-[#EA580C] ring-2 ring-[#EA580C]/20 shadow-sm'
                            : 'bg-[#FAF7F2] hover:bg-white border-[#EFE5DB] hover:border-stone-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            node.layer === 'Bronze' ? 'bg-blue-100 text-blue-700' :
                            node.layer === 'Silver' ? 'bg-purple-100 text-purple-700' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-stone-900 leading-tight">
                                {node.title}
                              </span>
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${node.badgeBg} ${node.badgeText}`}>
                                {node.layer}
                              </span>
                            </div>
                            <span className="text-[11px] text-stone-500 block leading-tight font-mono">
                              {node.subtitle}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isSilverDb && (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#EA580C] bg-[#FFEAE0] px-2 py-0.5 rounded-full border border-[#F6DCD0]">
                              <span>Branches to RAG</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </span>
                          )}
                          {isGoldOutputs && (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                              <span>Branches to UI</span>
                              <CornerDownRight className="w-2.5 h-2.5" />
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-stone-400 font-bold">
                            #{node.stepNo}
                          </span>
                        </div>
                      </div>

                      {/* Directional Down Arrow Connector */}
                      {idx < 10 && (
                        <div className="flex justify-center my-1 text-stone-300">
                          <ArrowDown className="w-3.5 h-3.5 text-stone-400 stroke-[2.5]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Right Column: RAG & Gemini AI Branch (Nodes 12 to 15) */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Connecting Callout Banner from Silver Database */}
                <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200 text-xs text-[#EA580C] leading-relaxed flex items-start gap-2.5">
                  <CornerRightDown className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Branching Flow:</span>{' '}
                    <strong className="text-stone-900">Silver Database</strong> and <strong className="text-stone-900">Gold Analytical Outputs</strong> feed directly into the RAG Retrieval engine with customer-isolated context.
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2 pb-1 border-b border-stone-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 font-mono">
                    RAG &amp; Gemini AI Track (Stages 12 &ndash; 15)
                  </h4>
                </div>

                {nodes.slice(11, 15).map((node, idx) => {
                  const Icon = node.icon;
                  const isSelected = selectedNodeId === node.id;

                  return (
                    <div key={node.id} className="relative">
                      <div
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs ${
                          isSelected
                            ? 'bg-white border-[#EA580C] ring-2 ring-[#EA580C]/20 shadow-sm'
                            : 'bg-[#FAF7F2] hover:bg-white border-[#EFE5DB] hover:border-stone-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#EA580C] flex items-center justify-center">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-stone-900 leading-tight">
                                {node.title}
                              </span>
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-orange-50 text-[#EA580C]">
                                {node.layer}
                              </span>
                            </div>
                            <span className="text-[11px] text-stone-500 block leading-tight font-mono">
                              {node.subtitle}
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] font-mono text-stone-400 font-bold">
                          #{node.stepNo}
                        </span>
                      </div>

                      {/* Directional Down Arrow Connector */}
                      {idx < 3 && (
                        <div className="flex justify-center my-1 text-stone-300">
                          <ArrowDown className="w-3.5 h-3.5 text-stone-400 stroke-[2.5]" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Selected Node Deep-Dive Inspector Panel */}
                <div className="mt-4 p-5 rounded-3xl bg-[#FAF7F2] border border-[#EFE5DB] shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EFE5DB]">
                    <div className="flex items-center gap-2">
                      <SelectedIcon className="w-4 h-4 text-[#EA580C]" />
                      <h4 className="text-xs font-bold text-stone-900 uppercase tracking-tight">
                        Node #{selectedNode.stepNo} &bull; {selectedNode.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-[#EFE5DB] text-stone-600 font-semibold">
                      {selectedNode.layer}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed font-normal">
                    {selectedNode.desc}
                  </p>

                  <div className="space-y-2 pt-1 font-mono text-[11px]">
                    <div className="p-2.5 rounded-xl bg-white border border-[#EFE5DB]">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Incoming Inputs</span>
                      <span className="text-stone-800 font-medium">{selectedNode.inputs}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">Produced Outputs</span>
                      <span className="text-emerald-900 font-medium">{selectedNode.outputs}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Row: Streamlit Dashboard & Analytics (Nodes 16 & 17) */}
            <div className="pt-6 border-t border-[#EFE5DB] space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 font-mono">
                  Convergence: Streamlit Dashboard &amp; Analysis Portal (Stages 16 &amp; 17)
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nodes.slice(15, 17).map((node) => {
                  const Icon = node.icon;
                  const isSelected = selectedNodeId === node.id;

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs ${
                        isSelected
                          ? 'bg-white border-emerald-600 ring-2 ring-emerald-600/20 shadow-sm'
                          : 'bg-[#FAF7F2] hover:bg-white border-[#EFE5DB] hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900">
                              {node.title}
                            </span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                              {node.layer}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-500 font-mono block">
                            {node.subtitle}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold text-stone-400">
                        #{node.stepNo}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 2: CASE REMEDIATION SCHEDULE (Original Case-by-Case Topological Table) */}
      {dagViewMode === 'case_schedule' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-[#191D24]">
                Topological Step Schedule for {currentCase.case_id}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Exact sequence encoded into <code className="text-[#EA580C] font-mono">output.csv</code> via Kahn&apos;s topological sort
              </p>
            </div>

            {/* Case Selector Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-600">Case:</span>
              <select
                value={selectedCaseId}
                onChange={(e) => {
                  setSelectedCaseId(e.target.value);
                  setActiveStepIndex(null);
                  if (onSelectCase) onSelectCase(e.target.value);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#EFE5DB] text-xs text-stone-900 font-bold focus:outline-none focus:border-[#EA580C] shadow-2xs cursor-pointer font-mono"
              >
                {allCases.map((c) => (
                  <option key={c.case_id} value={c.case_id}>
                    {c.case_id} — {c.customer_name} ({c.deletion_status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#EFE5DB]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF7F2] text-stone-600 uppercase tracking-wider text-[10px] border-b border-[#EFE5DB]">
                <tr>
                  <th className="py-3 px-4 font-bold text-center w-16">Step</th>
                  <th className="py-3 px-4 font-bold">Phase</th>
                  <th className="py-3 px-4 font-bold">Operation (DAG Action)</th>
                  <th className="py-3 px-4 font-bold">System ID</th>
                  <th className="py-3 px-4 font-bold">Resource ID</th>
                  <th className="py-3 px-4 font-bold text-center">Target State</th>
                  <th className="py-3 px-4 font-bold">Evidence Citation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE5DB] font-mono text-[11px] bg-white">
                {steps.map((s, idx) => {
                  const isSelected = activeStepIndex === idx;
                  return (
                    <tr 
                      key={s.step_no} 
                      onClick={() => setActiveStepIndex(idx)}
                      className={`hover:bg-[#FAF7F2] transition cursor-pointer ${isSelected ? 'bg-orange-50/50' : ''}`}
                    >
                      <td className="py-2.5 px-4 text-center font-bold text-stone-900">
                        #{s.step_no}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold ${
                          s.phase === 'FINDING' ? 'bg-amber-100 text-amber-800' :
                          s.phase === 'REMEDIATION' ? 'bg-blue-100 text-blue-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {s.phase}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-stone-900">
                        {s.operation}
                      </td>
                      <td className="py-2.5 px-4 text-[#EA580C] font-semibold">
                        {s.system_id}
                      </td>
                      <td className="py-2.5 px-4 text-stone-700">
                        {s.resource_id}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          s.state === 'PRESENT' || s.state === 'ACTIVE' ? 'text-rose-600 bg-rose-50 border border-rose-200' :
                          s.state === 'DISABLED' || s.state === 'BLOCKED' ? 'text-amber-700 bg-amber-50 border border-amber-200' :
                          'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        }`}>
                          {s.state}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-sans text-stone-500 text-[10px]">
                        {s.evidence_id ? <code className="bg-[#FAF7F2] px-1.5 py-0.5 rounded text-[#EA580C] font-bold font-mono">{s.evidence_id}</code> : <span className="text-stone-400 italic">None (Proposed)</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
