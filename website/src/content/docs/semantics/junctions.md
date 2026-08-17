---
title: Junctions
description: How AND/OR Junction identity is decoded from Archi's native type attribute.
---

Archi stores AND/OR Junction identity using a native `type` attribute that is
**separate** from the element's `xsi:type`.

For a Junction, the parser exposes both the interpreted semantic value and
the original native value:

```ts
type ArchiJunctionType = 'And' | 'Or';

interface ArchiElement {
  junctionType: ArchiJunctionType | null;
  rawJunctionType: string | null;
}
```

## Decoding rules

| Native Junction `type` | `junctionType` | `rawJunctionType` |
| --- | --- | --- |
| absent | `'And'` | `''` |
| `""` | `'And'` | `''` |
| `"or"` | `'Or'` | `'or'` |
| any other value | `null` | original value |

These match Archi's own `IJunction` constants (`AND_JUNCTION_TYPE = ""`,
`OR_JUNCTION_TYPE = "or"`), confirmed against Archi's source.

## Never guessed

Unknown native values are never guessed or discarded:

- `parseArchiModel` still succeeds — the model parses normally;
- `rawJunctionType` always keeps the original value, understood or not;
- `validateArchiModel` reports `unrecognized-junction-type` for a Junction
  whose native value cannot be resolved.

## Non-Junction elements

For every non-Junction element both fields are `null`:

```ts
junctionType === null
rawJunctionType === null
```
