import { describe, expect, it } from 'vitest';
import { defaultSmokeFlags } from '../lib/config/profiles';
import { synthTemplate } from '../lib/template';
import { checkSmokeCostShape } from '../../../scripts/check-smoke-cost-shape';

describe('smoke cost-shape script', () => {
  it('requires exactly one bedrock-runtime endpoint', () => {
    const template = synthTemplate('aws-smoke', defaultSmokeFlags);
    expect(checkSmokeCostShape(template)).toMatchObject({ ok: true, bedrockEndpointCount: 1 });

    const missingEndpoint = { ...template, Resources: { ...template.Resources } };
    delete missingEndpoint.Resources.BedrockRuntimeEndpoint;
    expect(checkSmokeCostShape(missingEndpoint)).toMatchObject({ ok: false, bedrockEndpointCount: 0 });

    const duplicateEndpoint = { ...template, Resources: { ...template.Resources, SecondBedrockRuntimeEndpoint: template.Resources.BedrockRuntimeEndpoint } };
    expect(checkSmokeCostShape(duplicateEndpoint)).toMatchObject({ ok: false, bedrockEndpointCount: 2 });

    const badEndpoint = { ...template, Resources: { ...template.Resources, BedrockRuntimeEndpoint: { ...template.Resources.BedrockRuntimeEndpoint, Properties: { ...template.Resources.BedrockRuntimeEndpoint.Properties, ServiceName: { 'Fn::Sub': 'com.amazonaws.${AWS::Region}.bedrock-agent-runtime' } } } } };
    expect(checkSmokeCostShape(badEndpoint)).toMatchObject({ ok: false, bedrockEndpointCount: 1 });
    expect(checkSmokeCostShape(badEndpoint).badBedrock).toHaveLength(1);
  });

  it('does not count incidental bedrock text outside endpoint service names', () => {
    const template = synthTemplate('aws-smoke', defaultSmokeFlags);
    const taggedTemplate = {
      ...template,
      Resources: {
        ...template.Resources,
        S3GatewayEndpoint: { ...template.Resources.S3GatewayEndpoint, Properties: { ...template.Resources.S3GatewayEndpoint.Properties, Tags: [{ Key: 'Note', Value: 'bedrock text is not the service name' }] } }
      }
    };
    expect(checkSmokeCostShape(taggedTemplate)).toMatchObject({ ok: true, bedrockEndpointCount: 1 });
  });
});
