import { describe, expect, it, vi } from 'vitest';
import { CloudWatchEmfDdbEvalSink } from '../src';

describe('CloudWatchEmfDdbEvalSink', () => {
  it('emits aggregate EMF metrics without raw eval payloads', async () => {
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      await new CloudWatchEmfDdbEvalSink().writeRun({
        runId: 'run1',
        results: [{ caseId: 'case1', passed: true, scores: [], responseHash: 'hash1', traceId: 'trace1' }],
        summary: { rawInput: 'member id ABC12345', rawAnswer: 'covered answer text' }
      });
      const output = write.mock.calls.map(([chunk]) => String(chunk)).join('');
      expect(output).toContain('PassRate');
      expect(output).toContain('Cases');
      expect(output).not.toContain('ABC12345');
      expect(output).not.toContain('covered answer text');
      expect(output).not.toContain('case1');
    } finally {
      write.mockRestore();
    }
  });
});
