import { bootstrapLocalAuditTable } from '@healthcare-rag/adapters-local';
await bootstrapLocalAuditTable({ endpoint: process.env.DDB_ENDPOINT ?? 'http://127.0.0.1:8000', region: 'local', tableName: process.env.AUDIT_TABLE ?? 'healthcare-rag-local-audit' });
process.stdout.write('local dynamodb audit table bootstrapped\n');
