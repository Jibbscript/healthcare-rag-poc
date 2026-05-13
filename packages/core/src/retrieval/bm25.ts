import type { Chunk, RetrievedChunk } from '../domain';

const stopwords = new Set(['what','is','the','a','an','of','for','to','and','or','in','on','my','does','with','after']);
export function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((token) => token.length > 1 && !stopwords.has(token));
}

export class Bm25Index {
  private readonly docTokens: string[][];
  private readonly avgLen: number;
  private readonly df = new Map<string, number>();
  constructor(private readonly chunks: Chunk[]) {
    this.docTokens = chunks.map((chunk) => tokenize(`${chunk.title} ${chunk.section ?? ''} ${chunk.text}`));
    this.avgLen = this.docTokens.reduce((sum, tokens) => sum + tokens.length, 0) / Math.max(1, this.docTokens.length);
    for (const tokens of this.docTokens) {
      for (const token of new Set(tokens)) this.df.set(token, (this.df.get(token) ?? 0) + 1);
    }
  }

  search(query: string, topK = 5): RetrievedChunk[] {
    const q = tokenize(query);
    const k1 = 1.2;
    const b = 0.75;
    const scores = this.chunks.map((chunk, idx) => {
      const tokens = this.docTokens[idx];
      const tf = new Map<string, number>();
      for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);
      let score = 0;
      for (const token of q) {
        const freq = tf.get(token) ?? 0;
        if (!freq) continue;
        const idf = Math.log(1 + (this.chunks.length - (this.df.get(token) ?? 0) + 0.5) / ((this.df.get(token) ?? 0) + 0.5));
        score += idf * ((freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (tokens.length / Math.max(1, this.avgLen)))));
      }
      return { ...chunk, score, componentScores: { bm25: score } } satisfies RetrievedChunk;
    });
    return scores.filter((chunk) => chunk.score > 0).sort((a, b2) => b2.score - a.score).slice(0, topK);
  }
}
