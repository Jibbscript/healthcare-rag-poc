import { describe, expect, it } from 'vitest';
import { BedrockGuardrailAdapter, BedrockEmbeddingProvider, BedrockLlmAdapter } from '../src';

describe('aws adapters', () => {
  it('keeps guardrails disabled unless env config is supplied', async () => {
    const guardrail = new BedrockGuardrailAdapter();
    await expect(guardrail.evaluateOutput('normal output')).resolves.toMatchObject({ action: 'allow' });
  });
  it('supports lexical-only embedding fallback', async () => {
    const provider = new BedrockEmbeddingProvider({ region: 'us-east-1', modelId: 'x', enabled: false });
    await expect(provider.embed(['hello'])).resolves.toMatchObject({ modelId: 'lexical-only', dimension: 0 });
  });
  it('constructs the Bedrock LLM adapter with explicit runtime config only', () => {
    expect(new BedrockLlmAdapter({ region: 'us-east-1', modelId: 'x' })).toBeInstanceOf(BedrockLlmAdapter);
  });
});
