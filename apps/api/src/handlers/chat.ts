import { ChatPipelineError, profileSchema, runChatPipeline, type Profile } from '@healthcare-rag/core';
import { createProviderBundle } from '../bootstrap';

export type HttpApiEvent = { body?: string | null; headers?: Record<string, string | undefined>; requestContext?: { http?: { method?: string; path?: string } } };
export type HttpApiResponse = { statusCode: number; headers: Record<string, string>; body: string };

export async function handler(event: HttpApiEvent): Promise<HttpApiResponse> {
  const headers = { 'content-type': 'application/json' };
  try {
    if (!isAuthorized(event.headers ?? {})) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized', traceId: 'unavailable' }) };
    const body = event.body ? JSON.parse(event.body) : {};
    const profile = resolveProfile(body.profile ?? process.env.PROFILE ?? 'aws-smoke');
    const providers = await createProviderBundle(profile);
    const response = await runChatPipeline({ ...body, profile }, providers);
    return { statusCode: 200, headers, body: JSON.stringify(response) };
  } catch (error) {
    const badRequest = error instanceof Error && error.message.startsWith('Invalid chat request');
    const pipelineError = error instanceof ChatPipelineError ? error : undefined;
    const statusCode = badRequest ? 400 : pipelineError?.status === 'model_error' ? 502 : 500;
    return { statusCode, headers, body: JSON.stringify({ error: badRequest && error instanceof Error ? error.message : 'Internal server error', traceId: pipelineError?.traceId ?? 'unavailable' }) };
  }
}

function resolveProfile(profileLike: unknown): Profile {
  const parsed = profileSchema.safeParse(profileLike);
  if (!parsed.success) throw new Error(`Invalid chat request: profile: ${parsed.error.issues.map((issue) => issue.message).join('; ')}`);
  return parsed.data;
}

function isAuthorized(headers: Record<string, string | undefined>): boolean {
  const expected = process.env.SMOKE_API_KEY;
  if (!expected) return true;
  const provided = headers['x-smoke-api-key'] ?? headers['X-Smoke-Api-Key'];
  return provided === expected;
}
