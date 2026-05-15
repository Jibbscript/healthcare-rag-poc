import { describe, expect, it, vi } from 'vitest';
import { fixtureChunks } from '@healthcare-rag/test-fixtures';
import { QdrantRetrieverAdapter } from '../src';

function makeClient(search = vi.fn()) {
  return {
    search,
    getCollections: vi.fn(),
    createCollection: vi.fn(),
    upsert: vi.fn()
  };
}

describe('QdrantRetrieverAdapter', () => {
  it('searches with an injected query vector and maps Qdrant payloads to retrieved chunks', async () => {
    const chunk = fixtureChunks[0];
    const search = vi.fn().mockResolvedValue([{ score: 0.91, payload: { ...chunk, embedding: undefined } }]);
    const adapter = new QdrantRetrieverAdapter({
      url: 'http://qdrant.local',
      collection: 'benefits_chunks',
      vectorSize: 3,
      queryVector: async () => [0.1, 0.2, 0.3],
      client: makeClient(search)
    });

    const results = await adapter.retrieve({ query: 'urgent care copay', profile: 'local', topK: 2, filters: { planId: 'wellmark-ppo' } });

    expect(search).toHaveBeenCalledWith('benefits_chunks', {
      vector: [0.1, 0.2, 0.3],
      limit: 2,
      filter: { must: [{ key: 'planId', match: { value: 'wellmark-ppo' } }] },
      with_payload: true,
      with_vector: false
    });
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      chunkId: chunk.chunkId,
      docId: chunk.docId,
      score: 0.91,
      componentScores: { qdrant: 0.91 }
    });
  });

  it('throws before search when no vector source is configured', async () => {
    const client = makeClient();
    const adapter = new QdrantRetrieverAdapter({ url: 'http://qdrant.local', collection: 'benefits_chunks', vectorSize: 3, client });

    await expect(adapter.retrieve({ query: 'urgent care', profile: 'local', topK: 5 })).rejects.toThrow(/vector source/i);
    expect(client.search).not.toHaveBeenCalled();
  });

  it('throws before search for dimension mismatches and non-finite vectors', async () => {
    const dimensionClient = makeClient();
    const dimensionAdapter = new QdrantRetrieverAdapter({ url: 'http://qdrant.local', collection: 'benefits_chunks', vectorSize: 3, queryVector: async () => [0.1, 0.2], client: dimensionClient });
    await expect(dimensionAdapter.retrieve({ query: 'urgent care', profile: 'local', topK: 5 })).rejects.toThrow(/dimension/i);
    expect(dimensionClient.search).not.toHaveBeenCalled();

    const finiteClient = makeClient();
    const finiteAdapter = new QdrantRetrieverAdapter({ url: 'http://qdrant.local', collection: 'benefits_chunks', vectorSize: 3, queryVector: async () => [0.1, Number.NaN, 0.3], client: finiteClient });
    await expect(finiteAdapter.retrieve({ query: 'urgent care', profile: 'local', topK: 5 })).rejects.toThrow(/finite/i);
    expect(finiteClient.search).not.toHaveBeenCalled();
  });

  it('validates embedding provider output count and payload shape', async () => {
    const countClient = makeClient();
    const countAdapter = new QdrantRetrieverAdapter({
      url: 'http://qdrant.local',
      collection: 'benefits_chunks',
      vectorSize: 3,
      embeddingProvider: { embed: async () => ({ vectors: [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]], modelId: 'test', dimension: 3 }) },
      client: countClient
    });
    await expect(countAdapter.retrieve({ query: 'urgent care', profile: 'local', topK: 5 })).rejects.toThrow(/one query vector/i);
    expect(countClient.search).not.toHaveBeenCalled();

    const payloadClient = makeClient(vi.fn().mockResolvedValue([{ score: 0.5, payload: { chunkId: 'missing-required-fields' } }]));
    const payloadAdapter = new QdrantRetrieverAdapter({ url: 'http://qdrant.local', collection: 'benefits_chunks', vectorSize: 3, queryVector: async () => [0.1, 0.2, 0.3], client: payloadClient });
    await expect(payloadAdapter.retrieve({ query: 'urgent care', profile: 'local', topK: 5 })).rejects.toThrow(/payload/i);
  });
});
