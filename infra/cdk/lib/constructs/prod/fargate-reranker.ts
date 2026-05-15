import type { ConstructTraceabilityMetadata } from '../traceability';

export const metadata = {
  id: 'fargate-reranker',
  path: 'infra/cdk/lib/constructs/prod/fargate-reranker.ts',
  awu: 'p5-004',
  profile: 'aws-full',
  description: 'Fargate reranker service',
  rationale: 'Feature-gated Fargate reranker; desired count zero strategy.',
  featureFlag: 'enableFargateReranker',
  defaultEnabled: false,
  forbiddenInSmoke: true
} satisfies ConstructTraceabilityMetadata;
export const rationale = metadata.rationale;
