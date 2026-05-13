# AWS smoke runbook

1. Confirm no PHI and cost cap.
2. `pnpm cdk:synth:smoke`
3. `pnpm cdk:nag`
4. `DRY_RUN=true scripts/aws-smoke-run.sh`
5. For real deploy, set `CONFIRM_AWS_SMOKE_DEPLOY=deploy-smoke` and run `scripts/deploy-smoke.sh`.
6. Upload `evals/reports/index-artifact.json.gz` to the index prefix.
7. Call `POST /chat` with a public demo question.
8. Trigger max-25 smoke eval with `pnpm tsx scripts/trigger-smoke-eval.ts 25`.
9. Inspect DynamoDB audit records and CloudWatch EMF logs.
10. Destroy: `CONFIRM_AWS_SMOKE_DESTROY=destroy-smoke scripts/destroy-smoke.sh`.

Cost warning: smoke includes one paid Bedrock Runtime interface endpoint. Destroy after demo.
