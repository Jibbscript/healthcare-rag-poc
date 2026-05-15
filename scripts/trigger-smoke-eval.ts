import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { pathToFileURL } from 'node:url';
import { parseSmokeEvalCaps } from './smoke-eval-caps';

export async function triggerSmokeEval(argv = process.argv.slice(2), env = process.env): Promise<void> {
  const { maxCases, budgetUsd } = parseSmokeEvalCaps({ maxCases: env.EVAL_MAX_CASES ?? argv[0] ?? 25, budgetUsd: env.EVAL_BUDGET_USD ?? 5 });
  const client = new EventBridgeClient({ region: env.AWS_REGION ?? 'us-east-1' });
  await client.send(new PutEventsCommand({ Entries: [{ EventBusName: env.EVENT_BUS_NAME ?? 'healthcare-rag-aws-smoke-events', Source: 'healthcare-rag.manual', DetailType: 'eval.run.requested', Detail: JSON.stringify({ maxCases, budgetUsd }) }] }));
  process.stdout.write(`triggered smoke eval maxCases=${maxCases}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await triggerSmokeEval();
}
