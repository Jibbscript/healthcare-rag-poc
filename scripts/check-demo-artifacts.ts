import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const textExtensions = new Set(['.json', '.html', '.txt', '.md', '.yml', '.yaml', '.log']);
const binaryExtensions = new Set(['.png', '.jpg', '.jpeg', '.webm', '.mp4']);
const fixtureManifestKeys = new Set(['mode', 'visualReview', 'generatedAt', 'pageUrl', 'provenance', 'screenshots', 'videos', 'caseResults']);
const smokeCaptureManifestKeys = new Set([...fixtureManifestKeys, 'smokeEvidencePath']);
const smokeEvidenceKeys = new Set(['mode', 'visualReview', 'status', 'generatedAt', 'provenance', 'resourceShape', 'traceIds', 'responseHashes', 'citationIds']);
const captureProvenanceKeys = new Set(['commitSha', 'workflowRunId']);
const smokeProvenanceKeys = new Set([...captureProvenanceKeys, 'region', 'accountHash', 'stackName', 'stackOwnershipMode', 'deployStatus', 'destroyStatus', 'smokeTemplateHash', 'smokeScriptHash']);
const resourceShapeKeys = new Set(['ok', 'resources', 'forbiddenAbsent', 'found', 'bedrockEndpointCount', 'fixedCostWarning', 'unavailable']);
const caseResultKeys = new Set(['id', 'traceId', 'responseHash', 'citationIds']);

export async function checkDemoArtifacts(argv = process.argv.slice(2), env = process.env): Promise<void> {
  const roots = argv.filter((value) => value !== '--');
  const scanRoots = roots.length ? roots : ['demo-artifacts'];
  const files = (await Promise.all(scanRoots.map((root) => collectFiles(root)))).flat();
  const failures: string[] = [];

  for (const file of files) {
    if (binaryExtensions.has(extension(file))) continue;
    if (!textExtensions.has(extension(file))) continue;
    const text = await readFile(file, 'utf8');
    failures.push(...scanSensitiveText(file, text, env));
    if (file.endsWith('.json')) failures.push(...scanJsonArtifact(file, text));
  }

  if (failures.length) {
    throw new Error(`Demo artifact safety check failed:\n${failures.join('\n')}`);
  }
  process.stdout.write(`demo artifact safety check passed (${files.length} files inspected)\n`);
}

function scanSensitiveText(file: string, text: string, env: NodeJS.ProcessEnv): string[] {
  const failures: string[] = [];
  const concreteSecrets = [env.SMOKE_API_KEY, env.AWS_SECRET_ACCESS_KEY, env.AWS_SESSION_TOKEN].filter((value): value is string => Boolean(value && value.length >= 8));
  for (const secret of concreteSecrets) {
    if (text.includes(secret)) failures.push(`${file}: contains a configured secret value`);
  }

  const forbiddenPatterns: Array<[RegExp, string]> = [
    [/\b\d{12}\b/, 'raw AWS account id'],
    [/\bABC12345\b/, 'raw synthetic member id'],
    [/\b\d{3}-\d{2}-\d{4}\b/, 'SSN-like text'],
    [/"(?:rawPrompt|rawAnswer|requestBody|message|answer)"\s*:/i, 'raw prompt/answer/request field'],
    [/curl\s+.+\s-d\s+['"]?\{/i, 'raw curl request body']
  ];

  for (const [pattern, label] of forbiddenPatterns) {
    if (pattern.test(text)) failures.push(`${file}: contains ${label}`);
  }
  return failures;
}

export function scanJsonArtifact(file: string, text: string): string[] {
  try {
    return validateJsonArtifact(file, JSON.parse(text));
  } catch {
    return [`${file}: invalid JSON artifact`];
  }
}

export function validateJsonArtifact(file: string, value: unknown): string[] {
  if (!isRecord(value)) return [`${file}: JSON artifact must be an object`];

  if (value.mode === 'fixture-demo') return validateCaptureManifest(file, value, 'fixture-ui', fixtureManifestKeys);
  if (value.mode === 'aws-smoke') {
    if (value.visualReview !== 'summary-only') return [`${file}: aws-smoke artifact manifest must declare visualReview=summary-only`];
    if ('resourceShape' in value || 'status' in value || 'traceIds' in value) return validateSmokeEvidence(file, value);
    return validateCaptureManifest(file, value, 'summary-only', smokeCaptureManifestKeys);
  }

  return [`${file}: JSON artifact must declare an allowed mode`];
}

function validateCaptureManifest(file: string, value: Record<string, unknown>, visualReview: string, allowedKeys: Set<string>): string[] {
  const failures = [
    ...unknownKeys(file, 'capture manifest', value, allowedKeys),
    ...expectString(file, value, 'generatedAt'),
    ...expectString(file, value, 'pageUrl'),
    ...expectStringArray(file, value, 'screenshots', { pathLike: true }),
    ...expectStringArray(file, value, 'videos', { pathLike: true }),
    ...validateProvenance(file, value.provenance, captureProvenanceKeys)
  ];

  if (value.visualReview !== visualReview) failures.push(`${file}: capture manifest must declare visualReview=${visualReview}`);
  if (!Array.isArray(value.caseResults)) {
    failures.push(`${file}: caseResults must be an array`);
  } else {
    for (const [index, result] of value.caseResults.entries()) failures.push(...validateCaseResult(file, result, index));
  }
  if ('smokeEvidencePath' in value) failures.push(...expectString(file, value, 'smokeEvidencePath', { pathLike: true }));

  return failures;
}

function validateSmokeEvidence(file: string, value: Record<string, unknown>): string[] {
  return [
    ...unknownKeys(file, 'smoke evidence', value, smokeEvidenceKeys),
    ...expectString(file, value, 'status'),
    ...expectString(file, value, 'generatedAt'),
    ...expectStringArray(file, value, 'traceIds'),
    ...expectStringArray(file, value, 'responseHashes', { hashLike: true }),
    ...expectStringArray(file, value, 'citationIds'),
    ...validateProvenance(file, value.provenance, smokeProvenanceKeys),
    ...validateResourceShape(file, value.resourceShape)
  ];
}

function validateCaseResult(file: string, value: unknown, index: number): string[] {
  if (!isRecord(value)) return [`${file}: caseResults[${index}] must be an object`];
  return [
    ...unknownKeys(file, `caseResults[${index}]`, value, caseResultKeys),
    ...expectString(file, value, 'id'),
    ...expectString(file, value, 'traceId'),
    ...expectString(file, value, 'responseHash', { hashLike: true }),
    ...expectStringArray(file, value, 'citationIds')
  ];
}

function validateProvenance(file: string, value: unknown, allowedKeys: Set<string>): string[] {
  if (!isRecord(value)) return [`${file}: provenance must be an object`];
  return [
    ...unknownKeys(file, 'provenance', value, allowedKeys),
    ...Object.keys(value).flatMap((key) => expectString(file, value, key))
  ];
}

function validateResourceShape(file: string, value: unknown): string[] {
  if (!isRecord(value)) return [`${file}: resourceShape must be an object`];
  const failures = unknownKeys(file, 'resourceShape', value, resourceShapeKeys);
  for (const [key, entry] of Object.entries(value)) {
    if (Array.isArray(entry) && !entry.every((item) => typeof item === 'string')) failures.push(`${file}: resourceShape.${key} must contain strings`);
    if (!Array.isArray(entry) && !['string', 'number', 'boolean'].includes(typeof entry)) failures.push(`${file}: resourceShape.${key} must be scalar or string array`);
  }
  return failures;
}

function unknownKeys(file: string, label: string, value: Record<string, unknown>, allowed: Set<string>): string[] {
  return Object.keys(value).filter((key) => !allowed.has(key)).map((key) => `${file}: ${label} contains non-allowlisted field ${key}`);
}

function expectString(file: string, value: Record<string, unknown>, key: string, options: { hashLike?: boolean; pathLike?: boolean } = {}): string[] {
  const entry = value[key];
  if (typeof entry !== 'string') return [`${file}: ${key} must be a string`];
  return validateString(file, key, entry, options);
}

function expectStringArray(file: string, value: Record<string, unknown>, key: string, options: { hashLike?: boolean; pathLike?: boolean } = {}): string[] {
  const entry = value[key];
  if (!Array.isArray(entry)) return [`${file}: ${key} must be an array`];
  return entry.flatMap((item, index) => typeof item === 'string' ? validateString(file, `${key}[${index}]`, item, options) : [`${file}: ${key}[${index}] must be a string`]);
}

function validateString(file: string, label: string, value: string, options: { hashLike?: boolean; pathLike?: boolean }): string[] {
  const failures: string[] = [];
  if (options.hashLike && !/^[a-f0-9]{64}$/.test(value)) failures.push(`${file}: ${label} must be a sha256 hex hash`);
  if (options.pathLike && (value.startsWith('/') || value.includes('..'))) failures.push(`${file}: ${label} must be a relative artifact path`);
  return failures;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function collectFiles(root: string): Promise<string[]> {
  const info = await stat(root);
  if (!info.isDirectory()) return [root];
  const entries = await readdir(root);
  const nested = await Promise.all(entries.map((entry) => collectFiles(join(root, entry))));
  return nested.flat();
}

function extension(file: string): string {
  const dot = file.lastIndexOf('.');
  return dot === -1 ? '' : file.slice(dot).toLowerCase();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await checkDemoArtifacts();
}
