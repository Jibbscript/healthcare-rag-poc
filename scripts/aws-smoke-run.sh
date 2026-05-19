#!/usr/bin/env bash
set -euo pipefail

DRY_RUN="${DRY_RUN:-true}"
STACK_NAME="${STACK_NAME:-HealthcareRagAwsSmoke}"
TEMPLATE_FILE="${TEMPLATE_FILE:-cdk.out/smoke/HealthcareRagAwsSmoke.template.json}"
STACK_OWNERSHIP_MODE="${STACK_OWNERSHIP_MODE:-workflow-owned}"
DEPLOY_STATUS="${DEPLOY_STATUS:-not-run}"
DESTROY_STATUS="${DESTROY_STATUS:-not-run}"
SMOKE_STATUS="${SMOKE_STATUS:-starting}"
RESOURCE_SHAPE_JSON="${RESOURCE_SHAPE_JSON:-}"
SMOKE_RESPONSE_SUMMARY_JSON="${SMOKE_RESPONSE_SUMMARY_JSON:-}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"
REGION_ARG=()

if [[ -n "${AWS_REGION:-}" ]]; then
  REGION_ARG=(--region "${AWS_REGION}")
fi

write_evidence() {
  export STACK_NAME TEMPLATE_FILE STACK_OWNERSHIP_MODE DEPLOY_STATUS DESTROY_STATUS SMOKE_STATUS RESOURCE_SHAPE_JSON SMOKE_RESPONSE_SUMMARY_JSON AWS_ACCOUNT_ID
  pnpm --silent tsx scripts/smoke-evidence.ts
}

stack_output() {
  local key="$1"
  printf '%s' "${STACK_OUTPUTS_JSON}" | node -e "let body=''; const key=process.argv[1]; process.stdin.on('data',(chunk)=>body+=chunk); process.stdin.on('end',()=>{const outputs=JSON.parse(body); const hit=outputs.find((item)=>item.OutputKey===key); process.stdout.write(hit?.OutputValue ?? '');});" "${key}"
}

on_exit() {
  local status=$?
  if [[ "${status}" -ne 0 && -n "${SMOKE_EVIDENCE_OUT:-}" ]]; then
    SMOKE_STATUS="failed"
    write_evidence >/dev/null 2>&1 || true
  fi
}
trap on_exit EXIT

echo "No-PHI AWS smoke run. Default dry-run=${DRY_RUN}."
pnpm cdk:synth:smoke
pnpm cdk:nag
pnpm build:index-artifact -- --out evals/reports/index-artifact.json.gz

RESOURCE_SHAPE_JSON="$(pnpm --silent smoke:cost-shape)"

if [[ "${DRY_RUN}" == "true" ]]; then
  SMOKE_STATUS="dry-run"
  echo "dry-run complete: deploy, upload index, call /chat, trigger eval, inspect ddb/logs, then destroy."
  write_evidence
  exit 0
fi

if [[ "${CONFIRM_AWS_SMOKE_RUN:-}" != "I_UNDERSTAND_THIS_CREATES_PAID_SMOKE_RESOURCES" ]]; then
  echo "Set CONFIRM_AWS_SMOKE_RUN=I_UNDERSTAND_THIS_CREATES_PAID_SMOKE_RESOURCES with DRY_RUN=false to run paid smoke resources." >&2
  exit 2
fi

: "${AWS_REGION:?AWS_REGION is required for a real smoke run}"
: "${SMOKE_API_KEY:?SMOKE_API_KEY is required for the smoke API authorizer}"

AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text "${REGION_ARG[@]}" 2>/dev/null || true)"

if [[ "${SKIP_DEPLOY:-false}" != "true" ]]; then
  CONFIRM_AWS_SMOKE_DEPLOY=deploy-smoke scripts/deploy-smoke.sh
  DEPLOY_STATUS="deployed"
else
  STACK_OWNERSHIP_MODE="externally-managed"
  DEPLOY_STATUS="skipped-existing-stack"
fi

STACK_OUTPUTS_JSON="$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --query 'Stacks[0].Outputs' --output json "${REGION_ARG[@]}")"
API_URL="${API_URL:-$(stack_output ApiUrl)}"
INDEX_BUCKET="${INDEX_BUCKET:-$(stack_output BucketName)}"
EVENT_BUS_NAME="${EVENT_BUS_NAME:-$(stack_output EventBusName)}"

: "${API_URL:?ApiUrl stack output or API_URL is required}"
: "${INDEX_BUCKET:?BucketName stack output or INDEX_BUCKET is required}"
export EVENT_BUS_NAME

aws s3 cp evals/reports/index-artifact.json.gz "s3://${INDEX_BUCKET}/index/index-artifact.json.gz" "${REGION_ARG[@]}"
SMOKE_RESPONSE_SUMMARY_JSON="$(
  curl -sS --fail "${API_URL}/chat" \
    -H 'content-type: application/json' \
    -H "x-smoke-api-key: ${SMOKE_API_KEY}" \
    --data-binary '{"sessionId":"aws-smoke","message":"What is the urgent care copay?","profile":"aws-smoke"}' \
    | pnpm --silent tsx scripts/summarize-smoke-response.ts
)"
printf '%s\n' "${SMOKE_RESPONSE_SUMMARY_JSON}"
pnpm tsx scripts/trigger-smoke-eval.ts 25

if [[ "${DESTROY_AFTER_RUN:-false}" == "true" && "${STACK_OWNERSHIP_MODE}" == "workflow-owned" ]]; then
  CONFIRM_AWS_SMOKE_DESTROY=destroy-smoke scripts/destroy-smoke.sh
  DESTROY_STATUS="destroyed"
fi

SMOKE_STATUS="passed"
write_evidence
