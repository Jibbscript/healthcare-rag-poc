import type { AuditTrace, Citation, GuardrailDecision, Profile, RetrievedChunk } from '../domain';
import { sha256 } from '../utils/hash';

export function assembleAuditTrace(input: {
  traceId: string;
  sessionId: string;
  turnId: string;
  profile: Profile;
  createdAt: string;
  userText: string;
  userRedactedText?: string;
  guardrail: GuardrailDecision;
  chunks: RetrievedChunk[];
  citations: Citation[];
  refusal: { refused: boolean; labels: string[] };
  model?: { provider?: string; modelId?: string; estimatedInputTokens?: number; estimatedOutputTokens?: number };
  timingsMs?: Record<string, number>;
  status?: AuditTrace['status'];
}): AuditTrace {
  const sessionHash = sha256(input.sessionId);
  return {
    traceId: input.traceId,
    sessionHash,
    turnId: input.turnId,
    profile: input.profile,
    createdAt: input.createdAt,
    userHash: sessionHash.slice(0, 32),
    input: {
      inputHash: sha256(input.userText),
      redactedText: input.userRedactedText ?? input.guardrail.redactedText,
      guardrailLabels: input.guardrail.labels
    },
    retrieval: {
      queryHash: sha256(input.userText),
      chunks: input.chunks.map((chunk) => ({ chunkId: chunk.chunkId, docId: chunk.docId, score: chunk.score }))
    },
    model: input.model ?? {},
    citations: input.citations,
    refusal: input.refusal,
    guardrail: input.guardrail,
    evalInline: [],
    timingsMs: input.timingsMs ?? {},
    status: input.status ?? (input.refusal.refused ? 'refusal' : 'success')
  };
}
