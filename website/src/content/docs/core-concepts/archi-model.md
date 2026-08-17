---
title: ArchiModel
description: The shape of the parsed semantic model.
---

`parseArchiModel` returns an
[`ArchiModel`](/reference/generated/index/interfaces/ArchiModel/) — the
semantic representation of an Archi `.archimate` model file.

```text
.archimate XML

        ↓ parse

ArchiModel
│
├── metadata        ← id, name, native version, purpose, model-level properties
├── folders
├── elements
├── relationships
├── views
├── diagramObjects
├── diagramConnections
├── notes
└── profiles        ← Specializations and generic Profiles
```

## Collections

Every collection is **flat** (not nested) and **preserves the order entities
appear in the source XML**. Cross-references between entities (a
relationship's `sourceId`, a diagram object's `archimateElementId`) are
plain string ids — look them up in the relevant array, or build a `Map`
keyed by `id` if repeated lookups are needed.

The parser never requires a specific entity to appear before another: by the
time the model is returned, references are just strings waiting to be
resolved by the caller.

## Metadata

[`ArchiModelMetadata`](/reference/generated/index/interfaces/ArchiModelMetadata/)
holds the model-level attributes:

| Field | Description |
| --- | --- |
| `id` | The model's own id. |
| `name` | The model's name. |
| `version` | The model's native version string. |
| `purpose` | The native `<purpose>` element — Archi's own name for the model-level narrative field. `null` when absent. |
| `properties` | Model-level `<property>` entries. |

Note the model root has no separate, generic "documentation" concept — its
narrative lives in `purpose`, unlike elements, relationships, views, and
folders, which all carry a `documentation` field.

## Collections at a glance

| Collection | What it holds | Cross-references you will find |
| --- | --- | --- |
| `folders` | The model tree: standard buckets (Business, Application, Relations, Views) plus user sub-folders. | `parentId`, `containedIds` |
| `elements` | Every semantic element, any ArchiMate type. | `folderId`, `profiles` |
| `relationships` | Every semantic relationship. | `sourceId`, `targetId`, `folderId`, `profiles` |
| `views` | Diagram/view definitions. | `folderId`, `diagramObjectIds`, `diagramConnectionIds`, `noteIds` |
| `diagramObjects` | Visual nodes (diagram objects, groups, model references). | `viewId`, `parentId`, `archimateElementId`, `referencedModelId` |
| `diagramConnections` | Visual connections. | `viewId`, `sourceId`, `targetId`, `archimateRelationshipId` |
| `notes` | Free-text diagram notes. | `viewId`, `parentId` |
| `profiles` | Specializations and generic Profiles. | referenced from `elements[].profiles`, `relationships[].profiles` |

## The id pool

Archi draws every id — semantic and visual — from **one shared pool**, so a
`duplicate-id` anywhere in the model is a real integrity problem. The
validator exploits exactly this fact; see
[Validate a model](/getting-started/validate-model/).

## Ordering guarantee

All collections preserve source order. If your tooling relies on document
order (for example to mirror the model tree), it is available for free —
nothing is sorted or re-arranged during parsing.
