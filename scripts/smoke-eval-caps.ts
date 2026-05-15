export type SmokeEvalCaps = { maxCases: number; budgetUsd: number };

export function parseSmokeEvalCaps(input: { maxCases?: unknown; budgetUsd?: unknown }): SmokeEvalCaps {
  const maxCases = parseNumber(input.maxCases);
  const budgetUsd = parseNumber(input.budgetUsd);
  if (!Number.isInteger(maxCases) || maxCases < 1 || maxCases > 25 || !Number.isFinite(budgetUsd) || budgetUsd <= 0 || budgetUsd > 5) {
    throw new Error('Unsafe eval trigger: maxCases must be an integer 1..25 and budgetUsd must be > 0 and <= 5');
  }
  return { maxCases, budgetUsd };
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string' || value.trim() === '') return Number.NaN;
  return Number(value);
}
