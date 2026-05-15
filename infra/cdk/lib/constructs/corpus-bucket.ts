import type { ConstructTraceabilityMetadata } from './traceability';

export const metadata = {
  id: 'corpus-bucket',
  path: 'infra/cdk/lib/constructs/corpus-bucket.ts',
  awu: 'p3-003',
  profile: 'aws-smoke',
  description: 'encrypted corpus/index/eval S3 bucket',
  rationale: 'Implemented in the synthesized template resource model at ../template.ts.',
  defaultEnabled: true,
  forbiddenInSmoke: false
} satisfies ConstructTraceabilityMetadata;
export const description = metadata.description;
