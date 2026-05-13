# complete atomic work unit bundle


# shared contract for every atomic work unit

## project invariant

this project must stay prod-shaped but cheap by default.

- default profile: `aws-smoke`.
- local profile: `local` with oss/self-hosted analogs.
- expensive prod constructs exist behind feature flags and must not deploy by default.
- no raw prompt, answer, or pii logging.
- no nat gateway, opensearch, aurora, fargate, bedrock kb, or multi-az endpoints in `aws-smoke`.
- one paid bedrock interface endpoint max in `aws-smoke`: `bedrock-runtime`.
- s3 and dynamodb access from vpc uses gateway endpoints.
- lambda runtime target: `nodejs22.x` unless a specific work unit says otherwise.

## atomic work unit definition

an awu is mergeable when it has:

- clear branch name.
- no broad refactor outside listed files unless required to compile.
- unit/integration tests or a documented reason tests are not meaningful.
- no secrets committed.
- no spend-increasing default flags.
- handoff note summarizing files changed, commands run, and remaining risk.

## standard verification commands

run the maximal subset that applies to the touched surface:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm eval:local
pnpm cdk:synth:smoke
pnpm cdk:nag
```

## suggested codex agent taxonomy

- `explorer`: read-only codebase mapper. use before implementation or for dependency discovery.
- `worker`: implementation agent. owns one awu branch.
- `reviewer`: correctness/security/test review. no code changes unless explicitly asked.
- `docs_researcher`: verifies version-specific api behavior and docs.
- `security_reviewer`: pii, logging, iam, encryption, and guardrail review.
- `finops_reviewer`: checks that `aws-smoke` cannot accidentally deploy expensive resources.

## copy-paste parent orchestration prompt

```text
spawn one codex worker subagent per atomic work unit listed below, but only for units whose dependencies are already complete. each worker must use the branch name in the awu, touch only listed surfaces unless needed to compile, run the verification commands in the awu, and return a handoff note with changed files, tests run, risks, and follow-up blockers. keep max concurrency at 4-6. after workers finish, spawn reviewer and security_reviewer agents for the changed branches.
```


# phase 1 — local oss foundation atomic work units

provider interfaces, local docker compose, corpus ingest, qdrant + pgvector retrieval, ollama, presidio, and promptfoo.

## work units

## awu p1-001 — repo baseline and workspace hygiene

- agent: `worker`
- branch: `awu/p1-001-repo-baseline`
- depends on: `none`
- primary surfaces: `package.json, pnpm-workspace.yaml, tsconfig*.json, eslint/prettier/vitest configs, Makefile, AGENTS.md`

### do

- normalize monorepo layout for `apps/`, `packages/`, `infra/`, `evals/`, `scripts/`, and `docs/`.
- add or verify pnpm workspace wiring and shared tsconfig paths.
- add root scripts for lint, typecheck, test, eval:local, cdk:synth:smoke, and docker:local.
- add repo-level `AGENTS.md` with the cheap-by-default invariant and verification commands.

### acceptance criteria

- `pnpm lint`, `pnpm typecheck`, and `pnpm test` work or fail only because later packages are intentionally absent.
- root readme has a short local/aws-smoke profile explanation.
- no production dependency is added without a note in the handoff.

### verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test -- --runInBand || true if no tests exist yet`

### handoff artifact

- baseline scripts, repo map, and any intentionally stubbed commands.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p1-001 — repo baseline and workspace hygiene on branch `awu/p1-001-repo-baseline`. dependencies: none. primary surfaces: package.json, pnpm-workspace.yaml, tsconfig*.json, eslint/prettier/vitest configs, Makefile, AGENTS.md. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p1-002 — provider port interfaces and dependency injection seams

- agent: `worker`
- branch: `awu/p1-002-provider-ports`
- depends on: `p1-001`
- primary surfaces: `packages/core/src/ports/**, packages/core/src/config/**, packages/core/src/index.ts`

### do

- define strict typescript interfaces for object store, audit store, retriever, llm, embedding provider, guardrail, eval sink, clock, id generator, and logger.
- define provider config model for `local`, `aws-smoke`, and `aws-full`.
- add a small factory/registry abstraction that can resolve adapters by profile without importing implementation packages into core.

### acceptance criteria

- core package has zero aws sdk, qdrant, pg, minio, or presidio imports.
- ports use domain types, not vendor sdk types.
- dependency injection can be tested with fake providers.

### verification

- `unit tests for provider registry happy path and unknown provider failure.`
- `type-level compile check for each port.`

### handoff artifact

- list all port names and intentionally deferred adapter methods.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p1-002 — provider port interfaces and dependency injection seams on branch `awu/p1-002-provider-ports`. dependencies: p1-001. primary surfaces: packages/core/src/ports/**, packages/core/src/config/**, packages/core/src/index.ts. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p1-003 — domain schemas and fixture data contracts

- agent: `worker`
- branch: `awu/p1-003-domain-schemas`
- depends on: `p1-002`
- primary surfaces: `packages/core/src/domain/**, packages/test-fixtures/**`

### do

- create zod or equivalent schemas for document metadata, chunks, retrieval queries, retrieved chunks, citations, chat turns, guardrail decisions, audit traces, and eval results.
- create stable json fixtures for a tiny benefits corpus, retrieved chunks, refusals, and pii prompts.
- add schema parse helpers that return typed errors, not thrown vendor-shaped errors.

### acceptance criteria

- fixtures round-trip through schemas.
- audit trace schema includes no raw unredacted prompt field.
- chunk schema can represent doc id, page, section, character offsets, checksum, and source uri.

### verification

- `schema validation tests for valid/invalid fixtures.`
- `snapshot test for example audit trace shape.`

### handoff artifact

- schema paths and fixture ids.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p1-003 — domain schemas and fixture data contracts on branch `awu/p1-003-domain-schemas`. dependencies: p1-002. primary surfaces: packages/core/src/domain/**, packages/test-fixtures/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p1-004 — local docker compose stack

- agent: `worker`
- branch: `awu/p1-004-local-compose`
- depends on: `p1-001`
- primary surfaces: `deploy/docker-compose.local.yml, deploy/.env.local.example, scripts/wait-local.ts, Makefile`

### do

- define local services: minio, dynamodb-local, postgres with pgvector, qdrant, ollama, presidio analyzer, presidio anonymizer, and optional localstack.
- add healthchecks and persistent named volumes.
- wire ports and env vars into `.env.local.example`.
- add `make demo-local-up`, `make demo-local-down`, `make demo-local-reset`, and `make demo-local-logs`.

### acceptance criteria

- `docker compose -f deploy/docker-compose.local.yml config` succeeds.
- all core services expose health/readiness endpoints or equivalent probes.
- reset target deletes local volumes only after explicit target name, not on normal shutdown.

### verification

- `docker compose config`
- `make demo-local-up && scripts/wait-local.ts && make demo-local-down`

### handoff artifact

- service ports, default credentials, and known local resource requirements.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p1-004 — local docker compose stack on branch `awu/p1-004-local-compose`. dependencies: p1-001. primary surfaces: deploy/docker-compose.local.yml, deploy/.env.local.example, scripts/wait-local.ts, Makefile. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p1-005 — local object store adapter for minio/s3-compatible storage

- agent: `worker`
- branch: `awu/p1-005-minio-object-store`
- depends on: `p1-002,p1-004`
- primary surfaces: `packages/adapters-local/src/object-store/**, packages/adapters-local/test/**`

### do

- implement `ObjectStore` using aws sdk v3 s3 client pointed at minio endpoint with path-style addressing.
- add bucket bootstrap script for corpus, index, and eval artifacts.
- support get/put/list/head/delete for the subset required by ingest and index sync.

### acceptance criteria

- adapter works against minio in docker compose.
- adapter does not leak credentials into logs.
- errors normalize into core error types.

### verification

- `integration test creates bucket, writes object, reads object, lists prefix, deletes object.`
- `negative test for missing object.`

### handoff artifact

- env vars needed by local object store adapter.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p1-005 — local object store adapter for minio/s3-compatible storage on branch `awu/p1-005-minio-object-store`. dependencies: p1-002,p1-004. primary surfaces: packages/adapters-local/src/object-store/**, packages/adapters-local/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p1-006 — local dynamodb session and audit adapter

- agent: `worker`
- branch: `awu/p1-006-dynamodb-local-audit`
- depends on: `p1-002,p1-003,p1-004`
- primary surfaces: `packages/adapters-local/src/audit-store/**, scripts/bootstrap-ddb-local.ts, packages/adapters-local/test/**`

### do

- implement `AuditStore` and session persistence using dynamodb-local endpoint.
- create local tables with the same key design planned for aws: `pk`, `sk`, `gsi1pk`, `gsi1sk`, ttl if useful.
- add idempotent bootstrap script.

### acceptance criteria

- put/get/query session traces work locally.
- audit records store redacted inputs and hashes only.
- schema matches phase 3 ddb table plan.

### verification

- `integration test writes a session with multiple turns and queries chronological trace.`
- `ttl/gsi fields validated if present.`

### handoff artifact

- table names, key schema, and migration/bootstrap command.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p1-006 — local dynamodb session and audit adapter on branch `awu/p1-006-dynamodb-local-audit`. dependencies: p1-002,p1-003,p1-004. primary surfaces: packages/adapters-local/src/audit-store/**, scripts/bootstrap-ddb-local.ts, packages/adapters-local/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p1-007 — postgres + pgvector catalog adapter

- agent: `worker`
- branch: `awu/p1-007-pgvector-catalog`
- depends on: `p1-002,p1-004`
- primary surfaces: `packages/adapters-local/src/pgvector/**, db/migrations/**, packages/adapters-local/test/**`

### do

- create postgres schema for documents, chunks, embeddings, and optional structured benefits catalog.
- enable pgvector extension in migration.
- implement insert/query methods for metadata lookup and optional pgvector retrieval.

### acceptance criteria

- migration is idempotent on fresh local postgres.
- adapter can insert chunks with embeddings and query nearest neighbors.
- supports full-text search column or query path for hybrid retrieval experiments.

### verification

- `migration test against docker postgres.`
- `nearest-neighbor test with deterministic fixture vectors.`
- `metadata filter test by plan/doc id.`

### handoff artifact

- migration order and any pgvector dimension assumptions.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p1-007 — postgres + pgvector catalog adapter on branch `awu/p1-007-pgvector-catalog`. dependencies: p1-002,p1-004. primary surfaces: packages/adapters-local/src/pgvector/**, db/migrations/**, packages/adapters-local/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p1-008 — qdrant vector retriever adapter

- agent: `worker`
- branch: `awu/p1-008-qdrant-retriever`
- depends on: `p1-002,p1-003,p1-004`
- primary surfaces: `packages/adapters-local/src/qdrant/**, scripts/bootstrap-qdrant.ts, packages/adapters-local/test/**`

### do

- implement qdrant collection bootstrap with vector size from embedding config.
- implement upsert chunks with payload metadata.
- implement semantic top-k retrieval with metadata filters.

### acceptance criteria

- collection creation is idempotent.
- retrieval returns core `RetrievedChunk[]`, not qdrant sdk objects.
- payload contains doc id, page, section, chunk id, checksum, and source uri.

### verification

- `integration test upserts fixture points and retrieves expected chunk.`
- `filter test excludes wrong plan/doc.`
- `missing collection produces actionable error.`

### handoff artifact

- collection name, vector size, distance metric, and payload schema.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p1-008 — qdrant vector retriever adapter on branch `awu/p1-008-qdrant-retriever`. dependencies: p1-002,p1-003,p1-004. primary surfaces: packages/adapters-local/src/qdrant/**, scripts/bootstrap-qdrant.ts, packages/adapters-local/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p1-009 — corpus loader and public document manifest

- agent: `worker`
- branch: `awu/p1-009-corpus-loader`
- depends on: `p1-003,p1-005`
- primary surfaces: `corpus/manifest.yaml, scripts/ingest-corpus.ts, packages/core/src/ingest/**, packages/test-fixtures/corpus/**`

### do

- create a manifest format for public benefits/policy docs with doc id, plan id, url/file path, year, source label, and allowed demo usage notes.
- support local files first; remote download can be deferred or implemented as explicit opt-in.
- extract text from md/txt fixtures and leave pdf extraction as pluggable module if needed.

### acceptance criteria

- manifest validation fails fast for missing ids/year/source.
- loader returns normalized document records with stable checksums.
- no phi-like sample data is committed.

### verification

- `manifest schema tests.`
- `ingest fixture corpus into object store or local temp dir.`
- `checksum stability test.`

### handoff artifact

- manifest shape and extraction limitations.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p1-009 — corpus loader and public document manifest on branch `awu/p1-009-corpus-loader`. dependencies: p1-003,p1-005. primary surfaces: corpus/manifest.yaml, scripts/ingest-corpus.ts, packages/core/src/ingest/**, packages/test-fixtures/corpus/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p1-010 — chunking pipeline with citation metadata

- agent: `worker`
- branch: `awu/p1-010-chunking`
- depends on: `p1-003,p1-009`
- primary surfaces: `packages/core/src/chunking/**, packages/core/test/chunking/**`

### do

- implement deterministic chunking by section/page hints with token/char target and overlap.
- preserve citation anchors: doc id, source label, page, section heading, char offsets, chunk checksum.
- emit chunk jsonl suitable for qdrant, pgvector, and s3 in-memory index.

### acceptance criteria

- same input produces byte-identical chunk ids/checksums.
- chunk overlap never drops section/page metadata.
- chunks are small enough for lambda in-memory retrieval in smoke mode.

### verification

- `snapshot test for chunk ids and metadata.`
- `boundary test for section split and overlap.`
- `invalid empty doc produces clear error.`

### handoff artifact

- chosen chunk size/overlap and payer-grounded rationale.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p1-010 — chunking pipeline with citation metadata on branch `awu/p1-010-chunking`. dependencies: p1-003,p1-009. primary surfaces: packages/core/src/chunking/**, packages/core/test/chunking/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p1-011 — local embeddings adapter via ollama plus deterministic fixture embeddings

- agent: `worker`
- branch: `awu/p1-011-local-embeddings`
- depends on: `p1-002,p1-004`
- primary surfaces: `packages/adapters-local/src/embeddings/**, packages/test-fixtures/embeddings/**`

### do

- implement ollama embeddings adapter using `/api/embed`.
- add fixture embedding provider for deterministic ci/offline tests.
- normalize embedding dimensions and reject mismatches early.

### acceptance criteria

- ci can run without ollama by using fixture provider.
- local demo can use ollama when service is available.
- embedding provider emits model id and dimension metadata for audit/index artifacts.

### verification

- `unit tests for fixture provider.`
- `optional integration test gated by env var for ollama.`
- `dimension mismatch test.`

### handoff artifact

- default local embedding model and fallback behavior.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p1-011 — local embeddings adapter via ollama plus deterministic fixture embeddings on branch `awu/p1-011-local-embeddings`. dependencies: p1-002,p1-004. primary surfaces: packages/adapters-local/src/embeddings/**, packages/test-fixtures/embeddings/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p1-012 — hybrid retriever core with bm25 plus vector fusion

- agent: `worker`
- branch: `awu/p1-012-hybrid-retriever`
- depends on: `p1-003,p1-008,p1-011`
- primary surfaces: `packages/core/src/retrieval/**, packages/core/test/retrieval/**`

### do

- implement lexical bm25 over chunk text.
- compose lexical and vector retrievers through reciprocal rank fusion.
- add simple rerank heuristic using heading/doc/year/citation density features.

### acceptance criteria

- retriever returns top-k with component scores and fused score.
- works with fixture embeddings without external services.
- retrieval trace is serializable for audit.

### verification

- `fixture query retrieves expected chunk in top-k.`
- `rrf scoring deterministic.`
- `empty corpus returns no-answer signal instead of throwing.`

### handoff artifact

- fusion constants and TODOs for prod reranker.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p1-012 — hybrid retriever core with bm25 plus vector fusion on branch `awu/p1-012-hybrid-retriever`. dependencies: p1-003,p1-008,p1-011. primary surfaces: packages/core/src/retrieval/**, packages/core/test/retrieval/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p1-013 — local presidio and regex guardrail adapter

- agent: `security_reviewer`
- branch: `awu/p1-013-local-guardrails`
- depends on: `p1-002,p1-003,p1-004`
- primary surfaces: `packages/adapters-local/src/guardrails/**, packages/core/src/guardrails/**, packages/adapters-local/test/**`

### do

- implement input/output pii detection through presidio analyzer/anonymizer services where available.
- add fallback regex recognizers for fake member id, ssn-ish, dob, phone, email, and policy prompt-injection phrases.
- return `allow`, `redact`, or `block` decisions with normalized evidence labels, not raw pii.

### acceptance criteria

- fake pii is redacted in audit-visible fields.
- guardrail blocks medical/legal advice escalation prompts and raw member-id exfiltration prompts.
- adapter can run in pure regex mode if presidio container is unavailable.

### verification

- `unit tests for regex fallback.`
- `integration test with presidio service if available.`
- `no raw pii appears in snapshot outputs.`

### handoff artifact

- recognized entities, thresholds, and known false positives.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p1-013 — local presidio and regex guardrail adapter on branch `awu/p1-013-local-guardrails`. dependencies: p1-002,p1-003,p1-004. primary surfaces: packages/adapters-local/src/guardrails/**, packages/core/src/guardrails/**, packages/adapters-local/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p1-014 — promptfoo local eval baseline

- agent: `worker`
- branch: `awu/p1-014-promptfoo-baseline`
- depends on: `p1-003,p1-012,p1-013`
- primary surfaces: `evals/promptfoo.yaml, evals/cases/**, scripts/run-evals.ts, packages/core/src/evals/**`

### do

- create promptfoo config with local/fixture provider path.
- add held-out cases for groundedness, citation coverage, refusal correctness, and pii leakage.
- ensure evals can run without paid model calls.

### acceptance criteria

- `pnpm eval:local` runs locally and emits json output.
- eval cases have ids, expected citations or refusal expectations, and tags.
- failing evals provide actionable messages.

### verification

- `pnpm eval:local`
- `unit tests for custom assertion helpers if implemented.`

### handoff artifact

- eval case count and intentionally weak baseline expectations.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p1-014 — promptfoo local eval baseline on branch `awu/p1-014-promptfoo-baseline`. dependencies: p1-003,p1-012,p1-013. primary surfaces: evals/promptfoo.yaml, evals/cases/**, scripts/run-evals.ts, packages/core/src/evals/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p1-015 — local end-to-end smoke path

- agent: `worker`
- branch: `awu/p1-015-local-e2e-smoke`
- depends on: `p1-005,p1-006,p1-008,p1-010,p1-011,p1-012,p1-013,p1-014`
- primary surfaces: `scripts/demo-local.ts, scripts/build-local-index.ts, README.md, Makefile`

### do

- add a single command that boots services, ingests fixture corpus, builds vectors/indexes, asks one benefits question, applies guardrails, writes audit trace, and runs tiny eval set.
- print concise success/failure summary with links/paths to artifacts.
- document troubleshooting for docker resource limits and missing ollama model.

### acceptance criteria

- `make demo-local` completes on a clean clone with fixture providers, without paid services.
- produces answer with citations and audit trace id.
- produces local eval json artifact.

### verification

- `make demo-local-reset && make demo-local`
- `verify generated artifacts exist.`

### handoff artifact

- known runtime requirements and exact local demo command.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p1-015 — local end-to-end smoke path on branch `awu/p1-015-local-e2e-smoke`. dependencies: p1-005,p1-006,p1-008,p1-010,p1-011,p1-012,p1-013,p1-014. primary surfaces: scripts/demo-local.ts, scripts/build-local-index.ts, README.md, Makefile. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```


# phase 2 — core rag api, citations, audit trace, and eval harness atomic work units

core rag api, citation assembly, audit trace, and eval harness.

## work units

## awu p2-001 — chat api contract and validation

- agent: `worker`
- branch: `awu/p2-001-chat-contract`
- depends on: `p1-002,p1-003`
- primary surfaces: `packages/core/src/api/chat-contract.ts, packages/core/test/api/**`

### do

- define request/response schema for `/chat` including session id, user message, plan scope, profile, debug flag, and redaction mode.
- define response with answer, citations, refusal flag, guardrail result, trace id, and optional debug retrieval trace.
- add strict validation and safe parse helpers.

### acceptance criteria

- invalid request returns typed validation error.
- response schema forbids raw internal prompts.
- schema is lambda/http agnostic.

### verification

- `valid/invalid request schema tests.`
- `snapshot for successful response shape.`

### handoff artifact

- api schema file and compatibility notes for api gateway payload v2.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p2-001 — chat api contract and validation on branch `awu/p2-001-chat-contract`. dependencies: p1-002,p1-003. primary surfaces: packages/core/src/api/chat-contract.ts, packages/core/test/api/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p2-002 — rag orchestration core pipeline

- agent: `worker`
- branch: `awu/p2-002-rag-orchestrator`
- depends on: `p1-012,p1-013,p2-001`
- primary surfaces: `packages/core/src/rag/**, packages/core/test/rag/**`

### do

- implement pipeline: validate -> input guardrail -> normalize query -> retrieve -> assemble context -> generate -> output guardrail -> cite -> audit event.
- inject all providers through ports.
- surface timings and component outputs into trace object.

### acceptance criteria

- pipeline runs with fake providers and fixture retriever.
- blocked input exits before retrieval/model call.
- output guardrail can force redaction or refusal.

### verification

- `happy path with fake answer.`
- `blocked input path verifies no llm call.`
- `retrieval-empty path triggers no-answer policy.`

### handoff artifact

- pipeline sequence and extension hooks.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p2-002 — rag orchestration core pipeline on branch `awu/p2-002-rag-orchestrator`. dependencies: p1-012,p1-013,p2-001. primary surfaces: packages/core/src/rag/**, packages/core/test/rag/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p2-003 — benefits answer prompt templates and answer policy

- agent: `worker`
- branch: `awu/p2-003-answer-policy`
- depends on: `p2-002`
- primary surfaces: `packages/core/src/prompts/**, packages/core/src/policy/**, packages/core/test/policy/**`

### do

- create system/developer/user prompt templates for evidence-cited member benefits q&a.
- encode policy: answer only from retrieved evidence, cite every material benefit claim, refuse missing coverage facts, avoid medical/legal advice.
- add configurable model params: max tokens, temperature, stop sequences.

### acceptance criteria

- templates are deterministic and snapshot-tested.
- policy text mentions public docs/no phi demo posture.
- prompt builder accepts retrieved chunks and emits bounded context.

### verification

- `snapshot prompt for fixture question.`
- `context length budget test.`
- `policy rule tests for no-evidence and advice prompts.`

### handoff artifact

- prompt ids, version tags, and model parameter defaults.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p2-003 — benefits answer prompt templates and answer policy on branch `awu/p2-003-answer-policy`. dependencies: p2-002. primary surfaces: packages/core/src/prompts/**, packages/core/src/policy/**, packages/core/test/policy/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p2-004 — citation assembly and claim support mapping

- agent: `worker`
- branch: `awu/p2-004-citation-assembly`
- depends on: `p1-010,p2-002`
- primary surfaces: `packages/core/src/citations/**, packages/core/test/citations/**`

### do

- implement citation renderer using doc title/source label/page/section/chunk id.
- map answer sentences or bullet claims to cited chunks where possible.
- add citation coverage checker used by evals and output validation.

### acceptance criteria

- every non-refusal answer has at least one citation.
- citation renderer avoids fabricating page numbers if absent; it uses section/chunk fallback.
- coverage checker flags uncited benefit claims.

### verification

- `citation rendering snapshots.`
- `coverage pass/fail fixtures.`
- `missing page fallback test.`

### handoff artifact

- citation format and limitations.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p2-004 — citation assembly and claim support mapping on branch `awu/p2-004-citation-assembly`. dependencies: p1-010,p2-002. primary surfaces: packages/core/src/citations/**, packages/core/test/citations/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p2-005 — refusal and no-answer policy engine

- agent: `security_reviewer`
- branch: `awu/p2-005-refusal-policy`
- depends on: `p2-003,p2-004`
- primary surfaces: `packages/core/src/policy/refusal.ts, packages/core/test/policy/refusal.test.ts`

### do

- implement deterministic refusal triggers for no retrieved evidence, out-of-scope medical/legal advice, request for phi/policyholder-specific adjudication, or prompt injection.
- produce concise refusal answer that offers safe next step and cites absence of evidence only through trace/debug, not user-facing fake citation.
- feed refusal labels into audit/eval output.

### acceptance criteria

- refusal decisions are explainable through trace labels.
- refusal text never recommends specific medical action.
- policy can be unit-tested without llm.

### verification

- `fixture tests for each refusal class.`
- `non-refusal benefits query passes.`

### handoff artifact

- refusal reason enum and evaluator mapping.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p2-005 — refusal and no-answer policy engine on branch `awu/p2-005-refusal-policy`. dependencies: p2-003,p2-004. primary surfaces: packages/core/src/policy/refusal.ts, packages/core/test/policy/refusal.test.ts. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p2-006 — structured benefit catalog tool-use port

- agent: `worker`
- branch: `awu/p2-006-tool-use-port`
- depends on: `p1-002,p1-007,p2-002`
- primary surfaces: `packages/core/src/tools/**, packages/adapters-local/src/tools/**, packages/core/test/tools/**`

### do

- define an agent tool-use port for structured benefit lookup: plan, benefit category, year, network flag, cost-share fields.
- implement local postgres catalog lookup adapter or fixture adapter.
- integrate optional tool result into rag context assembly.

### acceptance criteria

- core can request tool use without depending on postgres.
- tool result is audited as structured evidence.
- tool result cannot override retrieved policy text unless explicitly ranked/cited.

### verification

- `fixture tool lookup test.`
- `pipeline test with and without tool result.`
- `audit trace includes tool invocation metadata.`

### handoff artifact

- tool schema and deferred prod implementation notes.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p2-006 — structured benefit catalog tool-use port on branch `awu/p2-006-tool-use-port`. dependencies: p1-002,p1-007,p2-002. primary surfaces: packages/core/src/tools/**, packages/adapters-local/src/tools/**, packages/core/test/tools/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p2-007 — audit trace writer integration

- agent: `worker`
- branch: `awu/p2-007-audit-trace-integration`
- depends on: `p1-006,p2-002,p2-005`
- primary surfaces: `packages/core/src/audit/**, packages/core/test/audit/**`

### do

- build audit trace assembler with session/turn ids, user hash, input redaction result, retrieval metadata, model metadata, citations, refusal, eval-inline scores, and timing.
- ensure trace body stores hashes/redacted text only.
- write through `AuditStore` at consistent points in the pipeline.

### acceptance criteria

- audit trace can be written for success, refusal, blocked input, and model error.
- no raw pii in trace snapshots.
- audit write failures do not silently disappear; they return explicit non-fatal/critical status by config.

### verification

- `snapshot tests for four trace classes.`
- `pii scanner test over trace json.`
- `fake audit store failure behavior test.`

### handoff artifact

- trace schema version and retention assumptions.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p2-007 — audit trace writer integration on branch `awu/p2-007-audit-trace-integration`. dependencies: p1-006,p2-002,p2-005. primary surfaces: packages/core/src/audit/**, packages/core/test/audit/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p2-008 — lambda-compatible chat handler core

- agent: `worker`
- branch: `awu/p2-008-chat-handler-core`
- depends on: `p2-001,p2-002,p2-007`
- primary surfaces: `apps/api/src/handlers/chat.ts, apps/api/src/bootstrap.ts, apps/api/test/**`

### do

- create api handler that accepts api gateway http api payload format v2-style events but delegates to core chat pipeline.
- add profile-based adapter bootstrap with lazy initialization.
- return safe http status codes and json bodies.

### acceptance criteria

- handler can be invoked directly in unit tests with fake event.
- cold-start initialization does not perform paid model calls.
- errors include trace id where available, never raw prompt.

### verification

- `unit test happy path, validation error, guardrail block, internal error.`
- `typecheck handler event/response types.`

### handoff artifact

- handler env vars and bootstrap assumptions.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p2-008 — lambda-compatible chat handler core on branch `awu/p2-008-chat-handler-core`. dependencies: p2-001,p2-002,p2-007. primary surfaces: apps/api/src/handlers/chat.ts, apps/api/src/bootstrap.ts, apps/api/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p2-009 — local http api adapter and sam-local compatibility

- agent: `worker`
- branch: `awu/p2-009-local-http-adapter`
- depends on: `p2-008,p1-004`
- primary surfaces: `apps/api/src/local-server.ts, deploy/sam-template.local.yml, Makefile, README.md`

### do

- add a tiny local http server or sam-local template that routes `POST /chat` to the same handler.
- add `make api-local` and curl examples.
- ensure local server uses fixture/local adapters by default.

### acceptance criteria

- `make api-local` starts endpoint and accepts one fixture query.
- sam template can be used with `sam local start-api` if sam is installed.
- no aws credentials needed for local path.

### verification

- `handler-level tests mandatory; local server smoke command documented.`
- `curl fixture request returns cited answer/refusal.`

### handoff artifact

- local route urls and whether sam-local or express adapter is primary.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p2-009 — local http api adapter and sam-local compatibility on branch `awu/p2-009-local-http-adapter`. dependencies: p2-008,p1-004. primary surfaces: apps/api/src/local-server.ts, deploy/sam-template.local.yml, Makefile, README.md. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p2-010 — eval scoring functions

- agent: `worker`
- branch: `awu/p2-010-eval-scorers`
- depends on: `p2-004,p2-005,p2-007`
- primary surfaces: `packages/core/src/evals/scorers/**, packages/core/test/evals/**`

### do

- implement deterministic scorers for groundedness proxy, citation coverage, refusal correctness, pii leakage, retrieval hit@k, latency budget, and token estimate.
- define score output schema with pass/fail, numeric score, rationale, and evidence ids.
- avoid llm-as-judge for local default.

### acceptance criteria

- each scorer works on saved request/response/trace fixture.
- pii scorer fails on unredacted fake pii.
- groundedness proxy is honest about heuristic limitations.

### verification

- `scorer unit tests with pass/fail fixtures.`
- `snapshot eval result object.`

### handoff artifact

- threshold defaults and known blind spots.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p2-010 — eval scoring functions on branch `awu/p2-010-eval-scorers`. dependencies: p2-004,p2-005,p2-007. primary surfaces: packages/core/src/evals/scorers/**, packages/core/test/evals/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p2-011 — eval runner cli and artifacts

- agent: `worker`
- branch: `awu/p2-011-eval-runner-cli`
- depends on: `p2-008,p2-010,p1-014`
- primary surfaces: `scripts/run-evals.ts, evals/cases/**, evals/reports/.gitkeep, package.json`

### do

- implement cli that loads eval cases, invokes chat handler or pipeline, applies scorers, and writes json/jsonl/markdown summary.
- support `--max-cases`, `--tags`, `--profile`, and `--out`.
- wire promptfoo custom provider to call this cli or compatible local provider.

### acceptance criteria

- `pnpm eval:local -- --max-cases 5` works without network.
- report includes aggregate score and per-case failures.
- artifact paths are stable for ci upload.

### verification

- `cli unit test with temp output dir.`
- `eval local smoke command.`

### handoff artifact

- cli options and report schema.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p2-011 — eval runner cli and artifacts on branch `awu/p2-011-eval-runner-cli`. dependencies: p2-008,p2-010,p1-014. primary surfaces: scripts/run-evals.ts, evals/cases/**, evals/reports/.gitkeep, package.json. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p2-012 — core api integration test pack

- agent: `reviewer`
- branch: `awu/p2-012-core-integration-tests`
- depends on: `p2-002,p2-008,p2-011`
- primary surfaces: `apps/api/test/integration/**, packages/test-fixtures/**`

### do

- add integration tests that exercise local fixture providers through the chat handler.
- cover cited answer, no-answer refusal, pii redaction, tool-use enrichment, and audit trace write.
- keep tests deterministic and fast.

### acceptance criteria

- integration suite fails if citations disappear or raw pii appears in trace.
- tests can run in ci without docker unless explicitly tagged integration-docker.
- coverage includes both success and refusal path.

### verification

- `pnpm test --filter apps/api`
- `pnpm eval:local -- --max-cases 3`

### handoff artifact

- test coverage gaps and flaky-risk notes.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p2-012 — core api integration test pack on branch `awu/p2-012-core-integration-tests`. dependencies: p2-002,p2-008,p2-011. primary surfaces: apps/api/test/integration/**, packages/test-fixtures/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```


# phase 3 — cdk aws-smoke atomic work units

cdk aws-smoke: api gateway, nodejs22 lambda, s3, dynamodb, eventbridge, cloudwatch, kms, single-az isolated vpc, bedrock-runtime vpce, and s3/ddb gateway endpoints.

## work units

## awu p3-001 — cdk app, stacks, and cheap default feature flags

- agent: `worker`
- branch: `awu/p3-001-cdk-app-flags`
- depends on: `p1-001`
- primary surfaces: `infra/cdk/bin/app.ts, infra/cdk/lib/config/**, infra/cdk/lib/stacks/**, package.json`

### do

- create cdk v2 typescript app with `aws-smoke` stack as default.
- define typed feature flags for local/aws-smoke/aws-full.
- make expensive resources false by default and synth-block if smoke enables them accidentally.

### acceptance criteria

- `pnpm cdk:synth:smoke` synthesizes a template.
- default flags show no opensearch, aurora, fargate, nat, bedrock kb, or multi-az endpoint resources.
- stack names are deterministic and include environment/profile suffix.

### verification

- `cdk synth smoke`
- `unit test default flag object.`

### handoff artifact

- flag names, context keys, and default profile behavior.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p3-001 — cdk app, stacks, and cheap default feature flags on branch `awu/p3-001-cdk-app-flags`. dependencies: p1-001. primary surfaces: infra/cdk/bin/app.ts, infra/cdk/lib/config/**, infra/cdk/lib/stacks/**, package.json. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p3-002 — kms cmk construct

- agent: `worker`
- branch: `awu/p3-002-kms-construct`
- depends on: `p3-001`
- primary surfaces: `infra/cdk/lib/constructs/kms-key.ts, infra/cdk/test/**`

### do

- create one customer-managed kms key for corpus bucket and dynamodb encryption.
- add alias, rotation where supported, removal policy appropriate for demo, and least-privilege grants helpers.
- avoid per-service key sprawl.

### acceptance criteria

- smoke synth includes exactly one cmk unless explicitly configured otherwise.
- construct exposes key for bucket/table encryption.
- destroy-friendly config is clearly demo-only.

### verification

- `template assertion for one `AWS::KMS::Key` and alias.`
- `negative test for multiple keys if guard exists.`

### handoff artifact

- key alias and removal policy rationale.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p3-002 — kms cmk construct on branch `awu/p3-002-kms-construct`. dependencies: p3-001. primary surfaces: infra/cdk/lib/constructs/kms-key.ts, infra/cdk/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p3-003 — s3 corpus and index bucket construct

- agent: `worker`
- branch: `awu/p3-003-s3-bucket`
- depends on: `p3-002`
- primary surfaces: `infra/cdk/lib/constructs/corpus-bucket.ts, infra/cdk/test/**`

### do

- create encrypted s3 bucket for corpus docs, built index artifacts, and eval outputs.
- block public access, enforce ssl, enable versioning optionally, add lifecycle for demo cleanup.
- emit bucket name output.

### acceptance criteria

- bucket uses cmk encryption and public access block.
- lifecycle/logging choices are cdk-nag clean or have rationale.
- lambda role can read index prefix and optionally write eval artifact prefix only.

### verification

- `template assertions for encryption, block public access, ssl policy, lifecycle.`
- `grant helper test if available.`

### handoff artifact

- bucket prefixes and lifecycle retention.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p3-003 — s3 corpus and index bucket construct on branch `awu/p3-003-s3-bucket`. dependencies: p3-002. primary surfaces: infra/cdk/lib/constructs/corpus-bucket.ts, infra/cdk/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p3-004 — dynamodb chat session and audit table construct

- agent: `worker`
- branch: `awu/p3-004-ddb-table`
- depends on: `p3-002`
- primary surfaces: `infra/cdk/lib/constructs/audit-table.ts, infra/cdk/test/**`

### do

- create on-demand dynamodb table with `pk`/`sk` and optional gsi for trace id or eval run lookup.
- enable point-in-time recovery only if budget/profile flag allows; default can be off for demo with rationale.
- apply cmk encryption and ttl if configured.

### acceptance criteria

- key schema matches local dynamodb adapter.
- table uses billing mode pay-per-request.
- lambda grants are scoped to needed actions.

### verification

- `template assertions for billing mode, encryption, keys, ttl.`
- `iam grant assertion for read/write role.`

### handoff artifact

- table key design and gsi/ttl decisions.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p3-004 — dynamodb chat session and audit table construct on branch `awu/p3-004-ddb-table`. dependencies: p3-002. primary surfaces: infra/cdk/lib/constructs/audit-table.ts, infra/cdk/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p3-005 — eventbridge bus and trigger rules

- agent: `worker`
- branch: `awu/p3-005-eventbridge`
- depends on: `p3-001`
- primary surfaces: `infra/cdk/lib/constructs/event-bus.ts, infra/cdk/test/**`

### do

- create custom event bus for ingest and eval triggers.
- define event patterns for `corpus.ingest.requested`, `eval.run.requested`, and optional s3 object-created integration.
- wire rules to handler lambdas as targets when handlers exist.

### acceptance criteria

- event bus/rules synth with no cyc dependency.
- event detail schemas are documented.
- no private lambda is forced to call EventBridge unless endpoint strategy is addressed.

### verification

- `template assertions for bus/rules.`
- `event pattern snapshot.`

### handoff artifact

- event detail types and target function names.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p3-005 — eventbridge bus and trigger rules on branch `awu/p3-005-eventbridge`. dependencies: p3-001. primary surfaces: infra/cdk/lib/constructs/event-bus.ts, infra/cdk/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p3-006 — nodejs22 lambda construct and bundling

- agent: `worker`
- branch: `awu/p3-006-lambda-construct`
- depends on: `p2-008,p3-001,p3-003,p3-004`
- primary surfaces: `infra/cdk/lib/constructs/lambda-functions.ts, apps/api/package.json, infra/cdk/test/**`

### do

- create nodejs22.x lambda for chat runtime and optional eval/ingest handlers.
- bundle typescript with esbuild, sourcemaps disabled or safe, env vars wired from constructs.
- configure memory/timeout appropriate for in-memory retrieval but bounded.

### acceptance criteria

- chat lambda is vpc-attached only when smoke private bedrock endpoint is enabled.
- lambda log retention is 3-7 days by default.
- environment variables do not contain secrets.

### verification

- `template assertions for runtime `nodejs22.x`, timeout, memory, env, log retention.`
- `bundle/synth command.`

### handoff artifact

- lambda names, memory/timeouts, and env var list.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p3-006 — nodejs22 lambda construct and bundling on branch `awu/p3-006-lambda-construct`. dependencies: p2-008,p3-001,p3-003,p3-004. primary surfaces: infra/cdk/lib/constructs/lambda-functions.ts, apps/api/package.json, infra/cdk/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p3-007 — api gateway http api construct

- agent: `worker`
- branch: `awu/p3-007-http-api`
- depends on: `p3-006`
- primary surfaces: `infra/cdk/lib/constructs/http-api.ts, infra/cdk/test/**`

### do

- create api gateway http api with lambda proxy route `POST /chat`.
- configure cors only for local/dev origins if needed.
- emit invoke url output.

### acceptance criteria

- http api uses payload format version 2.0 or handler-compatible config.
- no public unauthenticated admin routes exist.
- route integration grants api gateway invoke permission.

### verification

- `template assertions for route, integration, and lambda permission.`
- `handler contract test remains green.`

### handoff artifact

- api route list and cors choices.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p3-007 — api gateway http api construct on branch `awu/p3-007-http-api`. dependencies: p3-006. primary surfaces: infra/cdk/lib/constructs/http-api.ts, infra/cdk/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p3-008 — single-az isolated vpc construct

- agent: `worker`
- branch: `awu/p3-008-vpc-isolated`
- depends on: `p3-001`
- primary surfaces: `infra/cdk/lib/constructs/vpc-smoke.ts, infra/cdk/test/**`

### do

- create one-vpc, one-az, isolated subnet config for smoke profile.
- ensure no nat gateway and no internet gateway path for runtime lambda.
- allow opt-in prod multi-az later without changing smoke default.

### acceptance criteria

- smoke synth contains no nat gateway resources.
- subnet selection for chat lambda is isolated/private without public ip.
- construct exposes route tables for gateway endpoints.

### verification

- `template negative assertions: no `AWS::EC2::NatGateway`.`
- `subnet count/profile flag assertions.`

### handoff artifact

- vpc/subnet ids outputs and design caveats.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p3-008 — single-az isolated vpc construct on branch `awu/p3-008-vpc-isolated`. dependencies: p3-001. primary surfaces: infra/cdk/lib/constructs/vpc-smoke.ts, infra/cdk/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p3-009 — s3 and dynamodb gateway endpoints

- agent: `worker`
- branch: `awu/p3-009-gateway-endpoints`
- depends on: `p3-003,p3-004,p3-008`
- primary surfaces: `infra/cdk/lib/constructs/gateway-endpoints.ts, infra/cdk/test/**`

### do

- add s3 and dynamodb gateway endpoints to isolated subnet route tables.
- scope endpoint policies to demo bucket/table where practical.
- document no-extra-charge premise for gateway endpoints.

### acceptance criteria

- template includes gateway endpoints for s3 and dynamodb.
- no interface endpoints for s3/ddb are created in smoke.
- route table associations are correct.

### verification

- `template assertions for `AWS::EC2::VPCEndpoint` type Gateway and services s3/dynamodb.`
- `negative assertion for interface endpoint type on s3/ddb.`

### handoff artifact

- endpoint policy scope and route table mapping.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p3-009 — s3 and dynamodb gateway endpoints on branch `awu/p3-009-gateway-endpoints`. dependencies: p3-003,p3-004,p3-008. primary surfaces: infra/cdk/lib/constructs/gateway-endpoints.ts, infra/cdk/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p3-010 — bedrock-runtime interface endpoint

- agent: `worker`
- branch: `awu/p3-010-bedrock-vpce`
- depends on: `p3-008`
- primary surfaces: `infra/cdk/lib/constructs/bedrock-runtime-endpoint.ts, infra/cdk/test/**`

### do

- create exactly one interface vpce for `com.amazonaws.${region}.bedrock-runtime` in the isolated subnet.
- enable private dns.
- attach endpoint policy limited to invoke actions and configured model arns where feasible.

### acceptance criteria

- smoke synth includes exactly one bedrock interface endpoint.
- no `bedrock-agent-runtime`, `bedrock`, or `bedrock-kb` endpoint appears in smoke.
- security group allows egress from lambda and ingress on 443 from lambda sg.

### verification

- `template assertion for endpoint service name suffix `bedrock-runtime`.`
- `negative assertions for other bedrock endpoint suffixes.`
- `security group rule assertions.`

### handoff artifact

- endpoint service name, private dns, endpoint policy, and expected monthly fixed cost note.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p3-010 — bedrock-runtime interface endpoint on branch `awu/p3-010-bedrock-vpce`. dependencies: p3-008. primary surfaces: infra/cdk/lib/constructs/bedrock-runtime-endpoint.ts, infra/cdk/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p3-011 — least-privilege iam grants

- agent: `security_reviewer`
- branch: `awu/p3-011-iam-least-privilege`
- depends on: `p3-003,p3-004,p3-006,p3-010`
- primary surfaces: `infra/cdk/lib/constructs/permissions.ts, infra/cdk/test/**`

### do

- grant chat lambda only read index/corpus prefixes, write audit table, and invoke configured bedrock model/guardrail actions.
- grant ingest/eval lambdas only their specific prefixes/table actions.
- avoid wildcard actions except where bedrock model resource scoping is not available; document every unavoidable wildcard.

### acceptance criteria

- iam policy snapshots have no `s3:*`, `dynamodb:*`, or broad admin actions.
- bedrock invoke permissions are as narrow as practical.
- permissions rationale exists for every wildcard resource/action.

### verification

- `template policy assertions.`
- `cdk-nag run or planned suppression list.`

### handoff artifact

- policy statements and unresolved least-privilege limitations.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p3-011 — least-privilege iam grants on branch `awu/p3-011-iam-least-privilege`. dependencies: p3-003,p3-004,p3-006,p3-010. primary surfaces: infra/cdk/lib/constructs/permissions.ts, infra/cdk/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p3-012 — cloudwatch logs and embedded metrics conventions

- agent: `worker`
- branch: `awu/p3-012-cloudwatch-emf`
- depends on: `p3-006,p2-007,p2-010`
- primary surfaces: `infra/cdk/lib/constructs/observability.ts, packages/core/src/observability/**, apps/api/src/**, infra/cdk/test/**`

### do

- set log retention to 7 days or less by default.
- add embedded metric format logger helper for eval score, latency, token estimates, refusal count, and guardrail blocks.
- avoid private lambda direct `PutMetricData` calls in smoke profile.

### acceptance criteria

- logs are structured and pii-safe.
- metric helper writes to stdout only.
- cdk log retention is explicit.

### verification

- `unit test emf json shape.`
- `pii scan test against log fixture.`
- `template assertion for log retention.`

### handoff artifact

- metric namespace/dimensions and retention defaults.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p3-012 — cloudwatch logs and embedded metrics conventions on branch `awu/p3-012-cloudwatch-emf`. dependencies: p3-006,p2-007,p2-010. primary surfaces: infra/cdk/lib/constructs/observability.ts, packages/core/src/observability/**, apps/api/src/**, infra/cdk/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p3-013 — deploy/destroy scripts and stack outputs

- agent: `worker`
- branch: `awu/p3-013-deploy-scripts`
- depends on: `p3-001,p3-007,p3-010`
- primary surfaces: `scripts/deploy-smoke.sh, scripts/destroy-smoke.sh, scripts/print-stack-outputs.ts, README.md`

### do

- add explicit deploy and destroy scripts for aws-smoke.
- print api url, bucket name, table name, vpce id, and estimated fixed-cost reminder after deploy.
- add guard prompt or env var to prevent accidental full profile deploy.

### acceptance criteria

- scripts are executable and shellcheck-friendly if shellcheck exists.
- destroy script targets smoke stack only.
- readme states destroy-after-demo recommendation.

### verification

- `bash -n scripts/*.sh`
- `pnpm cdk:synth:smoke`

### handoff artifact

- required env vars and safety interlocks.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p3-013 — deploy/destroy scripts and stack outputs on branch `awu/p3-013-deploy-scripts`. dependencies: p3-001,p3-007,p3-010. primary surfaces: scripts/deploy-smoke.sh, scripts/destroy-smoke.sh, scripts/print-stack-outputs.ts, README.md. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p3-014 — cdk smoke tests, cdk-nag bootstrap, and spend guard assertions

- agent: `finops_reviewer`
- branch: `awu/p3-014-cdk-tests-nag`
- depends on: `p3-001,p3-010,p3-011`
- primary surfaces: `infra/cdk/test/**, infra/cdk/lib/nag.ts, package.json`

### do

- add cdk assertions for required resources and forbidden expensive resources.
- wire cdk-nag for aws solutions pack or equivalent.
- add spend guard tests that fail if smoke contains nat, opensearch, aurora, fargate, bedrock kb, or multiple bedrock endpoints.

### acceptance criteria

- `pnpm cdk:nag` runs.
- smoke template forbidden-resource tests are explicit.
- suppressions require reason strings.

### verification

- `pnpm cdk:synth:smoke`
- `pnpm cdk:nag`
- `pnpm test --filter infra/cdk`

### handoff artifact

- suppression inventory and failing rules if any.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p3-014 — cdk smoke tests, cdk-nag bootstrap, and spend guard assertions on branch `awu/p3-014-cdk-tests-nag`. dependencies: p3-001,p3-010,p3-011. primary surfaces: infra/cdk/test/**, infra/cdk/lib/nag.ts, package.json. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```


# phase 4 — bedrock adapter, guardrails, s3 index loader, and smoke eval workflow atomic work units

bedrock runtime adapter, guardrail headers, in-memory s3 index loader, and aws smoke eval workflow.

## work units

## awu p4-001 — bedrock llm adapter

- agent: `worker`
- branch: `awu/p4-001-bedrock-llm-adapter`
- depends on: `p1-002,p2-003,p3-010,p3-011`
- primary surfaces: `packages/adapters-aws/src/bedrock/llm.ts, packages/adapters-aws/test/**`

### do

- implement `Llm.generate` using aws sdk bedrock runtime client.
- support model id/inference profile id from env.
- normalize errors, latency, model metadata, and estimated token counts.

### acceptance criteria

- unit tests mock bedrock runtime client.
- adapter never logs request body.
- timeouts/retries are bounded for demo budget.

### verification

- `mocked generate success/error tests.`
- `typecheck adapters-aws.`

### handoff artifact

- model env vars and api method chosen.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p4-001 — bedrock llm adapter on branch `awu/p4-001-bedrock-llm-adapter`. dependencies: p1-002,p2-003,p3-010,p3-011. primary surfaces: packages/adapters-aws/src/bedrock/llm.ts, packages/adapters-aws/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p4-002 — bedrock embedding adapter or configured lexical fallback

- agent: `worker`
- branch: `awu/p4-002-bedrock-embeddings`
- depends on: `p1-011,p3-010,p3-011`
- primary surfaces: `packages/adapters-aws/src/bedrock/embeddings.ts, packages/adapters-aws/test/**`

### do

- implement optional bedrock embedding provider through bedrock-runtime when enabled.
- allow `AWS_SMOKE_QUERY_EMBEDDINGS=false` to use lexical-only fallback and avoid extra model spend.
- record embedding model id/dimensions in trace.

### acceptance criteria

- smoke can run without query embeddings if disabled.
- embedding calls are separately counted for cost estimates.
- dimension mismatch returns explicit error.

### verification

- `mocked embedding success/error tests.`
- `fallback behavior test.`

### handoff artifact

- default smoke embedding mode and cost note.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p4-002 — bedrock embedding adapter or configured lexical fallback on branch `awu/p4-002-bedrock-embeddings`. dependencies: p1-011,p3-010,p3-011. primary surfaces: packages/adapters-aws/src/bedrock/embeddings.ts, packages/adapters-aws/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p4-003 — bedrock guardrail header integration

- agent: `security_reviewer`
- branch: `awu/p4-003-bedrock-guardrail-headers`
- depends on: `p4-001,p2-005`
- primary surfaces: `packages/adapters-aws/src/bedrock/guardrails.ts, packages/adapters-aws/src/bedrock/llm.ts, packages/adapters-aws/test/**`

### do

- add guardrail identifier/version env config.
- inject guardrail headers/parameters on model invocation when configured.
- normalize blocked/redacted guardrail outcomes into core guardrail decision format.

### acceptance criteria

- adapter works with guardrail disabled for local mocked tests.
- guardrail id/version are never hardcoded.
- blocked outputs are audited as guardrail blocks.

### verification

- `mocked request asserts guardrail headers/fields present.`
- `guardrail disabled test.`
- `blocked-output normalization test.`

### handoff artifact

- exact sdk fields/headers used and required env vars.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p4-003 — bedrock guardrail header integration on branch `awu/p4-003-bedrock-guardrail-headers`. dependencies: p4-001,p2-005. primary surfaces: packages/adapters-aws/src/bedrock/guardrails.ts, packages/adapters-aws/src/bedrock/llm.ts, packages/adapters-aws/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p4-004 — token and cost estimator

- agent: `finops_reviewer`
- branch: `awu/p4-004-token-cost-estimator`
- depends on: `p2-007,p4-001`
- primary surfaces: `packages/core/src/cost/**, packages/core/test/cost/**`

### do

- create heuristic token estimator for input/output/context chunks.
- map model ids to configurable per-token price metadata without hardcoding stale values as truth.
- emit per-turn estimated cost into audit trace and eval summary.

### acceptance criteria

- estimator is clearly labeled approximate.
- unknown model id yields estimate unavailable, not nonsense.
- budget cap can warn/fail eval workflow if projected spend exceeds threshold.

### verification

- `estimator unit tests.`
- `budget threshold pass/fail tests.`

### handoff artifact

- price config file and update procedure.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p4-004 — token and cost estimator on branch `awu/p4-004-token-cost-estimator`. dependencies: p2-007,p4-001. primary surfaces: packages/core/src/cost/**, packages/core/test/cost/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p4-005 — s3 index artifact format and local builder

- agent: `worker`
- branch: `awu/p4-005-s3-index-artifact`
- depends on: `p1-010,p1-011,p1-012,p3-003`
- primary surfaces: `packages/core/src/index-artifact/**, scripts/build-index-artifact.ts, packages/core/test/index-artifact/**`

### do

- define compressed index artifact layout: manifest, chunks, bm25, vectors, metadata, checksums.
- build artifact locally from corpus chunks and embeddings.
- support upload to s3/minio through object store port.

### acceptance criteria

- artifact is deterministic for same corpus and embedding provider.
- artifact size is bounded and safe for lambda `/tmp`.
- manifest includes schema version and model/dimension metadata.

### verification

- `artifact build snapshot/checksum test.`
- `round-trip load test.`
- `size budget test on fixtures.`

### handoff artifact

- artifact schema version and s3 prefix.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p4-005 — s3 index artifact format and local builder on branch `awu/p4-005-s3-index-artifact`. dependencies: p1-010,p1-011,p1-012,p3-003. primary surfaces: packages/core/src/index-artifact/**, scripts/build-index-artifact.ts, packages/core/test/index-artifact/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p4-006 — in-memory s3 index loader for lambda

- agent: `worker`
- branch: `awu/p4-006-s3-index-loader`
- depends on: `p4-005,p3-003,p3-006`
- primary surfaces: `packages/adapters-aws/src/index-loader/**, packages/core/src/retrieval/in-memory/**, packages/adapters-aws/test/**`

### do

- load index artifact from s3 into `/tmp` on cold start or first request.
- cache parsed index in process memory with checksum/version guard.
- fall back to refresh if artifact version changes.

### acceptance criteria

- loader uses bounded memory and clear errors for missing index.
- does not download on every warm invocation.
- trace includes index artifact version/checksum.

### verification

- `mock s3 loader tests.`
- `cache hit/miss tests.`
- `missing artifact error test.`

### handoff artifact

- memory assumptions and cold start tradeoff.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p4-006 — in-memory s3 index loader for lambda on branch `awu/p4-006-s3-index-loader`. dependencies: p4-005,p3-003,p3-006. primary surfaces: packages/adapters-aws/src/index-loader/**, packages/core/src/retrieval/in-memory/**, packages/adapters-aws/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p4-007 — aws-smoke in-memory hybrid retriever

- agent: `worker`
- branch: `awu/p4-007-aws-smoke-retriever`
- depends on: `p1-012,p4-002,p4-006`
- primary surfaces: `packages/adapters-aws/src/retriever/**, packages/adapters-aws/test/**`

### do

- implement aws-smoke retriever using in-memory artifact, optional query embeddings, lexical bm25, vector similarity, and rrf.
- avoid opensearch/aurora dependencies.
- add per-query retrieval trace suitable for audit.

### acceptance criteria

- retriever returns expected fixture chunks with no managed vector db.
- works in lexical-only mode.
- scores are deterministic for deterministic embeddings.

### verification

- `fixture retrieval tests.`
- `lexical-only fallback test.`
- `trace shape test.`

### handoff artifact

- aws-smoke retrieval limitations vs prod vector db.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p4-007 — aws-smoke in-memory hybrid retriever on branch `awu/p4-007-aws-smoke-retriever`. dependencies: p1-012,p4-002,p4-006. primary surfaces: packages/adapters-aws/src/retriever/**, packages/adapters-aws/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p4-008 — aws dynamodb audit adapter

- agent: `worker`
- branch: `awu/p4-008-aws-ddb-audit-adapter`
- depends on: `p1-006,p2-007,p3-004`
- primary surfaces: `packages/adapters-aws/src/audit-store/**, packages/adapters-aws/test/**`

### do

- implement aws dynamodb audit/session adapter matching local key schema.
- add conditional writes where useful to avoid duplicate turn ids.
- normalize sdk errors.

### acceptance criteria

- adapter methods match local adapter behavior.
- no raw prompt/answer body is logged by adapter.
- ddb table name loaded from env.

### verification

- `mock client unit tests for put/query.`
- `schema compatibility test with local fixture traces.`

### handoff artifact

- env vars and ddb access patterns.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p4-008 — aws dynamodb audit adapter on branch `awu/p4-008-aws-ddb-audit-adapter`. dependencies: p1-006,p2-007,p3-004. primary surfaces: packages/adapters-aws/src/audit-store/**, packages/adapters-aws/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p4-009 — aws eval sink using ddb and cloudwatch emf

- agent: `worker`
- branch: `awu/p4-009-aws-eval-sink`
- depends on: `p2-010,p2-011,p3-012,p4-008`
- primary surfaces: `packages/adapters-aws/src/eval-sink/**, packages/core/src/observability/**, packages/adapters-aws/test/**`

### do

- write eval run summary and per-case result to ddb audit table.
- emit aggregate metrics through emf stdout: groundedness, citation coverage, refusal correctness, pii leakage, pass rate, projected cost.
- avoid direct PutMetricData calls.

### acceptance criteria

- eval sink is profile-selectable.
- metric dimensions are stable and low-cardinality.
- ddb records are queryable by eval run id.

### verification

- `mock ddb write tests.`
- `emf json snapshot.`
- `low-cardinality dimension test if helper exists.`

### handoff artifact

- metric namespace and eval ddb key format.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p4-009 — aws eval sink using ddb and cloudwatch emf on branch `awu/p4-009-aws-eval-sink`. dependencies: p2-010,p2-011,p3-012,p4-008. primary surfaces: packages/adapters-aws/src/eval-sink/**, packages/core/src/observability/**, packages/adapters-aws/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p4-010 — eventbridge-triggered smoke eval workflow

- agent: `worker`
- branch: `awu/p4-010-eventbridge-smoke-eval`
- depends on: `p2-011,p3-005,p3-006,p4-009`
- primary surfaces: `apps/api/src/handlers/eval-runner.ts, infra/cdk/lib/constructs/event-bus.ts, scripts/trigger-smoke-eval.ts`

### do

- implement eval-runner lambda handler for `eval.run.requested` events.
- respect max cases and budget cap env vars.
- add manual trigger script using aws cli or sdk outside private lambda path.

### acceptance criteria

- manual trigger can launch 25-case max smoke eval.
- handler writes summary to ddb and emf logs.
- eval refuses to run if max cases/budget env is missing or unsafe.

### verification

- `unit test event handler with fake cases.`
- `template assertion event rule targets eval lambda.`
- `budget cap failure test.`

### handoff artifact

- event schema and trigger command.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p4-010 — eventbridge-triggered smoke eval workflow on branch `awu/p4-010-eventbridge-smoke-eval`. dependencies: p2-011,p3-005,p3-006,p4-009. primary surfaces: apps/api/src/handlers/eval-runner.ts, infra/cdk/lib/constructs/event-bus.ts, scripts/trigger-smoke-eval.ts. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p4-011 — aws-smoke scripted runbook

- agent: `worker`
- branch: `awu/p4-011-smoke-runbook`
- depends on: `p3-013,p4-005,p4-007,p4-010`
- primary surfaces: `scripts/aws-smoke-run.sh, docs/runbooks/aws-smoke.md, README.md`

### do

- write end-to-end smoke script: synth, deploy, build index, upload artifact, call `/chat`, trigger eval, print ddb/logs pointers, optional destroy.
- include cost warnings and command-level caps.
- include no-phi demo reminder.

### acceptance criteria

- script can be dry-run without aws calls.
- runbook is copy/pasteable and ordered.
- destroy step is explicit and safe.

### verification

- `bash -n script.`
- `dry-run mode test if implemented.`
- `docs spellcheck not required.`

### handoff artifact

- exact runbook commands and manual prerequisites.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p4-011 — aws-smoke scripted runbook on branch `awu/p4-011-smoke-runbook`. dependencies: p3-013,p4-005,p4-007,p4-010. primary surfaces: scripts/aws-smoke-run.sh, docs/runbooks/aws-smoke.md, README.md. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p4-012 — aws-smoke fault-injection and verification tests

- agent: `reviewer`
- branch: `awu/p4-012-smoke-fault-tests`
- depends on: `p4-001,p4-003,p4-006,p4-010`
- primary surfaces: `apps/api/test/faults/**, packages/adapters-aws/test/faults/**, docs/runbooks/verification.md`

### do

- add tests for missing index, bedrock timeout, guardrail block, ddb write failure, and invalid eval trigger.
- define verification checklist for private endpoint, no nat, ddb audit writes, and emf metrics.
- keep tests mocked/offline unless clearly marked manual.

### acceptance criteria

- faults return safe errors/refusals without raw prompt leakage.
- manual verification commands are documented.
- tests prove no uncaught exceptions for known failure modes.

### verification

- `pnpm test fault suite.`
- `pnpm cdk:synth:smoke.`

### handoff artifact

- remaining manual checks and known untested aws runtime behavior.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p4-012 — aws-smoke fault-injection and verification tests on branch `awu/p4-012-smoke-fault-tests`. dependencies: p4-001,p4-003,p4-006,p4-010. primary surfaces: apps/api/test/faults/**, packages/adapters-aws/test/faults/**, docs/runbooks/verification.md. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```


# phase 5 — disabled prod constructs and cdk-nag rationale atomic work units

disabled prod constructs for opensearch, aurora, fargate, bedrock kb, feature flags, cdk-nag suppressions, and spend guards.

## work units

## awu p5-001 — prod feature-flag module and synth matrix

- agent: `worker`
- branch: `awu/p5-001-prod-feature-flags`
- depends on: `p3-001,p3-014`
- primary surfaces: `infra/cdk/lib/config/profiles.ts, infra/cdk/test/profile-matrix.test.ts, package.json`

### do

- extend flag model with `aws-full` prod-shaped toggles.
- add synth matrix commands for smoke and full without deploying full.
- ensure smoke defaults remain unchanged.

### acceptance criteria

- `pnpm cdk:synth:smoke` and `pnpm cdk:synth:full` both work.
- smoke forbidden-resource tests still pass.
- full flags are explicit and never inferred from missing context.

### verification

- `profile matrix unit tests.`
- `smoke/full synth commands.`

### handoff artifact

- flag matrix and command names.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p5-001 — prod feature-flag module and synth matrix on branch `awu/p5-001-prod-feature-flags`. dependencies: p3-001,p3-014. primary surfaces: infra/cdk/lib/config/profiles.ts, infra/cdk/test/profile-matrix.test.ts, package.json. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p5-002 — disabled opensearch serverless vector construct

- agent: `worker`
- branch: `awu/p5-002-opensearch-disabled`
- depends on: `p5-001`
- primary surfaces: `infra/cdk/lib/constructs/prod/opensearch-serverless.ts, infra/cdk/test/prod-opensearch.test.ts`

### do

- create opensearch serverless vector collection construct behind `enableOpenSearch`.
- include encryption, network, and data access policy skeletons.
- set standby replicas/dev-test options explicitly where supported; do not enable in smoke.

### acceptance criteria

- full synth includes collection only when flag enabled.
- smoke synth includes none of the opensearch resources.
- construct has comments on cost floor and why disabled by default.

### verification

- `full enabled assertion for `AWS::OpenSearchServerless::Collection`.`
- `smoke negative assertion.`

### handoff artifact

- required policies and unresolved prod network assumptions.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p5-002 — disabled opensearch serverless vector construct on branch `awu/p5-002-opensearch-disabled`. dependencies: p5-001. primary surfaces: infra/cdk/lib/constructs/prod/opensearch-serverless.ts, infra/cdk/test/prod-opensearch.test.ts. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p5-003 — disabled aurora serverless v2 pgvector construct

- agent: `worker`
- branch: `awu/p5-003-aurora-disabled`
- depends on: `p5-001,p3-008`
- primary surfaces: `infra/cdk/lib/constructs/prod/aurora-pgvector.ts, infra/cdk/test/prod-aurora.test.ts`

### do

- create aurora postgresql serverless v2 construct behind `enableAuroraPgvector`.
- include database secret, subnet group, security group, and migration lambda placeholder if appropriate.
- document scale-to-zero requirement and why not deployed in smoke.

### acceptance criteria

- full enabled synth includes rds cluster/resources.
- smoke synth has no rds resources or secrets.
- construct exposes connection info only through safe outputs/secrets.

### verification

- `full enabled assertions for rds cluster and secret.`
- `smoke negative assertion for `AWS::RDS::*` and secrets manager if only for aurora.`

### handoff artifact

- migration strategy and scale-to-zero compatibility caveats.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p5-003 — disabled aurora serverless v2 pgvector construct on branch `awu/p5-003-aurora-disabled`. dependencies: p5-001,p3-008. primary surfaces: infra/cdk/lib/constructs/prod/aurora-pgvector.ts, infra/cdk/test/prod-aurora.test.ts. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p5-004 — disabled fargate reranker construct

- agent: `worker`
- branch: `awu/p5-004-fargate-reranker-disabled`
- depends on: `p5-001,p3-008`
- primary surfaces: `infra/cdk/lib/constructs/prod/fargate-reranker.ts, infra/cdk/test/prod-fargate.test.ts`

### do

- create ecs cluster, task definition, container image placeholder, and optional scheduled/on-demand service behind `enableFargateReranker`.
- default desired count zero or no service unless explicitly enabled.
- wire iam only for reading index/corpus and writing logs.

### acceptance criteria

- smoke has no ecs/fargate resources.
- full enabled synth includes ecs resources.
- construct notes scheduled/on-demand strategy to avoid always-on cost.

### verification

- `full enabled assertions for ecs task/cluster.`
- `smoke negative assertions for ecs resources.`

### handoff artifact

- container contract and reranker api assumptions.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p5-004 — disabled fargate reranker construct on branch `awu/p5-004-fargate-reranker-disabled`. dependencies: p5-001,p3-008. primary surfaces: infra/cdk/lib/constructs/prod/fargate-reranker.ts, infra/cdk/test/prod-fargate.test.ts. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p5-005 — disabled bedrock knowledge base with s3 vectors construct

- agent: `worker`
- branch: `awu/p5-005-bedrock-kb-disabled`
- depends on: `p5-001,p3-003`
- primary surfaces: `infra/cdk/lib/constructs/prod/bedrock-kb-s3-vectors.ts, infra/cdk/test/prod-bedrock-kb.test.ts`

### do

- create bedrock kb/s3 vectors construct or l1 placeholder behind `enableBedrockKb` depending on cdk support.
- include required roles/policies and data source config skeleton.
- make clear that smoke does not enable kb because it would need different runtime/control endpoints and managed retrieval costs.

### acceptance criteria

- smoke has no bedrock kb or bedrock-agent-runtime endpoint.
- full enabled synth includes kb resources or documented l1 placeholder.
- runtime adapter remains separate from kb adapter.

### verification

- `smoke negative assertions.`
- `full enabled synth if implemented.`

### handoff artifact

- cdk support limitations and enabling procedure.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p5-005 — disabled bedrock knowledge base with s3 vectors construct on branch `awu/p5-005-bedrock-kb-disabled`. dependencies: p5-001,p3-003. primary surfaces: infra/cdk/lib/constructs/prod/bedrock-kb-s3-vectors.ts, infra/cdk/test/prod-bedrock-kb.test.ts. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p5-006 — disabled multi-az vpc and prod endpoint expansion

- agent: `worker`
- branch: `awu/p5-006-multiaz-disabled`
- depends on: `p5-001,p3-008,p3-010`
- primary surfaces: `infra/cdk/lib/constructs/prod/multi-az-network.ts, infra/cdk/test/prod-network.test.ts`

### do

- add prod network construct option for multi-az subnets and endpoint replication.
- keep single-az smoke as default.
- document endpoint-hour multiplication risk.

### acceptance criteria

- smoke has one endpoint eni/subnet selection path.
- full enabled can synthesize multi-az endpoint associations.
- cost warning appears in construct docs/readme.

### verification

- `smoke endpoint count assertion.`
- `full multi-az synth assertion.`

### handoff artifact

- az count controls and cost caveat.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p5-006 — disabled multi-az vpc and prod endpoint expansion on branch `awu/p5-006-multiaz-disabled`. dependencies: p5-001,p3-008,p3-010. primary surfaces: infra/cdk/lib/constructs/prod/multi-az-network.ts, infra/cdk/test/prod-network.test.ts. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p5-007 — prod iam, tagging, and permissions boundary hooks

- agent: `security_reviewer`
- branch: `awu/p5-007-prod-iam-tags`
- depends on: `p3-011,p5-001`
- primary surfaces: `infra/cdk/lib/constructs/prod/iam-boundaries.ts, infra/cdk/lib/tags.ts, infra/cdk/test/**`

### do

- add optional permissions boundary arn and standard tags for owner, project, profile, cost-center, data-classification.
- ensure prod constructs consume boundary/tag helpers.
- avoid changing smoke permissions unless tests updated.

### acceptance criteria

- tags appear on supported resources.
- boundary attaches when context value provided.
- smoke remains deployable without boundary.

### verification

- `template assertions for tags.`
- `boundary flag test.`

### handoff artifact

- tag keys and boundary context variable.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p5-007 — prod iam, tagging, and permissions boundary hooks on branch `awu/p5-007-prod-iam-tags`. dependencies: p3-011,p5-001. primary surfaces: infra/cdk/lib/constructs/prod/iam-boundaries.ts, infra/cdk/lib/tags.ts, infra/cdk/test/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p5-008 — cdk-nag suppressions with rationale

- agent: `security_reviewer`
- branch: `awu/p5-008-cdk-nag-suppressions`
- depends on: `p3-014,p5-002,p5-003,p5-004,p5-005`
- primary surfaces: `infra/cdk/lib/nag-suppressions.ts, docs/security/cdk-nag-rationale.md, infra/cdk/test/nag.test.ts`

### do

- collect cdk-nag findings for smoke and full synth.
- add only necessary suppressions with specific resource, rule id, and human rationale.
- document why each suppression is acceptable for demo or prod-shaped placeholder.

### acceptance criteria

- no blanket suppressions on entire stack unless heavily justified.
- suppression reasons are not generic filler.
- smoke cdk-nag exits clean or has documented residual finding.

### verification

- `pnpm cdk:nag`
- `unit test that suppression reasons are non-empty and specific if feasible.`

### handoff artifact

- suppression table and remaining findings.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p5-008 — cdk-nag suppressions with rationale on branch `awu/p5-008-cdk-nag-suppressions`. dependencies: p3-014,p5-002,p5-003,p5-004,p5-005. primary surfaces: infra/cdk/lib/nag-suppressions.ts, docs/security/cdk-nag-rationale.md, infra/cdk/test/nag.test.ts. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p5-009 — spend guardrails and expensive-resource regression tests

- agent: `finops_reviewer`
- branch: `awu/p5-009-spend-guardrails`
- depends on: `p3-014,p5-001,p5-006`
- primary surfaces: `infra/cdk/test/spend-guard.test.ts, scripts/check-smoke-cost-shape.ts, docs/runbooks/cost-control.md`

### do

- add tests that fail smoke synth if nat, opensearch, rds, ecs/fargate, bedrock kb, extra bedrock endpoints, or multi-az endpoint expansion appear.
- add command to print resource count and fixed-cost warnings.
- document budget-safe deploy discipline.

### acceptance criteria

- smoke resource guard test is mandatory in ci.
- full profile is allowed to include expensive resources only when explicitly requested.
- cost-control runbook names each forbidden resource class.

### verification

- `pnpm test spend-guard`
- `pnpm cdk:synth:smoke`

### handoff artifact

- forbidden resource list and exception process.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p5-009 — spend guardrails and expensive-resource regression tests on branch `awu/p5-009-spend-guardrails`. dependencies: p3-014,p5-001,p5-006. primary surfaces: infra/cdk/test/spend-guard.test.ts, scripts/check-smoke-cost-shape.ts, docs/runbooks/cost-control.md. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p5-010 — architecture decision records for disabled prod constructs

- agent: `docs_researcher`
- branch: `awu/p5-010-prod-adrs`
- depends on: `p5-002,p5-003,p5-004,p5-005,p5-009`
- primary surfaces: `docs/adr/**`

### do

- write adr for each expensive prod construct: opensearch, aurora pgvector, fargate reranker, bedrock kb/s3 vectors, multi-az endpoints.
- include decision, status, context, consequences, enabling criteria, and interview defense angle.
- link to cdk flag and construct path.

### acceptance criteria

- each adr explains why disabled by default and how to enable for prod.
- adrs distinguish smoke demo vs production posture.
- adrs are concise enough for interview prep.

### verification

- `no code tests required; run markdown lint if available.`
- `verify links/paths exist.`

### handoff artifact

- adr list and any missing docs.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p5-010 — architecture decision records for disabled prod constructs on branch `awu/p5-010-prod-adrs`. dependencies: p5-002,p5-003,p5-004,p5-005,p5-009. primary surfaces: docs/adr/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```


# phase 6 — loom script and arc42 dossier atomic work units

loom script, final arc42 dossier, runbooks, diagrams, interview defense, and verification checklist.

## work units

## awu p6-001 — arc42 dossier skeleton

- agent: `docs_researcher`
- branch: `awu/p6-001-arc42-skeleton`
- depends on: `p3-001`
- primary surfaces: `docs/arc42/00-index.md, docs/arc42/01-introduction.md, docs/arc42/02-constraints.md, docs/arc42/03-context.md`

### do

- create arc42-style folder and table of contents.
- add intro, goals, stakeholder map, quality goals, and constraints.
- state budget-driven smoke profile and no-phi demo constraint.

### acceptance criteria

- dossier has navigable index.
- quality goals mention groundedness, refusal correctness, pii hygiene, auditability, and cost control.
- no unsupported compliance claims.

### verification

- `markdown lint if available.`
- `verify docs paths exist.`

### handoff artifact

- dossier outline and missing sections.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p6-001 — arc42 dossier skeleton on branch `awu/p6-001-arc42-skeleton`. dependencies: p3-001. primary surfaces: docs/arc42/00-index.md, docs/arc42/01-introduction.md, docs/arc42/02-constraints.md, docs/arc42/03-context.md. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p6-002 — requirements and scenario catalog

- agent: `docs_researcher`
- branch: `awu/p6-002-requirements-scenarios`
- depends on: `p2-011,p6-001`
- primary surfaces: `docs/arc42/04-solution-strategy.md, docs/scenarios/**, evals/cases/**`

### do

- document demo user stories: cited benefit answer, no-evidence refusal, pii redaction, audit trace, eval run, aws private bedrock invocation.
- map each story to acceptance criteria and eval cases.
- add interview-friendly traceability matrix.

### acceptance criteria

- each scenario references implementation artifact and eval case id.
- requirements separate functional, quality, security, and cost constraints.
- matrix is easy to paste into interview notes.

### verification

- `verify referenced eval case ids exist.`
- `markdown lint if available.`

### handoff artifact

- scenario ids and any gaps.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p6-002 — requirements and scenario catalog on branch `awu/p6-002-requirements-scenarios`. dependencies: p2-011,p6-001. primary surfaces: docs/arc42/04-solution-strategy.md, docs/scenarios/**, evals/cases/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p6-003 — architecture diagrams

- agent: `worker`
- branch: `awu/p6-003-architecture-diagrams`
- depends on: `p3-010,p4-007,p5-002`
- primary surfaces: `docs/diagrams/**, docs/arc42/05-building-block-view.md, docs/arc42/07-deployment-view.md`

### do

- create mermaid diagrams for local oss demo, aws-smoke, and disabled prod-full path.
- show control/data flow boundaries, private bedrock endpoint, gateway endpoints, and disabled expensive constructs.
- include sequence diagram for chat request and eval run.

### acceptance criteria

- diagrams render in github markdown or have fallback text.
- aws-smoke diagram shows no nat/opensearch/aurora/fargate.
- prod diagram visually marks feature-gated constructs.

### verification

- `optional mermaid render check if available.`
- `manual inspect diagrams.`

### handoff artifact

- diagram file list and assumptions.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p6-003 — architecture diagrams on branch `awu/p6-003-architecture-diagrams`. dependencies: p3-010,p4-007,p5-002. primary surfaces: docs/diagrams/**, docs/arc42/05-building-block-view.md, docs/arc42/07-deployment-view.md. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p6-004 — solution strategy and building block narrative

- agent: `docs_researcher`
- branch: `awu/p6-004-solution-building-blocks`
- depends on: `p2-002,p3-001,p4-007,p6-003`
- primary surfaces: `docs/arc42/04-solution-strategy.md, docs/arc42/05-building-block-view.md`

### do

- explain ports/adapters architecture, hybrid retrieval, citation assembly, guardrails, evals, audit trace, and cheap deployment toggles.
- state why in-memory s3 index is used for smoke instead of managed vector infra.
- describe prod extension path.

### acceptance criteria

- narrative maps directly to code packages and constructs.
- payer/regulatory rationale is explicit without overclaiming hipaa compliance.
- tradeoffs are honest.

### verification

- `verify referenced package/construct paths exist.`

### handoff artifact

- open questions and diagram links.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p6-004 — solution strategy and building block narrative on branch `awu/p6-004-solution-building-blocks`. dependencies: p2-002,p3-001,p4-007,p6-003. primary surfaces: docs/arc42/04-solution-strategy.md, docs/arc42/05-building-block-view.md. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p6-005 — runtime and deployment views

- agent: `docs_researcher`
- branch: `awu/p6-005-runtime-deployment`
- depends on: `p4-011,p6-003`
- primary surfaces: `docs/arc42/06-runtime-view.md, docs/arc42/07-deployment-view.md, docs/runbooks/aws-smoke.md`

### do

- document runtime sequences for chat, ingest, eval run, and guardrail block.
- document deployment sequence for local and aws-smoke.
- include troubleshooting branches for missing index, bedrock timeout, and budget cap failure.

### acceptance criteria

- runtime diagrams/narrative include audit and eval sinks.
- deployment view includes exact commands or links to runbook.
- failure handling is clear.

### verification

- `runbook command sanity check if scripts exist.`
- `markdown lint if available.`

### handoff artifact

- runtime sequence ids and runbook links.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p6-005 — runtime and deployment views on branch `awu/p6-005-runtime-deployment`. dependencies: p4-011,p6-003. primary surfaces: docs/arc42/06-runtime-view.md, docs/arc42/07-deployment-view.md, docs/runbooks/aws-smoke.md. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p6-006 — cross-cutting concerns: security, privacy, observability, cost

- agent: `security_reviewer`
- branch: `awu/p6-006-cross-cutting`
- depends on: `p3-011,p3-012,p4-003,p5-009`
- primary surfaces: `docs/arc42/08-crosscutting.md, docs/security/**, docs/runbooks/cost-control.md`

### do

- document pii redaction, no raw prompt logging, kms encryption, iam least privilege, vpc endpoints, audit trace, cloudwatch emf, and spend guardrails.
- include verification commands/checks for each control.
- state demo posture: hipaa-hygienic defaults, not a compliance certification.

### acceptance criteria

- controls map to code/infra artifacts.
- cost section names forbidden smoke resources.
- security claims are precise and defensible.

### verification

- `verify artifact links exist.`
- `security reviewer pass.`

### handoff artifact

- controls table and known residual risks.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p6-006 — cross-cutting concerns: security, privacy, observability, cost on branch `awu/p6-006-cross-cutting`. dependencies: p3-011,p3-012,p4-003,p5-009. primary surfaces: docs/arc42/08-crosscutting.md, docs/security/**, docs/runbooks/cost-control.md. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p6-007 — risks, technical debt, and roadmap

- agent: `docs_researcher`
- branch: `awu/p6-007-risks-roadmap`
- depends on: `p6-004,p6-006`
- primary surfaces: `docs/arc42/09-decisions.md, docs/arc42/10-risks.md, docs/roadmap.md`

### do

- write risks around local eval heuristic limits, small corpus, in-memory retrieval scaling, managed service gaps, guardrail false positives, and cost drift.
- document next steps: bedrock kb/s3 vectors, opensearch/aurora, fargate reranker, prior-auth pre-check, provider directory accuracy.
- link adrs.

### acceptance criteria

- risks are not hand-wavy; each has mitigation and owner suggestion.
- roadmap distinguishes interview demo vs real production build.
- adrs are linked.

### verification

- `markdown lint if available.`
- `link/path sanity check.`

### handoff artifact

- risk register ids and roadmap milestones.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p6-007 — risks, technical debt, and roadmap on branch `awu/p6-007-risks-roadmap`. dependencies: p6-004,p6-006. primary surfaces: docs/arc42/09-decisions.md, docs/arc42/10-risks.md, docs/roadmap.md. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p6-008 — loom 5-minute script and shot list

- agent: `docs_researcher`
- branch: `awu/p6-008-loom-script`
- depends on: `p4-011,p6-003,p6-006`
- primary surfaces: `docs/demo/loom-script.md, docs/demo/shot-list.md`

### do

- write a tight 5-minute script: architecture, local demo, guardrail, audit trace, eval harness, aws-smoke proof, prod extension close.
- include exact terminal/browser shots and fallback if aws smoke is not deployed live.
- include timing marks and one-liners.

### acceptance criteria

- script fits under 5 minutes.
- shots are ordered and reproducible.
- script does not claim full hipaa compliance.

### verification

- `dry-read timer manually or approximate word count.`
- `verify commands referenced exist.`

### handoff artifact

- final script and any missing screenshots/commands.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p6-008 — loom 5-minute script and shot list on branch `awu/p6-008-loom-script`. dependencies: p4-011,p6-003,p6-006. primary surfaces: docs/demo/loom-script.md, docs/demo/shot-list.md. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p6-009 — demo seed questions and evaluator evidence pack

- agent: `worker`
- branch: `awu/p6-009-demo-seeds`
- depends on: `p2-011,p4-011`
- primary surfaces: `docs/demo/demo-questions.md, evals/cases/demo.yaml, packages/test-fixtures/demo/**`

### do

- create deterministic demo questions: covered benefit, ambiguous benefit, out-of-scope medical advice, pii-containing prompt, and no-evidence prompt.
- map each question to expected behavior and evidence/citation ids.
- include curl commands for local and aws-smoke endpoints.

### acceptance criteria

- questions produce stable enough outputs for loom recording.
- evidence ids exist in fixture corpus/index.
- pii prompt uses fake data clearly labeled.

### verification

- `run demo cases locally.`
- `eval local subset for demo tag.`

### handoff artifact

- demo question order and expected outputs.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p6-009 — demo seed questions and evaluator evidence pack on branch `awu/p6-009-demo-seeds`. dependencies: p2-011,p4-011. primary surfaces: docs/demo/demo-questions.md, evals/cases/demo.yaml, packages/test-fixtures/demo/**. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p6-010 — final verification checklist

- agent: `reviewer`
- branch: `awu/p6-010-verification-checklist`
- depends on: `p1-015,p2-012,p3-014,p4-012,p6-008`
- primary surfaces: `docs/runbooks/final-verification.md, README.md`

### do

- create one-page checklist for local, ci, aws-smoke synth, optional deploy, eval, audit, logs, guardrails, and destroy.
- include pass/fail boxes and command snippets.
- state what evidence to show in interview.

### acceptance criteria

- checklist can be executed top-to-bottom.
- each check points to artifact/command/output.
- destroy/cost cleanup is last and prominent.

### verification

- `manual dry run by reviewer.`
- `verify commands exist.`

### handoff artifact

- checklist and unverified items.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p6-010 — final verification checklist on branch `awu/p6-010-verification-checklist`. dependencies: p1-015,p2-012,p3-014,p4-012,p6-008. primary surfaces: docs/runbooks/final-verification.md, README.md. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```

## awu p6-011 — readme quickstart and interview defense crib sheet

- agent: `docs_researcher`
- branch: `awu/p6-011-readme-cribsheet`
- depends on: `p6-004,p6-006,p6-010`
- primary surfaces: `README.md, docs/interview-defense.md`

### do

- write concise readme quickstart for local and aws-smoke.
- write interview defense talking points for chunking, hybrid retrieval, reranker path, guardrails, eval rubric, audit schema, and why expensive infra is disabled by default.
- include a short cost-aware architecture statement.

### acceptance criteria

- readme starts with runnable commands.
- crib sheet is sharp enough to rehearse from.
- no buzzword soup; every claim maps to code/evidence.

### verification

- `readme command sanity.`
- `link/path check.`

### handoff artifact

- final docs paths.

### copy-paste codex prompt

```text
you are a codex implementation agent. implement awu p6-011 — readme quickstart and interview defense crib sheet on branch `awu/p6-011-readme-cribsheet`. dependencies: p6-004,p6-006,p6-010. primary surfaces: README.md, docs/interview-defense.md. obey the cheap-by-default invariant: no opensearch, aurora, fargate, nat, bedrock kb, or extra bedrock endpoints in aws-smoke. do the listed work, satisfy acceptance criteria, run the verification commands that apply, and return a handoff with changed files, commands run, risks, and blockers. do not log raw prompts or pii.
```


---

## source anchors used while planning

- codex subagents and custom agents: https://developers.openai.com/codex/subagents
- codex project instructions via agents.md: https://developers.openai.com/codex/guides/agents-md
- codex github action: https://developers.openai.com/codex/github-action
- aws cdk constructs/stacks: https://docs.aws.amazon.com/cdk/v2/guide/constructs.html
- lambda node.js runtime support: https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html
- api gateway http api lambda proxy integration: https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html
- aws sam local start-api: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/using-sam-cli-local-start-api.html
- bedrock private vpc endpoints: https://docs.aws.amazon.com/bedrock/latest/userguide/vpc-interface-endpoints.html
- bedrock invokemodel guardrail headers: https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_InvokeModel.html
- s3 and dynamodb gateway endpoints: https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html
- dynamodb local: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html
- qdrant local quickstart: https://qdrant.tech/documentation/quick-start/
- pgvector: https://github.com/pgvector/pgvector
- ollama embeddings api: https://docs.ollama.com/api/embed
- microsoft presidio analyzer/anonymizer: https://microsoft.github.io/presidio/text_anonymization/
- promptfoo github action and cli evals: https://www.promptfoo.dev/docs/integrations/github-action/
