import { FixtureBenefitCatalogTool, getProfileConfig, HybridRetriever, NullSafeLogger, RandomIdGenerator, RegexGuardrail, SystemClock, type ProviderBundle, type Profile } from '@healthcare-rag/core';
import { BedrockGuardrailAdapter, BedrockLlmAdapter, AwsDynamoAuditStore, AwsSmokeHybridRetriever, S3IndexLoader } from '@healthcare-rag/adapters-aws';
import { FixtureEmbeddingProvider, FixtureLlm, InMemoryAuditStore } from '@healthcare-rag/adapters-local';
import { fixtureBenefitRows, fixtureChunks } from '@healthcare-rag/test-fixtures';

export async function createProviderBundle(profile: Profile = 'aws-smoke'): Promise<ProviderBundle> {
  const config = getProfileConfig(profile);
  const clock = new SystemClock();
  const idGenerator = new RandomIdGenerator();
  const logger = new NullSafeLogger();
  if (profile === 'aws-smoke' && process.env.AWS_SMOKE_USE_REAL_ADAPTERS === 'true') {
    const loader = new S3IndexLoader({ region: config.region, bucket: requiredEnv('INDEX_BUCKET'), key: process.env.INDEX_KEY ?? 'index/index-artifact.json.gz' });
    return {
      profile,
      auditStore: new AwsDynamoAuditStore({ region: config.region, tableName: requiredEnv('AUDIT_TABLE') }),
      retriever: new AwsSmokeHybridRetriever(loader),
      llm: new BedrockLlmAdapter({ region: config.region, modelId: config.defaultModelId, guardrailIdentifier: process.env.BEDROCK_GUARDRAIL_ID, guardrailVersion: process.env.BEDROCK_GUARDRAIL_VERSION }),
      guardrail: new BedrockGuardrailAdapter({ guardrailIdentifier: process.env.BEDROCK_GUARDRAIL_ID, guardrailVersion: process.env.BEDROCK_GUARDRAIL_VERSION }),
      clock, idGenerator, logger
    };
  }
  return {
    profile,
    auditStore: new InMemoryAuditStore(),
    retriever: new HybridRetriever(fixtureChunks),
    llm: new FixtureLlm(),
    embeddingProvider: new FixtureEmbeddingProvider(),
    guardrail: new RegexGuardrail(),
    clock,
    idGenerator,
    logger,
    benefitCatalog: new FixtureBenefitCatalogTool(fixtureBenefitRows)
  };
}
function requiredEnv(name: string): string { const value = process.env[name]; if (!value) throw new Error(`Missing required env ${name}`); return value; }
