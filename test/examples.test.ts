import { describe, expect, it } from 'vitest';
import { parseArchiModel } from '../src/index.js';
import { indexModel, elementsOfType, relationshipsOf } from '../examples/basic-usage.js';
import { downstreamImpact, upstreamDependents } from '../examples/impact-analysis.js';
import { validationReport, assertValidModel, issuesByCode } from '../examples/validation-gate.js';
import { viewLabels } from '../examples/label-expressions.js';

const FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<archimate:model xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:archimate="http://www.archimatetool.com/archimate" name="Examples" id="model-examples" version="5.0.0">
  <folder name="Business" id="folder-biz" type="business">
    <element xsi:type="archimate:BusinessActor" name="Customer" id="element-customer"/>
    <element xsi:type="archimate:BusinessProcess" name="Order Fulfilment" id="element-process"/>
    <element xsi:type="archimate:ApplicationComponent" name="CRM" id="element-crm">
      <property key="Owner" value="Platform Team"/>
    </element>
    <element xsi:type="archimate:TechnologyService" name="Database" id="element-db"/>
  </folder>
  <folder name="Relations" id="folder-rel" type="relations">
    <element xsi:type="archimate:AssociationRelationship" id="rel-uses" source="element-customer" target="element-process"/>
    <element xsi:type="archimate:ServingRelationship" id="rel-serves" source="element-process" target="element-crm"/>
    <element xsi:type="archimate:RealizationRelationship" id="rel-realizes" source="element-db" target="element-crm"/>
  </folder>
  <folder name="Views" id="folder-views" type="diagrams">
    <element xsi:type="archimate:ArchimateDiagramModel" name="Overview" id="view-overview">
      <child xsi:type="archimate:DiagramObject" id="vis-customer" archimateElement="element-customer">
        <bounds x="10" y="20" width="100" height="50"/>
        <feature name="labelExpression" value="Customer: \${name}"/>
      </child>
      <child xsi:type="archimate:DiagramObject" id="vis-crm" archimateElement="element-crm">
        <bounds x="150" y="20" width="120" height="60"/>
        <feature name="labelExpression" value="\${name}\\n\${property:Owner}"/>
        <sourceConnection xsi:type="archimate:Connection" id="conn-serves" source="vis-crm" target="vis-customer" archimateRelationship="rel-serves"/>
      </child>
      <child xsi:type="archimate:Note" id="note-1">
        <bounds x="15" y="90" width="50" height="20"/>
        <content>note</content>
      </child>
    </element>
  </folder>
</archimate:model>`;

const model = parseArchiModel(FIXTURE);

describe('basic-usage — indexing and querying', () => {
  const index = indexModel(model);

  it('indexes elements and relationships by id', () => {
    expect(index.elementsById.get('element-crm')?.name).toBe('CRM');
    expect(index.relationshipsById.get('rel-serves')?.type).toBe('ServingRelationship');
  });

  it('indexes relationships by source and target', () => {
    expect(index.relationshipsBySource.get('element-process')?.map((r) => r.id)).toEqual(['rel-serves']);
    expect(index.relationshipsByTarget.get('element-crm')?.map((r) => r.id).sort()).toEqual(['rel-realizes', 'rel-serves']);
  });

  it('queries elements by semantic type', () => {
    expect(elementsOfType(model, 'BusinessActor').map((e) => e.id)).toEqual(['element-customer']);
    expect(elementsOfType(model, 'ApplicationComponent').map((e) => e.id)).toEqual(['element-crm']);
  });

  it('finds all relationships touching an element', () => {
    expect(relationshipsOf(model, index, 'element-crm').map((r) => r.id).sort()).toEqual(['rel-realizes', 'rel-serves']);
  });
});

describe('impact-analysis — traversing the relationship graph', () => {
  it('walks downstream from source to target', () => {
    const impact = downstreamImpact(model, 'element-customer');
    expect(impact.map((node) => node.id)).toEqual(['element-process', 'element-crm']);
  });

  it('walks upstream from target back to source', () => {
    const dependents = upstreamDependents(model, 'element-crm');
    expect(dependents.map((node) => node.id).sort()).toEqual(['element-customer', 'element-db', 'element-process']);
  });

  it('includes names and semantic types in the impact nodes', () => {
    const impact = downstreamImpact(model, 'element-customer');
    const crm = impact.find((node) => node.id === 'element-crm');
    expect(crm?.name).toBe('CRM');
    expect(crm?.type).toBe('ApplicationComponent');
  });
});

describe('validation-gate — structural checks as a pipeline gate', () => {
  it('reports a valid model', () => {
    expect(validationReport(model)).toBe('Model is structurally valid.');
    expect(() => assertValidModel(model)).not.toThrow();
  });

  it('reports issues and throws on a broken model', () => {
    const broken = `<?xml version="1.0" encoding="UTF-8"?>
<archimate:model xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:archimate="http://www.archimatetool.com/archimate" name="Broken" id="model-broken" version="5.0.0">
  <folder name="Business" id="folder-biz" type="business">
    <element xsi:type="archimate:BusinessActor" name="A" id="element-a"/>
  </folder>
  <folder name="Relations" id="folder-rel" type="relations">
    <element xsi:type="archimate:ServingRelationship" id="rel-dangling" source="element-a" target="element-missing"/>
  </folder>
</archimate:model>`;
    const brokenModel = parseArchiModel(broken);
    expect(validationReport(brokenModel)).toMatch(/INVALID/);
    expect(validationReport(brokenModel)).toMatch(/broken-relationship-target/);
    expect(() => assertValidModel(brokenModel)).toThrow(/INVALID/);
  });

  it('groups issues by code', () => {
    const broken = `<?xml version="1.0" encoding="UTF-8"?>
<archimate:model xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:archimate="http://www.archimatetool.com/archimate" name="Broken" id="model-broken" version="5.0.0">
  <folder name="Business" id="folder-biz" type="business">
    <element xsi:type="archimate:BusinessActor" name="A" id="element-a"/>
  </folder>
  <folder name="Relations" id="folder-rel" type="relations">
    <element xsi:type="archimate:ServingRelationship" id="rel-1" source="element-a" target="element-missing"/>
    <element xsi:type="archimate:ServingRelationship" id="rel-2" source="element-missing" target="element-a"/>
  </folder>
</archimate:model>`;
    const byCode = issuesByCode(parseArchiModel(broken));
    expect(byCode.get('broken-relationship-target')?.map((issue) => issue.path)).toEqual([
      'relationships[rel-1].targetId',
    ]);
    expect(byCode.get('broken-relationship-source')?.map((issue) => issue.path)).toEqual([
      'relationships[rel-2].sourceId',
    ]);
  });
});

describe('label-expressions — resolving view labels', () => {
  const labels = viewLabels(model, 'view-overview');

  it('resolves label expressions against the model', () => {
    const customer = labels.find((label) => label.id === 'vis-customer');
    expect(customer?.expression).toBe('Customer: ${name}');
    expect(customer?.label).toBe('Customer: Customer');
  });

  it('resolves properties and preserves the verbatim expression separators', () => {
    const crm = labels.find((label) => label.id === 'vis-crm');
    expect(crm?.expression).toBe('${name}\\n${property:Owner}');
    expect(crm?.label).toBe('CRM\\nPlatform Team');
  });

  it('falls back to the plain name for nodes without an expression', () => {
    const note = labels.find((label) => label.id === 'note-1');
    expect(note?.expression).toBeNull();
    expect(note?.label).toBe('note');
  });

  it('covers objects, connections, and notes of the view', () => {
    expect(labels.map((label) => label.kind).sort()).toEqual(['connection', 'note', 'object', 'object']);
  });
});