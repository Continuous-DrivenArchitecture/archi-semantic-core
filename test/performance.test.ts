import { describe, expect, it } from 'vitest';
import { performance } from 'node:perf_hooks';
import { parseArchiModel, validateArchiModel } from '../src/index.js';

const NS =
  'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:archimate="http://www.archimatetool.com/archimate"';

/**
 * Builds a synthetic model XML with `count` elements, `count` relationships,
 * and a view holding `count` diagram objects — the shape that stresses the
 * id-derivation and validation code paths the way a large real model would.
 */
function buildLargeModelXml(count: number): string {
  const parts: string[] = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(`<archimate:model ${NS} name="Large Model" id="model-large" version="5.0.0">`);
  parts.push('<folder name="Business" id="folder-business" type="business">');
  for (let i = 0; i < count; i++) {
    parts.push(`<element xsi:type="archimate:BusinessActor" name="Actor ${i}" id="element-${i}"/>`);
  }
  parts.push('</folder>');
  parts.push('<folder name="Relations" id="folder-relations" type="relations">');
  for (let i = 0; i < count; i++) {
    parts.push(
      `<element xsi:type="archimate:ServingRelationship" id="relationship-${i}" source="element-${i}" target="element-${(i + 1) % count}"/>`,
    );
  }
  parts.push('</folder>');
  parts.push('<folder name="Views" id="folder-views" type="diagrams">');
  parts.push('<element xsi:type="archimate:ArchimateDiagramModel" name="View" id="view-1">');
  for (let i = 0; i < count; i++) {
    parts.push(
      `<child xsi:type="archimate:DiagramObject" id="object-${i}" archimateElement="element-${i}"><bounds x="0" y="0" width="100" height="50"/></child>`,
    );
  }
  parts.push('</element>');
  parts.push('</folder>');
  parts.push('</archimate:model>');
  return parts.join('\n');
}

function timeMs(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

// Generous linear-time budget. A single-pass Map-index implementation parses
// and validates 20k elements + 20k relationships + 20k diagram objects in
// well under a second; any O(n²) array-scan regression blows this away.
const LARGE_COUNT = 20_000;
const BUDGET_MS = 15_000;

describe('parseArchiModel + validateArchiModel scale linearly on large models', () => {
  const xml = buildLargeModelXml(LARGE_COUNT);

  it(`parses and validates ${LARGE_COUNT} elements within the linear-time budget`, () => {
    const elapsed = timeMs(() => {
      const model = parseArchiModel(xml);
      const result = validateArchiModel(model);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    expect(elapsed).toBeLessThan(BUDGET_MS);
  });

  it('doubling the model size does not quadratically blow up parse time', () => {
    // Warm up JIT and module state on a small model first.
    parseArchiModel(buildLargeModelXml(1_000));
    const half = buildLargeModelXml(5_000);
    const full = buildLargeModelXml(10_000);

    const halfTime = timeMs(() => parseArchiModel(half));
    const fullTime = timeMs(() => parseArchiModel(full));

    // Linear scaling → ~2x; quadratic scaling → ~4x. The 3.2x ceiling
    // tolerates CI noise while still failing on a quadratic regression.
    expect(fullTime).toBeLessThan(halfTime * 3.2);
  });
});