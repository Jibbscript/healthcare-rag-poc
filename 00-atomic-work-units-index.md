# atomic work unit index and codex dispatch plan


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


## phase files

- [phase 1 — local oss foundation atomic work units](phase-1-local-oss-foundation-awus.md) — 15 awus
  - `p1-001` `awu/p1-001-repo-baseline` — repo baseline and workspace hygiene | agent `worker` | deps `none`
  - `p1-002` `awu/p1-002-provider-ports` — provider port interfaces and dependency injection seams | agent `worker` | deps `p1-001`
  - `p1-003` `awu/p1-003-domain-schemas` — domain schemas and fixture data contracts | agent `worker` | deps `p1-002`
  - `p1-004` `awu/p1-004-local-compose` — local docker compose stack | agent `worker` | deps `p1-001`
  - `p1-005` `awu/p1-005-minio-object-store` — local object store adapter for minio/s3-compatible storage | agent `worker` | deps `p1-002,p1-004`
  - `p1-006` `awu/p1-006-dynamodb-local-audit` — local dynamodb session and audit adapter | agent `worker` | deps `p1-002,p1-003,p1-004`
  - `p1-007` `awu/p1-007-pgvector-catalog` — postgres + pgvector catalog adapter | agent `worker` | deps `p1-002,p1-004`
  - `p1-008` `awu/p1-008-qdrant-retriever` — qdrant vector retriever adapter | agent `worker` | deps `p1-002,p1-003,p1-004`
  - `p1-009` `awu/p1-009-corpus-loader` — corpus loader and public document manifest | agent `worker` | deps `p1-003,p1-005`
  - `p1-010` `awu/p1-010-chunking` — chunking pipeline with citation metadata | agent `worker` | deps `p1-003,p1-009`
  - `p1-011` `awu/p1-011-local-embeddings` — local embeddings adapter via ollama plus deterministic fixture embeddings | agent `worker` | deps `p1-002,p1-004`
  - `p1-012` `awu/p1-012-hybrid-retriever` — hybrid retriever core with bm25 plus vector fusion | agent `worker` | deps `p1-003,p1-008,p1-011`
  - `p1-013` `awu/p1-013-local-guardrails` — local presidio and regex guardrail adapter | agent `security_reviewer` | deps `p1-002,p1-003,p1-004`
  - `p1-014` `awu/p1-014-promptfoo-baseline` — promptfoo local eval baseline | agent `worker` | deps `p1-003,p1-012,p1-013`
  - `p1-015` `awu/p1-015-local-e2e-smoke` — local end-to-end smoke path | agent `worker` | deps `p1-005,p1-006,p1-008,p1-010,p1-011,p1-012,p1-013,p1-014`
- [phase 2 — core rag api, citations, audit trace, and eval harness atomic work units](phase-2-core-rag-api-awus.md) — 12 awus
  - `p2-001` `awu/p2-001-chat-contract` — chat api contract and validation | agent `worker` | deps `p1-002,p1-003`
  - `p2-002` `awu/p2-002-rag-orchestrator` — rag orchestration core pipeline | agent `worker` | deps `p1-012,p1-013,p2-001`
  - `p2-003` `awu/p2-003-answer-policy` — benefits answer prompt templates and answer policy | agent `worker` | deps `p2-002`
  - `p2-004` `awu/p2-004-citation-assembly` — citation assembly and claim support mapping | agent `worker` | deps `p1-010,p2-002`
  - `p2-005` `awu/p2-005-refusal-policy` — refusal and no-answer policy engine | agent `security_reviewer` | deps `p2-003,p2-004`
  - `p2-006` `awu/p2-006-tool-use-port` — structured benefit catalog tool-use port | agent `worker` | deps `p1-002,p1-007,p2-002`
  - `p2-007` `awu/p2-007-audit-trace-integration` — audit trace writer integration | agent `worker` | deps `p1-006,p2-002,p2-005`
  - `p2-008` `awu/p2-008-chat-handler-core` — lambda-compatible chat handler core | agent `worker` | deps `p2-001,p2-002,p2-007`
  - `p2-009` `awu/p2-009-local-http-adapter` — local http api adapter and sam-local compatibility | agent `worker` | deps `p2-008,p1-004`
  - `p2-010` `awu/p2-010-eval-scorers` — eval scoring functions | agent `worker` | deps `p2-004,p2-005,p2-007`
  - `p2-011` `awu/p2-011-eval-runner-cli` — eval runner cli and artifacts | agent `worker` | deps `p2-008,p2-010,p1-014`
  - `p2-012` `awu/p2-012-core-integration-tests` — core api integration test pack | agent `reviewer` | deps `p2-002,p2-008,p2-011`
- [phase 3 — cdk aws-smoke atomic work units](phase-3-cdk-aws-smoke-awus.md) — 14 awus
  - `p3-001` `awu/p3-001-cdk-app-flags` — cdk app, stacks, and cheap default feature flags | agent `worker` | deps `p1-001`
  - `p3-002` `awu/p3-002-kms-construct` — kms cmk construct | agent `worker` | deps `p3-001`
  - `p3-003` `awu/p3-003-s3-bucket` — s3 corpus and index bucket construct | agent `worker` | deps `p3-002`
  - `p3-004` `awu/p3-004-ddb-table` — dynamodb chat session and audit table construct | agent `worker` | deps `p3-002`
  - `p3-005` `awu/p3-005-eventbridge` — eventbridge bus and trigger rules | agent `worker` | deps `p3-001`
  - `p3-006` `awu/p3-006-lambda-construct` — nodejs22 lambda construct and bundling | agent `worker` | deps `p2-008,p3-001,p3-003,p3-004`
  - `p3-007` `awu/p3-007-http-api` — api gateway http api construct | agent `worker` | deps `p3-006`
  - `p3-008` `awu/p3-008-vpc-isolated` — single-az isolated vpc construct | agent `worker` | deps `p3-001`
  - `p3-009` `awu/p3-009-gateway-endpoints` — s3 and dynamodb gateway endpoints | agent `worker` | deps `p3-003,p3-004,p3-008`
  - `p3-010` `awu/p3-010-bedrock-vpce` — bedrock-runtime interface endpoint | agent `worker` | deps `p3-008`
  - `p3-011` `awu/p3-011-iam-least-privilege` — least-privilege iam grants | agent `security_reviewer` | deps `p3-003,p3-004,p3-006,p3-010`
  - `p3-012` `awu/p3-012-cloudwatch-emf` — cloudwatch logs and embedded metrics conventions | agent `worker` | deps `p3-006,p2-007,p2-010`
  - `p3-013` `awu/p3-013-deploy-scripts` — deploy/destroy scripts and stack outputs | agent `worker` | deps `p3-001,p3-007,p3-010`
  - `p3-014` `awu/p3-014-cdk-tests-nag` — cdk smoke tests, cdk-nag bootstrap, and spend guard assertions | agent `finops_reviewer` | deps `p3-001,p3-010,p3-011`
- [phase 4 — bedrock adapter, guardrails, s3 index loader, and smoke eval workflow atomic work units](phase-4-bedrock-smoke-awus.md) — 12 awus
  - `p4-001` `awu/p4-001-bedrock-llm-adapter` — bedrock llm adapter | agent `worker` | deps `p1-002,p2-003,p3-010,p3-011`
  - `p4-002` `awu/p4-002-bedrock-embeddings` — bedrock embedding adapter or configured lexical fallback | agent `worker` | deps `p1-011,p3-010,p3-011`
  - `p4-003` `awu/p4-003-bedrock-guardrail-headers` — bedrock guardrail header integration | agent `security_reviewer` | deps `p4-001,p2-005`
  - `p4-004` `awu/p4-004-token-cost-estimator` — token and cost estimator | agent `finops_reviewer` | deps `p2-007,p4-001`
  - `p4-005` `awu/p4-005-s3-index-artifact` — s3 index artifact format and local builder | agent `worker` | deps `p1-010,p1-011,p1-012,p3-003`
  - `p4-006` `awu/p4-006-s3-index-loader` — in-memory s3 index loader for lambda | agent `worker` | deps `p4-005,p3-003,p3-006`
  - `p4-007` `awu/p4-007-aws-smoke-retriever` — aws-smoke in-memory hybrid retriever | agent `worker` | deps `p1-012,p4-002,p4-006`
  - `p4-008` `awu/p4-008-aws-ddb-audit-adapter` — aws dynamodb audit adapter | agent `worker` | deps `p1-006,p2-007,p3-004`
  - `p4-009` `awu/p4-009-aws-eval-sink` — aws eval sink using ddb and cloudwatch emf | agent `worker` | deps `p2-010,p2-011,p3-012,p4-008`
  - `p4-010` `awu/p4-010-eventbridge-smoke-eval` — eventbridge-triggered smoke eval workflow | agent `worker` | deps `p2-011,p3-005,p3-006,p4-009`
  - `p4-011` `awu/p4-011-smoke-runbook` — aws-smoke scripted runbook | agent `worker` | deps `p3-013,p4-005,p4-007,p4-010`
  - `p4-012` `awu/p4-012-smoke-fault-tests` — aws-smoke fault-injection and verification tests | agent `reviewer` | deps `p4-001,p4-003,p4-006,p4-010`
- [phase 5 — disabled prod constructs and cdk-nag rationale atomic work units](phase-5-disabled-prod-constructs-awus.md) — 10 awus
  - `p5-001` `awu/p5-001-prod-feature-flags` — prod feature-flag module and synth matrix | agent `worker` | deps `p3-001,p3-014`
  - `p5-002` `awu/p5-002-opensearch-disabled` — disabled opensearch serverless vector construct | agent `worker` | deps `p5-001`
  - `p5-003` `awu/p5-003-aurora-disabled` — disabled aurora serverless v2 pgvector construct | agent `worker` | deps `p5-001,p3-008`
  - `p5-004` `awu/p5-004-fargate-reranker-disabled` — disabled fargate reranker construct | agent `worker` | deps `p5-001,p3-008`
  - `p5-005` `awu/p5-005-bedrock-kb-disabled` — disabled bedrock knowledge base with s3 vectors construct | agent `worker` | deps `p5-001,p3-003`
  - `p5-006` `awu/p5-006-multiaz-disabled` — disabled multi-az vpc and prod endpoint expansion | agent `worker` | deps `p5-001,p3-008,p3-010`
  - `p5-007` `awu/p5-007-prod-iam-tags` — prod iam, tagging, and permissions boundary hooks | agent `security_reviewer` | deps `p3-011,p5-001`
  - `p5-008` `awu/p5-008-cdk-nag-suppressions` — cdk-nag suppressions with rationale | agent `security_reviewer` | deps `p3-014,p5-002,p5-003,p5-004,p5-005`
  - `p5-009` `awu/p5-009-spend-guardrails` — spend guardrails and expensive-resource regression tests | agent `finops_reviewer` | deps `p3-014,p5-001,p5-006`
  - `p5-010` `awu/p5-010-prod-adrs` — architecture decision records for disabled prod constructs | agent `docs_researcher` | deps `p5-002,p5-003,p5-004,p5-005,p5-009`
- [phase 6 — loom script and arc42 dossier atomic work units](phase-6-loom-arc42-dossier-awus.md) — 11 awus
  - `p6-001` `awu/p6-001-arc42-skeleton` — arc42 dossier skeleton | agent `docs_researcher` | deps `p3-001`
  - `p6-002` `awu/p6-002-requirements-scenarios` — requirements and scenario catalog | agent `docs_researcher` | deps `p2-011,p6-001`
  - `p6-003` `awu/p6-003-architecture-diagrams` — architecture diagrams | agent `worker` | deps `p3-010,p4-007,p5-002`
  - `p6-004` `awu/p6-004-solution-building-blocks` — solution strategy and building block narrative | agent `docs_researcher` | deps `p2-002,p3-001,p4-007,p6-003`
  - `p6-005` `awu/p6-005-runtime-deployment` — runtime and deployment views | agent `docs_researcher` | deps `p4-011,p6-003`
  - `p6-006` `awu/p6-006-cross-cutting` — cross-cutting concerns: security, privacy, observability, cost | agent `security_reviewer` | deps `p3-011,p3-012,p4-003,p5-009`
  - `p6-007` `awu/p6-007-risks-roadmap` — risks, technical debt, and roadmap | agent `docs_researcher` | deps `p6-004,p6-006`
  - `p6-008` `awu/p6-008-loom-script` — loom 5-minute script and shot list | agent `docs_researcher` | deps `p4-011,p6-003,p6-006`
  - `p6-009` `awu/p6-009-demo-seeds` — demo seed questions and evaluator evidence pack | agent `worker` | deps `p2-011,p4-011`
  - `p6-010` `awu/p6-010-verification-checklist` — final verification checklist | agent `reviewer` | deps `p1-015,p2-012,p3-014,p4-012,p6-008`
  - `p6-011` `awu/p6-011-readme-cribsheet` — readme quickstart and interview defense crib sheet | agent `docs_researcher` | deps `p6-004,p6-006,p6-010`

## dependency execution bands



### band 0 — repo/core prep

- p1-001, p1-002, p1-003, p1-004

### band 1 — local adapters and ingest

- p1-005, p1-006, p1-007, p1-008, p1-009, p1-010, p1-011

### band 2 — retrieval, guardrails, eval baseline

- p1-012, p1-013, p1-014, p1-015

### band 3 — core api and eval harness

- p2-001 through p2-012, respecting internal dependencies

### band 4 — aws-smoke infra

- p3-001 through p3-014, with p3-001 first and p3-014 last

### band 5 — bedrock/aws runtime integration

- p4-001 through p4-012, with p4-005/p4-006/p4-007 as the retrieval spine

### band 6 — prod-shaped disabled constructs

- p5-001 through p5-010

### band 7 — docs, loom, final dossier

- p6-001 through p6-011


## parent-agent launch prompt

```text
read 00-atomic-work-units-index.md and the relevant phase file. spawn workers only for awus whose dependencies are complete. keep max concurrency at 4-6. each worker must create the specified branch, implement only the atomic unit, run verification, and return a handoff. after implementation, spawn reviewer/security_reviewer/finops_reviewer as appropriate. consolidate results into a merge order and blocker list.
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
