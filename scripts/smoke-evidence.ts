import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

type SmokeEvidence = {
  mode: 'aws-smoke';
  visualReview: 'summary-only';
  status: string;
  generatedAt: string;
  provenance: {
    commitSha: string;
    workflowRunId: string;
    region: string;
    accountHash?: string;
    stackName: string;
    stackOwnershipMode: string;
    deployStatus: string;
    destroyStatus: string;
    smokeTemplateHash: string;
    smokeScriptHash: string;
  };
  resourceShape: unknown;
  traceIds: string[];
  responseHashes: string[];
  citationIds: string[];
};

type SmokeResponseSummary = {
  traceId?: unknown;
  answerHash?: unknown;
  citations?: unknown;
};

export async function writeSmokeEvidence(env: NodeJS.ProcessEnv = process.env): Promise<string | null> {
  const out = env.SMOKE_EVIDENCE_OUT;
  if (!out) return null;

  const status = env.SMOKE_STATUS ?? 'unknown';
  const summary = parseSmokeResponseSummary(status, env.SMOKE_RESPONSE_SUMMARY_JSON);
  const evidence: SmokeEvidence = {
    mode: 'aws-smoke',
    visualReview: 'summary-only',
    status,
    generatedAt: new Date().toISOString(),
    provenance: {
      commitSha: env.GITHUB_SHA ?? readGitSha(),
      workflowRunId: env.GITHUB_RUN_ID ?? 'local',
      region: env.AWS_REGION ?? env.AWS_DEFAULT_REGION ?? 'not-configured',
      accountHash: env.AWS_ACCOUNT_ID ? hashText(env.AWS_ACCOUNT_ID) : undefined,
      stackName: env.STACK_NAME ?? 'HealthcareRagAwsSmoke',
      stackOwnershipMode: env.STACK_OWNERSHIP_MODE ?? 'workflow-owned',
      deployStatus: env.DEPLOY_STATUS ?? 'not-run',
      destroyStatus: env.DESTROY_STATUS ?? 'not-run',
      smokeTemplateHash: hashEvidenceFile('TEMPLATE_FILE', env.TEMPLATE_FILE ?? 'cdk.out/smoke/HealthcareRagAwsSmoke.template.json', status),
      smokeScriptHash: hashEvidenceFile('scripts/aws-smoke-run.sh', 'scripts/aws-smoke-run.sh', status)
    },
    resourceShape: parseResourceShape(status, env.RESOURCE_SHAPE_JSON),
    traceIds: typeof summary.traceId === 'string' ? [summary.traceId] : [],
    responseHashes: typeof summary.answerHash === 'string' ? [summary.answerHash] : [],
    citationIds: Array.isArray(summary.citations)
      ? summary.citations.filter((value): value is string => typeof value === 'string')
      : []
  };

  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, `${JSON.stringify(evidence, null, 2)}\n`);
  return out;
}

function parseResourceShape(status: string, text: string | undefined): unknown {
  if (status === 'failed' && !text) return { ok: false, unavailable: true, reason: 'smoke-run-failed-before-cost-shape' };
  return parseRequiredJson('RESOURCE_SHAPE_JSON', text);
}

function parseSmokeResponseSummary(status: string, text: string | undefined): SmokeResponseSummary {
  if (!text && status !== 'passed') return {};
  return parseRequiredJson('SMOKE_RESPONSE_SUMMARY_JSON', text);
}

function parseRequiredJson<T>(name: string, text: string | undefined): T {
  if (!text) throw new Error(`${name} is required for smoke evidence`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`${name} must be valid JSON`);
  }
}

function hashText(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function hashEvidenceFile(label: string, file: string, status: string): string {
  const hash = hashFile(file);
  if (hash !== 'unavailable' || status === 'failed') return hash;
  throw new Error(`${label} is required for smoke evidence`);
}

function hashFile(file: string): string {
  return existsSync(file) ? createHash('sha256').update(readFileSync(file)).digest('hex') : 'unavailable';
}

function readGitSha(): string {
  const head = '.git/HEAD';
  if (!existsSync(head)) return 'local';
  const value = readFileSync(head, 'utf8').trim();
  if (!value.startsWith('ref: ')) return value;
  const refPath = `.git/${value.slice(5)}`;
  return existsSync(refPath) ? readFileSync(refPath, 'utf8').trim() : 'local';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = await writeSmokeEvidence();
  if (out) process.stdout.write(`wrote sanitized smoke evidence: ${out}\n`);
}
