import { mkdir, writeFile } from 'node:fs/promises';
import { runChatPipeline, sha256 } from '@healthcare-rag/core';
import { createProviderBundle } from '../apps/api/src/bootstrap';

const providers = await createProviderBundle('local');
const response = await runChatPipeline({ sessionId: 'demo-local', message: 'What is the in-network urgent care copay for the PPO demo plan?', profile: 'local', debug: true }, providers);
const trace = await providers.auditStore.getTrace(response.traceId);
await mkdir('evals/reports', { recursive: true });
await writeFile('evals/reports/demo-local-summary.json', JSON.stringify({ traceId: response.traceId, answerHash: sha256(response.answer), citations: response.citations, traceStatus: trace?.status }, null, 2));
process.stdout.write(JSON.stringify({ ok: true, traceId: response.traceId, answerHash: sha256(response.answer), citations: response.citations.map((c) => c.rendered), artifact: 'evals/reports/demo-local-summary.json' }, null, 2) + '\n');
