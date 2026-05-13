export type PriceTable = Record<string, { inputPer1k: number; outputPer1k: number; note: string }>;

export function estimateTokens(text: string): number { return Math.ceil(text.length / 4); }

export function estimateCost(input: { modelId?: string; inputTokens: number; outputTokens: number; prices?: PriceTable }): { available: boolean; amountUsd?: number; rationale: string } {
  if (!input.modelId || !input.prices?.[input.modelId]) return { available: false, rationale: 'Approximate price unavailable for model id; not inventing current pricing.' };
  const price = input.prices[input.modelId];
  return { available: true, amountUsd: (input.inputTokens / 1000) * price.inputPer1k + (input.outputTokens / 1000) * price.outputPer1k, rationale: `Approximate estimate using configured static table: ${price.note}` };
}
