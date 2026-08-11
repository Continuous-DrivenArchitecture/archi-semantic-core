import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

/** Reads a `.archimate` fixture file from `test/fixtures/` as UTF-8 text. */
export function loadFixture(name: string): string {
  return readFileSync(path.join(fixturesDir, name), 'utf8');
}
