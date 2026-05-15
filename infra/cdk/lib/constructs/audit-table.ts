import type { ConstructTraceabilityMetadata } from './traceability';

export const metadata = {
  id: 'audit-table',
  path: 'infra/cdk/lib/constructs/audit-table.ts',
  awu: 'p3-004',
  profile: 'aws-smoke',
  description: 'DynamoDB audit/session table',
  rationale: 'Implemented in the synthesized template resource model at ../template.ts.',
  defaultEnabled: true,
  forbiddenInSmoke: false
} satisfies ConstructTraceabilityMetadata;
export const description = metadata.description;
