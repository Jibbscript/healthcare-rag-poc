import { describe, expect, it } from 'vitest';
import { decideRefusal } from '../../src';

describe('refusal policy', () => {
  it('refuses no evidence and member-specific adjudication', () => {
    expect(decideRefusal({ query: 'orthodontia maximum', chunks: [], guardrail: { action: 'allow', labels: [], evidence: [] } }).labels).toContain('NO_RETRIEVED_EVIDENCE');
    expect(decideRefusal({ query: 'adjudicate my claim', chunks: [], guardrail: { action: 'allow', labels: [], evidence: [] } }).labels).toContain('MEMBER_SPECIFIC_ADJUDICATION');
  });
});
