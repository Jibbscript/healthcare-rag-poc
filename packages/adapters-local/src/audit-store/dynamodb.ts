import { CreateTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { CoreError, type AuditStore, type AuditTrace } from '@healthcare-rag/core';

export class LocalDynamoAuditStore implements AuditStore {
  private readonly doc: DynamoDBDocumentClient;
  constructor(private readonly config: { endpoint: string; region: string; tableName: string }) {
    const client = new DynamoDBClient({ region: config.region, endpoint: config.endpoint, credentials: { accessKeyId: 'local', secretAccessKey: 'local' } });
    this.doc = DynamoDBDocumentClient.from(client);
  }
  async putTrace(trace: AuditTrace): Promise<void> {
    await this.doc.send(new PutCommand({ TableName: this.config.tableName, Item: toItem(trace) }));
  }
  async getTrace(traceId: string): Promise<AuditTrace | null> {
    const out = await this.doc.send(new QueryCommand({ TableName: this.config.tableName, IndexName: 'gsi1', KeyConditionExpression: 'gsi1pk = :pk', ExpressionAttributeValues: { ':pk': `TRACE#${traceId}` }, Limit: 1 }));
    return out.Items?.[0]?.trace ?? null;
  }
  async querySession(sessionId: string): Promise<AuditTrace[]> {
    const out = await this.doc.send(new QueryCommand({ TableName: this.config.tableName, KeyConditionExpression: 'pk = :pk', ExpressionAttributeValues: { ':pk': `SESSION#${sessionId}` } }));
    return (out.Items ?? []).map((item) => item.trace as AuditTrace);
  }
}

export class InMemoryAuditStore implements AuditStore {
  private readonly traces = new Map<string, AuditTrace>();
  async putTrace(trace: AuditTrace): Promise<void> { this.traces.set(trace.traceId, trace); }
  async getTrace(traceId: string): Promise<AuditTrace | null> { return this.traces.get(traceId) ?? null; }
  async querySession(sessionId: string): Promise<AuditTrace[]> { return [...this.traces.values()].filter((trace) => trace.sessionId === sessionId); }
}

export function toItem(trace: AuditTrace): Record<string, unknown> {
  return { pk: `SESSION#${trace.sessionId}`, sk: `TURN#${trace.turnId}`, gsi1pk: `TRACE#${trace.traceId}`, gsi1sk: trace.createdAt, ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, trace };
}

export async function bootstrapLocalAuditTable(config: { endpoint: string; region: string; tableName: string }): Promise<void> {
  const client = new DynamoDBClient({ region: config.region, endpoint: config.endpoint, credentials: { accessKeyId: 'local', secretAccessKey: 'local' } });
  try {
    await client.send(new CreateTableCommand({
      TableName: config.tableName,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [{ AttributeName: 'pk', AttributeType: 'S' }, { AttributeName: 'sk', AttributeType: 'S' }, { AttributeName: 'gsi1pk', AttributeType: 'S' }, { AttributeName: 'gsi1sk', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'pk', KeyType: 'HASH' }, { AttributeName: 'sk', KeyType: 'RANGE' }],
      GlobalSecondaryIndexes: [{ IndexName: 'gsi1', KeySchema: [{ AttributeName: 'gsi1pk', KeyType: 'HASH' }, { AttributeName: 'gsi1sk', KeyType: 'RANGE' }], Projection: { ProjectionType: 'ALL' } }]
    }));
  } catch (error) {
    if (!String(error).includes('ResourceInUseException')) throw new CoreError('provider', 'Unable to bootstrap local audit table');
  }
}
