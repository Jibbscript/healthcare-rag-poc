import { describe, expect, it, vi } from 'vitest';
import { InMemoryObjectStore, MinioObjectStore } from '../src';

describe('local object store', () => {
  it('puts, gets, lists, heads, and deletes objects', async () => {
    const store = new InMemoryObjectStore();
    await store.put('corpus/a.txt', 'hello');
    expect((await store.get('corpus/a.txt')).toString()).toBe('hello');
    expect(await store.list('corpus/')).toHaveLength(1);
    expect(await store.head('corpus/a.txt')).toMatchObject({ size: 5 });
    await store.delete('corpus/a.txt');
    expect(await store.head('corpus/a.txt')).toBeNull();
  });

  it('returns null only for object-store not-found responses', async () => {
    const store = storeWithSend(vi.fn().mockRejectedValue(Object.assign(new Error('missing'), { name: 'NoSuchKey', $metadata: { httpStatusCode: 404 } })));

    await expect(store.head('missing.txt')).resolves.toBeNull();
  });

  it('propagates provider failures from object head checks', async () => {
    const store = storeWithSend(vi.fn().mockRejectedValue(Object.assign(new Error('denied'), { name: 'AccessDenied', $metadata: { httpStatusCode: 403 } })));

    await expect(store.head('corpus/a.txt')).rejects.toMatchObject({ code: 'provider' });
  });
});

function storeWithSend(send: ReturnType<typeof vi.fn>): MinioObjectStore {
  const store = new MinioObjectStore({
    endpoint: 'http://127.0.0.1:9000',
    region: 'local',
    bucket: 'demo',
    accessKeyId: 'access',
    secretAccessKey: 'secret'
  });
  (store as unknown as { client: { send: ReturnType<typeof vi.fn> } }).client = { send };
  return store;
}
