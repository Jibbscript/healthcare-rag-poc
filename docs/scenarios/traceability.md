# Requirements and scenario traceability

| Scenario | Acceptance | Eval case | Artifact |
| --- | --- | --- | --- |
| Cited benefit answer | Answer has citation | covered-urgent-care | `evals/cases/demo.yaml` |
| No-evidence refusal | Refuses without fake citation | no-evidence-dental | `packages/core/src/policy/refusal.ts` |
| PII redaction | Fake member id redacted in trace | pii-containing | `packages/core/src/guardrails/regex.ts` |
| Audit trace | Trace has hashes/redacted text only | all cases | `packages/core/src/audit/trace.ts` |
| Private Bedrock invocation | Smoke uses bedrock-runtime VPCE only | synth tests | `infra/cdk/lib/template.ts` |
