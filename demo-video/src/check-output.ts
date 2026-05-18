import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertPublishableText } from './safety';
import { durationInFrames, fps, height, totalDurationSeconds, width } from './storyboard';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(packageRoot, '..');
const publicEvidenceDir = join(packageRoot, 'public', 'evidence');
const storyboardPath = join(packageRoot, 'src', 'storyboard.ts');
const outDir = join(repoRoot, 'demo-artifacts', 'remotion');
const videoPath = join(outDir, 'healthcare-rag-demo.mp4');

async function main(): Promise<void> {
  if (!existsSync(videoPath)) throw new Error(`Missing rendered video: ${videoPath}`);
  const expectedFrames = totalDurationSeconds * fps;
  if (durationInFrames !== expectedFrames) {
    throw new Error(`Unexpected Remotion composition timing: ${durationInFrames} frames at ${fps} fps`);
  }
  await assertPublishableText([publicEvidenceDir, storyboardPath]);
  const probe = await execCapture('ffprobe', [
    '-v',
    'error',
    '-count_frames',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=width,height,duration,codec_name,nb_read_frames',
    '-of',
    'json',
    videoPath
  ]);
  if (probe.exitCode !== 0) throw new Error(`ffprobe failed:\n${probe.stderr || probe.stdout}`);
  const metadata = JSON.parse(probe.stdout) as { streams?: Array<{ width?: number; height?: number; duration?: string; codec_name?: string; nb_read_frames?: string }> };
  const stream = metadata.streams?.[0];
  if (!stream || stream.width !== width || stream.height !== height) {
    throw new Error(`Unexpected video dimensions: ${JSON.stringify(stream)}`);
  }
  if (stream.codec_name !== 'h264') {
    throw new Error(`Unexpected video codec: ${JSON.stringify(stream)}`);
  }
  const duration = Number(stream.duration);
  if (!Number.isFinite(duration) || Math.abs(duration - totalDurationSeconds) > 0.05) {
    throw new Error(`Unexpected video duration: ${JSON.stringify(stream)}`);
  }
  const readFrames = stream.nb_read_frames ? Number(stream.nb_read_frames) : undefined;
  const effectiveFrames = Number.isFinite(readFrames) ? readFrames : Math.round(duration * fps);
  if (effectiveFrames !== durationInFrames) {
    throw new Error(`Unexpected video frame count: expected ${durationInFrames}, got ${effectiveFrames}`);
  }
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'healthcare-rag-demo.ffprobe.txt'), JSON.stringify(metadata, null, 2));
  process.stdout.write(`demo video check passed: ${videoPath} (${stream.codec_name}, ${stream.width}x${stream.height}, ${stream.duration}s, ${effectiveFrames} frames)\n`);
}

async function execCapture(command: string, args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => resolve({ exitCode: code ?? 1, stdout, stderr }));
  });
}

await main();
