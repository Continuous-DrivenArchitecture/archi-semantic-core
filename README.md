# archi-model-parser

[English](README.md) | [Español](README.es.md)

A TypeScript parser for native `.archimate` model files created by the
[Archi](https://www.archimatetool.com/) desktop editor.

`archi-model-parser` reads Archi's native XML format and converts it into a
clean, well-typed `ArchiModel` containing folders, elements, relationships,
views, diagram objects, diagram connections, notes, properties, and the native
semantic details needed to work with the model without understanding Archi's
XML structure.

```text
.archimate XML  →  archi-model-parser  →  ArchiModel
```

## What this package is for

Use this package when you need to work programmatically with an Archi model
while keeping parsing independent from rendering, editing, quality rules, or
exchange-format conversion.

The parser focuses on two responsibilities:

- preserving Archi-native information that belongs to the semantic model;
- exposing that information through a small, typed TypeScript API.

It does not reinterpret the model for another standard.

## What this is not

This package parses Archi's **native** `.archimate` file format
(`xmlns:archimate="http://www.archimatetool.com/archimate"`) — the format Archi
itself reads and writes on disk.

It is **not** a parser or generator for the
[ArchiMate® Model Exchange File Format](https://www.opengroup.org/xsd/archimate/),
and it has no UI, editor, renderer, or diagram-routing engine.

Those are separate concerns and belong in separate packages.

This project is not affiliated with or endorsed by Archi, the Archi Tool
project, or The Open Group.

## Install

```sh
npm install @continuousarchitecture/archi-model-parser
```

## Usage

```ts
import {
  parseArchiModel,
  validateArchiModel,
} from '@continuousarchitecture/archi-model-parser';

const model = parseArchiModel(xml);

console.log(model.elements);
console.log(model.relationships);
console.log(model.views);

console.log(model.elements[0].type);
// e.g. "ApplicationComponent", not "archimate:ApplicationComponent"

const { valid, errors } = validateArchiModel(model);
```

`parseArchiModel` accepts XML text only. Reading a file from disk, using the
browser File API, or fetching XML over the network is the caller's
responsibility. This keeps the package usable from Node.js, browser bundlers,
and tests without coupling it to a specific I/O environment.

## API

### `parseArchiModel(xml: string): ArchiModel`

Parses native Archi XML text into a semantic model.

It throws when the input is not a string or the XML is not well formed.

### `validateArchiModel(model: ArchiModel): ArchiValidationResult`

Checks the structural integrity of an already parsed model, including:

- missing identifiers;
- duplicate identifiers;
- dangling references between entities;
- unresolved native Junction type values.

This validator is not an enterprise-architecture quality linter. A model can
be structurally valid and still represent poor architecture.

### Public types

The package exports:

- `ArchiModel`
- `ArchiModelMetadata`
- `ArchiFolder`
- `ArchiElement`
- `ArchiJunctionType`
- `ArchiRelationship`
- `ArchiAccessType`
- `ArchiView`
- `ArchiDiagramObject`
- `ArchiDiagramConnection`
- `ArchiNote`
- `ArchiBounds`
- `ArchiBendpoint`
- `ArchiProperty`
- `ArchiValidationResult`
- `ArchiValidationIssue`

## Raw and semantic types

Elements and relationships expose both:

- `xsiType`: the native XML value, for example
  `"archimate:BusinessActor"`;
- `type`: the namespace-prefix-stripped semantic value, for example
  `"BusinessActor"`.

This derivation is generic. The parser does not require every possible Archi
type to be hard-coded in advance.

Cross-references such as `sourceId`, `targetId`, `archimateElementId`,
`referencedModelId`, and diagram connection endpoints are plain string
identifiers.

The package intentionally does not ship lookup helpers. Callers that need
repeated lookups can build `Map<string, ...>` indexes appropriate to their own
workload.

## Junction semantics

Archi stores AND/OR Junction identity using a native `type` attribute that is
separate from the element's `xsi:type`.

For a Junction, the parser exposes both the interpreted semantic value and the
original native value:

```ts
type ArchiJunctionType = 'And' | 'Or';

interface ArchiElement {
  junctionType: ArchiJunctionType | null;
  rawJunctionType: string | null;
}
```

The decoding rules are:

| Native Junction `type` | `junctionType` | `rawJunctionType` |
| --- | --- | --- |
| absent | `'And'` | `''` |
| `""` | `'And'` | `''` |
| `"or"` | `'Or'` | `'or'` |
| any other value | `null` | original value |

Unknown native values are never guessed or discarded.

`parseArchiModel` still succeeds, while `validateArchiModel` reports
`unrecognized-junction-type` for a Junction whose native value cannot be
resolved.

For every non-Junction element:

```ts
junctionType === null
rawJunctionType === null
```

## Relationship-specific native attributes

### Access

`AccessRelationship.accessType` is exposed as:

```ts
'Write' | 'Read' | 'Unspecified' | 'ReadWrite'
```

It is decoded from Archi's native `0`-`3` representation.

For an `AccessRelationship`, the field is always resolved to a value. When the
native attribute is absent, the parser uses Archi's native default:
`'Write'`.

For every other relationship type, `accessType` is `null`.

### Influence

`InfluenceRelationship.strength` contains the native free-text modifier, for
example `"+"`.

It is `null` for every other relationship type and also when the native value
is blank or absent.

### Association

`AssociationRelationship.directed` is resolved to a boolean for association
relationships, using `false` as the native default when the attribute is
absent.

For every other relationship type, `directed` is `null`.

## What's covered

- Model metadata: id, name, native version, `purpose`, and model-level properties.
- Folders, including empty folders, hierarchy, path, documentation, and properties.
- ArchiMate elements and relationships preserved generically.
- Junction AND/OR native semantics.
- Relationship-specific Access, Influence, and Association attributes.
- Views with native `viewpoint`, nested diagram objects, notes, connections, and bendpoints.
- `DiagramModelReference` nodes, including `referencedModelId`.
- Generic visual containers such as Archi `Group`.
- Documentation and properties.
- Numeric XML character references such as `&#xD;&#xA;`, decoded into text.

Collections preserve source XML order.

## What's out of scope

- ArchiMate Model Exchange File Format import or export.
- Editing or mutating a model.
- Serializing an `ArchiModel` back to native `.archimate` XML.
- Rendering, diagramming, automatic routing, or UI.
- Presentational-only attributes such as fill colors, line colors, fonts, and
  Archi's `<feature>` styling mechanism.
- Archi Sketch and Canvas views as semantic `ArchiView`s. These use
  non-`archimate:` root types and are preserved generically rather than
  reinterpreted as ArchiMate views.
- Concept specialization / profiles. Their native serialization remains
  deliberately unsupported until it can be represented from confirmed native
  source behavior without guessing.

## Requirements and module format

Node.js:

```text
^20.0.0 || ^22.0.0 || >=24.0.0
```

The package is ESM-only:

```json
{
  "type": "module"
}
```

CommonJS `require('@continuousarchitecture/archi-model-parser')` is not
supported.

A modern browser bundler can also consume the package.

## Development

```sh
git clone https://github.com/ContinuousArchitecture/archi-model-parser.git
cd archi-model-parser
npm install

npm run typecheck
npm run build
npm test
npm pack --dry-run
```

## Design principle

`archi-model-parser` should understand **Archi's native model semantics**.

It should not know how another format, renderer, editor, or exchange standard
chooses to represent those semantics.

That boundary keeps the parser reusable as a foundation for other
ContinuousArchitecture tooling.

## License

MIT — see [LICENSE](./LICENSE).
