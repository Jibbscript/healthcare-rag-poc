# Local Adapters

Local adapters model the OSS/self-hosted profile while keeping CI deterministic.

`QdrantRetrieverAdapter.retrieve()` requires an explicit query vector source in its constructor: either an `EmbeddingProvider` or a narrow `queryVector(queryText)` function. The core `RetrievalQuery` contract remains text-first; vectorization is adapter-local and fails fast when no vector source is configured.
