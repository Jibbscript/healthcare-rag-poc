# Healthcare Benefits RAG POC

Runnable commands first:

```bash
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test
pnpm eval:local
pnpm demo-local
pnpm api-local
pnpm web:dev
GITHUB_PAGES=true pnpm web:build
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

Local web demo:

```bash
pnpm api-local
pnpm web:dev
```

The Svelte demo console defaults to fixture playback when no API base URL is configured. Hosted GitHub Pages builds use the static fixture path and do not call `/chat` or expose smoke API keys. Select `Local API` from `Demo target` when running `pnpm api-local` plus `pnpm web:dev`.

Static Pages preview:

```bash
GITHUB_PAGES=true pnpm web:build
pnpm --filter @healthcare-rag/web exec vite preview --host 127.0.0.1 --port 4173 --base /healthcare-rag-poc/
pnpm demo:capture -- --mode fixture-demo --base-url http://127.0.0.1:4173/healthcare-rag-poc/ --out demo-artifacts/fixture-demo
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
DRY_RUN=true scripts/aws-smoke-run.sh
```

Real smoke proof is run by `scripts/aws-smoke-run.sh` or the manual `Demo capture` GitHub Actions workflow, not from the hosted browser. Real smoke deploys require a pre-existing artifact bucket, a demo API key, region, and typed paid-resource confirmation:

```bash
export AWS_REGION=us-east-1
export AWS_SMOKE_ARTIFACT_BUCKET=<existing-artifact-bucket>
export SMOKE_API_KEY=<shared-demo-key-at-least-16-chars>
export CONFIRM_AWS_SMOKE_RUN=I_UNDERSTAND_THIS_CREATES_PAID_SMOKE_RESOURCES
export DRY_RUN=false
```

Destroy after any real smoke demo to avoid endpoint-hour charges:

```bash
export AWS_REGION=us-east-1
CONFIRM_AWS_SMOKE_DESTROY=destroy-smoke scripts/destroy-smoke.sh
```

## Evidence map

- Core ports and schemas: `packages/core/src`
- Local adapters: `packages/adapters-local/src`
- AWS adapters: `packages/adapters-aws/src`
- API handlers: `apps/api/src`
- CDK smoke/full constructs: `infra/cdk/lib`
- Evaluation cases and reports: `evals/`
- Architecture dossier and runbooks: `docs/`

See `docs/runbooks/final-verification.md` and `docs/key-tech-decisions.md` for the complete checklist and defense notes.
