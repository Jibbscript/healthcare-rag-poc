import { describe, expect, it } from 'vitest';
import { assembleCitations, checkCitationCoverage } from '../../src';
import { HybridRetriever } from '../../src';
import { fixtureChunks } from '@healthcare-rag/test-fixtures';

describe('citations', () => {
  it('renders without fabricating missing pages', async () => {
    const chunks = await new HybridRetriever(fixtureChunks).retrieve({ query: 'urgent care copay', profile: 'local', topK: 2 });
    const citations = assembleCitations(chunks);
    expect(citations[0].rendered).toContain('Wellmark');
    expect(checkCitationCoverage('Urgent care is covered with a copay.', citations).passed).toBe(true);
  });
});
