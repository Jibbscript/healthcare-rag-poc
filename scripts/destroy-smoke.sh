#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="${STACK_NAME:-HealthcareRagAwsSmoke}"
REGION_ARG=()
REGION_TEXT=""
if [[ -n "${AWS_REGION:-}" ]]; then
  REGION_ARG=(--region "${AWS_REGION}")
  REGION_TEXT="${REGION_ARG[*]}"
fi

if [[ "${1:-}" == "--dry-run" ]]; then
  cat <<DRYRUN
Dry run only. Commands that would be run:
  aws cloudformation delete-stack --stack-name ${STACK_NAME} ${REGION_TEXT}
  aws cloudformation wait stack-delete-complete --stack-name ${STACK_NAME} ${REGION_TEXT}
DRYRUN
  exit 0
fi

: "${AWS_REGION:?AWS_REGION is required for destroy}"
if [[ "${CONFIRM_AWS_SMOKE_DESTROY:-}" != "destroy-smoke" ]]; then
  echo "Set CONFIRM_AWS_SMOKE_DESTROY=destroy-smoke to destroy the smoke stack." >&2
  exit 2
fi

aws cloudformation delete-stack --stack-name "${STACK_NAME}" "${REGION_ARG[@]}"
aws cloudformation wait stack-delete-complete --stack-name "${STACK_NAME}" "${REGION_ARG[@]}"
echo "Deleted ${STACK_NAME}."
