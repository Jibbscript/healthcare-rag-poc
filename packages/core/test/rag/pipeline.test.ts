import { describe, expect, it } from 'vitest';
import { runChatPipeline } from '../../src';
import { createProviderBundle } from '../../../../apps/api/src/bootstrap';

describe('RAG pipeline', () => {
  it('answers with citations and audit trace without raw pii', async () => {
    const providers = await createProviderBundle('local');
    const response = await runChatPipeline({ sessionId: 'test', message: 'My member id ABC12345 asks what is the urgent care copay?', profile: 'local', debug: true }, providers);
    expect(response.refusal).toBe(false);
    expect(response.citations.length).toBeGreaterThan(0);
    const trace = await providers.auditStore.getTrace(response.traceId);
    expect(JSON.stringify(trace)).not.toContain('ABC12345');
    expect(trace?.input.redactedText).toContain('[REDACTED_MEMBER_ID]');
  });
  it('refuses medical advice before model answer', async () => {
    const providers = await createProviderBundle('local');
    const response = await runChatPipeline({ sessionId: 'test', message: 'Should I take antibiotics for chest pain?', profile: 'local' }, providers);
    expect(response.refusal).toBe(true);
    expect(response.refusalLabels).toContain('MEDICAL_OR_LEGAL_ADVICE');
  });
});
