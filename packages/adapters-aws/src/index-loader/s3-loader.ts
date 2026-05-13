import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { decodeArtifact, type IndexArtifact } from '@healthcare-rag/core';

export class S3IndexLoader {
  private readonly client: S3Client;
  private cached?: IndexArtifact;
  constructor(private readonly config: { region: string; bucket: string; key: string }) { this.client = new S3Client({ region: config.region }); }
  async load(): Promise<IndexArtifact> {
    if (this.cached) return this.cached;
    const out = await this.client.send(new GetObjectCommand({ Bucket: this.config.bucket, Key: this.config.key }));
    this.cached = decodeArtifact(Buffer.from(await out.Body!.transformToByteArray()));
    return this.cached;
  }
  clearCache(): void { this.cached = undefined; }
}
