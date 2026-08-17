---
title: Access relationships
description: AccessRelationship.accessType decoded from Archi's native 0-3 representation.
---

`AccessRelationship.accessType` is exposed as:

```ts
type ArchiAccessType = 'Write' | 'Read' | 'Unspecified' | 'ReadWrite';
```

It is decoded from Archi's native `0`–`3` attribute representation. The
enumeration follows Archi's own `IAccessRelationship` constants
(`WRITE_ACCESS`, `READ_ACCESS`, `UNSPECIFIED_ACCESS`, `READ_WRITE_ACCESS`)
rather than the ArchiMate Open Exchange `AccessTypeEnum` vocabulary — which
uses `"Access"` for the unspecified case. That is a different format's
naming, not this one's.

## Defaults

For an `AccessRelationship`, the field is **always resolved to a value**:

- when the native attribute is present, it is decoded;
- when absent, the parser uses Archi's native default: `'Write'`.

For every other relationship type, `accessType` is `null`.

## Example

```ts
const access = model.relationships.filter(
  (r) => r.type === 'AccessRelationship',
);

for (const rel of access) {
  console.log(rel.sourceId, '->', rel.accessType, '->', rel.targetId);
}
```
