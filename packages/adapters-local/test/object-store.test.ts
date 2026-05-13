import { describe, expect, it } from 'vitest';
import { InMemoryObjectStore } from '../src';

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
});
