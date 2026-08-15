import { describe, expect, it } from 'vitest';
import { parseArchiModel, getLabelExpression, resolveLabelExpression } from '../src/index.js';
import { loadFixture } from './helpers/load-fixture.js';

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
const NS = 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:archimate="http://www.archimatetool.com/archimate"';

/** Builds a minimal model with one element (with two properties) shown once in a view, whose DiagramObject carries the given labelExpression. */
function modelWithLabelExpression(expression: string): ReturnType<typeof parseArchiModel> {
  const xml = `${XML_HEADER}
<archimate:model ${NS} name="Label Expr Model" id="model-label" version="5.0.0">
  <folder name="Business" id="folder-business" type="business">
    <element xsi:type="archimate:BusinessActor" name="Customer Service" id="element-1">
      <documentation>Handles customer inquiries&#xD;&#xA;Second line</documentation>
      <property key="Owner" value="Alice"/>
      <property key="Owner" value="Bob"/>
      <property key="Team" value="Support"/>
    </element>
  </folder>
  <folder name="Views" id="folder-views" type="diagrams">
    <element xsi:type="archimate:ArchimateDiagramModel" name="View" id="view-1">
      <child xsi:type="archimate:DiagramObject" id="visual-1" archimateElement="element-1">
        <bounds x="0" y="0" width="120" height="60"/>
        <feature name="labelExpression" value="${expression}"/>
      </child>
    </element>
  </folder>
</archimate:model>`;
  return parseArchiModel(xml);
}

function diagramObject1(model: ReturnType<typeof parseArchiModel>) {
  return model.diagramObjects.find((obj) => obj.id === 'visual-1')!;
}

describe('getLabelExpression', () => {
  it('returns the raw expression string when a labelExpression feature is present', () => {
    const model = modelWithLabelExpression('${name}');
    expect(getLabelExpression(diagramObject1(model).features)).toBe('${name}');
  });

  it('returns null when there is no labelExpression feature', () => {
    expect(getLabelExpression([])).toBeNull();
    expect(getLabelExpression([{ name: 'otherFeature', value: 'x' }])).toBeNull();
  });
});

describe('resolveLabelExpression — core placeholders', () => {
  it('returns null when the object has no labelExpression feature at all', () => {
    const xml = `${XML_HEADER}
<archimate:model ${NS} name="No Expr" id="model-no-expr" version="5.0.0">
  <folder name="Views" id="folder-views" type="diagrams">
    <element xsi:type="archimate:ArchimateDiagramModel" name="View" id="view-1">
      <child xsi:type="archimate:Group" id="visual-1" name="G">
        <bounds x="0" y="0" width="10" height="10"/>
      </child>
    </element>
  </folder>
</archimate:model>`;
    const model = parseArchiModel(xml);
    expect(resolveLabelExpression(model, diagramObject1(model))).toBeNull();
  });

  it('resolves ${name}', () => {
    const model = modelWithLabelExpression('${name}');
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('Customer Service');
  });

  it('resolves ${documentation}', () => {
    const model = modelWithLabelExpression('${documentation}');
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('Handles customer inquiries\r\nSecond line');
  });

  it('resolves ${type}', () => {
    const model = modelWithLabelExpression('${type}');
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('BusinessActor');
  });

  it('resolves ${property:key} for an existing key', () => {
    const model = modelWithLabelExpression('${property:Team}');
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('Support');
  });

  it('resolves ${property:key} to an empty string for a missing key', () => {
    const model = modelWithLabelExpression('${property:DoesNotExist}');
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('');
  });

  it('resolves ${property:key} to the FIRST matching property when the key repeats', () => {
    const model = modelWithLabelExpression('${property:Owner}');
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('Alice');
  });

  it('resolves ${properties} as a "key: value" list', () => {
    const model = modelWithLabelExpression('${properties}');
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('Owner: Alice\nOwner: Bob\nTeam: Support');
  });

  it('resolves ${propertiesvalues} as a values-only list', () => {
    const model = modelWithLabelExpression('${propertiesvalues}');
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('Alice\nBob\nSupport');
  });

  it('resolves ${properties:separator:key} to every value for that key, joined by separator', () => {
    const model = modelWithLabelExpression('${properties:, :Owner}');
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('Alice, Bob');
  });

  it('combines literal text with expressions, including a literal newline from the source XML', () => {
    const model = modelWithLabelExpression('${name}&#xA;${property:Team}');
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('Customer Service\nSupport');
  });

  it('matches the wiki\'s own wordwrap example shape: ${wordwrap:12:${documentation}}', () => {
    const model = modelWithLabelExpression('${wordwrap:12:${name}}');
    // "Customer Service" (17 chars) wrapped every 12 chars.
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('Customer Ser\nvice');
  });

  it('resolves ${if:condition:value} to value when condition is non-empty', () => {
    const model = modelWithLabelExpression('${if:${name}:has-name}');
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('has-name');
  });

  it('resolves ${if:condition:value} to empty when condition is empty', () => {
    const model = modelWithLabelExpression('${if:${property:Missing}:has-value}');
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('');
  });

  it('resolves ${if:condition:value1:value2} (both branches)', () => {
    const model = modelWithLabelExpression('${if:${property:Missing}:yes:no}');
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('no');
  });

  it('resolves ${nvl:condition:fallback} to the condition\'s own value when non-empty', () => {
    const model = modelWithLabelExpression('${nvl:${name}:fallback}');
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('Customer Service');
  });

  it('resolves ${nvl:condition:fallback} to the fallback when the condition is empty', () => {
    const model = modelWithLabelExpression('${nvl:${property:Missing}:fallback}');
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('fallback');
  });

  it('resolves nested expressions inside if/nvl arguments, matching the wiki\'s bracket-decoration pattern', () => {
    const model = modelWithLabelExpression('${if:${property:Team}:<<${property:Team}>>}');
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('<<Support>>');
  });

  it('leaves an unrecognized command verbatim instead of silently dropping it', () => {
    const model = modelWithLabelExpression('${bogusCommand}');
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('${bogusCommand}');
  });

  it('leaves Reference Prefix syntax ($parent{...}) untouched — out of v1 scope', () => {
    const model = modelWithLabelExpression('$parent{name} / ${name}');
    expect(resolveLabelExpression(model, diagramObject1(model))).toBe('$parent{name} / Customer Service');
  });
});

describe('resolveLabelExpression — object kinds', () => {
  it('resolves ${content} for a Note', () => {
    const xml = `${XML_HEADER}
<archimate:model ${NS} name="Note Model" id="model-note" version="5.0.0">
  <folder name="Views" id="folder-views" type="diagrams">
    <element xsi:type="archimate:ArchimateDiagramModel" name="View" id="view-1">
      <child xsi:type="archimate:Note" id="note-1">
        <bounds x="0" y="0" width="10" height="10"/>
        <content>Remember to review this</content>
        <feature name="labelExpression" value="Note: \${content}"/>
      </child>
    </element>
  </folder>
</archimate:model>`;
    const model = parseArchiModel(xml);
    const note = model.notes.find((n) => n.id === 'note-1')!;
    expect(resolveLabelExpression(model, note)).toBe('Note: Remember to review this');
  });

  it('resolves ${name} for a Group (no underlying element) from its own name; ${documentation} is empty (v1 limitation)', () => {
    const xml = `${XML_HEADER}
<archimate:model ${NS} name="Group Model" id="model-group" version="5.0.0">
  <folder name="Views" id="folder-views" type="diagrams">
    <element xsi:type="archimate:ArchimateDiagramModel" name="View" id="view-1">
      <child xsi:type="archimate:Group" id="visual-group" name="My Group">
        <bounds x="0" y="0" width="10" height="10"/>
        <documentation>Group documentation</documentation>
        <feature name="labelExpression" value="\${name} / [\${documentation}]"/>
      </child>
    </element>
  </folder>
</archimate:model>`;
    const model = parseArchiModel(xml);
    const group = model.diagramObjects.find((obj) => obj.id === 'visual-group')!;
    expect(resolveLabelExpression(model, group)).toBe('My Group / []');
  });

  it('resolves ${type}/${strength}/${accessType} for a connection backed by a relationship', () => {
    const xml = `${XML_HEADER}
<archimate:model ${NS} name="Conn Model" id="model-conn" version="5.0.0">
  <folder name="Business" id="folder-business" type="business">
    <element xsi:type="archimate:BusinessActor" name="A" id="element-a"/>
    <element xsi:type="archimate:BusinessActor" name="B" id="element-b"/>
  </folder>
  <folder name="Relations" id="folder-rel" type="relations">
    <element xsi:type="archimate:InfluenceRelationship" id="rel-1" source="element-a" target="element-b" strength="+"/>
  </folder>
  <folder name="Views" id="folder-views" type="diagrams">
    <element xsi:type="archimate:ArchimateDiagramModel" name="View" id="view-1">
      <child xsi:type="archimate:DiagramObject" id="visual-a" archimateElement="element-a">
        <bounds x="0" y="0" width="60" height="30"/>
        <sourceConnection xsi:type="archimate:Connection" id="visual-conn" source="visual-a" target="visual-b" archimateRelationship="rel-1">
          <feature name="labelExpression" value="\${type}: \${strength}"/>
        </sourceConnection>
      </child>
      <child xsi:type="archimate:DiagramObject" id="visual-b" archimateElement="element-b">
        <bounds x="100" y="0" width="60" height="30"/>
      </child>
    </element>
  </folder>
</archimate:model>`;
    const model = parseArchiModel(xml);
    const connection = model.diagramConnections.find((conn) => conn.id === 'visual-conn')!;
    expect(resolveLabelExpression(model, connection)).toBe('InfluenceRelationship: +');
  });

  it('end to end: resolves the real labelExpression feature from the object-details fixture', () => {
    const model = parseArchiModel(loadFixture('object-details.archimate'));
    const visualSharedA = model.diagramObjects.find((obj) => obj.id === 'visual-shared-a')!;
    expect(resolveLabelExpression(model, visualSharedA)).toBe('Shared Component\nOne');
  });
});
