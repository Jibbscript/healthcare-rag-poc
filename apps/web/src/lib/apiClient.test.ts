import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ChatClientError,
  buildChatRequest,
  defaultSettings,
  parseChatErrorResponse,
  resolveChatEndpoint,
  sendChat,
  type ChatClientSettings
} from './apiClient';

const baseSettings: ChatClientSettings = { ...defaultSettings };

const chatResponse = {
  answer: 'Based on the provided public benefits evidence, urgent care has a fixture copay. [C1]',
  citations: [
    {
      citationId: 'C1',
      chunkId: 'chunk-1',
      docId: 'ppo-2026',
      title: 'Wellmark PPO 2026',
      sourceLabel: 'Fixture',
      sourceUri: 'corpus/fixtures/wellmark-ppo-2026.md',
      section: 'Urgent care',
      rendered: 'Wellmark PPO 2026, urgent care'
    }
  ],
  refusal: false,
  refusalLabels: [],
  guardrail: { action: 'allow', labels: [], evidence: [] },
  traceId: 'trace-web-1',
  debug: { retrievalTrace: [{ chunkId: 'chunk-1', score: 0.92, fusedScore: 0.88 }] }
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('chat client', () => {
  it('builds local chat requests explicitly', () => {
    const request = buildChatRequest({ sessionId: 'web-test', message: 'What is covered?', settings: baseSettings });
    expect(request).toMatchObject({
      sessionId: 'web-test',
      message: 'What is covered?',
      profile: 'local',
      redactionMode: 'strict',
      debug: true
    });
  });

  it('resolves dev proxy and configured API targets', () => {
    expect(resolveChatEndpoint('')).toBe('/chat');
    expect(resolveChatEndpoint('https://demo.example.test/api/')).toBe('https://demo.example.test/api/chat');
  });

  it('submits the local profile and parses chat responses', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(chatResponse, 200));
    vi.stubGlobal('fetch', fetchMock);

    const result = await sendChat({ sessionId: 'web-test', message: 'What is covered?', settings: baseSettings });

    expect(result.traceId).toBe('trace-web-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, request] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(request.body as string)).toMatchObject({ profile: 'local', redactionMode: 'strict', debug: true });
  });

  it('parses API error payloads without request echoing', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ error: 'Unauthorized', traceId: 'trace-denied' }, 401));
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendChat({ sessionId: 'web-test', message: 'member id ABC12345', settings: baseSettings }))
      .rejects.toMatchObject({ kind: 'api_error', statusCode: 401, traceId: 'trace-denied', message: 'Unauthorized' });
  });

  it('handles validation errors without echoing raw request text', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ error: 'Invalid chat request', traceId: 'trace-400' }, 400));
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendChat({ sessionId: 'web-test', message: 'member id ABC12345', settings: baseSettings }))
      .rejects.toMatchObject({ kind: 'api_error', statusCode: 400, traceId: 'trace-400', message: 'Invalid chat request' });
  });

  it('handles server errors without echoing raw request text', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ error: 'Internal server error', traceId: 'trace-500' }, 500));
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendChat({ sessionId: 'web-test', message: 'member id ABC12345', settings: baseSettings }))
      .rejects.toMatchObject({ kind: 'api_error', statusCode: 500, traceId: 'trace-500', message: 'Internal server error' });
  });

  it('uses generic network errors', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('low-level failure with user text');
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendChat({ sessionId: 'web-test', message: 'member id ABC12345', settings: baseSettings }))
      .rejects.toMatchObject({ kind: 'network_error', message: 'The API could not be reached.' });
  });

  it('requires explicit API target before smoke mode', async () => {
    await expect(sendChat({
      sessionId: 'web-test',
      message: 'What is covered?',
      settings: { ...baseSettings, profile: 'aws-smoke', apiBaseUrl: '' }
    })).rejects.toBeInstanceOf(ChatClientError);
  });

  it('normalizes malformed error payloads', () => {
    expect(parseChatErrorResponse(null)).toEqual({ error: 'Request failed', traceId: 'unavailable' });
    expect(parseChatErrorResponse({ error: 'Internal server error', traceId: 'trace-500' }))
      .toEqual({ error: 'Internal server error', traceId: 'trace-500' });
  });
});

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}
