import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export type SmokeResponseSummary = {
  traceId?: string;
  answerHash: string;
  citations: string[];
};

export function summarizeSmokeResponse(text: string): SmokeResponseSummary {
  const response = JSON.parse(text) as {
    answer?: unknown;
    traceId?: unknown;
    citations?: Array<{ citationId?: unknown; chunkId?: unknown }>;
  };

  return {
    traceId: typeof response.traceId === 'string' ? response.traceId : undefined,
    answerHash: createHash('sha256').update(String(response.answer ?? '')).digest('hex'),
    citations: Array.isArray(response.citations)
      ? response.citations
          .map((citation) => citation.citationId ?? citation.chunkId)
          .filter((value): value is string => typeof value === 'string' && value.length > 0)
      : []
  };
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(JSON.stringify(summarizeSmokeResponse(await readStdin()), null, 2) + '\n');
}
