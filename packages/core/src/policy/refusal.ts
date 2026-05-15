import type { GuardrailDecision, RetrievedChunk } from '../domain';

export type RefusalDecision = { refused: boolean; labels: string[]; answer?: string };

export function decideRefusal(input: { query: string; chunks: RetrievedChunk[]; guardrail: GuardrailDecision }): RefusalDecision {
  if (input.guardrail.action === 'block') {
    return { refused: true, labels: input.guardrail.labels, answer: 'I can’t help with that request. Please ask a benefits question based on public plan documents or contact the insurer for member-specific support.' };
  }
  if (/(diagnose|prescribe|medical advice|take antibiotics|chest pain|legal advice|lawsuit|appeal strategy)/i.test(input.query)) {
    return { refused: true, labels: ['MEDICAL_OR_LEGAL_ADVICE'], answer: 'I can’t provide medical or legal advice. For care decisions, contact a licensed clinician; for coverage decisions, contact the plan administrator.' };
  }
  if (/(my claim|my member|policyholder-specific|adjudicate|prior authorization for me)/i.test(input.query)) {
    return { refused: true, labels: ['MEMBER_SPECIFIC_ADJUDICATION'], answer: 'I can’t adjudicate member-specific coverage. Use the plan’s secure member portal or contact member services for account-specific details.' };
  }
  if (input.chunks.length === 0) {
    return { refused: true, labels: ['NO_RETRIEVED_EVIDENCE'], answer: 'I don’t have enough evidence in the provided public benefits documents to answer that. Try asking about a covered benefit listed in the demo corpus.' };
  }
  return { refused: false, labels: [] };
}

export function isRefusalAnswer(answer: string): boolean {
  return /^(I can[’']?t|I don[’']?t have enough|I do not have enough)|not enough evidence/i.test(answer);
}
