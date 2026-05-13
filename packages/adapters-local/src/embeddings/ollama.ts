import type { EmbeddingProvider } from '@healthcare-rag/core';
import { sha256 } from '@healthcare-rag/core';

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  constructor(private readonly config: { baseUrl: string; model: string; dimension?: number }) {}
  async embed(texts: string[]): Promise<{ vectors: number[][]; modelId: string; dimension: number }> {
    const vectors: number[][] = [];
    for (const input of texts) {
      const res = await fetch(`${this.config.baseUrl.replace(/\/$/, '')}/api/embed`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: this.config.model, input }) });
      if (!res.ok) throw new Error(`Ollama embed failed with ${res.status}`);
      const json = await res.json() as { embeddings?: number[][]; embedding?: number[] };
      vectors.push(json.embeddings?.[0] ?? json.embedding ?? []);
    }
    const dimension = this.config.dimension ?? vectors[0]?.length ?? 0;
    if (vectors.some((vector) => vector.length !== dimension)) throw new Error('Embedding dimension mismatch');
    return { vectors, modelId: this.config.model, dimension };
  }
}

export class FixtureEmbeddingProvider implements EmbeddingProvider {
  constructor(private readonly dimension = 8, private readonly modelId = 'fixture-hash-embedding') {}
  async embed(texts: string[]): Promise<{ vectors: number[][]; modelId: string; dimension: number }> {
    return { vectors: texts.map((text) => hashVector(text, this.dimension)), modelId: this.modelId, dimension: this.dimension };
  }
}

export function hashVector(text: string, dimension: number): number[] {
  const hash = sha256(text);
  return Array.from({ length: dimension }, (_, i) => parseInt(hash.slice(i * 2, i * 2 + 2), 16) / 255);
}
