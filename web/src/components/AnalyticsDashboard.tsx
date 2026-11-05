import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, FileSpreadsheet, Users, GitMerge, Layers, Paperclip,
  CheckCircle2, AlertTriangle, Slash, HelpCircle, SlidersHorizontal, 
  Download, Search, Database, ExternalLink, Sparkles,
  Camera, ZoomIn, ZoomOut, Move, RotateCcw, ArrowRight, Activity
} from 'lucide-react';
import challengeWarehouseData from '../data/gold_warehouse_data.json';
import silverWarehouseData from '../data/silver_warehouse_data.json';
import evidenceManifest from '../data/evidence_manifest.json';

interface GoldCase {
  case_id: string;
  customer_id: string;
  request_date: string;
  request_status: string;
  audit_cutoff: string;
  overall_deletion_status: string;
  deletion_completion_status: string;
  deleted_resource_count: number;
  anonymized_resource_count: number;
  archived_resource_count: number;
  retained_resource_count: number;
  pending_resource_count: number;
  unverified_resource_count: number;
  total_resource_count: number;
  completion_percentage: number;
  policy_exception_count: number;
  unresolved_identity_count: number;
  evidence_completeness: string;
  last_verified_at: string;
  analysis_timestamp: string;
  request_text: string;
  evidence_references: string;
}

interface GoldResource {
  case_id: string;
  customer_id: string;
  resource_id: string;
  system_id: string;
  resource_type: string;
  silver_state: string;
  verified_state: string;
  policy_action: string;
  policy_reason: string;
  evidence_references: string;
  classification_reason: string;
  last_verified_at: string;
  audit_cutoff: string;
}

interface SystemSummary {
  system_id: string;
  total_resources: number;
  deleted_count: number;
  anonymized_count: number;
  archived_count: number;
  retained_count: number;
  pending_count: number;
  incomplete_count: number;
  unverified_count: number;
}

interface EvidenceFile {
  file_id: string;
  file_path: string;
  format?: string;
  origin: string;
  captured_at: string;
  size_bytes?: number;
}

export const AnalyticsDashboard: React.FC = () => {
  // Top-level Streamlit Dashboard Page Selector
  const [streamlitPage, setStreamlitPage] = useState<'forensic' | 'overview' | 'bronze' | 'silver' | 'gold' | 'live'>('forensic');

  // Secondary sub-tab for Forensic Audit Analytics
  const [activeTab, setActiveTab] = useState<'cases' | 'systems' | 'resources'>('cases');

  // Secondary sub-tab for Silver analysis
  const [silverTable, setSilverTable] = useState<'requests' | 'customers' | 'identity_history' | 'policies' | 'activities' | 'links'>('requests');

  // Secondary sub-tab for Gold analysis
  const [goldView, setGoldView] = useState<'cases' | 'resources'>('cases');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedCase, setSelectedCase] = useState<GoldCase | null>(null);

  // Bronze filter
  const [bronzeSearch, setBronzeSearch] = useState('');
  const [bronzeFormatFilter, setBronzeFormatFilter] = useState('ALL');

  // Gold search filters
  const [goldSearchCase, setGoldSearchCase] = useState('');
  const [goldSearchUser, setGoldSearchUser] = useState('');
  const [goldSearchResource, setGoldSearchResource] = useState('');
  const [goldSearchStatus, setGoldSearchStatus] = useState('ALL');

  const rawCases: GoldCase[] = challengeWarehouseData.cases as GoldCase[];
  const rawResources: GoldResource[] = challengeWarehouseData.resources as GoldResource[];
  const systems: SystemSummary[] = (challengeWarehouseData.systems || []) as SystemSummary[];
  const evidenceList: EvidenceFile[] = evidenceManifest as EvidenceFile[];

  // Grounded Metrics for Challenge Dataset
  const challengeMetrics = {
    requests: 518,
    users: 850,
    identityChanges: 306,
    systemActivities: 4011,
    evidenceFiles: 94,
    statusBreakdown: {
      incomplete: 462,
      complete: 47,
      notApplicable: 9,
      unverified: 0
    },
    avgSteps: '4.2',
    stepDistribution: [
      { step: 0, count: 151 },
      { step: 1, count: 1 },
      { step: 2, count: 32 },
      { step: 3, count: 51 },
      { step: 4, count: 26 },
      { step: 5, count: 30 },
      { step: 6, count: 129 },
      { step: 7, count: 30 },
      { step: 8, count: 22 },
      { step: 9, count: 1 },
      { step: 10, count: 0 },
      { step: 11, count: 8 },
      { step: 12, count: 27 },
      { step: 13, count: 1 },
      { step: 14, count: 6 }
    ]
  };

  const currentMetrics = challengeMetrics;

  // Case resources lookup map for fast drill-down
  const resourcesByCase = useMemo(() => {
    const map: Record<string, GoldResource[]> = {};
    rawResources.forEach(r => {
      if (!map[r.case_id]) map[r.case_id] = [];
      map[r.case_id].push(r);
    });
    return map;
  }, [rawResources]);

  // Filtered cases
  const filteredCases = useMemo(() => {
    return rawCases.filter(c => {
      const matchesSearch = 
        c.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.request_text.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || c.overall_deletion_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rawCases, searchQuery, statusFilter]);

  // Filtered resources
  const filteredResources = useMemo(() => {
    return rawResources.filter(r => {
      const matchesSearch = 
        r.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.resource_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.resource_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.classification_reason.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [rawResources, searchQuery]);

  // Bronze filtered list
  const filteredBronze = useMemo(() => {
    return evidenceList.filter(e => {
      const matchesSearch = 
        e.file_id.toLowerCase().includes(bronzeSearch.toLowerCase()) ||
        e.origin.toLowerCase().includes(bronzeSearch.toLowerCase()) ||
        e.file_path.toLowerCase().includes(bronzeSearch.toLowerCase());
      const matchesFormat = bronzeFormatFilter === 'ALL' || e.format === bronzeFormatFilter;
      return matchesSearch && matchesFormat;
    });
  }, [evidenceList, bronzeSearch, bronzeFormatFilter]);

  // Bronze format counts
  const bronzeFormatCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    evidenceList.forEach(e => {
      const fmt = e.format || 'UNKNOWN';
      counts[fmt] = (counts[fmt] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [evidenceList]);

  // Gold filtered cases & resources
  const filteredGoldCases = useMemo(() => {
    return rawCases.filter(c => {
      const matchesCase = !goldSearchCase || c.case_id.toLowerCase().includes(goldSearchCase.toLowerCase());
      const matchesUser = !goldSearchUser || c.customer_id.toLowerCase().includes(goldSearchUser.toLowerCase());
      const matchesStatus = goldSearchStatus === 'ALL' || c.overall_deletion_status === goldSearchStatus;
      return matchesCase && matchesUser && matchesStatus;
    });
  }, [rawCases, goldSearchCase, goldSearchUser, goldSearchStatus]);

  const filteredGoldResources = useMemo(() => {
    return rawResources.filter(r => {
      const matchesCase = !goldSearchCase || r.case_id.toLowerCase().includes(goldSearchCase.toLowerCase());
      const matchesUser = !goldSearchUser || r.customer_id.toLowerCase().includes(goldSearchUser.toLowerCase());
      const matchesRes = !goldSearchResource || r.resource_id.toLowerCase().includes(goldSearchResource.toLowerCase());
      const matchesStatus = goldSearchStatus === 'ALL' || r.verified_state === goldSearchStatus;
      return matchesCase && matchesUser && matchesRes && matchesStatus;
    });
  }, [rawResources, goldSearchCase, goldSearchUser, goldSearchResource, goldSearchStatus]);

  const exportCSV = () => {
    const headers = "case_id,customer_id,status,request_status,total_resources,completion_pct,audit_cutoff\n";
    const rows = filteredCases.map(c => 
      `"${c.case_id}","${c.customer_id}","${c.overall_deletion_status}","${c.request_status}","${c.total_resource_count}","${c.completion_percentage}%","${c.audit_cutoff}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enterprise_deletion_analytics_challenge_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      
      {/* =========================================================================
          TOP LEVEL STREAMLIT MULTI-PAGE NAVIGATION BAR (Warm Cream / Orange Theme)
          ========================================================================= */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 border border-[#EFE5DB] shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setStreamlitPage('forensic')}
            className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              streamlitPage === 'forensic'
                ? 'bg-[#191D24] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF7F2]'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${streamlitPage === 'forensic' ? 'text-[#EA580C]' : 'text-stone-400'}`} />
            <span>Forensic Audit Analytics</span>
          </button>

          <button
            onClick={() => setStreamlitPage('overview')}
            className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              streamlitPage === 'overview'
                ? 'bg-[#191D24] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF7F2]'
            }`}
          >
            <Layers className={`w-4 h-4 ${streamlitPage === 'overview' ? 'text-[#EA580C]' : 'text-stone-400'}`} />
            <span>Overview & Lineage</span>
          </button>

          <button
            onClick={() => setStreamlitPage('bronze')}
            className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              streamlitPage === 'bronze'
                ? 'bg-[#191D24] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF7F2]'
            }`}
          >
            <Paperclip className={`w-4 h-4 ${streamlitPage === 'bronze' ? 'text-[#EA580C]' : 'text-stone-400'}`} />
            <span>Bronze Analysis</span>
          </button>

          <button
            onClick={() => setStreamlitPage('silver')}
            className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              streamlitPage === 'silver'
                ? 'bg-[#191D24] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF7F2]'
            }`}
          >
            <Database className={`w-4 h-4 ${streamlitPage === 'silver' ? 'text-[#EA580C]' : 'text-stone-400'}`} />
            <span>Silver Analysis</span>
          </button>

          <button
            onClick={() => setStreamlitPage('gold')}
            className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              streamlitPage === 'gold'
                ? 'bg-[#191D24] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF7F2]'
            }`}
          >
            <FileSpreadsheet className={`w-4 h-4 ${streamlitPage === 'gold' ? 'text-[#EA580C]' : 'text-stone-400'}`} />
            <span>Gold Analysis</span>
          </button>

          <button
            onClick={() => setStreamlitPage('live')}
            className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              streamlitPage === 'live'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'text-[#EA580C] hover:bg-[#FFEAE0] bg-[#FAF7F2]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Live Streamlit App</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>
        </div>

        {/* Global Export & Source indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-stone-500 bg-[#FAF7F2] px-2.5 py-1 rounded-xl border border-[#EFE5DB]">
            Grounded &bull; 518 Cases
          </span>
          <button
            onClick={exportCSV}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* =========================================================================
          PAGE 1: FORENSIC AUDIT ANALYTICS (Grounded 518 Deletion Dashboard)
          ========================================================================= */}
      {streamlitPage === 'forensic' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-6">
            
            {/* Top Header Card */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-[#FFEAE0] text-[#D94E1B] flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-[#E06D3B]" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#191D24] tracking-tight">
                    Forensic Deletion Audit Analytics
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[#5B6575]">
                  Quantitative breakdown of deletion compliance, surviving records, policy violations, and replication drift across the 518-case dataset.
                </p>
              </div>
            </div>

            {/* ROW 1: TOP 5 METRIC CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              
              <div className="bg-white rounded-2xl p-4 border border-[#EFE5DB] shadow-2xs flex flex-col justify-between hover:border-stone-400 transition">
                <div className="flex items-center justify-between text-stone-600">
                  <span className="text-xs font-medium">Deletion requests</span>
                  <FileSpreadsheet className="w-4 h-4 text-stone-400 stroke-[1.5]" />
                </div>
                <div className="text-3xl font-black text-stone-900 mt-2 tracking-tight">
                  {currentMetrics.requests}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[#EFE5DB] shadow-2xs flex flex-col justify-between hover:border-stone-400 transition">
                <div className="flex items-center justify-between text-stone-600">
                  <span className="text-xs font-medium">Unique users</span>
                  <Users className="w-4 h-4 text-stone-400 stroke-[1.5]" />
                </div>
                <div className="text-3xl font-black text-stone-900 mt-2 tracking-tight">
                  {currentMetrics.users}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[#EFE5DB] shadow-2xs flex flex-col justify-between hover:border-stone-400 transition">
                <div className="flex items-center justify-between text-stone-600">
                  <span className="text-xs font-medium">Identity changes</span>
                  <GitMerge className="w-4 h-4 text-stone-400 stroke-[1.5]" />
                </div>
                <div className="text-3xl font-black text-stone-900 mt-2 tracking-tight">
                  {currentMetrics.identityChanges}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[#EFE5DB] shadow-2xs flex flex-col justify-between hover:border-stone-400 transition">
                <div className="flex items-center justify-between text-stone-600">
                  <span className="text-xs font-medium">System activities</span>
                  <Layers className="w-4 h-4 text-stone-400 stroke-[1.5]" />
                </div>
                <div className="text-3xl font-black text-stone-900 mt-2 tracking-tight">
                  {currentMetrics.systemActivities}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[#EFE5DB] shadow-2xs flex flex-col justify-between hover:border-stone-400 transition col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-stone-600">
                  <span className="text-xs font-medium">Evidence files</span>
                  <Paperclip className="w-4 h-4 text-stone-400 stroke-[1.5]" />
                </div>
                <div className="text-3xl font-black text-stone-900 mt-2 tracking-tight">
                  {currentMetrics.evidenceFiles}
                </div>
              </div>

            </div>

            {/* ROW 2: TWO CHARTS SIDE-BY-SIDE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              
              {/* LEFT CHART: Deletion status */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-5 border border-[#EFE5DB] shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                    Deletion status distribution
                  </h3>
                  <div className="text-[10px] space-y-1 font-mono text-stone-600 shrink-0">
                    <span className="text-stone-400 text-[9px] uppercase font-bold block mb-0.5">status</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[#38BDF8]"></span>
                      <span>INCOMPLETE</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[#E06D3B]"></span>
                      <span>COMPLETE</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[#94A3B8]"></span>
                      <span>NOT_APPLICABLE</span>
                    </div>
                  </div>
                </div>

                <div className="relative h-56 w-full flex items-end pt-6 pb-6 pl-8 pr-2">
                  <div className="absolute left-0 top-0 bottom-6 w-7 flex flex-col justify-between text-[10px] font-mono text-stone-400 select-none">
                    <span>400</span>
                    <span>300</span>
                    <span>200</span>
                    <span>100</span>
                    <span className="text-right">0</span>
                  </div>
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-stone-400 font-mono select-none -translate-x-3">
                    count
                  </span>
                  <div className="absolute left-8 right-2 top-2 bottom-6 flex flex-col justify-between pointer-events-none">
                    <div className="border-b border-stone-100 w-full h-0"></div>
                    <div className="border-b border-stone-100 w-full h-0"></div>
                    <div className="border-b border-stone-100 w-full h-0"></div>
                    <div className="border-b border-stone-100 w-full h-0"></div>
                    <div className="border-b border-stone-200 w-full h-0"></div>
                  </div>

                  <div className="relative w-full h-full flex items-end justify-around z-10">
                    <div className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] font-mono font-bold text-stone-700 mb-1">
                        {currentMetrics.statusBreakdown.incomplete}
                      </span>
                      <div 
                        className="w-12 sm:w-16 bg-[#38BDF8] rounded-t transition-all group-hover:brightness-95 cursor-pointer shadow-2xs"
                        style={{ height: `${Math.min((currentMetrics.statusBreakdown.incomplete / 500) * 100, 100)}%` }}
                        title={`INCOMPLETE: ${currentMetrics.statusBreakdown.incomplete} cases`}
                      ></div>
                    </div>

                    <div className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] font-mono font-bold text-stone-700 mb-1">
                        {currentMetrics.statusBreakdown.complete}
                      </span>
                      <div 
                        className="w-12 sm:w-16 bg-[#E06D3B] rounded-t transition-all group-hover:brightness-95 cursor-pointer shadow-2xs"
                        style={{ height: `${Math.max((currentMetrics.statusBreakdown.complete / 500) * 100, 4)}%` }}
                        title={`COMPLETE: ${currentMetrics.statusBreakdown.complete} cases`}
                      ></div>
                    </div>

                    <div className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] font-mono font-bold text-stone-700 mb-1">
                        {currentMetrics.statusBreakdown.notApplicable}
                      </span>
                      <div 
                        className="w-12 sm:w-16 bg-[#94A3B8] rounded-t transition-all group-hover:brightness-95 cursor-pointer shadow-2xs"
                        style={{ height: `${Math.max((currentMetrics.statusBreakdown.notApplicable / 500) * 100, 2)}%` }}
                        title={`NOT_APPLICABLE: ${currentMetrics.statusBreakdown.notApplicable} cases`}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="w-full pl-8 pr-2 flex justify-around text-[10px] font-mono text-stone-600 font-semibold select-none pt-1 border-t border-stone-200">
                  <span className="text-center w-16">INCOMPLETE</span>
                  <span className="text-center w-16">COMPLETE</span>
                  <span className="text-center w-16 truncate">NOT_APPLICABLE</span>
                </div>
                <div className="text-center text-[10px] text-stone-400 font-mono mt-1">status</div>
              </div>

              {/* RIGHT CHART: Cases by remediation-plan length */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-5 border border-[#EFE5DB] shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                    Cases by remediation-plan length
                  </h3>
                  <div className="hidden sm:flex items-center gap-1.5 text-stone-400 text-xs">
                    <span title="Download plot as png"><Camera className="w-3.5 h-3.5 hover:text-stone-700 cursor-pointer" /></span>
                    <span title="Zoom in"><ZoomIn className="w-3.5 h-3.5 hover:text-stone-700 cursor-pointer" /></span>
                    <span title="Zoom out"><ZoomOut className="w-3.5 h-3.5 hover:text-stone-700 cursor-pointer" /></span>
                    <span title="Pan"><Move className="w-3.5 h-3.5 hover:text-stone-700 cursor-pointer" /></span>
                    <span title="Reset axes"><RotateCcw className="w-3.5 h-3.5 hover:text-stone-700 cursor-pointer" /></span>
                  </div>
                </div>

                <div className="relative h-56 w-full flex items-end pt-6 pb-6 pl-8 pr-2">
                  <div className="absolute left-0 top-0 bottom-6 w-7 flex flex-col justify-between text-[10px] font-mono text-stone-400 select-none">
                    <span>150</span>
                    <span>100</span>
                    <span>50</span>
                    <span className="text-right">0</span>
                  </div>
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-stone-400 font-mono select-none -translate-x-4">
                    case_count
                  </span>
                  <div className="absolute left-8 right-2 top-2 bottom-6 flex flex-col justify-between pointer-events-none">
                    <div className="border-b border-stone-100 w-full h-0"></div>
                    <div className="border-b border-stone-100 w-full h-0"></div>
                    <div className="border-b border-stone-100 w-full h-0"></div>
                    <div className="border-b border-stone-200 w-full h-0"></div>
                  </div>

                  <div className="relative w-full h-full flex items-end justify-between gap-1 z-10 px-1">
                    {currentMetrics.stepDistribution.map((item) => {
                      const barHeightPct = item.count > 0 ? (item.count / 160) * 100 : 0;
                      return (
                        <div key={item.step} className="flex-1 flex flex-col items-center h-full justify-end group">
                          {item.count > 0 && (
                            <span className="text-[9px] font-mono text-stone-700 mb-0.5 leading-none">
                              {item.count}
                            </span>
                          )}
                          <div 
                            className={`w-full rounded-t transition-all group-hover:brightness-95 cursor-pointer ${
                              item.count > 0 ? 'bg-[#38BDF8] shadow-2xs' : 'bg-transparent'
                            }`}
                            style={{ height: `${barHeightPct}%` }}
                            title={`Step ${item.step}: ${item.count} cases`}
                          ></div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="w-full pl-8 pr-2 flex justify-between text-[10px] font-mono text-stone-500 font-semibold select-none pt-1 border-t border-stone-200">
                  <span>0</span>
                  <span>2</span>
                  <span>4</span>
                  <span>6</span>
                  <span>8</span>
                  <span>10</span>
                  <span>12</span>
                  <span>14</span>
                </div>
                <div className="text-center text-[10px] text-stone-400 font-mono mt-1">step_count</div>
              </div>

            </div>

            {/* ROW 3: BOTTOM 5 METRIC CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              
              <div className="bg-white rounded-2xl p-4 border border-[#EFE5DB] shadow-2xs flex flex-col justify-between hover:border-stone-400 transition">
                <div className="flex items-center justify-between text-stone-600">
                  <span className="text-xs font-medium">Complete</span>
                  <div className="w-4 h-4 rounded-full bg-[#E06D3B] text-white flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-stone-900 mt-2 tracking-tight">
                  {currentMetrics.statusBreakdown.complete}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[#EFE5DB] shadow-2xs flex flex-col justify-between hover:border-stone-400 transition">
                <div className="flex items-center justify-between text-stone-600">
                  <span className="text-xs font-medium">Incomplete</span>
                  <AlertTriangle className="w-4 h-4 text-[#E06D3B]" />
                </div>
                <div className="text-3xl font-black text-stone-900 mt-2 tracking-tight">
                  {currentMetrics.statusBreakdown.incomplete}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[#EFE5DB] shadow-2xs flex flex-col justify-between hover:border-stone-400 transition">
                <div className="flex items-center justify-between text-stone-600">
                  <span className="text-xs font-medium">Not applicable</span>
                  <Slash className="w-3.5 h-3.5 text-stone-400" />
                </div>
                <div className="text-3xl font-black text-stone-900 mt-2 tracking-tight">
                  {currentMetrics.statusBreakdown.notApplicable}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[#EFE5DB] shadow-2xs flex flex-col justify-between hover:border-stone-400 transition">
                <div className="flex items-center justify-between text-stone-600">
                  <span className="text-xs font-medium">Unverified</span>
                  <HelpCircle className="w-4 h-4 text-stone-400" />
                </div>
                <div className="text-3xl font-black text-stone-900 mt-2 tracking-tight">
                  {currentMetrics.statusBreakdown.unverified}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[#EFE5DB] shadow-2xs flex flex-col justify-between hover:border-stone-400 transition col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-stone-600">
                  <span className="text-xs font-medium">Average steps</span>
                  <SlidersHorizontal className="w-4 h-4 text-stone-400" />
                </div>
                <div className="text-3xl font-black text-stone-900 mt-2 tracking-tight">
                  {currentMetrics.avgSteps}
                </div>
              </div>

            </div>

          </div>

          {/* AUDIT DETAILS TABS: CASES, MICROSERVICES & RESOURCE LEVEL INSPECTION */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFE5DB] pb-3">
              <div className="flex gap-4 sm:gap-6 text-sm font-semibold">
                <button
                  onClick={() => setActiveTab('cases')}
                  className={`pb-3 transition relative flex items-center gap-2 cursor-pointer ${
                    activeTab === 'cases' ? 'text-[#EA580C] font-bold' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Audited Cases ({filteredCases.length})</span>
                  {activeTab === 'cases' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EA580C] rounded-full"></span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('systems')}
                  className={`pb-3 transition relative flex items-center gap-2 cursor-pointer ${
                    activeTab === 'systems' ? 'text-[#EA580C] font-bold' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>Microservices ({systems.length})</span>
                  {activeTab === 'systems' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EA580C] rounded-full"></span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('resources')}
                  className={`pb-3 transition relative flex items-center gap-2 cursor-pointer ${
                    activeTab === 'resources' ? 'text-[#EA580C] font-bold' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Resource Level ({filteredResources.length})</span>
                  {activeTab === 'resources' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#EA580C] rounded-full"></span>
                  )}
                </button>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search by ID, Customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#EFE5DB] rounded-xl text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-[#EA580C] w-48 sm:w-56"
                  />
                </div>

                {activeTab === 'cases' && (
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs bg-[#FAF7F2] border border-[#EFE5DB] rounded-xl px-2.5 py-1.5 text-stone-700 cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="INCOMPLETE">INCOMPLETE</option>
                    <option value="COMPLETE">COMPLETE</option>
                    <option value="NOT_APPLICABLE">NOT_APPLICABLE</option>
                  </select>
                )}
              </div>
            </div>

            {/* TAB CONTENT 1: CASES TABLE */}
            {activeTab === 'cases' && (
              <div className="overflow-x-auto rounded-2xl border border-[#EFE5DB]">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#FAF7F2] border-b border-[#EFE5DB] text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Case ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Reported</th>
                      <th className="py-3 px-4">Resources</th>
                      <th className="py-3 px-4">Completion</th>
                      <th className="py-3 px-4">Audit Cutoff</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE5DB] font-mono text-[11px]">
                    {filteredCases.slice(0, 50).map((c) => {
                      const isSelected = selectedCase?.case_id === c.case_id;
                      return (
                        <tr 
                          key={c.case_id}
                          onClick={() => setSelectedCase(isSelected ? null : c)}
                          className={`hover:bg-[#FAF7F2] transition cursor-pointer ${
                            isSelected ? 'bg-orange-50/60' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-bold text-stone-900">{c.case_id}</td>
                          <td className="py-3 px-4 text-stone-600">{c.customer_id}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.overall_deletion_status === 'COMPLETE' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : c.overall_deletion_status === 'INCOMPLETE'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-stone-200 text-stone-700'
                            }`}>
                              {c.overall_deletion_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-stone-500">{c.request_status}</td>
                          <td className="py-3 px-4 text-stone-700">{c.total_resource_count}</td>
                          <td className="py-3 px-4 font-sans">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    c.completion_percentage === 100 ? 'bg-emerald-500' : 'bg-[#EA580C]'
                                  }`}
                                  style={{ width: `${c.completion_percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] text-stone-500">{c.completion_percentage}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-stone-400 text-[10px]">{c.audit_cutoff.split('T')[0]}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCase(isSelected ? null : c);
                              }}
                              className="px-2 py-1 rounded bg-[#FAF7F2] border border-[#EFE5DB] hover:bg-stone-100 text-stone-700 text-[10px] font-sans font-semibold cursor-pointer"
                            >
                              {isSelected ? 'Close' : 'Inspect'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB CONTENT 2: SYSTEMS BREAKDOWN */}
            {activeTab === 'systems' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {systems.map((sys) => {
                  const compPct = sys.total_resources > 0 
                    ? Math.round((sys.deleted_count / sys.total_resources) * 100) 
                    : 100;
                  return (
                    <div 
                      key={sys.system_id}
                      className="p-4 rounded-2xl bg-white border border-[#EFE5DB] shadow-2xs hover:border-stone-400 transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-stone-900 truncate">
                          {sys.system_id.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] text-stone-600 border border-[#EFE5DB]">
                          {sys.total_resources} res
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-stone-500">
                          <span>Deleted: {sys.deleted_count}</span>
                          <span className="font-bold text-stone-800">{compPct}%</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-[#EA580C] h-full rounded-full transition-all"
                            style={{ width: `${compPct}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#EFE5DB] flex justify-between text-[10px] font-mono text-stone-400">
                        <span>Anon: {sys.anonymized_count}</span>
                        <span>Arch: {sys.archived_count}</span>
                        <span>Pending: {sys.pending_count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB CONTENT 3: RESOURCES TABLE */}
            {activeTab === 'resources' && (
              <div className="overflow-x-auto rounded-2xl border border-[#EFE5DB]">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#FAF7F2] border-b border-[#EFE5DB] text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Resource ID</th>
                      <th className="py-3 px-4">Case ID</th>
                      <th className="py-3 px-4">System</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Silver State</th>
                      <th className="py-3 px-4">Verified State</th>
                      <th className="py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE5DB] font-mono text-[11px]">
                    {filteredResources.slice(0, 50).map((r) => (
                      <tr key={r.resource_id} className="hover:bg-[#FAF7F2] transition">
                        <td className="py-3 px-4 font-bold text-stone-900">{r.resource_id}</td>
                        <td className="py-3 px-4 text-stone-600">{r.case_id}</td>
                        <td className="py-3 px-4 text-stone-500">{r.system_id}</td>
                        <td className="py-3 px-4 text-stone-700">{r.resource_type}</td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                            {r.silver_state}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            r.verified_state === 'DELETED' 
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.verified_state}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-500 text-[10px]">{r.policy_action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

          {/* CASE INSPECTION MODAL */}
          {selectedCase && (
            <div className="p-5 bg-white rounded-3xl border-2 border-[#EA580C]/30 shadow-lg space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE5DB]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#EA580C] flex items-center justify-center font-bold font-mono text-xs">
                    {selectedCase.case_id.replace('case_', '#')}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-stone-900">
                      Case Inspection: {selectedCase.case_id} ({selectedCase.customer_id})
                    </h4>
                    <p className="text-[11px] text-stone-500 font-mono">
                      Status: {selectedCase.overall_deletion_status} &bull; Audit Cutoff: {selectedCase.audit_cutoff}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EFE5DB] text-xs font-mono text-stone-700">
                <span className="text-stone-400 font-sans block mb-1 font-semibold text-[10px] uppercase">Original Request Text:</span>
                "{selectedCase.request_text}"
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-bold text-stone-800 uppercase tracking-wider font-mono">
                  Associated System Resources ({resourcesByCase[selectedCase.case_id]?.length || 0})
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {resourcesByCase[selectedCase.case_id]?.map((res) => (
                    <div key={res.resource_id} className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFE5DB] text-xs font-mono">
                      <div className="font-bold text-stone-900">{res.resource_id}</div>
                      <div className="text-[10px] text-stone-500">{res.system_id} ({res.resource_type})</div>
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="text-stone-400">Verified:</span>
                        <span className="font-bold text-[#EA580C]">{res.verified_state}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          PAGE 2: OVERVIEW & MEDALLION LINEAGE (Streamlit Tab 1 Replication)
          ========================================================================= */}
      {streamlitPage === 'overview' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-[#FFEAE0] text-[#D94E1B] flex items-center justify-center">
                <Layers className="w-4 h-4 text-[#E06D3B]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#191D24] tracking-tight">
                Medallion Warehouse Overview & Data Lineage
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#5B6575]">
              Real-time synchronization metrics across Bronze raw evidence, Silver Lakehouse tables, and Gold audited resources.
            </p>
          </div>

          {/* Top 5 Metrics Container */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EFE5DB]">
              <div className="text-xs font-medium text-stone-600">Bronze Evidence</div>
              <div className="text-3xl font-black text-stone-900 mt-2">{evidenceList.length}</div>
              <div className="text-[10px] text-stone-400 mt-1 font-mono">94 source files</div>
            </div>
            <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EFE5DB]">
              <div className="text-xs font-medium text-stone-600">Silver Requests</div>
              <div className="text-3xl font-black text-stone-900 mt-2">{silverWarehouseData.counts.requests}</div>
              <div className="text-[10px] text-stone-400 mt-1 font-mono">fact_deletion_request</div>
            </div>
            <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EFE5DB]">
              <div className="text-xs font-medium text-stone-600">Silver Resources</div>
              <div className="text-3xl font-black text-stone-900 mt-2">{silverWarehouseData.counts.resources}</div>
              <div className="text-[10px] text-stone-400 mt-1 font-mono">fact_resource</div>
            </div>
            <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EFE5DB]">
              <div className="text-xs font-medium text-stone-600">Gold Cases</div>
              <div className="text-3xl font-black text-stone-900 mt-2">{rawCases.length}</div>
              <div className="text-[10px] text-stone-400 mt-1 font-mono">customer_deletion_audit</div>
            </div>
            <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#EFE5DB] col-span-2 sm:col-span-1">
              <div className="text-xs font-medium text-stone-600">Gold Resources</div>
              <div className="text-3xl font-black text-stone-900 mt-2">{rawResources.length}</div>
              <div className="text-[10px] text-stone-400 mt-1 font-mono">resource_audit</div>
            </div>
          </div>

          {/* Lineage & Coverage Cards Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Medallion Flow Diagram */}
            <div className="p-5 rounded-2xl border border-[#EFE5DB] bg-white space-y-4">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#EA580C]" />
                Synthetic Data Lineage (Medallion Pipeline)
              </h3>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#FAF7F2] rounded-xl border border-[#EFE5DB]">
                <div className="flex-1 text-center p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="font-bold text-xs text-amber-800">Bronze Layer</div>
                  <div className="text-[10px] text-amber-600 mt-1">Raw Evidence Files</div>
                  <div className="text-xs font-mono font-bold mt-1">94 files</div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 shrink-0 hidden sm:block" />
                <div className="flex-1 text-center p-3 rounded-lg bg-slate-100 border border-slate-300">
                  <div className="font-bold text-xs text-slate-800">Silver Layer</div>
                  <div className="text-[10px] text-slate-600 mt-1">Clean Lakehouse DB</div>
                  <div className="text-xs font-mono font-bold mt-1">8 Tables</div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 shrink-0 hidden sm:block" />
                <div className="flex-1 text-center p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="font-bold text-xs text-[#EA580C]">Gold Layer</div>
                  <div className="text-[10px] text-orange-600 mt-1">Audited Warehouse</div>
                  <div className="text-xs font-mono font-bold mt-1">518 Cases</div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 shrink-0 hidden sm:block" />
                <div className="flex-1 text-center p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="font-bold text-xs text-emerald-800">Forensics</div>
                  <div className="text-[10px] text-emerald-600 mt-1">Predictions (output.csv)</div>
                  <div className="text-xs font-mono font-bold mt-1">100% Valid</div>
                </div>
              </div>

              <div className="text-xs text-stone-600 leading-relaxed font-sans">
                Each deletion request traverses from unstructured evidence files (logs, SQL dumps, PDFs, JSONs) into structured Silver relation tables, then evaluated against deletion rules to form Gold audited state matrices.
              </div>
            </div>

            {/* Coverage Card */}
            <div className="p-5 rounded-2xl border border-[#EFE5DB] bg-white space-y-4">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#EA580C]" />
                Dataset Coverage & Scope
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE5DB]">
                  <span className="text-xs font-medium text-stone-700">Evidence Formats (Bronze)</span>
                  <span className="font-mono font-bold text-xs text-[#EA580C]">6 Distinct Types</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE5DB]">
                  <span className="text-xs font-medium text-stone-700">Microservices Monitored (Silver)</span>
                  <span className="font-mono font-bold text-xs text-[#EA580C]">16 Systems</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE5DB]">
                  <span className="text-xs font-medium text-stone-700">Gold Audit Statuses</span>
                  <span className="font-mono font-bold text-xs text-[#EA580C]">COMPLETE, INCOMPLETE, NOT_APPLICABLE</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE5DB]">
                  <span className="text-xs font-medium text-stone-700">Deterministic Pass Rate</span>
                  <span className="font-mono font-bold text-xs text-emerald-600">100% Deterministic (Python 3.13)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PAGE 3: BRONZE ANALYSIS (Raw Evidence Layer Replication)
          ========================================================================= */}
      {streamlitPage === 'bronze' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-[#FFEAE0] text-[#D94E1B] flex items-center justify-center">
                <Paperclip className="w-4 h-4 text-[#E06D3B]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#191D24] tracking-tight">
                Bronze: Raw Synthetic Evidence Manifest
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#5B6575]">
              Full participant-facing evidence catalogue across logs, SQL relational snapshots, JSON payloads, and image artifacts.
            </p>
          </div>

          {/* Top 3 KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB]">
              <div className="text-xs font-medium text-stone-600">Total Evidence Files</div>
              <div className="text-3xl font-black text-stone-900 mt-2">{evidenceList.length}</div>
              <div className="text-[10px] text-stone-400 mt-1 font-mono">94 Ground Truth Files</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB]">
              <div className="text-xs font-medium text-stone-600">File Formats</div>
              <div className="text-3xl font-black text-stone-900 mt-2">{bronzeFormatCounts.length}</div>
              <div className="text-[10px] text-stone-400 mt-1 font-mono">LOG, JSON, SQL, PNG, PDF, TXT</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB]">
              <div className="text-xs font-medium text-stone-600">Source Origins</div>
              <div className="text-3xl font-black text-stone-900 mt-2">30</div>
              <div className="text-[10px] text-stone-400 mt-1 font-mono">Distributed Microservices</div>
            </div>
          </div>

          {/* Charts: Format Distribution */}
          <div className="p-5 rounded-2xl border border-[#EFE5DB] bg-white space-y-4">
            <h3 className="font-bold text-sm text-stone-900">Evidence Formats Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {bronzeFormatCounts.map(([fmt, cnt]) => (
                <div key={fmt} className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE5DB] text-center">
                  <div className="text-xs font-bold text-stone-600">{fmt}</div>
                  <div className="text-2xl font-black text-[#EA580C] mt-1">{cnt}</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">{((cnt / evidenceList.length) * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Searchable Evidence Manifest Table */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-sm text-stone-900">
                Evidence Files Catalogue ({filteredBronze.length} matches)
              </h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search evidence ID or path..."
                    value={bronzeSearch}
                    onChange={(e) => setBronzeSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#EFE5DB] rounded-xl w-52"
                  />
                </div>
                <select
                  value={bronzeFormatFilter}
                  onChange={(e) => setBronzeFormatFilter(e.target.value)}
                  className="text-xs bg-[#FAF7F2] border border-[#EFE5DB] rounded-xl px-2.5 py-1.5 text-stone-700 cursor-pointer"
                >
                  <option value="ALL">All Formats</option>
                  {bronzeFormatCounts.map(([fmt]) => (
                    <option key={fmt} value={fmt}>{fmt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#EFE5DB]">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#FAF7F2] border-b border-[#EFE5DB] text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">File ID</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4">Origin</th>
                    <th className="py-3 px-4">Path</th>
                    <th className="py-3 px-4">Captured At</th>
                    <th className="py-3 px-4">Size (Bytes)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE5DB] font-mono text-[11px]">
                  {filteredBronze.slice(0, 50).map((e) => (
                    <tr key={e.file_id} className="hover:bg-[#FAF7F2] transition">
                      <td className="py-3 px-4 font-bold text-stone-900">{e.file_id}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px] font-bold">
                          {e.format || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-600">{e.origin}</td>
                      <td className="py-3 px-4 text-stone-400 text-[10px] max-w-xs truncate">{e.file_path}</td>
                      <td className="py-3 px-4 text-stone-500 text-[10px]">{e.captured_at?.split('T')[0]}</td>
                      <td className="py-3 px-4 text-stone-600">{e.size_bytes ? e.size_bytes.toLocaleString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PAGE 4: SILVER ANALYSIS (Clean Lakehouse Entities Replication)
          ========================================================================= */}
      {streamlitPage === 'silver' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-[#FFEAE0] text-[#D94E1B] flex items-center justify-center">
                <Database className="w-4 h-4 text-[#E06D3B]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#191D24] tracking-tight">
                Silver: Cleaned Lakehouse Entities
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#5B6575]">
              Normalized relational entities queryable across customers, identity change history, activities, and deletion policies.
            </p>
          </div>

          {/* Top 4 Silver Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB]">
              <div className="text-xs font-medium text-stone-600">Customers</div>
              <div className="text-3xl font-black text-stone-900 mt-2">{silverWarehouseData.counts.customers}</div>
              <div className="text-[10px] text-stone-400 mt-1 font-mono">dim_customer</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB]">
              <div className="text-xs font-medium text-stone-600">Identity Changes</div>
              <div className="text-3xl font-black text-stone-900 mt-2">{silverWarehouseData.counts.identity_history}</div>
              <div className="text-[10px] text-stone-400 mt-1 font-mono">dim_identity_history</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB]">
              <div className="text-xs font-medium text-stone-600">Activities</div>
              <div className="text-3xl font-black text-stone-900 mt-2">{silverWarehouseData.counts.activities}</div>
              <div className="text-[10px] text-stone-400 mt-1 font-mono">fact_activity</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB]">
              <div className="text-xs font-medium text-stone-600">Evidence Observations</div>
              <div className="text-3xl font-black text-stone-900 mt-2">{silverWarehouseData.counts.links}</div>
              <div className="text-[10px] text-stone-400 mt-1 font-mono">fact_case_data_link</div>
            </div>
          </div>

          {/* Segmented Table Selector */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 border-b border-[#EFE5DB] pb-3">
              {[
                { id: 'requests', label: 'Requests (518)' },
                { id: 'customers', label: 'Customers (850)' },
                { id: 'identity_history', label: 'Identity History (306)' },
                { id: 'policies', label: 'Deletion Policies (15)' },
                { id: 'activities', label: 'Activities (4,011)' },
                { id: 'links', label: 'Case Links (1,216)' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSilverTable(t.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                    silverTable === t.id
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-[#FAF7F2] text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Table Rendering */}
            <div className="overflow-x-auto rounded-2xl border border-[#EFE5DB]">
              {silverTable === 'requests' && (
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#FAF7F2] border-b border-[#EFE5DB] text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Case ID</th>
                      <th className="py-3 px-4">Customer ID</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Reported Status</th>
                      <th className="py-3 px-4">Requested At</th>
                      <th className="py-3 px-4">Audit Cutoff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE5DB] font-mono text-[11px]">
                    {silverWarehouseData.fact_deletion_request.slice(0, 30).map((r: any) => (
                      <tr key={r.case_id} className="hover:bg-[#FAF7F2]">
                        <td className="py-3 px-4 font-bold text-stone-900">{r.case_id}</td>
                        <td className="py-3 px-4 text-stone-600">{r.customer_id}</td>
                        <td className="py-3 px-4 text-stone-500">{r.email}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-800">
                            {r.reported_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-400">{r.requested_at?.split('T')[0]}</td>
                        <td className="py-3 px-4 text-stone-400">{r.audit_at?.split('T')[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {silverTable === 'customers' && (
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#FAF7F2] border-b border-[#EFE5DB] text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Customer ID</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE5DB] font-mono text-[11px]">
                    {silverWarehouseData.dim_customer.slice(0, 30).map((c: any) => (
                      <tr key={c.customer_id} className="hover:bg-[#FAF7F2]">
                        <td className="py-3 px-4 font-bold text-stone-900">{c.customer_id}</td>
                        <td className="py-3 px-4 text-stone-800 font-sans">{c.name}</td>
                        <td className="py-3 px-4 text-stone-600">{c.email}</td>
                        <td className="py-3 px-4 text-stone-500">{c.phone}</td>
                        <td className="py-3 px-4 text-stone-400">{c.current_updated_at?.split('T')[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {silverTable === 'policies' && (
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#FAF7F2] border-b border-[#EFE5DB] text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Policy ID</th>
                      <th className="py-3 px-4">Resource Type</th>
                      <th className="py-3 px-4">Required Action</th>
                      <th className="py-3 px-4">Retention Period</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE5DB] font-mono text-[11px]">
                    {silverWarehouseData.dim_deletion_policy.map((p: any) => (
                      <tr key={p.policy_id} className="hover:bg-[#FAF7F2]">
                        <td className="py-3 px-4 font-bold text-[#EA580C]">{p.policy_id}</td>
                        <td className="py-3 px-4 text-stone-800">{p.resource_type}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.action_required === 'DELETE' ? 'bg-rose-100 text-rose-800' :
                            p.action_required === 'REDACT' ? 'bg-amber-100 text-amber-800' :
                            p.action_required === 'ANONYMIZE' ? 'bg-purple-100 text-purple-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {p.action_required}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-600">{p.retention_period}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {silverTable === 'activities' && (
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#FAF7F2] border-b border-[#EFE5DB] text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Activity ID</th>
                      <th className="py-3 px-4">System ID</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE5DB] font-mono text-[11px]">
                    {silverWarehouseData.fact_activity.slice(0, 30).map((a: any) => (
                      <tr key={a.activity_id} className="hover:bg-[#FAF7F2]">
                        <td className="py-3 px-4 font-bold text-stone-900">{a.activity_id}</td>
                        <td className="py-3 px-4 text-stone-700">{a.system_id}</td>
                        <td className="py-3 px-4 text-stone-600">{a.action_type || a.action}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-800">
                            {a.status || 'LOGGED'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-400">{a.occurred_at?.split('T')[0] || a.timestamp?.split('T')[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {silverTable === 'identity_history' && (
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#FAF7F2] border-b border-[#EFE5DB] text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">User ID</th>
                      <th className="py-3 px-4">Field Changed</th>
                      <th className="py-3 px-4">Old Value</th>
                      <th className="py-3 px-4">New Value</th>
                      <th className="py-3 px-4">Changed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE5DB] font-mono text-[11px]">
                    {silverWarehouseData.dim_identity_history.slice(0, 30).map((h: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#FAF7F2]">
                        <td className="py-3 px-4 font-bold text-stone-900">{h.user_id || h.customer_id}</td>
                        <td className="py-3 px-4 text-[#EA580C] font-semibold">{h.field_name || h.field}</td>
                        <td className="py-3 px-4 text-stone-500">{h.old_value || 'None'}</td>
                        <td className="py-3 px-4 text-stone-800">{h.new_value}</td>
                        <td className="py-3 px-4 text-stone-400">{h.changed_at?.split('T')[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {silverTable === 'links' && (
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#FAF7F2] border-b border-[#EFE5DB] text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Case ID</th>
                      <th className="py-3 px-4">Resource ID</th>
                      <th className="py-3 px-4">Evidence ID</th>
                      <th className="py-3 px-4">System ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE5DB] font-mono text-[11px]">
                    {silverWarehouseData.fact_case_data_link.slice(0, 30).map((l: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#FAF7F2]">
                        <td className="py-3 px-4 font-bold text-stone-900">{l.case_id}</td>
                        <td className="py-3 px-4 text-stone-700">{l.resource_id}</td>
                        <td className="py-3 px-4 text-[#EA580C] font-semibold">{l.evidence_id}</td>
                        <td className="py-3 px-4 text-stone-500">{l.system_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PAGE 5: GOLD ANALYSIS (Warehouse Audit Outcomes Replication)
          ========================================================================= */}
      {streamlitPage === 'gold' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-[#FFEAE0] text-[#D94E1B] flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-[#E06D3B]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#191D24] tracking-tight">
                Gold: Synthetic Warehouse Outcomes
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#5B6575]">
              Final audited warehouse records verifying case-level and resource-level deletion outcomes at audit cutoff times.
            </p>
          </div>

          {/* Top 5 Gold KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB]">
              <div className="text-xs font-medium text-stone-600">Gold Cases</div>
              <div className="text-3xl font-black text-stone-900 mt-2">{rawCases.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB]">
              <div className="text-xs font-medium text-stone-600">Complete</div>
              <div className="text-3xl font-black text-emerald-600 mt-2">47</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB]">
              <div className="text-xs font-medium text-stone-600">Incomplete</div>
              <div className="text-3xl font-black text-sky-600 mt-2">462</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB]">
              <div className="text-xs font-medium text-stone-600">Not Applicable</div>
              <div className="text-3xl font-black text-stone-500 mt-2">9</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] col-span-2 sm:col-span-1">
              <div className="text-xs font-medium text-stone-600">Gold Resources</div>
              <div className="text-3xl font-black text-stone-900 mt-2">{rawResources.length}</div>
            </div>
          </div>

          {/* Status Breakdown Bar */}
          <div className="p-5 rounded-2xl border border-[#EFE5DB] bg-white space-y-3">
            <h3 className="font-bold text-sm text-stone-900">Warehouse Overall Status Distribution</h3>
            <div className="w-full bg-stone-100 rounded-2xl h-4 overflow-hidden flex">
              <div 
                className="bg-sky-500 h-full"
                style={{ width: `${(462 / 518) * 100}%` }}
                title="INCOMPLETE: 462 cases (89.2%)"
              ></div>
              <div 
                className="bg-[#EA580C] h-full"
                style={{ width: `${(47 / 518) * 100}%` }}
                title="COMPLETE: 47 cases (9.1%)"
              ></div>
              <div 
                className="bg-stone-400 h-full"
                style={{ width: `${(9 / 518) * 100}%` }}
                title="NOT_APPLICABLE: 9 cases (1.7%)"
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs font-mono pt-1 text-stone-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-sky-500 rounded-xs"></span> INCOMPLETE: 462 (89.2%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#EA580C] rounded-xs"></span> COMPLETE: 47 (9.1%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-stone-400 rounded-xs"></span> NOT_APPLICABLE: 9 (1.7%)</span>
            </div>
          </div>

          {/* Search Gold Details Controls */}
          <div className="p-5 rounded-2xl border border-[#EFE5DB] bg-[#FAF7F2] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider font-mono">
                Search Gold Warehouse Details
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGoldView('cases')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                    goldView === 'cases' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-[#EFE5DB]'
                  }`}
                >
                  Cases ({filteredGoldCases.length})
                </button>
                <button
                  onClick={() => setGoldView('resources')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                    goldView === 'resources' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-[#EFE5DB]'
                  }`}
                >
                  Resources ({filteredGoldResources.length})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Search Case ID (e.g. case_100)..."
                value={goldSearchCase}
                onChange={(e) => setGoldSearchCase(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-[#EFE5DB] rounded-xl"
              />
              <input
                type="text"
                placeholder="Search Customer ID (e.g. user_98)..."
                value={goldSearchUser}
                onChange={(e) => setGoldSearchUser(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-[#EFE5DB] rounded-xl"
              />
              <input
                type="text"
                placeholder="Search Resource ID..."
                value={goldSearchResource}
                onChange={(e) => setGoldSearchResource(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-[#EFE5DB] rounded-xl"
              />
              <select
                value={goldSearchStatus}
                onChange={(e) => setGoldSearchStatus(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-[#EFE5DB] rounded-xl cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETE">COMPLETE</option>
                <option value="INCOMPLETE">INCOMPLETE</option>
                <option value="NOT_APPLICABLE">NOT_APPLICABLE</option>
                <option value="DELETED">DELETED</option>
                <option value="PRESENT">PRESENT</option>
                <option value="REDACTED">REDACTED</option>
                <option value="ANONYMIZED">ANONYMIZED</option>
              </select>
            </div>
          </div>

          {/* Gold Table View */}
          <div className="overflow-x-auto rounded-2xl border border-[#EFE5DB]">
            {goldView === 'cases' ? (
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#FAF7F2] border-b border-[#EFE5DB] text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Case ID</th>
                    <th className="py-3 px-4">Customer ID</th>
                    <th className="py-3 px-4">Overall Status</th>
                    <th className="py-3 px-4">Deleted Res</th>
                    <th className="py-3 px-4">Total Res</th>
                    <th className="py-3 px-4">Completion</th>
                    <th className="py-3 px-4">Audit Cutoff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE5DB] font-mono text-[11px]">
                  {filteredGoldCases.slice(0, 30).map((c) => (
                    <tr key={c.case_id} className="hover:bg-[#FAF7F2]">
                      <td className="py-3 px-4 font-bold text-stone-900">{c.case_id}</td>
                      <td className="py-3 px-4 text-stone-600">{c.customer_id}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.overall_deletion_status === 'COMPLETE' ? 'bg-emerald-100 text-emerald-800' :
                          c.overall_deletion_status === 'INCOMPLETE' ? 'bg-sky-100 text-sky-800' :
                          'bg-stone-200 text-stone-800'
                        }`}>
                          {c.overall_deletion_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-700">{c.deleted_resource_count}</td>
                      <td className="py-3 px-4 text-stone-700">{c.total_resource_count}</td>
                      <td className="py-3 px-4 font-bold text-[#EA580C]">{c.completion_percentage}%</td>
                      <td className="py-3 px-4 text-stone-400">{c.audit_cutoff.split('T')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#FAF7F2] border-b border-[#EFE5DB] text-stone-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Resource ID</th>
                    <th className="py-3 px-4">Case ID</th>
                    <th className="py-3 px-4">Customer ID</th>
                    <th className="py-3 px-4">System ID</th>
                    <th className="py-3 px-4">Resource Type</th>
                    <th className="py-3 px-4">Verified State</th>
                    <th className="py-3 px-4">Policy Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE5DB] font-mono text-[11px]">
                  {filteredGoldResources.slice(0, 30).map((r) => (
                    <tr key={r.resource_id} className="hover:bg-[#FAF7F2]">
                      <td className="py-3 px-4 font-bold text-stone-900">{r.resource_id}</td>
                      <td className="py-3 px-4 text-stone-600">{r.case_id}</td>
                      <td className="py-3 px-4 text-stone-500">{r.customer_id}</td>
                      <td className="py-3 px-4 text-stone-700">{r.system_id}</td>
                      <td className="py-3 px-4 text-stone-600">{r.resource_type}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.verified_state === 'DELETED' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {r.verified_state}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-500">{r.policy_action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          PAGE 6: LIVE EMBEDDED STREAMLIT DASHBOARD (Port 8502)
          ========================================================================= */}
      {streamlitPage === 'live' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFE5DB]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <h3 className="text-lg font-extrabold text-stone-900 tracking-tight">
                  Live Streamlit Dashboard Engine
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  Active on http://localhost:8502
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Direct interactive view of <code className="text-stone-700 bg-stone-100 px-1 py-0.5 rounded font-mono">app/app.py</code> running with full Plotly chart interactivity, faceted controls, and live table exports.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="http://localhost:8502"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-[#EA580C] hover:bg-[#D94E1B] text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Standalone Tab
              </a>
            </div>
          </div>

          {/* Embedded Streamlit Frame */}
          <div className="relative w-full rounded-2xl border border-[#EFE5DB] overflow-hidden bg-stone-50 shadow-inner h-[820px]">
            <iframe
              src="http://localhost:8502/?embed=true"
              title="Streamlit Forensic Audit Warehouse Dashboard"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 pt-2">
            <span>Powered by Streamlit 1.66.1 &bull; SQLite readonly connection</span>
            <span>Refreshes automatically upon data changes</span>
          </div>
        </div>
      )}

    </div>
  );
};
