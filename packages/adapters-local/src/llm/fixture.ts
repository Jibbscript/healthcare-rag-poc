import type { Llm, RetrievedChunk } from '@healthcare-rag/core';
import { estimateTokens } from '@healthcare-rag/core';

export class FixtureLlm implements Llm {
  async generate(input: { contextChunks: RetrievedChunk[] }): Promise<{ text: string; modelId: string; provider: string; estimatedInputTokens?: number; estimatedOutputTokens?: number }> {
    const top = input.contextChunks[0];
    const text = top ? `Based on the provided public benefits evidence, ${summarize(top.text)} [C1]` : 'I don’t have enough evidence in the provided public benefits documents to answer that.';
    return { text, modelId: 'fixture-local-llm', provider: 'fixture', estimatedInputTokens: estimateTokens(input.contextChunks.map((c) => c.text).join('\n')), estimatedOutputTokens: estimateTokens(text) };
  }
}
function summarize(text: string): string { return text.replace(/^#+\s+.*$/gm, '').replace(/\s+/g, ' ').trim().slice(0, 320); }
