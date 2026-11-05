# Synthetic Complete Deletion Dataset

All records in this package are fictional and intended only for testing/demo purposes.

## Contents
Eight CSV files matching the eight Silver entities:
- fact_deletion_request.csv — 8 deletion requests
- dim_customer.csv — 8 customers
- dim_identity_history.csv — 2 historical email changes
- fact_resource.csv — 24 resources (3 per customer)
- fact_activity.csv — 24 successful DELETE activities
- fact_evidence.csv — 24 deletion confirmation evidence references
- dim_deletion_policy.csv — 3 DELETE policies
- fact_case_data_link.csv — 24 links connecting each case, customer, resource, activity, evidence and policy

## Expected demo result
All 8 cases should be classifiable as COMPLETE if the audit logic requires:
1. Every resource is linked to the correct customer and case.
2. Every resource has a successful DELETE activity before its audit cutoff.
3. Every resource has a corresponding deletion-confirmation evidence record captured before its audit cutoff.
4. The matching policy requires DELETE.

The evidence files are references/placeholders; the CSVs contain the synthetic evidence metadata. Do not present these as real-world proof of deletion.

Dates are ISO-8601 UTC strings. IDs are synthetic and stable.
