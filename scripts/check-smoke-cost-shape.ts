import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

type TemplateResource = { Type: string; Properties?: Record<string, unknown> };
type Template = { Resources?: Record<string, TemplateResource> };

const forbiddenTypes = ['AWS::EC2::NatGateway', 'AWS::OpenSearchServerless::Collection', 'AWS::RDS::DBCluster', 'AWS::ECS::Service', 'AWS::Bedrock::KnowledgeBase'];

export type SmokeCostShapeResult = {
  ok: boolean;
  resources: number;
  forbiddenAbsent: string[];
  found: string[];
  bedrockEndpointCount: number;
  badBedrock: Array<Record<string, unknown> | undefined>;
  fixedCostWarning: string;
};

export function checkSmokeCostShape(template: Template): SmokeCostShapeResult {
  const resources = Object.values(template.Resources ?? {});
  const types = resources.map((resource) => resource.Type);
  const found = forbiddenTypes.filter((type) => types.includes(type));
  const bedrockEndpoints = resources.filter((resource) => resource.Type === 'AWS::EC2::VPCEndpoint' && endpointServiceName(resource).includes('bedrock'));
  const badBedrock = bedrockEndpoints.filter((resource) => !endpointServiceName(resource).includes('bedrock-runtime'));

  return {
    ok: found.length === 0 && bedrockEndpoints.length === 1 && badBedrock.length === 0,
    resources: resources.length,
    forbiddenAbsent: forbiddenTypes,
    found,
    bedrockEndpointCount: bedrockEndpoints.length,
    badBedrock: badBedrock.map((resource) => resource.Properties),
    fixedCostWarning: 'aws-smoke includes one paid bedrock-runtime interface endpoint; destroy after demo.'
  };
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const dir = argv[0] ?? 'cdk.out/smoke';
  const templatePath = join(dir, 'HealthcareRagAwsSmoke.template.json');
  const template = JSON.parse(await readFile(templatePath, 'utf8')) as Template;
  const result = checkSmokeCostShape(template);

  if (!result.ok) {
    console.error(JSON.stringify({ found: result.found, bedrockEndpointCount: result.bedrockEndpointCount, badBedrock: result.badBedrock }, null, 2));
    return 1;
  }

  process.stdout.write(JSON.stringify({ ok: true, resources: result.resources, forbiddenAbsent: result.forbiddenAbsent, bedrockEndpointCount: result.bedrockEndpointCount, fixedCostWarning: result.fixedCostWarning }, null, 2) + '\n');
  return 0;
}

function endpointServiceName(resource: TemplateResource): string {
  const serviceName = resource.Properties?.ServiceName;
  if (typeof serviceName === 'string') return serviceName;
  if (isRecord(serviceName)) {
    const substitution = serviceName['Fn::Sub'];
    if (typeof substitution === 'string') return substitution;
  }
  return '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}
