import { readFile } from 'node:fs/promises';
const path = process.argv[2] ?? 'cdk.out/smoke/HealthcareRagAwsSmoke.template.json';
const template = JSON.parse(await readFile(path, 'utf8')) as { Outputs?: Record<string, unknown> };
process.stdout.write(JSON.stringify({ outputs: template.Outputs ?? {}, reminder: 'Destroy aws-smoke after demo to stop endpoint-hour charges.' }, null, 2) + '\n');
