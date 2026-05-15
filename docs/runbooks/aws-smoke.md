# AWS smoke runbook

1. Confirm no PHI and cost cap.
2. `pnpm cdk:synth:smoke`
3. `pnpm cdk:nag`
4. `DRY_RUN=true scripts/aws-smoke-run.sh`
5. For real deploy, set `AWS_REGION`, `AWS_SMOKE_ARTIFACT_BUCKET`, and `SMOKE_API_KEY`, then set `CONFIRM_AWS_SMOKE_DEPLOY=deploy-smoke` and run `scripts/deploy-smoke.sh`. The script bundles the real chat and eval handlers, uploads them to the artifact bucket, and deploys the synthesized CloudFormation template with `aws cloudformation deploy`; it does not call `cdk deploy` because this repo writes deterministic templates rather than a CDK cloud assembly.
6. Upload `evals/reports/index-artifact.json.gz` to the index prefix.
7. Call `POST /chat` with a public demo question and the `x-smoke-api-key` header.
8. Trigger a bounded smoke eval with `pnpm tsx scripts/trigger-smoke-eval.ts 25`. The trigger defaults to `healthcare-rag-aws-smoke-events` and rejects `maxCases` outside integer `1..25` and `EVAL_BUDGET_USD` outside `>0..5` before sending EventBridge events.
9. Inspect DynamoDB audit records and CloudWatch EMF logs.
10. Destroy: set `AWS_REGION`, then run `CONFIRM_AWS_SMOKE_DESTROY=destroy-smoke scripts/destroy-smoke.sh`.

Cost warning: smoke includes one paid Bedrock Runtime interface endpoint. Destroy after demo.
