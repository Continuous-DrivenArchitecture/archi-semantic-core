---
title: Installation
description: Requirements, install commands and module format for @cda/archi-semantic-core.
---

```sh
npm install @cda/archi-semantic-core
```

## Requirements

- **Node.js**: `^20.0.0 || ^22.0.0 || >=24.0.0` (see `engines` in `package.json`).
- The package is **ESM-only** (`"type": "module"`). CommonJS
  `require('@cda/archi-semantic-core')` is not supported.
- The package root has **no Node dependencies** and can be consumed by modern
  browser bundlers. The only archive-handling entrypoint
  (`@cda/archi-semantic-core/archive`) is Node-only.

## Two entrypoints

The package exposes two public subpaths:

```ts
// Browser/bundler safe — pure parsing, validation and label expressions.
import { parseArchiModel, validateArchiModel } from '@cda/archi-semantic-core';

// Node-only — .archimate zip-archive handling (uses node:zlib).
import { extractArchiModelXml } from '@cda/archi-semantic-core/archive';
```

The `/archive` subpath exists because unzipping uses Node's built-in `zlib`;
keeping it out of the root entrypoint preserves browser compatibility for the
core API. This is an intentional platform boundary — see
[Working with .archimate archives](/getting-started/archives/).

## TypeScript

Types ship inside the package (`dist/index.d.ts`), so no separate
`@types/*` package is needed. The package requires TypeScript's
`moduleResolution: "node16"`/`"nodenext"` or a bundler-aware resolution to
honor the `exports` map.

## Verifying the install

```ts
import { parseArchiModel } from '@cda/archi-semantic-core';

const model = parseArchiModel('<archimate:model xmlns:archimate="http://www.archimatetool.com/archimate"/>');
console.log(model.metadata.id);
```
