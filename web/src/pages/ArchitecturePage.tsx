import React, { useState } from 'react';
import { Bot, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface NodeDetail {
  id: string;
  title: string;
  category: 'evidence' | 'engine' | 'agent' | 'output';
  responsibilities: string[];
  inputs: string[];
  outputs: string[];
  codeLocation: string;
}

export const ArchitecturePage: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('agent');

  const nodes: Record<string, NodeDetail> = {
    'db_sources': {
      id: 'db_sources',
      title: 'Evidence Sources Layer',
      category: 'evidence',
      responsibilities: [
        'Collects read-only evidence from SQL dumps, support JSONs, attachments, and activity logs',
        'Applies strict temporal admissibility cutoff (captured_at <= audit_at)',
        'Guarantees immutability of original raw files'
      ],
      inputs: ['evidence/databases/*.sql', 'evidence/documents/*', 'system_activity.csv'],
      outputs: ['Parsed in-memory SQLite tables', 'Evidence metadata catalog'],
      codeLocation: 'code/aegis/evidence/'
    },
    'identity': {
      id: 'identity',
      title: 'Identity Resolution Engine',
      category: 'engine',
      responsibilities: [
        'Constructs the subject temporal identity graph using NetworkX',
        'Connects primary email with past email changes and telephone numbers from user_audit_log',
        'Resolves canonical user_id for accurate tombstone cross-checking'
      ],
      inputs: ['user_identities.csv', 'user_audit_log.csv', 'target_email'],
      outputs: ['Set of historical emails, phone numbers, and canonical user_id'],
      codeLocation: 'code/aegis/identity/'
    },
    'lineage': {
      id: 'lineage',
      title: 'Graph & Lineage Analysis',
      category: 'engine',
      responsibilities: [
        'Analyzes active data-flow topology between systems',
        'Identifies zombie replication loops where deleted records can be re-inserted',
        'Checks cold backups for missing restore exclusion filters'
      ],
      inputs: ['system_activity.csv', 'known_replicas'],
      outputs: ['Active data flow risks', 'Restore risks'],
      codeLocation: 'code/aegis/lineage/'
    },
    'policy': {
      id: 'policy',
      title: 'Policy & Risk Engine',
      category: 'engine',
      responsibilities: [
        'Applies deletion_rules.csv (Rules 01–15)',
        'Classifies resources into DELETE, REDACT, ANONYMIZE, or RETAIN',
        'Enforces statutory legal hold and security audit retention boundaries'
      ],
      inputs: ['Resource category', 'Context attributes', 'deletion_rules.csv'],
      outputs: ['Required legal action for each discovered record'],
      codeLocation: 'code/aegis/policy/'
    },
    'agent': {
      id: 'agent',
      title: 'AI Investigation Agent',
      category: 'agent',
      responsibilities: [
        'Orchestrates tool-calling across evidence and graph components',
        'Analyzes user request text to determine deletion authorization',
        'Produces strict, ordered step sequences with zero hallucinations'
      ],
      inputs: ['Deletion request record', 'Tool execution outputs'],
      outputs: ['Final case determination (COMPLETE, INCOMPLETE, NOT_APPLICABLE)'],
      codeLocation: 'code/aegis/agent/'
    },
    'simulator': {
      id: 'simulator',
      title: 'Remediation Simulator',
      category: 'engine',
      responsibilities: [
        'Applies remediation operations in-memory to test safety',
        'Verifies that data flows are properly disabled before records are purged',
        'Validates backup restore blockage mechanisms'
      ],
      inputs: ['Proposed remediation steps', 'Initial state graph'],
      outputs: ['Simulated clean state', 'Residual risk warnings'],
      codeLocation: 'code/aegis/simulation/'
    },
    'outputs': {
      id: 'outputs',
      title: 'Output Generation & Validation',
      category: 'output',
      responsibilities: [
        'Sorts steps by strict hierarchy: FINDING -> REMEDIATION -> VERIFICATION',
        'Enforces tie-breakers: system_id asc, resource_id asc',
        'Formats output.csv with consecutive 1-indexed step numbers'
      ],
      inputs: ['All 518 case results', 'Validation schemas'],
      outputs: ['output.csv', 'evaluation_report.md', 'usage_report.md'],
      codeLocation: 'code/aegis/validation/'
    }
  };

  const selectedNode = nodes[selectedNodeId] || nodes['agent'];

  return (
    <div className="min-h-screen py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Page Title */}
      <div className="mb-10 pb-6 border-b border-[#EFE5DB]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#FFEFE5] text-[#E05822] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#191D24] tracking-tight">
            AEGIS System Architecture
          </h1>
        </div>
        <p className="text-sm sm:text-base text-[#5B6575] max-w-3xl">
          An interactive technical blueprint of the hybrid, agentic architecture combining deterministic evidence indexing, graph lineage analysis, and bounded LLM investigation.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE5DB] shadow-md space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-[#F0E6DD]">
            <span className="font-bold uppercase tracking-wider">Architecture Flow Canvas</span>
            <span>Click any node to inspect contracts</span>
          </div>

          <div className="space-y-4">
            
            {/* Layer 1: Evidence Sources */}
            <div 
              onClick={() => setSelectedNodeId('db_sources')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedNodeId === 'db_sources'
                  ? 'border-[#E05822] bg-[#FFF8F3] shadow-sm'
                  : 'border-[#EADCCF] bg-[#FAF6F2] hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-[#E05822]">1. Evidence & Raw Ingestion</span>
                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E0D0C0]">Read-Only</span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">Evidence Sources (Databases, Logs, Attachments, Backups)</h3>
              <p className="text-xs text-slate-600">Points-in-time extraction adhering to captured_at &le; audit_at admissibility.</p>
            </div>

            <div className="flex justify-center text-[#CBD5E1]">&darr;</div>

            {/* Layer 2: Core Engines */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setSelectedNodeId('identity')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedNodeId === 'identity'
                    ? 'border-[#E05822] bg-[#FFF8F3] shadow-sm'
                    : 'border-[#EADCCF] bg-white hover:bg-[#FAF6F2]'
                }`}
              >
                <span className="text-[10px] font-bold text-[#E05822] block mb-1">NetworkX Graph</span>
                <h4 className="font-bold text-xs text-slate-900 mb-1">Identity Resolution</h4>
                <p className="text-[11px] text-slate-500">Historical email & phone disambiguation.</p>
              </div>

              <div
                onClick={() => setSelectedNodeId('lineage')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedNodeId === 'lineage'
                    ? 'border-[#E05822] bg-[#FFF8F3] shadow-sm'
                    : 'border-[#EADCCF] bg-white hover:bg-[#FAF6F2]'
                }`}
              >
                <span className="text-[10px] font-bold text-[#E05822] block mb-1">Topology DAG</span>
                <h4 className="font-bold text-xs text-slate-900 mb-1">Lineage & Zombie Synapse</h4>
                <p className="text-[11px] text-slate-500">Detecting unpurged sync & restore paths.</p>
              </div>

              <div
                onClick={() => setSelectedNodeId('policy')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedNodeId === 'policy'
                    ? 'border-[#E05822] bg-[#FFF8F3] shadow-sm'
                    : 'border-[#EADCCF] bg-white hover:bg-[#FAF6F2]'
                }`}
              >
                <span className="text-[10px] font-bold text-[#E05822] block mb-1">Rules 01–15</span>
                <h4 className="font-bold text-xs text-slate-900 mb-1">Policy Compiler</h4>
                <p className="text-[11px] text-slate-500">Deterministic actions: Delete/Redact/Retain.</p>
              </div>
            </div>

            <div className="flex justify-center text-[#CBD5E1]">&darr;</div>

            {/* Layer 3: Central Investigation Agent */}
            <div
              onClick={() => setSelectedNodeId('agent')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedNodeId === 'agent'
                  ? 'border-[#E05822] bg-[#FFF8F3] shadow-md ring-4 ring-orange-100'
                  : 'border-[#F4C5AB] bg-gradient-to-r from-[#FFF6F0] via-[#FFEFE5] to-[#FFF6F0]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-[#D94E1B] flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-[#E05822]" />
                  <span>Central Brain: AI Investigation Agent</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-[#E05822] text-white px-2 py-0.5 rounded">
                  Bounded LLM + Tool Contracts
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Evaluates deletion authorization from raw request text, queries deterministic engines via tool schemas, and formats valid step sequences.
              </p>
            </div>

            <div className="flex justify-center text-[#CBD5E1]">&darr;</div>

            {/* Layer 4: Simulation & Output */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setSelectedNodeId('simulator')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedNodeId === 'simulator'
                    ? 'border-[#E05822] bg-[#FFF8F3] shadow-sm'
                    : 'border-[#EADCCF] bg-white hover:bg-[#FAF6F2]'
                }`}
              >
                <span className="text-[10px] font-bold text-[#E05822] block mb-1">State Machine</span>
                <h4 className="font-bold text-xs text-slate-900 mb-1">Remediation Simulator</h4>
                <p className="text-[11px] text-slate-500">Proves state reachability before verification.</p>
              </div>

              <div
                onClick={() => setSelectedNodeId('outputs')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedNodeId === 'outputs'
                    ? 'border-[#E05822] bg-[#FFF8F3] shadow-sm'
                    : 'border-[#EADCCF] bg-white hover:bg-[#FAF6F2]'
                }`}
              >
                <span className="text-[10px] font-bold text-[#E05822] block mb-1">Grading Contract</span>
                <h4 className="font-bold text-xs text-slate-900 mb-1">Output Validation</h4>
                <p className="text-[11px] text-slate-500">Generates 518-case output.csv with strict sorting.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Node Details */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-[#EFE5DB] shadow-md space-y-6">
          <div className="pb-4 border-b border-[#EFE5DB]">
            <span className="text-[10px] font-mono uppercase font-bold text-[#E05822] bg-orange-100 px-2 py-0.5 rounded">
              {selectedNode.category} component
            </span>
            <h3 className="text-xl font-black text-[#191D24] mt-2">
              {selectedNode.title}
            </h3>
            <span className="text-xs font-mono text-slate-500 block mt-1">
              Source: {selectedNode.codeLocation}
            </span>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Core Responsibilities & Guarantees:
            </h4>
            <div className="space-y-1.5">
              {selectedNode.responsibilities.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[#FAF6F2] border border-[#EFE3D8]">
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Inputs</span>
              <ul className="text-xs font-mono space-y-1 text-slate-800">
                {selectedNode.inputs.map((inp, idx) => (
                  <li key={idx} className="truncate">&bull; {inp}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF6F2] border border-[#EFE3D8]">
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Outputs</span>
              <ul className="text-xs font-mono space-y-1 text-slate-800">
                {selectedNode.outputs.map((out, idx) => (
                  <li key={idx} className="truncate">&bull; {out}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200 text-xs text-[#9A3412]">
            <strong>AEOS Principle:</strong> All components execute deterministically. Python engine runs independently of the frontend web console.
          </div>
        </div>

      </div>

    </div>
  );
};
