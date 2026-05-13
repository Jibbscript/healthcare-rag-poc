# Solution strategy

The code uses ports/adapters: `packages/core` owns domain schemas, policy, retrieval, citations, audit assembly, and eval scorers without importing AWS SDK, Qdrant, Postgres, MinIO, or Presidio. Local and AWS adapters implement ports behind profile-specific bootstrapping.

Smoke retrieval uses a deterministic in-memory S3 index artifact instead of managed vector infrastructure. This keeps the architecture production-shaped while avoiding fixed-cost vector databases for interviews. Production extension paths are feature-gated in `infra/cdk/lib/constructs/prod` and documented in ADRs.


See `docs/scenarios/traceability.md` for scenario-to-artifact mapping.
