# Constraints

- No PHI and no raw prompt/answer/PII logging.
- `aws-smoke` is cheap by default: no NAT Gateway, OpenSearch, Aurora/RDS, Fargate, Bedrock KB, or multi-AZ endpoint expansion.
- Exactly one paid interface endpoint is allowed in smoke: `bedrock-runtime`.
- S3 and DynamoDB use gateway endpoints.
- Lambda runtime target is `nodejs22.x`.
