export interface AuditStep {
  step_no: number;
  phase: 'FINDING' | 'REMEDIATION' | 'VERIFICATION';
  system_id: string;
  resource_id: string;
  operation: string;
  state: string;
  evidence_id: string;
  details?: string;
}

export interface CaseData {
  case_id: string;
  title: string;
  customer_name: string;
  status: 'COMPLETE' | 'INCOMPLETE' | 'NOT_APPLICABLE';
  requested_at: string;
  audit_at: string;
  request_text: string;
  systems_checked: number;
  residual_copies: number;
  identities: {
    primary_email: string;
    historical_emails: string[];
    phone_numbers: string[];
    account_ids: string[];
  };
  steps: AuditStep[];
  lineage: {
    nodes: Array<{ id: string; label: string; type: 'source' | 'storage' | 'replica' | 'backup' | 'export' | 'sync'; state: string }>;
    links: Array<{ from: string; to: string; label: string; isZombie?: boolean }>;
  };
}

export const SAMPLE_CASES: Record<string, CaseData> = {
  'case_0412': {
    case_id: 'case_0412',
    title: 'Northstar Shop Customer Wiped Account',
    customer_name: 'Elena Rostova',
    status: 'COMPLETE',
    requested_at: '2026-10-14 09:22:10 UTC',
    audit_at: '2026-10-28 14:00:00 UTC',
    request_text: 'Please permanently delete my personal account, all my order history, and delete every record of my email elena.rostova@gmail.com and old phone number.',
    systems_checked: 6,
    residual_copies: 2,
    identities: {
      primary_email: 'elena.rostova@gmail.com',
      historical_emails: ['elena.r@northstar-corp.io', 'e.rostova.backup@yahoo.com'],
      phone_numbers: ['+1-555-019-4821', '+1-555-014-9920'],
      account_ids: ['usr_9942a', 'cust_0412_legacy', 'auth_88201']
    },
    steps: [
      {
        step_no: 1,
        phase: 'FINDING',
        system_id: 'analytics_platform',
        resource_id: 'export_october_q4_dump',
        operation: 'REPORT_REMAINING_RECORD',
        state: 'PRESENT',
        evidence_id: 'evidence_412_a',
        details: 'Found unpurged user email and order metrics in analytical warehouse extract.'
      },
      {
        step_no: 2,
        phase: 'FINDING',
        system_id: 'backup_service',
        resource_id: 'cold_snapshot_20261015',
        operation: 'REPORT_RESTORE_RISK',
        state: 'ACTIVE',
        evidence_id: 'evidence_412_b',
        details: 'Active snapshot schedule contains pre-deletion DB image without restore block.'
      },
      {
        step_no: 3,
        phase: 'REMEDIATION',
        system_id: 'backup_service',
        resource_id: 'cold_snapshot_20261015',
        operation: 'BLOCK_RESTORE',
        state: 'BLOCKED',
        evidence_id: 'evidence_412_c',
        details: 'Applied cryptographic exclusion rule blocking restoration of user_id usr_9942a.'
      },
      {
        step_no: 4,
        phase: 'REMEDIATION',
        system_id: 'analytics_platform',
        resource_id: 'export_october_q4_dump',
        operation: 'DELETE_RECORD',
        state: 'ABSENT',
        evidence_id: 'evidence_412_d',
        details: 'Executed targeted partition purge for customer records across parquet lake.'
      },
      {
        step_no: 5,
        phase: 'VERIFICATION',
        system_id: 'account_service',
        resource_id: 'account_9942a_tombstone',
        operation: 'VERIFY_RECORD_ABSENT',
        state: 'ABSENT',
        evidence_id: 'evidence_412_e',
        details: 'Confirmed tombstone contains ONLY internal UUID; zero names, emails or phones.'
      },
      {
        step_no: 6,
        phase: 'VERIFICATION',
        system_id: 'analytics_platform',
        resource_id: 'export_october_q4_dump',
        operation: 'VERIFY_RECORD_ABSENT',
        state: 'ABSENT',
        evidence_id: 'evidence_412_f',
        details: 'Deterministic query returned 0 rows for all 3 resolved email aliases.'
      },
      {
        step_no: 7,
        phase: 'VERIFICATION',
        system_id: 'backup_service',
        resource_id: 'cold_snapshot_20261015',
        operation: 'VERIFY_RESTORE_BLOCKED',
        state: 'BLOCKED',
        evidence_id: 'evidence_412_g',
        details: 'Verified restore filter drop table triggers on any cold restore attempt.'
      }
    ],
    lineage: {
      nodes: [
        { id: 'acc', label: 'Account Service (Primary DB)', type: 'source', state: 'Tombstone Cleaned' },
        { id: 'rep', label: 'Postgres Read Replica', type: 'replica', state: 'Purged' },
        { id: 'ana', label: 'Analytics Platform (Lakehouse)', type: 'export', state: 'Ghost Found & Purged' },
        { id: 'bck', label: 'S3 Cold Backup Archive', type: 'backup', state: 'Restore Block Enforced' },
        { id: 'crm', label: 'Zendesk Support Desk', type: 'storage', state: 'Attachments Redacted' },
        { id: 'snc', label: 'Hourly Kafka CDC Sync', type: 'sync', state: 'Filter Rule Deployed' }
      ],
      links: [
        { from: 'acc', to: 'rep', label: 'Streaming WAL' },
        { from: 'acc', to: 'ana', label: 'Nightly Batch Extract', isZombie: true },
        { from: 'acc', to: 'bck', label: 'Snapshot Dump', isZombie: true },
        { from: 'snc', to: 'acc', label: 'Bi-directional Re-insert', isZombie: true }
      ]
    }
  },
  'case_09': {
    case_id: 'case_09',
    title: 'Backup Restore Risk & Security Audit Retention',
    customer_name: 'Marcus Vance',
    status: 'INCOMPLETE',
    requested_at: '2026-10-18 11:45:00 UTC',
    audit_at: '2026-10-25 12:00:00 UTC',
    request_text: 'I demand my account deleted immediately according to GDPR Article 17.',
    systems_checked: 5,
    residual_copies: 1,
    identities: {
      primary_email: 'marcus.vance@techcore.com',
      historical_emails: ['mvance88@gmail.com'],
      phone_numbers: ['+1-555-081-3319'],
      account_ids: ['account_3960']
    },
    steps: [
      {
        step_no: 1,
        phase: 'FINDING',
        system_id: 'backup_service',
        resource_id: 'backup_4978',
        operation: 'REPORT_RESTORE_RISK',
        state: 'ACTIVE',
        evidence_id: 'evidence_93',
        details: 'Active backup schedule would re-insert user record if Disaster Recovery runs.'
      },
      {
        step_no: 2,
        phase: 'REMEDIATION',
        system_id: 'backup_service',
        resource_id: 'backup_4978',
        operation: 'BLOCK_RESTORE',
        state: 'BLOCKED',
        evidence_id: '',
        details: 'Injected negative tombstone filter into DR pipeline manifest.'
      },
      {
        step_no: 3,
        phase: 'VERIFICATION',
        system_id: 'account_service',
        resource_id: 'account_3960',
        operation: 'VERIFY_RECORD_ABSENT',
        state: 'ABSENT',
        evidence_id: '',
        details: 'Verified user record completely expunged from primary accounts table.'
      },
      {
        step_no: 4,
        phase: 'VERIFICATION',
        system_id: 'security_service',
        resource_id: 'audit_record_4902',
        operation: 'VERIFY_RECORD_PRESENT',
        state: 'PRESENT',
        evidence_id: '',
        details: 'Compliance Rule 12: Security audit logs must be preserved for statutory period.'
      },
      {
        step_no: 5,
        phase: 'VERIFICATION',
        system_id: 'backup_service',
        resource_id: 'backup_4978',
        operation: 'VERIFY_RESTORE_BLOCKED',
        state: 'BLOCKED',
        evidence_id: '',
        details: 'Confirmed backup restore filter is operational and active.'
      }
    ],
    lineage: {
      nodes: [
        { id: 'acc', label: 'account_service', type: 'source', state: 'ABSENT' },
        { id: 'bck', label: 'backup_service', type: 'backup', state: 'RESTORE_BLOCKED' },
        { id: 'sec', label: 'security_service', type: 'storage', state: 'PRESENT (Legal Hold)' }
      ],
      links: [
        { from: 'acc', to: 'bck', label: 'Snapshot #4978', isZombie: true },
        { from: 'acc', to: 'sec', label: 'Audit Trail' }
      ]
    }
  },
  'case_05': {
    case_id: 'case_05',
    title: 'Primary Account Zombie Survival',
    customer_name: 'Sophia Chang',
    status: 'INCOMPLETE',
    requested_at: '2026-10-12 16:30:00 UTC',
    audit_at: '2026-10-22 09:00:00 UTC',
    request_text: 'Please erase my account and payment profiles permanently.',
    systems_checked: 4,
    residual_copies: 1,
    identities: {
      primary_email: 'sophia.chang@domain.org',
      historical_emails: [],
      phone_numbers: ['+1-555-098-1122'],
      account_ids: ['account_005']
    },
    steps: [
      {
        step_no: 1,
        phase: 'FINDING',
        system_id: 'account_service',
        resource_id: 'account_005',
        operation: 'REPORT_REMAINING_RECORD',
        state: 'PRESENT',
        evidence_id: 'evidence_54',
        details: 'Record still physically present in accounts table despite complete ticket status.'
      },
      {
        step_no: 2,
        phase: 'REMEDIATION',
        system_id: 'account_service',
        resource_id: 'account_005',
        operation: 'DELETE_RECORD',
        state: 'ABSENT',
        evidence_id: '',
        details: 'Purged record and scrubbed relational references.'
      },
      {
        step_no: 3,
        phase: 'VERIFICATION',
        system_id: 'account_service',
        resource_id: 'account_005',
        operation: 'VERIFY_RECORD_ABSENT',
        state: 'ABSENT',
        evidence_id: '',
        details: 'Verified account 005 returns 404 Not Found on all API routes.'
      }
    ],
    lineage: {
      nodes: [
        { id: 'acc', label: 'account_service', type: 'source', state: 'Found Residual' },
        { id: 'pay', label: 'billing_gateway', type: 'storage', state: 'Pending Purge' }
      ],
      links: [
        { from: 'acc', to: 'pay', label: 'Customer Token' }
      ]
    }
  }
};

