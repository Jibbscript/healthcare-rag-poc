import { gzipSync, gunzipSync } from 'node:zlib';
import type { Chunk } from '../domain';
import { sha256, stableJson } from '../utils/hash';

export type IndexArtifact = {
  schemaVersion: 1;
  builtAt: string;
  model: { modelId: string; dimension: number };
  chunks: Chunk[];
  checksums: { chunks: string; artifact: string };
};

export function buildIndexArtifact(input: { chunks: Chunk[]; modelId: string; dimension: number; builtAt?: string }): IndexArtifact {
  const chunksJson = stableJson(input.chunks.map((chunk) => ({ ...chunk, embedding: chunk.embedding ?? [] })));
  const partial = { schemaVersion: 1 as const, builtAt: input.builtAt ?? '1970-01-01T00:00:00.000Z', model: { modelId: input.modelId, dimension: input.dimension }, chunks: input.chunks, checksums: { chunks: sha256(chunksJson), artifact: '' } };
  return { ...partial, checksums: { ...partial.checksums, artifact: sha256(stableJson(partial)) } };
}

export function encodeArtifact(artifact: IndexArtifact): Buffer { return gzipSync(Buffer.from(stableJson(artifact), 'utf8')); }
export function decodeArtifact(buffer: Buffer): IndexArtifact { return JSON.parse(gunzipSync(buffer).toString('utf8')) as IndexArtifact; }
