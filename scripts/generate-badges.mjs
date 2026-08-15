import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeBadge } from 'badge-maker';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const force = process.argv.includes('--force');

const languages = [
  { code: 'en', label: 'English', flag: 'gb.svg', readme: 'README.md' },
  { code: 'de', label: 'Deutsch', flag: 'de.svg', readme: 'README.de.md' },
  { code: 'es', label: 'Español', flag: 'es.svg', readme: 'README.es.md' },
  { code: 'fr', label: 'Français', flag: 'fr.svg', readme: 'README.fr.md' },
  { code: 'nl', label: 'Nederlands', flag: 'nl.svg', readme: 'README.nl.md' },
  { code: 'pt', label: 'Português', flag: 'pt.svg', readme: 'README.pt.md' },
  { code: 'zh', label: '中文', flag: 'cn.svg', readme: 'README.zh.md' },
];

let pkg;
try {
  pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
} catch (err) {
  console.error(`generate-badges: could not read package.json: ${err.message}`);
  process.exit(1);
}

const badgesDir = join(root, 'docs', 'badges');
const flagsDir = join(root, 'docs', 'flags');
await mkdir(badgesDir, { recursive: true });

async function writeBadge(file, data) {
  try {
    const svg = makeBadge(data);
    await writeFile(join(badgesDir, file), svg, 'utf8');
    console.log(`generate-badges: wrote docs/badges/${file}`);
  } catch (err) {
    console.error(`generate-badges: could not generate docs/badges/${file}: ${err.message}`);
    process.exit(1);
  }
}

await writeBadge('version.svg', { label: 'npm', message: `v${pkg.version}` });
await writeBadge('license.svg', { label: 'license', message: pkg.license });

for (const language of languages) {
  const file = `lang-${language.code}.svg`;
  if (!force) {
    try {
      await access(join(badgesDir, file));
      console.log(`generate-badges: keeping existing docs/badges/${file}`);
      continue;
    } catch {
      // badge does not exist yet — generate it
    }
  }

  let flagSvg;
  try {
    flagSvg = await readFile(join(flagsDir, language.flag), 'utf8');
  } catch (err) {
    console.error(
      `generate-badges: could not read docs/flags/${language.flag}: ${err.message}`
    );
    process.exit(1);
  }

  const logoBase64 = `data:image/svg+xml;base64,${Buffer.from(flagSvg).toString('base64')}`;

  await writeBadge(file, {
    message: language.label,
    color: '4c9aff',
    logoBase64,
  });
}