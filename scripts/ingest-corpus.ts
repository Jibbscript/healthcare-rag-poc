import { loadCorpusFromManifest } from '@healthcare-rag/core';
const docs = await loadCorpusFromManifest(process.argv[2] ?? 'corpus/manifest.yaml');
process.stdout.write(JSON.stringify({ documents: docs.map((doc) => ({ docId: doc.metadata.docId, checksum: doc.checksum })) }, null, 2) + '\n');
