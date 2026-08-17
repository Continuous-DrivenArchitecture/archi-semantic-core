---
title: Relationships
description: ArchiRelationship — sources, targets and relationship-specific native attributes.
---

An
[`ArchiRelationship`](/reference/generated/index/interfaces/ArchiRelationship/)
represents a semantic ArchiMate relationship — Serving, Assignment,
Realization, Access, Composition, Aggregation, Association, or any other type.
As with elements, coverage is generic.

## Endpoints

```ts
interface ArchiRelationship {
  sourceId: string; // id of the source element (occasionally another relationship)
  targetId: string; // id of the target element (occasionally another relationship)
}
```

The domain model allows a relationship to be the **source or target of
another relationship**. When traversing, resolve nodes from both the
`elements` and `relationships` collections (see
[Impact analysis](/guides/impact-analysis/)).

## Raw and semantic types

Exactly like elements, relationships expose both the verbatim `xsiType`
(e.g. `"archimate:ServingRelationship"`) and the stripped `type`
(e.g. `"ServingRelationship"`).

## Relationship-specific native attributes

Three relationship types carry native attributes that the parser decodes
semantically. For every other relationship type, the fields are `null`:

| Relationship | Field | Values | Default when absent |
| --- | --- | --- | --- |
| Access | `accessType` | `'Write' \| 'Read' \| 'Unspecified' \| 'ReadWrite'` | `'Write'` (Archi's native default) |
| Influence | `strength` | free text, e.g. `"+"`, `"-"` | `null` (no modifier set) |
| Association | `directed` | `boolean` | `false` |

Each attribute has a dedicated page:

- [Access relationships](/semantics/access-relationships/)
- [Influence relationships](/semantics/influence-relationships/)
- [Association relationships](/semantics/association-relationships/)

## Example

```ts
// All access relationships together with their resolved endpoints
const accessRelationships = model.relationships.filter(
  (r) => r.type === 'AccessRelationship',
);

const byId = new Map(model.elements.map((e) => [e.id, e]));

for (const rel of accessRelationships) {
  console.log(
    byId.get(rel.sourceId)?.name,
    rel.accessType,
    byId.get(rel.targetId)?.name,
  );
}
```
