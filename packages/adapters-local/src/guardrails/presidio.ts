import { RegexGuardrail, type GuardrailDecision } from '@healthcare-rag/core';

export class LocalPresidioGuardrail extends RegexGuardrail {
  constructor(private readonly config?: { analyzerUrl?: string }) { super(); }
  override async evaluateInput(text: string): Promise<GuardrailDecision> {
    if (!this.config?.analyzerUrl) return super.evaluateInput(text);
    try {
      const response = await fetch(`${this.config.analyzerUrl.replace(/\/$/, '')}/analyze`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, language: 'en' }) });
      if (!response.ok) return super.evaluateInput(text);
      const entities = await response.json() as Array<{ entity_type: string }>;
      const base = await super.evaluateInput(text);
      const labels = [...new Set([...base.labels, ...entities.map((e) => `PRESIDIO_${e.entity_type}`)])];
      return labels.length ? { ...base, action: base.action === 'allow' ? 'redact' : base.action, labels } : base;
    } catch { return super.evaluateInput(text); }
  }
}
