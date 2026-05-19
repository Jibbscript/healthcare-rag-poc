# Current verification

Verification date: 2026-05-19

This appendix records the current verification state for the visitor-facing architecture status. Historical handoff notes are preserved separately and are not current verification evidence.

## Results

| Command | Status | Evidence / notes |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | Passed | Lockfile was up to date; install completed in 1.3s. |
| `pnpm lint` | Passed | `lint passed (236 files scanned)`. |
| `pnpm typecheck` | Passed | `tsc -p tsconfig.json --noEmit` completed with exit code 0. |
| `pnpm test` | Passed | Vitest reported 34 files passed and 101 tests passed. |
| `pnpm eval:local` | Passed | `eval_e59551a96f8f`: 4 cases, 4 passed, 0 failed. |
| `pnpm cdk:synth:smoke` | Passed | Synthesized `cdk.out/smoke/HealthcareRagAwsSmoke.template.json`. |
| `pnpm cdk:nag` | Passed | Smoke cost-shape check passed with 33 resources, forbidden resources absent, and one `bedrock-runtime` endpoint. |
| `git diff --check` | Passed | No whitespace errors reported. |

## Optional evidence

| Command / proof | Status | Evidence / notes |
| --- | --- | --- |
| `pnpm demo-local` | Not run | Optional local demo proof; not required for docs-only architecture status unless the README/demo flow changes need fuller local smoke evidence. |
| `pnpm web:test` | Not run | Optional web component proof; run if web behavior changes. |
| `GITHUB_PAGES=true pnpm web:build` | Passed | Vite built the Pages bundle successfully under `apps/web/dist`. |
| `DRY_RUN=true SMOKE_EVIDENCE_OUT=demo-artifacts/aws-smoke/smoke-evidence.json scripts/aws-smoke-run.sh` | Passed | Dry run synthesized smoke, ran cdk nag/cost-shape checks, built `evals/reports/index-artifact.json.gz`, and wrote sanitized smoke evidence to `demo-artifacts/aws-smoke/smoke-evidence.json`. |
| `pnpm demo:check-artifacts -- demo-artifacts` | Passed | Demo artifact safety check passed with 20 files inspected. |
| Real AWS smoke proof | Not run | Requires AWS credentials, `AWS_SMOKE_ARTIFACT_BUCKET`, `SMOKE_API_KEY`, region, and typed paid-resource confirmation. The visitor-facing status must not imply this proof exists unless it is run fresh. |

## Current evidence boundary

- Fixture and local verification can prove the public demo path, local RAG behavior, guardrails, citations, and audit privacy behavior without paid resources.
- Dry-run smoke can prove smoke template synthesis, cost-shape checks, index artifact build, and summary-only evidence generation without deploying AWS resources.
- Real AWS smoke is a separate, explicit operator workflow for live AWS adapter proof.
