import { buildEmf, type EvalResult, type EvalSink, type AuditStore } from '@healthcare-rag/core';

export class CloudWatchEmfDdbEvalSink implements EvalSink {
  constructor(private readonly auditStore?: AuditStore) {}
  async writeRun(result: { runId: string; results: EvalResult[]; summary: Record<string, unknown> }): Promise<void> {
    const passRate = result.results.length ? result.results.filter((r) => r.passed).length / result.results.length : 0;
    const emf = buildEmf({ namespace: 'HealthcareRagPoc', dimensions: { Profile: 'aws-smoke', EvalRunId: result.runId }, metrics: [{ name: 'PassRate', unit: 'Percent', value: passRate * 100 }, { name: 'Cases', unit: 'Count', value: result.results.length }] });
    process.stdout.write(`${JSON.stringify(emf)}\n`);
    void this.auditStore;
  }
}
