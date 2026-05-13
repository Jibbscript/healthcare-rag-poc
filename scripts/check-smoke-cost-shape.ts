import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'cdk.out/smoke';
const templatePath = join(dir, 'HealthcareRagAwsSmoke.template.json');
const template = JSON.parse(await readFile(templatePath, 'utf8')) as { Resources: Record<string, { Type: string; Properties?: Record<string, unknown> }> };
const resources = Object.values(template.Resources ?? {});
const types = resources.map((r) => r.Type);
const forbidden = ['AWS::EC2::NatGateway', 'AWS::OpenSearchServerless::Collection', 'AWS::RDS::DBCluster', 'AWS::ECS::Service', 'AWS::Bedrock::KnowledgeBase'];
const found = forbidden.filter((type) => types.includes(type));
const bedrockEndpoints = resources.filter((r) => r.Type === 'AWS::EC2::VPCEndpoint' && JSON.stringify(r.Properties).includes('bedrock'));
const badBedrock = bedrockEndpoints.filter((r) => !JSON.stringify(r.Properties).includes('bedrock-runtime'));
if (found.length || bedrockEndpoints.length > 1 || badBedrock.length) {
  console.error(JSON.stringify({ found, bedrockEndpointCount: bedrockEndpoints.length, badBedrock: badBedrock.map((r) => r.Properties) }, null, 2));
  process.exit(1);
}
process.stdout.write(JSON.stringify({ ok: true, resources: resources.length, forbiddenAbsent: forbidden, bedrockEndpointCount: bedrockEndpoints.length, fixedCostWarning: 'aws-smoke includes one paid bedrock-runtime interface endpoint; destroy after demo.' }, null, 2) + '\n');
