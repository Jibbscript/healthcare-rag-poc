import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client, CreateBucketCommand } from '@aws-sdk/client-s3';
import { CoreError, normalizeError, sha256, type ObjectInfo, type ObjectStore } from '@healthcare-rag/core';

export type MinioObjectStoreConfig = { endpoint: string; region: string; bucket: string; accessKeyId: string; secretAccessKey: string };

export class MinioObjectStore implements ObjectStore {
  private readonly client: S3Client;
  constructor(private readonly config: MinioObjectStoreConfig) {
    this.client = new S3Client({ region: config.region, endpoint: config.endpoint, forcePathStyle: true, credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } });
  }
  async put(key: string, body: Buffer | string, metadata: Record<string, string> = {}): Promise<ObjectInfo> {
    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
    await this.client.send(new PutObjectCommand({ Bucket: this.config.bucket, Key: key, Body: buffer, Metadata: metadata }));
    return { key, size: buffer.length, checksum: sha256(buffer) };
  }
  async get(key: string): Promise<Buffer> {
    try {
      const out = await this.client.send(new GetObjectCommand({ Bucket: this.config.bucket, Key: key }));
      return Buffer.from(await out.Body!.transformToByteArray());
    } catch (error) { throw normalizeError(error, 'not_found'); }
  }
  async list(prefix: string): Promise<ObjectInfo[]> {
    const out = await this.client.send(new ListObjectsV2Command({ Bucket: this.config.bucket, Prefix: prefix }));
    return (out.Contents ?? []).map((item) => ({ key: item.Key ?? '', size: item.Size ?? 0, updatedAt: item.LastModified?.toISOString() }));
  }
  async head(key: string): Promise<ObjectInfo | null> {
    try {
      const out = await this.client.send(new HeadObjectCommand({ Bucket: this.config.bucket, Key: key }));
      return { key, size: out.ContentLength ?? 0, checksum: out.Metadata?.checksum };
    } catch { return null; }
  }
  async delete(key: string): Promise<void> { await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key })); }
  async bootstrap(): Promise<void> {
    try { await this.client.send(new CreateBucketCommand({ Bucket: this.config.bucket })); } catch (error) { if (!String(error).includes('BucketAlreadyOwnedByYou') && !String(error).includes('BucketAlreadyExists')) throw new CoreError('provider', 'Unable to bootstrap object store bucket'); }
  }
}

export class InMemoryObjectStore implements ObjectStore {
  private readonly objects = new Map<string, Buffer>();
  async put(key: string, body: Buffer | string): Promise<ObjectInfo> { const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body); this.objects.set(key, buffer); return { key, size: buffer.length, checksum: sha256(buffer) }; }
  async get(key: string): Promise<Buffer> { const value = this.objects.get(key); if (!value) throw new CoreError('not_found', `Missing object ${key}`); return value; }
  async list(prefix: string): Promise<ObjectInfo[]> { return [...this.objects.entries()].filter(([key]) => key.startsWith(prefix)).map(([key, body]) => ({ key, size: body.length, checksum: sha256(body) })); }
  async head(key: string): Promise<ObjectInfo | null> { const value = this.objects.get(key); return value ? { key, size: value.length, checksum: sha256(value) } : null; }
  async delete(key: string): Promise<void> { this.objects.delete(key); }
}
