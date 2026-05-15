import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig, type UserConfig } from 'vite';
import path from 'node:path';

type VitestUserConfig = UserConfig & {
  test: {
    environment: string;
    include: string[];
  };
};

const config = {
  plugins: [svelte(), svelteTesting()],
  resolve: {
    alias: {
      '@healthcare-rag/core': path.resolve(__dirname, '../../packages/core/src/api/index.ts')
    }
  },
  server: {
    port: 5174,
    proxy: {
      '/chat': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true
      }
    }
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts']
  }
} as VitestUserConfig;

export default defineConfig(config);
