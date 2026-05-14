import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { flagsFromArgv, type InfraProfile } from '../lib/config/profiles';
import { synthTemplate } from '../lib/template';

const argv = process.argv.slice(2);
const profileArg = argv.includes('--profile') ? argv[argv.indexOf('--profile') + 1] : 'aws-smoke';
const profile = (profileArg === 'aws-full' ? 'aws-full' : 'aws-smoke') as InfraProfile;
const outDir = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : `cdk.out/${profile === 'aws-smoke' ? 'smoke' : 'full'}`;
const template = synthTemplate(profile, flagsFromArgv(argv, profile));
await mkdir(outDir, { recursive: true });
const name = profile === 'aws-smoke' ? 'HealthcareRagAwsSmoke.template.json' : 'HealthcareRagAwsFull.template.json';
await writeFile(join(outDir, name), JSON.stringify(template, null, 2));
// manifest version must be a valid semver string; avoid non-semver identifiers that break downstream tooling
await writeFile(join(outDir, 'manifest.json'), JSON.stringify({ version: '0.0.0-synth', profile, stacks: [name] }, null, 2));
process.stdout.write(`synthesized ${join(outDir, name)}\n`);
