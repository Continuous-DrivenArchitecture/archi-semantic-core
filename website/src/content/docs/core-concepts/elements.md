---
title: Elements
description: ArchiElement — semantic elements, raw vs semantic types, folders and properties.
---

An
[`ArchiElement`](/reference/generated/index/interfaces/ArchiElement/)
represents a semantic ArchiMate element — BusinessActor,
ApplicationComponent, TechnologyService, or any other type Archi supports.
The parser covers **any element type generically**: it does not hardcode a
fixed catalogue of type names.

## Raw and semantic types

Every element exposes both:

```ts
interface ArchiElement {
  xsiType: string; // verbatim native XML value, e.g. "archimate:BusinessActor"
  type: string;    // namespace-prefix-stripped, e.g. "BusinessActor"
}
```

The derivation is generic — the parser strips the namespace prefix without
requiring the type name to be known in advance. This is what keeps the
package working with element types Archi introduces later.

## Where an element lives

```ts
interface ArchiElement {
  folderId: string;     // the id of the containing folder
  folderPath: string;   // slash-joined folder names from the model root, e.g. "Business/Actor"
}
```

`folderPath` is precomputed at parse time, so displaying or grouping by
path does not require walking the folder hierarchy.

## Documentation and properties

```ts
interface ArchiElement {
  name: string | null;
  documentation: string | null;
  properties: ArchiProperty[]; // { key, value } entries
}
```

## Profiles

Elements reference Specializations and generic Profiles by id:

```ts
interface ArchiElement {
  profiles: string[]; // ArchiProfile.id values; empty when none are set
}
```

Resolve these against `model.profiles` (see
[Profiles and Specializations](/semantics/profiles-specializations/)).

## Junction fields

Junctions are elements too, and carry a separate native discriminator:

```ts
interface ArchiElement {
  junctionType: ArchiJunctionType | null; // 'And' | 'Or', or null
  rawJunctionType: string | null;         // verbatim native value
}
```

For every non-Junction element both fields are `null`. See
[Junctions](/semantics/junctions/) for the decoding rules.

## Example

```ts
const actors = model.elements.filter((e) => e.type === 'BusinessActor');

for (const actor of actors) {
  console.log(actor.name, '—', actor.folderPath);
}
```
