---
title: Working with large models
description: Flat collections, source-order parsing and the constant-memory archive pipeline.
---

The library is designed to keep memory and time predictable as models grow.
Nothing here is new API — this page documents the properties you can rely on.

## Flat collections, no hidden copying

Every collection (`elements`, `relationships`, `diagramObjects`, …) is a
plain array in source order. There is no nested tree re-building and no
object-identity graph: cross-references are string ids and the precomputed
containment indexes on views/objects are derived in a single O(n) pass
during parsing.

## `extractArchiModelXml` is constant-memory

For `.archimate` zip archives, the `model.xml` entry is streamed with
`inflateRawSync` **chunk by chunk** — the full entry is never held in memory
as compressed data. Peak memory is dominated by the *decoded* XML text
itself (the final model.xml), not by the archive. Plain-XML files skip the
archive path entirely.

This keeps the archive step's memory cost proportional to the model's final
size, and the parsing step's cost proportional to the model's content — the
largest terms are unavoidable, everything else stays out of the way.

## One pass over the XML

Parsing is a single forward pass with fast-xml-parser; the id pool
validation that the parser performs happens in that same pass, so
`validateArchiModel` is a *second* linear pass over the already-parsed
arrays — no re-parse of XML is ever triggered by validation.

## Practical scaling notes

- **Lookups**: avoid `collection.find()` inside loops over other
  collections — O(n·m). Build `Map` indexes once
  (see [Build lookup indexes](/guides/lookup-indexes/)).
- **Memory**: the parsed `ArchiModel` mirrors the XML document; a model
  whose XML is N MB yields a model whose strings total roughly the same
  order of magnitude, plus per-object structure. For reporting or CI use,
  that is well within ordinary limits.
- **Tests**: the published-consumption test exercises the archive pipeline
  against real `.archimate` zips with embedded images to keep both shapes
  covered.

## When to worry

You almost never need to worry. If a model is large enough that a single
parsed `ArchiModel` is a problem, the boundary you are hitting is the in-JS
representation itself — at which point the right move is a streaming or
indexed layer downstream, not a different parser.
