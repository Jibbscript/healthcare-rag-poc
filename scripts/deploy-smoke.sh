#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="${STACK_NAME:-HealthcareRagAwsSmoke}"
OUT_DIR="${CDK_OUT_DIR:-cdk.out/smoke}"
TEMPLATE_FILE="${TEMPLATE_FILE:-${OUT_DIR}/HealthcareRagAwsSmoke.template.json}"
REGION_ARG=()
REGION_TEXT=""
if [[ -n "${AWS_REGION:-}" ]]; then
  REGION_ARG=(--region "${AWS_REGION}")
  REGION_TEXT="${REGION_ARG[*]}"
fi

pnpm cdk:synth:smoke

if [[ ! -s "${TEMPLATE_FILE}" ]]; then
  echo "Smoke template not found: ${TEMPLATE_FILE}" >&2
  exit 1
fi

if [[ "${1:-}" == "--dry-run" ]]; then
  cat <<DRYRUN
Dry run only. Commands that would be run:
  aws cloudformation validate-template --template-body file://${TEMPLATE_FILE} ${REGION_TEXT}
  aws cloudformation deploy --stack-name ${STACK_NAME} --template-file ${TEMPLATE_FILE} --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM --no-fail-on-empty-changeset ${REGION_TEXT}

Smoke cost reminder: this stack includes one paid bedrock-runtime interface endpoint. Destroy after demo.
DRYRUN
  exit 0
fi

: "${AWS_REGION:?AWS_REGION is required for deployment}"
if [[ "${CONFIRM_AWS_SMOKE_DEPLOY:-}" != "deploy-smoke" ]]; then
  echo "Set CONFIRM_AWS_SMOKE_DEPLOY=deploy-smoke to deploy. Smoke has one paid bedrock-runtime endpoint." >&2
  exit 2
fi

aws cloudformation validate-template --template-body "file://${TEMPLATE_FILE}" "${REGION_ARG[@]}"
aws cloudformation deploy \
  --stack-name "${STACK_NAME}" \
  --template-file "${TEMPLATE_FILE}" \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset \
  "${REGION_ARG[@]}"

aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query 'Stacks[0].Outputs' \
  --output table \
  "${REGION_ARG[@]}" || pnpm tsx scripts/print-stack-outputs.ts "${TEMPLATE_FILE}"
