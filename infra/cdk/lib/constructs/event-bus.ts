import type { ConstructTraceabilityMetadata } from './traceability';

export const metadata = {
  id: 'event-bus',
  path: 'infra/cdk/lib/constructs/event-bus.ts',
  awu: 'p3-005',
  profile: 'aws-smoke',
  description: 'EventBridge bus and trigger rules',
  rationale: 'Implemented in the synthesized template resource model at ../template.ts.',
  defaultEnabled: true,
  forbiddenInSmoke: false
} satisfies ConstructTraceabilityMetadata;
export const description = metadata.description;
