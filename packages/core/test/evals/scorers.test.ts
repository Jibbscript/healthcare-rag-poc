import { describe, expect, it } from 'vitest';
import { scoreResponse } from '../../src';

describe('eval scorers', () => {
  it('fails pii leakage in responses', () => {
    const result = scoreResponse({ id: 'x', tags: [], input: 'x', expectedCitationIds: [], expectRefusal: false, expectPiiRedaction: false }, { answer: 'email a@example.com', citations: [], refusal: false, refusalLabels: [], guardrail: { action: 'allow', labels: [], evidence: [] }, traceId: 't' });
    expect(result.scores.find((s) => s.scorer === 'pii_leakage')?.passed).toBe(false);
  });
});
