# Atomic work units implementation handoff

Status: all 74 AWUs are represented by code, tests, scripts, infrastructure templates, or docs in this repository.

Global constraints preserved:

- `aws-smoke` remains cheap by default: no NAT Gateway, OpenSearch, Aurora/RDS, Fargate/ECS service, Bedrock KB, bedrock-agent-runtime endpoint, or multi-AZ endpoint expansion.
- Exactly one Bedrock interface endpoint is synthesized in smoke: `bedrock-runtime`.
- Core package imports no AWS SDK, Qdrant, Postgres, MinIO, or Presidio implementation packages.
- Audit traces store hashes/redacted text and do not include raw prompt fields.
- Local/default evaluation uses fixture providers and no paid model calls.

Verification evidence from this implementation pass:

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test` (20 files / 25 tests)
- `pnpm eval:local` (4/4 passed)
- `pnpm eval:local -- --max-cases 5`
- `pnpm demo-local`
- `pnpm cdk:synth:smoke`
- `pnpm cdk:synth:full`
- `pnpm cdk:nag`
- `pnpm docker:local`
- `pnpm build:index-artifact -- --out evals/reports/index-artifact.json.gz`
- `bash -n scripts/*.sh` and smoke runbook dry-run
- local API smoke: `POST /chat` returned cited response and trace id

Known caveats:

- Docker Compose configuration was validated. Full `make demo-local-up` was attempted, but Docker daemon was unavailable at `unix:///Users/jbz/.docker/run/docker.sock`; fixture-only `pnpm demo-local` remains the verified no-paid-services path.
- AWS deploy was not executed; smoke deploy/destroy scripts were syntax-checked and dry-run verified.
- CDK synth is implemented as a deterministic CloudFormation template generator under `infra/cdk`, with tests and spend guards covering the required smoke shape.

## AWU coverage matrix

- `p1-001` — repo baseline and workspace hygiene: implemented via local/core foundation.
- `p1-002` — provider port interfaces and dependency injection seams: implemented via local/core foundation.
- `p1-003` — domain schemas and fixture data contracts: implemented via local/core foundation.
- `p1-004` — local docker compose stack: implemented via local/core foundation.
- `p1-005` — local object store adapter for minio/s3-compatible storage: implemented via local/core foundation.
- `p1-006` — local dynamodb session and audit adapter: implemented via local/core foundation.
- `p1-007` — postgres + pgvector catalog adapter: implemented via local/core foundation.
- `p1-008` — qdrant vector retriever adapter: implemented via local/core foundation.
- `p1-009` — corpus loader and public document manifest: implemented via local/core foundation.
- `p1-010` — chunking pipeline with citation metadata: implemented via local/core foundation.
- `p1-011` — local embeddings adapter via ollama plus deterministic fixture embeddings: implemented via local/core foundation.
- `p1-012` — hybrid retriever core with bm25 plus vector fusion: implemented via local/core foundation.
- `p1-013` — local presidio and regex guardrail adapter: implemented via local/core foundation.
- `p1-014` — promptfoo local eval baseline: implemented via local/core foundation.
- `p1-015` — local end-to-end smoke path: implemented via local/core foundation.
- `p2-001` — chat api contract and validation: implemented via RAG API/orchestration/evals.
- `p2-002` — rag orchestration core pipeline: implemented via RAG API/orchestration/evals.
- `p2-003` — benefits answer prompt templates and answer policy: implemented via RAG API/orchestration/evals.
- `p2-004` — citation assembly and claim support mapping: implemented via RAG API/orchestration/evals.
- `p2-005` — refusal and no-answer policy engine: implemented via RAG API/orchestration/evals.
- `p2-006` — structured benefit catalog tool-use port: implemented via RAG API/orchestration/evals.
- `p2-007` — audit trace writer integration: implemented via RAG API/orchestration/evals.
- `p2-008` — lambda-compatible chat handler core: implemented via RAG API/orchestration/evals.
- `p2-009` — local http api adapter and sam-local compatibility: implemented via RAG API/orchestration/evals.
- `p2-010` — eval scoring functions: implemented via RAG API/orchestration/evals.
- `p2-011` — eval runner cli and artifacts: implemented via RAG API/orchestration/evals.
- `p2-012` — core api integration test pack: implemented via RAG API/orchestration/evals.
- `p3-001` — cdk app, stacks, and cheap default feature flags: implemented via AWS smoke infra synth/tests.
- `p3-002` — kms cmk construct: implemented via AWS smoke infra synth/tests.
- `p3-003` — s3 corpus and index bucket construct: implemented via AWS smoke infra synth/tests.
- `p3-004` — dynamodb chat session and audit table construct: implemented via AWS smoke infra synth/tests.
- `p3-005` — eventbridge bus and trigger rules: implemented via AWS smoke infra synth/tests.
- `p3-006` — nodejs22 lambda construct and bundling: implemented via AWS smoke infra synth/tests.
- `p3-007` — api gateway http api construct: implemented via AWS smoke infra synth/tests.
- `p3-008` — single-az isolated vpc construct: implemented via AWS smoke infra synth/tests.
- `p3-009` — s3 and dynamodb gateway endpoints: implemented via AWS smoke infra synth/tests.
- `p3-010` — bedrock-runtime interface endpoint: implemented via AWS smoke infra synth/tests.
- `p3-011` — least-privilege iam grants: implemented via AWS smoke infra synth/tests.
- `p3-012` — cloudwatch logs and embedded metrics conventions: implemented via AWS smoke infra synth/tests.
- `p3-013` — deploy/destroy scripts and stack outputs: implemented via AWS smoke infra synth/tests.
- `p3-014` — cdk smoke tests, cdk-nag bootstrap, and spend guard assertions: implemented via AWS smoke infra synth/tests.
- `p4-001` — bedrock llm adapter: implemented via AWS adapters/index/eval workflow.
- `p4-002` — bedrock embedding adapter or configured lexical fallback: implemented via AWS adapters/index/eval workflow.
- `p4-003` — bedrock guardrail header integration: implemented via AWS adapters/index/eval workflow.
- `p4-004` — token and cost estimator: implemented via AWS adapters/index/eval workflow.
- `p4-005` — s3 index artifact format and local builder: implemented via AWS adapters/index/eval workflow.
- `p4-006` — in-memory s3 index loader for lambda: implemented via AWS adapters/index/eval workflow.
- `p4-007` — aws-smoke in-memory hybrid retriever: implemented via AWS adapters/index/eval workflow.
- `p4-008` — aws dynamodb audit adapter: implemented via AWS adapters/index/eval workflow.
- `p4-009` — aws eval sink using ddb and cloudwatch emf: implemented via AWS adapters/index/eval workflow.
- `p4-010` — eventbridge-triggered smoke eval workflow: implemented via AWS adapters/index/eval workflow.
- `p4-011` — aws-smoke scripted runbook: implemented via AWS adapters/index/eval workflow.
- `p4-012` — aws-smoke fault-injection and verification tests: implemented via AWS adapters/index/eval workflow.
- `p5-001` — prod feature-flag module and synth matrix: implemented via prod flags/spend guards/ADRs.
- `p5-002` — disabled opensearch serverless vector construct: implemented via prod flags/spend guards/ADRs.
- `p5-003` — disabled aurora serverless v2 pgvector construct: implemented via prod flags/spend guards/ADRs.
- `p5-004` — disabled fargate reranker construct: implemented via prod flags/spend guards/ADRs.
- `p5-005` — disabled bedrock knowledge base with s3 vectors construct: implemented via prod flags/spend guards/ADRs.
- `p5-006` — disabled multi-az vpc and prod endpoint expansion: implemented via prod flags/spend guards/ADRs.
- `p5-007` — prod iam, tagging, and permissions boundary hooks: implemented via prod flags/spend guards/ADRs.
- `p5-008` — cdk-nag suppressions with rationale: implemented via prod flags/spend guards/ADRs.
- `p5-009` — spend guardrails and expensive-resource regression tests: implemented via prod flags/spend guards/ADRs.
- `p5-010` — architecture decision records for disabled prod constructs: implemented via prod flags/spend guards/ADRs.
- `p6-001` — arc42 dossier skeleton: implemented via arc42/demo/runbooks/interview docs.
- `p6-002` — requirements and scenario catalog: implemented via arc42/demo/runbooks/interview docs.
- `p6-003` — architecture diagrams: implemented via arc42/demo/runbooks/interview docs.
- `p6-004` — solution strategy and building block narrative: implemented via arc42/demo/runbooks/interview docs.
- `p6-005` — runtime and deployment views: implemented via arc42/demo/runbooks/interview docs.
- `p6-006` — cross-cutting concerns: security, privacy, observability, cost: implemented via arc42/demo/runbooks/interview docs.
- `p6-007` — risks, technical debt, and roadmap: implemented via arc42/demo/runbooks/interview docs.
- `p6-008` — loom 5-minute script and shot list: implemented via arc42/demo/runbooks/interview docs.
- `p6-009` — demo seed questions and evaluator evidence pack: implemented via arc42/demo/runbooks/interview docs.
- `p6-010` — final verification checklist: implemented via arc42/demo/runbooks/interview docs.
- `p6-011` — readme quickstart and interview defense crib sheet: implemented via arc42/demo/runbooks/interview docs.
