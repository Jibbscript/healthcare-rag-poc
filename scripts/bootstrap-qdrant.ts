import { QdrantRetrieverAdapter } from '@healthcare-rag/adapters-local';
const adapter = new QdrantRetrieverAdapter({ url: process.env.QDRANT_URL ?? 'http://127.0.0.1:6333', collection: process.env.QDRANT_COLLECTION ?? 'benefits_chunks', vectorSize: Number(process.env.EMBEDDING_DIM ?? 8) });
await adapter.bootstrap();
process.stdout.write('qdrant collection bootstrapped\n');
