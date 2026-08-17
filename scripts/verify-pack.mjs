import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Validates the exact payload npm would publish: `npm pack --json --dry-run`
// lists the files that end up in the tarball. dist/ is gitignored, so this
// only passes when an explicit build ran before it (in CI the build step
// must come first). Run before semantic-release so a broken artifact never
// reaches the registry.
//
// Usage: node scripts/verify-pack.mjs

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_FILES = [
  'dist/index.js',
  'dist/index.d.ts',
  'dist/archive.js',
  'dist/archive.d.ts',
];

const output = execSync('npm pack --json --dry-run', { cwd: repoRoot, encoding: 'utf8' });
const pack = JSON.parse(output.trim()).at(-1);
const packedFiles = (pack.files || []).map((f) => f.path);

console.log(`tarball: ${pack.filename} (${pack.size} bytes, ${pack.entryCount} entries)`);

const distFiles = packedFiles.filter((p) => p.startsWith('dist/'));
if (distFiles.length === 0) {
  console.error('FAIL: the pack payload contains no dist/ files. Did an explicit build run before this check?');
  process.exit(1);
}

const missing = REQUIRED_FILES.filter((p) => !packedFiles.includes(p));
if (missing.length > 0) {
  console.error(`FAIL: the pack payload is missing required files: ${missing.join(', ')}`);
  console.error('present dist files:');
  for (const p of distFiles) console.error(`  ${p}`);
  process.exit(1);
}

console.log(`PASS: pack payload contains ${distFiles.length} dist/ files, including all required entries:`);
for (const p of REQUIRED_FILES) console.log(`  ${p}`);