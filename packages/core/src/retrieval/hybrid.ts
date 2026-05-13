import type { Chunk, RetrievedChunk, RetrievalQuery } from '../domain';
import type { Retriever } from '../ports';
import { Bm25Index } from './bm25';

export class HybridRetriever implements Retriever {
  private readonly bm25: Bm25Index;
  constructor(private readonly chunks: Chunk[], private readonly vectorRetriever?: Retriever) {
    this.bm25 = new Bm25Index(chunks);
  }

  async retrieve(query: RetrievalQuery): Promise<RetrievedChunk[]> {
    const topK = query.topK ?? 5;
    const lexical = this.bm25.search(query.query, topK * 2);
    const semantic = this.vectorRetriever ? await this.vectorRetriever.retrieve({ ...query, topK: topK * 2 }) : [];
    const fused = reciprocalRankFusion([lexical, semantic], topK);
    return fused;
  }
}

export function reciprocalRankFusion(lists: RetrievedChunk[][], topK: number, k = 60): RetrievedChunk[] {
  const merged = new Map<string, RetrievedChunk>();
  for (const list of lists) {
    list.forEach((chunk, rank) => {
      const current = merged.get(chunk.chunkId);
      const contribution = 1 / (k + rank + 1);
      if (!current) {
        merged.set(chunk.chunkId, { ...chunk, fusedScore: contribution, componentScores: { ...chunk.componentScores, rrf: contribution } });
      } else {
        current.fusedScore = (current.fusedScore ?? 0) + contribution;
        current.score = Math.max(current.score, chunk.score);
        current.componentScores = { ...current.componentScores, ...chunk.componentScores, rrf: current.fusedScore };
      }
    });
  }
  return [...merged.values()].sort((a, b) => (b.fusedScore ?? b.score) - (a.fusedScore ?? a.score)).slice(0, topK);
}

export function makeInMemoryRetriever(chunks: Chunk[]): HybridRetriever {
  return new HybridRetriever(chunks);
}
