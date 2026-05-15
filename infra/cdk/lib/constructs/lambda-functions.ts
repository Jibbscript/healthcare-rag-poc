import type { ConstructTraceabilityMetadata } from './traceability';

export const metadata = {
  id: 'lambda-functions',
  path: 'infra/cdk/lib/constructs/lambda-functions.ts',
  awu: 'p3-006',
  profile: 'aws-smoke',
  description: 'nodejs22 Lambda function resources',
  rationale: 'Implemented in the synthesized template resource model at ../template.ts.',
  defaultEnabled: true,
  forbiddenInSmoke: false
} satisfies ConstructTraceabilityMetadata;
export const description = metadata.description;
