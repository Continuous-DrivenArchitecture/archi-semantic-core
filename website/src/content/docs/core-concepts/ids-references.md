---
title: IDs and references
description: How identity and cross-references work across the model.
---

Every entity in an Archi model has a string id, and all cross-references are
plain string ids. Understanding this model is the key to using the library
well.

## One shared id pool

Archi draws every id — semantic and visual — from **one shared pool**:
folders, elements, relationships, views, diagram objects, diagram
connections and notes all share a namespace. A `duplicate-id` between any
two of them is a real integrity problem, and `validateArchiModel` detects
it.

## Cross-references are strings

The model never embeds object references. Instead:

| Field | Resolves against |
| --- | --- |
| `element.folderId` | `model.folders` |
| `relationship.sourceId` / `targetId` | `model.elements` (occasionally `model.relationships`) |
| `diagramObject.viewId` | `model.views` |
| `diagramObject.archimateElementId` | `model.elements` |
| `diagramObject.referencedModelId` | any `IDiagramModel` (view or sketch) |
| `diagramConnection.sourceId` / `targetId` | `model.diagramObjects` |
| `diagramConnection.archimateRelationshipId` | `model.relationships` |
| `element.profiles` / `relationship.profiles` | `model.profiles` |

## Precomputed containment indexes

The native XML only expresses containment through nesting (a `<child>` inside
a `<child>`, a `<folder>` inside a `<folder>`). `parseArchiModel` does one
extra O(n) derivation pass so every parent already has its children's ids
precomputed, in source order — no tree-walking required on the caller's side:

```ts
interface ArchiView {
  diagramObjectIds: string[];     // direct-child diagram objects (not nested)
  diagramConnectionIds: string[]; // every connection anywhere in the view, any nesting depth
  noteIds: string[];              // direct-child notes (not nested)
}

interface ArchiDiagramObject {
  childrenIds: string[];    // diagram objects nested directly inside this one
  connectionIds: string[];  // connections whose source is this diagram object
}

interface ArchiFolder {
  containedIds: string[];   // elements/relationships/views directly inside (not sub-folders)
}
```

Sub-folder hierarchy is expressed the other way around: walk each folder's
own `parentId` rather than looking for it in a parent's `containedIds`.

## No lookup helpers — by design

The package intentionally does **not** ship lookup helpers. Callers that
need repeated lookups build `Map<string, ...>` indexes appropriate to their
own workload — a one-time O(n) pass that turns every subsequent lookup into
O(1). See [Build lookup indexes](/guides/lookup-indexes/).
