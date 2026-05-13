#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" == "--dry-run" ]]; then
  echo "dry-run: pnpm cdk:synth:smoke && cdk deploy HealthcareRagAwsSmoke"
  exit 0
fi
: "${AWS_REGION:?AWS_REGION is required}"
pnpm cdk:synth:smoke
if [[ "${CONFIRM_AWS_SMOKE_DEPLOY:-}" != "deploy-smoke" ]]; then
  echo "Set CONFIRM_AWS_SMOKE_DEPLOY=deploy-smoke to deploy. Smoke has one paid bedrock-runtime endpoint." >&2
  exit 2
fi
npx cdk deploy HealthcareRagAwsSmoke --app cdk.out/smoke --require-approval never
pnpm tsx scripts/print-stack-outputs.ts
