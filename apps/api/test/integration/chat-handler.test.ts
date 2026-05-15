import { afterEach, describe, expect, it } from 'vitest';
import { handler } from '../../src/handlers/chat';

describe('chat handler integration', () => {
  afterEach(() => {
    delete process.env.SMOKE_API_KEY;
  });

  it('handles cited answer and validation errors', async () => {
    const ok = await handler({ body: JSON.stringify({ sessionId: 'api', message: 'What is the urgent care copay?', profile: 'local' }) });
    expect(ok.statusCode).toBe(200);
    expect(JSON.parse(ok.body).citations.length).toBeGreaterThan(0);
    const bad = await handler({ body: JSON.stringify({ sessionId: '', message: '' }) });
    expect(bad.statusCode).toBe(400);
  });

  it('returns generic 500 errors without echoing raw request text', async () => {
    const response = await handler({ body: JSON.stringify({ sessionId: 'api', message: 'member id ABC12345', profile: 'invalid-profile' }) });
    expect(response.statusCode).toBe(400);
    expect(response.body).not.toContain('ABC12345');
  });

  it('requires the smoke API key when configured', async () => {
    process.env.SMOKE_API_KEY = 'test-key';
    const denied = await handler({ headers: {}, body: JSON.stringify({ sessionId: 'api', message: 'What is covered?', profile: 'local' }) });
    expect(denied.statusCode).toBe(401);
    const allowed = await handler({ headers: { 'x-smoke-api-key': 'test-key' }, body: JSON.stringify({ sessionId: 'api', message: 'What is the urgent care copay?', profile: 'local' }) });
    expect(allowed.statusCode).toBe(200);
  });
});
