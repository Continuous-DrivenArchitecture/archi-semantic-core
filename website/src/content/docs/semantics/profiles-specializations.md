---
title: Profiles and Specializations
description: ArchiProfile — Specializations, generic Profiles and id-based referencing.
---

Archi's generic Profiles mechanism is exposed through an
[`ArchiProfile`](/reference/generated/index/interfaces/ArchiProfile/):

```ts
interface ArchiProfile {
  id: string;
  name: string | null;
  imagePath: string | null;   // e.g. "images/abc123.png"
  features: ArchiFeature[];   // { key, value } pairs defined on the profile
}
```

## Two kinds of profiles

Archi has two native profile variants, both represented as `ArchiProfile`:

- **Specializations** — profiles that specialize an ArchiMate element type
  (e.g. a "Data Store" specialization of `ApplicationService`), typically
  with an icon and feature values. Archi stores them as
  `archimate:Specialization` entries with a `name` and an `imagePath`.
- **generic Profiles** — profiles attached to any element without a
  specialization.

## How elements reference them

Profiles are declared **once at the model root** (`model.profiles`) and
referenced by id from elements and relationships:

```ts
element.profiles: string[]       // ArchiProfile.id values
relationship.profiles: string[]  // ArchiProfile.id values
```

```ts
const profileById = new Map(model.profiles.map((p) => [p.id, p]));

for (const element of model.elements) {
  const profiles = element.profiles
    .map((id) => profileById.get(id))
    .filter(Boolean);

  if (profiles.length) {
    console.log(element.name, '→', profiles.map((p) => p.name).join(', '));
  }
}
```

## Image handling

When a profile has an embedded icon, `imagePath` points into the
`.archimate` archive's `images/` entry — e.g. `"images/abc123.png"`.
`extractArchiModelXml` does not extract image bytes; treat `imagePath` as a
pointer into the archive if you need the binary (see
[Working with .archimate archives](/getting-started/archives/)).

## Current boundary

Profile content is parsed (name, image path, features), but no semantic
feature-typing is done — the pair of concerns that rule, and profile feature
keys are preserved as plain key/value pairs.
