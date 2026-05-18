# AWS smoke runbook

The `aws-smoke` path is an explicit operator workflow. It is not the hosted GitHub Pages dashboard mode and it is not triggered by ordinary Pages deploys.

## Boundaries

- Use public demo content only.
- Do not log raw prompts, raw answers, PHI, PII, smoke keys, or request bodies.
- `aws-smoke` includes one paid Bedrock Runtime interface endpoint. Destroy workflow-owned stacks after the demo.
- Keep the smoke cost shape free of NAT Gateway, OpenSearch, Aurora/RDS, Fargate/ECS services, Bedrock Knowledge Bases, and multi-AZ endpoint expansion.
- The hosted Pages app must not call the `aws-smoke` API from the browser.

## Dry run

```bash
DRY_RUN=true SMOKE_EVIDENCE_OUT=demo-artifacts/aws-smoke/smoke-evidence.json scripts/aws-smoke-run.sh
pnpm demo:capture -- --mode aws-smoke --base-url https://jibbscript.github.io/healthcare-rag-poc/ --out demo-artifacts/aws-smoke --smoke-evidence demo-artifacts/aws-smoke/smoke-evidence.json
pnpm demo:check-artifacts -- demo-artifacts
```

The dry run synthesizes the smoke template, runs the CDK nag/cost-shape checks, builds the index artifact, writes summary-only evidence, and captures a safe proof screen. It does not deploy AWS resources.

## Real smoke run

Required environment:

```bash
export AWS_REGION=us-east-1
export AWS_SMOKE_ARTIFACT_BUCKET=<existing-private-artifact-bucket>
export SMOKE_API_KEY=<runtime-only-smoke-key>
export CONFIRM_AWS_SMOKE_RUN=I_UNDERSTAND_THIS_CREATES_PAID_SMOKE_RESOURCES
export DRY_RUN=false
export SMOKE_EVIDENCE_OUT=demo-artifacts/aws-smoke/smoke-evidence.json
```

Run:

```bash
scripts/aws-smoke-run.sh
pnpm demo:capture -- --mode aws-smoke --base-url https://jibbscript.github.io/healthcare-rag-poc/ --out demo-artifacts/aws-smoke --smoke-evidence demo-artifacts/aws-smoke/smoke-evidence.json
pnpm demo:check-artifacts -- demo-artifacts
```

The smoke script:

1. Synthesizes `cdk.out/smoke/HealthcareRagAwsSmoke.template.json`.
2. Runs `pnpm cdk:nag` and smoke cost-shape checks.
3. Builds the local index artifact.
4. Deploys the synthesized CloudFormation template with `scripts/deploy-smoke.sh` unless `SKIP_DEPLOY=true`.
5. Resolves `ApiUrl`, `BucketName`, and `EventBusName` from stack outputs when environment values are not supplied.
6. Uploads `evals/reports/index-artifact.json.gz` to the deployed corpus bucket.
7. Calls `POST /chat` with the smoke API key and writes only a trace id, citation ids, and response hash.
8. Triggers the bounded smoke eval with `pnpm tsx scripts/trigger-smoke-eval.ts 25`.
9. Writes `smoke-evidence.json` with resource shape, provenance, hashes, and deploy/destroy status.

For workflow-owned demos, set `DESTROY_AFTER_RUN=true` so `scripts/aws-smoke-run.sh` destroys the stack before writing final evidence. If targeting an existing externally managed stack, set `STACK_OWNERSHIP_MODE=externally-managed` and `SKIP_DEPLOY=true`, then record the retained-stack decision in the demo notes.

Fallback destroy:

```bash
export AWS_REGION=us-east-1
CONFIRM_AWS_SMOKE_DESTROY=destroy-smoke scripts/destroy-smoke.sh
```

## GitHub Actions

Use the `Demo capture` workflow for operator demos:

- `mode=fixture-demo`: records the hosted static dashboard only.
- `mode=aws-smoke`, `dry_run=true`: produces dry-run smoke evidence and summary screenshots without AWS deployment.
- `mode=aws-smoke`, `dry_run=false`: requires `AWS_SMOKE_ROLE_ARN`, `AWS_SMOKE_ARTIFACT_BUCKET`, `SMOKE_API_KEY`, region, and the typed paid-resource confirmation.

Uploaded artifacts are scanned by `pnpm demo:check-artifacts -- demo-artifacts` before publication.
