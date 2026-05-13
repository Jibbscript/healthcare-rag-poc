import { parseChatRequest, type ChatRequest, type ChatResponse } from '../api/chat-contract';
import { assembleAuditTrace } from '../audit';
import { assembleCitations } from '../citations';
import { auditTraceSchema, type GuardrailDecision } from '../domain';
import type { ProviderBundle } from '../ports';
import { buildBenefitsPrompt } from '../prompts';
import { decideRefusal } from '../policy';

export async function runChatPipeline(input: unknown, providers: ProviderBundle): Promise<ChatResponse> {
  const parsed = parseChatRequest(input);
  if (!parsed.ok) throw new Error(`Invalid chat request: ${parsed.issues.join('; ')}`);
  const request: ChatRequest = parsed.value;
  const traceId = providers.idGenerator.nextId('trace');
  const turnId = providers.idGenerator.nextId('turn');
  const started = providers.clock.now().getTime();
  const createdAt = providers.clock.now().toISOString();
  let guardrail: GuardrailDecision = await providers.guardrail.evaluateInput(request.message);
  const normalizedQuery = guardrail.redactedText ?? request.message;
  let chunks = [] as Awaited<ReturnType<ProviderBundle['retriever']['retrieve']>>;
  let model: { provider?: string; modelId?: string; estimatedInputTokens?: number; estimatedOutputTokens?: number } = {};
  let answer = '';
  let refusal = { refused: false, labels: [] as string[] };

  if (guardrail.action !== 'block') {
    chunks = await providers.retriever.retrieve({ query: normalizedQuery, profile: request.profile, topK: 5 });
  }
  const refusalDecision = decideRefusal({ query: normalizedQuery, chunks, guardrail });
  if (refusalDecision.refused) {
    refusal = { refused: true, labels: refusalDecision.labels };
    answer = refusalDecision.answer ?? 'I can’t answer that safely from the provided evidence.';
  } else {
    const generated = await providers.llm.generate({ messages: buildBenefitsPrompt({ query: normalizedQuery, chunks }), contextChunks: chunks, modelParams: { temperature: 0.1, maxTokens: 700 } });
    model = { provider: generated.provider, modelId: generated.modelId, estimatedInputTokens: generated.estimatedInputTokens, estimatedOutputTokens: generated.estimatedOutputTokens };
    const outputGuardrail = await providers.guardrail.evaluateOutput(generated.text);
    if (outputGuardrail.action === 'block') {
      guardrail = outputGuardrail;
      refusal = { refused: true, labels: outputGuardrail.labels };
      answer = 'I can’t provide that output safely. Please rephrase the benefits question.';
    } else {
      guardrail = outputGuardrail.action === 'redact' ? outputGuardrail : guardrail;
      answer = outputGuardrail.redactedText ?? generated.text;
    }
  }

  const citations = refusal.refused ? [] : assembleCitations(chunks);
  const trace = auditTraceSchema.parse(assembleAuditTrace({
    traceId,
    sessionId: request.sessionId,
    turnId,
    profile: request.profile,
    createdAt,
    userText: request.message,
    userRedactedText: normalizedQuery === request.message ? undefined : normalizedQuery,
    guardrail,
    chunks,
    citations,
    refusal,
    model,
    timingsMs: { total: providers.clock.now().getTime() - started },
    status: refusal.refused ? (guardrail.action === 'block' ? 'blocked' : 'refusal') : 'success'
  }));
  await providers.auditStore.putTrace(trace);
  return {
    answer,
    citations,
    refusal: refusal.refused,
    refusalLabels: refusal.labels,
    guardrail,
    traceId,
    debug: request.debug ? { retrievalTrace: chunks.map((chunk) => ({ chunkId: chunk.chunkId, score: chunk.score, fusedScore: chunk.fusedScore })) } : undefined
  };
}
