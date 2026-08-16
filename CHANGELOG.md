## [0.2.0](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/compare/v0.1.0...v0.2.0) (2026-08-16)

## [0.2.0](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/compare/v0.1.0...v0.2.0) (2026-08-16)

# Changelog

All notable changes to this package are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-08-15

### Added

- Initial release: `parseArchiModel` reads native Archi `.archimate` XML
  into a flat, semantic `ArchiModel` — folders, elements, relationships,
  views, diagram objects/connections, notes, and bendpoints — with ids,
  documentation, and properties.
- `validateArchiModel` — structural validation (missing/duplicate ids,
  dangling references) across all id-bearing collections.
- `ArchiJunctionType`, `ArchiElement.junctionType`, and
  `ArchiElement.rawJunctionType` — Junction's native AND/OR discriminator,
  decoded from the native `type` attribute (absent/`""` → `And`, `"or"` →
  `Or`), with the raw value always preserved even when unrecognized.
- `ArchiDiagramObject.referencedModelId` — the `model` reference on a
  `DiagramModelReference` node, distinguishing it from a `Group`.
- `ArchiFolder.documentation` and `ArchiFolder.properties`.
- `ArchiModelMetadata.purpose` and `ArchiModelMetadata.properties` — the
  model root's native `<purpose>` narrative field and model-level
  properties.
- `ArchiAccessType` and `ArchiRelationship.accessType` — `AccessRelationship`
  access mode, decoded from the native `accessType` attribute (`0`-`3`),
  named after Archi's own `IAccessRelationship` constants.
- `ArchiRelationship.strength` — `InfluenceRelationship`'s free-text
  modifier.
- `ArchiRelationship.directed` — `AssociationRelationship`'s directedness.
- `ArchiView.viewpoint` — the view's native viewpoint code.
- `ArchiStyle.alpha` — native fill opacity (`0`-`255`), decoded on diagram
  objects and notes; always `null` on connections (a `Connection` has no
  fill in Archi's own model).
- `ArchiView.connectionRouterType` — native connection-routing code (`0`
  manual bendpoints, `2` orthogonal), preserved verbatim like `figureType`.
- `ArchiStyle` (`fillColor`, `lineColor`, `fontColor`, `font`, `fontName`,
  `fontSize`, `fontStyle`, `lineWidth`) on diagram objects, connections, and
  notes, including SWT `FontData` bold/italic decoding.
- `ArchiDiagramObject.figureType` — native alternate figure/icon selector,
  preserved verbatim.
- `ArchiDiagramObject.documentation` — documentation set directly on a
  Group/`DiagramModelReference` visual object (which has no underlying
  semantic element to carry it instead).
- `ArchiFeature` and generic `<feature name="..." value="..."/>` parsing on
  diagram objects, connections, and notes.
- `getLabelExpression`/`resolveLabelExpression` — read and evaluate Archi
  Label Expressions (the `labelExpression` feature) against the "core"
  placeholder set.
- `ArchiProfile` and root-level `<profile>` parsing (Specializations and
  generic Profiles), plus `profiles` reference ids on elements and
  relationships.
- `extractArchiModelXml` — reads `model.xml` out of Archi's zip-archive
  `.archimate` file variant, so `parseArchiModel` can accept either shape.
- Bilingual (EN/ES) README, extended with German, French, Dutch,
  Portuguese, and Simplified Chinese translations (`README.de.md`,
  `README.fr.md`, `README.nl.md`, `README.pt.md`, `README.zh.md`).
- npm version and license badges in the README, sourced live from the npm
  registry/package metadata instead of a hand-maintained version string.
- `CONTRIBUTING.md` — scope boundary, dev setup, coding conventions, the
  checklist for adding a new native attribute, and the translation rules
  for the six README mirrors.
- Fixes five verified data-loss bugs carried over from the CA-Stack
  implementation this package was extracted from: dead
  `childrenIds`/`connectionIds`/layout-id population, dropped `Group`
  visual containers, undecoded numeric XML character references, and
  unreachable view documentation/properties.

### Changed

- Package renamed to `@cda/archi-semantic-core` under the
  `Continuous-DrivenArchitecture` organization.
- Diagram id derivation (`childrenIds`, `connectionIds`,
  `diagramObjectIds`, `diagramConnectionIds`, `noteIds`) now runs in linear
  time via single-pass `Map` indexes instead of repeated `Array.filter()`
  scans, avoiding O(n²) behavior on large models. No observable change to
  field names, values, or ordering.
- A badge-style language switcher at the top of every README: a flat
  `flagcdn.com` flag icon next to a plain-text shields.io badge per
  language, replacing the plain-text language links. (An initial version
  put the flag emoji directly inside the shields.io badge text; dropped
  because shields.io renders badge text with Verdana/DejaVu Sans, neither
  of which has flag-emoji glyphs, so it never drew as a flag.)

[0.1.0]: https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/releases/tag/v0.1.0
