---
title: Build lookup indexes
description: Turn flat id-based collections into O(1) lookup tables.
---

The model's collections are flat arrays whose cross-references are plain
string ids (see [IDs and references](/core-concepts/ids-references/)). For
anything beyond one-off lookups, build a `Map` index once — a single O(n)
pass that pays off on every subsequent lookup.

```ts
import { parseArchiModel } from '@cda/archi-semantic-core';

const model = parseArchiModel(xml);

const elementById = new Map(model.elements.map((e) => [e.id, e]));
const relationshipById = new Map(model.relationships.map((r) => [r.id, r]));
const folderById = new Map(model.folders.map((f) => [f.id, f]));
const objectById = new Map(model.diagramObjects.map((o) => [o.id, o]));
const profileById = new Map(model.profiles.map((p) => [p.id, p]));
```

## Resolving relationship endpoints

A relationship's source or target can be an **element or another
relationship** (see [Relationships](/core-concepts/relationships/)), so
resolve from both indexes:

```ts
function nodeName(id: string): string | null {
  return elementById.get(id)?.name ?? relationshipById.get(id)?.name ?? null;
}
```

## Resolving the visual layer

A connection's `sourceId`/`targetId` point at **diagram objects**, not
semantic elements. Follow the chain:

```ts
function elementForObject(objectId: string) {
  const object = objectById.get(objectId);
  return object?.archimateElementId
    ? elementById.get(object.archimateElementId)
    : undefined;
}
```

## View-local navigation

Views precompute their containment (see [Views](/core-concepts/views/)),
so iterating a view's diagram objects is direct:

```ts
function objectsInView(viewId: string) {
  const view = model.views.find((v) => v.id === viewId);
  if (!view) return [];
  return view.diagramObjectIds
    .map((id) => objectById.get(id))
    .filter(Boolean);
}
```

## When to skip indexes

For a single traversal of one collection, `find`/`filter` are fine and
simpler. Build indexes when you will look things up repeatedly — typically
in any renderer, impact-analysis walk, or report generator.
