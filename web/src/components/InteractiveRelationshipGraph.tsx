import React, { useState } from 'react';
import { 
  AlertTriangle, Info
} from 'lucide-react';
import allCases from '../data/all_cases.json';

interface InteractiveRelationshipGraphProps {
  initialCaseId?: string;
  onSelectCase?: (caseId: string) => void;
}

export const InteractiveRelationshipGraph: React.FC<InteractiveRelationshipGraphProps> = ({
  initialCaseId = 'case_09',
  onSelectCase
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const currentCase = allCases.find((c) => c.case_id === selectedCaseId) || allCases[0];

  // Graph pipeline levels:
  // USER -> IDENTIFIER -> ACCOUNT -> DATABASE -> REPLICA / BACKUP / SYNC JOB
  const levels = [
    {
      level: 1,
      title: 'Subject (User)',
      nodes: [
        {
          id: 'user_node',
          label: currentCase.customer_name,
          sublabel: currentCase.user_id,
          type: 'user',
          status: 'AUDITED',
          details: `Canonical subject. Request submitted at ${currentCase.requested_at?.slice(0, 16)}.`
        }
      ]
    },
    {
      level: 2,
      title: 'Claimed Identifiers',
      nodes: [
        {
          id: 'email_node',
          label: currentCase.primary_email,
          sublabel: 'Primary Request Email',
          type: 'identifier',
          status: 'RESOLVED',
          details: 'Direct email identifier supplied with deletion request.'
        },
        ...(currentCase.historical_emails || []).map((he: string, i: number) => ({
          id: `hist_email_${i}`,
          label: he,
          sublabel: 'Historical Alias (user_audit_log)',
          type: 'identifier',
          status: 'HISTORICAL',
          details: 'Historical email recovered from user_audit_log.csv changes.'
        }))
      ]
    },
    {
      level: 3,
      title: 'Account Service',
      nodes: [
        {
          id: 'acc_node',
          label: `account_${currentCase.user_id.split('_')[1] || '001'}`,
          sublabel: 'Core User Profile',
          type: 'account',
          status: currentCase.deletion_status === 'COMPLETE' ? 'ABSENT' : 'RESIDUAL_FOUND',
          details: currentCase.deletion_status === 'COMPLETE'
            ? 'Account profile record verified deleted from primary service.'
            : 'Surviving profile record or unredacted tombstone discovered.'
        }
      ]
    },
    {
      level: 4,
      title: 'Replication Cluster',
      nodes: [
        {
          id: 'db_node',
          label: 'Primary PostgreSQL DB',
          sublabel: 'Cluster master',
          type: 'database',
          status: 'VERIFIED',
          details: 'Master database processed deletion workflow event.'
        },
        {
          id: 'replica_node',
          label: 'Failover Read Replica',
          sublabel: 'Regional secondary',
          type: 'replica',
          status: currentCase.findings_count > 0 ? 'DESYNC_DETECTED' : 'IN_SYNC',
          isZombie: currentCase.findings_count > 0,
          details: currentCase.findings_count > 0 
            ? 'Replication drift! Replica still contains un-purged customer row.'
            : 'Replica verified synchronized and empty.'
        }
      ]
    },
    {
      level: 5,
      title: 'Active Flows & Backups',
      nodes: [
        {
          id: 'backup_node',
          label: 'Disaster Recovery Archive',
          sublabel: 'S3 cold backup snapshot',
          type: 'backup',
          status: currentCase.restore_risks_count > 0 ? 'RESTORE_RISK' : 'SAFE',
          isZombie: currentCase.restore_risks_count > 0,
          details: currentCase.restore_risks_count > 0 
            ? 'Active disaster recovery backup with restore_allowed=1 capable of resurrecting data.' 
            : 'Cold snapshot with restore permissions strictly blocked.'
        },
        {
          id: 'sync_node',
          label: 'Data Synchronization Flow',
          sublabel: 'integration_service connector',
          type: 'sync',
          status: currentCase.active_flows_count > 0 ? 'ACTIVE_FLOW' : 'DISABLED',
          isZombie: currentCase.active_flows_count > 0,
          details: currentCase.active_flows_count > 0 
            ? 'Active real-time connector silently repopulating deleted records downstream.' 
            : 'Connector disabled prior to record purging.'
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Controls Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFEAE0] text-[#D94E1B] text-xs font-bold mb-2">
              <span>🕸️</span>
              <span>DATA FLOW &amp; LINEAGE GRAPH</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191D24] tracking-tight">
              Interactive Relationship Lineage Graph
            </h2>
            <p className="text-xs sm:text-sm text-[#525B69] mt-0.5">
              Visualizing the investigated chain: Subject &rarr; Identifiers &rarr; Account Service &rarr; Replica Cluster &rarr; Active Flows / Backups
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <label className="text-xs font-mono font-medium text-[#717A88]">Select Case:</label>
            <select
              value={selectedCaseId}
              onChange={(e) => {
                setSelectedCaseId(e.target.value);
                setSelectedNode(null);
                if (onSelectCase) onSelectCase(e.target.value);
              }}
              className="py-1.5 px-3 bg-[#FAF7F2] border border-[#EFE5DB] rounded-xl text-xs font-mono font-bold text-[#191D24] focus:outline-none focus:border-[#E05822] max-w-xs truncate"
            >
              {allCases.slice(0, 60).map((c) => (
                <option key={c.case_id} value={c.case_id}>
                  {c.case_id} - {c.customer_name} ({c.deletion_status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#EFE5DB] text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#555E6B]">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span>Subject / Identity</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#555E6B]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E05822]"></span>
            <span>Relational Account</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#555E6B]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Verified Absent / Clean</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#D94E1B] font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D94E1B] animate-pulse"></span>
            <span>Zombie Sync / Restore Risk</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Graph Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: 5-Tier Relationship Graph (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#EFE5DB] shadow-xs p-6 overflow-x-auto min-h-[550px] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4 min-w-[700px]">
            {levels.map((lvl) => (
              <div key={lvl.level} className="flex-1 flex flex-col items-center space-y-4">
                
                {/* Level Title Header */}
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#717A88] font-bold text-center border-b border-[#EFE5DB] pb-2 w-full">
                  Level {lvl.level}: {lvl.title}
                </div>

                {/* Level Nodes */}
                <div className="space-y-3.5 w-full flex flex-col items-center">
                  {lvl.nodes.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    const isZombie = (node as any).isZombie;

                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`w-full max-w-[170px] p-3 rounded-2xl border text-left cursor-pointer transition-all duration-200 select-none ${
                          isSelected 
                            ? 'bg-[#FFF5EE] border-[#E05822] shadow-xs scale-105' 
                            : isZombie
                              ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
                              : 'bg-[#FAF7F2] border-[#EFE5DB] hover:bg-white hover:border-[#D5C7B8]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono uppercase font-bold text-[#8C7A6D]">
                            {node.type}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${
                            isZombie ? 'bg-[#D94E1B] animate-pulse' : 'bg-emerald-500'
                          }`}></span>
                        </div>

                        <div className="font-bold text-xs text-[#191D24] truncate">
                          {node.label}
                        </div>
                        <div className="text-[10px] font-mono text-[#717A88] truncate mt-0.5">
                          {node.sublabel}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>

          <div className="text-center text-[11px] font-mono text-[#8C7A6D] pt-4 border-t border-[#EFE5DB] mt-4">
            Click any node to inspect grounded forensic evidence and remediation prerequisites.
          </div>
        </div>

        {/* Right: Node Details Inspector (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#EFE5DB] shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EFE5DB] pb-3">
            <Info className="w-4 h-4 text-[#E05822]" />
            <h3 className="text-sm font-bold text-[#191D24]">Node Forensic Inspector</h3>
          </div>

          {selectedNode ? (
            <div className="space-y-4 font-mono text-xs">
              <div>
                <span className="text-[10px] uppercase text-[#8C7A6D] block">Node Label</span>
                <span className="text-sm font-black text-[#191D24] block mt-0.5">{selectedNode.label}</span>
                <span className="text-xs text-[#717A88] block">{selectedNode.sublabel}</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] space-y-1">
                <span className="text-[10px] uppercase text-[#8C7A6D] block">Status</span>
                <span className={`font-bold ${
                  (selectedNode as any).isZombie ? 'text-[#D94E1B]' : 'text-emerald-700'
                }`}>
                  {selectedNode.status}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE5DB] space-y-1">
                <span className="text-[10px] uppercase text-[#8C7A6D] block">Forensic Context</span>
                <p className="text-xs text-[#525B69] font-sans leading-relaxed">
                  {selectedNode.details}
                </p>
              </div>

              {(selectedNode as any).isZombie && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#D94E1B]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Ghost Data Recreation Threat</span>
                  </div>
                  <p className="text-[11px] font-sans leading-relaxed text-[#78350F]">
                    This path allows deleted data to be resuscitated. Prerequisite action: Disable flow or block restore before touching records.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs font-mono text-[#8C7A6D]">
              Click on any node in the graph to view lineage and failure modes.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
