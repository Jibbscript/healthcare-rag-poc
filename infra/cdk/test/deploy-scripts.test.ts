import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('smoke deployment scripts', () => {
  it('deploys the synthesized CloudFormation template instead of invoking cdk deploy on a non-CDK assembly', () => {
    const deploy = readFileSync('scripts/deploy-smoke.sh', 'utf8');
    expect(deploy).toContain('aws cloudformation deploy');
    expect(deploy).toContain('pnpm build:lambda-artifacts');
    expect(deploy).toContain('aws s3 cp "${CHAT_ZIP}"');
    expect(deploy).toContain('LambdaArtifactBucket=');
    expect(deploy).toContain('SmokeApiKey=');
    expect(deploy).toContain('HealthcareRagAwsSmoke.template.json');
    expect(deploy).not.toContain('cdk deploy');
    expect(deploy).not.toContain('npx cdk deploy');
  });

  it('destroys the CloudFormation stack instead of invoking cdk destroy on a non-CDK assembly', () => {
    const destroy = readFileSync('scripts/destroy-smoke.sh', 'utf8');
    expect(destroy).toContain('aws cloudformation delete-stack');
    expect(destroy).toContain('aws cloudformation wait stack-delete-complete');
    expect(destroy).not.toContain('cdk destroy');
    expect(destroy).not.toContain('npx cdk destroy');
  });

  it('does not print raw chat answers during smoke runs', () => {
    const smokeRun = readFileSync('scripts/aws-smoke-run.sh', 'utf8');
    const summarizer = readFileSync('scripts/summarize-smoke-response.ts', 'utf8');
    expect(smokeRun).toContain('scripts/summarize-smoke-response.ts');
    expect(summarizer).toContain('answerHash');
    expect(summarizer).toContain('createHash');
    expect(smokeRun).toContain('x-smoke-api-key');
    expect(smokeRun).not.toContain('curl -s "${API_URL:?}/chat" -H');
  });

  it('can emit sanitized smoke evidence for manual demo capture', () => {
    const smokeRun = readFileSync('scripts/aws-smoke-run.sh', 'utf8');
    const evidence = readFileSync('scripts/smoke-evidence.ts', 'utf8');
    expect(smokeRun).toContain('SMOKE_EVIDENCE_OUT');
    expect(smokeRun).toContain('RESOURCE_SHAPE_JSON');
    expect(evidence).toContain("mode: 'aws-smoke'");
    expect(evidence).toContain("visualReview: 'summary-only'");
    expect(evidence).toContain('accountHash');
    expect(evidence).toContain('responseHashes');
    expect(evidence).not.toContain('rawPrompt');
    expect(evidence).not.toContain('rawAnswer');
  });

  it('does not soften smoke cost-shape failures before evidence capture', () => {
    const smokeRun = readFileSync('scripts/aws-smoke-run.sh', 'utf8');
    expect(smokeRun).toContain('RESOURCE_SHAPE_JSON="$(pnpm --silent smoke:cost-shape)"');
    expect(smokeRun).not.toContain('smoke:cost-shape 2>/dev/null || true');
  });

  it('uses the synthesized smoke event bus by default for eval triggers', () => {
    const trigger = readFileSync('scripts/trigger-smoke-eval.ts', 'utf8');
    expect(trigger).toContain("env.EVENT_BUS_NAME ?? 'healthcare-rag-aws-smoke-events'");
  });
});
