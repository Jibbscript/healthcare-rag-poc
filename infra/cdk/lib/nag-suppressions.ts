export const nagSuppressions = [
  { resource: 'ChatLambdaRole', ruleId: 'AwsSolutions-IAM5', reason: 'Bedrock model ARN scoping varies by configured model; action is limited to InvokeModel APIs and documented for demo.' },
  { resource: 'ChatLambdaRole', ruleId: 'AwsSolutions-IAM5-Logs', reason: 'CloudWatch Logs stream ARNs are created by Lambda at runtime; write-only log actions are retained.' }
];
