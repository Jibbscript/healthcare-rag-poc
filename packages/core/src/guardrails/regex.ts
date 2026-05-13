import type { GuardrailDecision } from '../domain';
import type { Guardrail } from '../ports';
import { redactText } from '../utils/redact';
import { sha256 } from '../utils/hash';

const blockPatterns: Array<[RegExp, string]> = [
  [/ignore\s+(all\s+)?(previous|prior)\s+instructions/i, 'PROMPT_INJECTION'],
  [/reveal\s+(the\s+)?(system|developer)\s+prompt/i, 'PROMPT_INJECTION'],
  [/member\s*id.*(exfiltrate|dump|list|all)/i, 'MEMBER_ID_EXFILTRATION'],
  [/(diagnose|prescribe|what medicine should i take|take antibiotics|chest pain|legal advice|sue my insurer)/i, 'MEDICAL_OR_LEGAL_ADVICE']
];

export class RegexGuardrail implements Guardrail {
  async evaluateInput(text: string): Promise<GuardrailDecision> {
    return evaluate(text);
  }
  async evaluateOutput(text: string): Promise<GuardrailDecision> {
    return evaluate(text);
  }
}

export function evaluate(text: string): GuardrailDecision {
  const block = blockPatterns.find(([pattern]) => pattern.test(text));
  const redacted = redactText(text);
  const evidence = redacted.labels.map((label) => ({ label, spanHash: sha256(label + ':' + text).slice(0, 16) }));
  if (block) {
    return { action: 'block', redactedText: redacted.redactedText, labels: [block[1], ...redacted.labels], rationale: 'Request matched deterministic safety policy.', evidence };
  }
  if (redacted.labels.length) {
    return { action: 'redact', redactedText: redacted.redactedText, labels: redacted.labels, rationale: 'PII-like text was redacted.', evidence };
  }
  return { action: 'allow', labels: [], evidence: [] };
}
