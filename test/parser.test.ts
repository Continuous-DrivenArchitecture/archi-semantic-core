import { describe, expect, it } from 'vitest';
import { parseArchiModel } from '../src/index.js';
import { loadFixture } from './helpers/load-fixture.js';

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
const NS = 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:archimate="http://www.archimatetool.com/archimate"';

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
        profiles: [],
        junctionType: null,
        rawJunctionType: null,
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

  it('leaves connectionRouterType null when the native attribute is absent', () => {
    const [view] = model.views;
    expect(view.connectionRouterType).toBeNull();
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
        style: null,
        features: [],
      },
    ]);
  });
});

describe('parseArchiModel — untyped sourceConnection between view references (bug fix: silently dropped)', () => {
  const model = parseArchiModel(loadFixture('diagram-view-reference.archimate'));

  it('preserves a sourceConnection with no xsi:type instead of dropping it', () => {
    const connection = model.diagramConnections.find((conn) => conn.id === 'conn-untyped')!;
    expect(connection).toBeDefined();
    expect(connection.xsiType).toBeNull();
    expect(connection.sourceId).toBe('vis-ref-a');
    expect(connection.targetId).toBe('vis-ref-b');
    expect(connection.archimateRelationshipId).toBeNull();
  });

  it('still links the connection into its source object\'s connectionIds', () => {
    const refA = model.diagramObjects.find((obj) => obj.id === 'vis-ref-a')!;
    expect(refA.connectionIds).toEqual(['conn-untyped']);
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

  it('reads the native connectionRouterType code verbatim, without decoding it to a named enum', () => {
    const view = model.views.find((v) => v.id === 'view-details')!;
    expect(view.connectionRouterType).toBe(2);
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

  it('is not confused by other presentational attributes (feature, numeric type)', () => {
    const visualSharedA = model.diagramObjects.find((obj) => obj.id === 'visual-shared-a')!;
    expect(visualSharedA.archimateElementId).toBe('element-shared');
    expect(visualSharedA.textAlignment).toBe('1');
    expect(visualSharedA.textPosition).toBe('1');
  });

  it('decodes fillColor/lineColor/fontColor, the font name/size/style bitmask, and alpha', () => {
    const visualSharedA = model.diagramObjects.find((obj) => obj.id === 'visual-shared-a')!;
    expect(visualSharedA.style).toEqual({
      fillColor: '#ffffff',
      lineColor: '#ff0000',
      fontColor: '#000000',
      font: '1|Segoe UI|9.0|1|WINDOWS|1|-15|0|0|0|700|0|0|0|0|3|2|1|34|Segoe UI',
      fontName: 'Segoe UI',
      fontSize: 9.0,
      fontStyle: { bold: true, italic: false },
      lineWidth: null,
      alpha: 200,
    });
  });

  it('reads a style with only some attributes set, leaving the rest null', () => {
    const visualSharedB = model.diagramObjects.find((obj) => obj.id === 'visual-shared-b')!;
    expect(visualSharedB.style).toEqual({
      fillColor: '#ffcccc',
      lineColor: null,
      fontColor: null,
      font: null,
      fontName: null,
      fontSize: null,
      fontStyle: null,
      lineWidth: null,
      alpha: null,
    });
  });

  it('reads style on a diagram connection, where alpha is always null (a Connection has no fill)', () => {
    const connection = model.diagramConnections.find((conn) => conn.id === 'visual-relationship')!;
    expect(connection.style).toEqual({
      fillColor: null,
      lineColor: '#0000ff',
      fontColor: '#0000ff',
      font: null,
      fontName: null,
      fontSize: null,
      fontStyle: null,
      lineWidth: 2,
      alpha: null,
    });
  });

  it('leaves style null when no fillColor/lineColor/fontColor/font attribute is present', () => {
    const visualEmpty = model.diagramObjects.find((obj) => obj.id === 'visual-empty')!;
    expect(visualEmpty.style).toBeNull();
  });

  it('reads a generic <feature name value> entry (e.g. labelExpression)', () => {
    const visualSharedA = model.diagramObjects.find((obj) => obj.id === 'visual-shared-a')!;
    expect(visualSharedA.features).toEqual([{ name: 'labelExpression', value: '${name}\n${property:First}' }]);
  });

  it('leaves features empty when no <feature> child is present', () => {
    const visualEmpty = model.diagramObjects.find((obj) => obj.id === 'visual-empty')!;
    expect(visualEmpty.features).toEqual([]);
  });

  it('reads the native figureType (alternate figure/icon selector)', () => {
    const visualSharedA = model.diagramObjects.find((obj) => obj.id === 'visual-shared-a')!;
    const visualSharedB = model.diagramObjects.find((obj) => obj.id === 'visual-shared-b')!;
    expect(visualSharedA.figureType).toBe('1');
    expect(visualSharedB.figureType).toBe('0');
  });

  it('leaves figureType null when the native type attribute is absent', () => {
    const visualEmpty = model.diagramObjects.find((obj) => obj.id === 'visual-empty')!;
    expect(visualEmpty.figureType).toBeNull();
  });

  it('reads documentation set directly on a Group visual object', () => {
    const group = model.diagramObjects.find((obj) => obj.id === 'visual-group')!;
    expect(group.documentation).toBe('Visual group documentation');
  });

  it('leaves documentation null on an element-backed DiagramObject (it lives on the element instead)', () => {
    const visualSharedA = model.diagramObjects.find((obj) => obj.id === 'visual-shared-a')!;
    expect(visualSharedA.documentation).toBeNull();
  });
});

describe('parseArchiModel — font style bitmask decoding', () => {
  function diagramObjectWithFont(font: string) {
    const xml = `${XML_HEADER}
<archimate:model ${NS} name="Font Model" id="model-font" version="5.0.0">
  <folder name="Views" id="folder-views" type="diagrams">
    <element xsi:type="archimate:ArchimateDiagramModel" name="View" id="view-1">
      <child xsi:type="archimate:Group" id="visual-1" name="G" font="${font}">
        <bounds x="0" y="0" width="10" height="10"/>
      </child>
    </element>
  </folder>
</archimate:model>`;
    const model = parseArchiModel(xml);
    return model.diagramObjects.find((obj) => obj.id === 'visual-1')!;
  }

  it('decodes italic (bit 1) without bold', () => {
    const obj = diagramObjectWithFont('1|Arial|10.0|2|WINDOWS');
    expect(obj.style?.fontStyle).toEqual({ bold: false, italic: true });
  });

  it('decodes bold+italic combined (bits 0 and 1)', () => {
    const obj = diagramObjectWithFont('1|Arial|10.0|3|WINDOWS');
    expect(obj.style?.fontStyle).toEqual({ bold: true, italic: true });
  });

  it('decodes plain (style 0)', () => {
    const obj = diagramObjectWithFont('1|Arial|10.0|0|WINDOWS');
    expect(obj.style?.fontStyle).toEqual({ bold: false, italic: false });
  });

  it('falls back to null structured fields (but keeps the raw string) for an unrecognized font shape', () => {
    const obj = diagramObjectWithFont('not-a-swt-fontdata-string');
    expect(obj.style).toEqual({
      fillColor: null,
      lineColor: null,
      fontColor: null,
      font: 'not-a-swt-fontdata-string',
      fontName: null,
      fontSize: null,
      fontStyle: null,
      lineWidth: null,
      alpha: null,
    });
  });
});

describe('parseArchiModel — Junction native AND/OR discriminator', () => {
  const model = parseArchiModel(loadFixture('junction-types.archimate'));
  const byId = new Map(model.elements.map((el) => [el.id, el]));

  it('resolves an absent native type attribute to And (Archi\'s own documented default)', () => {
    expect(byId.get('junction-absent')).toMatchObject({ junctionType: 'And', rawJunctionType: '' });
  });

  it('resolves an explicit empty type="" attribute to And', () => {
    expect(byId.get('junction-empty')).toMatchObject({ junctionType: 'And', rawJunctionType: '' });
  });

  it('resolves type="or" to Or', () => {
    expect(byId.get('junction-or')).toMatchObject({ junctionType: 'Or', rawJunctionType: 'or' });
  });

  it('leaves junctionType and rawJunctionType null for every non-Junction element', () => {
    expect(byId.get('element-plain')).toMatchObject({ junctionType: null, rawJunctionType: null });
  });

  it('never guesses an unrecognized native type value: preserves it verbatim in rawJunctionType instead of coercing junctionType to And/Or', () => {
    const xml = `${XML_HEADER}
      <archimate:model ${NS} name="Unknown Junction Type" id="model-unknown-junction-type" version="5.0.0">
        <folder name="Other" id="folder-other" type="other">
          <element xsi:type="archimate:Junction" id="junction-xor" type="xor"/>
        </folder>
      </archimate:model>`;
    const unknown = parseArchiModel(xml);
    expect(unknown.elements[0]).toMatchObject({ junctionType: null, rawJunctionType: 'xor' });
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

describe('parseArchiModel — Specializations and Profiles', () => {
  function modelWithProfiles(profileXml: string, elementExtra: string, relationshipExtra = ''): ReturnType<typeof parseArchiModel> {
    const xml = `${XML_HEADER}
<archimate:model ${NS} name="Profiles Model" id="model-profiles" version="5.0.0">
  <folder name="Business" id="folder-business" type="business">
    <element xsi:type="archimate:BusinessActor" name="A" id="element-a" ${elementExtra}/>
    <element xsi:type="archimate:BusinessActor" name="B" id="element-b"/>
  </folder>
  <folder name="Relations" id="folder-rel" type="relations">
    <element xsi:type="archimate:ServingRelationship" id="rel-1" source="element-a" target="element-b" ${relationshipExtra}/>
  </folder>
  ${profileXml}
</archimate:model>`;
    return parseArchiModel(xml);
  }

  it('reads a <profile> element with every attribute set', () => {
    const model = modelWithProfiles(
      '<profile name="Web Application" id="profile-1" conceptType="ApplicationComponent" specialization="true" imagePath="images/abc.png"/>',
      '',
    );
    expect(model.profiles).toEqual([
      { id: 'profile-1', name: 'Web Application', conceptType: 'ApplicationComponent', specialization: true, imagePath: 'images/abc.png' },
    ]);
  });

  it('defaults specialization to true when the native attribute is absent (EMF default)', () => {
    const model = modelWithProfiles('<profile name="Web Application" id="profile-1" conceptType="ApplicationComponent"/>', '');
    expect(model.profiles[0]?.specialization).toBe(true);
  });

  it('honors an explicit specialization="false" (a generic Profile, not a Specialization)', () => {
    const model = modelWithProfiles('<profile name="Cost" id="profile-1" specialization="false"/>', '');
    expect(model.profiles[0]).toEqual({ id: 'profile-1', name: 'Cost', conceptType: null, specialization: false, imagePath: null });
  });

  it('returns an empty profiles array when the model declares none', () => {
    const model = modelWithProfiles('', '');
    expect(model.profiles).toEqual([]);
  });

  it('reads a single profile reference on an element', () => {
    const model = modelWithProfiles(
      '<profile name="Web Application" id="profile-1" conceptType="ApplicationComponent"/>',
      'profiles="profile-1"',
    );
    const elementA = model.elements.find((el) => el.id === 'element-a')!;
    expect(elementA.profiles).toEqual(['profile-1']);
  });

  it('reads multiple space-separated profile references on an element', () => {
    const model = modelWithProfiles(
      '<profile name="Web Application" id="profile-1"/><profile name="Cost" id="profile-2" specialization="false"/>',
      'profiles="profile-1 profile-2"',
    );
    const elementA = model.elements.find((el) => el.id === 'element-a')!;
    expect(elementA.profiles).toEqual(['profile-1', 'profile-2']);
  });

  it('leaves profiles empty on an element with no profiles attribute', () => {
    const model = modelWithProfiles('', '');
    const elementB = model.elements.find((el) => el.id === 'element-b')!;
    expect(elementB.profiles).toEqual([]);
  });

  it('reads profile references on a relationship too (ArchimateConcept, not just ArchimateElement)', () => {
    const model = modelWithProfiles(
      '<profile name="Critical" id="profile-1"/>',
      '',
      'profiles="profile-1"',
    );
    const relationship = model.relationships.find((rel) => rel.id === 'rel-1')!;
    expect(relationship.profiles).toEqual(['profile-1']);
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
