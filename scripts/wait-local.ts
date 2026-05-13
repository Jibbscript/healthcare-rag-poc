const checks: Array<[string, string]> = [
  ['minio', 'http://127.0.0.1:9000/minio/health/live'],
  ['qdrant', 'http://127.0.0.1:6333/readyz'],
  ['ollama', 'http://127.0.0.1:11434/api/tags'],
  ['presidio-analyzer', 'http://127.0.0.1:5002/health']
];
for (const [name, url] of checks) {
  try { const res = await fetch(url); process.stdout.write(`${name}: ${res.ok ? 'ready' : `status ${res.status}`}\n`); }
  catch { process.stdout.write(`${name}: unavailable (optional for fixture CI path)\n`); }
}

export {};
