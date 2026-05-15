import { QdrantClient } from '@qdrant/js-client-rest';
import { chunkSchema, CoreError, type Chunk, type EmbeddingProvider, type RetrievedChunk, type RetrievalQuery, type Retriever } from '@healthcare-rag/core';

type QueryVector = (queryText: string) => number[] | Promise<number[]>;
type QdrantClientLike = Pick<QdrantClient, 'getCollections' | 'createCollection' | 'upsert' | 'search'>;
export type QdrantRetrieverConfig = {
  url: string;
  collection: string;
  vectorSize: number;
  embeddingProvider?: EmbeddingProvider;
  queryVector?: QueryVector;
  client?: QdrantClientLike;
};

export class QdrantRetrieverAdapter implements Retriever {
  private readonly client: QdrantClientLike;
  constructor(private readonly config: QdrantRetrieverConfig) {
    this.client = config.client ?? new QdrantClient({ url: config.url });
  }
  async bootstrap(): Promise<void> {
    const collections = await this.client.getCollections();
    if (!collections.collections.some((item) => item.name === this.config.collection)) {
      await this.client.createCollection(this.config.collection, { vectors: { size: this.config.vectorSize, distance: 'Cosine' } });
    }
  }
  async upsertChunks(chunks: Chunk[]): Promise<void> {
    await this.client.upsert(this.config.collection, { points: chunks.map((chunk, idx) => ({ id: idx + 1, vector: chunk.embedding ?? Array(this.config.vectorSize).fill(0), payload: { ...chunk, embedding: undefined } })) });
  }
  async retrieve(query: RetrievalQuery): Promise<RetrievedChunk[]> {
    const vector = await this.queryVector(query.query);
    const results = await this.client.search(this.config.collection, {
      vector,
      limit: query.topK ?? 5,
      filter: qdrantFilter(query.filters),
      with_payload: true,
      with_vector: false
    });
    return results.map((point) => {
      const chunk = chunkSchema.safeParse(point.payload);
      if (!chunk.success) throw new CoreError('provider', 'Qdrant payload did not match the expected chunk payload shape');
      const score = point.score ?? 0;
      return { ...chunk.data, score, componentScores: { qdrant: score } };
    });
  }

  private async queryVector(queryText: string): Promise<number[]> {
    if (this.config.queryVector) return validateVector(await this.config.queryVector(queryText), this.config.vectorSize);
    if (!this.config.embeddingProvider) throw new CoreError('provider', 'QdrantRetrieverAdapter requires an embeddingProvider or queryVector vector source');

    const result = await this.config.embeddingProvider.embed([queryText]);
    if (result.vectors.length !== 1) throw new CoreError('provider', 'QdrantRetrieverAdapter expected exactly one query vector from embeddingProvider');
    return validateVector(result.vectors[0], this.config.vectorSize);
  }
}

function validateVector(vector: number[], vectorSize: number): number[] {
  if (vector.length !== vectorSize) throw new CoreError('provider', `Qdrant query vector dimension mismatch: expected ${vectorSize}, received ${vector.length}`);
  if (vector.some((value) => !Number.isFinite(value))) throw new CoreError('provider', 'Qdrant query vector must contain only finite numeric values');
  return vector;
}

function qdrantFilter(filters: RetrievalQuery['filters']): Record<string, unknown> | undefined {
  const entries = Object.entries(filters ?? {});
  if (!entries.length) return undefined;
  return { must: entries.map(([key, value]) => ({ key, match: { value } })) };
}
