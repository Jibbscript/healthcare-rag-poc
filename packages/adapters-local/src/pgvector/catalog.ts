import pg from 'pg';
import type { BenefitCatalogTool, BenefitLookup, Chunk } from '@healthcare-rag/core';

export const pgvectorMigration = `
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS documents (doc_id text primary key, plan_id text not null, title text not null, year int not null, source_uri text not null);
CREATE TABLE IF NOT EXISTS chunks (chunk_id text primary key, doc_id text not null references documents(doc_id), section text, page int, body text not null, embedding vector(8), tsv tsvector generated always as (to_tsvector('english', body)) stored);
CREATE INDEX IF NOT EXISTS chunks_tsv_idx ON chunks USING gin(tsv);
CREATE TABLE IF NOT EXISTS benefit_catalog (plan_id text, category text, year int, network text, cost_share text, evidence_id text);
`;

export class PgVectorCatalogAdapter implements BenefitCatalogTool {
  private readonly pool: pg.Pool;
  constructor(connectionString: string) { this.pool = new pg.Pool({ connectionString }); }
  async migrate(): Promise<void> { await this.pool.query(pgvectorMigration); }
  async insertChunks(chunks: Chunk[]): Promise<void> {
    for (const chunk of chunks) {
      await this.pool.query('insert into documents(doc_id, plan_id, title, year, source_uri) values($1,$2,$3,$4,$5) on conflict do nothing', [chunk.docId, chunk.planId, chunk.title, 2026, chunk.sourceUri]);
      await this.pool.query('insert into chunks(chunk_id, doc_id, section, page, body) values($1,$2,$3,$4,$5) on conflict (chunk_id) do update set body=excluded.body', [chunk.chunkId, chunk.docId, chunk.section, chunk.page, chunk.text]);
    }
  }
  async lookup(input: { planId: string; category: string; year: number; network?: string }): Promise<BenefitLookup[]> {
    const out = await this.pool.query('select plan_id, category, year, network, cost_share, evidence_id from benefit_catalog where plan_id=$1 and lower(category)=lower($2) and year=$3', [input.planId, input.category, input.year]);
    return out.rows.map((row) => ({ planId: row.plan_id, category: row.category, year: row.year, network: row.network, costShare: row.cost_share, evidenceId: row.evidence_id }));
  }
}
