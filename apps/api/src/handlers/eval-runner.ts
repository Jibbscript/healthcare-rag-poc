import { main as runEvalsMain } from '../../../../scripts/run-evals';
import { parseSmokeEvalCaps } from '../../../../scripts/smoke-eval-caps';

export async function handler(event: { detail?: { maxCases?: number; budgetUsd?: number } }): Promise<{ ok: boolean; maxCases: number }> {
  const { maxCases } = parseSmokeEvalCaps({ maxCases: event.detail?.maxCases ?? process.env.EVAL_MAX_CASES, budgetUsd: event.detail?.budgetUsd ?? process.env.EVAL_BUDGET_USD });
  await runEvalsMain(['--max-cases', String(maxCases), '--profile', process.env.PROFILE ?? 'local', '--out', process.env.EVAL_OUT ?? 'evals/reports/aws-smoke-eval.json']);
  return { ok: true, maxCases };
}
