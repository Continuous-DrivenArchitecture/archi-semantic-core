---
title: Views
description: ArchiView — diagram definitions, viewpoints and precomputed containment indexes.
---

An
[`ArchiView`](/reference/generated/index/interfaces/ArchiView/)
is an Archi diagram/view definition (an `archimate:ArchimateDiagramModel`):
the container that binds visual objects together.

## Native attributes

```ts
interface ArchiView {
  viewpoint: string | null;             // e.g. "layered", "organization"
  connectionRouterType: number | null;  // 0 = manual bendpoints, 2 = orthogonal
}
```

- `viewpoint` is Archi's **internal lowercase code** — not a human-readable
  name. `null` when unset (Archi's own default is an empty string, meaning
  "no viewpoint restriction").
- `connectionRouterType` is preserved as the **raw native number** rather
  than decoded to a named enum: its meaning is Archi-UI-specific and the
  numbering has already changed once in Archi's source (a `1` value was
  reserved and dropped). `null` when absent (Archi's default is `0`).

## Precomputed containment indexes

The native XML expresses containment only through nesting. `parseArchiModel`
does one extra O(n) derivation pass so every view already has its children's
ids precomputed, in source order — no tree-walking required on the caller's
side:

```ts
interface ArchiView {
  diagramObjectIds: string[];     // direct-child diagram objects (not nested)
  diagramConnectionIds: string[]; // every connection anywhere in the view, any nesting depth
  noteIds: string[];              // direct-child notes (not nested)
}
```

## Example

```ts
const view = model.views.find((v) => v.name === 'Application Overview');
if (!view) return;

for (const id of view.diagramObjectIds) {
  const object = model.diagramObjects.find((o) => o.id === id);
  console.log(object?.name, object?.xsiType);
}
```

For repeated lookups, build an id index once instead of using `find` in a
loop — see [Build lookup indexes](/guides/lookup-indexes/).
