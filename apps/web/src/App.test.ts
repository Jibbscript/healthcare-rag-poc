import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.svelte';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('dashboard app modes', () => {
  it('runs hosted fixture playback by default without fetching /chat', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(App);
    await fireEvent.click(screen.getByRole('button', { name: 'Run question' }));

    await waitFor(() => expect(screen.getByText(/Fixture playback: in-network urgent care/)).toBeTruthy());
    expect(screen.getAllByText('Fixture playback').length).toBeGreaterThan(0);
    expect(screen.queryByLabelText(/Smoke API key/i)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses local API mode only when explicitly selected', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      answer: 'Local API response [C1]',
      citations: [],
      refusal: false,
      refusalLabels: [],
      guardrail: { action: 'allow', labels: [], evidence: [] },
      traceId: 'trace-local-api'
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    render(App);
    await fireEvent.click(screen.getByText('Demo target'));
    await fireEvent.change(screen.getByLabelText('Mode'), { target: { value: 'local-api' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Run question' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, request] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(request.body as string)).toMatchObject({ profile: 'local' });
    expect(request.headers).not.toMatchObject({ 'x-smoke-api-key': expect.any(String) });
  });
});
