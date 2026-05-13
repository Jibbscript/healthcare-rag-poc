import type { Citation, RetrievedChunk } from '../domain';

export function renderCitation(chunk: RetrievedChunk, index: number): Citation {
  const location = chunk.page ? `p. ${chunk.page}` : chunk.section ? chunk.section : chunk.chunkId;
  return {
    citationId: `C${index + 1}`,
    chunkId: chunk.chunkId,
    docId: chunk.docId,
    title: chunk.title,
    sourceLabel: chunk.sourceLabel,
    sourceUri: chunk.sourceUri,
    page: chunk.page,
    section: chunk.section,
    rendered: `${chunk.title} (${chunk.sourceLabel}, ${location})`
  };
}

export function assembleCitations(chunks: RetrievedChunk[]): Citation[] {
  const seen = new Set<string>();
  return chunks.filter((chunk) => {
    if (seen.has(chunk.chunkId)) return false;
    seen.add(chunk.chunkId);
    return true;
  }).slice(0, 5).map(renderCitation);
}

export function checkCitationCoverage(answer: string, citations: Citation[]): { passed: boolean; rationale: string } {
  if (/^(I can[’']?t|I don[’']?t have enough|I do not have enough)|not enough evidence/i.test(answer)) return { passed: true, rationale: 'Refusal answers do not require fabricated citations.' };
  if (citations.length === 0) return { passed: false, rationale: 'Non-refusal answer has no citations.' };
  const materialClaims = answer.split(/[.!?]\s+/).filter((sentence) => /(covered|copay|deductible|coinsurance|benefit|in-network|out-of-network)/i.test(sentence));
  return { passed: materialClaims.length === 0 || citations.length > 0, rationale: `${materialClaims.length} material claims mapped to ${citations.length} citation(s).` };
}
