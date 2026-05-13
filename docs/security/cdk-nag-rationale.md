# cdk-nag rationale

No blanket suppressions are allowed. Current scoped rationales are in `infra/cdk/lib/nag-suppressions.ts` for Bedrock model ARN variability and Lambda log stream wildcard behavior. Each reason is tied to a demo constraint and must be revisited before production.
