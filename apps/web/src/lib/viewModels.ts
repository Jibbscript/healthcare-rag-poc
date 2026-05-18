import type { ChatResponse } from '@healthcare-rag/core';
import type { ChatClientError } from './apiClient';
import type { DashboardMode } from './demoMode';

export type RequestState = 'idle' | 'loading' | 'success' | 'refusal' | 'error';

export function requestStateForResponse(response: ChatResponse): RequestState {
  return response.refusal ? 'refusal' : 'success';
}

export function apiStatusText(input: { state: RequestState; mode: DashboardMode; apiBaseUrl: string }): string {
  if (input.state === 'loading') return input.mode === 'fixture-demo' ? 'Fixture playback running' : 'API request running';
  if (input.state === 'error') return 'API attention needed';
  if (input.mode === 'fixture-demo') return 'Fixture playback ready';
  if (input.apiBaseUrl.trim()) return 'Local API configured';
  return 'Local API dev proxy';
}

export function apiStatusTone(state: RequestState): 'neutral' | 'active' | 'success' | 'warning' {
  if (state === 'loading') return 'active';
  if (state === 'success') return 'success';
  if (state === 'refusal' || state === 'error') return 'warning';
  return 'neutral';
}

export function errorHeading(error: ChatClientError | null): string {
  if (!error) return '';
  if (error.kind === 'network_error') return 'API unreachable';
  if (error.kind === 'config_error') return 'Configuration required';
  if (error.statusCode === 401) return 'API key required';
  if (error.statusCode === 400) return 'Request rejected';
  if (error.statusCode && error.statusCode >= 500) return 'API error';
  return 'Request failed';
}

export function citationCountLabel(response: ChatResponse | null): string {
  const count = response?.citations.length ?? 0;
  if (count === 0) return 'No citations';
  if (count === 1) return '1 citation';
  return `${count} citations`;
}
