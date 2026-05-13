# Cross-cutting concerns

- Privacy: input guardrails redact fake PII; audit traces store hashes and redacted text only.
- Security: CMK encryption, blocked public S3 access, least-privilege IAM statements, private Bedrock runtime endpoint, gateway endpoints for S3/DynamoDB.
- Observability: structured trace ids, 7-day log retention, CloudWatch EMF via stdout only.
- Cost: smoke forbids NAT, OpenSearch, Aurora, Fargate, Bedrock KB, and multi-AZ endpoint expansion. The only fixed paid construct is the Bedrock Runtime interface endpoint.

Verification: `pnpm lint`, `pnpm test`, `pnpm cdk:synth:smoke`, `pnpm cdk:nag`, and `scripts/check-smoke-cost-shape.ts`.
