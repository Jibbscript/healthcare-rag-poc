import { parseChatResponse, type ChatRequest, type ChatResponse } from '@healthcare-rag/core';

export type DemoProfile = 'local' | 'aws-smoke';
export type RedactionMode = 'strict' | 'standard';

export type ChatClientSettings = {
  apiBaseUrl: string;
  apiKey: string;
  profile: DemoProfile;
  redactionMode: RedactionMode;
  debug: boolean;
};

export type ChatErrorResponse = {
  error: string;
  traceId: string;
};

export type ChatClientErrorKind = 'api_error' | 'network_error' | 'invalid_response' | 'config_error';

export class ChatClientError extends Error {
  constructor(
    readonly kind: ChatClientErrorKind,
    message: string,
    readonly statusCode?: number,
    readonly traceId = 'unavailable'
  ) {
    super(message);
    this.name = 'ChatClientError';
  }
}

export const defaultSettings: ChatClientSettings = {
  apiBaseUrl: '',
  apiKey: '',
  profile: 'local',
  redactionMode: 'strict',
  debug: true
};

export function buildChatRequest(input: { sessionId: string; message: string; settings: ChatClientSettings }): ChatRequest {
  return {
    sessionId: input.sessionId,
    message: input.message,
    profile: input.settings.profile,
    redactionMode: input.settings.redactionMode,
    debug: input.settings.debug
  };
}

export function resolveChatEndpoint(apiBaseUrl: string): string {
  const trimmed = apiBaseUrl.trim();
  if (!trimmed) return '/chat';
  return `${trimmed.replace(/\/+$/, '')}/chat`;
}

export function parseChatErrorResponse(value: unknown): ChatErrorResponse {
  if (!value || typeof value !== 'object') return { error: 'Request failed', traceId: 'unavailable' };
  const record = value as Record<string, unknown>;
  return {
    error: typeof record.error === 'string' && record.error ? record.error : 'Request failed',
    traceId: typeof record.traceId === 'string' && record.traceId ? record.traceId : 'unavailable'
  };
}

export async function sendChat(input: { sessionId: string; message: string; settings: ChatClientSettings }): Promise<ChatResponse> {
  if (input.settings.profile === 'aws-smoke' && !input.settings.apiBaseUrl.trim()) {
    throw new ChatClientError('config_error', 'Set an API base URL before using AWS smoke mode.');
  }

  let response: Response;
  try {
    response = await fetch(resolveChatEndpoint(input.settings.apiBaseUrl), {
      method: 'POST',
      headers: buildHeaders(input.settings),
      body: JSON.stringify(buildChatRequest(input))
    });
  } catch {
    throw new ChatClientError('network_error', 'The API could not be reached.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ChatClientError('invalid_response', 'The API returned a non-JSON response.', response.status);
  }

  if (!response.ok) {
    const parsed = parseChatErrorResponse(body);
    throw new ChatClientError('api_error', parsed.error, response.status, parsed.traceId);
  }

  const parsed = parseChatResponse(body);
  if (!parsed.ok) {
    throw new ChatClientError('invalid_response', 'The API response did not match the chat contract.', response.status);
  }
  return parsed.value;
}

function buildHeaders(settings: ChatClientSettings): Record<string, string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const key = settings.apiKey.trim();
  if (key) headers['x-smoke-api-key'] = key;
  return headers;
}
