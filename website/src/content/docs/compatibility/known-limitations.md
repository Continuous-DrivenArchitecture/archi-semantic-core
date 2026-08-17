---
title: Known limitations
description: Honest boundaries — what this package cannot do yet or will never do.
---

This page is the contract's honesty clause: every entry is a real, known
boundary. If a capability is missing here, it is missing from the package.

## Not parsed or not resolved

- **Label Expression reference-prefix forms** — `${parent{...}}`,
  `${source{...}}`, `${model{...}}`, `${<relationship>:source{...}}` and
  similar are left **verbatim, unresolved** in `resolveLabelExpression`
  output: they require model-graph traversal beyond a single object.
- **`${specialization}` and `${viewpoint}`** placeholders — likewise left
  unresolved; the parser does not yet capture those attributes on visual
  objects.
- **ArchiMate Model Exchange files** — by design, never parsed nor
  generated (see [Compatibility philosophy](/compatibility/philosophy/)).
- **Sketch/Canvas semantics** — preserved verbatim where encountered, but
  not given semantic treatment (no element/relationship semantics to
  provide).
- **Image binaries** — never extracted; `imagePath`-style references are
  exposed as pointers into the archive.

## Not provided

- **Mutation or serialization** — there is no way to write an `ArchiModel`
  back to `.archimate`, and no editing API. The package reads; consumers
  build the write path if they need one.
- **Rendering, layout, diagram routing, image rendering** — out of scope by
  design.
- **Quality rules** — `validateArchiModel` checks structural integrity only.
  Lint-style rules are a separate layer.
- **Browser zip-handling** — the `/archive` subpath is Node-only
  (`node:zlib`); the root entrypoint has no Node imports and stays
  bundler-safe.
- **Id lookup helpers, query language, graph storage** — flat arrays +
  string ids + your own indexes. No helpers, no DSL, no graph DB.

## Not yet verified against

- A broad corpus of third-party models saved by different Archi versions.
  The parser is written against Archi's source and the project's own test
  fixtures; wider validation is planned. If your model hits an edge, an
  issue report with the `.archimate` (or a minimal repro) is the most
  valuable contribution you can make.

## Never guessed

- Unknown native values are never guessed or discarded
  (see [Junctions](/semantics/junctions/) for the rule in action).
- The parser does not fabricate defaults that Archi does not store — except
  where Archi's own native defaults are documented (`accessType` `'Write'`,
  `directed` `false`).
