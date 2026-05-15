import type { ConstructTraceabilityMetadata } from '../traceability';

export const metadata = {
  id: 'iam-boundaries',
  path: 'infra/cdk/lib/constructs/prod/iam-boundaries.ts',
  awu: 'p5-007',
  profile: 'aws-full',
  description: 'prod IAM boundary and tagging hooks',
  rationale: 'Optional permissions boundary and standard tags for prod resources.',
  featureFlag: 'permissionsBoundaryArn',
  defaultEnabled: false,
  forbiddenInSmoke: false
} satisfies ConstructTraceabilityMetadata;
export const rationale = metadata.rationale;
