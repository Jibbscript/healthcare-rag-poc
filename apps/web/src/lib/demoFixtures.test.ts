import { describe, expect, it } from 'vitest';
import { parseChatResponse } from '@healthcare-rag/core';
import { demoPrompts } from './demoPrompts';
import { demoFixtureResponses, getDemoFixtureResponse } from './demoFixtures';

describe('demo fixture playback', () => {
  it('ships schema-valid fixture responses for each prompt', () => {
    for (const response of Object.values(demoFixtureResponses)) {
      expect(parseChatResponse(response).ok).toBe(true);
    }
  });

  it('returns a cited urgent care answer without calling a backend', () => {
    const prompt = demoPrompts.find((item) => item.id === 'covered');
    if (!prompt) throw new Error('covered prompt missing');

    const response = getDemoFixtureResponse({ prompt, message: prompt.message });

    expect(response.answer).toContain('$40 copay');
    expect(response.refusal).toBe(false);
    expect(response.citations[0]).toMatchObject({ docId: 'wellmark-ppo-2026', citationId: 'C1' });
    expect(response.traceId).toBe('trace_fixture_covered');
  });

  it('keeps member-id fixture output redacted', () => {
    const prompt = demoPrompts.find((item) => item.id === 'pii');
    if (!prompt) throw new Error('pii prompt missing');

    const response = getDemoFixtureResponse({ prompt, message: prompt.message });
    const serialized = JSON.stringify(response);

    expect(response.guardrail).toMatchObject({ action: 'redact', labels: ['MEMBER_ID'] });
    expect(serialized).toContain('[REDACTED_MEMBER_ID]');
    expect(serialized).not.toContain('ABC12345');
  });

  it('does not echo custom fixture text into no-evidence responses', () => {
    const response = getDemoFixtureResponse({ prompt: demoPrompts[0], message: 'member id ABC12345 needs a custom answer' });

    expect(response.refusal).toBe(true);
    expect(response.refusalLabels).toContain('FIXTURE_CASE_NOT_FOUND');
    expect(JSON.stringify(response)).not.toContain('ABC12345');
  });
});
