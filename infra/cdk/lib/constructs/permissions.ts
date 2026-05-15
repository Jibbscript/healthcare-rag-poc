import type { ConstructTraceabilityMetadata } from './traceability';

export const metadata = {
  id: 'permissions',
  path: 'infra/cdk/lib/constructs/permissions.ts',
  awu: 'p3-011',
  profile: 'aws-smoke',
  description: 'least-privilege IAM policy statements',
  rationale: 'Implemented in the synthesized template resource model at ../template.ts.',
  defaultEnabled: true,
  forbiddenInSmoke: false
} satisfies ConstructTraceabilityMetadata;
export const description = metadata.description;
