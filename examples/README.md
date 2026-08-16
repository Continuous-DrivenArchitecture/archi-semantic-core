# Examples

Consumption recipes for the parser's output — what to do with an
`ArchiModel` once `parseArchiModel` has produced it. No rendering, no
UI: these cover the ways downstream tooling actually uses the model.

Every example is covered by `test/examples.test.ts`, so the recipes stay
correct as the library evolves.

| File | Problem it solves | Key exports |
|---|---|---|
| [`basic-usage.ts`](./basic-usage.ts) | Reading a file (XML or zip) and querying the model | `parseArchiFile`, `indexModel`, `elementsOfType`, `relationshipsOf` |
| [`impact-analysis.ts`](./impact-analysis.ts) | Who depends on whom through the relationship graph | `downstreamImpact`, `upstreamDependents` |
| [`validation-gate.ts`](./validation-gate.ts) | Structural checks as a CI/pre-commit gate | `validationReport`, `assertValidModel`, `issuesByCode` |
| [`label-expressions.ts`](./label-expressions.ts) | Evaluating Archi Label Expressions for one view | `viewLabels` |

## 1. Reading and querying — `basic-usage.ts`

The library accepts both file variants Archi writes: plain XML and the
zip archive. `parseArchiFile` auto-detects the zip magic bytes (`PK`),
so callers never branch:

```ts
import { parseArchiFile, indexModel, elementsOfType } from './basic-usage';

const model = await parseArchiFile('model.archimate'); // xml or zip, both work

const index = indexModel(model); // O(1) lookups by id

for (const actor of elementsOfType(model, 'BusinessActor')) {
  console.log(actor.name, index.relationshipsById.size);
}
```

`indexModel` is the key habit for downstream tools: every
cross-reference in the model (`sourceId`, `targetId`,
`archimateElementId`, ...) is a plain string id, and the collections are
flat arrays — indexing once turns repeated lookups into O(1) map reads
(the same technique the parser itself uses internally).

## 2. Impact analysis — `impact-analysis.ts`

Walks the relationship graph transitively in both directions:

```ts
import { downstreamImpact, upstreamDependents } from './impact-analysis';

// everything CRM reaches, and everything that reaches CRM
const impact = downstreamImpact(model, 'element-crm');
const dependents = upstreamDependents(model, 'element-crm');
```

The traversal space includes relationship ids alongside element ids —
the domain model allows a relationship to be the source or target of
another relationship — so the returned nodes resolve their names and
semantic types from both collections.

## 3. Validation gate — `validation-gate.ts`

`validateArchiModel` checks structural integrity (missing/duplicate
ids, dangling references across all seven id-bearing collections). The
example wraps it into gate shapes:

```ts
import { assertValidModel, validationReport } from './validation-gate';

assertValidModel(model); // throws with a report when structurally invalid
console.log(validationReport(model)); // human-readable, or "structurally valid"
```

CI usage: run `assertValidModel` in a pre-commit hook or a pipeline step
and let the exit code gate merges — the report doubles as the failure
message. `issuesByCode` lets a gate differentiate failure severity
(e.g. fail on duplicate ids, warn on dangling references).

## 4. Label expressions — `label-expressions.ts`

Archi stores display templates as `<feature name="labelExpression">`
entries (e.g. `${name}\n${property:Owner}`). The library reads the raw
template and evaluates the core placeholder set against the model:

```ts
import { viewLabels } from './label-expressions';

for (const { id, kind, expression, label } of viewLabels(model, 'view-overview')) {
  console.log(kind, id, expression, '=>', label);
}
```

Unresolvable or reference-prefixed forms (`$parent{...}`,
`$source{...}`, ...) are left verbatim — the resolver never guesses.
Nodes without an expression fall back to their plain name/content.

## Notes

- All examples import from the source tree (`../src`) so they are
  type-checked and tested with the library, but they are **not**
  published — the npm package ships only `dist`.
- The recipes avoid adding any runtime dependencies beyond the library
  itself; node's `node:fs/promises` is the only import outside it.