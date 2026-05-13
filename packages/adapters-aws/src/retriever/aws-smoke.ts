import { HybridRetriever, type Retriever, type RetrievalQuery, type RetrievedChunk } from '@healthcare-rag/core';
import type { S3IndexLoader } from '../index-loader/s3-loader';

export class AwsSmokeHybridRetriever implements Retriever {
  private retriever?: HybridRetriever;
  constructor(private readonly loader: S3IndexLoader) {}
  async retrieve(query: RetrievalQuery): Promise<RetrievedChunk[]> {
    if (!this.retriever) {
      const artifact = await this.loader.load();
      this.retriever = new HybridRetriever(artifact.chunks);
    }
    return this.retriever.retrieve(query);
  }
}
