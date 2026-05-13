# Runtime view

## Chat sequence

```mermaid
sequenceDiagram
  participant U as User
  participant A as API
  participant G as Guardrail
  participant R as Retriever
  participant L as LLM
  participant D as Audit
  U->>A: POST /chat
  A->>G: evaluate/redact input
  G-->>A: allow/redact/block
  A->>R: retrieve public evidence
  R-->>A: chunks + scores
  A->>L: evidence-bounded prompt
  L-->>A: answer draft
  A->>G: output check
  A->>D: redacted trace + hashes
  A-->>U: answer/refusal + citations + trace id
```

Failure branches: missing index returns a safe error/refusal; Bedrock timeout becomes a model error with trace id; unsafe eval trigger is refused before model calls.
