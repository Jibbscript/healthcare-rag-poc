import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { estimateTokens, type Llm, type LlmMessage, type RetrievedChunk } from '@healthcare-rag/core';

export class BedrockLlmAdapter implements Llm {
  private readonly client: BedrockRuntimeClient;
  constructor(private readonly config: { region: string; modelId: string; timeoutMs?: number; guardrailIdentifier?: string; guardrailVersion?: string }) {
    this.client = new BedrockRuntimeClient({ region: config.region, requestHandler: undefined });
  }
  async generate(input: { messages: LlmMessage[]; contextChunks: RetrievedChunk[] }): Promise<{ text: string; modelId: string; provider: string; estimatedInputTokens?: number; estimatedOutputTokens?: number }> {
    const prompt = input.messages.map((message) => `${message.role}: ${message.content}`).join('\n');
    const body = JSON.stringify({ anthropic_version: 'bedrock-2023-05-31', max_tokens: 700, temperature: 0.1, messages: [{ role: 'user', content: prompt }] });
    const response = await this.client.send(new InvokeModelCommand({
      modelId: this.config.modelId,
      body: Buffer.from(body),
      contentType: 'application/json',
      accept: 'application/json',
      guardrailIdentifier: this.config.guardrailIdentifier,
      guardrailVersion: this.config.guardrailVersion
    }));
    const json = JSON.parse(Buffer.from(response.body ?? new Uint8Array()).toString('utf8')) as { content?: Array<{ text?: string }>; outputText?: string };
    const text = json.outputText ?? json.content?.map((part) => part.text).filter(Boolean).join('\n') ?? '';
    return { text, modelId: this.config.modelId, provider: 'bedrock-runtime', estimatedInputTokens: estimateTokens(prompt), estimatedOutputTokens: estimateTokens(text) };
  }
}
