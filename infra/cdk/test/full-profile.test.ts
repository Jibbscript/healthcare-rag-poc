import { describe, expect, it } from 'vitest';
import { synthTemplate } from '../lib/template';

describe('aws-full feature flags', () => {
  it('adds expensive resources only when explicit flags are enabled', () => {
    const offTypes = Object.values(synthTemplate('aws-full', { enableOpenSearch: false, enableAuroraPgvector: false, enableFargateReranker: false, enableBedrockKb: false, enableMultiAzEndpoints: false }).Resources).map((r) => r.Type);
    expect(offTypes).not.toContain('AWS::OpenSearchServerless::Collection');
    const template = synthTemplate('aws-full', { enableOpenSearch: true, enableAuroraPgvector: true, enableFargateReranker: true, enableBedrockKb: true, enableMultiAzEndpoints: true });
    const onTypes = Object.values(template.Resources).map((r) => r.Type);
    expect(onTypes).toContain('AWS::OpenSearchServerless::Collection');
    expect(onTypes).toContain('AWS::RDS::DBCluster');
    expect(onTypes).toContain('AWS::ECS::Service');
    expect(onTypes).toContain('AWS::Bedrock::KnowledgeBase');
    expect(JSON.stringify(template.Resources.ProdBedrockKnowledgeBase)).not.toContain('placeholder');
    expect(template.Parameters).toMatchObject({
      BedrockKbRoleArn: { Type: 'String' },
      BedrockKbEmbeddingModelArn: { Type: 'String' },
      BedrockKbVectorBucketArn: { Type: 'String' }
    });
  });
});
