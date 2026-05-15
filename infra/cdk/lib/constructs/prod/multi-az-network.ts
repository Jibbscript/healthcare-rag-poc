import type { ConstructTraceabilityMetadata } from '../traceability';

export const metadata = {
  id: 'multi-az-network',
  path: 'infra/cdk/lib/constructs/prod/multi-az-network.ts',
  awu: 'p5-006',
  profile: 'aws-full',
  description: 'multi-AZ endpoint expansion',
  rationale: 'Feature-gated multi-AZ endpoint expansion; disabled in smoke.',
  featureFlag: 'enableMultiAzEndpoints',
  defaultEnabled: false,
  forbiddenInSmoke: true
} satisfies ConstructTraceabilityMetadata;
export const rationale = metadata.rationale;
