import type { ConstructTraceabilityMetadata } from './traceability';

export const metadata = {
  id: 'http-api',
  path: 'infra/cdk/lib/constructs/http-api.ts',
  awu: 'p3-007',
  profile: 'aws-smoke',
  description: 'HTTP API POST /chat route',
  rationale: 'Implemented in the synthesized template resource model at ../template.ts.',
  defaultEnabled: true,
  forbiddenInSmoke: false
} satisfies ConstructTraceabilityMetadata;
export const description = metadata.description;
