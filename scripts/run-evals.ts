import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import YAML from 'yaml';
import { evalCaseSchema, scoreResponse, sha256, type EvalCase, type EvalResult, type Profile } from '@healthcare-rag/core';
import { createProviderBundle } from '../apps/api/src/bootstrap';
import { runChatPipeline } from '@healthcare-rag/core';

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const args = parseArgs(argv);
  const profile = String(args.profile ?? 'local') as Profile;
  const outPath = String(args.out ?? 'evals/reports/local-eval.json');
  const maxCases = args['max-cases'] ? Number(args['max-cases']) : undefined;
  const tags = args.tags ? String(args.tags).split(',') : [];
  const cases = await loadCases('evals/cases/demo.yaml');
  const selected = cases.filter((c) => tags.length === 0 || tags.some((tag) => c.tags.includes(tag))).slice(0, maxCases ?? cases.length);
  const providers = await createProviderBundle(profile);
  const results: EvalResult[] = [];
  for (const testCase of selected) {
    const started = Date.now();
    const response = await runChatPipeline({ sessionId: `eval-${testCase.id}`, message: testCase.input, profile, debug: true }, providers);
    const trace = await providers.auditStore.getTrace(response.traceId) ?? undefined;
    results.push(scoreResponse(testCase, response, trace, Date.now() - started));
  }
  const summary = { runId: `eval_${sha256(JSON.stringify(results)).slice(0, 12)}`, profile, cases: selected.length, passed: results.filter((r) => r.passed).length, failed: results.filter((r) => !r.passed).length };
  const report = { summary, results };
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(report, null, 2));
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  if (results.some((r) => !r.passed)) process.exitCode = 1;
}

async function loadCases(path: string): Promise<EvalCase[]> {
  const raw = YAML.parse(await readFile(path, 'utf8')) as { cases: unknown[] };
  return raw.cases.map((item) => evalCaseSchema.parse(item));
}
function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];
  return out;
}
if (import.meta.url === `file://${process.argv[1]}`) await main();
