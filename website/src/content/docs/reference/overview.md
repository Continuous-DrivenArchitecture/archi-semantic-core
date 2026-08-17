---
title: API Reference
description: The complete typed contract of @cda/archi-semantic-core.
---

This reference is **generated** from the TypeScript source by TypeDoc and
documents the exact public contract of `@cda/archi-semantic-core` — nothing
more, nothing less.

## Entrypoints

The package exposes two public subpaths:

- **Root** — `@cda/archi-semantic-core` (browser/bundler safe):
  `parseArchiModel`, `validateArchiModel`, `getLabelExpression`,
  `resolveLabelExpression`, and all model types.
- **`/archive`** — `@cda/archi-semantic-core/archive` (Node-only):
  `extractArchiModelXml`.

## Reading this reference

Every page in this group is produced from the JSDoc comments in the source.
A green page means the API is public and stable-tracking; the navigation
groups mirror the source layout:

- [Functions](/reference/generated/index/functions/parseArchiModel/) — the
  four core functions plus the Node-only archive function.
- [Types and interfaces](/reference/generated/index/interfaces/ArchiModel/) —
  the `ArchiModel` family: elements, relationships, views, geometry,
  styling, features, profiles, validation results.

## Version policy

The generated pages track the `develop` branch and reflect the *next*
release, not necessarily the latest published one. For the published API of
a specific version, use the npm artifact:

```sh
npm view @cda/archi-semantic-core
```

## Regenerating

The pages are produced by `npm run gen:api` inside `website/` and are
regenerated on every docs build and in the Pages deployment pipeline —
they are not committed to the repository. The source of truth is always
`src/index.ts` and `src/archive.ts`: regenerate, never hand-edit.
