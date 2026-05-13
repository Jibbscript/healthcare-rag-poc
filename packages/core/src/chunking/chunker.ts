import { sha256 } from '../utils/hash';
import type { Chunk, DocumentRecord } from '../domain';

export type ChunkOptions = { targetChars?: number; overlapChars?: number };

export function chunkDocument(doc: DocumentRecord, options: ChunkOptions = {}): Chunk[] {
  const target = options.targetChars ?? 500;
  const overlap = Math.min(options.overlapChars ?? 80, Math.floor(target / 2));
  const sections = splitSections(doc.text);
  const chunks: Chunk[] = [];
  for (const section of sections) {
    let offset = section.start;
    while (offset < section.end) {
      const end = Math.min(section.end, offset + target);
      const text = doc.text.slice(offset, end).trim();
      if (text.length > 0) {
        const checksum = sha256(`${doc.metadata.docId}:${offset}:${end}:${text}`);
        chunks.push({
          chunkId: `${doc.metadata.docId}:${checksum.slice(0, 12)}`,
          docId: doc.metadata.docId,
          planId: doc.metadata.planId,
          title: doc.metadata.title,
          sourceLabel: doc.metadata.sourceLabel,
          sourceUri: doc.metadata.sourceUri,
          page: inferPage(section.heading),
          section: cleanHeading(section.heading),
          charStart: offset,
          charEnd: end,
          checksum,
          text
        });
      }
      if (end >= section.end) break;
      offset = Math.max(section.start, end - overlap);
    }
  }
  return chunks;
}

export function chunksToJsonl(chunks: Chunk[]): string {
  return chunks.map((chunk) => JSON.stringify(chunk)).join('\n') + '\n';
}

function splitSections(text: string): Array<{ heading?: string; start: number; end: number }> {
  const matches = [...text.matchAll(/^#{1,3}\s+(.+)$/gm)];
  if (matches.length === 0) return [{ start: 0, end: text.length }];
  return matches.map((match, index) => ({
    heading: match[1],
    start: match.index ?? 0,
    end: index + 1 < matches.length ? matches[index + 1].index ?? text.length : text.length
  }));
}

function cleanHeading(heading?: string): string | undefined {
  return heading?.replace(/\s+/g, ' ').trim();
}

function inferPage(heading?: string): number | undefined {
  const page = heading?.match(/page\s+(\d+)/i)?.[1];
  return page ? Number(page) : undefined;
}
