import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import type { ChatResponse } from '@healthcare-rag/core';
import AnswerPanel from './AnswerPanel.svelte';
import CitationList from './CitationList.svelte';
import TracePanel from './TracePanel.svelte';

const successResponse: ChatResponse = {
  answer: 'Based on the provided public benefits evidence, urgent care has a $40 copay. [C1]',
  citations: [
    {
      citationId: 'C1',
      chunkId: 'chunk-1',
      docId: 'wellmark-ppo-2026',
      title: 'Wellmark PPO Demo Benefits 2026',
      sourceLabel: 'Public demo SBC',
      sourceUri: 'corpus/fixtures/wellmark-ppo-2026.md',
      page: 1,
      rendered: 'Wellmark PPO Demo Benefits 2026 (Public demo SBC, p. 1)'
    }
  ],
  refusal: false,
  refusalLabels: [],
  guardrail: { action: 'allow', labels: [], evidence: [] },
  traceId: 'trace-render-1',
  debug: { retrievalTrace: [{ chunkId: 'chunk-1', score: 0.92, fusedScore: 0.87 }] }
};

const refusalResponse: ChatResponse = {
  ...successResponse,
  answer: 'I can’t help with that request. Please ask a benefits question based on public plan documents.',
  citations: [],
  refusal: true,
  refusalLabels: ['MEDICAL_OR_LEGAL_ADVICE'],
  guardrail: {
    action: 'block',
    labels: ['MEDICAL_OR_LEGAL_ADVICE'],
    evidence: [{ label: 'MEDICAL_OR_LEGAL_ADVICE', spanHash: 'hash-1' }]
  },
  traceId: 'trace-refusal-1',
  debug: undefined
};

describe('response rendering components', () => {
  it('renders success answers with trace id and citation count', () => {
    render(AnswerPanel, { props: { response: successResponse, error: null, loading: false } });

    expect(screen.getByText('Answer')).toBeTruthy();
    expect(screen.getByText(/urgent care has a \$40 copay/)).toBeTruthy();
    expect(screen.getByText(/1 citation · Trace: trace-render-1/)).toBeTruthy();
  });

  it('renders refusal state distinctly with refusal labels', () => {
    render(AnswerPanel, { props: { response: refusalResponse, error: null, loading: false } });
    render(TracePanel, { props: { response: refusalResponse } });

    expect(screen.getAllByText('Refusal').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/I can’t help with that request/)).toBeTruthy();
    expect(screen.getAllByText('MEDICAL_OR_LEGAL_ADVICE').length).toBeGreaterThanOrEqual(1);
  });

  it('renders citations and retrieval trace', () => {
    render(CitationList, { props: { citations: successResponse.citations, selectedCitationId: 'C1', onSelect: () => {} } });
    render(TracePanel, { props: { response: successResponse } });

    expect(screen.getByText('C1 · Wellmark PPO Demo Benefits 2026')).toBeTruthy();
    expect(screen.getByText('Wellmark PPO Demo Benefits 2026 (Public demo SBC, p. 1)')).toBeTruthy();
    expect(screen.getByText('trace-render-1')).toBeTruthy();
    expect(screen.getByText('chunk-1')).toBeTruthy();
    expect(screen.getByText('0.870')).toBeTruthy();
  });
});
