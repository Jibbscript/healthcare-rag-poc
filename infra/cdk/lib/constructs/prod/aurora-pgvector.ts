import type { ConstructTraceabilityMetadata } from '../traceability';

export const metadata = {
  id: 'aurora-pgvector',
  path: 'infra/cdk/lib/constructs/prod/aurora-pgvector.ts',
  awu: 'p5-003',
  profile: 'aws-full',
  description: 'Aurora Serverless v2 pgvector cluster',
  rationale: 'Feature-gated Aurora Serverless v2 pgvector cluster; disabled in smoke.',
  featureFlag: 'enableAuroraPgvector',
  defaultEnabled: false,
  forbiddenInSmoke: true
} satisfies ConstructTraceabilityMetadata;
export const rationale = metadata.rationale;
