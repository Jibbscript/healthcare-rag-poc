import { describe, expect, it } from 'vitest';
import type { ChatResponse } from '@healthcare-rag/core';
import { ChatClientError } from './apiClient';
import { apiStatusText, citationCountLabel, errorHeading, requestStateForResponse } from './viewModels';

const response: ChatResponse = {
  answer: 'Answer with evidence.',
  citations: [
    {
      citationId: 'C1',
      chunkId: 'chunk-1',
      docId: 'doc-1',
      title: 'Fixture plan',
      sourceLabel: 'Fixture',
      sourceUri: 'fixture.md',
      rendered: 'Fixture plan'
    }
  ],
  refusal: false,
  refusalLabels: [],
  guardrail: { action: 'allow', labels: [], evidence: [] },
  traceId: 'trace-1'
};

describe('view models', () => {
  it('maps response states', () => {
    expect(requestStateForResponse(response)).toBe('success');
    expect(requestStateForResponse({ ...response, refusal: true })).toBe('refusal');
  });

  it('describes local and configured API state', () => {
    expect(apiStatusText({ state: 'idle', profile: 'local', apiBaseUrl: '' })).toBe('Local fixture profile');
    expect(apiStatusText({ state: 'idle', profile: 'aws-smoke', apiBaseUrl: '' })).toBe('AWS smoke target required');
    expect(apiStatusText({ state: 'success', profile: 'local', apiBaseUrl: 'https://api.example.test' })).toBe('local API configured');
  });

  it('formats errors and citations', () => {
    expect(errorHeading(new ChatClientError('network_error', 'The API could not be reached.'))).toBe('API unreachable');
    expect(errorHeading(new ChatClientError('api_error', 'Unauthorized', 401, 'trace-denied'))).toBe('API key required');
    expect(citationCountLabel(null)).toBe('No citations');
    expect(citationCountLabel(response)).toBe('1 citation');
  });
});
