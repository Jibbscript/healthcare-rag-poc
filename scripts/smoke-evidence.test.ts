import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { writeSmokeEvidence } from './smoke-evidence';

describe('smoke evidence writer', () => {
  it('writes sanitized evidence only when required resource shape JSON is valid', async () => {
    const out = await evidencePath();

    await expect(writeSmokeEvidence(env(out, { RESOURCE_SHAPE_JSON: '{"ok":true,"resources":33}' }))).resolves.toBe(out);

    const evidence = JSON.parse(await readFile(out, 'utf8')) as { resourceShape: { ok: boolean; resources: number }; responseHashes: string[] };
    expect(evidence.resourceShape).toMatchObject({ ok: true, resources: 33 });
    expect(evidence.responseHashes).toEqual([]);
  });

  it('rejects malformed required resource shape JSON', async () => {
    await expect(writeSmokeEvidence(env(await evidencePath(), { RESOURCE_SHAPE_JSON: 'not-json' }))).rejects.toThrow(/RESOURCE_SHAPE_JSON must be valid JSON/);
  });
});

async function evidencePath(): Promise<string> {
  return join(await mkdtemp(join(tmpdir(), 'smoke-evidence-')), 'evidence.json');
}

function env(out: string, overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    SMOKE_EVIDENCE_OUT: out,
    SMOKE_STATUS: 'dry-run',
    GITHUB_SHA: 'abc123',
    GITHUB_RUN_ID: 'run123',
    AWS_REGION: 'us-east-1',
    STACK_NAME: 'HealthcareRagAwsSmoke',
    STACK_OWNERSHIP_MODE: 'workflow-owned',
    DEPLOY_STATUS: 'not-run',
    DESTROY_STATUS: 'not-run',
    TEMPLATE_FILE: 'package.json',
    ...overrides
  };
}
