# Risks and technical debt

| Risk | Impact | Mitigation | Owner suggestion |
| --- | --- | --- | --- |
| Small synthetic corpus | Overstates retrieval quality | Add real public plan documents and regression evals | Product/ML |
| Heuristic evals | Miss subtle hallucinations | Add human review and optional LLM judge behind cost flag | ML |
| In-memory index scaling | Lambda memory pressure | Move to OpenSearch/Aurora/Bedrock KB when volume requires | Platform |
| Guardrail false positives | Blocks valid questions | Tune policies with labeled eval cases | Security/ML |
| Cost drift | Surprise fixed costs | Keep spend guard tests mandatory in CI | FinOps |
