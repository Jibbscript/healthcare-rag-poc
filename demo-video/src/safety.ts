import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const textExtensions = new Set(['.html', '.json', '.md', '.txt', '.ts', '.tsx']);

const forbiddenPublishablePatterns: Array<[RegExp, string]> = [
  [/\b\d{12}\b/, 'AWS account id'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key id'],
  [/\bASIA[0-9A-Z]{16}\b/, 'AWS session access key id'],
  [/aws_secret_access_key/i, 'AWS secret access key label'],
  [/aws_session_token/i, 'AWS session token label'],
  [/smoke[_-]?api[_-]?key/i, 'smoke API key label'],
  [/"(?:rawPrompt|rawAnswer|requestBody)"\s*:/i, 'raw prompt/answer/request body field'],
  [/curl\s+.+\s-d\s+['"]?\{/i, 'curl request body'],
  [/\b\d{3}-\d{2}-\d{4}\b/, 'SSN-like text'],
  [/\bABC12345\b/, 'synthetic member id that should stay out of publishable video evidence']
];

export async function assertPublishableText(paths: string[]): Promise<void> {
  const files = (await Promise.all(paths.map((path) => collectFiles(path)))).flat();
  const failures: string[] = [];

  for (const file of files) {
    if (!textExtensions.has(extension(file))) continue;
    const text = await readFile(file, 'utf8');
    for (const [pattern, label] of forbiddenPublishablePatterns) {
      if (pattern.test(text)) failures.push(`${file}: contains ${label}`);
    }
  }

  if (failures.length) {
    throw new Error(`Publishable evidence safety check failed:\n${failures.join('\n')}`);
  }
}

async function collectFiles(path: string): Promise<string[]> {
  const info = await stat(path);
  if (!info.isDirectory()) return [path];
  const entries = await readdir(path);
  const nested = await Promise.all(entries.map((entry) => collectFiles(join(path, entry))));
  return nested.flat();
}

function extension(file: string): string {
  const dot = file.lastIndexOf('.');
  return dot === -1 ? '' : file.slice(dot).toLowerCase();
}
