import { describe, expect, it } from 'vitest';
import { ChatPipelineError, runChatPipeline } from '../../src';
import { createProviderBundle } from '../../../../apps/api/src/bootstrap';

describe('RAG pipeline', () => {
  it('answers with citations and audit trace without raw pii', async () => {
    const providers = await createProviderBundle('local');
    const response = await runChatPipeline({ sessionId: 'test', message: 'My member id ABC12345 asks what is the urgent care copay?', profile: 'local', debug: true }, providers);
    expect(response.refusal).toBe(false);
    expect(response.citations.length).toBeGreaterThan(0);
    const trace = await providers.auditStore.getTrace(response.traceId);
    expect(JSON.stringify(trace)).not.toContain('ABC12345');
    expect(JSON.stringify(trace)).not.toContain('"sessionId"');
    expect(trace?.input.redactedText).toContain('[REDACTED_MEMBER_ID]');
  });
  it('refuses medical advice before model answer', async () => {
    const providers = await createProviderBundle('local');
    const response = await runChatPipeline({ sessionId: 'test', message: 'Should I take antibiotics for chest pain?', profile: 'local' }, providers);
    expect(response.refusal).toBe(true);
    expect(response.refusalLabels).toContain('MEDICAL_OR_LEGAL_ADVICE');
  });
  it('records sanitized model_error traces on provider failure', async () => {
    const providers = await createProviderBundle('local');
    providers.llm = { async generate() { throw new Error('raw model failure with member id ABC12345'); } };
    await expect(runChatPipeline({ sessionId: 'test', message: 'What is the urgent care copay?', profile: 'local' }, providers)).rejects.toBeInstanceOf(ChatPipelineError);
    const traces = await providers.auditStore.querySession('test');
    expect(traces).toHaveLength(1);
    expect(traces[0]).toMatchObject({ status: 'model_error' });
    expect(JSON.stringify(traces[0])).not.toContain('ABC12345');
  });
  it('rejects provider/request profile mismatches before retrieval', async () => {
    const providers = await createProviderBundle('local');
    await expect(runChatPipeline({ sessionId: 'test', message: 'What is covered?' }, providers)).rejects.toThrow(/provider profile local does not match request profile aws-smoke/);
  });
});
