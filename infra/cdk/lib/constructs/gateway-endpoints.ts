import type { ConstructTraceabilityMetadata } from './traceability';

export const metadata = {
  id: 'gateway-endpoints',
  path: 'infra/cdk/lib/constructs/gateway-endpoints.ts',
  awu: 'p3-009',
  profile: 'aws-smoke',
  description: 'S3 and DynamoDB gateway endpoints',
  rationale: 'Implemented in the synthesized template resource model at ../template.ts.',
  defaultEnabled: true,
  forbiddenInSmoke: false
} satisfies ConstructTraceabilityMetadata;
export const description = metadata.description;
