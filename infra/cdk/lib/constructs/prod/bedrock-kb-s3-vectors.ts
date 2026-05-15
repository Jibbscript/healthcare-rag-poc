import type { ConstructTraceabilityMetadata } from '../traceability';

export const metadata = {
  id: 'bedrock-kb-s3-vectors',
  path: 'infra/cdk/lib/constructs/prod/bedrock-kb-s3-vectors.ts',
  awu: 'p5-005',
  profile: 'aws-full',
  description: 'Bedrock Knowledge Base with S3 vectors',
  rationale: 'Feature-gated Bedrock Knowledge Base/S3 vectors placeholder; disabled in smoke.',
  featureFlag: 'enableBedrockKb',
  defaultEnabled: false,
  forbiddenInSmoke: true
} satisfies ConstructTraceabilityMetadata;
export const rationale = metadata.rationale;
