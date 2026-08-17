---
title: Association relationships
description: AssociationRelationship.directed — Archi's native directedness boolean.
---

`AssociationRelationship.directed` is resolved to a boolean for association
relationships:

```ts
interface ArchiRelationship {
  directed: boolean | null;
}
```

## Defaults

- For an `AssociationRelationship`, the field is **always resolved to a
  boolean** — `false` is the native default when the attribute is absent
  (Archi's own type default).
- For every other relationship type, `directed` is `null`.

## Example

```ts
const undirected = model.relationships.filter(
  (r) => r.type === 'AssociationRelationship' && r.directed === false,
);

console.log('undirected associations:', undirected.length);
```
