import { describe, expect, it } from 'vitest';
import { ProviderRegistry, RegexGuardrail, HybridRetriever, NullSafeLogger, RandomIdGenerator, SystemClock } from '../src';
import { InMemoryAuditStore, FixtureLlm } from '@healthcare-rag/adapters-local';
import { fixtureChunks } from '@healthcare-rag/test-fixtures';

describe('ProviderRegistry', () => {
  it('resolves fake providers and rejects unknown profiles', async () => {
    const registry = new ProviderRegistry().register('local', () => ({ profile: 'local', auditStore: new InMemoryAuditStore(), retriever: new HybridRetriever(fixtureChunks), llm: new FixtureLlm(), guardrail: new RegexGuardrail(), clock: new SystemClock(), idGenerator: new RandomIdGenerator(), logger: new NullSafeLogger() }));
    await expect(registry.resolve('local')).resolves.toMatchObject({ profile: 'local' });
    await expect(registry.resolve('aws-smoke')).rejects.toThrow(/Unknown provider profile/);
  });
});
