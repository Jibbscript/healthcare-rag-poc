# phase 2 — core rag api, citations, audit trace, and eval harness atomic work units

core rag api, citation assembly, audit trace, and eval harness.


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
