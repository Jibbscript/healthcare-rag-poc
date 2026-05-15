import { runChatPipeline, type Profile } from '@healthcare-rag/core';
import { createProviderBundle } from '../bootstrap';

export type HttpApiEvent = { body?: string | null; requestContext?: { http?: { method?: string; path?: string } } };
export type HttpApiResponse = { statusCode: number; headers: Record<string, string>; body: string };

export async function handler(event: HttpApiEvent): Promise<HttpApiResponse> {
  const headers = { 'content-type': 'application/json' };
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const providers = await createProviderBundle((body.profile ?? process.env.PROFILE ?? 'local') as Profile);
    const response = await runChatPipeline(body, providers);
    return { statusCode: 200, headers, body: JSON.stringify(response) };
  } catch (error) {
    const badRequest = error instanceof Error && error.message.startsWith('Invalid chat request');
    return { statusCode: badRequest ? 400 : 500, headers, body: JSON.stringify({ error: badRequest && error instanceof Error ? error.message : 'Internal server error', traceId: 'unavailable' }) };
  }
}
