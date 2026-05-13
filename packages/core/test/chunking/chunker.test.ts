import { describe, expect, it } from 'vitest';
import { chunkDocument } from '../../src';
import { fixtureDocuments } from '@healthcare-rag/test-fixtures';

describe('chunking', () => {
  it('is deterministic and preserves citation anchors', () => {
    const a = chunkDocument(fixtureDocuments[0], { targetChars: 200, overlapChars: 20 });
    const b = chunkDocument(fixtureDocuments[0], { targetChars: 200, overlapChars: 20 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a[0]).toMatchObject({ docId: 'wellmark-ppo-2026', charStart: expect.any(Number), charEnd: expect.any(Number) });
    expect(a.some((chunk) => typeof chunk.page === 'number')).toBe(true);
  });
});
