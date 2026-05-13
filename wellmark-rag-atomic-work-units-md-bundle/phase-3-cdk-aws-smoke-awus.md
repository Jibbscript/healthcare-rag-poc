# phase 3 — cdk aws-smoke atomic work units

cdk aws-smoke: api gateway, nodejs22 lambda, s3, dynamodb, eventbridge, cloudwatch, kms, single-az isolated vpc, bedrock-runtime vpce, and s3/ddb gateway endpoints.


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
