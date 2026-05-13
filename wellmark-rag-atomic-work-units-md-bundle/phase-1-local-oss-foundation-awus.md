# phase 1 — local oss foundation atomic work units

provider interfaces, local docker compose, corpus ingest, qdrant + pgvector retrieval, ollama, presidio, and promptfoo.


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


---

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
