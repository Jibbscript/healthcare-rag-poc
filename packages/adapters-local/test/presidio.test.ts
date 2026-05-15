import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalPresidioGuardrail } from '../src';

describe('LocalPresidioGuardrail', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adds analyzer labels to regex guardrail decisions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [{ entity_type: 'EMAIL_ADDRESS' }] }));
    const guardrail = new LocalPresidioGuardrail({ analyzerUrl: 'http://presidio.local/' });

    await expect(guardrail.evaluateInput('email a@example.com')).resolves.toMatchObject({
      action: 'redact',
      labels: expect.arrayContaining(['EMAIL', 'PRESIDIO_EMAIL_ADDRESS'])
    });
  });

  it('falls back to regex guardrails when analyzer is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const guardrail = new LocalPresidioGuardrail({ analyzerUrl: 'http://presidio.local/' });

    await expect(guardrail.evaluateInput('member id ABC12345')).resolves.toMatchObject({
      action: 'redact',
      labels: expect.arrayContaining(['MEMBER_ID'])
    });
  });
});
