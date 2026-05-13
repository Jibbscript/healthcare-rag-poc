import { RegexGuardrail, type GuardrailDecision } from '@healthcare-rag/core';

export type BedrockGuardrailConfig = { guardrailIdentifier?: string; guardrailVersion?: string };

export class BedrockGuardrailAdapter extends RegexGuardrail {
  constructor(readonly config: BedrockGuardrailConfig = {}) { super(); }
  override async evaluateOutput(text: string): Promise<GuardrailDecision> {
    const local = await super.evaluateOutput(text);
    if (this.config.guardrailIdentifier && /BLOCKED_BY_BEDROCK_GUARDRAIL/i.test(text)) {
      return { action: 'block', labels: ['BEDROCK_GUARDRAIL_BLOCK'], rationale: 'Bedrock guardrail indicated a block.', evidence: [] };
    }
    return local;
  }
}
