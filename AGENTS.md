# Healthcare RAG POC Agent Contract

This repository implements the `atomic-work-units-complete.md` plan. Keep it production-shaped but cheap by default.

## Invariants

- Default profile: `aws-smoke`.
- Local profile: `local` using OSS/self-hosted analogs.
- Expensive production constructs must remain behind explicit feature flags and must not deploy by default.
- Do not log raw prompts, raw answers, PHI, or PII. Store redacted text and hashes only.
- `aws-smoke` must not include NAT Gateway, OpenSearch, Aurora/RDS, Fargate/ECS services, Bedrock Knowledge Bases, or multi-AZ endpoint expansion.
- `aws-smoke` may include exactly one paid Bedrock interface endpoint: `bedrock-runtime`.
- S3 and DynamoDB access from VPC uses gateway endpoints.
- Lambda runtime target is `nodejs22.x`.

## Verification

Run the maximal relevant subset:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm eval:local
pnpm cdk:synth:smoke
pnpm cdk:nag
```

## Local workflow

Use fixture providers for CI/offline tests. Docker-backed services are available through `make demo-local-up` when a fuller local stack is needed.
