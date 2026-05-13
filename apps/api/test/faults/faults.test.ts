import { describe, expect, it } from 'vitest';
import { handler as evalHandler } from '../../src/handlers/eval-runner';

describe('fault handling', () => {
  it('refuses unsafe eval triggers', async () => {
    await expect(evalHandler({ detail: { maxCases: 100, budgetUsd: 100 } })).rejects.toThrow(/Unsafe eval trigger/);
  });
});
