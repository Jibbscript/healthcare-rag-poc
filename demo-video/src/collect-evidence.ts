import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { parse } from 'yaml';
import { assertPublishableText } from './safety';

type CommandResult = {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
};

type EvidenceManifest = {
  generatedAt: string;
  repo: string;
  deployUrl: string;
  sourceEvidence: Record<string, string>;
  screenshots: string[];
  copiedArtifacts: string[];
  visualSafety: {
    strategy: string;
    syntheticFixturePromptAnswerScreensAllowed: boolean;
  };
  visibleIdentifierAllowlist: string[];
};

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(packageRoot, '..');
const rawDir = join(packageRoot, 'private', 'raw-evidence');
const publicEvidenceDir = join(packageRoot, 'public', 'evidence');
const htmlDir = join(publicEvidenceDir, 'html');
const repo = 'Jibbscript/healthcare-rag-poc';
const requiredPublicArtifactCopies: Array<[source: string, target: string]> = [
  ['demo-artifacts/fixture-demo/02-covered-citation.png', '07-synthetic-fixture-covered-citation.png'],
  ['demo-artifacts/fixture-demo/03-no-evidence-refusal.png', '08-no-evidence-refusal.png'],
  ['demo-artifacts/fixture-demo/04-medical-advice-refusal.png', '09-medical-advice-refusal.png'],
  ['demo-artifacts/fixture-demo/05-pii-redaction-evidence.png', '10-pii-redaction-evidence.png'],
  ['demo-artifacts/aws-smoke/02-aws-smoke-summary.png', '11-aws-smoke-summary.png']
];

export async function collectEvidence(): Promise<EvidenceManifest> {
  await rm(publicEvidenceDir, { recursive: true, force: true });
  await mkdir(rawDir, { recursive: true });
  await mkdir(htmlDir, { recursive: true });

  const pagesRun = await latestPagesRun();
  const pagesRunDetails = await ghJson(['run', 'view', String(pagesRun.databaseId), '--repo', repo, '--json', 'name,status,conclusion,url,createdAt,updatedAt,jobs']);
  const pagesSettings = await ghJson(['api', `repos/${repo}/pages`]);
  const workflowText = await readFile(join(repoRoot, '.github/workflows/demo-capture.yml'), 'utf8');
  const workflow = parse(workflowText) as Record<string, unknown>;
  const runbook = await readFile(join(repoRoot, 'docs/runbooks/aws-smoke.md'), 'utf8');
  const fixtureManifest = JSON.parse(await readFile(join(repoRoot, 'demo-artifacts/fixture-demo/manifest.json'), 'utf8')) as Record<string, unknown>;
  await rm(join(repoRoot, 'demo-artifacts/remotion/healthcare-rag-demo.ffprobe.json'), { force: true });
  const artifactCheck = await execCapture('pnpm', ['demo:check-artifacts', '--', 'demo-artifacts'], repoRoot);

  if (artifactCheck.exitCode !== 0) {
    throw new Error(`pnpm demo:check-artifacts failed:\n${artifactCheck.stdout}\n${artifactCheck.stderr}`);
  }

  await writeJson(join(rawDir, 'pages-run.json'), pagesRunDetails);
  await writeJson(join(rawDir, 'pages-settings.json'), pagesSettings);
  await writeFile(join(rawDir, 'demo-capture-workflow.yml'), workflowText);
  await writeJson(join(rawDir, 'artifact-check.json'), artifactCheck);

  const deployUrl = stringFrom(asRecord(pagesSettings), ['html_url']) || 'https://jibbscript.github.io/healthcare-rag-poc/';
  const screenshots = await renderEvidenceScreens({
    pagesRun: sanitizeRun(pagesRunDetails, deployUrl),
    pagesSettings: sanitizePagesSettings(pagesSettings),
    dispatch: sanitizeWorkflowDispatch(workflow),
    runbook: sanitizeRunbook(runbook),
    artifactCheck: sanitizeCommandResult(artifactCheck),
    fixtureManifest: sanitizeFixtureManifest(fixtureManifest)
  });

  const copiedArtifacts = await copyExistingArtifacts();
  const manifest: EvidenceManifest = {
    generatedAt: new Date().toISOString(),
    repo,
    deployUrl,
    sourceEvidence: {
      pagesRun: 'private/raw-evidence/pages-run.json',
      pagesSettings: 'private/raw-evidence/pages-settings.json',
      demoCaptureWorkflow: 'private/raw-evidence/demo-capture-workflow.yml',
      artifactCheck: 'private/raw-evidence/artifact-check.json'
    },
    screenshots,
    copiedArtifacts,
    visualSafety: {
      strategy: 'Workflow/runbook/terminal evidence is summary-only. Synthetic fixture-demo prompt/answer UI may appear; smoke request bodies, real prompts, real answers, real identifiers, account ids, and keys remain excluded.',
      syntheticFixturePromptAnswerScreensAllowed: true
    },
    visibleIdentifierAllowlist: [
      repo,
      deployUrl,
      'Pages dashboard',
      'Demo capture',
      'fixture-demo',
      'aws-smoke',
      'dry_run',
      'I_UNDERSTAND_THIS_CREATES_PAID_SMOKE_RESOURCES',
      'masta'
    ]
  };

  await writeJson(join(publicEvidenceDir, 'manifest.json'), manifest);
  await assertPublishableText([publicEvidenceDir]);
  return manifest;
}

async function latestPagesRun(): Promise<{ databaseId: number }> {
  const runs = await ghJson(['run', 'list', '--repo', repo, '--workflow', 'pages.yml', '--limit', '10', '--json', 'databaseId,conclusion,status,createdAt']);
  if (!Array.isArray(runs) || runs.length === 0) throw new Error('No Pages dashboard workflow runs found');
  const selected = runs.find((run) => run.conclusion === 'success');
  if (!selected) throw new Error('No successful Pages dashboard workflow run found');
  if (typeof selected.databaseId !== 'number') throw new Error('Pages run did not include a numeric databaseId');
  return { databaseId: selected.databaseId };
}

async function ghJson(args: string[]): Promise<Record<string, unknown> | Array<Record<string, unknown>>> {
  const result = await execCapture('gh', args, repoRoot);
  if (result.exitCode !== 0) throw new Error(`gh ${args.join(' ')} failed:\n${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout) as Record<string, unknown> | Array<Record<string, unknown>>;
}

function sanitizeRun(value: Record<string, unknown> | Array<Record<string, unknown>>, deployUrl: string): Record<string, unknown> {
  const run = Array.isArray(value) ? value[0] ?? {} : value;
  const jobs = Array.isArray(run.jobs) ? run.jobs : [];
  return {
    title: stringFrom(run, ['name']) || 'Pages dashboard',
    status: stringFrom(run, ['status']) || 'unknown',
    conclusion: stringFrom(run, ['conclusion']) || 'unknown',
    createdAt: stringFrom(run, ['createdAt']) || 'unknown',
    updatedAt: stringFrom(run, ['updatedAt']) || 'unknown',
    runUrl: stringFrom(run, ['url']) || '',
    deployUrl,
    jobs: jobs.map((job) => sanitizeJob(job as Record<string, unknown>))
  };
}

function sanitizeJob(job: Record<string, unknown>): Record<string, unknown> {
  const steps = Array.isArray(job.steps) ? job.steps : [];
  return {
    name: stringFrom(job, ['name']) || 'unnamed job',
    conclusion: stringFrom(job, ['conclusion']) || 'unknown',
    steps: steps
      .map((step) => ({
        name: stringFrom(step as Record<string, unknown>, ['name']) || 'unnamed step',
        conclusion: stringFrom(step as Record<string, unknown>, ['conclusion']) || 'unknown'
      }))
      .filter((step) => !step.name.startsWith('Post ') && !['Set up job', 'Complete job'].includes(step.name))
  };
}

function sanitizePagesSettings(value: Record<string, unknown> | Array<Record<string, unknown>>): Record<string, unknown> {
  const settings = Array.isArray(value) ? value[0] ?? {} : value;
  const source = isRecord(settings.source) ? settings.source : {};
  return {
    evidenceLabel: 'GitHub API repository Pages settings',
    deployUrl: stringFrom(settings, ['html_url']) || '',
    buildType: stringFrom(settings, ['build_type']) || 'unknown',
    sourceBranch: stringFrom(source, ['branch']) || 'unknown',
    sourcePath: stringFrom(source, ['path']) || 'unknown'
  };
}

function sanitizeWorkflowDispatch(workflow: Record<string, unknown>): Record<string, unknown> {
  const on = isRecord(workflow.on) ? workflow.on : {};
  const dispatch = isRecord(on.workflow_dispatch) ? on.workflow_dispatch : {};
  const inputs = isRecord(dispatch.inputs) ? dispatch.inputs : {};
  const inputRows = Object.entries(inputs).map(([name, raw]) => {
    const input = isRecord(raw) ? raw : {};
    return {
      name,
      type: stringFrom(input, ['type']) || 'string',
      required: input.required === true,
      default: typeof input.default === 'string' || typeof input.default === 'boolean' ? String(input.default) : '',
      options: Array.isArray(input.options) ? input.options.filter((item) => typeof item === 'string') : [],
      description: stringFrom(input, ['description']) || ''
    };
  });

  return {
    workflowName: stringFrom(workflow, ['name']) || 'Demo capture',
    inputs: inputRows.filter((input) => ['mode', 'dry_run', 'confirmation', 'stack_ownership_mode'].includes(input.name))
  };
}

function sanitizeRunbook(markdown: string): Record<string, unknown> {
  const lines = markdown.split('\n');
  const costLines = lines.filter((line) =>
    line.includes('one paid Bedrock Runtime interface endpoint') ||
    line.includes('Destroy workflow-owned stacks') ||
    line.includes('Keep the smoke cost shape free')
  );
  const teardownLines = [
    'For workflow-owned demos, set DESTROY_AFTER_RUN=true so the smoke script destroys the stack before final evidence.',
    'Fallback destroy command:',
    'CONFIRM_AWS_SMOKE_DESTROY=destroy-smoke scripts/destroy-smoke.sh'
  ];

  return {
    title: 'aws-smoke runbook: teardown and cost boundary',
    costWarning: costLines,
    teardown: teardownLines
  };
}

function sanitizeCommandResult(result: CommandResult): Record<string, unknown> {
  return {
    command: result.command,
    exitCode: result.exitCode,
    stdout: result.stdout.trim().split('\n').filter(Boolean).slice(-6),
    stderr: result.stderr.trim().split('\n').filter(Boolean).slice(-3)
  };
}

function sanitizeFixtureManifest(value: Record<string, unknown>): Record<string, unknown> {
  const caseResults = Array.isArray(value.caseResults) ? value.caseResults : [];
  return {
    title: 'fixture-demo capture manifest',
    mode: stringFrom(value, ['mode']) || 'fixture-demo',
    visualReview: stringFrom(value, ['visualReview']) || 'fixture-ui',
    screenshots: Array.isArray(value.screenshots) ? value.screenshots.length : 0,
    videos: Array.isArray(value.videos) ? value.videos.length : 0,
    cases: caseResults.map((entry) => {
      const record = isRecord(entry) ? entry : {};
      return {
        id: stringFrom(record, ['id']),
        responseHash: stringFrom(record, ['responseHash']).slice(0, 12),
        citationCount: Array.isArray(record.citationIds) ? record.citationIds.length : 0
      };
    })
  };
}

async function renderEvidenceScreens(data: Record<string, Record<string, unknown>>): Promise<string[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const entries: Array<[string, string]> = [
    ['01-pages-run.png', pagesRunHtml(data.pagesRun)],
    ['02-pages-settings.png', settingsHtml(data.pagesSettings)],
    ['03-demo-dispatch.png', dispatchHtml(data.dispatch)],
    ['04-aws-runbook.png', runbookHtml(data.runbook)],
    ['05-artifact-check.png', terminalHtml(data.artifactCheck)],
    ['06-fixture-manifest.png', fixtureManifestHtml(data.fixtureManifest)]
  ];

  const screenshots: string[] = [];
  try {
    for (const [filename, html] of entries) {
      const htmlPath = join(htmlDir, filename.replace(/\.png$/, '.html'));
      const pngPath = join(publicEvidenceDir, filename);
      await writeFile(htmlPath, html);
      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.screenshot({ path: pngPath, fullPage: false });
      screenshots.push(`evidence/${filename}`);
    }
  } finally {
    await browser.close();
  }

  return screenshots;
}

async function copyExistingArtifacts(): Promise<string[]> {
  const copied: string[] = [];
  for (const [sourceRelative, target] of requiredPublicArtifactCopies) {
    const source = join(repoRoot, sourceRelative);
    if (!existsSync(source)) {
      throw new Error(`Missing required Remotion evidence source: ${sourceRelative}`);
    }
    await copyFile(source, join(publicEvidenceDir, target));
    copied.push(`evidence/${target}`);
  }
  return copied;
}

function pagesRunHtml(value: Record<string, unknown>): string {
  const jobs = Array.isArray(value.jobs) ? value.jobs : [];
  const cards = jobs.map((job) => {
    const record = job as Record<string, unknown>;
    const steps = Array.isArray(record.steps) ? record.steps : [];
    return `<section class="card">
      <div class="card-title">${escapeHtml(stringFrom(record, ['name']))}</div>
      <div class="pill success">${escapeHtml(stringFrom(record, ['conclusion']))}</div>
      <div class="steps">${steps.map((step) => `<div><span>✓</span>${escapeHtml(stringFrom(step as Record<string, unknown>, ['name']))}</div>`).join('')}</div>
    </section>`;
  }).join('');

  return pageHtml({
    eyebrow: 'sanitized rendering from GitHub Actions metadata',
    title: 'Pages dashboard run',
    subtitle: `${escapeHtml(stringFrom(value, ['conclusion']))} deployment with verification gates and Pages deploy URL`,
    body: `<div class="hero-grid">
      <section class="metric"><b>Deploy URL</b><span>${escapeHtml(stringFrom(value, ['deployUrl']))}</span></section>
      <section class="metric"><b>Run status</b><span>${escapeHtml(stringFrom(value, ['status']))} / ${escapeHtml(stringFrom(value, ['conclusion']))}</span></section>
      <section class="metric"><b>Updated</b><span>${escapeHtml(stringFrom(value, ['updatedAt']))}</span></section>
    </div><div class="cards two">${cards}</div>`
  });
}

function settingsHtml(value: Record<string, unknown>): string {
  return pageHtml({
    eyebrow: 'sanitized rendering from GitHub Pages API metadata',
    title: 'Repository Pages settings',
    subtitle: 'Source is configured for GitHub Actions workflow deployment.',
    body: `<div class="settings-panel">
      ${keyValue('Pages source', 'GitHub Actions')}
      ${keyValue('API build_type', stringFrom(value, ['buildType']))}
      ${keyValue('Source branch/path', `${stringFrom(value, ['sourceBranch'])} ${stringFrom(value, ['sourcePath'])}`)}
      ${keyValue('Published URL', stringFrom(value, ['deployUrl']))}
    </div>`
  });
}

function dispatchHtml(value: Record<string, unknown>): string {
  const inputs = Array.isArray(value.inputs) ? value.inputs : [];
  const rows = inputs.map((input) => {
    const record = input as Record<string, unknown>;
    const options = Array.isArray(record.options) ? record.options.join(' / ') : '';
    const name = stringFrom(record, ['name']);
    const visibleValue = name === 'confirmation'
      ? 'I_UNDERSTAND_THIS_CREATES_PAID_SMOKE_RESOURCES'
      : options || stringFrom(record, ['default']);
    return `<tr>
      <th>${escapeHtml(name)}</th>
      <td>${escapeHtml(stringFrom(record, ['type']))}</td>
      <td>${escapeHtml(visibleValue)}</td>
      <td>${escapeHtml(stringFrom(record, ['description']))}</td>
    </tr>`;
  }).join('');

  return pageHtml({
    eyebrow: 'sanitized rendering from .github/workflows/demo-capture.yml',
    title: 'Demo capture workflow dispatch',
    subtitle: 'Manual operator inputs keep fixture capture cheap and real smoke capture explicit.',
    body: `<table class="input-table"><thead><tr><th>Input</th><th>Type</th><th>Visible control/value</th><th>Purpose</th></tr></thead><tbody>${rows}</tbody></table>`
  });
}

function runbookHtml(value: Record<string, unknown>): string {
  const costWarning = Array.isArray(value.costWarning) ? value.costWarning : [];
  const teardown = Array.isArray(value.teardown) ? value.teardown : [];
  return pageHtml({
    eyebrow: 'sanitized rendering from docs/runbooks/aws-smoke.md',
    title: 'aws-smoke teardown and cost warning',
    subtitle: 'The paid path is explicit, short-lived, and bounded by smoke resource-shape checks.',
    body: `<div class="columns">
      <section class="card"><div class="card-title">Cost boundary</div>${bullets(costWarning.map(String))}</section>
      <section class="card"><div class="card-title">Teardown proof</div>${bullets(teardown.map(String))}</section>
    </div>`
  });
}

function terminalHtml(value: Record<string, unknown>): string {
  const stdout = Array.isArray(value.stdout) ? value.stdout.map(String) : [];
  const stderr = Array.isArray(value.stderr) ? value.stderr.map(String) : [];
  return pageHtml({
    eyebrow: 'sanitized terminal capture',
    title: 'Artifact safety check',
    subtitle: 'Publishable demo artifacts passed the allowlist gate before video assembly.',
    body: `<pre class="terminal"><span>$ ${escapeHtml(stringFrom(value, ['command']))}</span>
${escapeHtml([...stdout, ...stderr].join('\n'))}

exit code: ${escapeHtml(String(value.exitCode ?? 'unknown'))}</pre>`
  });
}

function fixtureManifestHtml(value: Record<string, unknown>): string {
  const cases = Array.isArray(value.cases) ? value.cases : [];
  const rows = cases.map((entry) => {
    const record = isRecord(entry) ? entry : {};
    return `<tr>
      <th>${escapeHtml(stringFrom(record, ['id']))}</th>
      <td>${escapeHtml(stringFrom(record, ['responseHash']))}...</td>
      <td>${escapeHtml(String(record.citationCount ?? 0))}</td>
    </tr>`;
  }).join('');

  return pageHtml({
    eyebrow: 'summary-only rendering from demo-artifacts/fixture-demo/manifest.json',
    title: 'Fixture capture evidence',
    subtitle: 'Prompt and answer screens are excluded; the video uses case ids, response-hash prefixes, and citation counts only.',
    body: `<div class="hero-grid">
      <section class="metric"><b>Mode</b><span>${escapeHtml(stringFrom(value, ['mode']))}</span></section>
      <section class="metric"><b>Screenshots</b><span>${escapeHtml(String(value.screenshots ?? 0))}</span></section>
      <section class="metric"><b>Videos</b><span>${escapeHtml(String(value.videos ?? 0))}</span></section>
    </div>
    <table class="input-table"><thead><tr><th>Case</th><th>Response hash prefix</th><th>Citation count</th></tr></thead><tbody>${rows}</tbody></table>`
  });
}

function pageHtml({ eyebrow, title, subtitle, body }: { eyebrow: string; title: string; subtitle: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; --ink: #12231c; --muted: #5a675f; --line: #cfd8d2; --paper: #fbfaf6; --panel: #ffffff; --green: #0e6f4c; --blue: #1f5d8f; --amber: #a26713; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: linear-gradient(135deg, #eef7f2 0%, #f8f1e4 48%, #edf4fb 100%); color: var(--ink); }
    main { width: 1760px; height: 920px; margin: 80px auto; padding: 48px; background: rgba(255,255,255,0.88); border: 1px solid rgba(29,51,43,0.15); box-shadow: 0 28px 80px rgba(21, 35, 30, 0.18); }
    .eyebrow { display: inline-flex; border: 1px solid #9bb8a7; color: #164b35; background: #eef8f1; padding: 8px 12px; font-size: 18px; font-weight: 700; }
    h1 { margin: 22px 0 10px; font-size: 64px; line-height: 1; letter-spacing: 0; }
    .subtitle { width: 1120px; color: var(--muted); font-size: 28px; line-height: 1.3; margin: 0 0 36px; }
    .hero-grid { display: grid; grid-template-columns: 1.5fr 0.7fr 0.8fr; gap: 18px; margin-bottom: 24px; }
    .metric, .card, .settings-panel, .terminal, .input-table { background: var(--panel); border: 1px solid var(--line); }
    .metric { padding: 26px; min-width: 0; }
    .metric b, .card-title { display: block; font-size: 20px; color: #24372e; margin-bottom: 12px; }
    .metric span { display: block; font-size: 25px; line-height: 1.22; overflow-wrap: anywhere; }
    .cards { display: grid; gap: 18px; }
    .cards.two, .columns { grid-template-columns: 1fr 1fr; display: grid; gap: 18px; }
    .card { padding: 24px; min-height: 260px; }
    .pill { display: inline-flex; padding: 6px 10px; border: 1px solid #9ac9b4; background: #eff9f2; color: var(--green); font-weight: 800; margin-bottom: 16px; }
    .steps { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; color: #25362d; font-size: 18px; line-height: 1.25; }
    .steps span { color: var(--green); font-weight: 900; padding-right: 8px; }
    .settings-panel { display: grid; gap: 18px; padding: 28px; width: 1180px; }
    .kv { display: grid; grid-template-columns: 330px 1fr; gap: 22px; font-size: 28px; align-items: center; border-bottom: 1px solid #e1e7e2; padding-bottom: 18px; }
    .kv:last-child { border-bottom: 0; padding-bottom: 0; }
    .kv b { color: #405247; font-size: 22px; }
    .input-table { border-collapse: collapse; width: 100%; font-size: 21px; }
    .input-table th, .input-table td { border-bottom: 1px solid #e0e6e2; padding: 18px; text-align: left; vertical-align: top; }
    .input-table th { width: 230px; color: #26362f; }
    ul { margin: 0; padding-left: 24px; font-size: 25px; line-height: 1.35; color: #26362f; }
    li { margin-bottom: 18px; }
    .terminal { margin: 0; width: 1220px; padding: 28px; color: #d8f8e7; background: #10251d; font: 26px/1.45 "SFMono-Regular", Menlo, Consolas, monospace; white-space: pre-wrap; }
    .terminal span { color: #9fe2bd; }
  </style>
</head>
<body><main><div class="eyebrow">${escapeHtml(eyebrow)}</div><h1>${escapeHtml(title)}</h1><p class="subtitle">${escapeHtml(subtitle)}</p>${body}</main></body>
</html>`;
}

function keyValue(key: string, value: string): string {
  return `<div class="kv"><b>${escapeHtml(key)}</b><span>${escapeHtml(value)}</span></div>`;
}

function bullets(items: string[]): string {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item.replace(/^- /, ''))}</li>`).join('')}</ul>`;
}

async function execCapture(command: string, args: string[], cwd: string): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => resolve({ command: [command, ...args].join(' '), exitCode: code ?? 1, stdout, stderr }));
  });
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function stringFrom(value: Record<string, unknown>, keys: string[]): string {
  let current: unknown = value;
  for (const key of keys) {
    if (!isRecord(current)) return '';
    current = current[key];
  }
  return typeof current === 'string' ? current : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRecord(value: Record<string, unknown> | Array<Record<string, unknown>>): Record<string, unknown> {
  return Array.isArray(value) ? value[0] ?? {} : value;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifest = await collectEvidence();
  process.stdout.write(`demo video evidence collected: ${manifest.screenshots.length + manifest.copiedArtifacts.length} publishable assets\n`);
}
