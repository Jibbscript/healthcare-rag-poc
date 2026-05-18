import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, devices, type Browser, type Locator, type Page } from 'playwright';
import { demoFixtureResponses } from '../apps/web/src/lib/demoFixtures';
import { demoPrompts, type DemoPromptKind } from '../apps/web/src/lib/demoPrompts';
import { checkDemoArtifacts, validateJsonArtifact } from './check-demo-artifacts';

type CaptureMode = 'fixture-demo' | 'aws-smoke';

type Args = {
  mode: CaptureMode;
  baseUrl: string;
  outDir: string;
  smokeEvidencePath?: string;
};

type Manifest = {
  mode: CaptureMode;
  visualReview: 'fixture-ui' | 'summary-only';
  generatedAt: string;
  pageUrl: string;
  provenance: {
    commitSha: string;
    workflowRunId: string;
  };
  screenshots: string[];
  videos: string[];
  caseResults: Array<{
    id: DemoPromptKind;
    traceId: string;
    responseHash: string;
    citationIds: string[];
  }>;
  smokeEvidencePath?: string;
};

const defaultPagesUrl = 'https://jibbscript.github.io/healthcare-rag-poc/';

async function main(argv = process.argv.slice(2), env = process.env): Promise<void> {
  const args = parseArgs(argv, env);
  await mkdir(args.outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const manifest = args.mode === 'aws-smoke'
      ? await captureSmokeSummary(browser, args, env)
      : await captureFixtureDemo(browser, args, env);
    const manifestPath = join(args.outDir, 'manifest.json');
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await checkDemoArtifacts([args.outDir], env);
    process.stdout.write(`demo capture complete: ${manifestPath}\n`);
  } finally {
    await browser.close();
  }
}

async function captureFixtureDemo(browser: Browser, args: Args, env: NodeJS.ProcessEnv): Promise<Manifest> {
  const screenshots: string[] = [];
  const videos: string[] = [];
  const videoDir = join(args.outDir, 'video');
  await mkdir(videoDir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    recordVideo: { dir: videoDir, size: { width: 1440, height: 1000 } }
  });
  const page = await context.newPage();
  const video = page.video();

  await page.goto(args.baseUrl, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Healthcare RAG Demo Console' }).waitFor();
  screenshots.push(await screenshot(page, args.outDir, '01-fixture-idle.png'));

  await runPrompt(page, 'covered', /Fixture playback: in-network urgent care/);
  screenshots.push(await screenshot(page, args.outDir, '02-covered-citation.png'));

  await runPrompt(page, 'ambiguous', /NO_RETRIEVED_EVIDENCE/);
  screenshots.push(await screenshot(page, args.outDir, '03-no-evidence-refusal.png'));

  await runPrompt(page, 'safety', /MEDICAL_OR_LEGAL_ADVICE/);
  screenshots.push(await screenshot(page, args.outDir, '04-medical-advice-refusal.png'));

  await runPrompt(page, 'pii', /MEMBER_ID/);
  screenshots.push(await screenshot(page.locator('.evidence-panel'), args.outDir, '05-pii-redaction-evidence.png'));

  await context.close();
  if (video) {
    const source = await video.path();
    const target = join(videoDir, 'fixture-demo.webm');
    await rename(source, target);
    videos.push(relative(args.outDir, target));
  }

  const mobileContext = await browser.newContext(devices['iPhone 14']);
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(args.baseUrl, { waitUntil: 'networkidle' });
  await mobilePage.getByRole('heading', { name: 'Healthcare RAG Demo Console' }).waitFor();
  screenshots.push(await screenshot(mobilePage, args.outDir, '06-mobile-fixture-idle.png'));
  await mobileContext.close();

  return {
    mode: 'fixture-demo',
    visualReview: 'fixture-ui',
    generatedAt: new Date().toISOString(),
    pageUrl: args.baseUrl,
    provenance: provenance(env),
    screenshots,
    videos,
    caseResults: fixtureCaseResults()
  };
}

async function captureSmokeSummary(browser: Browser, args: Args, env: NodeJS.ProcessEnv): Promise<Manifest> {
  if (!args.smokeEvidencePath) throw new Error('--smoke-evidence is required when --mode aws-smoke');
  const evidenceText = await readFile(args.smokeEvidencePath, 'utf8');
  const evidence = JSON.parse(evidenceText) as {
    mode?: string;
    visualReview?: string;
    traceIds?: string[];
    responseHashes?: string[];
    citationIds?: string[];
    resourceShape?: unknown;
    provenance?: Record<string, unknown>;
  };
  if (evidence.mode !== 'aws-smoke' || evidence.visualReview !== 'summary-only') {
    throw new Error('smoke evidence must be a summary-only aws-smoke manifest');
  }
  const evidenceFailures = validateJsonArtifact(args.smokeEvidencePath, evidence);
  if (evidenceFailures.length) throw new Error(`Smoke evidence failed allowlist validation:\n${evidenceFailures.join('\n')}`);

  const summaryHtml = join(args.outDir, 'aws-smoke-summary.html');
  await writeFile(summaryHtml, renderSmokeSummary(evidence));

  const screenshots: string[] = [];
  const videos: string[] = [];
  const videoDir = join(args.outDir, 'video');
  await mkdir(videoDir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    recordVideo: { dir: videoDir, size: { width: 1440, height: 1000 } }
  });
  const page = await context.newPage();
  const video = page.video();

  await page.goto(args.baseUrl, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Healthcare RAG Demo Console' }).waitFor();
  screenshots.push(await screenshot(page, args.outDir, '01-live-pages-dashboard.png'));

  await page.goto(pathToFileURL(summaryHtml).href, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'AWS smoke evidence summary' }).waitFor();
  screenshots.push(await screenshot(page, args.outDir, '02-aws-smoke-summary.png'));

  await context.close();
  if (video) {
    const source = await video.path();
    const target = join(videoDir, 'aws-smoke-summary.webm');
    await rename(source, target);
    videos.push(relative(args.outDir, target));
  }

  return {
    mode: 'aws-smoke',
    visualReview: 'summary-only',
    generatedAt: new Date().toISOString(),
    pageUrl: args.baseUrl,
    provenance: provenance(env),
    screenshots,
    videos,
    caseResults: [],
    smokeEvidencePath: relative(args.outDir, args.smokeEvidencePath)
  };
}

async function runPrompt(page: Page, id: DemoPromptKind, expectedText: RegExp): Promise<void> {
  const prompt = demoPrompts.find((value) => value.id === id);
  if (!prompt) throw new Error(`Unknown prompt: ${id}`);
  if (id !== 'covered') await page.getByRole('button', { name: new RegExp(prompt.label, 'i') }).click();
  await page.getByRole('button', { name: 'Run question' }).click();
  await page.getByText(expectedText).first().waitFor();
}

async function screenshot(target: Page | Locator, outDir: string, name: string): Promise<string> {
  const path = join(outDir, name);
  if ('goto' in target) {
    await target.screenshot({ path, fullPage: true });
  } else {
    await target.screenshot({ path });
  }
  return relative(outDir, path);
}

function fixtureCaseResults(): Manifest['caseResults'] {
  return demoPrompts.map((prompt) => {
    const response = demoFixtureResponses[prompt.id];
    return {
      id: prompt.id,
      traceId: response.traceId,
      responseHash: createHash('sha256').update(response.answer).digest('hex'),
      citationIds: response.citations.map((citation) => citation.citationId)
    };
  });
}

function renderSmokeSummary(evidence: {
  traceIds?: string[];
  responseHashes?: string[];
  citationIds?: string[];
  resourceShape?: unknown;
  provenance?: Record<string, unknown>;
}): string {
  const rows = [
    ['Trace ids', (evidence.traceIds ?? []).join(', ') || 'not captured'],
    ['Response hashes', (evidence.responseHashes ?? []).join(', ') || 'not captured'],
    ['Citation ids', (evidence.citationIds ?? []).join(', ') || 'not captured'],
    ['Resource shape', JSON.stringify(evidence.resourceShape ?? {})],
    ['Provenance', JSON.stringify(evidence.provenance ?? {})]
  ];
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AWS smoke evidence summary</title>
  <style>
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f7f5ef; color: #17211d; }
    main { width: min(1080px, calc(100vw - 64px)); margin: 48px auto; }
    h1 { font-size: 34px; margin: 0 0 8px; }
    p { color: #526057; margin: 0 0 24px; }
    table { width: 100%; border-collapse: collapse; background: #fffefa; border: 1px solid #d8ddd3; }
    th, td { padding: 18px; border-bottom: 1px solid #e4e7de; text-align: left; vertical-align: top; }
    th { width: 220px; color: #35433c; }
    td { word-break: break-word; font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace; font-size: 13px; line-height: 1.45; }
    .badge { display: inline-block; padding: 6px 10px; border: 1px solid #93b89e; background: #edf7ef; color: #23432d; font-size: 13px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <main>
    <span class="badge">summary-only aws-smoke artifact</span>
    <h1>AWS smoke evidence summary</h1>
    <p>Manual capture uses hashes, trace ids, citation ids, and resource-shape metadata only.</p>
    <table>
      <tbody>
        ${rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('\n        ')}
      </tbody>
    </table>
  </main>
</body>
</html>
`;
}

function parseArgs(argv: string[], env: NodeJS.ProcessEnv): Args {
  const args: Args = {
    mode: 'fixture-demo',
    baseUrl: env.DEMO_BASE_URL ?? defaultPagesUrl,
    outDir: env.DEMO_CAPTURE_OUT ?? join('demo-artifacts', timestamp())
  };

  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    const next = argv[i + 1];
    if (value === '--') {
      continue;
    } else if (value === '--mode' && isCaptureMode(next)) {
      args.mode = next;
      i += 1;
    } else if (value === '--base-url' && next) {
      args.baseUrl = next;
      i += 1;
    } else if (value === '--out' && next) {
      args.outDir = next;
      i += 1;
    } else if (value === '--smoke-evidence' && next) {
      args.smokeEvidencePath = next;
      i += 1;
    } else {
      throw new Error(`Unknown or incomplete argument: ${value}`);
    }
  }

  return args;
}

function isCaptureMode(value: string | undefined): value is CaptureMode {
  return value === 'fixture-demo' || value === 'aws-smoke';
}

function provenance(env: NodeJS.ProcessEnv): Manifest['provenance'] {
  return {
    commitSha: env.GITHUB_SHA ?? readGitSha(),
    workflowRunId: env.GITHUB_RUN_ID ?? 'local'
  };
}

function readGitSha(): string {
  const head = '.git/HEAD';
  if (!existsSync(head)) return 'local';
  const value = readFileSync(head, 'utf8').trim();
  if (!value.startsWith('ref: ')) return value;
  const refPath = `.git/${value.slice(5)}`;
  return existsSync(refPath) ? readFileSync(refPath, 'utf8').trim() : 'local';
}

function timestamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
