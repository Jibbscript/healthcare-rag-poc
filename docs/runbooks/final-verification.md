# Final verification checklist

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
- [ ] Optional deploy evidence: API URL, bucket name, table name, VPCE id, eval summary, audit trace id.
- [ ] Destroy/cost cleanup last: `scripts/destroy-smoke.sh`.
