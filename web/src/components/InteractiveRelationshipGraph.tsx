import React, { useState } from 'react';
import { 
  FileSpreadsheet, HardDrive, Layers, CheckCheck, Fingerprint, 
  Link2, Database, ShieldCheck, Scale, BarChart2, CheckCircle2, 
  Search, FileText, Sparkles, Bot, LayoutDashboard, Sliders,
  ArrowDown, ArrowRight, CornerDownRight, CornerRightDown,
  GitBranch, ChevronRight, Activity, Cpu
} from 'lucide-react';

interface DAGProps {
  initialCaseId?: string;
  onSelectCase?: (caseId: string) => void;
}

interface DAGNode {
  id: string;
  stepNo: number;
  title: string;
  subtitle?: string;
  layer: 'Bronze' | 'Silver' | 'Gold' | 'RAG / AI' | 'Dashboard';
  icon: React.ElementType;
  badge: string;
  // Color styling matching website aesthetic
  cardBg: string;
  cardBorder: string;
  cardHover: string;
  textColor: string;
  subtitleColor: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  gradientTop?: string;
  // Forensic Architecture Details
  inputs: string;
  outputs: string;
  description: string;
  keyFunctions: string[];
  branchesOutTo?: string[];
  branchesInFrom?: string[];
}

export const InteractiveRelationshipGraph: React.FC<DAGProps> = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('silver_db');

  const nodes: DAGNode[] = [
    {
      id: 'raw_data',
      stepNo: 1,
      title: 'Raw Data Sources',
      subtitle: 'CSV, Images, PDFs, Logs',
      layer: 'Bronze',
      icon: FileSpreadsheet,
      badge: 'RAW INGESTION',
      cardBg: 'bg-white',
      cardBorder: 'border-stone-200/90',
      cardHover: 'hover:border-stone-400 hover:shadow-sm',
      textColor: 'text-stone-900',
      subtitleColor: 'text-stone-500',
      iconBg: 'bg-stone-100',
      iconColor: 'text-stone-700',
      badgeBg: 'bg-stone-100',
      badgeText: 'text-stone-700',
      gradientTop: 'from-stone-400 to-stone-500',
      inputs: '518 deletion requests, 94 evidence files, SQL database dumps, event streams, support PDFs',
      outputs: 'Unstructured and semi-structured evidence artifacts staged in storage buffer',
      description: 'Heterogeneous input collection from 18 platform microservices and external participant evidence artifacts.',
      keyFunctions: ['Evidence manifest indexing', 'Multi-format file discovery', 'Provenance logging']
    },
    {
      id: 'bronze_layer',
      stepNo: 2,
      title: 'Bronze Layer',
      subtitle: 'Raw Storage + Metadata + SHA-256',
      layer: 'Bronze',
      icon: HardDrive,
      badge: 'BRONZE LAKE',
      cardBg: 'bg-[#FDF9F5]',
      cardBorder: 'border-[#EAD5C3]',
      cardHover: 'hover:border-[#C48858] hover:shadow-sm',
      textColor: 'text-[#6E3C1B]',
      subtitleColor: 'text-[#A06138]',
      iconBg: 'bg-[#FBE9DC]',
      iconColor: 'text-[#B45309]',
      badgeBg: 'bg-[#FBE9DC]',
      badgeText: 'text-[#9A3412]',
      gradientTop: 'from-[#B45309] to-[#D97706]',
      inputs: 'Raw files from dataset/ directory and microservice streams',
      outputs: 'Immutable Bronze lakehouse with cryptographic SHA-256 verification hashes',
      description: 'Preserves raw data untouched for audit compliance, stamping each artifact with tamper-proof checksums and ingestion timestamps.',
      keyFunctions: ['SHA-256 cryptographic hashing', 'Metadata extraction', 'Temporal boundary enforcement']
    },
    {
      id: 'silver_ingestion',
      stepNo: 3,
      title: 'Silver Ingestion',
      subtitle: 'Stream & Batch Normalization',
      layer: 'Silver',
      icon: Layers,
      badge: 'SILVER STAGING',
      cardBg: 'bg-[#F8FAFC]',
      cardBorder: 'border-[#CBD5E1]',
      cardHover: 'hover:border-[#94A3B8] hover:shadow-sm',
      textColor: 'text-[#1E293B]',
      subtitleColor: 'text-[#64748B]',
      iconBg: 'bg-[#E2E8F0]',
      iconColor: 'text-[#475569]',
      badgeBg: 'bg-[#E2E8F0]',
      badgeText: 'text-[#334155]',
      gradientTop: 'from-[#64748B] to-[#94A3B8]',
      inputs: 'Bronze storage blobs and SQLite database snapshots',
      outputs: 'Structured tabular record streams in typed memory buffers',
      description: 'Extracts relational schemas, parses event JSON payloads, and stages records into typed, queryable buffers.',
      keyFunctions: ['JSON payload unnesting', 'SQLite schema inspection', 'Type coercion']
    },
    {
      id: 'data_cleaning',
      stepNo: 4,
      title: 'Data Cleaning & Validation',
      subtitle: 'Temporal Cutoff & Deduplication',
      layer: 'Silver',
      icon: CheckCheck,
      badge: 'SILVER ETL',
      cardBg: 'bg-[#F8FAFC]',
      cardBorder: 'border-[#CBD5E1]',
      cardHover: 'hover:border-[#94A3B8] hover:shadow-sm',
      textColor: 'text-[#1E293B]',
      subtitleColor: 'text-[#64748B]',
      iconBg: 'bg-[#E2E8F0]',
      iconColor: 'text-[#475569]',
      badgeBg: 'bg-[#E2E8F0]',
      badgeText: 'text-[#334155]',
      gradientTop: 'from-[#64748B] to-[#94A3B8]',
      inputs: 'Structured tabular record streams + case audit_cutoff timestamps',
      outputs: 'Temporally-admissible, deduplicated relational records',
      description: 'Enforces strict admissibility rules: discards evidence without valid timestamps or captured after audit cutoff to prevent hindsight bias.',
      keyFunctions: ['Cutoff timestamp filtering', 'Duplicate row elimination', 'Foreign key validation']
    },
    {
      id: 'identity_res',
      stepNo: 5,
      title: 'Identity Resolution',
      subtitle: 'Historical Alias & Hash Correlation',
      layer: 'Silver',
      icon: Fingerprint,
      badge: 'IDENTITY GRAPH',
      cardBg: 'bg-[#F8FAFC]',
      cardBorder: 'border-[#CBD5E1]',
      cardHover: 'hover:border-[#94A3B8] hover:shadow-sm',
      textColor: 'text-[#1E293B]',
      subtitleColor: 'text-[#64748B]',
      iconBg: 'bg-[#E2E8F0]',
      iconColor: 'text-[#475569]',
      badgeBg: 'bg-[#E2E8F0]',
      badgeText: 'text-[#334155]',
      gradientTop: 'from-[#64748B] to-[#94A3B8]',
      inputs: 'dim_customer current snapshot & fact_customer_audit_log history',
      outputs: 'Unified customer identity cluster with historical emails, phone numbers, and hashes',
      description: 'Correlates the request email against all historical identity modifications to uncover every pseudonym, alias, or merged account.',
      keyFunctions: ['Historical email lookup', 'Phone & hash resolution', 'Stable user_id linkage']
    },
    {
      id: 'resource_linking',
      stepNo: 6,
      title: 'Resource & Evidence Linking',
      subtitle: 'Scoped fact_case_data_link Mapping',
      layer: 'Silver',
      icon: Link2,
      badge: 'CASE SCOPING',
      cardBg: 'bg-[#F8FAFC]',
      cardBorder: 'border-[#CBD5E1]',
      cardHover: 'hover:border-[#94A3B8] hover:shadow-sm',
      textColor: 'text-[#1E293B]',
      subtitleColor: 'text-[#64748B]',
      iconBg: 'bg-[#E2E8F0]',
      iconColor: 'text-[#475569]',
      badgeBg: 'bg-[#E2E8F0]',
      badgeText: 'text-[#334155]',
      gradientTop: 'from-[#64748B] to-[#94A3B8]',
      inputs: 'Customer identities, system activities, evidence files, and deletion rules',
      outputs: 'Grounded relational linkages strictly scoping each resource to its case',
      description: 'Uses fact_case_data_link to prevent accidental customer-level resource duplication across cases and isolate case boundaries.',
      keyFunctions: ['Strict case-resource scoping', 'Multi-source cross-referencing', 'Evidence grounding']
    },
    {
      id: 'silver_db',
      stepNo: 7,
      title: 'Silver Database',
      subtitle: '8 Validated Entities',
      layer: 'Silver',
      icon: Database,
      badge: '8 CORE TABLES',
      cardBg: 'bg-[#F1F5F9]',
      cardBorder: 'border-[#94A3B8]',
      cardHover: 'hover:border-slate-600 hover:shadow-md',
      textColor: 'text-[#0F172A]',
      subtitleColor: 'text-[#475569]',
      iconBg: 'bg-[#CBD5E1]',
      iconColor: 'text-[#0F172A]',
      badgeBg: 'bg-[#CBD5E1]',
      badgeText: 'text-[#0F172A]',
      gradientTop: 'from-slate-600 via-slate-500 to-slate-700',
      branchesOutTo: ['gold_layer', 'rag_retrieval'],
      inputs: 'Fully conformed and relationally linked datasets',
      outputs: 'Normalized SQLite warehouse: silver_database.db',
      description: 'Houses 8 normalized entities: dim_customer, fact_deletion_request, fact_customer_audit_log, fact_system_activity, fact_case_data_link, dim_deletion_rule, dim_evidence_file, fact_resource_evidence_observation.',
      keyFunctions: ['3NF relational normalization', 'Integrity constraints', 'Direct feed to RAG Context']
    },
    {
      id: 'gold_layer',
      stepNo: 8,
      title: 'Gold Layer',
      subtitle: 'Read-only Analytics',
      layer: 'Gold',
      icon: ShieldCheck,
      badge: 'GOLD MART',
      cardBg: 'bg-[#FEFCE8]',
      cardBorder: 'border-[#FDE047]',
      cardHover: 'hover:border-[#EAB308] hover:shadow-sm',
      textColor: 'text-[#713F12]',
      subtitleColor: 'text-[#A16207]',
      iconBg: 'bg-[#FEF08A]',
      iconColor: 'text-[#CA8A04]',
      badgeBg: 'bg-[#FEF08A]',
      badgeText: 'text-[#854D0E]',
      gradientTop: 'from-[#EAB308] to-[#CA8A04]',
      inputs: 'Read-only connection to normalized Silver tables',
      outputs: 'Curated analytical data models and audit cubes',
      description: 'Aggregates multi-source evidence into high-performance views for forensic classification without modifying source data.',
      keyFunctions: ['Analytical aggregation', 'Cross-table join cubes', 'Read-only integrity']
    },
    {
      id: 'audit_class',
      stepNo: 9,
      title: 'Audit Classification',
      subtitle: 'Policy & Authorization Evaluator',
      layer: 'Gold',
      icon: Scale,
      badge: 'POLICY EVAL',
      cardBg: 'bg-[#FEFCE8]',
      cardBorder: 'border-[#FDE047]',
      cardHover: 'hover:border-[#EAB308] hover:shadow-sm',
      textColor: 'text-[#713F12]',
      subtitleColor: 'text-[#A16207]',
      iconBg: 'bg-[#FEF08A]',
      iconColor: 'text-[#CA8A04]',
      badgeBg: 'bg-[#FEF08A]',
      badgeText: 'text-[#854D0E]',
      gradientTop: 'from-[#EAB308] to-[#CA8A04]',
      inputs: 'request_text semantic analysis + dim_deletion_rule statutory rules',
      outputs: 'Case authorization verdict: DELETION_AUTHORIZED vs NOT_APPLICABLE',
      description: 'Determines whether request actually authorizes deletion or is merely a GDPR access, correction, or marketing opt-out inquiry.',
      keyFunctions: ['Multilingual text parsing', 'Statutory retention checks', 'Tombstone rule matching']
    },
    {
      id: 'completion_metrics',
      stepNo: 10,
      title: 'Completion Metrics',
      subtitle: 'Complete / Partial / Incomplete / Pending',
      layer: 'Gold',
      icon: BarChart2,
      badge: 'STATUS MATRIX',
      cardBg: 'bg-[#FEFCE8]',
      cardBorder: 'border-[#FDE047]',
      cardHover: 'hover:border-[#EAB308] hover:shadow-sm',
      textColor: 'text-[#713F12]',
      subtitleColor: 'text-[#A16207]',
      iconBg: 'bg-[#FEF08A]',
      iconColor: 'text-[#CA8A04]',
      badgeBg: 'bg-[#FEF08A]',
      badgeText: 'text-[#854D0E]',
      gradientTop: 'from-[#EAB308] to-[#CA8A04]',
      inputs: 'Residual evidence status across databases, replicas, backups, and logs',
      outputs: 'Dual-perspective classifications: Benchmark status & Forensic violation counts',
      description: 'Establishes state at audit_at cutoff: catches lingering ghost records, failover replication lag, and active restore risks.',
      keyFunctions: ['Four-tier status determination', 'Residual count aggregation', 'Dual-perspective sync']
    },
    {
      id: 'gold_outputs',
      stepNo: 11,
      title: 'Gold Analytical Outputs',
      subtitle: 'Final Verdicts & Topological Schedules',
      layer: 'Gold',
      icon: CheckCircle2,
      badge: 'GOLD EXPORTS',
      cardBg: 'bg-[#FEF9C3]',
      cardBorder: 'border-[#FACC15]',
      cardHover: 'hover:border-[#CA8A04] hover:shadow-md',
      textColor: 'text-[#854D0E]',
      subtitleColor: 'text-[#A16207]',
      iconBg: 'bg-[#FDE047]',
      iconColor: 'text-[#713F12]',
      badgeBg: 'bg-[#FDE047]',
      badgeText: 'text-[#713F12]',
      gradientTop: 'from-[#CA8A04] via-[#EAB308] to-[#A16207]',
      branchesOutTo: ['rag_retrieval', 'streamlit_dashboard'],
      inputs: 'Case determinations, resource audits, microservice counts, build metadata',
      outputs: 'Gold warehouse database (gold_database.db) & compliant output.csv',
      description: 'Generates customer_deletion_audit, resource_audit, system_deletion_summary, and strict Kahn DAG remediation plans.',
      keyFunctions: ['Kahn topological sort', 'Step JSON serialization', 'Direct feed to Dashboard & RAG']
    },
    {
      id: 'rag_retrieval',
      stepNo: 12,
      title: 'RAG Retrieval',
      subtitle: 'Vector & Keyword Context Assembly',
      layer: 'RAG / AI',
      icon: Search,
      badge: 'RAG INDEXER',
      cardBg: 'bg-[#FFF7ED]',
      cardBorder: 'border-[#FDBA74]',
      cardHover: 'hover:border-[#EA580C] hover:shadow-md',
      textColor: 'text-[#7C2D12]',
      subtitleColor: 'text-[#9A3412]',
      iconBg: 'bg-[#FFEDD5]',
      iconColor: 'text-[#EA580C]',
      badgeBg: 'bg-[#FFEDD5]',
      badgeText: 'text-[#C2410C]',
      gradientTop: 'from-[#EA580C] to-[#F97316]',
      branchesInFrom: ['silver_db', 'gold_outputs'],
      inputs: 'Customer identifier queries + normalized entities from Silver & Gold',
      outputs: 'Case-isolated evidence chunks, log excerpts, and policy clauses',
      description: 'Retrieves relevant evidence and historical activities while enforcing strict cross-customer context boundaries and cutoff admissibility.',
      keyFunctions: ['Multi-identifier lookup', 'Context window chunking', 'Admissibility filtering']
    },
    {
      id: 'relevant_evidence',
      stepNo: 13,
      title: 'Relevant Evidence + Policies',
      subtitle: 'Grounded Evidence Isolation',
      layer: 'RAG / AI',
      icon: FileText,
      badge: 'GROUNDING',
      cardBg: 'bg-[#FFF7ED]',
      cardBorder: 'border-[#FDBA74]',
      cardHover: 'hover:border-[#EA580C] hover:shadow-sm',
      textColor: 'text-[#7C2D12]',
      subtitleColor: 'text-[#9A3412]',
      iconBg: 'bg-[#FFEDD5]',
      iconColor: 'text-[#EA580C]',
      badgeBg: 'bg-[#FFEDD5]',
      badgeText: 'text-[#C2410C]',
      gradientTop: 'from-[#EA580C] to-[#F97316]',
      inputs: 'Retrieved evidence metadata, audit timestamps, dim_deletion_rule requirements',
      outputs: 'Structured, untrusted evidence blocks for LLM prompt ingestion',
      description: 'Pairs each finding with its proving file_id, activity_id, or statutory policy retention rule while marking external content untrusted.',
      keyFunctions: ['Prompt payload packaging', 'Evidence reference binding', 'Prompt injection shielding']
    },
    {
      id: 'gemini_api',
      stepNo: 14,
      title: 'Gemini API',
      subtitle: 'Zero-Hallucination Reasoner',
      layer: 'RAG / AI',
      icon: Sparkles,
      badge: 'GEMINI 2.5',
      cardBg: 'bg-white',
      cardBorder: 'border-[#EA580C]',
      cardHover: 'hover:border-[#C2410C] hover:shadow-md ring-2 ring-[#EA580C]/20',
      textColor: 'text-stone-900',
      subtitleColor: 'text-stone-500',
      iconBg: 'bg-[#FFEAE0]',
      iconColor: 'text-[#EA580C]',
      badgeBg: 'bg-[#EA580C]',
      badgeText: 'text-white',
      gradientTop: 'from-[#EA580C] via-[#9B72CB] to-[#4285F4]',
      inputs: 'Grounded prompt payload with system constraints and Gold determinations',
      outputs: 'Structured forensic audit explanation vectors',
      description: 'Executes under strict system prompt: document content is treated as untrusted evidence; decisions come solely from the Gold analytical warehouse.',
      keyFunctions: ['Zero-hallucination synthesis', 'Forensic justification generation', 'Citation validation']
    },
    {
      id: 'natural_lang',
      stepNo: 15,
      title: 'Natural Language Explanations',
      subtitle: 'Audit Reasoning & Compliance Reports',
      layer: 'RAG / AI',
      icon: Bot,
      badge: 'EXPLANATIONS',
      cardBg: 'bg-[#FFF7ED]',
      cardBorder: 'border-[#FFEDD5]',
      cardHover: 'hover:border-[#FDBA74] hover:shadow-sm',
      textColor: 'text-[#7C2D12]',
      subtitleColor: 'text-[#9A3412]',
      iconBg: 'bg-[#FFEDD5]',
      iconColor: 'text-[#EA580C]',
      badgeBg: 'bg-[#FFEDD5]',
      badgeText: 'text-[#C2410C]',
      gradientTop: 'from-[#EA580C] to-[#F97316]',
      branchesOutTo: ['streamlit_dashboard'],
      inputs: 'Structured LLM outputs from Gemini API',
      outputs: 'Plain-English forensic explanations with exact file and activity citations',
      description: 'Synthesizes why a case is complete or incomplete, detailing residual systems and necessary verification checks for legal compliance.',
      keyFunctions: ['Executive summaries', 'Technical audit notes', 'Citation linking']
    },
    {
      id: 'streamlit_dashboard',
      stepNo: 16,
      title: 'Streamlit Dashboard',
      subtitle: 'AEGIS SOC Forensic Portal (Port 6969 & 8501)',
      layer: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'SOC AUDIT PORTAL',
      cardBg: 'bg-[#F0FDF4]',
      cardBorder: 'border-[#86EFAC]',
      cardHover: 'hover:border-[#22C55E] hover:shadow-md',
      textColor: 'text-[#14532D]',
      subtitleColor: 'text-[#166534]',
      iconBg: 'bg-[#DCFCE7]',
      iconColor: 'text-[#15803D]',
      badgeBg: 'bg-[#DCFCE7]',
      badgeText: 'text-[#166534]',
      gradientTop: 'from-[#16A34A] to-[#15803D]',
      branchesInFrom: ['gold_outputs', 'natural_lang'],
      inputs: 'Gold analytical outputs + Gemini natural language explanations',
      outputs: 'Real-time analyst inspection interface and forensic case drill-downs',
      description: 'Interactive SOC portal providing dual-perspective analysis, case drill-down, and evidence verification.',
      keyFunctions: ['Dual-perspective switcher', 'Real-time evidence viewer', 'Live Gold warehouse query']
    },
    {
      id: 'charts_filters',
      stepNo: 17,
      title: 'Charts, Filters, Search',
      subtitle: 'Case & Customer Analysis',
      layer: 'Dashboard',
      icon: Sliders,
      badge: 'ANALYTICAL DRILLDOWN',
      cardBg: 'bg-[#ECFDF5]',
      cardBorder: 'border-[#A7F3D0]',
      cardHover: 'hover:border-[#34D399] hover:shadow-sm',
      textColor: 'text-[#064E3B]',
      subtitleColor: 'text-[#065F46]',
      iconBg: 'bg-[#D1FAE5]',
      iconColor: 'text-[#059669]',
      badgeBg: 'bg-[#D1FAE5]',
      badgeText: 'text-[#065F46]',
      gradientTop: 'from-[#059669] to-[#047857]',
      inputs: 'Dashboard query engines and interactive filters',
      outputs: 'Dynamic visualizations, microservice leakage matrices, case drill-down',
      description: 'Enables auditors to filter by system_id, examine retention exceptions, and export compliant CSV records.',
      keyFunctions: ['Microservice leakage matrix', 'Customer timeline search', 'CSV export']
    }
  ];

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[6];
  const SelectedIcon = selectedNode.icon;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
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
                17 Stages &bull; Strict Acyclicity
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-[#525B69] mt-0.5 leading-relaxed max-w-3xl">
              Complete acyclic architectural pipeline from Raw Data Ingestion to Bronze lakehouse, Silver relational normalization, Gold analytical marts, Gemini RAG reasoning, and the interactive SOC Dashboard.
            </p>
          </div>

          <div className="text-xs font-mono px-3.5 py-2 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] text-stone-600 shadow-2xs shrink-0 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse"></span>
            <span>2 Lateral Cross-Branch Paths Active</span>
          </div>
        </div>

        {/* Color Legend Bar Matching Website */}
        <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#EFE5DB] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-stone-500 font-bold">Layers:</span>
            <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200 text-[10px] font-mono font-semibold">
              Raw Ingestion
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#FBE9DC] text-[#B45309] border border-[#EAD5C3] text-[10px] font-mono font-semibold">
              Bronze Lake (SHA-256)
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-mono font-semibold">
              Silver (8 Normalized Tables)
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#FEF08A] text-[#854D0E] border border-[#FDE047] text-[10px] font-mono font-semibold">
              Gold (Analytics &amp; Marts)
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#FFEAE0] text-[#EA580C] border border-[#FDBA74] text-[10px] font-mono font-semibold">
              RAG &amp; Gemini AI
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] text-[10px] font-mono font-semibold">
              SOC Dashboard Portal
            </span>
          </div>

          <span className="text-[11px] font-mono text-stone-500">
            Click any node below to inspect schema &amp; logic &rarr;
          </span>
        </div>
      </div>

      {/* Main DAG Visual Canvas with Interactive Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left / Center Column: The Exact Vertical DAG Flow matching the Uploaded Diagram */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE5DB] shadow-xs relative">
          
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#EFE5DB]">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#EA580C]" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-900 font-mono">
                Topological Execution Graph
              </h3>
            </div>
            <div className="text-[11px] font-mono text-stone-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>17 Nodes &bull; 0 Cycles</span>
            </div>
          </div>

          {/* Vertical Pipeline Spine with Branch Rails */}
          <div className="relative max-w-xl mx-auto space-y-3">

            {nodes.map((node, index) => {
              const Icon = node.icon;
              const isSelected = selectedNodeId === node.id;
              const isSilverDb = node.id === 'silver_db';
              const isGoldOutputs = node.id === 'gold_outputs';
              const isRagRetrieval = node.id === 'rag_retrieval';
              const isDashboard = node.id === 'streamlit_dashboard';

              return (
                <div key={node.id} className="relative">
                  
                  {/* Lateral Branch Marker for Silver Database (Branches to RAG) */}
                  {isSilverDb && (
                    <div className="hidden sm:flex absolute -right-28 top-1/2 -translate-y-1/2 items-center gap-1.5 text-[10px] font-mono font-bold text-[#EA580C] bg-[#FFEAE0] px-2 py-1 rounded-lg border border-[#FDBA74] shadow-2xs z-10">
                      <span>Feeds RAG</span>
                      <CornerDownRight className="w-3 h-3 text-[#EA580C]" />
                    </div>
                  )}

                  {/* Lateral Branch Marker for Gold Outputs (Branches to Dashboard) */}
                  {isGoldOutputs && (
                    <div className="hidden sm:flex absolute -left-32 top-1/2 -translate-y-1/2 items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-300 shadow-2xs z-10">
                      <CornerRightDown className="w-3 h-3 text-emerald-700" />
                      <span>Feeds Dashboard</span>
                    </div>
                  )}

                  {/* Lateral Inbound Marker for RAG Retrieval */}
                  {isRagRetrieval && (
                    <div className="hidden sm:flex absolute -right-32 top-1/2 -translate-y-1/2 items-center gap-1.5 text-[10px] font-mono font-bold text-[#EA580C] bg-[#FFEAE0] px-2 py-1 rounded-lg border border-[#FDBA74] shadow-2xs z-10">
                      <span>&larr; From Silver DB</span>
                    </div>
                  )}

                  {/* Lateral Inbound Marker for Dashboard */}
                  {isDashboard && (
                    <div className="hidden sm:flex absolute -left-32 top-1/2 -translate-y-1/2 items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-300 shadow-2xs z-10">
                      <span>From Gold &rarr;</span>
                    </div>
                  )}

                  {/* The Node Card */}
                  <div
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`group relative rounded-2xl p-4 sm:p-4.5 border transition-all duration-200 cursor-pointer shadow-2xs flex items-center justify-between gap-3 ${node.cardBg} ${node.cardBorder} ${node.cardHover} ${
                      isSelected ? 'ring-3 ring-[#EA580C]/30 shadow-md scale-[1.01]' : ''
                    }`}
                  >
                    {/* Top Accent Gradient Line */}
                    {node.gradientTop && (
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${node.gradientTop} rounded-t-2xl`} />
                    )}

                    <div className="flex items-center gap-3.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${node.iconBg} ${node.iconColor}`}>
                        <Icon className="w-4.5 h-4.5 stroke-[2]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-bold tracking-tight ${node.textColor}`}>
                            {node.title}
                          </h4>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${node.badgeBg} ${node.badgeText}`}>
                            {node.badge}
                          </span>
                        </div>
                        {node.subtitle && (
                          <p className={`text-xs font-mono mt-0.5 ${node.subtitleColor}`}>
                            {node.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-stone-400 group-hover:text-stone-700 transition-colors">
                        #{node.stepNo}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-600 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>

                  {/* Vertical Connector Arrow */}
                  {index < nodes.length - 1 && (
                    <div className="flex justify-center my-1 text-stone-300">
                      <ArrowDown className="w-3.5 h-3.5 text-stone-400 stroke-[2.5]" />
                    </div>
                  )}

                </div>
              );
            })}

          </div>

        </div>

        {/* Right Column: Node Inspector & Forensic Logic Deep-Dive */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#EFE5DB] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE5DB]">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${selectedNode.iconBg} ${selectedNode.iconColor}`}>
                  <SelectedIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-stone-400 block leading-tight">
                    Node #{selectedNode.stepNo} Inspector
                  </span>
                  <h4 className="text-sm font-extrabold text-stone-900 leading-tight">
                    {selectedNode.title}
                  </h4>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${selectedNode.badgeBg} ${selectedNode.badgeText}`}>
                {selectedNode.layer}
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed font-normal">
              {selectedNode.description}
            </p>

            {/* Inputs & Outputs Breakdown */}
            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE5DB]">
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-[#EA580C]" />
                  Incoming Inputs
                </span>
                <span className="text-stone-800 text-[11px] leading-snug block font-medium">
                  {selectedNode.inputs}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Produced Outputs
                </span>
                <span className="text-emerald-900 text-[11px] leading-snug block font-medium">
                  {selectedNode.outputs}
                </span>
              </div>
            </div>

            {/* Algorithmic Responsibilities */}
            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold text-stone-400 font-mono block mb-2">
                Key Pipeline Functions
              </span>
              <ul className="space-y-1.5">
                {selectedNode.keyFunctions.map((fn, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-stone-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0"></span>
                    <span>{fn}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Branching Notice */}
            {(selectedNode.branchesOutTo || selectedNode.branchesInFrom) && (
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs text-stone-700 space-y-1">
                <span className="text-[10px] font-bold uppercase font-mono text-[#EA580C] block">
                  Acyclic Bypass Route
                </span>
                {selectedNode.branchesOutTo && (
                  <p className="text-[11px] text-stone-600">
                    &bull; Transmits direct context feed to: <strong className="text-stone-900 font-semibold">{selectedNode.branchesOutTo.join(', ')}</strong>
                  </p>
                )}
                {selectedNode.branchesInFrom && (
                  <p className="text-[11px] text-stone-600">
                    &bull; Receives direct bypass stream from: <strong className="text-stone-900 font-semibold">{selectedNode.branchesInFrom.join(', ')}</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick Summary Card */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] text-xs text-stone-600 space-y-1.5">
            <div className="flex items-center gap-1.5 text-stone-900 font-bold">
              <Activity className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>Zero-Hallucination Invariant</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Every audit status is mathematically derived in the Gold layer from verified Silver facts. The Gemini RAG layer synthesizes natural language citations but cannot mutate decisions.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
