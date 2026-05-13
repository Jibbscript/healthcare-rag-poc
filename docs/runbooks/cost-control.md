# Cost control

Forbidden in `aws-smoke`: NAT Gateway, OpenSearch, Aurora/RDS, Fargate/ECS services, Bedrock Knowledge Base, bedrock-agent-runtime endpoint, and multi-AZ endpoint expansion. Allowed fixed-cost item: one `bedrock-runtime` interface endpoint.

Run `pnpm cdk:nag` and `pnpm tsx scripts/check-smoke-cost-shape.ts cdk.out/smoke` before any deploy.
