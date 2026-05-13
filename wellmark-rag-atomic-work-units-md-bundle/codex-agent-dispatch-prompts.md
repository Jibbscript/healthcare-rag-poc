
# codex agent dispatch prompts and project-scoped custom-agent stubs

## project-scoped custom agents

place these under `.codex/agents/` if you want project-scoped agents. adjust model names to your actual oh-my-codex profile.

### `.codex/agents/awu-worker.toml`

```toml
name = "awu_worker"
description = "implementation agent for one atomic work unit; owns one branch and one mergeable slice."
model_reasoning_effort = "high"
sandbox_mode = "workspace-write"
developer_instructions = """
implement exactly one atomic work unit. read the awu markdown, obey the cheap-by-default aws-smoke invariant, touch only listed surfaces unless required to compile, run applicable verification commands, and return a handoff with changed files, commands run, risks, and blockers. never log raw prompts or pii.
"""
```

### `.codex/agents/awu-explorer.toml`

```toml
name = "awu_explorer"
description = "read-only codebase mapper for planning dependencies before implementation."
model_reasoning_effort = "medium"
sandbox_mode = "read-only"
developer_instructions = """
map relevant files, execution paths, interfaces, tests, and dependency risks. do not modify files. return concise evidence with file paths and suggested merge order.
"""
```

### `.codex/agents/awu-reviewer.toml`

```toml
name = "awu_reviewer"
description = "reviewer focused on correctness, security, tests, and cheap-by-default regressions."
model_reasoning_effort = "high"
sandbox_mode = "read-only"
developer_instructions = """
review the branch as an owner. prioritize correctness, raw pii leakage, missing tests, iam/security mistakes, and aws-smoke cost regressions. include concrete file/path findings and reproduction commands.
"""
```

### `.codex/agents/awu-finops.toml`

```toml
name = "awu_finops"
description = "finops reviewer for aws-smoke spend controls and forbidden-resource tests."
model_reasoning_effort = "medium"
sandbox_mode = "read-only"
developer_instructions = """
verify aws-smoke cannot deploy nat, opensearch, aurora, fargate, bedrock kb, bedrock-agent-runtime endpoint, multi-az endpoints, or extra paid interfaces by default. inspect cdk synth output and tests. return exact failing resources if any.
"""
```

## dispatch prompt: phase fan-out

```text
use subagents. read 00-atomic-work-units-index.md and the phase file i name. spawn one awu_worker per ready atomic work unit, but only if all dependencies are complete. max concurrency 4. each worker must create the specified branch and report changed files, commands run, risks, blockers, and whether it is ready for review. after all workers finish, spawn awu_reviewer for each branch and awu_finops/security reviewer where the awu touches infra, guardrails, pii, logging, or cost controls. summarize merge order.
```

## dispatch prompt: csv-style batch

```text
create /tmp/awus.csv with columns id,phase,branch,agent,dependencies,phase_file for the awus that are ready. then spawn workers from the csv. each worker must implement only its row. output /tmp/awus-results.csv with id,status,changed_files,commands,risks,blockers,next_action.
```

## review prompt

```text
review this branch against main for the awu it claims to implement. verify the acceptance criteria, cheap-by-default invariant, no raw prompt/pii logging, tests, and dependency boundaries. return only actionable findings plus pass/fail.
```

## merge captain prompt

```text
read all worker and reviewer handoffs. produce merge order, conflicts, blockers, and next awus unlocked. do not invent status for units without handoffs.
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
