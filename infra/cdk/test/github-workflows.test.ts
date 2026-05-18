import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';

describe('GitHub Pages and demo-capture workflows', () => {
  it('deploys Pages through the official artifact workflow after repo verification', () => {
    const text = readFileSync('.github/workflows/pages.yml', 'utf8');
    const workflow = YAML.parse(text) as Record<string, unknown>;

    expect(text).toContain('actions/configure-pages@v5');
    expect(text).toContain('actions/upload-pages-artifact@v4');
    expect(text).toContain('actions/deploy-pages@v4');
    expect(text).toContain('GITHUB_PAGES=true pnpm web:build');
    expect(text).toContain('pnpm eval:local');
    expect(text).toContain('path: apps/web/dist');
    expect(text).toContain('pages: write');
    expect(text).toContain('id-token: write');
    expect(text).toContain('name: github-pages');
    expect(text).not.toContain('aws-smoke');

    expect(workflow.concurrency).toMatchObject({ group: 'pages', 'cancel-in-progress': false });
  });

  it('keeps aws-smoke capture manual, typed-confirmed, and summary-only', () => {
    const text = readFileSync('.github/workflows/demo-capture.yml', 'utf8');
    const workflow = YAML.parse(text) as { on?: Record<string, unknown> };

    expect(workflow.on).toHaveProperty('workflow_dispatch');
    expect(text).toContain('I_UNDERSTAND_THIS_CREATES_PAID_SMOKE_RESOURCES');
    expect(text).toContain('aws-actions/configure-aws-credentials@v6');
    expect(text).toContain('fixture_capture:');
    expect(text).toContain('smoke_dry_run_capture:');
    expect(text).toContain('smoke_real_capture:');
    expect(text).toMatch(/smoke_real_capture:[\s\S]*id-token: write/);
    expect(text).toContain('scripts/aws-smoke-run.sh');
    expect(text).toContain('SMOKE_EVIDENCE_OUT');
    expect(text).toContain('pnpm demo:check-artifacts -- demo-artifacts');
    expect(text).toContain('actions/upload-artifact@v6');
    expect(text).not.toContain('CORS');
  });
});
