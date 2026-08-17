---
title: Influence relationships
description: InfluenceRelationship.strength — Archi's native free-text modifier.
---

`InfluenceRelationship.strength` contains the native **free-text modifier**,
for example `"+"`, `"-"`, or any other text the modeler typed:

```ts
interface ArchiRelationship {
  strength: string | null;
}
```

## Defaults

The field is `null`:

- for every relationship type other than `InfluenceRelationship`;
- when the native value is blank or absent.

Unlike `accessType` (where Archi's default is a real value, `'Write'`), the
native default for `strength` is genuinely "no modifier set" — so `null` is
the faithful representation.

## Example

```ts
const influences = model.relationships.filter(
  (r) => r.type === 'InfluenceRelationship' && r.strength,
);

for (const rel of influences) {
  console.log(rel.sourceId, `[${rel.strength}]`, rel.targetId);
}
```
