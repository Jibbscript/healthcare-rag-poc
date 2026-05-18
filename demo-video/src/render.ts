import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectEvidence } from './collect-evidence';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(packageRoot, '..');
const entryPoint = join(packageRoot, 'src', 'index.ts');
const publicDir = join(packageRoot, 'public');
const outDir = join(repoRoot, 'demo-artifacts', 'remotion');
const compositionId = 'HealthcareRagDemo';

async function main(argv = process.argv.slice(2)): Promise<void> {
  const still = argv.includes('--still');
  if (!argv.includes('--skip-collect')) await collectEvidence();
  await mkdir(outDir, { recursive: true });

  const serveUrl = await bundle({
    entryPoint,
    publicDir
  });
  const composition = await selectComposition({
    serveUrl,
    id: compositionId
  });

  if (still) {
    const output = join(outDir, 'healthcare-rag-demo-frame-30.png');
    await renderStill({
      serveUrl,
      composition,
      output,
      frame: 30
    });
    process.stdout.write(`rendered still: ${output}\n`);
    return;
  }

  const outputLocation = join(outDir, 'healthcare-rag-demo.mp4');
  await renderMedia({
    serveUrl,
    composition,
    codec: 'h264',
    outputLocation,
    chromiumOptions: {
      gl: 'angle'
    }
  });
  process.stdout.write(`rendered video: ${outputLocation}\n`);
}

await main();
