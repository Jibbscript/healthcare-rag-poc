import { parseChatResponse, type ChatResponse } from '@healthcare-rag/core';
import { demoPrompts, type DemoPrompt, type DemoPromptKind } from './demoPrompts';

const urgentCareCitation = {
  citationId: 'C1',
  chunkId: 'wellmark-ppo-2026:1f4cb73e6445',
  docId: 'wellmark-ppo-2026',
  title: 'Wellmark PPO Demo Benefits 2026',
  sourceLabel: 'Public demo SBC',
  sourceUri: 'corpus/fixtures/wellmark-ppo-2026.md',
  page: 1,
  section: 'Page 1 Urgent care',
  rendered: 'Wellmark PPO Demo Benefits 2026 (Public demo SBC, p. 1)'
};

export const demoFixtureResponses: Record<DemoPromptKind, ChatResponse> = {
  covered: assertChatFixture({
    answer: 'Fixture playback: in-network urgent care visits for the PPO demo plan are covered with a $40 copay after no deductible. [C1]',
    citations: [urgentCareCitation],
    refusal: false,
    refusalLabels: [],
    guardrail: { action: 'allow', labels: [], evidence: [] },
    traceId: 'trace_fixture_covered',
    debug: { retrievalTrace: [{ chunkId: urgentCareCitation.chunkId, score: 6.2709, fusedScore: 0.0164 }] }
  }),
  ambiguous: assertChatFixture(noEvidenceResponse('trace_fixture_orthodontia')),
  safety: assertChatFixture({
    answer: 'I can’t help with that request. Please ask a benefits question based on public plan documents or contact the insurer for member-specific support.',
    citations: [],
    refusal: true,
    refusalLabels: ['MEDICAL_OR_LEGAL_ADVICE'],
    guardrail: {
      action: 'block',
      redactedText: 'Should I take antibiotics for chest pain?',
      labels: ['MEDICAL_OR_LEGAL_ADVICE'],
      rationale: 'Request matched deterministic safety policy.',
      evidence: []
    },
    traceId: 'trace_fixture_safety',
    debug: { retrievalTrace: [] }
  }),
  pii: assertChatFixture({
    answer: 'Fixture playback: after redaction, the public PPO demo evidence still supports a $40 in-network urgent care copay after no deductible. [C1]',
    citations: [urgentCareCitation],
    refusal: false,
    refusalLabels: [],
    guardrail: {
      action: 'redact',
      redactedText: 'My [REDACTED_MEMBER_ID] asks what is the urgent care copay?',
      labels: ['MEMBER_ID'],
      rationale: 'PII-like text was redacted.',
      evidence: [{ label: 'MEMBER_ID', spanHash: 'fixture-member-id' }]
    },
    traceId: 'trace_fixture_pii',
    debug: { retrievalTrace: [{ chunkId: urgentCareCitation.chunkId, score: 5.2195, fusedScore: 0.0164 }] }
  }),
  'no-evidence': assertChatFixture(noEvidenceResponse('trace_fixture_no_evidence'))
};

const customFixtureResponse = assertChatFixture({
  ...noEvidenceResponse('trace_fixture_custom'),
  answer: 'Fixture playback only covers the curated public demo prompts. Select a prompt from the rail or switch to Local API mode for a live local request.',
  refusalLabels: ['FIXTURE_CASE_NOT_FOUND']
});

export function getDemoFixtureResponse(input: { prompt: DemoPrompt; message: string }): ChatResponse {
  const exactPrompt = demoPrompts.find((prompt) => normalize(prompt.message) === normalize(input.message));
  if (exactPrompt) return cloneResponse(demoFixtureResponses[exactPrompt.id]);
  if (normalize(input.prompt.message) === normalize(input.message)) return cloneResponse(demoFixtureResponses[input.prompt.id]);
  return cloneResponse(customFixtureResponse);
}

function noEvidenceResponse(traceId: string): ChatResponse {
  return {
    answer: 'I don’t have enough evidence in the provided public benefits documents to answer that. Try asking about a covered benefit listed in the demo corpus.',
    citations: [],
    refusal: true,
    refusalLabels: ['NO_RETRIEVED_EVIDENCE'],
    guardrail: { action: 'allow', labels: [], evidence: [] },
    traceId,
    debug: { retrievalTrace: [] }
  };
}

function assertChatFixture(value: ChatResponse): ChatResponse {
  const parsed = parseChatResponse(value);
  if (!parsed.ok) throw new Error(`Invalid demo fixture response: ${parsed.issues.join('; ')}`);
  return parsed.value;
}

function cloneResponse(response: ChatResponse): ChatResponse {
  return JSON.parse(JSON.stringify(response)) as ChatResponse;
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}
