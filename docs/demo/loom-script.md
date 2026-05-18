# Five-minute Loom script

## 0:00 - 0:35: Open the live dashboard

Open `https://jibbscript.github.io/healthcare-rag-poc/`. Start on the dashboard itself, not the repo. Point out the visible mode labels: `Fixture playback`, `public benefits corpus`, the prompt rail, the answer panel, safety/trace, citations, and `Demo target`.

Narration: this is a static GitHub Pages deployment of the Svelte demo console. It is useful without AWS because the default mode is bundled fixture playback.

## 0:35 - 1:30: Prove the cited answer path

Click `Covered`, then `Run question`. Show the `$40` urgent-care fixture answer, the `wellmark-ppo-2026` citation, the retrieval trace row, and `trace_fixture_covered`.

Narration: the demo exposes the same product behavior a reviewer cares about: answer, citation, trace id, guardrail state, and retrieval score shape. It does not need a backend to demonstrate the reviewer flow.

## 1:30 - 2:20: Show refusal and safety behavior

Run `Ambiguous`, then `Safety`. Show `NO_RETRIEVED_EVIDENCE` for missing corpus support and `MEDICAL_OR_LEGAL_ADVICE` for the clinical-advice prompt.

Narration: refusal states are first-class UI states, not hidden logs. The answer panel and safety panel make the reason visible without leaking raw internals.

## 2:20 - 3:00: Show redaction behavior

Run `PII`. Keep the focus on the answer/evidence panels. Show `MEMBER_ID`, `redact`, the trace id, and the public citation. Do not type or narrate real identifiers.

Narration: the demo uses synthetic placeholder text only. The capture artifacts are reviewed and scanned, and manifests store hashes and labels rather than raw prompts or raw answers.

## 3:00 - 3:45: Show CI/CD shape

Open the GitHub Actions `Pages dashboard` workflow. Show the push-to-`masta` trigger, Node 22/pnpm install, lint, typecheck, tests, local eval, web tests, Pages build, `actions/upload-pages-artifact`, and `actions/deploy-pages`.

Narration: Pages deployment is automated, but only after the same cheap-by-default validation gates pass.

## 3:45 - 4:35: Show manual aws-smoke capture

Open the `Demo capture` workflow dispatch screen or the latest capture artifact. Show the `fixture-demo` / `aws-smoke` mode input, the typed paid-resource confirmation, and the sanitized summary artifact.

Narration: live AWS proof is deliberately manual. The hosted browser never handles the smoke API key and never needs Pages-origin CORS. The smoke script exercises `/chat`, records trace ids, citation ids, response hashes, resource-shape output, and provenance, then tears down workflow-owned smoke infrastructure.

## 4:35 - 5:00: Close on evidence and boundaries

Show the artifact manifest and `docs/runbooks/aws-smoke.md`. Close with the boundary: fixture playback is the public live dashboard; `aws-smoke` is an explicit, credentialed, short-lived proof path with sanitized capture output.
