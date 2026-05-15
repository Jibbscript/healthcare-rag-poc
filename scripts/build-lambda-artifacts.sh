#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${LAMBDA_ARTIFACT_OUT_DIR:-cdk.out/smoke/lambda}"
mkdir -p "${OUT_DIR}/chat" "${OUT_DIR}/eval"

pnpm exec esbuild apps/api/src/handlers/chat.ts \
  --bundle \
  --platform=node \
  --target=node22 \
  --format=cjs \
  --outfile="${OUT_DIR}/chat/index.js"

pnpm exec esbuild apps/api/src/handlers/eval-runner.ts \
  --bundle \
  --platform=node \
  --target=node22 \
  --format=cjs \
  --outfile="${OUT_DIR}/eval/index.js"

rm -f "${OUT_DIR}/chat.zip" "${OUT_DIR}/eval.zip"
(cd "${OUT_DIR}/chat" && zip -q -r ../chat.zip index.js)
(cd "${OUT_DIR}/eval" && zip -q -r ../eval.zip index.js)

printf '{"chatZip":"%s","evalZip":"%s"}\n' "${OUT_DIR}/chat.zip" "${OUT_DIR}/eval.zip"
