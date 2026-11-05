import React from 'react';

export const MedallionArchitectureSection: React.FC = () => {
  return (
    <div className="space-y-6">
      
      {/* Main Architecture Diagram Banner */}
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
  );
};
