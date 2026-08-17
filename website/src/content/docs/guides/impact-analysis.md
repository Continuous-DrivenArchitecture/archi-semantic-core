---
title: Impact analysis
description: Walk relationships in both directions to find what depends on a given element.
---

Impact analysis is a directed graph traversal over the model's relationships:
"who is affected if this element changes?" is answered by walking
relationships *incoming to* the element, then recursively.

```ts
import {
  parseArchiModel,
  validateArchiModel,
} from '@cda/archi-semantic-core';

const model = parseArchiModel(xml);
const { valid, errors } = validateArchiModel(model);
if (!valid) {
  console.error('Model is not structurally sound; traversal may mislead.');
  console.error(errors);
}

const elementById = new Map(model.elements.map((e) => [e.id, e]));

// relationships BY source and BY target — two O(1) neighbor indexes
const outgoingBySource = new Map<string, typeof model.relationships>();
for (const rel of model.relationships) {
  const bucket = outgoingBySource.get(rel.sourceId) ?? [];
  bucket.push(rel);
  outgoingBySource.set(rel.sourceId, bucket);
}

const incomingByTarget = new Map<string, typeof model.relationships>();
for (const rel of model.relationships) {
  const bucket = incomingByTarget.get(rel.targetId) ?? [];
  bucket.push(rel);
  incomingByTarget.set(rel.targetId, bucket);
}
```

## Walk downstream dependents

```ts
function collectDependents(
  startId: string,
  depthLimit: number,
): Map<string, number> {
  const depths = new Map<string, number>([[startId, 0]]);
  const queue = [startId];

  while (queue.length > 0) {
    const id = queue.shift()!;
    const depth = depths.get(id)!;
    if (depth >= depthLimit) continue;

    for (const rel of incomingByTarget.get(id) ?? []) {
      if (!depths.has(rel.sourceId)) {
        depths.set(rel.sourceId, depth + 1);
        queue.push(rel.sourceId);
      }
    }
  }

  return depths;
}
```

The result maps affected element ids to their distance from the changed
element. Sorting by `(depth, name)` yields a ready-to-review report:

```ts
const affected = collectDependents('element-paying-service', 5);
const report = [...affected]
  .filter(([id]) => id !== 'element-paying-service')
  .sort(([aId, aDepth], [bId, bDepth]) =>
    aDepth - bDepth ||
    (elementById.get(aId)?.name ?? '').localeCompare(elementById.get(bId)?.name ?? ''),
  )
  .map(([id, depth]) => `${'  '.repeat(depth)}${elementById.get(id)?.name}`)
  .join('\n');

console.log(report);
```

## Important traversal details

- **Relationships can be sources/targets of other relationships.** When
  collecting dependents, resolve `rel.sourceId` from both the elements and
  relationships collections — a changed element may affect other
  relationships first (see [Relationships](/core-concepts/relationships/)).
- **Validate before trusting the walk.** A dangling `sourceId`/`targetId`
  silently drops an edge from the traversal; `validateArchiModel` surfaces
  exactly those conditions. Use the dependency index results above to spot
  them upfront: a relationship whose endpoints fail to resolve is itself a
  finding worth reporting.

## Upstream / downstream symmetry

Swapping the two indexes (walking `outgoingBySource` from a target) answers
the upstream question: "what does this element depend on?" — the same walk,
different direction.
