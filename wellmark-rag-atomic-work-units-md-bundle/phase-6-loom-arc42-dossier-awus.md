# phase 6 — loom script and arc42 dossier atomic work units

loom script, final arc42 dossier, runbooks, diagrams, interview defense, and verification checklist.


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
