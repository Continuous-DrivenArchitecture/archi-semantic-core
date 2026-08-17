---
title: Design principles
description: The engineering principles behind the package.
---

These principles govern every decision in the package. If a change would
violate one of them, the change is wrong — even if it would be convenient.

## Faithfulness over convenience

The model must represent what Archi stores, not what a consumer might find
convenient. This means:

- **Verbatim preservation** — `xsiType` keeps the original value; unknown
  junction types keep `rawJunctionType`; strengths are free text;
  `connectionRouterType` stays a raw number because interpreting it would
  guess at UI semantics.
- **No fabricated defaults** — except where Archi's own documented defaults
  are the truth (`accessType` → `'Write'`, `directed` → `false`).
- **Nulls are meaningful** — a missing `strength` means "no modifier set",
  not `''`; a missing coordinate is `null`, not `0`.

## A small, typed, stable public API

- Two entrypoints, five functions, and the types they need — that's the
  whole contract.
- Every addition to `src/index.ts`/`src/archive.ts` is a public promise:
  once released, it is consumed, pinned, and broken only across a major
  version boundary.
- Internal modules are not exported: `parseArchiModel` is the door, the
  rest of the house is load-bearing wall.

## Platform boundaries are explicit

- The core entrypoint has **zero Node imports** so browser bundlers can
  consume it untouched.
- Node-only functionality (zip handling) lives in `/archive` — importable
  only when the platform supports it.

## The consumer owns their workload

The parser returns flat arrays and string ids. Index building, traversal,
rendering, caching, and graph storage are consumer concerns — the package
stays out of the way (see [IDs and references](/core-concepts/ids-references/)).

## Validation without divergence

`validateArchiModel` must never contradict the parser: it validates the
*parsed* model with the same id pool the parser used. There is one source
of truth about model shape, and both sides read it.

## Tested against reality

Behavior is pinned against Archi's own source and real `.archimate`
fixtures — including zip archives with embedded images, exercised by a
published-consumption test. When Archi changed behavior (Label Expression
escaping at 4.4), the parser tracks behavior, not a snapshot of the
codebase.
