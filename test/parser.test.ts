import { describe, expect, it } from 'vitest';
import { parseArchiModel } from '../src/index.js';
import { loadFixture } from './helpers/load-fixture.js';

describe('parseArchiModel — minimal model', () => {
  const model = parseArchiModel(loadFixture('minimal.archimate'));

  it('reads model metadata', () => {
    expect(model.metadata).toEqual({ id: 'model-minimal', name: 'Minimal Model', version: '5.0.0', purpose: null, properties: [] });
  });

  it('reads the one folder and its contained element', () => {
    expect(model.folders).toEqual([
      {
        id: 'folder-business',
        name: 'Business',
        type: 'business',
        parentId: null,
        path: 'Business',
        containedIds: ['element-customer'],
        documentation: null,
        properties: [],
      },
    ]);
  });

  it('reads the one element with both raw and semantic type', () => {
    expect(model.elements).toEqual([
      {
        id: 'element-customer',
        name: 'Customer',
        xsiType: 'archimate:BusinessActor',
        type: 'BusinessActor',
        folderId: 'folder-business',
        folderPath: 'Business',
        documentation: null,
        properties: [],
      },
    ]);
  });

  it('has no relationships, views, or diagram content', () => {
    expect(model.relationships).toEqual([]);
    expect(model.views).toEqual([]);
    expect(model.diagramObjects).toEqual([]);
    expect(model.diagramConnections).toEqual([]);
    expect(model.notes).toEqual([]);
  });
});

describe('parseArchiModel — empty folders (bug fix: CA-Stack silently dropped these)', () => {
  const model = parseArchiModel(loadFixture('empty-folders.archimate'));

  it('keeps every folder, including ones with no elements or sub-folders', () => {
    expect(model.folders).toHaveLength(3);
    const byId = new Map(model.folders.map((folder) => [folder.id, folder]));

    expect(byId.get('folder-root-empty')).toEqual({
      id: 'folder-root-empty',
      name: 'Empty root',
      type: 'business',
      parentId: null,
      path: 'Empty root',
      containedIds: [],
      documentation: null,
      properties: [],
    });
    expect(byId.get('folder-child-empty')).toEqual({
      id: 'folder-child-empty',
      name: 'Empty child',
      type: 'application',
      parentId: 'folder-parent',
      path: 'Parent/Empty child',
      containedIds: [],
      documentation: null,
      properties: [],
    });
  });
});

describe('parseArchiModel — relationship types', () => {
  const model = parseArchiModel(loadFixture('relationship-types.archimate'));

  it('parses one relationship of each requested type with correct source/target', () => {
    expect(model.relationships).toHaveLength(7);
    const byType = new Map(model.relationships.map((rel) => [rel.type, rel]));

    expect(byType.get('ServingRelationship')).toMatchObject({ name: 'serves', sourceId: 'element-service', targetId: 'element-actor' });
    expect(byType.get('AssignmentRelationship')).toMatchObject({ name: null, sourceId: 'element-role', targetId: 'element-process' });
    expect(byType.get('RealizationRelationship')).toMatchObject({ name: null, sourceId: 'element-process', targetId: 'element-service' });
    expect(byType.get('AccessRelationship')).toMatchObject({ name: null, sourceId: 'element-process', targetId: 'element-object' });
    expect(byType.get('CompositionRelationship')).toMatchObject({ name: null, sourceId: 'element-app', targetId: 'element-data' });
    expect(byType.get('AggregationRelationship')).toMatchObject({ name: null, sourceId: 'element-process', targetId: 'element-object' });
    expect(byType.get('AssociationRelationship')).toMatchObject({ name: 'uses', sourceId: 'element-actor', targetId: 'element-app' });
  });

  it('never fabricates a placeholder name for unnamed relationships', () => {
    const unnamed = model.relationships.filter((rel) => rel.name === null);
    expect(unnamed).toHaveLength(5);
  });
});

describe('parseArchiModel — relationship-specific attributes (accessType, strength, directed)', () => {
  const model = parseArchiModel(loadFixture('relationship-attributes.archimate'));
  const byId = new Map(model.relationships.map((rel) => [rel.id, rel]));

  it('decodes AccessRelationship accessType, defaulting an absent attribute to Write (Archi\'s own documented default)', () => {
    expect(byId.get('access-absent')?.accessType).toBe('Write');
    expect(byId.get('access-write')?.accessType).toBe('Write');
    expect(byId.get('access-read')?.accessType).toBe('Read');
    expect(byId.get('access-unspecified')?.accessType).toBe('Unspecified');
    expect(byId.get('access-readwrite')?.accessType).toBe('ReadWrite');
  });

  it('leaves accessType null for every relationship type other than AccessRelationship', () => {
    expect(byId.get('influence-with-strength')?.accessType).toBeNull();
    expect(byId.get('association-directed')?.accessType).toBeNull();
  });

  it('reads InfluenceRelationship strength, leaving it null (not a fabricated default) when blank/absent', () => {
    expect(byId.get('influence-with-strength')?.strength).toBe('+');
    expect(byId.get('influence-absent')?.strength).toBeNull();
  });

  it('leaves strength null for every relationship type other than InfluenceRelationship', () => {
    expect(byId.get('access-write')?.strength).toBeNull();
  });

  it('decodes AssociationRelationship directed, defaulting an absent attribute to false', () => {
    expect(byId.get('association-directed')?.directed).toBe(true);
    expect(byId.get('association-absent')?.directed).toBe(false);
  });

  it('leaves directed null for every relationship type other than AssociationRelationship', () => {
    expect(byId.get('access-write')?.directed).toBeNull();
  });
});

describe('parseArchiModel — views, diagram objects, nested objects, connections, bendpoints, notes', () => {
  const model = parseArchiModel(loadFixture('diagram-minimal.archimate'));

  it('reads the view and its top-level visual content (bug fix: CA-Stack always returned [])', () => {
    expect(model.views).toHaveLength(1);
    const [view] = model.views;
    expect(view.id).toBe('view-minimal');
    expect(view.diagramObjectIds).toEqual(['vis-source', 'vis-target']);
    expect(view.diagramConnectionIds).toEqual(['conn-empty', 'conn-bend']);
    expect(view.noteIds).toEqual(['note-1']);
  });

  it('nests a diagram object inside its parent (bug fix: CA-Stack always returned [])', () => {
    const source = model.diagramObjects.find((obj) => obj.id === 'vis-source')!;
    expect(source.parentId).toBeNull();
    expect(source.archimateElementId).toBe('element-source');
    expect(source.bounds).toEqual({ x: 10, y: 20, width: 100, height: 50 });
    expect(source.childrenIds).toEqual(['vis-nested']);
    expect(source.connectionIds).toEqual(['conn-empty', 'conn-bend']);

    const nested = model.diagramObjects.find((obj) => obj.id === 'vis-nested')!;
    expect(nested.parentId).toBe('vis-source');
    expect(nested.archimateElementId).toBe('element-nested');
    expect(nested.childrenIds).toEqual([]);
  });

  it('reads connections, including bendpoints on only one of the two', () => {
    const empty = model.diagramConnections.find((conn) => conn.id === 'conn-empty')!;
    expect(empty).toMatchObject({ sourceId: 'vis-source', targetId: 'vis-target', archimateRelationshipId: 'rel-empty', bendpoints: [] });

    const bent = model.diagramConnections.find((conn) => conn.id === 'conn-bend')!;
    expect(bent.archimateRelationshipId).toBe('rel-bend');
    expect(bent.bendpoints).toEqual([{ startX: 25, startY: 5, endX: 40, endY: 10 }]);
  });

  it('reads the note', () => {
    expect(model.notes).toEqual([
      {
        id: 'note-1',
        name: null,
        viewId: 'view-minimal',
        parentId: null,
        content: 'note',
        bounds: { x: 15, y: 90, width: 50, height: 20 },
        textAlignment: null,
        borderType: null,
      },
    ]);
  });
});

describe('parseArchiModel — documentation, properties, and Group containers', () => {
  const model = parseArchiModel(loadFixture('object-details.archimate'));

  it('decodes numeric XML character references in documentation (bug fix: CA-Stack left "&#xD;&#xA;" as literal text)', () => {
    const shared = model.elements.find((el) => el.id === 'element-shared')!;
    expect(shared.documentation).toBe('Shared component documentation\r\nSecond line');
  });

  it('reads properties', () => {
    const shared = model.elements.find((el) => el.id === 'element-shared')!;
    expect(shared.properties).toEqual([
      { key: 'First', value: 'One' },
      { key: 'Second', value: 'Two' },
    ]);
  });

  it('reads relationship documentation and properties', () => {
    const relationship = model.relationships.find((rel) => rel.id === 'relationship-serving')!;
    expect(relationship.documentation).toBe('Relationship documentation');
    expect(relationship.properties).toEqual([{ key: 'Order', value: '1' }]);
  });

  it('reads the model root purpose (decoding numeric character references the same way as documentation) and properties', () => {
    expect(model.metadata.purpose).toBe('Model purpose\r\nSecond line');
    expect(model.metadata.properties).toEqual([{ key: 'ModelOwner', value: 'Architecture Team' }]);
  });

  it('reads folder documentation and properties', () => {
    const folder = model.folders.find((f) => f.id === 'folder-app')!;
    expect(folder.documentation).toBe('Application folder documentation');
    expect(folder.properties).toEqual([{ key: 'FolderOwner', value: 'App Team' }]);
  });

  it('reads a view viewpoint code verbatim, without decoding it to a human-readable name', () => {
    const view = model.views.find((v) => v.id === 'view-details')!;
    expect(view.viewpoint).toBe('layered');
  });

  it('reads a DiagramModelReference node\'s referencedModelId, distinguishing it from a Group', () => {
    const modelRef = model.diagramObjects.find((obj) => obj.id === 'visual-modelref')!;
    expect(modelRef.xsiType).toBe('archimate:DiagramModelReference');
    expect(modelRef.archimateElementId).toBeNull();
    expect(modelRef.referencedModelId).toBe('view-other');

    const group = model.diagramObjects.find((obj) => obj.id === 'visual-group')!;
    expect(group.referencedModelId).toBeNull();
  });

  it('preserves a Group visual container instead of silently dropping it (bug fix)', () => {
    const group = model.diagramObjects.find((obj) => obj.id === 'visual-group')!;
    expect(group.xsiType).toBe('archimate:Group');
    expect(group.archimateElementId).toBeNull();
    expect(group.bounds).toEqual({ x: 10, y: 10, width: 420, height: 220 });
    expect(group.childrenIds).toEqual(['visual-nested-in-group']);
  });

  it('resolves a diagram object nested inside a Group', () => {
    const nested = model.diagramObjects.find((obj) => obj.id === 'visual-nested-in-group')!;
    expect(nested.parentId).toBe('visual-group');
    expect(nested.archimateElementId).toBe('element-empty');
  });

  it('does not require diagram objects to be a recognized "DiagramObject" type to be captured', () => {
    const view = model.views.find((v) => v.id === 'view-details')!;
    expect(view.diagramObjectIds).toContain('visual-group');
  });

  it('is not confused by unmodeled presentational attributes (fillColor, font, feature, numeric type)', () => {
    const visualSharedA = model.diagramObjects.find((obj) => obj.id === 'visual-shared-a')!;
    expect(visualSharedA.archimateElementId).toBe('element-shared');
    expect(visualSharedA.textAlignment).toBe('1');
    expect(visualSharedA.textPosition).toBe('1');
  });
});

describe('parseArchiModel — broad type coverage', () => {
  const model = parseArchiModel(loadFixture('all-element-types.archimate'));

  it('parses one instance of many different element types generically, without a hardcoded list', () => {
    const types = new Set(model.elements.map((el) => el.type));
    expect(types.has('BusinessActor')).toBe(true);
    expect(types.has('ApplicationComponent')).toBe(true);
    expect(types.has('TechnologyService')).toBe(true);
    expect(types.has('Node')).toBe(true);
    expect(types.has('Artifact')).toBe(true);
    expect(types.size).toBeGreaterThan(30);
  });

  it('keeps an empty folder that has a type but no contents', () => {
    const implementation = model.folders.find((f) => f.type === 'implementation_migration')!;
    expect(implementation.containedIds).toEqual([]);
  });
});

describe('parseArchiModel — input validation', () => {
  it('throws a TypeError for non-string input', () => {
    // @ts-expect-error deliberately passing the wrong type
    expect(() => parseArchiModel(123)).toThrow(TypeError);
  });

  it('throws for malformed XML', () => {
    expect(() => parseArchiModel('<archimate:model><unclosed>')).toThrow(/Invalid XML/);
  });
});
