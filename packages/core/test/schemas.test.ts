import { describe, expect, it } from 'vitest';
import { auditTraceSchema, chunkSchema, safeParse } from '../src';
import { fixtureChunks } from '@healthcare-rag/test-fixtures';

describe('domain schemas', () => {
  it('validates fixture chunks with citation metadata', () => {
    const parsed = safeParse(chunkSchema, fixtureChunks[0]);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value).toMatchObject({ docId: expect.any(String), charStart: expect.any(Number), checksum: expect.any(String), sourceUri: expect.any(String) });
  });
  it('audit trace shape forbids rawPrompt field', () => {
    const base = { traceId: 'trace1', sessionHash: 'abcdefghi', turnId: 't1', profile: 'local', createdAt: new Date().toISOString(), userHash: 'abcdefghi', input: { inputHash: 'abcdefghi' }, retrieval: { queryHash: 'abcdefghi', chunks: [] }, model: {}, citations: [], refusal: { refused: false, labels: [] }, evalInline: [], timingsMs: {}, status: 'success' };
    expect(() => auditTraceSchema.parse({ ...base, rawPrompt: 'do not store' })).toThrow();
  });
});
