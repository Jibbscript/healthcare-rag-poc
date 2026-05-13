import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { EvalSink, EvalResult } from '@healthcare-rag/core';

export class FileEvalSink implements EvalSink {
  constructor(private readonly outPath: string) {}
  async writeRun(result: { runId: string; results: EvalResult[]; summary: Record<string, unknown> }): Promise<void> {
    await mkdir(dirname(this.outPath), { recursive: true });
    await writeFile(this.outPath, JSON.stringify(result, null, 2));
  }
}
