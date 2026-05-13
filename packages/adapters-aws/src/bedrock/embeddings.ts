import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import type { EmbeddingProvider } from '@healthcare-rag/core';

export class BedrockEmbeddingProvider implements EmbeddingProvider {
  private readonly client: BedrockRuntimeClient;
  constructor(private readonly config: { region: string; modelId: string; enabled: boolean; dimension?: number }) { this.client = new BedrockRuntimeClient({ region: config.region }); }
  async embed(texts: string[]): Promise<{ vectors: number[][]; modelId: string; dimension: number }> {
    if (!this.config.enabled) return { vectors: texts.map(() => []), modelId: 'lexical-only', dimension: 0 };
    const vectors: number[][] = [];
    for (const inputText of texts) {
      const out = await this.client.send(new InvokeModelCommand({ modelId: this.config.modelId, body: Buffer.from(JSON.stringify({ inputText })), contentType: 'application/json', accept: 'application/json' }));
      const json = JSON.parse(Buffer.from(out.body ?? new Uint8Array()).toString('utf8')) as { embedding?: number[] };
      vectors.push(json.embedding ?? []);
    }
    const dimension = this.config.dimension ?? vectors[0]?.length ?? 0;
    if (vectors.some((v) => v.length !== dimension)) throw new Error('Bedrock embedding dimension mismatch');
    return { vectors, modelId: this.config.modelId, dimension };
  }
}
