import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('smoke deployment scripts', () => {
  it('deploys the synthesized CloudFormation template instead of invoking cdk deploy on a non-CDK assembly', () => {
    const deploy = readFileSync('scripts/deploy-smoke.sh', 'utf8');
    expect(deploy).toContain('aws cloudformation deploy');
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
    expect(smokeRun).toContain('answerHash');
    expect(smokeRun).toContain('crypto.createHash');
    expect(smokeRun).not.toContain('curl -s "${API_URL:?}/chat" -H');
  });
});
