---
title: Validate a model
description: Structural validation of an ArchiModel with validateArchiModel.
---

`validateArchiModel` checks the **structural integrity** of an already parsed
model — missing/duplicate identifiers and dangling cross-references.

```ts
import { parseArchiModel, validateArchiModel } from '@cda/archi-semantic-core';

const model = parseArchiModel(xml);
const result = validateArchiModel(model);

console.log(result.valid); // boolean
for (const issue of result.errors) {
  console.log(issue.code, issue.message, issue.path);
}
```

## What it checks

The validator builds one global id set spanning all seven id-bearing
collections (folders, elements, relationships, views, diagram objects,
diagram connections, notes — Archi draws every id, semantic and visual, from
one shared pool), then checks:

| Code | Triggered by |
| --- | --- |
| `missing-id` | An entry has no `id` at all. |
| `duplicate-id` | The same `id` appears on more than one entry, anywhere in the model. |
| `broken-relationship-source` | A relationship's `sourceId` doesn't resolve to any known id. |
| `broken-relationship-target` | A relationship's `targetId` doesn't resolve to any known id. |
| `unrecognized-junction-type` | A `Junction` element's native `type` attribute isn't `""`/absent (And) or `"or"` (Or). |
| `broken-diagram-object-element` | A diagram object's `archimateElementId` doesn't resolve to any known id. |
| `broken-diagram-object-model-reference` | A `DiagramModelReference`'s `referencedModelId` doesn't resolve to any known id. |
| `broken-diagram-connection-relationship` | A connection's `archimateRelationshipId` doesn't resolve to any known id. |
| `broken-diagram-connection-source` | A connection's `sourceId` doesn't resolve to any known id. |
| `broken-diagram-connection-target` | A connection's `targetId` doesn't resolve to any known id. |

## Issue structure

Every [`ArchiValidationIssue`](/reference/generated/index/interfaces/ArchiValidationIssue/)
carries a `path` locator into the returned `ArchiModel` — not the original
XML — so a failure can be traced straight back to the field that failed:

```text
"relationships[rel-1].sourceId"
"diagramConnections[conn-7].targetId"
```

## What `{ valid: true }` means

`{ valid: true, errors: [] }` means every id-bearing entry has a unique,
non-empty id and every cross-reference this validator checks resolves. It
does **not** check:

- `ArchiBounds` completeness;
- `ArchiProfile`/`profiles` references;
- anything style- or feature-related.

## What it is not

This validator is **not** an enterprise-architecture quality linter. A model
can be structurally valid and still represent poor architecture. Quality
rules belong in a separate layer (for example, a governance tool built on
top of `ArchiModel`), not in the semantic core. Label expressions are not
evaluated by the validator either — resolution is a render-time concern, not
an integrity concern.

## In CI

The validator is a natural pipeline gate: run it in a pre-commit hook or a
CI step and let the exit code block merges. See
[Structural validation in CI](/guides/validation-in-ci/) for a full recipe
with human-readable reports.
