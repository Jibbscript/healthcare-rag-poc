import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { checkDemoArtifacts } from './check-demo-artifacts';

describe('demo artifact safety gate', () => {
  it('allows summary-only smoke metadata and fixture manifests', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'healthcare-rag-demo-safe-'));
    await writeFile(join(dir, 'smoke.json'), JSON.stringify({
      mode: 'aws-smoke',
      visualReview: 'summary-only',
      status: 'dry-run',
      generatedAt: new Date().toISOString(),
      provenance: {
        commitSha: 'a'.repeat(40),
        workflowRunId: 'local',
        region: 'not-configured',
        stackName: 'HealthcareRagAwsSmoke',
        stackOwnershipMode: 'workflow-owned',
        deployStatus: 'not-run',
        destroyStatus: 'not-run',
        smokeTemplateHash: 'b'.repeat(64),
        smokeScriptHash: 'c'.repeat(64)
      },
      resourceShape: { ok: true, resources: 33, forbiddenAbsent: ['AWS::EC2::NatGateway'], bedrockEndpointCount: 1, fixedCostWarning: 'destroy after demo' },
      traceIds: ['trace_demo'],
      responseHashes: ['a'.repeat(64)],
      citationIds: ['C1']
    }));
    await writeFile(join(dir, 'fixture.json'), JSON.stringify({
      mode: 'fixture-demo',
      visualReview: 'fixture-ui',
      generatedAt: new Date().toISOString(),
      pageUrl: 'http://127.0.0.1:4173/healthcare-rag-poc/',
      provenance: { commitSha: 'd'.repeat(40), workflowRunId: 'local' },
      screenshots: ['01-fixture-idle.png'],
      videos: ['video/fixture-demo.webm'],
      caseResults: [{
        id: 'covered',
        traceId: 'trace_fixture_covered',
        responseHash: 'e'.repeat(64),
        citationIds: ['C1']
      }]
    }));

    await expect(checkDemoArtifacts([dir], {})).resolves.toBeUndefined();
  });

  it('rejects raw fields and unreviewed smoke manifests', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'healthcare-rag-demo-unsafe-'));
    await writeFile(join(dir, 'unsafe.json'), JSON.stringify({
      mode: 'aws-smoke',
      visualReview: 'full-browser',
      answer: 'raw response text'
    }));

    await expect(checkDemoArtifacts([dir], {})).rejects.toThrow(/raw prompt\/answer\/request field|summary-only/);
  });

  it('rejects non-allowlisted fields before smoke summaries can render them', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'healthcare-rag-demo-extra-'));
    await writeFile(join(dir, 'extra.json'), JSON.stringify({
      mode: 'aws-smoke',
      visualReview: 'summary-only',
      status: 'passed',
      generatedAt: new Date().toISOString(),
      provenance: { commitSha: 'a'.repeat(40), workflowRunId: 'local', operatorNote: 'not allowed' },
      resourceShape: { ok: true, resources: 33, hiddenRawOutput: 'not allowed' },
      traceIds: [],
      responseHashes: [],
      citationIds: []
    }));

    await expect(checkDemoArtifacts([dir], {})).rejects.toThrow(/non-allowlisted field/);
  });
});
