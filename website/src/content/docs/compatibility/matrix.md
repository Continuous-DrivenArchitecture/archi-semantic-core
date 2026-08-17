---
title: Compatibility matrix
description: What is parsed, what is preserved verbatim, and what is validated — by area.
---

This matrix summarizes how each area of the native `.archimate` format is
handled. "Parsed" means represented in `ArchiModel`; "Preserved verbatim"
means carried through without transformation; "Checked" means
`validateArchiModel` reports violations.

## Model structure

| Area | Status |
| --- | --- |
| Model root (`metadata`, `purpose`, properties) | Parsed |
| Folder tree | Parsed with `parentId`/`containedIds` |
| Elements, any type | Parsed generically, `xsiType` preserved verbatim |
| Relationships, any type | Parsed generically, `xsiType` preserved verbatim |
| Views (`ArchiView`) | Parsed with precomputed containment indexes |
| Notes | Parsed |
| Model element / model references | Parsed (`DiagramModelReference.referencedModelId`) |
| Sketch/Canvas models | Preserved verbatim where encountered |
| Duplicate/missing ids | Checked (`missing-id`, `duplicate-id`) |
| Dangling relationship endpoints | Checked (`broken-relationship-source/target`) |
| Dangling visual references | Checked (object/connection referents) |

## Native Archi semantics

| Area | Status |
| --- | --- |
| Junction AND/OR (`type` attr) | Parsed + checked (`unrecognized-junction-type`) |
| Access `accessType` (0–3) | Decoded to `ArchiAccessType`, native default `'Write'` |
| Influence `strength` (free text) | Parsed verbatim |
| Association `directed` | Decoded to boolean, native default `false` |
| Profiles / Specializations | Parsed (id, name, imagePath, features) |
| Label Expressions | Read + resolved (core placeholders); reference-prefix forms left verbatim |
| `xsiType` namespace stripping | Applied; raw value always preserved |

## Styling and geometry

| Area | Status |
| --- | --- |
| `ArchiStyle` (line/fill/font) | Parsed, fields independent and null-safe |
| `ArchiBounds` | Parsed; nested coordinates are parent-relative |
| Bendpoints | Parsed with native start/end pairs |
| Geometry completeness | Not checked (nulls are meaningful) |

## Archives

| Area | Status |
| --- | --- |
| Plain-XML `.archimate` | Supported |
| Zip `.archimate` (`model.xml` + `images/`) | Supported (Node-only subpath) |
| Stored/Deflate compression | Supported; anything else throws |
| CRC-32 integrity | Verified |
| Embedded image extraction | Not provided (pointers exposed, e.g. `imagePath`) |

## Boundaries

| Area | Status |
| --- | --- |
| ArchiMate Model Exchange File Format | Not parsed, not generated |
| Mutation / serialization back to `.archimate` | Not provided |
| Rendering, layout, routing | Not provided |
| Quality/lint rules | Not provided |
| Browser zip-handling | Not provided (root entrypoint stays bundler-safe) |

The columns are deliberately exact: a field that is "preserved verbatim" is
a field this package promises never to reinterpret, and a boundary listed
above is a boundary the package promises never to silently cross.
