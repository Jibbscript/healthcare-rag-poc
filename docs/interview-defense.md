# Interview defense crib sheet

- Chunking: deterministic section/page-aware chunks with char offsets and checksums.
- Retrieval: BM25 plus optional vector fusion; smoke uses S3 in-memory artifact to avoid fixed managed-vector spend.
- Reranker path: Fargate reranker is feature-gated and disabled until volume justifies always-on or scheduled cost.
- Guardrails: deterministic local redaction/blocking plus optional Presidio/Bedrock guardrail integration.
- Eval rubric: groundedness proxy, citation coverage, refusal correctness, PII leakage, hit@k, latency, and token estimate.
- Audit schema: hashes/redacted text, retrieval metadata, citations, model metadata, timings, no raw prompt/answer storage.
- Cost posture: private Bedrock endpoint is shown; expensive production constructs are explicit flags with ADRs and spend tests.
