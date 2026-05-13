# phase 4 — bedrock adapter, guardrails, s3 index loader, and smoke eval workflow atomic work units

bedrock runtime adapter, guardrail headers, in-memory s3 index loader, and aws smoke eval workflow.


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
