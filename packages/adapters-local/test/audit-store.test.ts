import { describe, expect, it } from 'vitest';
import { InMemoryAuditStore } from '../src';
import { assembleAuditTrace } from '@healthcare-rag/core';

describe('audit store', () => {
  it('stores and queries redacted traces', async () => {
    const store = new InMemoryAuditStore();
    const trace = assembleAuditTrace({ traceId: 'trace1', sessionId: 's', turnId: 't', profile: 'local', createdAt: new Date().toISOString(), userText: 'member id ABC12345', userRedactedText: '[REDACTED_MEMBER_ID]', guardrail: { action: 'redact', labels: ['MEMBER_ID'], evidence: [] }, chunks: [], citations: [], refusal: { refused: false, labels: [] } });
    await store.putTrace(trace);
    expect(await store.getTrace('trace1')).toMatchObject({ traceId: 'trace1' });
    expect(await store.querySession('s')).toHaveLength(1);
    expect(JSON.stringify(await store.getTrace('trace1'))).not.toContain('ABC12345');
  });
});
