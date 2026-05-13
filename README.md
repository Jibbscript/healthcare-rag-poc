# Healthcare Benefits RAG POC

Runnable commands first:

```bash
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test
pnpm eval:local
pnpm demo-local
pnpm cdk:synth:smoke && pnpm cdk:nag
```

## Profiles

- `local`: OSS/self-hosted analogs (MinIO, DynamoDB Local, Postgres + pgvector, Qdrant, Ollama, Presidio) plus deterministic fixture providers for CI/offline runs.
- `aws-smoke` (default): private, cheap AWS shape with S3, DynamoDB, Lambda, HTTP API, gateway endpoints, and exactly one Bedrock Runtime interface endpoint. It intentionally excludes NAT Gateway, OpenSearch, Aurora, Fargate, Bedrock Knowledge Bases, and multi-AZ endpoint expansion.
- `aws-full`: explicit production extension matrix. Expensive constructs are disabled unless their feature flags are deliberately enabled.

This is a no-PHI demo. It uses public/fixture benefits text and fake PII examples only. It is HIPAA-hygienic in design but is not a compliance certification.

## Local quickstart

```bash
pnpm demo-local
pnpm api-local
curl -s http://127.0.0.1:8787/chat \
  -H 'content-type: application/json' \
  -d '{"sessionId":"demo","message":"What is the urgent care copay?","profile":"local"}' | jq
```

Optional Docker stack:

```bash
make demo-local-up
pnpm tsx scripts/wait-local.ts
make demo-local-down
# Destructive local cleanup only:
make demo-local-reset
```

## AWS smoke

```bash
pnpm cdk:synth:smoke
pnpm cdk:nag
scripts/deploy-smoke.sh --dry-run
```

Destroy after any real smoke demo to avoid endpoint-hour charges:

```bash
scripts/destroy-smoke.sh --dry-run
```

## Evidence map

- Core ports and schemas: `packages/core/src`
- Local adapters: `packages/adapters-local/src`
- AWS adapters: `packages/adapters-aws/src`
- API handlers: `apps/api/src`
- CDK smoke/full constructs: `infra/cdk/lib`
- Evaluation cases and reports: `evals/`
- Architecture dossier and runbooks: `docs/`

See `docs/runbooks/final-verification.md` and `docs/interview-defense.md` for the complete checklist and defense notes.
