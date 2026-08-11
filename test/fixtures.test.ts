import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import { parseArchiModel, validateArchiModel } from '../src/index.js';
import { loadFixture } from './helpers/load-fixture.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const fixtureNames = readdirSync(fixturesDir).filter((name) => name.endsWith('.archimate'));

it('found the expected fixture files', () => {
  expect(fixtureNames.length).toBeGreaterThanOrEqual(6);
});

describe.each(fixtureNames)('fixture: %s', (fixtureName) => {
  const xml = loadFixture(fixtureName);

  it('parses without throwing', () => {
    expect(() => parseArchiModel(xml)).not.toThrow();
  });

  it('validates as structurally consistent', () => {
    const model = parseArchiModel(xml);
    const { valid, errors } = validateArchiModel(model);
    expect(valid, JSON.stringify(errors)).toBe(true);
  });

  it('has internally consistent cross-references', () => {
    const model = parseArchiModel(xml);
    const folderIds = new Set(model.folders.map((folder) => folder.id));
    const viewIds = new Set(model.views.map((view) => view.id));
    const diagramObjectIds = new Set(model.diagramObjects.map((obj) => obj.id));

    for (const folder of model.folders) {
      if (folder.parentId !== null) expect(folderIds.has(folder.parentId)).toBe(true);
    }
    for (const element of model.elements) expect(folderIds.has(element.folderId)).toBe(true);
    for (const relationship of model.relationships) expect(folderIds.has(relationship.folderId)).toBe(true);
    for (const view of model.views) expect(folderIds.has(view.folderId)).toBe(true);
    for (const diagramObject of model.diagramObjects) {
      expect(viewIds.has(diagramObject.viewId)).toBe(true);
      if (diagramObject.parentId !== null) expect(diagramObjectIds.has(diagramObject.parentId)).toBe(true);
    }
    for (const connection of model.diagramConnections) {
      expect(viewIds.has(connection.viewId)).toBe(true);
    }
    for (const note of model.notes) {
      expect(viewIds.has(note.viewId)).toBe(true);
      if (note.parentId !== null) expect(diagramObjectIds.has(note.parentId)).toBe(true);
    }
  });
});
