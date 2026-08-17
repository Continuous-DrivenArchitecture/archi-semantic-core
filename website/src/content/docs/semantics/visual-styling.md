---
title: Visual styling
description: ArchiStyle, ArchiFontStyle and the interplay of style defaults with explicit values.
---

Visual styling is captured in [`ArchiStyle`](/reference/generated/index/interfaces/ArchiStyle/)
and [`ArchiFontStyle`](/reference/generated/index/interfaces/ArchiFontStyle/):

```ts
interface ArchiStyle {
  lineColor: string | null;      // hex color, e.g. "#000000"
  lineWidth: number | null;
  fillColor: string | null;      // hex color, e.g. "#ffffff"
  font: ArchiFontStyle | null;
}

interface ArchiFontStyle {
  name: string | null;
  size: number | null;
  style: string | null;          // e.g. "bold", "italic"
  color: string | null;
}
```

## Null-safe parsing

Every style attribute is parsed **independently**: a missing or
non-numeric/non-string attribute yields `null` for that field only — the
parser never fabricates `0` or an empty string, and never fails the whole
object because of one bad field. Style values are always preserved verbatim
as Archi wrote them, with no normalization or clamping.

## Example

```ts
const styledElements = model.diagramObjects.filter(
  (o) => o.style?.fillColor === '#ff0000',
);

console.log('red diagram objects:', styledElements.length);
```

## Who carries styles

`ArchiStyle` is shared by the visual types:

- `ArchiDiagramObject`
- `ArchiDiagramConnection`
- `ArchiNote`

Elements and relationships do not carry styles — styling lives on their
visual representations, not on the semantic model.
