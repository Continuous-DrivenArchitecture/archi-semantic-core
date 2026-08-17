---
title: Parse your first model
description: Read a .archimate file and inspect the resulting ArchiModel.
---

`parseArchiModel` accepts **XML text only**. Reading a file from disk, using
the browser File API, or fetching XML over the network is the caller's
responsibility — this keeps the package usable from Node.js, browser bundlers,
and tests without coupling it to a specific I/O environment.

## Minimal example

```ts
import {
  parseArchiModel,
  validateArchiModel,
} from '@cda/archi-semantic-core';

const model = parseArchiModel(xml);

console.log(model.elements);
console.log(model.relationships);
console.log(model.views);

console.log(model.elements[0].type);
// e.g. "ApplicationComponent", not "archimate:ApplicationComponent"

const { valid, errors } = validateArchiModel(model);
```

## Reading from disk

```ts
import { readFile } from 'node:fs/promises';
import { parseArchiModel } from '@cda/archi-semantic-core';

const xml = await readFile('MyModel.archimate', 'utf8');
const model = parseArchiModel(xml);
```

:::note[.archimate can also be a zip]

Archi saves a model as a zip archive — `model.xml` plus an `images/` entry
per embedded icon — whenever the model has embedded images. A zip archive is
**binary**, not text: reading it with a text decoder before detecting the
format corrupts it beyond recovery. If the file might be a zip, read raw
bytes and pass them through `extractArchiModelXml` first:

```ts
import { readFile } from 'node:fs/promises';
import { extractArchiModelXml } from '@cda/archi-semantic-core/archive';
import { parseArchiModel } from '@cda/archi-semantic-core';

const bytes = await readFile('MyModel.archimate'); // bytes, not text
const xml = extractArchiModelXml(bytes);            // handles plain XML or a zip
const model = parseArchiModel(xml);
```

See [Working with .archimate archives](/getting-started/archives/) for details.

:::

## What you get back

`parseArchiModel` returns an [`ArchiModel`](/reference/generated/index/interfaces/ArchiModel/)
whose collections are **flat arrays in source-XML order**:

| Collection | Contents |
| --- | --- |
| `folders` | The model tree (Business, Application, Relations, Views, custom folders). |
| `elements` | All semantic elements, any ArchiMate type. |
| `relationships` | All semantic relationships. |
| `views` | All diagram/view definitions. |
| `diagramObjects` | Visual nodes: diagram objects, groups, model references. |
| `diagramConnections` | Visual connections between diagram objects. |
| `notes` | Free-text diagram notes. |
| `profiles` | Specializations and generic Profiles declared at the model root. |

Cross-references between collections are plain string ids — look them up in
the relevant array, or build a `Map` keyed by `id` for repeated lookups
(see [Build lookup indexes](/guides/lookup-indexes/)).

## Error behavior

`parseArchiModel` throws when:

- the input is not a string;
- the XML is not well formed.

It does **not** throw for a semantically broken model (missing ids, dangling
references, unresolved Junction values) — use
[`validateArchiModel`](/getting-started/validate-model/) for structural checks.
