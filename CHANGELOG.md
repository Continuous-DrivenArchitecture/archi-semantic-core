## [0.3.0](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/compare/v0.2.0...v0.3.0) (2026-08-16)

### Features

- **examples:** parser-focused consumption recipes for ArchiModel ([a49f82b](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/a49f82b25c8d38758748a4b2739dc4bdf3d6e223))

### Bug Fixes

- badge paths in runbooks resolve relative to runbooks/ ([d80e59a](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/d80e59a8146bf5f134e36564365084ce08eb4907))

### Documentation

- add new-repo playbook as internal devsecops recipe (.docs/) ([86111a6](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/86111a67616275b30099eb76085d311310970024))
- add Spanish version of the devsecops recipe ([5efc302](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/5efc3021daacfffe2749c81f876b324ff0bf63ea))
- adopt kebab-case runbook naming and add index ([f9c8887](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/f9c8887a4c8ce40fe78741a4f9dace9a1cc63c6f))
- move devsecops recipes to .github/ ([971a3e5](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/971a3e5618f277e4ba3a45870664d7e38f7c856d))
- move recipes to runbooks/ (industry standard for operational procedures) ([5bc6526](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/5bc6526a63fe6c882db24da4b7644ff3f0534da5))
- reference runbooks from CONTRIBUTING, drop runbooks index ([aec66f8](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/aec66f852a73686ed821f0a2ab9912e0ec6023e4))
- translate devsecops recipe to English ([f40d62d](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/f40d62dfb110c7745fc39ab62b65c04f30910be4))
- use the standard flag language-switcher in recipes ([cbd4db9](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/cbd4db967068efd4b724004bec1a87f5af16f49a))
- verb-first runbook naming (create-new-repo) ([ba9bee1](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/ba9bee1936d9c9a3074acdee67cee8ced9d59aab))

### Miscellaneous Chores

- **assets:** move badges and flags from docs/ to .github/assets/ ([06280dc](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/06280dc11cfa501822fdfcbb2178d0129e361f8f))

### Continuous Integration

- **release:** push through the sentinel app so the main ruleset allows it ([7b252bb](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/7b252bb9856f53922bf90b8b0316add5e1b301b5))
- run CI on every branch push and document develop/main flow ([e2a6350](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/e2a6350c48dcf40a74745c968d23f7a1b460d4ce))

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
