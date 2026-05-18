import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts', 'infra/**/*.test.ts', 'scripts/**/*.test.ts'],
    exclude: ['**/node_modules/**', 'apps/web/src/App.test.ts', 'apps/web/src/components/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30000,
    pool: 'threads',
    poolOptions: { threads: { singleThread: true } }
  },
  resolve: {
    alias: {
      '@healthcare-rag/core': path.resolve(__dirname, 'packages/core/src/index.ts'),
      '@healthcare-rag/adapters-local': path.resolve(__dirname, 'packages/adapters-local/src/index.ts'),
      '@healthcare-rag/adapters-aws': path.resolve(__dirname, 'packages/adapters-aws/src/index.ts'),
      '@healthcare-rag/test-fixtures': path.resolve(__dirname, 'packages/test-fixtures/src/index.ts')
    }
  }
});
