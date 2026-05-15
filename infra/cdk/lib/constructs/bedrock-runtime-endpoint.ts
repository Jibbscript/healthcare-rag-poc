import type { ConstructTraceabilityMetadata } from './traceability';

export const metadata = {
  id: 'bedrock-runtime-endpoint',
  path: 'infra/cdk/lib/constructs/bedrock-runtime-endpoint.ts',
  awu: 'p3-010',
  profile: 'aws-smoke',
  description: 'single bedrock-runtime interface endpoint',
  rationale: 'Implemented in the synthesized template resource model at ../template.ts.',
  featureFlag: 'enableBedrockRuntimeEndpoint',
  defaultEnabled: true,
  forbiddenInSmoke: false
} satisfies ConstructTraceabilityMetadata;
export const description = metadata.description;
