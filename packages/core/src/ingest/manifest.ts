import { z } from 'zod';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import YAML from 'yaml';
import { documentRecordSchema, type DocumentRecord } from '../domain';

export const corpusManifestSchema = z.object({
  documents: z.array(z.object({
    docId: z.string().min(1),
    planId: z.string().min(1),
    title: z.string().min(1),
    year: z.number().int().gte(2000),
    sourceLabel: z.string().min(1),
    sourceUri: z.string().min(1),
    path: z.string().min(1),
    allowedDemoUse: z.string().min(1)
  })).min(1)
});
export type CorpusManifest = z.infer<typeof corpusManifestSchema>;

export async function loadManifest(path: string): Promise<CorpusManifest> {
  const text = await readFile(path, 'utf8');
  return corpusManifestSchema.parse(YAML.parse(text));
}

export async function loadCorpusFromManifest(path: string): Promise<DocumentRecord[]> {
  const manifest = await loadManifest(path);
  const base = dirname(path);
  const records: DocumentRecord[] = [];
  for (const doc of manifest.documents) {
    const text = await readFile(resolve(base, doc.path), 'utf8');
    const checksum = createHash('sha256').update(text).digest('hex');
    records.push(documentRecordSchema.parse({ metadata: { ...doc, checksum }, text, checksum }));
  }
  return records;
}
