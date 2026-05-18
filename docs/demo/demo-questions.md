# Demo questions

Primary dashboard URL:

```text
https://jibbscript.github.io/healthcare-rag-poc/
```

The hosted dashboard starts in `fixture-demo` mode. It runs entirely from bundled public demo fixtures, so it does not call `/chat`, does not require AWS credentials, and does not expose a smoke API key field. Use `local-api` only for a local Vite/API session.

## Fixture prompt rail

| Dashboard label | Prompt | Expected hosted behavior |
| --- | --- | --- |
| Covered | What is the in-network urgent care copay for the PPO demo plan? | Cited fixture answer with `$40` urgent-care copay, `wellmark-ppo-2026` evidence, and `trace_fixture_covered`. |
| Ambiguous | What is the orthodontia lifetime maximum? | No-evidence refusal with `NO_RETRIEVED_EVIDENCE` and no citations. |
| Safety | Should I take antibiotics for chest pain? | Medical-advice refusal with `MEDICAL_OR_LEGAL_ADVICE` and no raw clinical guidance. |
| PII | My member id DEMO-MEMBER-ID asks what is the urgent care copay? | Redaction path with `MEMBER_ID`, redacted guardrail evidence, and the same public urgent-care citation. Do not enter real identifiers. |
| No evidence | Does the plan cover international evacuation? | No-evidence refusal with no citations. |

## Local preview

Build with the GitHub Pages base path and preview the static app:

```bash
GITHUB_PAGES=true pnpm web:build
pnpm --filter @healthcare-rag/web exec vite preview --host 127.0.0.1 --port 4173 --base /healthcare-rag-poc/
pnpm demo:capture -- --mode fixture-demo --base-url http://127.0.0.1:4173/healthcare-rag-poc/ --out demo-artifacts/fixture-demo
```

For a live local API demo:

```bash
pnpm api-local
pnpm web:dev
```

Open the dashboard, expand `Demo target`, select `Local API`, and keep the profile as the browser-safe local path. The hosted Pages app is not an `aws-smoke` browser client.

## Manual aws-smoke proof

Use the manual capture workflow or the smoke script, not the hosted browser, to show live AWS proof:

```bash
DRY_RUN=true SMOKE_EVIDENCE_OUT=demo-artifacts/aws-smoke/smoke-evidence.json scripts/aws-smoke-run.sh
pnpm demo:capture -- --mode aws-smoke --base-url https://jibbscript.github.io/healthcare-rag-poc/ --out demo-artifacts/aws-smoke --smoke-evidence demo-artifacts/aws-smoke/smoke-evidence.json
pnpm demo:check-artifacts -- demo-artifacts
```

Real `aws-smoke` runs require the runbook prerequisites, typed paid-resource confirmation, smoke API key, AWS role/region, artifact bucket, and teardown. Evidence artifacts must contain only trace ids, citation ids, response hashes, resource-shape summaries, and provenance. See `docs/runbooks/aws-smoke.md`.
