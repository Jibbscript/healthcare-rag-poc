import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const files = walk(process.cwd()).filter((file) => /\.(ts|js|md|yaml|yml|json|sh)$/.test(file) && !file.includes('node_modules') && !file.includes('cdk.out') && !file.includes('atomic-work-units-complete.md') && !file.includes('wellmark-rag-atomic-work-units'));
let failures = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (/console\.log\([^)]*(prompt|answer|member id|ssn)/i.test(text)) failures.push(`${file}: possible raw prompt/answer/PII console logging`);
  if (file.includes('packages/core/src') && /@aws-sdk|qdrant|from 'pg'|presidio|minio/i.test(text)) failures.push(`${file}: core imports vendor adapter dependency`);
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`lint passed (${files.length} files scanned)`);

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (entry === 'node_modules' || entry === '.git' || entry === 'cdk.out' || entry === '.omx') return [];
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}
