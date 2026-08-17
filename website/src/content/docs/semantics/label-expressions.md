---
title: Label expressions
description: Read and resolve Archi's ${...} label expressions on diagram objects, connections and notes.
---

Archi lets a label be a **Label Expression** — a template evaluated at render
time, stored in an object's `features` under the `labelExpression` key:

```text
${name}${newline}${property:First}
```

## `getLabelExpression`

[`getLabelExpression`](/reference/generated/index/functions/getLabelExpression/)
returns the **raw** expression string from an object's
[`ArchiFeature`](/reference/generated/index/interfaces/ArchiFeature/) list,
or `null` when none is set:

```ts
import { getLabelExpression } from '@cda/archi-semantic-core';

const expr = getLabelExpression(diagramObject.features);
console.log(expr); // "${name}\n${property:First}" or null
```

If you only need to *detect* whether a label expression exists, prefer this
over `resolveLabelExpression` — no model access is needed.

## `resolveLabelExpression`

[`resolveLabelExpression`](/reference/generated/index/functions/resolveLabelExpression/)
evaluates the expression against the model and returns the label text:

```ts
import { resolveLabelExpression } from '@cda/archi-semantic-core';

const label = resolveLabelExpression(model, diagramObject);
console.log(label);
```

The `node` argument is a **diagram object, diagram connection, or note** —
the visual objects that carry labels. Returns `null` when there is no
`labelExpression` feature (nothing to evaluate — distinct from an empty
string result).

## Supported placeholders

The resolver supports the "core" placeholders that resolve from the object
itself:

| Placeholder | Resolves to |
| --- | --- |
| `${name}` | the object's name |
| `${documentation}` | the object's documentation |
| `${content}` | a note's content |
| `${type}` | the object's type |
| `${strength}` | an influence relationship's strength |
| `${accessType}` | an access relationship's access type |
| `${property:key}` | a property value by key |
| `${properties}`, `${propertiesvalues}` | joined property lists |
| `${properties:separator:key}` | property lists with a separator |
| `${wordwrap:count:expression}` | word-wrapped text |
| `${if:cond:val}` / `${if:cond:val1:val2}` / `${nvl:cond:val}` | conditional and default-value helpers |

Expressions **nested inside another expression's arguments** are supported.

## What stays unresolved

Two groups are intentionally left **verbatim, unresolved** in the output:

- the **Reference Prefix** forms — `${parent{...}}`, `${source{...}}`,
  `${model{...}}`, `${<relationship>:source{...}}` and similar — because
  resolving them requires traversing the model graph (parent view/folder,
  connected relationships) rather than reading the object itself;
- `${specialization}` and `${viewpoint}` — not yet captured by the parser.

If your models rely on these, treat the unresolved placeholder in the
output as a signal rather than a finished label.
