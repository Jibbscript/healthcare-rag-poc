import { describe, expect, it } from 'vitest';
import { HybridRetriever } from '../../src';
import { fixtureChunks } from '@healthcare-rag/test-fixtures';

describe('hybrid retriever', () => {
  it('returns scored chunks with component scores', async () => {
    const results = await new HybridRetriever(fixtureChunks).retrieve({ query: 'urgent care copay', profile: 'local', topK: 3 });
    expect(results[0].docId).toBe('wellmark-ppo-2026');
    expect(results[0].componentScores).toBeTruthy();
    expect(results[0].fusedScore).toBeGreaterThan(0);
  });
});
