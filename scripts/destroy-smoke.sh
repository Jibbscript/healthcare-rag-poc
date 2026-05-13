#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" == "--dry-run" ]]; then
  echo "dry-run: cdk destroy HealthcareRagAwsSmoke"
  exit 0
fi
if [[ "${CONFIRM_AWS_SMOKE_DESTROY:-}" != "destroy-smoke" ]]; then
  echo "Set CONFIRM_AWS_SMOKE_DESTROY=destroy-smoke to destroy the smoke stack." >&2
  exit 2
fi
npx cdk destroy HealthcareRagAwsSmoke --app cdk.out/smoke --force
