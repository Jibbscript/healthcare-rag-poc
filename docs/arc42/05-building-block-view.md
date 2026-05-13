# Building block view

```mermaid
flowchart LR
  Client --> API[HTTP API / Lambda handler]
  API --> Core[core RAG pipeline]
  Core --> Guardrails[regex/Presidio or Bedrock guardrails]
  Core --> Retrieval[BM25 + vector fusion]
  Retrieval --> Index[S3/minio index artifact]
  Core --> LLM[fixture LLM or Bedrock Runtime]
  Core --> Audit[DynamoDB audit store]
  Core --> Evals[deterministic eval scorers]
```

Core packages map directly to `packages/core/src`; local adapters to `packages/adapters-local/src`; AWS adapters to `packages/adapters-aws/src`; infrastructure to `infra/cdk/lib`.
