import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { constructTraceabilityRegistry } from '../lib/constructs/traceability';
import { defaultSmokeFlags } from '../lib/config/profiles';
import { synthTemplate } from '../lib/template';

describe('construct traceability metadata', () => {
  it('keeps placeholder construct paths importable and registered', () => {
    expect(constructTraceabilityRegistry.length).toBeGreaterThan(10);
    for (const item of constructTraceabilityRegistry) {
      expect(existsSync(join(process.cwd(), item.path))).toBe(true);
      expect(item.id).toBeTruthy();
      expect(item.awu).toMatch(/^p\d-/);
      expect(item.rationale).toBeTruthy();
    }
  });

  it('marks disabled expensive prod constructs as forbidden in smoke', () => {
    const expensiveProd = constructTraceabilityRegistry.filter((item) => item.profile === 'aws-full' && item.forbiddenInSmoke);
    expect(expensiveProd.map((item) => item.featureFlag).sort()).toEqual([
      'enableAuroraPgvector',
      'enableBedrockKb',
      'enableFargateReranker',
      'enableMultiAzEndpoints',
      'enableOpenSearch'
    ]);
    expect(expensiveProd.every((item) => item.defaultEnabled === false)).toBe(true);
  });

  it('does not add forbidden resources to aws-smoke', () => {
    const types = Object.values(synthTemplate('aws-smoke', defaultSmokeFlags).Resources).map((resource) => resource.Type);
    expect(types).not.toContain('AWS::OpenSearchServerless::Collection');
    expect(types).not.toContain('AWS::RDS::DBCluster');
    expect(types).not.toContain('AWS::ECS::Service');
    expect(types).not.toContain('AWS::Bedrock::KnowledgeBase');
  });
});
