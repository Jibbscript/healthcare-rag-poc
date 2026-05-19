# Final verification checklist

Current status for this checklist is recorded in `docs/runbooks/current-verification.md`.

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm eval:local`
- [ ] `pnpm eval:local -- --max-cases 5`
- [ ] `pnpm demo-local`
- [ ] `pnpm cdk:synth:smoke`
- [ ] `pnpm cdk:synth:full`
- [ ] `pnpm cdk:nag`
- [ ] `pnpm web:test`
- [ ] `GITHUB_PAGES=true pnpm web:build`
- [ ] `DRY_RUN=true SMOKE_EVIDENCE_OUT=demo-artifacts/aws-smoke/smoke-evidence.json scripts/aws-smoke-run.sh`
- [ ] `pnpm demo:capture -- --mode fixture-demo --base-url http://127.0.0.1:4173/healthcare-rag-poc/ --out demo-artifacts/fixture-demo`
- [ ] `pnpm demo:check-artifacts -- demo-artifacts`
- [ ] GitHub Pages source is configured to GitHub Actions.
- [ ] Optional real smoke evidence: trace id, citation ids, response hash, resource-shape summary, deploy status, destroy status.
- [ ] Destroy/cost cleanup last: `scripts/destroy-smoke.sh`.
