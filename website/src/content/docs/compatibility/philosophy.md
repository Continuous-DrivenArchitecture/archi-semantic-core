---
title: Compatibility philosophy
description: Why this package reads Archi's native format, not a standardized exchange format.
---

`archi-semantic-core` parses **Archi's native `.archimate` XML**, the format
Archi itself reads and writes on disk — not the ArchiMate® Model Exchange
File Format. That choice is deliberate and deserves an explicit explanation.

## Faithful semantics over standards

The purpose of this package is a **faithful, typed semantic representation
of the model as Archi actually stores it**. Native Archi semantics — raw vs.
semantic type names, Junctions' `type` attribute, Access' `0`–`3` codes,
Influence's free-text `strength`, Label Expressions, nested-relative
geometry, Specializations — are part of the data, not an obstacle.

An exchange format (Open Exchange, .xml variants) exists to
*interoperate across tools*, and in doing so it normalizes: `AccessTypeEnum`
uses `"Access"` where Archi uses `"Unspecified"`; Label Expressions are
rendered away or lost; Specializations and Profiles have no equivalent;
nested-relative coordinates don't exist. A parser for an exchange format
**must** throw that information away or reinterpret it. This package was
built to *not* do either.

If you need Open Exchange compatibility, the right architecture is a
transformer layer on top of `ArchiModel` — reading this package's output
and emitting the exchange format — not a fork that parses exchange XML.

## Original Archi's quirks, preserved

The parser is written against Archi's own source code and test models, not
against a spec. Where the format is ambiguous, Archi's behavior wins. When
Archi introduced a breaking change (Label Expression escaping at Archi 4.4),
the parser tracks the *behavior*, so old and new models resolve to the same
text.

## Compatibility goals

- **Forward compatibility with Archi versions** — a model saved by a newer
  Archi with previously-unknown element types or relationship attributes
  still parses; nothing is rejected because a name was not in a hardcoded
  catalogue.
- **Exactness** — unknown native values are never guessed (see
  [Junctions](/semantics/junctions/) for the clearest example).
- **Honesty** — boundaries and limitations are documented on
  [Known limitations](/compatibility/known-limitations/).
