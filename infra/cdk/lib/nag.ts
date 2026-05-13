import type { Template } from './template';
export type NagFinding = { resource: string; ruleId: string; reason: string };
export function nag(template: Template): NagFinding[] {
  const findings: NagFinding[] = [];
  for (const [name, resource] of Object.entries(template.Resources)) {
    if (resource.Type === 'AWS::S3::Bucket' && !JSON.stringify(resource.Properties).includes('BucketEncryption')) findings.push({ resource: name, ruleId: 'AwsSolutions-S1', reason: 'Bucket encryption missing' });
    if (resource.Type === 'AWS::Logs::LogGroup' && !JSON.stringify(resource.Properties).includes('RetentionInDays')) findings.push({ resource: name, ruleId: 'AwsSolutions-L1', reason: 'Log retention missing' });
  }
  return findings;
}
