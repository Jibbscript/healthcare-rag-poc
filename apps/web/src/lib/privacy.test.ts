import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createEphemeralSessionId, maskSecret } from './privacy';

const workspaceRoot = process.cwd().endsWith('apps/web') ? process.cwd() : join(process.cwd(), 'apps/web');
const sourceRoot = join(workspaceRoot, 'src');

describe('privacy helpers', () => {
  it('creates non-empty volatile session ids', () => {
    expect(createEphemeralSessionId()).toMatch(/^web-/);
  });

  it('masks configured secrets', () => {
    expect(maskSecret('')).toBe('not set');
    expect(maskSecret('abcdef123456')).toBe('abc...56');
  });

  it('keeps source free of browser persistence and raw debug sinks', () => {
    const sourceFiles = collectSourceFiles(sourceRoot);
    const forbidden = [
      'local' + 'Storage',
      'session' + 'Storage',
      'indexed' + 'DB',
      'Indexed' + 'DB',
      'analytics',
      'console' + '.log',
      'location' + '.search'
    ];

    for (const file of sourceFiles) {
      const text = readFileSync(file, 'utf8');
      for (const token of forbidden) {
        expect(text, `${file} contains forbidden token ${token}`).not.toContain(token);
      }
    }
  });
});

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (path.endsWith('.test.ts')) return [];
    if (statSync(path).isDirectory()) return collectSourceFiles(path);
    return /\.(ts|svelte)$/.test(path) ? [path] : [];
  });
}
