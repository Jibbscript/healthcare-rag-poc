import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
const maxCases = Number(process.env.EVAL_MAX_CASES ?? process.argv[2] ?? 25);
const budgetUsd = Number(process.env.EVAL_BUDGET_USD ?? 5);
if (maxCases > 25 || budgetUsd > 5) throw new Error('Refusing unsafe smoke eval cap');
const client = new EventBridgeClient({ region: process.env.AWS_REGION ?? 'us-east-1' });
await client.send(new PutEventsCommand({ Entries: [{ EventBusName: process.env.EVENT_BUS_NAME ?? 'healthcare-rag-smoke-events', Source: 'healthcare-rag.manual', DetailType: 'eval.run.requested', Detail: JSON.stringify({ maxCases, budgetUsd }) }] }));
process.stdout.write(`triggered smoke eval maxCases=${maxCases}\n`);
