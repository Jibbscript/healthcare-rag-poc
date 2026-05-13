import { main as runEvalsMain } from '../../../../scripts/run-evals';

export async function handler(event: { detail?: { maxCases?: number; budgetUsd?: number } }): Promise<{ ok: boolean; maxCases: number }> {
  const maxCases = event.detail?.maxCases ?? Number(process.env.EVAL_MAX_CASES ?? 0);
  const budgetUsd = event.detail?.budgetUsd ?? Number(process.env.EVAL_BUDGET_USD ?? 0);
  if (!maxCases || maxCases > 25 || !budgetUsd || budgetUsd > 5) throw new Error('Unsafe eval trigger: maxCases and budgetUsd caps are required');
  await runEvalsMain(['--max-cases', String(maxCases), '--profile', process.env.PROFILE ?? 'local', '--out', process.env.EVAL_OUT ?? 'evals/reports/aws-smoke-eval.json']);
  return { ok: true, maxCases };
}
