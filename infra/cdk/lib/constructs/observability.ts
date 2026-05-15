import type { ConstructTraceabilityMetadata } from './traceability';

export const metadata = {
  id: 'observability',
  path: 'infra/cdk/lib/constructs/observability.ts',
  awu: 'p3-012',
  profile: 'aws-smoke',
  description: 'CloudWatch log retention and EMF conventions',
  rationale: 'Implemented in the synthesized template resource model at ../template.ts.',
  defaultEnabled: true,
  forbiddenInSmoke: false
} satisfies ConstructTraceabilityMetadata;
export const description = metadata.description;
