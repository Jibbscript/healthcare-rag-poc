-- Idempotent local pgvector schema
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS documents (doc_id text primary key, plan_id text not null, title text not null, year int not null, source_uri text not null);
CREATE TABLE IF NOT EXISTS chunks (chunk_id text primary key, doc_id text not null references documents(doc_id), section text, page int, body text not null, embedding vector(8));
