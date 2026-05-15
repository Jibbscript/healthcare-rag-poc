#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="${STACK_NAME:-HealthcareRagAwsSmoke}"
OUT_DIR="${CDK_OUT_DIR:-cdk.out/smoke}"
TEMPLATE_FILE="${TEMPLATE_FILE:-${OUT_DIR}/HealthcareRagAwsSmoke.template.json}"
LAMBDA_OUT_DIR="${LAMBDA_ARTIFACT_OUT_DIR:-${OUT_DIR}/lambda}"
ARTIFACT_PREFIX="${AWS_SMOKE_ARTIFACT_PREFIX:-healthcare-rag-smoke/$(git rev-parse --short HEAD 2>/dev/null || date +%s)}"
CHAT_ZIP="${LAMBDA_OUT_DIR}/chat.zip"
EVAL_ZIP="${LAMBDA_OUT_DIR}/eval.zip"
CHAT_KEY="${ARTIFACT_PREFIX%/}/chat.zip"
EVAL_KEY="${ARTIFACT_PREFIX%/}/eval.zip"
REGION_ARG=()
REGION_TEXT=""
if [[ -n "${AWS_REGION:-}" ]]; then
  REGION_ARG=(--region "${AWS_REGION}")
  REGION_TEXT="${REGION_ARG[*]}"
fi

pnpm cdk:synth:smoke
pnpm build:lambda-artifacts

if [[ ! -s "${TEMPLATE_FILE}" ]]; then
  echo "Smoke template not found: ${TEMPLATE_FILE}" >&2
  exit 1
fi

if [[ "${1:-}" == "--dry-run" ]]; then
  cat <<DRYRUN
Dry run only. Commands that would be run:
	  aws cloudformation validate-template --template-body file://${TEMPLATE_FILE} ${REGION_TEXT}
	  aws s3 cp ${CHAT_ZIP} s3://\${AWS_SMOKE_ARTIFACT_BUCKET:?}/${CHAT_KEY} ${REGION_TEXT}
	  aws s3 cp ${EVAL_ZIP} s3://\${AWS_SMOKE_ARTIFACT_BUCKET:?}/${EVAL_KEY} ${REGION_TEXT}
	  aws cloudformation deploy --stack-name ${STACK_NAME} --template-file ${TEMPLATE_FILE} --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM --no-fail-on-empty-changeset --parameter-overrides LambdaArtifactBucket=\${AWS_SMOKE_ARTIFACT_BUCKET:?} ChatLambdaArtifactKey=${CHAT_KEY} EvalLambdaArtifactKey=${EVAL_KEY} SmokeApiKey=\${SMOKE_API_KEY:?} ${REGION_TEXT}

Smoke cost reminder: this stack includes one paid bedrock-runtime interface endpoint. Destroy after demo.
DRYRUN
  exit 0
fi

: "${AWS_REGION:?AWS_REGION is required for deployment}"
: "${AWS_SMOKE_ARTIFACT_BUCKET:?AWS_SMOKE_ARTIFACT_BUCKET is required for bundled Lambda artifacts}"
: "${SMOKE_API_KEY:?SMOKE_API_KEY is required for the smoke API authorizer}"
if [[ "${CONFIRM_AWS_SMOKE_DEPLOY:-}" != "deploy-smoke" ]]; then
  echo "Set CONFIRM_AWS_SMOKE_DEPLOY=deploy-smoke to deploy. Smoke has one paid bedrock-runtime endpoint." >&2
  exit 2
fi

aws s3 cp "${CHAT_ZIP}" "s3://${AWS_SMOKE_ARTIFACT_BUCKET}/${CHAT_KEY}" "${REGION_ARG[@]}"
aws s3 cp "${EVAL_ZIP}" "s3://${AWS_SMOKE_ARTIFACT_BUCKET}/${EVAL_KEY}" "${REGION_ARG[@]}"
aws cloudformation validate-template --template-body "file://${TEMPLATE_FILE}" "${REGION_ARG[@]}"
aws cloudformation deploy \
  --stack-name "${STACK_NAME}" \
  --template-file "${TEMPLATE_FILE}" \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset \
  --parameter-overrides \
    "LambdaArtifactBucket=${AWS_SMOKE_ARTIFACT_BUCKET}" \
    "ChatLambdaArtifactKey=${CHAT_KEY}" \
    "EvalLambdaArtifactKey=${EVAL_KEY}" \
    "SmokeApiKey=${SMOKE_API_KEY}" \
  "${REGION_ARG[@]}"

aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query 'Stacks[0].Outputs' \
  --output table \
  "${REGION_ARG[@]}" || pnpm tsx scripts/print-stack-outputs.ts "${TEMPLATE_FILE}"
