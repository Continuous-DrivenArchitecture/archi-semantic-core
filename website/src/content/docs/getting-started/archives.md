---
title: Working with .archimate archives
description: The zip-archive variant of .archimate files and the Node-only /archive subpath.
---

Archi can save a model in two shapes, both with the `.archimate` extension:

- **plain XML** — the model as a single XML text file;
- **zip archive** — a `model.xml` plus an `images/` entry per embedded custom
  icon, zipped together under the same extension. Archi uses this shape
  automatically whenever the model has embedded images and is not stored in a
  git-tracked folder (inside git folders, Archi's `ArchiveManager` prefers a
  plain-XML + sibling `images/`-folder layout so image binaries stay
  diff-friendly).

A zip-format `.archimate` file is **binary** — reading it with a text decoder
before detecting the format would corrupt it beyond recovery.

## `extractArchiModelXml`

The Node-only function
[`extractArchiModelXml`](/reference/generated/archive/functions/extractArchiModelXml/)
accepts raw file bytes and returns the model XML text whether the input is
plain XML or a zip archive:

```ts
import { readFileSync } from 'node:fs';
import { extractArchiModelXml } from '@cda/archi-semantic-core/archive';
import { parseArchiModel } from '@cda/archi-semantic-core';

const bytes = readFileSync('MyModel.archimate'); // read as bytes, not text
const xml = extractArchiModelXml(bytes);          // plain XML or zip, both work
const model = parseArchiModel(xml);
```

It detects the zip signature and either decodes the input directly as UTF-8
text (plain XML) or unzips it and decodes the `model.xml` entry (zip archive)
— using Node's built-in `zlib`, with no added dependency.

## Why `/archive` is a separate subpath

`extractArchiModelXml` depends on Node's `node:zlib`. The package root stays
browser/bundler friendly by **not** importing it, so the zip-handling
function lives in a dedicated subpath:

```ts
// Browser-safe core
import { parseArchiModel, validateArchiModel } from '@cda/archi-semantic-core';

// Node-only archive handling
import { extractArchiModelXml } from '@cda/archi-semantic-core/archive';
```

This is an intentional public API boundary, not an afterthought: bundlers
that consume the root entrypoint never see a Node built-in.

## Embedded images

`extractArchiModelXml` does **not** extract image bytes. If you need to
locate images yourself, treat the references Archi exposes — such as
`ArchiProfile.imagePath` (`"images/abc123.png"`) or a
`DiagramModelImageProvider`'s image path — as pointers into the archive's
`images/` entries.

## Error behavior

`extractArchiModelXml` throws when the input:

- looks like a zip but has no `model.xml` entry;
- uses a compression method other than Stored/Deflate (Archi never writes
  anything else);
- fails its CRC-32 integrity check;
- is a truncated or corrupt zip.

## See also

- [Node archive handling](/guides/node-archive-handling/) — deeper guide on
  the archive pipeline and error taxonomy.
