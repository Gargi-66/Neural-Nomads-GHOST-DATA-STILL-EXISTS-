import React, { useState, useMemo } from 'react';
import { 
  Search, Clock, Database, FileText, HardDrive, File, ShieldCheck
} from 'lucide-react';
import evidenceList from '../data/evidence_manifest.json';

export const EvidenceExplorer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState('ALL');
  const [selectedFile, setSelectedFile] = useState<any>(evidenceList[0]);

  const filteredEvidence = useMemo(() => {
    return evidenceList.filter((ev) => {
      const matchesSearch = 
        ev.file_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.file_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.origin.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFormat = formatFilter === 'ALL' || ev.format === formatFilter;

      return matchesSearch && matchesFormat;
    });
  }, [searchTerm, formatFilter]);

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'SQL': return <Database className="w-4 h-4 text-[#E05822]" />;
      case 'JSON': return <FileText className="w-4 h-4 text-amber-700" />;
      case 'LOG': return <HardDrive className="w-4 h-4 text-emerald-700" />;
      default: return <File className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFEAE0] text-[#D94E1B] text-xs font-bold mb-2">
              <span>📜</span>
              <span>EVIDENCE MANIFEST REGISTRY</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191D24] tracking-tight">
              Evidence Artifacts &amp; Snapshots
            </h2>
            <p className="text-xs sm:text-sm text-[#525B69] mt-0.5">
              Inspect all 94 participant-visible evidence artifacts: SQLite databases, JSON exports, trace logs, and PDF handover reports.
            </p>
          </div>

          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-[#FAF7F2] border border-[#EFE5DB] text-[#717A88]">
            {filteredEvidence.length} Evidence Artifacts
          </span>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-[#8C7A6D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by File ID (e.g. evidence_92), Path, or Origin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#EFE5DB] rounded-2xl text-xs text-[#191D24] placeholder-[#8C7A6D] focus:outline-none focus:border-[#E05822] focus:bg-white font-medium transition-all"
            />
          </div>

          <div className="md:col-span-6 flex items-center bg-[#FAF7F2] border border-[#EFE5DB] rounded-2xl p-1 text-xs font-bold overflow-x-auto gap-1">
            {['ALL', 'SQL', 'JSON', 'LOG', 'PDF', 'TXT'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormatFilter(fmt)}
                className={`flex-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer text-center text-xs ${
                  formatFilter === fmt
                    ? 'bg-[#E05822] text-white shadow-2xs font-extrabold'
                    : 'text-[#717A88] hover:text-[#191D24]'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Main Split Grid: Artifact List + Preview Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Artifact List (6 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-[#EFE5DB] shadow-xs space-y-3 max-h-[680px] overflow-y-auto">
          <div className="text-xs font-mono font-bold text-[#717A88] px-2 uppercase tracking-wider">
            Matching Artifacts ({filteredEvidence.length})
          </div>

          <div className="space-y-2">
            {filteredEvidence.map((ev: any) => {
              const isSelected = selectedFile?.file_id === ev.file_id;
              return (
                <div
                  key={ev.file_id}
                  onClick={() => setSelectedFile(ev)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                    isSelected
                      ? 'bg-[#FFF5EE] border-[#E05822] shadow-xs'
                      : 'bg-[#FAF7F2] border-[#EFE5DB] hover:bg-white hover:border-[#D5C7B8]'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#EFE5DB] flex items-center justify-center shrink-0">
                      {getFormatIcon(ev.format)}
                    </div>
                    <div className="truncate">
                      <div className="font-mono font-bold text-[#191D24] truncate flex items-center gap-2">
                        <span>{ev.file_id}</span>
                        <span className="text-[10px] font-mono font-normal text-[#8C7A6D]">
                          ({ev.format})
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#717A88] truncate mt-0.5">
                        {ev.file_path}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-[#8C7A6D] shrink-0">
                    {ev.captured_at ? ev.captured_at.split('T')[0] : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected File Forensic Dossier (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-5">
          {selectedFile ? (
            <>
              {/* Dossier Header */}
              <div className="flex items-start justify-between gap-4 border-b border-[#EFE5DB] pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-[#FFEAE0] text-[#D94E1B] border border-[#FCD2BF]">
                      {selectedFile.file_id}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#717A88] border border-[#EFE5DB]">
                      Format: {selectedFile.format}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#191D24] font-mono">
                    {selectedFile.file_path}
                  </h3>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className="text-[10px] text-[#8C7A6D] block uppercase">Captured At</span>
                  <span className="font-bold text-[#191D24] flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-[#E05822]" />
                    {selectedFile.captured_at ? selectedFile.captured_at.replace('T', ' ').slice(0, 19) : '-'}
                  </span>
                </div>
              </div>

              {/* Origin & Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB]">
                  <span className="text-[#8C7A6D] block text-[10px] uppercase">Service Origin</span>
                  <span className="font-bold text-[#191D24]">{selectedFile.origin}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB]">
                  <span className="text-[#8C7A6D] block text-[10px] uppercase">Temporal Admissibility</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admissible</span>
                  </span>
                </div>
              </div>

              {/* Artifact Description & Forensic Role */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-[#717A88] uppercase tracking-wider">
                  Artifact Forensic Role
                </h4>
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] text-xs text-[#525B69] leading-relaxed">
                  {selectedFile.description || `Participant-visible evidence captured from ${selectedFile.origin}. Used during the deletion audit to verify presence or absence of subject identifiers, email hashes, and orphaned database records prior to the audit cutoff.`}
                </div>
              </div>

              {/* Inspection Command */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-[#717A88] uppercase tracking-wider">
                  Terminal Inspection Command
                </h4>
                <div className="p-3.5 rounded-2xl bg-[#191D24] border border-[#2D3748] text-xs font-mono text-[#FBD38D] select-all">
                  {selectedFile.format === 'SQL' 
                    ? `sqlite3 :memory: ".read dataset/${selectedFile.file_path}" "SELECT * FROM sqlite_master;"`
                    : selectedFile.format === 'JSON'
                      ? `cat dataset/${selectedFile.file_path} | jq '.' | head -n 30`
                      : `head -n 25 dataset/${selectedFile.file_path}`
                  }
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs font-mono text-[#8C7A6D]">
              Select an evidence file from the list to inspect metadata.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
