import type { ConstructTraceabilityMetadata } from './traceability';

export const metadata = {
  id: 'kms-key',
  path: 'infra/cdk/lib/constructs/kms-key.ts',
  awu: 'p3-002',
  profile: 'aws-smoke',
  description: 'single customer-managed KMS key',
  rationale: 'Implemented in the synthesized template resource model at ../template.ts.',
  defaultEnabled: true,
  forbiddenInSmoke: false
} satisfies ConstructTraceabilityMetadata;
export const description = metadata.description;
