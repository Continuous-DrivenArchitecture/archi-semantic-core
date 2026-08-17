---
title: Geometry and nested coordinates
description: Bounds relative to parents, null safety and bendpoint representation.
---

## Bounds

```ts
interface ArchiBounds {
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}
```

:::caution[Nested coordinates are relative]

**`ArchiBounds.x`/`.y` on a nested diagram object or note are relative to
its own parent's origin, not absolute canvas coordinates** — this is how
Archi itself stores nested geometry natively.

A diagram object with `parentId: 'group-1'` and
`bounds: { x: 10, y: 10, ... }` sits 10px right and 10px down from
`group-1`'s own top-left corner, not the view's.

:::

To get absolute coordinates, sum `x`/`y` up the `parentId` chain to the
root. Root-level objects (`parentId === null`) already have view-relative
(i.e. absolute) coordinates:

```ts
function absoluteBounds(
  object: ArchiDiagramObject,
  byId: Map<string, ArchiDiagramObject>,
): ArchiBounds | null {
  let current = object;
  let offsetX = 0;
  let offsetY = 0;

  while (current.parentId) {
    const parent = byId.get(current.parentId);
    if (!parent?.bounds?.x || !parent?.bounds?.y) break;
    offsetX += parent.bounds.x;
    offsetY += parent.bounds.y;
    current = parent;
  }

  return object.bounds
    ? {
        x: object.bounds.x !== null ? object.bounds.x + offsetX : null,
        y: object.bounds.y !== null ? object.bounds.y + offsetY : null,
        width: object.bounds.width,
        height: object.bounds.height,
      }
    : null;
}
```

## Nullable fields are meaningful

Any of the four fields can independently be `null` — the parser never
fabricates a `0` for a missing/non-numeric attribute. `validateArchiModel`
does **not** check bounds completeness; treat a `null` field as "cannot be
positioned".

## Bendpoints

```ts
interface ArchiBendpoint {
  startX: number | null;
  startY: number | null;
  endX: number | null;
  endY: number | null;
}
```

`ArchiBendpoint` values follow Archi's own native representation: each
bendpoint stores its own **start/end pair** rather than a single midpoint,
which lets a bent connection curve be reconstructed without additional
geometry logic.
