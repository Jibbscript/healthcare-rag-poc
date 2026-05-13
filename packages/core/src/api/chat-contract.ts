import { z } from 'zod';
import { citationSchema, guardrailDecisionSchema, profileSchema, safeParse, type ParseResult } from '../domain';

export const chatRequestSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(4000),
  planScope: z.string().optional(),
  profile: profileSchema.default('local'),
  debug: z.boolean().default(false),
  redactionMode: z.enum(['strict', 'standard']).default('strict')
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const chatResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(citationSchema).default([]),
  refusal: z.boolean(),
  refusalLabels: z.array(z.string()).default([]),
  guardrail: guardrailDecisionSchema,
  traceId: z.string(),
  debug: z.object({ retrievalTrace: z.array(z.object({ chunkId: z.string(), score: z.number().optional(), fusedScore: z.number().optional() })).optional() }).optional()
}).strict();
export type ChatResponse = z.infer<typeof chatResponseSchema>;

export function parseChatRequest(value: unknown): ParseResult<ChatRequest> { return safeParse(chatRequestSchema, value); }
export function parseChatResponse(value: unknown): ParseResult<ChatResponse> { return safeParse(chatResponseSchema, value); }
