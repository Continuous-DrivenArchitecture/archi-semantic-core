import { describe, expect, it } from 'vitest';
import { resolveAbsoluteBounds } from '../src/parser/geometry.js';
import type { ArchiModel, ArchiModelMetadata } from '../src/domain/model.js';
import type { ArchiDiagramObject } from '../src/domain/diagram.js';

const METADATA: ArchiModelMetadata = { id: 'model-1', name: 'Test Model', version: '5.0.0', purpose: null, properties: [] };

function makeObject(overrides: Partial<ArchiDiagramObject>): ArchiDiagramObject {
  return {
    id: 'object',
    name: null,
    xsiType: 'archimate:DiagramObject',
    viewId: 'view',
    parentId: null,
    archimateElementId: null,
    referencedModelId: null,
    bounds: { x: 0, y: 0, width: 100, height: 50 },
    textPosition: null,
    textAlignment: null,
    figureType: null,
    documentation: null,
    style: null,
    features: [],
    childrenIds: [],
    connectionIds: [],
    ...overrides,
  };
}

function makeModel(diagramObjects: ArchiDiagramObject[]): ArchiModel {
  return {
    metadata: METADATA,
    folders: [],
    elements: [],
    relationships: [],
    views: [],
    diagramObjects,
    diagramConnections: [],
    notes: [],
    profiles: [],
  };
}

describe('resolveAbsoluteBounds', () => {
  it('resolves a top-level (non-nested) object to its own bounds unchanged', () => {
    const object = makeObject({ id: 'a', bounds: { x: 48, y: 180, width: 120, height: 55 } });
    const model = makeModel([object]);
    expect(resolveAbsoluteBounds(model, object)).toEqual({ x: 48, y: 180, width: 120, height: 55 });
  });

  it('applies the "omitted x/y means 0" convention to a top-level object', () => {
    const object = makeObject({ id: 'a', bounds: { x: null, y: 40, width: 120, height: 55 } });
    const model = makeModel([object]);
    expect(resolveAbsoluteBounds(model, object)).toEqual({ x: 0, y: 40, width: 120, height: 55 });
  });

  it('sums one ancestor level for a nested object', () => {
    const parent = makeObject({ id: 'parent', bounds: { x: 100, y: 200, width: 400, height: 300 } });
    const child = makeObject({ id: 'child', parentId: 'parent', bounds: { x: 50, y: 60, width: 120, height: 55 } });
    const model = makeModel([parent, child]);
    expect(resolveAbsoluteBounds(model, child)).toEqual({ x: 150, y: 260, width: 120, height: 55 });
  });

  it('sums every level of a deeper nesting chain', () => {
    const grandparent = makeObject({ id: 'gp', bounds: { x: 10, y: 20, width: 900, height: 900 } });
    const parent = makeObject({ id: 'p', parentId: 'gp', bounds: { x: 100, y: 200, width: 400, height: 300 } });
    const child = makeObject({ id: 'c', parentId: 'p', bounds: { x: 50, y: 60, width: 120, height: 55 } });
    const model = makeModel([grandparent, parent, child]);
    expect(resolveAbsoluteBounds(model, child)).toEqual({ x: 160, y: 280, width: 120, height: 55 });
  });

  it('applies the null-to-0 convention at every level of the chain, not just the leaf', () => {
    const parent = makeObject({ id: 'parent', bounds: { x: null, y: 200, width: 400, height: 300 } });
    const child = makeObject({ id: 'child', parentId: 'parent', bounds: { x: 50, y: null, width: 120, height: 55 } });
    const model = makeModel([parent, child]);
    expect(resolveAbsoluteBounds(model, child)).toEqual({ x: 50, y: 200, width: 120, height: 55 });
  });

  it('returns null when the object has no bounds at all', () => {
    const object = makeObject({ id: 'a', bounds: null });
    const model = makeModel([object]);
    expect(resolveAbsoluteBounds(model, object)).toBeNull();
  });

  it('returns null when the object is missing width/height (incomplete geometry)', () => {
    const object = makeObject({ id: 'a', bounds: { x: 0, y: 0, width: null, height: 50 } });
    const model = makeModel([object]);
    expect(resolveAbsoluteBounds(model, object)).toBeNull();
  });

  it("returns null when an ancestor's own bounds are incomplete", () => {
    const parent = makeObject({ id: 'parent', bounds: { x: 100, y: 200, width: null, height: 300 } });
    const child = makeObject({ id: 'child', parentId: 'parent', bounds: { x: 50, y: 60, width: 120, height: 55 } });
    const model = makeModel([parent, child]);
    expect(resolveAbsoluteBounds(model, child)).toBeNull();
  });

  it('resolves as far as possible, then stops, when a referenced parentId is not in the model', () => {
    const child = makeObject({ id: 'child', parentId: 'missing-parent', bounds: { x: 50, y: 60, width: 120, height: 55 } });
    const model = makeModel([child]);
    expect(resolveAbsoluteBounds(model, child)).toEqual({ x: 50, y: 60, width: 120, height: 55 });
  });

  it('defends against a parent cycle instead of looping forever', () => {
    const a = makeObject({ id: 'a', parentId: 'b', bounds: { x: 10, y: 10, width: 50, height: 50 } });
    const b = makeObject({ id: 'b', parentId: 'a', bounds: { x: 20, y: 20, width: 50, height: 50 } });
    const model = makeModel([a, b]);
    // Cycle is detected after summing b's offset once (a -> b -> a, stop).
    expect(resolveAbsoluteBounds(model, a)).toEqual({ x: 30, y: 30, width: 50, height: 50 });
  });

  it('caches the diagram-object index across repeated calls for the same model (no behavioral difference, exercised via consistent results)', () => {
    const parent = makeObject({ id: 'parent', bounds: { x: 100, y: 200, width: 400, height: 300 } });
    const child = makeObject({ id: 'child', parentId: 'parent', bounds: { x: 50, y: 60, width: 120, height: 55 } });
    const model = makeModel([parent, child]);
    expect(resolveAbsoluteBounds(model, child)).toEqual(resolveAbsoluteBounds(model, child));
  });
});
