# archi-semantic-core

[![npm version](./.github/assets/badges/version.svg?v=0.3.1)](https://www.npmjs.com/package/@cda/archi-semantic-core) [![License](./.github/assets/badges/license.svg)](./LICENSE)

[![English](./.github/assets/badges/lang-en-active.svg)](README.md) [![Deutsch](./.github/assets/badges/lang-de.svg)](README.de.md) [![Español](./.github/assets/badges/lang-es.svg)](README.es.md) [![Français](./.github/assets/badges/lang-fr.svg)](README.fr.md) [![Nederlands](./.github/assets/badges/lang-nl.svg)](README.nl.md) [![Português](./.github/assets/badges/lang-pt.svg)](README.pt.md) [![中文](./.github/assets/badges/lang-zh.svg)](README.zh.md)

A TypeScript parser for native `.archimate` model files created by the
[Archi](https://www.archimatetool.com/) desktop editor.

`archi-semantic-core` reads Archi's native XML format and converts it into a
clean, well-typed `ArchiModel` containing folders, elements, relationships,
views, diagram objects, diagram connections, notes, properties, visual
styling, Specializations/Profiles, and the native semantic details needed to
work with the model without understanding Archi's XML structure. It also
reads the zip-archive variant of the `.archimate` file format.

```text
.archimate XML  →  archi-semantic-core  →  ArchiModel
```

## Table of Contents

- [What this package is for](#what-this-package-is-for)
- [What this is not](#what-this-is-not)
- [Where this fits](#where-this-fits)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
  - [`parseArchiModel`](#parsearchimodelxml-string-archimodel)
  - [`validateArchiModel`](#validatearchimodelmodel-archimodel-archivalidationresult)
  - [`extractArchiModelXml`](#extractarchimodelxmlbytes-uint8array-string)
  - [`getLabelExpression`](#getlabelexpressionfeatures-archifeature-string--null)
  - [`resolveLabelExpression`](#resolvelabelexpressionmodel-archimodel-node-archidiagramobject--archidiagramconnection--archinote-string--null)
  - [Public types](#public-types)
- [Raw and semantic types](#raw-and-semantic-types)
- [Automatic containment and connection indexes](#automatic-containment-and-connection-indexes)
- [Geometry: bounds and bendpoints](#geometry-bounds-and-bendpoints)
- [Junction semantics](#junction-semantics)
- [Relationship-specific native attributes](#relationship-specific-native-attributes)
  - [Access](#access)
  - [Influence](#influence)
  - [Association](#association)
- [Visual styling](#visual-styling)
- [Native `<feature>` entries and Label Expressions](#native-feature-entries-and-label-expressions)
- [Specializations and Profiles](#specializations-and-profiles)
- [Zip-archive `.archimate` files](#zip-archive-archimate-files)
- [Validation](#validation)
- [Performance](#performance)
- [Examples](#examples)
- [What's covered](#whats-covered)
- [What's out of scope](#whats-out-of-scope)
- [Requirements and module format](#requirements-and-module-format)
- [Development](#development)
- [Design principle](#design-principle)
- [Found this useful?](#found-this-useful)
- [License](#license)

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

## Where this fits

`archi-semantic-core` is the first cornerstone of the Continuous-DrivenArchitecture
ecosystem: it is a faithful, typed semantic representation of how a design is built
in the Archi editor. Downstream tools consume that representation for impact
analysis, drift detection, and architecture evolution — layers that may build a
navigable graph on top, instead of this package trying to be one itself.

## Install

```sh
npm install @cda/archi-semantic-core
```

## Usage

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

`parseArchiModel` accepts XML text only. Reading a file from disk, using the
browser File API, or fetching XML over the network is the caller's
responsibility. This keeps the package usable from Node.js, browser bundlers,
and tests without coupling it to a specific I/O environment.

Archi can also save a `.archimate` file as a zip archive (it does this
automatically whenever the model has embedded images). Read the raw bytes and
pass them through `extractArchiModelXml` first if the file might be either
shape:

```ts
import { readFileSync } from 'node:fs';
import { extractArchiModelXml } from '@cda/archi-semantic-core/archive';
import { parseArchiModel } from '@cda/archi-semantic-core';

const bytes = readFileSync('MyModel.archimate');
const xml = extractArchiModelXml(bytes); // handles plain XML or a zip archive
const model = parseArchiModel(xml);
```

## API

### `parseArchiModel(xml: string): ArchiModel`

Parses native Archi XML text into a semantic model.

It throws when the input is not a string or the XML is not well formed.

### `validateArchiModel(model: ArchiModel): ArchiValidationResult`

Checks the structural integrity of an already parsed model — missing/duplicate
identifiers, dangling references, unresolved native Junction values. See
[Validation](#validation) for the full list of checks.

This validator is not an enterprise-architecture quality linter. A model can
be structurally valid and still represent poor architecture.

### `extractArchiModelXml(bytes: Uint8Array): string`

> Node-only, exported from the `@cda/archi-semantic-core/archive` subpath
> (uses `node:zlib`; the root entrypoint stays browser-safe).

Returns the model XML text from raw `.archimate` file bytes, whether the file
is plain XML or Archi's zip-archive variant (`model.xml` plus an `images/`
entry per embedded custom icon, zipped together — see
[Zip-archive `.archimate` files](#zip-archive-archimate-files)). Pass the
result to `parseArchiModel`.

Throws if the input looks like a zip but has no `model.xml` entry, uses a
compression method other than Stored/Deflate (Archi never writes anything
else), fails its CRC-32 integrity check, or is a truncated/corrupt zip.

### `getLabelExpression(features: ArchiFeature[]): string | null`

Returns the raw Label Expression template string (e.g.
`"${name}\n${property:First}"`) from a diagram object/connection/note's
`features`, or `null` if none is set. See
[Native `<feature>` entries and Label Expressions](#native-feature-entries-and-label-expressions).

### `resolveLabelExpression(model: ArchiModel, node: ArchiDiagramObject | ArchiDiagramConnection | ArchiNote): string | null`

Evaluates a Label Expression against the model, resolving `${name}`,
`${documentation}`, `${property:key}`, `${properties}`, `${propertiesvalues}`,
`${properties:separator:key}`, `${content}`, `${type}`, `${strength}`,
`${accessType}`, `${wordwrap:count:expression}`, `${if:...}`, and `${nvl:...}`
— including expressions nested inside another expression's arguments. Returns
`null` when the object has no `labelExpression` feature at all.

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
- `ArchiStyle`
- `ArchiFontStyle`
- `ArchiFeature`
- `ArchiProfile`
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

## Automatic containment and connection indexes

The native XML only expresses containment through nesting (a `<child>` inside
a `<child>`, a `<folder>` inside a `<folder>`). `parseArchiModel` does one
extra O(n) derivation pass so every parent already has its children's ids
precomputed, in source order — no tree-walking required on the caller's side:

```ts
interface ArchiView {
  diagramObjectIds: string[];     // direct-child diagram objects (not nested)
  diagramConnectionIds: string[]; // every connection anywhere in the view, any nesting depth
  noteIds: string[];              // direct-child notes (not nested)
}

interface ArchiDiagramObject {
  childrenIds: string[];    // diagram objects nested directly inside this one
  connectionIds: string[];  // connections whose source is this diagram object
}

interface ArchiFolder {
  containedIds: string[];   // elements/relationships/views directly inside (not sub-folders)
}
```

Sub-folder hierarchy is expressed the other way around: walk each folder's own
`parentId` rather than looking for it in a parent's `containedIds`.

## Geometry: bounds and bendpoints

```ts
interface ArchiBounds {
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

interface ArchiBendpoint {
  startX: number | null;
  startY: number | null;
  endX: number | null;
  endY: number | null;
}
```

**`ArchiBounds.x`/`.y` on a nested diagram object or note are relative to its
own parent's origin, not absolute canvas coordinates** — this is how Archi
itself stores nested geometry natively. A diagram object with `parentId:
'group-1'` and `bounds: { x: 10, y: 10, ... }` sits 10px right and 10px down
from `group-1`'s own top-left corner, not the view's. To get absolute
coordinates, sum `x`/`y` up the `parentId` chain to the root. Root-level
objects (`parentId === null`) already have view-relative (i.e. absolute)
coordinates.

Any of the four `ArchiBounds` fields can independently be `null` — the
parser never fabricates a `0` for a missing/non-numeric `x`/`y`/`width`/
`height` attribute. `validateArchiModel` does not check bounds completeness;
treat a `null` field as "cannot be positioned" the way `archi-open-exchange`'s
mapper does.

`ArchiBendpoint` values are per-Archi's own native representation: each
bendpoint stores its own start/end pair rather than a single midpoint, which
lets a bent connection curve be reconstructed without additional geometry
logic.

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

## Visual styling

Diagram objects, connections, and notes expose their native fill/line/font
colors and font, when set:

```ts
interface ArchiStyle {
  fillColor: string | null;   // e.g. "#ffffff"
  lineColor: string | null;
  fontColor: string | null;
  font: string | null;        // verbatim native SWT FontData string
  fontName: string | null;    // decoded from `font`
  fontSize: number | null;    // decoded from `font`, in points
  fontStyle: ArchiFontStyle | null; // { bold, italic }, decoded from `font`
  lineWidth: number | null;   // pixels
  alpha: number | null;       // fill opacity, 0-255; always null on a Connection (no fill)
}
```

`node.style` is `null` — not an object with every field `null` — when none of
`fillColor`/`lineColor`/`fontColor`/`font`/`lineWidth`/`alpha` are set, so
callers can cheaply tell "no styling recorded" from "styling recorded, all
unset".

`fontName`/`fontSize`/`fontStyle` are decoded from Archi's own SWT
`FontData.toString()` serialization (e.g.
`"1|Segoe UI|9.0|1|WINDOWS|...|700|..."`: format-version | name | size(pt) |
style-bitmask | platform | ...native font data). Only the first four fields
are decoded; a string that isn't in this shape leaves those three fields
`null` while still preserving the raw `font` string — never guessed.

A `DiagramObject`'s native alternate figure/icon selector is also exposed
verbatim, uninterpreted (its meaning is figure-specific, decided by Archi's
own UI per element type):

```ts
interface ArchiDiagramObject {
  figureType: string | null; // raw native `type` attribute, e.g. "0" or "1"
}
```

An `ArchiView`'s native connection-routing code is exposed the same way —
verbatim, uninterpreted, since Archi's own numbering for it has already
changed once (a `1` value was reserved and dropped in Archi's source):

```ts
interface ArchiView {
  connectionRouterType: number | null; // raw native attribute: 0 = manual bendpoints, 2 = orthogonal
}
```

## Native `<feature>` entries and Label Expressions

Diagram objects, connections, and notes expose Archi's generic `<feature
name="..." value="..."/>` extensibility entries verbatim:

```ts
interface ArchiFeature {
  name: string;
  value: string;
}
```

The best-known use of this mechanism is
[Label Expressions](https://github.com/archimatetool/archi/wiki/Label-Expressions)
(`name="labelExpression"`), which customize what text a diagram object shows
instead of the plain element name. Two functions work with it:

```ts
import { getLabelExpression, resolveLabelExpression } from '@cda/archi-semantic-core';

const raw = getLabelExpression(node.features);
// "${name}\n${property:First}" — the template, unevaluated

const resolved = resolveLabelExpression(model, node);
// "Shared Component\nOne" — evaluated against the model
```

`resolveLabelExpression` supports the wiki's "core" placeholders — the ones
resolvable from the object itself, with no model-graph traversal: `${name}`,
`${documentation}`, `${content}` (Notes), `${type}`, `${strength}`,
`${accessType}` (Access/Influence connections), `${property:key}`,
`${properties}`, `${propertiesvalues}`, `${properties:separator:key}`,
`${wordwrap:count:expression}`, `${if:cond:val}`, `${if:cond:val1:val2}`, and
`${nvl:cond:val}` — including expressions nested inside another expression's
own arguments (e.g. `${if:${property:key}:<<${property:key}>>}`).

It does **not** support the wiki's "Reference Prefix" forms (`$parent{...}`,
`$source{...}`, `$model{...}`, `$<relationship>:source{...}`, etc.), which
need to traverse the model graph (parent view/folder, connected
relationships) rather than just read the object itself. Those are left
verbatim, unresolved, in the output — never silently dropped. `${specialization}`
and `${viewpoint}` are likewise left unresolved.

For a `DiagramObject` backed by an `archimateElementId`, placeholders resolve
against the underlying `ArchiElement`. For a `DiagramConnection` backed by an
`archimateRelationshipId`, they resolve against the underlying
`ArchiRelationship`. For a Group/`DiagramModelReference` (no underlying
element) only `${name}`/`${type}` resolve, from the visual object's own
`name`/`xsiType`; `${documentation}`/`${property:*}` resolve to an empty
string in that case.

## Specializations and Profiles

Archi's Specializations (named sub-types shown in the UI as `<<Name>>`) and
generic Profiles (reusable named sets of properties) are both native
`<profile>` elements at the model root, differing only in one boolean:

```ts
interface ArchiProfile {
  id: string;
  name: string | null;
  conceptType: string | null;   // the ArchiMate type this restricts to, if any
  specialization: boolean;      // true = Specialization, false = generic Profile
  imagePath: string | null;     // custom icon reference, not resolved to bytes
}

interface ArchiModel {
  profiles: ArchiProfile[];
}
```

`specialization` defaults to `true` (Archi's own documented EMF default) when
the native attribute is absent — matching how EMF/XMI serialization omits
attributes that equal their declared default value.

Elements and relationships reference profiles by id:

```ts
interface ArchiElement {
  profiles: string[]; // ArchiProfile.id values; empty when none are set
}

interface ArchiRelationship {
  profiles: string[]; // same shape — Specializations apply to relationships too
}
```

This is confirmed against Archi's own source (`archimate.ecore`'s `Profile`
EClass and `IProfile.java`), not only observed sample files.

## Zip-archive `.archimate` files

Archi automatically saves a model as a zip archive — `model.xml` plus an
`images/` entry per embedded custom icon, all under the same `.archimate`
extension — whenever the model has embedded images and isn't stored in a
git-tracked folder (Archi's own `ArchiveManager` prefers a plain-XML +
sibling-`images/`-folder layout inside git folders, so image binaries stay
diff-friendly). A zip-format `.archimate` file is binary, not text — reading
it with a text decoder before detecting the format would corrupt it beyond
recovery.

```ts
import { readFileSync } from 'node:fs';
import { extractArchiModelXml } from '@cda/archi-semantic-core/archive';
import { parseArchiModel } from '@cda/archi-semantic-core';

const bytes = readFileSync('MyModel.archimate'); // read as bytes, not text
const xml = extractArchiModelXml(bytes);
const model = parseArchiModel(xml);
```

`extractArchiModelXml` detects the zip signature, and either decodes the
input directly as UTF-8 text (plain XML) or unzips it and decodes the
`model.xml` entry (zip archive) — using Node's built-in `zlib`, no added
dependency. Embedded images are not extracted; use `ArchiProfile.imagePath`
or a `DiagramModelImageProvider`'s image path only as a reference into the
archive's `images/` entries if you need to locate them yourself.

## Validation

`validateArchiModel` builds one global id set spanning all seven id-bearing
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

Every issue carries a `path` locator (e.g. `"relationships[rel-1].sourceId"`)
into the returned `ArchiModel` — not the original XML — so it can be traced
straight back to the field that failed.

`{ valid: true, errors: [] }` means every id-bearing entry has a unique,
non-empty id and every cross-reference this validator checks resolves — it
does not check `ArchiBounds` completeness, `ArchiProfile`/`profiles`
references, or anything style/feature-related.

## Performance

Parsing and validation scale **linearly** with model size: ids and
cross-references are indexed once in single-pass `Map`/`Set` passes, so no
code path re-scans `model.elements`/`model.relationships` per item.
`resolveLabelExpression` is **O(1) per node** — its element/relationship
lookups go through per-model cached `Map` indexes, so resolving label
expressions for every diagram object in a large model stays cheap.

A performance regression test (`test/performance.test.ts`) enforces this:
it parses and validates a synthetic model of 20k elements, 20k
relationships, and 20k diagram objects within a fixed time budget, and
checks that parse time grows linearly when the model size doubles.

## Examples

Ready-to-copy consumption recipes for the parsed model — reading
`.archimate` files (XML or zip), indexing and querying, impact analysis
over the relationship graph, validation as a pipeline gate, and label
expression resolution. See [examples/README.md](examples/README.md).

## What's covered

- Model metadata: id, name, native version, `purpose`, and model-level properties.
- Folders, including empty folders, hierarchy, path, documentation, and properties.
- ArchiMate elements and relationships preserved generically.
- Precomputed containment/connection id indexes (`childrenIds`,
  `connectionIds`, `diagramObjectIds`, `diagramConnectionIds`, `noteIds`,
  `containedIds`) — no tree-walking required to find what's inside what.
- Junction AND/OR native semantics.
- Relationship-specific Access, Influence, and Association attributes.
- Views with native `viewpoint`, `connectionRouterType`, nested diagram
  objects, notes, connections, and bendpoints.
- `DiagramModelReference` nodes, including `referencedModelId`.
- Generic visual containers such as Archi `Group`, including their own
  `documentation` and native alternate figure/icon selector (`figureType`).
- Documentation and properties.
- Visual styling: fill/line/font colors, font name/size/bold/italic, line
  width, fill opacity (`alpha`).
- Archi's generic `<feature>` extensibility entries, and Label Expressions
  built on top of them (raw template string and evaluated result for the
  "core" placeholder set).
- Specializations and generic Profiles, and which elements/relationships
  reference them.
- Both `.archimate` file shapes: plain XML, and Archi's zip-archive variant.
- Structural validation (`validateArchiModel`): missing/duplicate ids and
  dangling references across all seven id-bearing collections — see
  [Validation](#validation).
- Numeric XML character references such as `&#xD;&#xA;`, decoded into text.

Collections preserve source XML order.

## What's out of scope

- ArchiMate Model Exchange File Format import or export.
- Editing or mutating a model.
- Serializing an `ArchiModel` back to native `.archimate` XML.
- Rendering, diagramming, automatic routing, or UI.
- Extracting embedded image *bytes* from a zip-archive `.archimate` file —
  only the `imagePath` reference string is preserved.
- Label Expressions' "Reference Prefix" forms (`$parent{...}`, `$source{...}`,
  `$model{...}`, `$<relationship>:source{...}`, etc.), which need to traverse
  the model graph rather than read a single object. `${specialization}` and
  `${viewpoint}` placeholders are likewise not evaluated.
- Archi Sketch and Canvas views as semantic `ArchiView`s. These use
  non-`archimate:` root types and are preserved generically rather than
  reinterpreted as ArchiMate views.

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

CommonJS `require('@cda/archi-semantic-core')` is not
supported.

A modern browser bundler can also consume the package.

## Development

```sh
git clone https://github.com/Continuous-DrivenArchitecture/archi-semantic-core.git
cd archi-semantic-core
npm install

npm run typecheck
npm run build
npm test
npm pack --dry-run
```

## Design principle

`archi-semantic-core` should understand **Archi's native model semantics**.

It should not know how another format, renderer, editor, or exchange standard
chooses to represent those semantics.

That boundary keeps the parser reusable as a foundation for other
Continuous-DrivenArchitecture tooling.

## Found this useful?

If `archi-semantic-core` saved you from having to reverse-engineer Archi's
native `.archimate` format yourself, consider giving the project a ⭐. It
helps other developers working with Archi discover it.

## License

MIT — see [LICENSE](./LICENSE).
