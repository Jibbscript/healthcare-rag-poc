# Aurora Serverless v2 pgvector disabled by default

Status: accepted for smoke demo.

Context: the smoke profile must remain cheap and private while demonstrating the extension path.

Decision: keep this construct behind an explicit `aws-full` feature flag and exclude it from `aws-smoke`.

Consequences: the demo uses in-memory/S3-backed retrieval and single-AZ endpoint placement. Production can enable the construct when scale, resiliency, or managed operations justify the cost.

Enabling criteria: measured corpus/query volume, cost approval, security review, and updated eval/rollback runbook.

Flag/construct: `infra/cdk/lib/constructs/prod/aurora-pgvector.ts`.

Interview defense: this is deliberate cost governance, not missing architecture.
