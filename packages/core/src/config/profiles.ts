import { profileSchema, type Profile } from '../domain';

export type FeatureFlags = {
  enableNatGateway: boolean;
  enableOpenSearch: boolean;
  enableAuroraPgvector: boolean;
  enableFargateReranker: boolean;
  enableBedrockKb: boolean;
  enableMultiAzEndpoints: boolean;
  enableBedrockRuntimeEndpoint: boolean;
  enableQueryEmbeddings: boolean;
  pointInTimeRecovery: boolean;
};

export type ProviderConfig = {
  profile: Profile;
  region: string;
  featureFlags: FeatureFlags;
  bedrockRuntimeEndpointCount: number;
  defaultModelId: string;
};

const baseFlags: FeatureFlags = {
  enableNatGateway: false,
  enableOpenSearch: false,
  enableAuroraPgvector: false,
  enableFargateReranker: false,
  enableBedrockKb: false,
  enableMultiAzEndpoints: false,
  enableBedrockRuntimeEndpoint: true,
  enableQueryEmbeddings: false,
  pointInTimeRecovery: false
};

export const profiles: Record<Profile, ProviderConfig> = {
  local: {
    profile: 'local',
    region: 'local',
    featureFlags: { ...baseFlags, enableBedrockRuntimeEndpoint: false },
    bedrockRuntimeEndpointCount: 0,
    defaultModelId: 'fixture-local-llm'
  },
  'aws-smoke': {
    profile: 'aws-smoke',
    region: process.env.AWS_REGION ?? 'us-east-1',
    featureFlags: { ...baseFlags },
    bedrockRuntimeEndpointCount: 1,
    defaultModelId: process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-3-haiku-20240307-v1:0'
  },
  'aws-full': {
    profile: 'aws-full',
    region: process.env.AWS_REGION ?? 'us-east-1',
    featureFlags: {
      ...baseFlags,
      enableBedrockRuntimeEndpoint: true,
      pointInTimeRecovery: true,
      enableQueryEmbeddings: true
    },
    bedrockRuntimeEndpointCount: 1,
    defaultModelId: process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-3-haiku-20240307-v1:0'
  }
};

export function getProfileConfig(profileLike: unknown = 'aws-smoke'): ProviderConfig {
  const profile = profileSchema.parse(profileLike);
  return profiles[profile];
}

export function assertSmokeIsCheap(config: ProviderConfig): void {
  if (config.profile !== 'aws-smoke') return;
  const flags = config.featureFlags;
  const forbidden = [
    ['enableNatGateway', flags.enableNatGateway],
    ['enableOpenSearch', flags.enableOpenSearch],
    ['enableAuroraPgvector', flags.enableAuroraPgvector],
    ['enableFargateReranker', flags.enableFargateReranker],
    ['enableBedrockKb', flags.enableBedrockKb],
    ['enableMultiAzEndpoints', flags.enableMultiAzEndpoints]
  ].filter(([, enabled]) => enabled);
  if (forbidden.length > 0) {
    throw new Error(`aws-smoke enables forbidden expensive resources: ${forbidden.map(([name]) => name).join(', ')}`);
  }
  if (config.bedrockRuntimeEndpointCount > 1) {
    throw new Error('aws-smoke may include at most one bedrock-runtime interface endpoint');
  }
}
