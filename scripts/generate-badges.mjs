import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeBadge } from 'badge-maker';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const languages = [
  { code: 'en', label: 'English', flag: 'gb.svg', readme: 'README.md' },
  { code: 'de', label: 'Deutsch', flag: 'de.svg', readme: 'README.de.md' },
  { code: 'es', label: 'Español', flag: 'es.svg', readme: 'README.es.md' },
  { code: 'fr', label: 'Français', flag: 'fr.svg', readme: 'README.fr.md' },
  { code: 'nl', label: 'Nederlands', flag: 'nl.svg', readme: 'README.nl.md' },
  { code: 'pt', label: 'Português', flag: 'pt.svg', readme: 'README.pt.md' },
  { code: 'zh', label: '中文', flag: 'cn.svg', readme: 'README.zh.md' },
];

const ACTIVE_COLOR = '4c9aff';
const INACTIVE_COLOR = '6b7280';

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

async function readFlag(flag) {
  try {
    return await readFile(join(flagsDir, flag), 'utf8');
  } catch (err) {
    console.error(`generate-badges: could not read docs/flags/${flag}: ${err.message}`);
    process.exit(1);
  }
}

await writeBadge('version.svg', { label: 'npm', message: `v${pkg.version}` });
await writeBadge('license.svg', { label: 'license', message: pkg.license });

// Cache-busting: the READMEs link the static version.svg with a ?v=<version>
// query key, so browsers (and GitHub's render cache) treat each release's
// badge as a fresh URL instead of serving the stale one.
const VERSION_BADGE_PATTERN = /\.\/docs\/badges\/version\.svg(?:\?v=[^)\s"]*)?/g;
const VERSION_BADGE_LINK = `./docs/badges/version.svg?v=${pkg.version}`;

for (const language of languages) {
  const readmePath = join(root, language.readme);
  try {
    const content = await readFile(readmePath, 'utf8');
    const updated = content.replace(VERSION_BADGE_PATTERN, VERSION_BADGE_LINK);
    if (updated !== content) {
      await writeFile(readmePath, updated, 'utf8');
      console.log(`generate-badges: bumped version badge cache key in ${language.readme}`);
    }
  } catch (err) {
    console.error(`generate-badges: could not update ${language.readme}: ${err.message}`);
    process.exit(1);
  }
}

for (const language of languages) {
  const flagSvg = await readFlag(language.flag);
  const logoBase64 = `data:image/svg+xml;base64,${Buffer.from(flagSvg).toString('base64')}`;

  await writeBadge(`lang-${language.code}.svg`, {
    message: language.label,
    color: INACTIVE_COLOR,
    logoBase64,
  });

  await writeBadge(`lang-${language.code}-active.svg`, {
    message: language.label,
    color: ACTIVE_COLOR,
    logoBase64,
  });
}