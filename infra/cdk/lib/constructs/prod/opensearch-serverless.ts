import type { ConstructTraceabilityMetadata } from '../traceability';

export const metadata = {
  id: 'opensearch-serverless',
  path: 'infra/cdk/lib/constructs/prod/opensearch-serverless.ts',
  awu: 'p5-002',
  profile: 'aws-full',
  description: 'OpenSearch Serverless vector collection',
  rationale: 'Feature-gated OpenSearch Serverless vector collection; disabled in smoke due fixed cost floor.',
  featureFlag: 'enableOpenSearch',
  defaultEnabled: false,
  forbiddenInSmoke: true
} satisfies ConstructTraceabilityMetadata;
export const rationale = metadata.rationale;
