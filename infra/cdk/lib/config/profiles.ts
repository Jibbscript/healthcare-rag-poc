export type InfraProfile = 'aws-smoke' | 'aws-full';
export type InfraFlags = {
  enableOpenSearch: boolean;
  enableAuroraPgvector: boolean;
  enableFargateReranker: boolean;
  enableBedrockKb: boolean;
  enableMultiAzEndpoints: boolean;
  permissionsBoundaryArn?: string;
};
export const defaultSmokeFlags: InfraFlags = { enableOpenSearch: false, enableAuroraPgvector: false, enableFargateReranker: false, enableBedrockKb: false, enableMultiAzEndpoints: false };
export const defaultFullFlags: InfraFlags = { ...defaultSmokeFlags };
export function flagsFromArgv(argv: string[], profile: InfraProfile): InfraFlags {
  const base = profile === 'aws-smoke' ? { ...defaultSmokeFlags } : { ...defaultFullFlags };
  const has = (name: string) => argv.includes(name) || process.env[name.replace(/^--/, '').replaceAll('-', '_').toUpperCase()] === 'true';
  return {
    ...base,
    enableOpenSearch: has('--enable-open-search'),
    enableAuroraPgvector: has('--enable-aurora-pgvector'),
    enableFargateReranker: has('--enable-fargate-reranker'),
    enableBedrockKb: has('--enable-bedrock-kb'),
    enableMultiAzEndpoints: has('--enable-multi-az-endpoints'),
    permissionsBoundaryArn: process.env.PERMISSIONS_BOUNDARY_ARN
  };
}
export function assertSmokeFlags(flags: InfraFlags): void {
  const forbidden = Object.entries(flags).filter(([key, value]) => key.startsWith('enable') && key !== 'enableBedrockRuntimeEndpoint' && value === true);
  if (forbidden.length) throw new Error(`aws-smoke forbidden flags enabled: ${forbidden.map(([k]) => k).join(',')}`);
}
