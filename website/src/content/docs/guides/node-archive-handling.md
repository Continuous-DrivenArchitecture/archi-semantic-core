---
title: Node archive handling
description: A deep look at the .archimate archive pipeline and its error taxonomy.
---

## The pipeline

```text
bytes  →  signature check  →  plain XML: decode UTF-8 directly
                     │
                     └── zip: find model.xml entry → stream-decode → CRC-32 check → decode UTF-8
```

[`extractArchiModelXml`](/reference/generated/archive/functions/extractArchiModelXml/)
accepts raw bytes and returns the model XML text for **both** file shapes:

```ts
import { readFile } from 'node:fs/promises';
import { extractArchiModelXml } from '@cda/archi-semantic-core/archive';

const bytes = await readFile('Model.archimate'); // binary read — never text-decode first
const xml = extractArchiModelXml(bytes);
```

## Detection

The function peeks at the file signature:

- **PK (zip)** → archive path: localize `model.xml` in the central
  directory, inflate it, verify CRC-32, decode UTF-8.
- **anything else** → plain-XML path: decode the bytes directly as UTF-8.

## Compression methods

Only **Stored** (uncompressed) and **Deflate** entries are supported —
those are the only two methods Archi ever writes. Any other method throws.
The full `.archimate` archive never needs to be inflated: only the
`model.xml` entry is read, so the memory cost stays proportional to the
model's decoded size (see [Working with large models](/guides/large-models/)).

## Error taxonomy

| Condition | Behavior |
| --- | --- |
| Input looks like a zip but has no `model.xml` entry | throws |
| Entry uses a method other than Stored/Deflate | throws |
| CRC-32 mismatch on the decoded entry | throws |
| Truncated or corrupt zip structure | throws |

## Working with images

`extractArchiModelXml` returns XML only — image bytes stay in the archive.
`ArchiProfile.imagePath` (e.g. `"images/abc123.png"`) and the
`DiagramModelImageProvider` image paths are pointers: to extract a specific
binary, open the archive yourself and read the corresponding `images/`
entry.

## Platform boundary

The archive path uses Node's built-in `node:zlib` — this is why the function
lives in the `/archive` subpath and is not part of the browser-safe root
entrypoint. If you need browser-side archive handling, that is a separate
package concern, not this one's.
