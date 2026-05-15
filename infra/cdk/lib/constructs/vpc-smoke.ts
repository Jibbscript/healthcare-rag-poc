import type { ConstructTraceabilityMetadata } from './traceability';

export const metadata = {
  id: 'vpc-smoke',
  path: 'infra/cdk/lib/constructs/vpc-smoke.ts',
  awu: 'p3-008',
  profile: 'aws-smoke',
  description: 'single-AZ isolated VPC',
  rationale: 'Implemented in the synthesized template resource model at ../template.ts.',
  defaultEnabled: true,
  forbiddenInSmoke: false
} satisfies ConstructTraceabilityMetadata;
export const description = metadata.description;
