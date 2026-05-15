import { z } from 'zod';

export const profileSchema = z.enum(['local', 'aws-smoke', 'aws-full']);
export type Profile = z.infer<typeof profileSchema>;

export const documentMetadataSchema = z.object({
  docId: z.string().min(1),
  planId: z.string().min(1),
  title: z.string().min(1),
  year: z.number().int().gte(2000),
  sourceLabel: z.string().min(1),
  sourceUri: z.string().min(1),
  allowedDemoUse: z.string().min(1),
  checksum: z.string().optional()
});
export type DocumentMetadata = z.infer<typeof documentMetadataSchema>;

export const documentRecordSchema = z.object({
  metadata: documentMetadataSchema,
  text: z.string().min(1),
  checksum: z.string().min(8)
});
export type DocumentRecord = z.infer<typeof documentRecordSchema>;

export const chunkSchema = z.object({
  chunkId: z.string().min(1),
  docId: z.string().min(1),
  planId: z.string().min(1),
  title: z.string().min(1),
  sourceLabel: z.string().min(1),
  sourceUri: z.string().min(1),
  page: z.number().int().positive().optional(),
  section: z.string().optional(),
  charStart: z.number().int().nonnegative(),
  charEnd: z.number().int().positive(),
  checksum: z.string().min(8),
  text: z.string().min(1),
  embedding: z.array(z.number()).optional()
});
export type Chunk = z.infer<typeof chunkSchema>;

export const retrievalQuerySchema = z.object({
  query: z.string().min(1),
  profile: profileSchema.default('aws-smoke'),
  topK: z.number().int().positive().max(50).default(5),
  filters: z.record(z.string(), z.string()).optional()
});
export type RetrievalQuery = z.infer<typeof retrievalQuerySchema>;

export const retrievedChunkSchema = chunkSchema.extend({
  score: z.number(),
  fusedScore: z.number().optional(),
  componentScores: z.record(z.string(), z.number()).default({})
});
export type RetrievedChunk = z.infer<typeof retrievedChunkSchema>;

export const citationSchema = z.object({
  citationId: z.string().min(1),
  chunkId: z.string().min(1),
  docId: z.string().min(1),
  title: z.string().min(1),
  sourceLabel: z.string().min(1),
  sourceUri: z.string().min(1),
  page: z.number().int().positive().optional(),
  section: z.string().optional(),
  rendered: z.string().min(1)
});
export type Citation = z.infer<typeof citationSchema>;

export const chatTurnSchema = z.object({
  sessionHash: z.string().min(8),
  turnId: z.string().min(1),
  userHash: z.string().min(8),
  createdAt: z.string().datetime(),
  profile: profileSchema
});
export type ChatTurn = z.infer<typeof chatTurnSchema>;

export const guardrailDecisionSchema = z.object({
  action: z.enum(['allow', 'redact', 'block']),
  redactedText: z.string().optional(),
  labels: z.array(z.string()).default([]),
  rationale: z.string().optional(),
  evidence: z.array(z.object({ label: z.string(), spanHash: z.string().optional() })).default([])
});
export type GuardrailDecision = z.infer<typeof guardrailDecisionSchema>;

export const auditTraceSchema = z.object({
  traceId: z.string().min(1),
  sessionHash: z.string().min(8),
  turnId: z.string().min(1),
  profile: profileSchema,
  createdAt: z.string().datetime(),
  userHash: z.string().min(8),
  input: z.object({
    inputHash: z.string().min(8),
    redactedText: z.string().optional(),
    guardrailLabels: z.array(z.string()).default([])
  }),
  retrieval: z.object({
    queryHash: z.string().min(8),
    chunks: z.array(z.object({ chunkId: z.string(), docId: z.string(), score: z.number().optional() })).default([])
  }).default({ queryHash: 'unavailable', chunks: [] }),
  model: z.object({
    provider: z.string().optional(),
    modelId: z.string().optional(),
    estimatedInputTokens: z.number().optional(),
    estimatedOutputTokens: z.number().optional()
  }).default({}),
  citations: z.array(citationSchema).default([]),
  refusal: z.object({ refused: z.boolean(), labels: z.array(z.string()).default([]) }).default({ refused: false, labels: [] }),
  guardrail: guardrailDecisionSchema.optional(),
  evalInline: z.array(z.object({ scorer: z.string(), passed: z.boolean(), score: z.number(), rationale: z.string() })).default([]),
  timingsMs: z.record(z.string(), z.number()).default({}),
  costEstimate: z.object({ amountUsd: z.number().optional(), available: z.boolean(), rationale: z.string() }).optional(),
  status: z.enum(['success', 'refusal', 'blocked', 'model_error', 'audit_error']).default('success')
}).strict();
export type AuditTrace = z.infer<typeof auditTraceSchema>;

export const evalCaseSchema = z.object({
  id: z.string().min(1),
  tags: z.array(z.string()).default([]),
  input: z.string().min(1),
  expectedCitationIds: z.array(z.string()).default([]),
  expectRefusal: z.boolean().default(false),
  expectPiiRedaction: z.boolean().default(false)
});
export type EvalCase = z.infer<typeof evalCaseSchema>;

export const evalResultSchema = z.object({
  caseId: z.string(),
  passed: z.boolean(),
  scores: z.array(z.object({ scorer: z.string(), passed: z.boolean(), score: z.number(), rationale: z.string(), evidenceIds: z.array(z.string()).default([]) })),
  responseHash: z.string().min(8),
  traceId: z.string().optional()
});
export type EvalResult = z.infer<typeof evalResultSchema>;

export const benefitLookupSchema = z.object({
  planId: z.string(),
  category: z.string(),
  year: z.number().int(),
  network: z.enum(['in-network', 'out-of-network', 'unknown']).default('unknown'),
  costShare: z.string().optional(),
  evidenceId: z.string().optional()
});
export type BenefitLookup = z.infer<typeof benefitLookupSchema>;

export type ParseResult<T> = { ok: true; value: T } | { ok: false; issues: string[] };
export function safeParse<S extends z.ZodTypeAny>(schema: S, value: unknown): ParseResult<z.output<S>> {
  const result = schema.safeParse(value);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, issues: result.error.issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`) };
}
