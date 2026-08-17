import { execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const tscBin = join(repoRoot, 'node_modules', '.bin', 'tsc');
const workspace = mkdtempSync(join(tmpdir(), 'archi-consumption-'));
let failed = false;
let tarball = null;

const REQUIRED_DIST = ['dist/index.js', 'dist/index.d.ts', 'dist/archive.js', 'dist/archive.d.ts'];

function run(command, cwd, opts = {}) {
  console.log(`$ ${command}`);
  execSync(command, { cwd, stdio: 'inherit', ...opts });
}

function assert(condition, message) {
  if (!condition) {
    failed = true;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`PASS: ${message}`);
  }
}

try {
  // No build happens here on purpose: this check must exercise the artifact
  // as produced by the pipeline's build step. If dist/ is missing, the
  // release is broken and this script fails instead of silently fixing it.
  const missingDist = REQUIRED_DIST.filter((p) => !existsSync(join(repoRoot, p)));
  if (missingDist.length > 0) {
    console.error(`FAIL: local build output is incomplete (missing: ${missingDist.join(', ')}).`);
    console.error('The release pipeline must run `npm run build` before `npm run test:published`.');
    process.exit(1);
  }
  console.log(`PASS: local build output present (${REQUIRED_DIST.join(', ')})`);

  const pack = JSON.parse(execSync('npm pack --json', { cwd: repoRoot, encoding: 'utf8' })).at(-1);
  tarball = join(repoRoot, pack.filename);
  console.log(`packed: ${pack.name}@${pack.version} (${tarball})`);

  writeFileSync(join(workspace, 'package.json'), JSON.stringify({ name: 'consumption-fixture', private: true, type: 'module' }, null, 2));
  run(`npm install ${tarball.replace(/\\/g, '/')} --no-audit --no-fund --loglevel=error`, workspace);

  const installedRoot = join(workspace, 'node_modules', '@cda', 'archi-semantic-core');

  const mainMjs = `import { parseArchiModel, validateArchiModel } from '@cda/archi-semantic-core';
import { extractArchiModelXml } from '@cda/archi-semantic-core/archive';

const xml = '<?xml version="1.0" encoding="UTF-8"?>\\n<archimate:model xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:archimate="http://www.archimatetool.com/archimate" name="M" id="model-1" version="5.0.0"><folder name="Business" id="folder-1" type="business"><element xsi:type="archimate:BusinessActor" name="N" id="e1"/></folder></archimate:model>';

// Root entry: parse + validate only.
const model = parseArchiModel(xml);
if (model.elements.length !== 1 || model.elements[0].id !== 'e1') throw new Error('root entry: parseArchiModel failed');
if (!validateArchiModel(model).valid) throw new Error('root entry: validateArchiModel failed');

// Archive subpath (Node-only): zip unwrapping + plain-XML passthrough.
if (extractArchiModelXml(new TextEncoder().encode(xml)) !== xml) throw new Error('archive entry: extractArchiModelXml failed');

console.log('main.mjs: root + /archive imports and calls OK');`;

  const typesTs = `import { parseArchiModel, type ArchiModel, type ArchiElement } from '@cda/archi-semantic-core';
import { extractArchiModelXml } from '@cda/archi-semantic-core/archive';

const model: ArchiModel = parseArchiModel('<?xml version="1.0" encoding="UTF-8"?><archimate:model xmlns:archimate="http://www.archimatetool.com/archimate" name="M" id="m1" version="5.0.0"/>');
const element: ArchiElement | undefined = model.elements[0];
const xml: string = extractArchiModelXml(new Uint8Array());
void element;
void xml;`;

  writeFileSync(join(workspace, 'main.mjs'), mainMjs);
  writeFileSync(join(workspace, 'types.ts'), typesTs);

  run('node main.mjs', workspace);
  run(`"${tscBin}" --noEmit --strict --target ES2020 --module NodeNext --moduleResolution NodeNext types.ts`, workspace);

  const rootDist = readFileSync(join(installedRoot, 'dist', 'index.js'), 'utf8');
  const zipUtilsDist = readFileSync(join(installedRoot, 'dist', 'parser', 'zip-utils.js'), 'utf8');
  assert(!rootDist.includes('node:zlib'), 'root entrypoint has no node:zlib dependency (browser-safe)');
  assert(zipUtilsDist.includes('node:zlib'), 'archive chain bundles the node:zlib dependency');
  assert(existsSync(join(installedRoot, 'dist', 'index.d.ts')), 'root types resolved (index.d.ts present)');
  assert(existsSync(join(installedRoot, 'dist', 'archive.d.ts')), 'archive types resolved (archive.d.ts present)');

  const files = readFileSync(join(installedRoot, 'package.json'), 'utf8');
  const pkg = JSON.parse(files);
  assert(pkg.exports['./archive'] !== undefined, 'package.json exposes the ./archive export map');
  assert(pkg.main === './dist/index.js', 'main entry points to ./dist/index.js');
} catch (error) {
  failed = true;
  console.error('consumption check crashed:', error);
  process.exitCode = 1;
} finally {
  rmSync(workspace, { recursive: true, force: true });
  if (tarball) rmSync(tarball, { force: true });
}

if (failed) {
  console.error('published-consumption check FAILED');
  process.exitCode = 1;
} else {
  console.log('published-consumption check OK');
}