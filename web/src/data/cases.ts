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
  "case_01": {
    "case_id": "case_01",
    "title": "CASE_01: Failover Replica Verified Absent",
    "customer_name": "Amina El-Masri",
    "status": "COMPLETE",
    "requested_at": "2026-08-18T09:14:00Z",
    "audit_at": "2026-09-03T11:30:00Z",
    "request_text": "Hi, I haven\u2019t used this account in years and would like it closed. Please remove the profile and the personal details attached to it.",
    "systems_checked": 1,
    "residual_copies": 0,
    "identities": {
      "primary_email": "amina.elmasri@gmail.com",
      "historical_emails": [],
      "phone_numbers": [
        "+971 50 482 7316"
      ],
      "account_ids": [
        "user_01",
        "account_01"
      ]
    },
    "steps": [
      {
        "evidence_id": "evidence_54",
        "operation": "VERIFY_RECORD_ABSENT",
        "phase": "VERIFICATION",
        "resource_id": "account_001",
        "state": "ABSENT",
        "step_no": 1,
        "system_id": "account_service"
      }
    ],
    "lineage": {
      "nodes": [
        {
          "id": "source_portal",
          "label": "Web / Mobile Client",
          "type": "source",
          "state": "DELETED"
        },
        {
          "id": "account_primary",
          "label": "Account Service (PostgreSQL)",
          "type": "storage",
          "state": "DELETED"
        },
        {
          "id": "replica_db",
          "label": "Read Replica Cluster",
          "type": "replica",
          "state": "DELETED"
        },
        {
          "id": "search_index",
          "label": "Search Service (Elasticsearch)",
          "type": "replica",
          "state": "DELETED"
        },
        {
          "id": "analytics_store",
          "label": "Analytics Warehouse",
          "type": "storage",
          "state": "ANONYMIZED"
        },
        {
          "id": "cold_backup",
          "label": "S3 Cold Archive Snapshot",
          "type": "backup",
          "state": "BLOCKED"
        }
      ],
      "links": [
        {
          "from": "source_portal",
          "to": "account_primary",
          "label": "Request Ingest"
        },
        {
          "from": "account_primary",
          "to": "replica_db",
          "label": "Replication Sync",
          "isZombie": false
        },
        {
          "from": "account_primary",
          "to": "search_index",
          "label": "Index Feed",
          "isZombie": false
        },
        {
          "from": "account_primary",
          "to": "analytics_store",
          "label": "Event Stream"
        },
        {
          "from": "account_primary",
          "to": "cold_backup",
          "label": "Daily Snapshot",
          "isZombie": false
        }
      ]
    }
  },
  "case_03": {
    "case_id": "case_03",
    "title": "CASE_03: Multi-System Compliant Verification",
    "customer_name": "Louis Fontaine",
    "status": "COMPLETE",
    "requested_at": "2026-09-13T11:00:00Z",
    "audit_at": "2026-09-26T11:00:00Z",
    "request_text": "Je demande la suppression d\u00e9finitive du compte associ\u00e9 \u00e0 cette adresse e-mail. Veuillez examiner les identifiants actuels et ant\u00e9rieurs conform\u00e9ment \u00e0 votre proc\u00e9dure de confidentialit\u00e9. Merci de confirmer le r\u00e9sultat une fois la v\u00e9rification termin\u00e9e.",
    "systems_checked": 3,
    "residual_copies": 0,
    "identities": {
      "primary_email": "l.fontaine46@yahoo.com",
      "historical_emails": [],
      "phone_numbers": [
        "+33 6 80 08 96 38"
      ],
      "account_ids": [
        "user_43",
        "account_43"
      ]
    },
    "steps": [
      {
        "step_no": 1,
        "phase": "VERIFICATION",
        "system_id": "account_service",
        "resource_id": "account_7566",
        "operation": "VERIFY_RECORD_ABSENT",
        "state": "ABSENT",
        "evidence_id": "evidence_94"
      },
      {
        "step_no": 2,
        "phase": "VERIFICATION",
        "system_id": "security_service",
        "resource_id": "audit_record_2016",
        "operation": "VERIFY_RECORD_PRESENT",
        "state": "PRESENT",
        "evidence_id": "evidence_94"
      },
      {
        "step_no": 3,
        "phase": "VERIFICATION",
        "system_id": "analytics_platform",
        "resource_id": "analytics_9406",
        "operation": "VERIFY_RECORD_ANONYMIZED",
        "state": "ANONYMIZED",
        "evidence_id": "evidence_94"
      }
    ],
    "lineage": {
      "nodes": [
        {
          "id": "source_portal",
          "label": "Web / Mobile Client",
          "type": "source",
          "state": "DELETED"
        },
        {
          "id": "account_primary",
          "label": "Account Service (PostgreSQL)",
          "type": "storage",
          "state": "DELETED"
        },
        {
          "id": "replica_db",
          "label": "Read Replica Cluster",
          "type": "replica",
          "state": "DELETED"
        },
        {
          "id": "search_index",
          "label": "Search Service (Elasticsearch)",
          "type": "replica",
          "state": "DELETED"
        },
        {
          "id": "analytics_store",
          "label": "Analytics Warehouse",
          "type": "storage",
          "state": "ANONYMIZED"
        },
        {
          "id": "cold_backup",
          "label": "S3 Cold Archive Snapshot",
          "type": "backup",
          "state": "BLOCKED"
        }
      ],
      "links": [
        {
          "from": "source_portal",
          "to": "account_primary",
          "label": "Request Ingest"
        },
        {
          "from": "account_primary",
          "to": "replica_db",
          "label": "Replication Sync",
          "isZombie": false
        },
        {
          "from": "account_primary",
          "to": "search_index",
          "label": "Index Feed",
          "isZombie": false
        },
        {
          "from": "account_primary",
          "to": "analytics_store",
          "label": "Event Stream"
        },
        {
          "from": "account_primary",
          "to": "cold_backup",
          "label": "Daily Snapshot",
          "isZombie": false
        }
      ]
    }
  },
  "case_04": {
    "case_id": "case_04",
    "title": "CASE_04: GDPR Anonymized Statistics Cohort",
    "customer_name": "Thandiwe Ndlovu",
    "status": "COMPLETE",
    "requested_at": "2026-08-25T12:32:00Z",
    "audit_at": "2026-09-07T10:20:00Z",
    "request_text": "I\u2019m deleting my account. You can keep anonymous statistics, but nothing in analytics should still point back to me.",
    "systems_checked": 2,
    "residual_copies": 0,
    "identities": {
      "primary_email": "thandiwe.n@gmail.com",
      "historical_emails": [],
      "phone_numbers": [
        "+27 71 684 5928"
      ],
      "account_ids": [
        "user_04",
        "account_04"
      ]
    },
    "steps": [
      {
        "evidence_id": "evidence_54",
        "operation": "VERIFY_RECORD_ABSENT",
        "phase": "VERIFICATION",
        "resource_id": "account_004",
        "state": "ABSENT",
        "step_no": 1,
        "system_id": "account_service"
      },
      {
        "evidence_id": "evidence_56",
        "operation": "VERIFY_RECORD_ANONYMIZED",
        "phase": "VERIFICATION",
        "resource_id": "analytics_901",
        "state": "ANONYMIZED",
        "step_no": 2,
        "system_id": "analytics_platform"
      }
    ],
    "lineage": {
      "nodes": [
        {
          "id": "source_portal",
          "label": "Web / Mobile Client",
          "type": "source",
          "state": "DELETED"
        },
        {
          "id": "account_primary",
          "label": "Account Service (PostgreSQL)",
          "type": "storage",
          "state": "DELETED"
        },
        {
          "id": "replica_db",
          "label": "Read Replica Cluster",
          "type": "replica",
          "state": "DELETED"
        },
        {
          "id": "search_index",
          "label": "Search Service (Elasticsearch)",
          "type": "replica",
          "state": "DELETED"
        },
        {
          "id": "analytics_store",
          "label": "Analytics Warehouse",
          "type": "storage",
          "state": "ANONYMIZED"
        },
        {
          "id": "cold_backup",
          "label": "S3 Cold Archive Snapshot",
          "type": "backup",
          "state": "BLOCKED"
        }
      ],
      "links": [
        {
          "from": "source_portal",
          "to": "account_primary",
          "label": "Request Ingest"
        },
        {
          "from": "account_primary",
          "to": "replica_db",
          "label": "Replication Sync",
          "isZombie": false
        },
        {
          "from": "account_primary",
          "to": "search_index",
          "label": "Index Feed",
          "isZombie": false
        },
        {
          "from": "account_primary",
          "to": "analytics_store",
          "label": "Event Stream"
        },
        {
          "from": "account_primary",
          "to": "cold_backup",
          "label": "Daily Snapshot",
          "isZombie": false
        }
      ]
    }
  },
  "case_05": {
    "case_id": "case_05",
    "title": "CASE_05: Failover Replica Zombie Record",
    "customer_name": "Leila Haddad",
    "status": "INCOMPLETE",
    "requested_at": "2026-08-27T14:17:00Z",
    "audit_at": "2026-09-08T13:40:00Z",
    "request_text": "I deleted this account and received a confirmation, but the same email address is still recognized. Please remove any remaining copy of my profile.",
    "systems_checked": 1,
    "residual_copies": 1,
    "identities": {
      "primary_email": "leila.haddad@yahoo.com",
      "historical_emails": [],
      "phone_numbers": [
        "+212 6 48 27 15 93"
      ],
      "account_ids": [
        "user_05",
        "account_05"
      ]
    },
    "steps": [
      {
        "evidence_id": "evidence_54",
        "operation": "REPORT_REMAINING_RECORD",
        "phase": "FINDING",
        "resource_id": "account_005",
        "state": "PRESENT",
        "step_no": 1,
        "system_id": "account_service"
      },
      {
        "evidence_id": "",
        "operation": "DELETE_RECORD",
        "phase": "REMEDIATION",
        "resource_id": "account_005",
        "state": "ABSENT",
        "step_no": 2,
        "system_id": "account_service"
      },
      {
        "evidence_id": "",
        "operation": "VERIFY_RECORD_ABSENT",
        "phase": "VERIFICATION",
        "resource_id": "account_005",
        "state": "ABSENT",
        "step_no": 3,
        "system_id": "account_service"
      }
    ],
    "lineage": {
      "nodes": [
        {
          "id": "source_portal",
          "label": "Web / Mobile Client",
          "type": "source",
          "state": "DELETED"
        },
        {
          "id": "account_primary",
          "label": "Account Service (PostgreSQL)",
          "type": "storage",
          "state": "RESIDUAL"
        },
        {
          "id": "replica_db",
          "label": "Read Replica Cluster",
          "type": "replica",
          "state": "DESYNCED"
        },
        {
          "id": "search_index",
          "label": "Search Service (Elasticsearch)",
          "type": "replica",
          "state": "RESIDUAL"
        },
        {
          "id": "analytics_store",
          "label": "Analytics Warehouse",
          "type": "storage",
          "state": "ANONYMIZED"
        },
        {
          "id": "cold_backup",
          "label": "S3 Cold Archive Snapshot",
          "type": "backup",
          "state": "RESTORE_RISK"
        }
      ],
      "links": [
        {
          "from": "source_portal",
          "to": "account_primary",
          "label": "Request Ingest"
        },
        {
          "from": "account_primary",
          "to": "replica_db",
          "label": "Replication Sync",
          "isZombie": true
        },
        {
          "from": "account_primary",
          "to": "search_index",
          "label": "Index Feed",
          "isZombie": false
        },
        {
          "from": "account_primary",
          "to": "analytics_store",
          "label": "Event Stream"
        },
        {
          "from": "account_primary",
          "to": "cold_backup",
          "label": "Daily Snapshot",
          "isZombie": false
        }
      ]
    }
  },
  "case_06": {
    "case_id": "case_06",
    "title": "CASE_06: Residual Search Index Document",
    "customer_name": "Jonas Berg",
    "status": "INCOMPLETE",
    "requested_at": "2026-08-29T06:51:00Z",
    "audit_at": "2026-09-10T09:15:00Z",
    "request_text": "My account page is gone, but my old profile still appears when I search for it. Can you remove that search result too?",
    "systems_checked": 2,
    "residual_copies": 1,
    "identities": {
      "primary_email": "jonas.berg@outlook.com",
      "historical_emails": [],
      "phone_numbers": [
        "+46 70 482 91 37"
      ],
      "account_ids": [
        "user_06",
        "account_06"
      ]
    },
    "steps": [
      {
        "evidence_id": "evidence_57",
        "operation": "REPORT_REMAINING_RECORD",
        "phase": "FINDING",
        "resource_id": "search_001",
        "state": "PRESENT",
        "step_no": 1,
        "system_id": "search_service"
      },
      {
        "evidence_id": "",
        "operation": "DELETE_RECORD",
        "phase": "REMEDIATION",
        "resource_id": "search_001",
        "state": "ABSENT",
        "step_no": 2,
        "system_id": "search_service"
      },
      {
        "evidence_id": "",
        "operation": "VERIFY_RECORD_ABSENT",
        "phase": "VERIFICATION",
        "resource_id": "account_006",
        "state": "ABSENT",
        "step_no": 3,
        "system_id": "account_service"
      },
      {
        "evidence_id": "",
        "operation": "VERIFY_RECORD_ABSENT",
        "phase": "VERIFICATION",
        "resource_id": "search_001",
        "state": "ABSENT",
        "step_no": 4,
        "system_id": "search_service"
      }
    ],
    "lineage": {
      "nodes": [
        {
          "id": "source_portal",
          "label": "Web / Mobile Client",
          "type": "source",
          "state": "DELETED"
        },
        {
          "id": "account_primary",
          "label": "Account Service (PostgreSQL)",
          "type": "storage",
          "state": "RESIDUAL"
        },
        {
          "id": "replica_db",
          "label": "Read Replica Cluster",
          "type": "replica",
          "state": "DESYNCED"
        },
        {
          "id": "search_index",
          "label": "Search Service (Elasticsearch)",
          "type": "replica",
          "state": "RESIDUAL"
        },
        {
          "id": "analytics_store",
          "label": "Analytics Warehouse",
          "type": "storage",
          "state": "ANONYMIZED"
        },
        {
          "id": "cold_backup",
          "label": "S3 Cold Archive Snapshot",
          "type": "backup",
          "state": "RESTORE_RISK"
        }
      ],
      "links": [
        {
          "from": "source_portal",
          "to": "account_primary",
          "label": "Request Ingest"
        },
        {
          "from": "account_primary",
          "to": "replica_db",
          "label": "Replication Sync",
          "isZombie": true
        },
        {
          "from": "account_primary",
          "to": "search_index",
          "label": "Index Feed",
          "isZombie": true
        },
        {
          "from": "account_primary",
          "to": "analytics_store",
          "label": "Event Stream"
        },
        {
          "from": "account_primary",
          "to": "cold_backup",
          "label": "Daily Snapshot",
          "isZombie": false
        }
      ]
    }
  },
  "case_07": {
    "case_id": "case_07",
    "title": "CASE_07: Customer Support Attachment Leak",
    "customer_name": "Priya Raman",
    "status": "INCOMPLETE",
    "requested_at": "2026-08-31T11:26:00Z",
    "audit_at": "2026-09-12T08:00:00Z",
    "request_text": "Please delete my account and the identity document I sent to support while resolving a delivery issue.",
    "systems_checked": 2,
    "residual_copies": 1,
    "identities": {
      "primary_email": "priya.raman@gmail.com",
      "historical_emails": [],
      "phone_numbers": [
        "+91 98765 73142"
      ],
      "account_ids": [
        "user_07",
        "account_07"
      ]
    },
    "steps": [
      {
        "evidence_id": "evidence_58",
        "operation": "REPORT_REMAINING_RECORD",
        "phase": "FINDING",
        "resource_id": "support_001",
        "state": "PRESENT",
        "step_no": 1,
        "system_id": "support_platform"
      },
      {
        "evidence_id": "",
        "operation": "DELETE_RECORD",
        "phase": "REMEDIATION",
        "resource_id": "support_001",
        "state": "ABSENT",
        "step_no": 2,
        "system_id": "support_platform"
      },
      {
        "evidence_id": "",
        "operation": "VERIFY_RECORD_ABSENT",
        "phase": "VERIFICATION",
        "resource_id": "account_007",
        "state": "ABSENT",
        "step_no": 3,
        "system_id": "account_service"
      },
      {
        "evidence_id": "",
        "operation": "VERIFY_RECORD_ABSENT",
        "phase": "VERIFICATION",
        "resource_id": "support_001",
        "state": "ABSENT",
        "step_no": 4,
        "system_id": "support_platform"
      }
    ],
    "lineage": {
      "nodes": [
        {
          "id": "source_portal",
          "label": "Web / Mobile Client",
          "type": "source",
          "state": "DELETED"
        },
        {
          "id": "account_primary",
          "label": "Account Service (PostgreSQL)",
          "type": "storage",
          "state": "RESIDUAL"
        },
        {
          "id": "replica_db",
          "label": "Read Replica Cluster",
          "type": "replica",
          "state": "DESYNCED"
        },
        {
          "id": "search_index",
          "label": "Search Service (Elasticsearch)",
          "type": "replica",
          "state": "RESIDUAL"
        },
        {
          "id": "analytics_store",
          "label": "Analytics Warehouse",
          "type": "storage",
          "state": "ANONYMIZED"
        },
        {
          "id": "cold_backup",
          "label": "S3 Cold Archive Snapshot",
          "type": "backup",
          "state": "RESTORE_RISK"
        }
      ],
      "links": [
        {
          "from": "source_portal",
          "to": "account_primary",
          "label": "Request Ingest"
        },
        {
          "from": "account_primary",
          "to": "replica_db",
          "label": "Replication Sync",
          "isZombie": true
        },
        {
          "from": "account_primary",
          "to": "search_index",
          "label": "Index Feed",
          "isZombie": false
        },
        {
          "from": "account_primary",
          "to": "analytics_store",
          "label": "Event Stream"
        },
        {
          "from": "account_primary",
          "to": "cold_backup",
          "label": "Daily Snapshot",
          "isZombie": false
        }
      ]
    }
  },
  "case_08": {
    "case_id": "case_08",
    "title": "CASE_08: Residual Analytics Export Zip",
    "customer_name": "Gabriel Costa",
    "status": "INCOMPLETE",
    "requested_at": "2026-08-29T20:03:00Z",
    "audit_at": "2026-09-14T16:10:00Z",
    "request_text": "I closed my account, but an old \u201cdownload your data\u201d link still works. Please delete that export file as well.",
    "systems_checked": 2,
    "residual_copies": 1,
    "identities": {
      "primary_email": "gabriel.costa@proton.me",
      "historical_emails": [],
      "phone_numbers": [
        "+55 11 97284-3165"
      ],
      "account_ids": [
        "user_08",
        "account_08"
      ]
    },
    "steps": [
      {
        "evidence_id": "evidence_59",
        "operation": "REPORT_REMAINING_RECORD",
        "phase": "FINDING",
        "resource_id": "export_001",
        "state": "PRESENT",
        "step_no": 1,
        "system_id": "export_service"
      },
      {
        "evidence_id": "",
        "operation": "DELETE_RECORD",
        "phase": "REMEDIATION",
        "resource_id": "export_001",
        "state": "ABSENT",
        "step_no": 2,
        "system_id": "export_service"
      },
      {
        "evidence_id": "",
        "operation": "VERIFY_RECORD_ABSENT",
        "phase": "VERIFICATION",
        "resource_id": "account_008",
        "state": "ABSENT",
        "step_no": 3,
        "system_id": "account_service"
      },
      {
        "evidence_id": "",
        "operation": "VERIFY_RECORD_ABSENT",
        "phase": "VERIFICATION",
        "resource_id": "export_001",
        "state": "ABSENT",
        "step_no": 4,
        "system_id": "export_service"
      }
    ],
    "lineage": {
      "nodes": [
        {
          "id": "source_portal",
          "label": "Web / Mobile Client",
          "type": "source",
          "state": "DELETED"
        },
        {
          "id": "account_primary",
          "label": "Account Service (PostgreSQL)",
          "type": "storage",
          "state": "RESIDUAL"
        },
        {
          "id": "replica_db",
          "label": "Read Replica Cluster",
          "type": "replica",
          "state": "DESYNCED"
        },
        {
          "id": "search_index",
          "label": "Search Service (Elasticsearch)",
          "type": "replica",
          "state": "RESIDUAL"
        },
        {
          "id": "analytics_store",
          "label": "Analytics Warehouse",
          "type": "storage",
          "state": "ANONYMIZED"
        },
        {
          "id": "cold_backup",
          "label": "S3 Cold Archive Snapshot",
          "type": "backup",
          "state": "RESTORE_RISK"
        }
      ],
      "links": [
        {
          "from": "source_portal",
          "to": "account_primary",
          "label": "Request Ingest"
        },
        {
          "from": "account_primary",
          "to": "replica_db",
          "label": "Replication Sync",
          "isZombie": true
        },
        {
          "from": "account_primary",
          "to": "search_index",
          "label": "Index Feed",
          "isZombie": false
        },
        {
          "from": "account_primary",
          "to": "analytics_store",
          "label": "Event Stream"
        },
        {
          "from": "account_primary",
          "to": "cold_backup",
          "label": "Daily Snapshot",
          "isZombie": false
        }
      ]
    }
  },
  "case_09": {
    "case_id": "case_09",
    "title": "CASE_09: Cold Disaster Recovery Backup Risk",
    "customer_name": "Kojo Appiah",
    "status": "INCOMPLETE",
    "requested_at": "2026-09-05T09:00:00Z",
    "audit_at": "2026-09-16T09:00:00Z",
    "request_text": "Please permanently delete the account associated with this email address. Please apply the correct treatment to records covered by the request. Please confirm when the review is complete.",
    "systems_checked": 3,
    "residual_copies": 1,
    "identities": {
      "primary_email": "k.appiah88@gmail.com",
      "historical_emails": [],
      "phone_numbers": [
        "+233 24 468 1056"
      ],
      "account_ids": [
        "user_61",
        "account_61"
      ]
    },
    "steps": [
      {
        "step_no": 1,
        "phase": "FINDING",
        "system_id": "backup_service",
        "resource_id": "backup_4978",
        "operation": "REPORT_RESTORE_RISK",
        "state": "ACTIVE",
        "evidence_id": "evidence_93"
      },
      {
        "step_no": 2,
        "phase": "REMEDIATION",
        "system_id": "backup_service",
        "resource_id": "backup_4978",
        "operation": "BLOCK_RESTORE",
        "state": "BLOCKED",
        "evidence_id": ""
      },
      {
        "step_no": 3,
        "phase": "VERIFICATION",
        "system_id": "account_service",
        "resource_id": "account_3960",
        "operation": "VERIFY_RECORD_ABSENT",
        "state": "ABSENT",
        "evidence_id": ""
      },
      {
        "step_no": 4,
        "phase": "VERIFICATION",
        "system_id": "security_service",
        "resource_id": "audit_record_4902",
        "operation": "VERIFY_RECORD_PRESENT",
        "state": "PRESENT",
        "evidence_id": ""
      },
      {
        "step_no": 5,
        "phase": "VERIFICATION",
        "system_id": "backup_service",
        "resource_id": "backup_4978",
        "operation": "VERIFY_RESTORE_BLOCKED",
        "state": "BLOCKED",
        "evidence_id": ""
      }
    ],
    "lineage": {
      "nodes": [
        {
          "id": "source_portal",
          "label": "Web / Mobile Client",
          "type": "source",
          "state": "DELETED"
        },
        {
          "id": "account_primary",
          "label": "Account Service (PostgreSQL)",
          "type": "storage",
          "state": "RESIDUAL"
        },
        {
          "id": "replica_db",
          "label": "Read Replica Cluster",
          "type": "replica",
          "state": "DESYNCED"
        },
        {
          "id": "search_index",
          "label": "Search Service (Elasticsearch)",
          "type": "replica",
          "state": "RESIDUAL"
        },
        {
          "id": "analytics_store",
          "label": "Analytics Warehouse",
          "type": "storage",
          "state": "ANONYMIZED"
        },
        {
          "id": "cold_backup",
          "label": "S3 Cold Archive Snapshot",
          "type": "backup",
          "state": "RESTORE_RISK"
        }
      ],
      "links": [
        {
          "from": "source_portal",
          "to": "account_primary",
          "label": "Request Ingest"
        },
        {
          "from": "account_primary",
          "to": "replica_db",
          "label": "Replication Sync",
          "isZombie": true
        },
        {
          "from": "account_primary",
          "to": "search_index",
          "label": "Index Feed",
          "isZombie": false
        },
        {
          "from": "account_primary",
          "to": "analytics_store",
          "label": "Event Stream"
        },
        {
          "from": "account_primary",
          "to": "cold_backup",
          "label": "Daily Snapshot",
          "isZombie": true
        }
      ]
    }
  },
  "case_11": {
    "case_id": "case_11",
    "title": "CASE_11: 14-Step Multi-System Cross-Border Ghost Data",
    "customer_name": "Tomasz Novak",
    "status": "INCOMPLETE",
    "requested_at": "2026-09-09T12:00:00Z",
    "audit_at": "2026-10-01T12:00:00Z",
    "request_text": "I would like the account associated with this address to be erased. Please handle any copies that fall within the scope of the deletion request. Please contact me if you need information to verify the request.",
    "systems_checked": 6,
    "residual_copies": 4,
    "identities": {
      "primary_email": "novak.tomasz@icloud.com",
      "historical_emails": [],
      "phone_numbers": [
        "+48 601 623 422"
      ],
      "account_ids": [
        "user_32",
        "account_32"
      ]
    },
    "steps": [
      {
        "step_no": 1,
        "phase": "FINDING",
        "system_id": "search_service",
        "resource_id": "search_052",
        "operation": "REPORT_REMAINING_RECORD",
        "state": "PRESENT",
        "evidence_id": "evidence_03"
      },
      {
        "step_no": 2,
        "phase": "FINDING",
        "system_id": "analytics_platform",
        "resource_id": "analytics_2034",
        "operation": "REPORT_EXPOSED_PII",
        "state": "PRESENT",
        "evidence_id": "evidence_03"
      },
      {
        "step_no": 3,
        "phase": "FINDING",
        "system_id": "support_platform",
        "resource_id": "support_864",
        "operation": "REPORT_EXPOSED_PII",
        "state": "PRESENT",
        "evidence_id": "evidence_03"
      },
      {
        "step_no": 4,
        "phase": "FINDING",
        "system_id": "integration_service",
        "resource_id": "data_flow_9522",
        "operation": "REPORT_ACTIVE_DATA_FLOW",
        "state": "ACTIVE",
        "evidence_id": "evidence_03"
      },
      {
        "step_no": 5,
        "phase": "REMEDIATION",
        "system_id": "integration_service",
        "resource_id": "data_flow_9522",
        "operation": "DISABLE_DATA_FLOW",
        "state": "DISABLED",
        "evidence_id": ""
      },
      {
        "step_no": 6,
        "phase": "REMEDIATION",
        "system_id": "search_service",
        "resource_id": "search_052",
        "operation": "DELETE_RECORD",
        "state": "ABSENT",
        "evidence_id": ""
      },
      {
        "step_no": 7,
        "phase": "REMEDIATION",
        "system_id": "support_platform",
        "resource_id": "support_864",
        "operation": "REDACT_RECORD",
        "state": "REDACTED",
        "evidence_id": ""
      },
      {
        "step_no": 8,
        "phase": "REMEDIATION",
        "system_id": "analytics_platform",
        "resource_id": "analytics_2034",
        "operation": "ANONYMIZE_RECORD",
        "state": "ANONYMIZED",
        "evidence_id": ""
      },
      {
        "step_no": 9,
        "phase": "VERIFICATION",
        "system_id": "account_service",
        "resource_id": "account_4248",
        "operation": "VERIFY_RECORD_ABSENT",
        "state": "ABSENT",
        "evidence_id": ""
      },
      {
        "step_no": 10,
        "phase": "VERIFICATION",
        "system_id": "search_service",
        "resource_id": "search_052",
        "operation": "VERIFY_RECORD_ABSENT",
        "state": "ABSENT",
        "evidence_id": ""
      },
      {
        "step_no": 11,
        "phase": "VERIFICATION",
        "system_id": "security_service",
        "resource_id": "audit_record_9394",
        "operation": "VERIFY_RECORD_PRESENT",
        "state": "PRESENT",
        "evidence_id": ""
      },
      {
        "step_no": 12,
        "phase": "VERIFICATION",
        "system_id": "support_platform",
        "resource_id": "support_864",
        "operation": "VERIFY_RECORD_REDACTED",
        "state": "REDACTED",
        "evidence_id": ""
      },
      {
        "step_no": 13,
        "phase": "VERIFICATION",
        "system_id": "analytics_platform",
        "resource_id": "analytics_2034",
        "operation": "VERIFY_RECORD_ANONYMIZED",
        "state": "ANONYMIZED",
        "evidence_id": ""
      },
      {
        "step_no": 14,
        "phase": "VERIFICATION",
        "system_id": "integration_service",
        "resource_id": "data_flow_9522",
        "operation": "VERIFY_DATA_FLOW_DISABLED",
        "state": "DISABLED",
        "evidence_id": ""
      }
    ],
    "lineage": {
      "nodes": [
        {
          "id": "source_portal",
          "label": "Web / Mobile Client",
          "type": "source",
          "state": "DELETED"
        },
        {
          "id": "account_primary",
          "label": "Account Service (PostgreSQL)",
          "type": "storage",
          "state": "RESIDUAL"
        },
        {
          "id": "replica_db",
          "label": "Read Replica Cluster",
          "type": "replica",
          "state": "DESYNCED"
        },
        {
          "id": "search_index",
          "label": "Search Service (Elasticsearch)",
          "type": "replica",
          "state": "RESIDUAL"
        },
        {
          "id": "analytics_store",
          "label": "Analytics Warehouse",
          "type": "storage",
          "state": "ANONYMIZED"
        },
        {
          "id": "cold_backup",
          "label": "S3 Cold Archive Snapshot",
          "type": "backup",
          "state": "RESTORE_RISK"
        }
      ],
      "links": [
        {
          "from": "source_portal",
          "to": "account_primary",
          "label": "Request Ingest"
        },
        {
          "from": "account_primary",
          "to": "replica_db",
          "label": "Replication Sync",
          "isZombie": true
        },
        {
          "from": "account_primary",
          "to": "search_index",
          "label": "Index Feed",
          "isZombie": true
        },
        {
          "from": "account_primary",
          "to": "analytics_store",
          "label": "Event Stream"
        },
        {
          "from": "account_primary",
          "to": "cold_backup",
          "label": "Daily Snapshot",
          "isZombie": false
        }
      ]
    }
  },
  "case_15": {
    "case_id": "case_15",
    "title": "CASE_15: Active Sync Bridge Re-creation Risk",
    "customer_name": "Luc\u00eda Torres",
    "status": "INCOMPLETE",
    "requested_at": "2026-08-21T12:00:00Z",
    "audit_at": "2026-09-15T12:00:00Z",
    "request_text": "I disconnected my account last week, but one of the integrations still seems active. Close the account completely and make sure it can no longer send my data to other systems.",
    "systems_checked": 3,
    "residual_copies": 1,
    "identities": {
      "primary_email": "lucia-torres@gmail.com",
      "historical_emails": [],
      "phone_numbers": [
        "+34 715 351 235",
        "+34 728 875 900"
      ],
      "account_ids": [
        "user_15",
        "account_15"
      ]
    },
    "steps": [
      {
        "step_no": 1,
        "phase": "FINDING",
        "system_id": "integration_service",
        "resource_id": "data_flow_9846",
        "operation": "REPORT_ACTIVE_DATA_FLOW",
        "state": "ACTIVE",
        "evidence_id": "evidence_01"
      },
      {
        "step_no": 2,
        "phase": "REMEDIATION",
        "system_id": "integration_service",
        "resource_id": "data_flow_9846",
        "operation": "DISABLE_DATA_FLOW",
        "state": "DISABLED",
        "evidence_id": ""
      },
      {
        "step_no": 3,
        "phase": "VERIFICATION",
        "system_id": "account_service",
        "resource_id": "account_4745",
        "operation": "VERIFY_RECORD_ABSENT",
        "state": "ABSENT",
        "evidence_id": ""
      },
      {
        "step_no": 4,
        "phase": "VERIFICATION",
        "system_id": "security_service",
        "resource_id": "audit_record_1596",
        "operation": "VERIFY_RECORD_PRESENT",
        "state": "PRESENT",
        "evidence_id": ""
      },
      {
        "step_no": 5,
        "phase": "VERIFICATION",
        "system_id": "integration_service",
        "resource_id": "data_flow_9846",
        "operation": "VERIFY_DATA_FLOW_DISABLED",
        "state": "DISABLED",
        "evidence_id": ""
      }
    ],
    "lineage": {
      "nodes": [
        {
          "id": "source_portal",
          "label": "Web / Mobile Client",
          "type": "source",
          "state": "DELETED"
        },
        {
          "id": "account_primary",
          "label": "Account Service (PostgreSQL)",
          "type": "storage",
          "state": "RESIDUAL"
        },
        {
          "id": "replica_db",
          "label": "Read Replica Cluster",
          "type": "replica",
          "state": "DESYNCED"
        },
        {
          "id": "search_index",
          "label": "Search Service (Elasticsearch)",
          "type": "replica",
          "state": "RESIDUAL"
        },
        {
          "id": "analytics_store",
          "label": "Analytics Warehouse",
          "type": "storage",
          "state": "ANONYMIZED"
        },
        {
          "id": "cold_backup",
          "label": "S3 Cold Archive Snapshot",
          "type": "backup",
          "state": "RESTORE_RISK"
        }
      ],
      "links": [
        {
          "from": "source_portal",
          "to": "account_primary",
          "label": "Request Ingest"
        },
        {
          "from": "account_primary",
          "to": "replica_db",
          "label": "Replication Sync",
          "isZombie": true
        },
        {
          "from": "account_primary",
          "to": "search_index",
          "label": "Index Feed",
          "isZombie": false
        },
        {
          "from": "account_primary",
          "to": "analytics_store",
          "label": "Event Stream"
        },
        {
          "from": "account_primary",
          "to": "cold_backup",
          "label": "Daily Snapshot",
          "isZombie": false
        }
      ]
    }
  },
  "case_18": {
    "case_id": "case_18",
    "title": "CASE_18: 14-Step Full Stack Governance Remediation",
    "customer_name": "Ren Mori",
    "status": "INCOMPLETE",
    "requested_at": "2026-09-06T11:00:00Z",
    "audit_at": "2026-09-26T11:00:00Z",
    "request_text": "I am asking you to remove my account and the personal information linked to it. Please review any identifiers connected to this account as part of the request. Please let me know once the request has been reviewed.",
    "systems_checked": 6,
    "residual_copies": 4,
    "identities": {
      "primary_email": "mori.ren@gmail.com",
      "historical_emails": [],
      "phone_numbers": [
        "+81 90 6947 3342",
        "+81 90 2367 3149"
      ],
      "account_ids": [
        "user_50",
        "account_50"
      ]
    },
    "steps": [
      {
        "step_no": 1,
        "phase": "FINDING",
        "system_id": "search_service",
        "resource_id": "search_4013",
        "operation": "REPORT_REMAINING_RECORD",
        "state": "PRESENT",
        "evidence_id": "evidence_94"
      },
      {
        "step_no": 2,
        "phase": "FINDING",
        "system_id": "analytics_platform",
        "resource_id": "analytics_037",
        "operation": "REPORT_EXPOSED_PII",
        "state": "PRESENT",
        "evidence_id": "evidence_94"
      },
      {
        "step_no": 3,
        "phase": "FINDING",
        "system_id": "support_platform",
        "resource_id": "support_5569",
        "operation": "REPORT_EXPOSED_PII",
        "state": "PRESENT",
        "evidence_id": "evidence_94"
      },
      {
        "step_no": 4,
        "phase": "FINDING",
        "system_id": "integration_service",
        "resource_id": "data_flow_4890",
        "operation": "REPORT_ACTIVE_DATA_FLOW",
        "state": "ACTIVE",
        "evidence_id": "evidence_94"
      },
      {
        "step_no": 5,
        "phase": "REMEDIATION",
        "system_id": "integration_service",
        "resource_id": "data_flow_4890",
        "operation": "DISABLE_DATA_FLOW",
        "state": "DISABLED",
        "evidence_id": ""
      },
      {
        "step_no": 6,
        "phase": "REMEDIATION",
        "system_id": "search_service",
        "resource_id": "search_4013",
        "operation": "DELETE_RECORD",
        "state": "ABSENT",
        "evidence_id": ""
      },
      {
        "step_no": 7,
        "phase": "REMEDIATION",
        "system_id": "support_platform",
        "resource_id": "support_5569",
        "operation": "REDACT_RECORD",
        "state": "REDACTED",
        "evidence_id": ""
      },
      {
        "step_no": 8,
        "phase": "REMEDIATION",
        "system_id": "analytics_platform",
        "resource_id": "analytics_037",
        "operation": "ANONYMIZE_RECORD",
        "state": "ANONYMIZED",
        "evidence_id": ""
      },
      {
        "step_no": 9,
        "phase": "VERIFICATION",
        "system_id": "account_service",
        "resource_id": "account_5521",
        "operation": "VERIFY_RECORD_ABSENT",
        "state": "ABSENT",
        "evidence_id": ""
      },
      {
        "step_no": 10,
        "phase": "VERIFICATION",
        "system_id": "search_service",
        "resource_id": "search_4013",
        "operation": "VERIFY_RECORD_ABSENT",
        "state": "ABSENT",
        "evidence_id": ""
      },
      {
        "step_no": 11,
        "phase": "VERIFICATION",
        "system_id": "security_service",
        "resource_id": "audit_record_6645",
        "operation": "VERIFY_RECORD_PRESENT",
        "state": "PRESENT",
        "evidence_id": ""
      },
      {
        "step_no": 12,
        "phase": "VERIFICATION",
        "system_id": "support_platform",
        "resource_id": "support_5569",
        "operation": "VERIFY_RECORD_REDACTED",
        "state": "REDACTED",
        "evidence_id": ""
      },
      {
        "step_no": 13,
        "phase": "VERIFICATION",
        "system_id": "analytics_platform",
        "resource_id": "analytics_037",
        "operation": "VERIFY_RECORD_ANONYMIZED",
        "state": "ANONYMIZED",
        "evidence_id": ""
      },
      {
        "step_no": 14,
        "phase": "VERIFICATION",
        "system_id": "integration_service",
        "resource_id": "data_flow_4890",
        "operation": "VERIFY_DATA_FLOW_DISABLED",
        "state": "DISABLED",
        "evidence_id": ""
      }
    ],
    "lineage": {
      "nodes": [
        {
          "id": "source_portal",
          "label": "Web / Mobile Client",
          "type": "source",
          "state": "DELETED"
        },
        {
          "id": "account_primary",
          "label": "Account Service (PostgreSQL)",
          "type": "storage",
          "state": "RESIDUAL"
        },
        {
          "id": "replica_db",
          "label": "Read Replica Cluster",
          "type": "replica",
          "state": "DESYNCED"
        },
        {
          "id": "search_index",
          "label": "Search Service (Elasticsearch)",
          "type": "replica",
          "state": "RESIDUAL"
        },
        {
          "id": "analytics_store",
          "label": "Analytics Warehouse",
          "type": "storage",
          "state": "ANONYMIZED"
        },
        {
          "id": "cold_backup",
          "label": "S3 Cold Archive Snapshot",
          "type": "backup",
          "state": "RESTORE_RISK"
        }
      ],
      "links": [
        {
          "from": "source_portal",
          "to": "account_primary",
          "label": "Request Ingest"
        },
        {
          "from": "account_primary",
          "to": "replica_db",
          "label": "Replication Sync",
          "isZombie": true
        },
        {
          "from": "account_primary",
          "to": "search_index",
          "label": "Index Feed",
          "isZombie": true
        },
        {
          "from": "account_primary",
          "to": "analytics_store",
          "label": "Event Stream"
        },
        {
          "from": "account_primary",
          "to": "cold_backup",
          "label": "Daily Snapshot",
          "isZombie": false
        }
      ]
    }
  },
  "case_26": {
    "case_id": "case_26",
    "title": "CASE_26: 6-System Complete Forensic Verification",
    "customer_name": "Mariana Almeida",
    "status": "COMPLETE",
    "requested_at": "2026-08-30T12:00:00Z",
    "audit_at": "2026-09-15T12:00:00Z",
    "request_text": "I found an old report saying my account still existed. Please check the latest state and confirm that the profile is gone and that remaining records cannot identify me.",
    "systems_checked": 6,
    "residual_copies": 0,
    "identities": {
      "primary_email": "almeida.mariana@gmail.com",
      "historical_emails": [],
      "phone_numbers": [
        "+55 21 90180-9087"
      ],
      "account_ids": [
        "user_26",
        "account_26"
      ]
    },
    "steps": [
      {
        "step_no": 1,
        "phase": "VERIFICATION",
        "system_id": "account_service",
        "resource_id": "account_5684",
        "operation": "VERIFY_RECORD_ABSENT",
        "state": "ABSENT",
        "evidence_id": "evidence_92"
      },
      {
        "step_no": 2,
        "phase": "VERIFICATION",
        "system_id": "security_service",
        "resource_id": "audit_record_5416",
        "operation": "VERIFY_RECORD_PRESENT",
        "state": "PRESENT",
        "evidence_id": "evidence_92"
      },
      {
        "step_no": 3,
        "phase": "VERIFICATION",
        "system_id": "support_platform",
        "resource_id": "support_4715",
        "operation": "VERIFY_RECORD_REDACTED",
        "state": "REDACTED",
        "evidence_id": "evidence_92"
      },
      {
        "step_no": 4,
        "phase": "VERIFICATION",
        "system_id": "analytics_platform",
        "resource_id": "analytics_4566",
        "operation": "VERIFY_RECORD_ANONYMIZED",
        "state": "ANONYMIZED",
        "evidence_id": "evidence_92"
      },
      {
        "step_no": 5,
        "phase": "VERIFICATION",
        "system_id": "integration_service",
        "resource_id": "data_flow_6244",
        "operation": "VERIFY_DATA_FLOW_DISABLED",
        "state": "DISABLED",
        "evidence_id": "evidence_92"
      },
      {
        "step_no": 6,
        "phase": "VERIFICATION",
        "system_id": "backup_service",
        "resource_id": "backup_3120",
        "operation": "VERIFY_RESTORE_BLOCKED",
        "state": "BLOCKED",
        "evidence_id": "evidence_92"
      }
    ],
    "lineage": {
      "nodes": [
        {
          "id": "source_portal",
          "label": "Web / Mobile Client",
          "type": "source",
          "state": "DELETED"
        },
        {
          "id": "account_primary",
          "label": "Account Service (PostgreSQL)",
          "type": "storage",
          "state": "DELETED"
        },
        {
          "id": "replica_db",
          "label": "Read Replica Cluster",
          "type": "replica",
          "state": "DELETED"
        },
        {
          "id": "search_index",
          "label": "Search Service (Elasticsearch)",
          "type": "replica",
          "state": "DELETED"
        },
        {
          "id": "analytics_store",
          "label": "Analytics Warehouse",
          "type": "storage",
          "state": "ANONYMIZED"
        },
        {
          "id": "cold_backup",
          "label": "S3 Cold Archive Snapshot",
          "type": "backup",
          "state": "BLOCKED"
        }
      ],
      "links": [
        {
          "from": "source_portal",
          "to": "account_primary",
          "label": "Request Ingest"
        },
        {
          "from": "account_primary",
          "to": "replica_db",
          "label": "Replication Sync",
          "isZombie": false
        },
        {
          "from": "account_primary",
          "to": "search_index",
          "label": "Index Feed",
          "isZombie": false
        },
        {
          "from": "account_primary",
          "to": "analytics_store",
          "label": "Event Stream"
        },
        {
          "from": "account_primary",
          "to": "cold_backup",
          "label": "Daily Snapshot",
          "isZombie": true
        }
      ]
    }
  },
  "case_31": {
    "case_id": "case_31",
    "title": "CASE_31: Compliant Redacted Account Tombstone",
    "customer_name": "Amara Eze",
    "status": "COMPLETE",
    "requested_at": "2026-09-04T12:00:00Z",
    "audit_at": "2026-09-15T12:00:00Z",
    "request_text": "I no longer need this account. Please remove my name and contact details, but keeping an internal deleted-account reference is fine if other required records still depend on it.",
    "systems_checked": 3,
    "residual_copies": 0,
    "identities": {
      "primary_email": "a.eze08@gmail.com",
      "historical_emails": [],
      "phone_numbers": [
        "+234 803 052 7943"
      ],
      "account_ids": [
        "user_541",
        "account_541"
      ]
    },
    "steps": [
      {
        "step_no": 1,
        "phase": "VERIFICATION",
        "system_id": "account_service",
        "resource_id": "account_4857",
        "operation": "VERIFY_RECORD_ABSENT",
        "state": "ABSENT",
        "evidence_id": "evidence_51"
      },
      {
        "step_no": 2,
        "phase": "VERIFICATION",
        "system_id": "security_service",
        "resource_id": "audit_record_6909",
        "operation": "VERIFY_RECORD_PRESENT",
        "state": "PRESENT",
        "evidence_id": "evidence_51"
      },
      {
        "step_no": 3,
        "phase": "VERIFICATION",
        "system_id": "identity_service",
        "resource_id": "tombstone_440",
        "operation": "VERIFY_RECORD_REDACTED",
        "state": "REDACTED",
        "evidence_id": "evidence_51"
      }
    ],
    "lineage": {
      "nodes": [
        {
          "id": "source_portal",
          "label": "Web / Mobile Client",
          "type": "source",
          "state": "DELETED"
        },
        {
          "id": "account_primary",
          "label": "Account Service (PostgreSQL)",
          "type": "storage",
          "state": "DELETED"
        },
        {
          "id": "replica_db",
          "label": "Read Replica Cluster",
          "type": "replica",
          "state": "DELETED"
        },
        {
          "id": "search_index",
          "label": "Search Service (Elasticsearch)",
          "type": "replica",
          "state": "DELETED"
        },
        {
          "id": "analytics_store",
          "label": "Analytics Warehouse",
          "type": "storage",
          "state": "ANONYMIZED"
        },
        {
          "id": "cold_backup",
          "label": "S3 Cold Archive Snapshot",
          "type": "backup",
          "state": "BLOCKED"
        }
      ],
      "links": [
        {
          "from": "source_portal",
          "to": "account_primary",
          "label": "Request Ingest"
        },
        {
          "from": "account_primary",
          "to": "replica_db",
          "label": "Replication Sync",
          "isZombie": false
        },
        {
          "from": "account_primary",
          "to": "search_index",
          "label": "Index Feed",
          "isZombie": false
        },
        {
          "from": "account_primary",
          "to": "analytics_store",
          "label": "Event Stream"
        },
        {
          "from": "account_primary",
          "to": "cold_backup",
          "label": "Daily Snapshot",
          "isZombie": false
        }
      ]
    }
  },
  "case_32": {
    "case_id": "case_32",
    "title": "CASE_32: Tombstone Direct PII Exposure",
    "customer_name": "Kofi Addo",
    "status": "INCOMPLETE",
    "requested_at": "2026-09-03T12:00:00Z",
    "audit_at": "2026-09-15T12:00:00Z",
    "request_text": "The account itself is gone, but an internal deleted-account record still shows my personal details. Please keep only the reference needed for retained records and remove the rest.",
    "systems_checked": 3,
    "residual_copies": 1,
    "identities": {
      "primary_email": "addo.kofi@gmail.com",
      "historical_emails": [],
      "phone_numbers": [
        "+233 24 991 1328"
      ],
      "account_ids": [
        "user_542",
        "account_542"
      ]
    },
    "steps": [
      {
        "step_no": 1,
        "phase": "FINDING",
        "system_id": "identity_service",
        "resource_id": "tombstone_9178",
        "operation": "REPORT_EXPOSED_PII",
        "state": "PRESENT",
        "evidence_id": "evidence_51"
      },
      {
        "step_no": 2,
        "phase": "REMEDIATION",
        "system_id": "identity_service",
        "resource_id": "tombstone_9178",
        "operation": "REDACT_RECORD",
        "state": "REDACTED",
        "evidence_id": ""
      },
      {
        "step_no": 3,
        "phase": "VERIFICATION",
        "system_id": "account_service",
        "resource_id": "account_8858",
        "operation": "VERIFY_RECORD_ABSENT",
        "state": "ABSENT",
        "evidence_id": ""
      },
      {
        "step_no": 4,
        "phase": "VERIFICATION",
        "system_id": "security_service",
        "resource_id": "audit_record_7068",
        "operation": "VERIFY_RECORD_PRESENT",
        "state": "PRESENT",
        "evidence_id": ""
      },
      {
        "step_no": 5,
        "phase": "VERIFICATION",
        "system_id": "identity_service",
        "resource_id": "tombstone_9178",
        "operation": "VERIFY_RECORD_REDACTED",
        "state": "REDACTED",
        "evidence_id": ""
      }
    ],
    "lineage": {
      "nodes": [
        {
          "id": "source_portal",
          "label": "Web / Mobile Client",
          "type": "source",
          "state": "DELETED"
        },
        {
          "id": "account_primary",
          "label": "Account Service (PostgreSQL)",
          "type": "storage",
          "state": "RESIDUAL"
        },
        {
          "id": "replica_db",
          "label": "Read Replica Cluster",
          "type": "replica",
          "state": "DESYNCED"
        },
        {
          "id": "search_index",
          "label": "Search Service (Elasticsearch)",
          "type": "replica",
          "state": "RESIDUAL"
        },
        {
          "id": "analytics_store",
          "label": "Analytics Warehouse",
          "type": "storage",
          "state": "ANONYMIZED"
        },
        {
          "id": "cold_backup",
          "label": "S3 Cold Archive Snapshot",
          "type": "backup",
          "state": "RESTORE_RISK"
        }
      ],
      "links": [
        {
          "from": "source_portal",
          "to": "account_primary",
          "label": "Request Ingest"
        },
        {
          "from": "account_primary",
          "to": "replica_db",
          "label": "Replication Sync",
          "isZombie": true
        },
        {
          "from": "account_primary",
          "to": "search_index",
          "label": "Index Feed",
          "isZombie": false
        },
        {
          "from": "account_primary",
          "to": "analytics_store",
          "label": "Event Stream"
        },
        {
          "from": "account_primary",
          "to": "cold_backup",
          "label": "Daily Snapshot",
          "isZombie": false
        }
      ]
    }
  },
  "case_533": {
    "case_id": "case_533",
    "title": "CASE_533: Right of Access / Data Export Only",
    "customer_name": "Hanna Lindstrom",
    "status": "NOT_APPLICABLE",
    "requested_at": "2026-09-20T10:15:00Z",
    "audit_at": "2026-09-22T12:00:00Z",
    "request_text": "I would like to receive a complete export copy of all data held on my profile. Please do not delete or close my account, I just need the backup file.",
    "systems_checked": 6,
    "residual_copies": 0,
    "identities": {
      "primary_email": "hanna.lindstrom@outlook.com",
      "historical_emails": [
        "hanna.l@nordic.se"
      ],
      "phone_numbers": [
        "+46 70 882 11 39"
      ],
      "account_ids": [
        "user_482",
        "account_482"
      ]
    },
    "steps": [],
    "lineage": {
      "nodes": [
        {
          "id": "portal",
          "label": "Self-Service Portal",
          "type": "source",
          "state": "ACTIVE"
        }
      ],
      "links": []
    }
  }
};
