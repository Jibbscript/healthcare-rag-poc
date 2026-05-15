import type { AuditTrace, BenefitLookup, EvalResult, GuardrailDecision, Profile, RetrievedChunk, RetrievalQuery } from '../domain';

export type ObjectInfo = { key: string; size: number; checksum?: string; updatedAt?: string };
export interface ObjectStore {
  put(key: string, body: Buffer | string, metadata?: Record<string, string>): Promise<ObjectInfo>;
  get(key: string): Promise<Buffer>;
  list(prefix: string): Promise<ObjectInfo[]>;
  head(key: string): Promise<ObjectInfo | null>;
  delete(key: string): Promise<void>;
}

export interface AuditStore {
  putTrace(trace: AuditTrace): Promise<void>;
  getTrace(traceId: string): Promise<AuditTrace | null>;
  querySession(sessionId: string): Promise<AuditTrace[]>;
}

export interface Retriever {
  retrieve(query: RetrievalQuery): Promise<RetrievedChunk[]>;
}

export type LlmMessage = { role: 'system' | 'developer' | 'user' | 'assistant'; content: string };
export interface Llm {
  generate(input: { messages: LlmMessage[]; contextChunks: RetrievedChunk[]; modelParams?: Record<string, unknown> }): Promise<{ text: string; modelId: string; provider: string; estimatedInputTokens?: number; estimatedOutputTokens?: number }>;
}

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<{ vectors: number[][]; modelId: string; dimension: number }>;
}

export interface Guardrail {
  evaluateInput(text: string): Promise<GuardrailDecision>;
  evaluateOutput(text: string): Promise<GuardrailDecision>;
}

export interface EvalSink {
  writeRun(result: { runId: string; results: EvalResult[]; summary: Record<string, unknown> }): Promise<void>;
}

export interface Clock { now(): Date; }
export interface IdGenerator { nextId(prefix?: string): string; }
export interface SafeLogger { info(event: string, fields?: Record<string, unknown>): void; warn(event: string, fields?: Record<string, unknown>): void; error(event: string, fields?: Record<string, unknown>): void; }

export interface BenefitCatalogTool {
  lookup(input: { planId: string; category: string; year: number; network?: string }): Promise<BenefitLookup[]>;
}

export interface ProviderBundle {
  profile: Profile;
  objectStore?: ObjectStore;
  auditStore: AuditStore;
  retriever: Retriever;
  llm: Llm;
  embeddingProvider?: EmbeddingProvider;
  guardrail: Guardrail;
  evalSink?: EvalSink;
  clock: Clock;
  idGenerator: IdGenerator;
  logger: SafeLogger;
  benefitCatalog?: BenefitCatalogTool;
}

export class SystemClock implements Clock { now(): Date { return new Date(); } }
export class RandomIdGenerator implements IdGenerator {
  nextId(prefix = 'id'): string { return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`; }
}
export class NullSafeLogger implements SafeLogger {
  info(): void { /* intentionally no-op for no raw prompt logging */ }
  warn(): void { /* intentionally no-op */ }
  error(): void { /* intentionally no-op */ }
}
