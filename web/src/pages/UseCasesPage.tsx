import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const UseCasesPage: React.FC = () => {
  const cases = [
    {
      title: 'The $2.4M Lawsuit Scenario (Northstar Shop)',
      badge: 'High Impact Incident',
      badgeColor: 'bg-red-100 text-red-800',
      summary: 'A customer deletion ticket is marked COMPLETE by account_service. Weeks later, the customer attempts to re-register and is blocked with "Email already registered".',
      findings: [
        'Read replica was not included in initial point-in-time deletion broadcast',
        'Hourly Kafka CDC synchronization detected missing row and re-inserted customer into production DB',
        'Customer support tickets retained un-redacted driver license scans',
        'Account tombstone retained customer full name instead of solely internal UUID'
      ],
      aegisRemediation: 'AEGIS detects active replication vector, deploys DISABLE_DATA_FLOW, executes REDACT_RECORD on support conversation, strips direct PII from tombstone, and validates VERIFY_RECORD_ABSENT.'
    },
    {
      title: 'Disaster Recovery Backup Resurrection',
      badge: 'Backup Risk',
      badgeColor: 'bg-amber-100 text-amber-800',
      summary: 'Cold S3 backup snapshots taken prior to deletion request remain scheduled for automated disaster recovery drills, risking full data resurrection.',
      findings: [
        'Snapshot cold_backup_20261015 contains active relational row for deleted customer',
        'No negative tombstone filter attached to backup restoration manifest',
        'Next failover drill would restore deleted customer records into live customer search index'
      ],
      aegisRemediation: 'AEGIS flags REPORT_RESTORE_RISK on backup_service, applies BLOCK_RESTORE to attach negative tombstone filter, and validates VERIFY_RESTORE_BLOCKED.'
    },
    {
      title: 'GDPR Article 17 vs. Rule 12 Statutory Retention',
      badge: 'Legal Policy Conflict',
      badgeColor: 'bg-blue-100 text-blue-800',
      summary: 'Subject demands immediate "erasure of all records without exception" under GDPR Article 17, but financial security audit records are subject to statutory retention.',
      findings: [
        'Security audit logs in security_service contain login timestamps and IP addresses within statutory 90-day retention window',
        'Direct customer profiles in account_service and marketing_platform require total deletion',
        'Premature deletion of security audit logs would constitute compliance failure'
      ],
      aegisRemediation: 'Policy engine applies Rule 01 (DELETE user profile), Rule 10 (DELETE marketing), but enforces Rule 12 (RETAIN security audit log), concluding with VERIFY_RECORD_PRESENT.'
    }
  ];

  return (
    <div className="min-h-screen py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Title */}
      <div className="max-w-3xl mb-12">
        <span className="text-xs font-black uppercase tracking-widest text-[#E05822] block mb-2">
          Real-World Applications
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-[#191D24] tracking-tight">
          Enterprise Forensic Use Cases
        </h1>
        <p className="text-base text-[#5B6575] mt-3">
          Detailed dissections of how subtle architectural data flows recreate ghost records after naive deletion workflows mark tickets complete.
        </p>
      </div>

      {/* Case Studies */}
      <div className="space-y-8">
        {cases.map((c, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE5DB] shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0E6DD]">
              <h2 className="text-xl sm:text-2xl font-black text-[#191D24]">{c.title}</h2>
              <span className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full ${c.badgeColor} shrink-0 self-start sm:self-auto`}>
                {c.badge}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-700 leading-relaxed">
              {c.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Residual Findings */}
              <div className="p-5 rounded-2xl bg-[#FCFAF7] border border-[#EFE5DB] space-y-2.5">
                <span className="text-xs font-bold uppercase text-red-700 block mb-1">
                  Discovered Ghost Data & Risks:
                </span>
                {c.findings.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {/* AEGIS Outcome */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2.5">
                <span className="text-xs font-bold uppercase text-emerald-800 block mb-1">
                  AEGIS Evidence-Backed Resolution:
                </span>
                <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                  {c.aegisRemediation}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
