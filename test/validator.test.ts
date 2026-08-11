import { describe, expect, it } from 'vitest';
import { parseArchiModel, validateArchiModel } from '../src/index.js';
import { loadFixture } from './helpers/load-fixture.js';

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
const NS = 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:archimate="http://www.archimatetool.com/archimate"';

function codesOf(errors: { code: string }[]): string[] {
  return errors.map((error) => error.code);
}

describe('validateArchiModel — clean models', () => {
  it('reports valid: true with no errors for an internally-consistent model', () => {
    const model = parseArchiModel(loadFixture('diagram-minimal.archimate'));
    expect(validateArchiModel(model)).toEqual({ valid: true, errors: [] });
  });

  it('does not flag a legitimate visual-only connection with no underlying relationship', () => {
    const xml = `${XML_HEADER}
      <archimate:model ${NS} name="No Relationship" id="model-no-relationship" version="5.0.0">
        <folder name="Views" id="folder-views" type="diagrams">
          <element xsi:type="archimate:ArchimateDiagramModel" name="View" id="view-1">
            <child xsi:type="archimate:Group" id="visual-group-a" name="Group A">
              <bounds x="0" y="0" width="100" height="50"/>
              <sourceConnection xsi:type="archimate:Connection" id="conn-no-relationship" source="visual-group-a" target="visual-group-b"/>
            </child>
            <child xsi:type="archimate:Group" id="visual-group-b" name="Group B">
              <bounds x="150" y="0" width="100" height="50"/>
            </child>
          </element>
        </folder>
      </archimate:model>`;
    const model = parseArchiModel(xml);
    expect(model.diagramConnections[0].archimateRelationshipId).toBeNull();
    expect(validateArchiModel(model)).toEqual({ valid: true, errors: [] });
  });
});

describe('validateArchiModel — missing-id', () => {
  it('flags an element with no id attribute', () => {
    const xml = `${XML_HEADER}
      <archimate:model ${NS} name="Missing Id" id="model-missing-id" version="5.0.0">
        <folder name="Business" id="folder-business" type="business">
          <element xsi:type="archimate:BusinessActor" name="No Id"/>
        </folder>
      </archimate:model>`;
    const { valid, errors } = validateArchiModel(parseArchiModel(xml));
    expect(valid).toBe(false);
    expect(codesOf(errors)).toContain('missing-id');
    expect(errors.find((error) => error.code === 'missing-id')?.path).toBe('elements[0]');
  });
});

describe('validateArchiModel — duplicate-id', () => {
  it('flags a second element reusing an already-seen id', () => {
    const xml = `${XML_HEADER}
      <archimate:model ${NS} name="Duplicate Id" id="model-duplicate-id" version="5.0.0">
        <folder name="Business" id="folder-business" type="business">
          <element xsi:type="archimate:BusinessActor" name="A" id="dup-id"/>
          <element xsi:type="archimate:BusinessActor" name="B" id="dup-id"/>
        </folder>
      </archimate:model>`;
    const { valid, errors } = validateArchiModel(parseArchiModel(xml));
    expect(valid).toBe(false);
    expect(codesOf(errors)).toContain('duplicate-id');
    expect(errors.find((error) => error.code === 'duplicate-id')?.path).toBe('elements[1].id');
  });
});

describe('validateArchiModel — broken relationship references', () => {
  const xml = `${XML_HEADER}
    <archimate:model ${NS} name="Broken Relationship" id="model-broken-relationship" version="5.0.0">
      <folder name="Business" id="folder-business" type="business">
        <element xsi:type="archimate:BusinessActor" name="Only Element" id="element-only"/>
      </folder>
      <folder name="Relations" id="folder-relations" type="relations">
        <element xsi:type="archimate:ServingRelationship" id="rel-broken-source" source="does-not-exist" target="element-only"/>
        <element xsi:type="archimate:ServingRelationship" id="rel-broken-target" source="element-only" target="also-does-not-exist"/>
      </folder>
    </archimate:model>`;
  const { errors } = validateArchiModel(parseArchiModel(xml));

  it('flags a relationship source that does not resolve to any entity', () => {
    const error = errors.find((e) => e.code === 'broken-relationship-source');
    expect(error).toMatchObject({ path: 'relationships[rel-broken-source].sourceId' });
  });

  it('flags a relationship target that does not resolve to any entity', () => {
    const error = errors.find((e) => e.code === 'broken-relationship-target');
    expect(error).toMatchObject({ path: 'relationships[rel-broken-target].targetId' });
  });
});

describe('validateArchiModel — broken diagram-object element reference', () => {
  it('flags a diagram object whose archimateElement id does not resolve', () => {
    const xml = `${XML_HEADER}
      <archimate:model ${NS} name="Broken Element Ref" id="model-broken-element-ref" version="5.0.0">
        <folder name="Views" id="folder-views" type="diagrams">
          <element xsi:type="archimate:ArchimateDiagramModel" name="View" id="view-1">
            <child xsi:type="archimate:DiagramObject" id="vis-1" archimateElement="does-not-exist">
              <bounds x="0" y="0" width="10" height="10"/>
            </child>
          </element>
        </folder>
      </archimate:model>`;
    const { valid, errors } = validateArchiModel(parseArchiModel(xml));
    expect(valid).toBe(false);
    const error = errors.find((e) => e.code === 'broken-diagram-object-element');
    expect(error).toMatchObject({ path: 'diagramObjects[vis-1].archimateElementId' });
  });

  it('does not flag a Group, which legitimately has no archimateElement', () => {
    const xml = `${XML_HEADER}
      <archimate:model ${NS} name="Group Only" id="model-group-only" version="5.0.0">
        <folder name="Views" id="folder-views" type="diagrams">
          <element xsi:type="archimate:ArchimateDiagramModel" name="View" id="view-1">
            <child xsi:type="archimate:Group" id="group-1" name="Group">
              <bounds x="0" y="0" width="10" height="10"/>
            </child>
          </element>
        </folder>
      </archimate:model>`;
    const { valid, errors } = validateArchiModel(parseArchiModel(xml));
    expect(valid).toBe(true);
    expect(errors).toEqual([]);
  });
});

describe('validateArchiModel — broken diagram-connection relationship reference', () => {
  it('flags a connection whose archimateRelationship id does not resolve', () => {
    const xml = `${XML_HEADER}
      <archimate:model ${NS} name="Broken Relationship Ref" id="model-broken-relationship-ref" version="5.0.0">
        <folder name="Views" id="folder-views" type="diagrams">
          <element xsi:type="archimate:ArchimateDiagramModel" name="View" id="view-1">
            <child xsi:type="archimate:Group" id="visual-a" name="A">
              <bounds x="0" y="0" width="10" height="10"/>
              <sourceConnection xsi:type="archimate:Connection" id="conn-1" source="visual-a" target="visual-b" archimateRelationship="does-not-exist"/>
            </child>
            <child xsi:type="archimate:Group" id="visual-b" name="B">
              <bounds x="20" y="0" width="10" height="10"/>
            </child>
          </element>
        </folder>
      </archimate:model>`;
    const { valid, errors } = validateArchiModel(parseArchiModel(xml));
    expect(valid).toBe(false);
    const error = errors.find((e) => e.code === 'broken-diagram-connection-relationship');
    expect(error).toMatchObject({ path: 'diagramConnections[conn-1].archimateRelationshipId' });
  });
});

describe('validateArchiModel — broken diagram-connection visual source/target reference', () => {
  it('flags a connection source id that does not resolve to any diagram object', () => {
    const xml = `${XML_HEADER}
      <archimate:model ${NS} name="Broken Visual Source" id="model-broken-visual-source" version="5.0.0">
        <folder name="Views" id="folder-views" type="diagrams">
          <element xsi:type="archimate:ArchimateDiagramModel" name="View" id="view-1">
            <child xsi:type="archimate:Group" id="visual-a" name="A">
              <bounds x="0" y="0" width="10" height="10"/>
              <sourceConnection xsi:type="archimate:Connection" id="conn-1" source="does-not-exist" target="visual-a"/>
            </child>
          </element>
        </folder>
      </archimate:model>`;
    const { valid, errors } = validateArchiModel(parseArchiModel(xml));
    expect(valid).toBe(false);
    const error = errors.find((e) => e.code === 'broken-diagram-connection-source');
    expect(error).toMatchObject({ path: 'diagramConnections[conn-1].sourceId' });
  });

  it('flags a connection target id that does not resolve to any diagram object', () => {
    const xml = `${XML_HEADER}
      <archimate:model ${NS} name="Broken Visual Target" id="model-broken-visual-target" version="5.0.0">
        <folder name="Views" id="folder-views" type="diagrams">
          <element xsi:type="archimate:ArchimateDiagramModel" name="View" id="view-1">
            <child xsi:type="archimate:Group" id="visual-a" name="A">
              <bounds x="0" y="0" width="10" height="10"/>
              <sourceConnection xsi:type="archimate:Connection" id="conn-1" source="visual-a" target="does-not-exist"/>
            </child>
          </element>
        </folder>
      </archimate:model>`;
    const { valid, errors } = validateArchiModel(parseArchiModel(xml));
    expect(valid).toBe(false);
    const error = errors.find((e) => e.code === 'broken-diagram-connection-target');
    expect(error).toMatchObject({ path: 'diagramConnections[conn-1].targetId' });
  });
});
