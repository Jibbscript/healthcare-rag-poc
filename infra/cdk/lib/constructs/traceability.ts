import { metadata as eventBus } from './event-bus';
import { metadata as kmsKey } from './kms-key';
import { metadata as bedrockRuntimeEndpoint } from './bedrock-runtime-endpoint';
import { metadata as observability } from './observability';
import { metadata as corpusBucket } from './corpus-bucket';
import { metadata as vpcSmoke } from './vpc-smoke';
import { metadata as auditTable } from './audit-table';
import { metadata as gatewayEndpoints } from './gateway-endpoints';
import { metadata as permissions } from './permissions';
import { metadata as httpApi } from './http-api';
import { metadata as lambdaFunctions } from './lambda-functions';
import { metadata as opensearchServerless } from './prod/opensearch-serverless';
import { metadata as auroraPgvector } from './prod/aurora-pgvector';
import { metadata as fargateReranker } from './prod/fargate-reranker';
import { metadata as bedrockKbS3Vectors } from './prod/bedrock-kb-s3-vectors';
import { metadata as multiAzNetwork } from './prod/multi-az-network';
import { metadata as iamBoundaries } from './prod/iam-boundaries';

export type ConstructTraceabilityMetadata = {
  id: string;
  path: string;
  awu: string;
  profile: 'aws-smoke' | 'aws-full';
  description: string;
  rationale: string;
  featureFlag?: string;
  defaultEnabled: boolean;
  forbiddenInSmoke: boolean;
};

export const constructTraceabilityRegistry = [
  eventBus,
  kmsKey,
  bedrockRuntimeEndpoint,
  observability,
  corpusBucket,
  vpcSmoke,
  auditTable,
  gatewayEndpoints,
  permissions,
  httpApi,
  lambdaFunctions,
  opensearchServerless,
  auroraPgvector,
  fargateReranker,
  bedrockKbS3Vectors,
  multiAzNetwork,
  iamBoundaries
] satisfies ConstructTraceabilityMetadata[];
