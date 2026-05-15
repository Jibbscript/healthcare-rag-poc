export function createEphemeralSessionId(): string {
  if (globalThis.crypto && 'randomUUID' in globalThis.crypto) {
    return `web-${globalThis.crypto.randomUUID()}`;
  }
  return `web-${Math.random().toString(36).slice(2, 12)}`;
}

export function maskSecret(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'not set';
  if (trimmed.length <= 6) return 'set';
  return `${trimmed.slice(0, 3)}...${trimmed.slice(-2)}`;
}
