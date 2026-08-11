# archi-model-parser

[English](README.md) | [Español](README.es.md)

A TypeScript parser for native `.archimate` model files created by the
[Archi](https://www.archimatetool.com/) desktop editor.

`archi-model-parser` reads Archi's own native XML format and turns it into a
clean, well-typed `ArchiModel` — folders, elements, relationships, views,
diagram objects, diagram connections, and notes — without requiring callers
to understand the underlying XML structure.

```
.archimate XML  →  archi-model-parser  →  ArchiModel
```

## What this is not

This package parses Archi's **native** `.archimate` file format
(`xmlns:archimate="http://www.archimatetool.com/archimate"`) — the format
Archi itself reads and writes on disk.

It is **not** a parser or generator for the [ArchiMate® Model Exchange File
Format](https://www.opengroup.org/xsd/archimate/) ("Open Exchange"), and it
has no UI, editing, or rendering functionality. Those are different concerns
and may become separate packages later.

This project is not affiliated with or endorsed by Archi, the Archi Tool
project, or The Open Group.

## Install

```sh
npm install @continuousarchitecture/archi-model-parser
```

## Usage

```ts
import { parseArchiModel, validateArchiModel } from '@continuousarchitecture/archi-model-parser';

const model = parseArchiModel(xml); // xml: string — read it however you like (fs, fetch, File API, ...)

console.log(model.elements);
console.log(model.relationships);
console.log(model.views);

console.log(model.elements[0].type); // e.g. "ApplicationComponent" — a clean semantic type, not "archimate:ApplicationComponent"

const { valid, errors } = validateArchiModel(model);
```

`parseArchiModel` only accepts XML text — reading a file from disk, the
browser File API, or over the network is the caller's responsibility. This
keeps the library usable from Node.js, browsers, and tests alike.

## API

- `parseArchiModel(xml: string): ArchiModel` — parses Archi XML text into a
  semantic model. Throws if `xml` isn't a string or isn't well-formed XML.
- `validateArchiModel(model: ArchiModel): ArchiValidationResult` — checks the
  *structural* integrity of an already-parsed model: missing ids, duplicate
  ids, and dangling references between entities (e.g. a relationship whose
  source no longer exists). This is not an enterprise-architecture quality
  linter — a model can validate cleanly and still be a poor architecture.
- Types: `ArchiModel`, `ArchiModelMetadata`, `ArchiFolder`, `ArchiElement`,
  `ArchiRelationship`, `ArchiView`, `ArchiDiagramObject`,
  `ArchiDiagramConnection`, `ArchiNote`, `ArchiBounds`, `ArchiBendpoint`,
  `ArchiProperty`, `ArchiValidationResult`, `ArchiValidationIssue`.

Every element and relationship exposes both the raw `xsiType` (e.g.
`"archimate:BusinessActor"`) and a derived, namespace-prefix-stripped
`type` (e.g. `"BusinessActor"`) — generically, for any Archi type, not just
a fixed list of known ArchiMate concepts.

Cross-references between entities (a relationship's `sourceId`, a diagram
object's `archimateElementId`, ...) are plain string ids. Look them up in
the relevant array, or build a `Map` keyed by `id` if you need repeated
lookups — the library intentionally doesn't ship a lookup helper, to keep
its public surface small.

## What's covered

- Model metadata (id, name, version)
- Folders, including empty ones, with parent/child hierarchy and path
- ArchiMate elements and relationships of any type, generically
- Views, with their diagram objects, nested diagram objects, connections
  (including bendpoints), and notes
- Documentation and properties, including numeric XML character references
  (e.g. `&#xD;&#xA;`) decoded rather than left as literal text
- Non-`DiagramObject` visual containers (e.g. Archi's `Group`) — preserved
  generically rather than dropped

## What's out of scope

- ArchiMate Open Exchange File Format (import or export)
- Editing, mutation, or re-serializing a model back to XML
- Rendering, diagramming, or any UI
- Presentational-only attributes (fill/line/font colors, Archi's `<feature>`
  mechanism, etc.) — visual-styling concerns outside "structure and
  semantics"
- Archi Sketch and Canvas views: these live in the same "Views" folder but
  use a different, non-`archimate:` root type, so they parse as plain
  `ArchiElement`s rather than `ArchiView`s

## Requirements & module format

Node.js `^20.0.0 || ^22.0.0 || >=24.0.0`, or a modern browser bundler. The
package is published as ESM only (`"type": "module"`, no CommonJS build) —
`require('@continuousarchitecture/archi-model-parser')` is not supported.

## Development

```sh
git clone https://github.com/ContinuousArchitecture/archi-model-parser.git
cd archi-model-parser
npm install

npm run typecheck  # tsc --noEmit
npm run build       # emit dist/ (.js + .d.ts + source maps + declaration maps)
npm test            # vitest run
```

## License

MIT — see [LICENSE](./LICENSE).
