import { describe, expect, it } from 'vitest';
import { defaultSmokeFlags } from '../lib/config/profiles';
import { synthTemplate } from '../lib/template';

function resources() { return synthTemplate('aws-smoke', defaultSmokeFlags).Resources; }

describe('aws-smoke template', () => {
  it('contains required cheap smoke resources and exactly one CMK', () => {
    const types = Object.values(resources()).map((r) => r.Type);
    expect(types.filter((t) => t === 'AWS::KMS::Key')).toHaveLength(1);
    expect(types).toContain('AWS::S3::Bucket');
    expect(types).toContain('AWS::DynamoDB::Table');
    expect(types).toContain('AWS::Lambda::Function');
    expect(resources().ChatFunction.Properties?.Runtime).toBe('nodejs22.x');
    expect(resources().ChatFunction.Properties?.Code).toEqual({ S3Bucket: { Ref: 'LambdaArtifactBucket' }, S3Key: { Ref: 'ChatLambdaArtifactKey' } });
    expect(JSON.stringify(resources().ChatFunction.Properties)).not.toContain('ZipFile');
    expect(JSON.stringify(resources().ChatFunction.Properties)).toContain('AWS_SMOKE_USE_REAL_ADAPTERS');
    expect(resources().EvalFunction.Properties?.Code).toEqual({ S3Bucket: { Ref: 'LambdaArtifactBucket' }, S3Key: { Ref: 'EvalLambdaArtifactKey' } });
    expect(resources().ChatLogGroup.Properties?.RetentionInDays).toBe(7);
  });
  it('forbids expensive smoke resources and has one bedrock-runtime endpoint', () => {
    const res = Object.values(resources());
    const types = res.map((r) => r.Type);
    expect(types).not.toContain('AWS::EC2::NatGateway');
    expect(types).not.toContain('AWS::OpenSearchServerless::Collection');
    expect(types).not.toContain('AWS::RDS::DBCluster');
    expect(types).not.toContain('AWS::ECS::Service');
    expect(types).not.toContain('AWS::Bedrock::KnowledgeBase');
    const bedrock = res.filter((r) => r.Type === 'AWS::EC2::VPCEndpoint' && JSON.stringify(r.Properties).includes('bedrock'));
    expect(bedrock).toHaveLength(1);
    expect(JSON.stringify(bedrock[0].Properties)).toContain('bedrock-runtime');
  });
  it('uses gateway endpoints for s3 and dynamodb', () => {
    const endpoints = Object.values(resources()).filter((r) => r.Type === 'AWS::EC2::VPCEndpoint');
    expect(endpoints.filter((r) => r.Properties?.VpcEndpointType === 'Gateway')).toHaveLength(2);
    expect(JSON.stringify(endpoints)).toContain('.s3');
    expect(JSON.stringify(endpoints)).toContain('.dynamodb');
  });
  it('gates and throttles the smoke API before invoking Bedrock-backed chat', () => {
    expect(resources().SmokeApiAuthorizer.Type).toBe('AWS::ApiGatewayV2::Authorizer');
    expect(resources().ChatRoute.Properties).toMatchObject({ AuthorizationType: 'CUSTOM', AuthorizerId: { Ref: 'SmokeApiAuthorizer' } });
    expect(resources().ApiStage.Properties?.DefaultRouteSettings).toMatchObject({ ThrottlingBurstLimit: 2, ThrottlingRateLimit: 1 });
  });
  it('wires EventBridge smoke eval events to the eval Lambda', () => {
    expect(resources().EvalRequestedRule.Properties?.Targets).toEqual([{ Id: 'EvalRunner', Arn: { 'Fn::GetAtt': ['EvalFunction', 'Arn'] } }]);
    expect(resources().EvalInvokePermission.Properties).toMatchObject({ FunctionName: { Ref: 'EvalFunction' }, Principal: 'events.amazonaws.com' });
  });
});
