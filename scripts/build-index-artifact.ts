import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { buildIndexArtifact, chunkDocument, encodeArtifact, loadCorpusFromManifest } from '@healthcare-rag/core';
import { FixtureEmbeddingProvider } from '@healthcare-rag/adapters-local';

const out = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'evals/reports/index-artifact.json.gz';
const docs = await loadCorpusFromManifest('corpus/manifest.yaml');
const chunks = docs.flatMap((doc) => chunkDocument(doc, { targetChars: 280, overlapChars: 40 }));
const embeddings = await new FixtureEmbeddingProvider().embed(chunks.map((chunk) => chunk.text));
const embedded = chunks.map((chunk, index) => ({ ...chunk, embedding: embeddings.vectors[index] }));
const artifact = buildIndexArtifact({ chunks: embedded, modelId: embeddings.modelId, dimension: embeddings.dimension });
await mkdir(dirname(out), { recursive: true });
await writeFile(out, encodeArtifact(artifact));
process.stdout.write(JSON.stringify({ out, chunks: chunks.length, checksum: artifact.checksums.artifact }, null, 2) + '\n');
