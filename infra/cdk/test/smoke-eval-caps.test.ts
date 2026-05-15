import { describe, expect, it } from 'vitest';
import { parseSmokeEvalCaps } from '../../../scripts/smoke-eval-caps';

describe('smoke eval cap parsing', () => {
  it('accepts bounded max case and budget caps', () => {
    expect(parseSmokeEvalCaps({ maxCases: '25', budgetUsd: '5' })).toEqual({ maxCases: 25, budgetUsd: 5 });
    expect(parseSmokeEvalCaps({ maxCases: 1, budgetUsd: 0.01 })).toEqual({ maxCases: 1, budgetUsd: 0.01 });
  });

  it.each([
    { maxCases: '0', budgetUsd: '1' },
    { maxCases: '-1', budgetUsd: '1' },
    { maxCases: '1.5', budgetUsd: '1' },
    { maxCases: '26', budgetUsd: '1' },
    { maxCases: 'NaN', budgetUsd: '1' },
    { maxCases: '', budgetUsd: '1' },
    { maxCases: '1', budgetUsd: '0' },
    { maxCases: '1', budgetUsd: '-1' },
    { maxCases: '1', budgetUsd: '5.01' },
    { maxCases: '1', budgetUsd: 'Infinity' },
    { maxCases: '1', budgetUsd: '' }
  ])('rejects unsafe caps %#', (input) => {
    expect(() => parseSmokeEvalCaps(input)).toThrow(/Unsafe eval trigger/);
  });
});
