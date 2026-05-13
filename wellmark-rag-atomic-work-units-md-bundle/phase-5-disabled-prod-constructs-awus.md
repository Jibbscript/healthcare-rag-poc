# phase 5 — disabled prod constructs and cdk-nag rationale atomic work units

disabled prod constructs for opensearch, aurora, fargate, bedrock kb, feature flags, cdk-nag suppressions, and spend guards.


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
