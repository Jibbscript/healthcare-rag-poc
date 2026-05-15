import { describe, expect, it } from 'vitest';
import { scoreResponse } from '../../src';

describe('eval scorers', () => {
  it('fails pii leakage in responses', () => {
    const result = scoreResponse({ id: 'x', tags: [], input: 'x', expectedCitationIds: [], expectRefusal: false, expectPiiRedaction: false }, { answer: 'email a@example.com', citations: [], refusal: false, refusalLabels: [], guardrail: { action: 'allow', labels: [], evidence: [] }, traceId: 't' });
    expect(result.scores.find((s) => s.scorer === 'pii_leakage')?.passed).toBe(false);
  });

  it('passes citation coverage for refusal answers without citations', () => {
    const result = scoreResponse({ id: 'x', tags: [], input: 'x', expectedCitationIds: ['missing-doc'], expectRefusal: true, expectPiiRedaction: false }, { answer: 'I can’t answer that safely from the provided evidence.', citations: [], refusal: true, refusalLabels: ['NO_RETRIEVED_EVIDENCE'], guardrail: { action: 'allow', labels: [], evidence: [] }, traceId: 't' });
    expect(result.scores.find((s) => s.scorer === 'citation_coverage')?.passed).toBe(true);
  });
});
