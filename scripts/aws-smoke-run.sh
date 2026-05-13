#!/usr/bin/env bash
set -euo pipefail
DRY_RUN="${DRY_RUN:-true}"
echo "No-PHI AWS smoke run. Default dry-run=${DRY_RUN}."
pnpm cdk:synth:smoke
pnpm cdk:nag
pnpm build:index-artifact -- --out evals/reports/index-artifact.json.gz
if [[ "${DRY_RUN}" == "true" ]]; then
  echo "dry-run complete: deploy, upload index, call /chat, trigger eval, inspect ddb/logs, then destroy."
  exit 0
fi
scripts/deploy-smoke.sh
aws s3 cp evals/reports/index-artifact.json.gz "s3://${INDEX_BUCKET:?}/index/index-artifact.json.gz"
curl -s "${API_URL:?}/chat" -H 'content-type: application/json' -d '{"sessionId":"aws-smoke","message":"What is the urgent care copay?","profile":"aws-smoke"}'
pnpm tsx scripts/trigger-smoke-eval.ts 25
