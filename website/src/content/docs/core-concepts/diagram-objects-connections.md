---
title: Diagram objects and connections
description: The visual layer — diagram objects, groups, model references, connections and notes.
---

The visual layer of a model is captured in three collections:
`diagramObjects`, `diagramConnections` and `notes`.

## Diagram objects

An
[`ArchiDiagramObject`](/reference/generated/index/interfaces/ArchiDiagramObject/)
is a visual node within a view: an Archi `DiagramObject` (the visual
representation of an `ArchiElement`) **or any other non-Note visual
container** Archi may place in a diagram — for example a `Group`, which has
no underlying semantic element. Any such node is preserved generically.

```ts
interface ArchiDiagramObject {
  viewId: string;
  parentId: string | null;              // null when directly owned by the view
  archimateElementId: string | null;    // the semantic element, or null (e.g. Group)
  referencedModelId: string | null;     // DiagramModelReference only
  childrenIds: string[];                // diagram objects nested directly inside
  connectionIds: string[];              // connections whose source is this object
}
```

### Elements vs. containers

`xsiType`, not `archimateElementId`, is the correct discriminator between an
element-backed object and a pure visual container: **both** a `DiagramObject`
backed by an element and a `Group` may relate to ids — but only a
`Group`/reference has `archimateElementId === null`. And only a
`DiagramModelReference` (Archi's "insert view as reference" object) has a
`referencedModelId`, which may point at **any** `IDiagramModel` — including
Sketch/Canvas views, not only other `ArchiView`s.

## Connections

An
[`ArchiDiagramConnection`](/reference/generated/index/interfaces/ArchiDiagramConnection/)
is a visual connection between two diagram objects (an Archi
`sourceConnection`), typically representing an underlying ArchiMate
relationship.

```ts
interface ArchiDiagramConnection {
  sourceId: string;                 // a VISUAL id — an ArchiDiagramObject id
  targetId: string;                 // a VISUAL id — an ArchiDiagramObject id
  archimateRelationshipId: string | null; // the semantic relationship, if any
  bendpoints: ArchiBendpoint[];
}
```

Important: `sourceId`/`targetId` reference **diagram objects, not semantic
elements** — resolve them against `model.diagramObjects` first, then follow
`archimateElementId` if you need the underlying elements.

`archimateRelationshipId` is legitimately `null` for a plain visual link
with no semantic meaning (e.g. a Note-to-Note connector).

## Notes

An [`ArchiNote`](/reference/generated/index/interfaces/ArchiNote/) is a
free-text diagram note:

```ts
interface ArchiNote {
  viewId: string;
  parentId: string | null;
  content: string | null;
  bounds: ArchiBounds | null;
  style: ArchiStyle | null;
  features: ArchiFeature[];
}
```

## Nested geometry

Diagram objects can contain diagram objects (groups, nested containers).
Bounds on a nested object are **relative to its own parent's origin** — see
[Geometry and nested coordinates](/core-concepts/geometry/) for how to
compute absolute coordinates.

## Example

```ts
// Every element shown in a view, resolved from its diagram objects
const view = model.views.find((v) => v.id === 'view-overview');
const elementIndex = new Map(model.elements.map((e) => [e.id, e]));

const shown = view
  ? view.diagramObjectIds
      .map((id) => model.diagramObjects.find((o) => o.id === id))
      .flatMap((o) => (o?.archimateElementId ? [elementIndex.get(o.archimateElementId)] : []))
      .filter(Boolean)
  : [];
```
