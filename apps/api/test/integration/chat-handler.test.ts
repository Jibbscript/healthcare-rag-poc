import { describe, expect, it } from 'vitest';
import { handler } from '../../src/handlers/chat';

describe('chat handler integration', () => {
  it('handles cited answer and validation errors', async () => {
    const ok = await handler({ body: JSON.stringify({ sessionId: 'api', message: 'What is the urgent care copay?', profile: 'local' }) });
    expect(ok.statusCode).toBe(200);
    expect(JSON.parse(ok.body).citations.length).toBeGreaterThan(0);
    const bad = await handler({ body: JSON.stringify({ sessionId: '', message: '' }) });
    expect(bad.statusCode).toBe(400);
  });
});
