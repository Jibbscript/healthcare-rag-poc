export type CoreErrorCode = 'not_found' | 'validation' | 'provider' | 'guardrail_block' | 'unavailable' | 'unknown';

export class CoreError extends Error {
  readonly code: CoreErrorCode;
  readonly retryable: boolean;
  constructor(code: CoreErrorCode, message: string, retryable = false) {
    super(message);
    this.name = 'CoreError';
    this.code = code;
    this.retryable = retryable;
  }
}

export function normalizeError(error: unknown, fallback: CoreErrorCode = 'unknown'): CoreError {
  if (error instanceof CoreError) return error;
  if (error instanceof Error) return new CoreError(fallback, error.message, false);
  return new CoreError(fallback, 'Unknown provider error', false);
}
