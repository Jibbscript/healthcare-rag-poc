# Current architecture status

Last updated: 2026-05-19

This page is the current visitor-facing status for the Healthcare Benefits RAG POC. Older handoff notes remain useful historical evidence, but this page and `docs/runbooks/current-verification.md` are the current status surfaces.

## Evidence tiers

| Tier | What it proves | How to run or inspect | AWS resources |
| --- | --- | --- | --- |
| Hosted fixture demo | The public dashboard, citation/refusal UI states, trace labels, and redaction evidence render from bundled fixture data. | Open the GitHub Pages dashboard or run `GITHUB_PAGES=true pnpm web:build` plus Vite preview. | None. |
| Local API proof | The API, core RAG pipeline, retrieval, guardrails, citations, and audit trace behavior work against local fixture providers. | `pnpm demo-local` or `pnpm api-local` with a local `/chat` request. | None. |
| Dry-run smoke evidence | The smoke template, cost-shape checks, index artifact build, and summary-only capture path work without deployment. | `DRY_RUN=true SMOKE_EVIDENCE_OUT=demo-artifacts/aws-smoke/smoke-evidence.json scripts/aws-smoke-run.sh`. | None deployed. |
| Real AWS smoke proof | The short-lived smoke stack can exercise real AWS adapters and write summary-only evidence. | `scripts/aws-smoke-run.sh` with `DRY_RUN=false`, credentials, artifact bucket, smoke API key, region, and typed paid-resource confirmation. | Paid smoke resources are created unless targeting an existing stack; destroy after use. |

## Provider failure status

The RAG pipeline intentionally collapses provider failures into sanitized `MODEL_ERROR` labels and `model_error` audit status. This is a privacy-preserving boundary, not a raw provider diagnostic surface.

Current behavior:

- Provider exceptions do not expose raw exception text to the user.
- Audit traces record sanitized status and labels instead of raw provider errors.
- Tests cover a provider failure containing fake member-id text and assert that the fake identifier is not persisted.

Truthfulness decision, 2026-05-19: current `MODEL_ERROR` behavior is truthful if documented exactly as a sanitized provider-failure boundary. No runtime taxonomy change is required for the visitor-facing architecture story.

## Smoke adapter status

The `aws-smoke` profile has two distinct execution contexts:

- Local/default app bootstrap: `aws-smoke` can still use fixture/local adapters unless `AWS_SMOKE_USE_REAL_ADAPTERS=true`.
- Generated smoke Lambda template: smoke Lambda environment sets `AWS_SMOKE_USE_REAL_ADAPTERS=true`, so deployed smoke functions use real AWS smoke adapters.

This split keeps local and CI paths cheap/offline while keeping the explicit real smoke workflow tied to AWS adapters.

Truthfulness decision, 2026-05-19: current smoke adapter selection is truthful if documented as fixture/default unless `AWS_SMOKE_USE_REAL_ADAPTERS=true`, with generated smoke Lambdas setting that flag. No adapter-selection runtime change is required.

## Historical handoff status

`docs/handoff/atomic-work-units-implementation.md` is historical implementation evidence. Its verification notes describe that implementation pass and should not be read as current verification status.

Truthfulness decision, 2026-05-19: preserving the handoff notes as history is truthful when current verification is recorded separately in `docs/runbooks/current-verification.md`.

## Intentional deferrals

- Real AWS smoke proof remains optional because it requires credentials, a private artifact bucket, a smoke API key, region selection, and typed confirmation for paid smoke resources.
- Expensive production constructs remain feature-gated and disabled by default.
- A richer provider failure taxonomy is deferred until there is an operator-facing diagnostic need that justifies widening the current sanitized boundary.
- Historical handoff notes are not rewritten as current evidence.

## Cost and privacy boundaries

- `aws-smoke` keeps exactly one paid Bedrock Runtime interface endpoint.
- `aws-smoke` excludes NAT Gateway, OpenSearch, Aurora/RDS, Fargate/ECS services, Bedrock Knowledge Bases, and multi-AZ endpoint expansion.
- The hosted Pages dashboard does not call the smoke API and does not expose smoke API keys.
- The project uses public/fixture benefits text and fake PII examples only.
- Raw prompts, raw answers, PHI, PII, smoke keys, and request bodies must not be published in docs, logs, captures, or artifacts.
