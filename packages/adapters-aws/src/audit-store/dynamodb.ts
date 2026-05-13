import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type { AuditStore, AuditTrace } from '@healthcare-rag/core';

export class AwsDynamoAuditStore implements AuditStore {
  private readonly doc: DynamoDBDocumentClient;
  constructor(private readonly config: { region: string; tableName: string }) { this.doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.region })); }
  async putTrace(trace: AuditTrace): Promise<void> { await this.doc.send(new PutCommand({ TableName: this.config.tableName, Item: { pk: `SESSION#${trace.sessionId}`, sk: `TURN#${trace.turnId}`, gsi1pk: `TRACE#${trace.traceId}`, gsi1sk: trace.createdAt, trace }, ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)' })); }
  async getTrace(traceId: string): Promise<AuditTrace | null> { const out = await this.doc.send(new QueryCommand({ TableName: this.config.tableName, IndexName: 'gsi1', KeyConditionExpression: 'gsi1pk = :pk', ExpressionAttributeValues: { ':pk': `TRACE#${traceId}` }, Limit: 1 })); return out.Items?.[0]?.trace ?? null; }
  async querySession(sessionId: string): Promise<AuditTrace[]> { const out = await this.doc.send(new QueryCommand({ TableName: this.config.tableName, KeyConditionExpression: 'pk = :pk', ExpressionAttributeValues: { ':pk': `SESSION#${sessionId}` } })); return (out.Items ?? []).map((item) => item.trace as AuditTrace); }
}
