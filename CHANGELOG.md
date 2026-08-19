# Changelog

## [0.4.3](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/compare/v0.4.2...v0.4.3) (2026-08-19)

### Bug Fixes

* **parser:** preserve sourceConnection when xsi:type is absent ([1899389](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/1899389979edd9a787ecd30f9d040fcb9e0009a1))

### Documentation

* add Security section, fix dead docs link, sync translated READMEs ([221b512](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/221b5120bfd835b623bb4dd92c17a62685cc79cf))

## [0.4.2](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/compare/v0.4.1...v0.4.2) (2026-08-17)

### Bug Fixes

* **release:** prevent publishing packages without dist ([b8ab8a0](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/b8ab8a00a90b41ce915f2312bfd9df2390923106))

### Documentation

* add documentation website (Astro/Starlight) with generated API reference ([02d3268](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/02d326836c91c96dc532c9d4cc13f9ac52193ab2))
* temporarily serve GitHub Pages from develop ([9b44f61](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/9b44f6154c1230c9655dbd8f02e7d2bb48495a36))

### Miscellaneous Chores

* **docs:** retire in-repo website in favor of the CDA Developer Portal ([b267e88](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/b267e881e0628931ee45385d55e84adbf8f86582))

### Continuous Integration

* **docs:** install root dependencies so typedoc can resolve source imports ([52d03db](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/52d03db277e873dcd8d0a799db30a9edf87b2a99))

## [0.4.1](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/compare/v0.4.0...v0.4.1) (2026-08-17)

### Bug Fixes

* **release:** quote format in author guard so bash parses it ([2d8b516](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/2d8b5168e036cdb3ed240234cbacf9c60127bd53))

## [0.4.0](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/compare/v0.3.1...v0.4.0) (2026-08-17)

### Features

* **archive:** expose Node archive support through dedicated subpath ([af3dcca](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/af3dccad0645c6bf74084fa23cc4db3d2197240e)), closes [#10](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/issues/10)

All notable changes to this package are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.3.1](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/compare/v0.3.0...v0.3.1) (2026-08-16)

### Bug Fixes

* **release:** generate real release notes with conventionalcommits v9 ([869b205](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/869b20569a38631b63515dd5e21a6fc07bad13e4))

### Miscellaneous Chores

* **deps:** bump actions/upload-artifact from 4.6.2 to 7.0.1 ([602ab49](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/602ab49f4522d13403cd5c119cf387ec7ec0812f))
* **deps:** bump actions/upload-artifact from 4.6.2 to 7.0.1 ([#8](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/issues/8)) ([ed9ba78](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/ed9ba7850861b67755877aa482494742a18e09af))

### Continuous Integration

* **dependabot:** open pull requests against develop, not main ([02719b4](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/02719b445a975c213e28d67e78c1e6817a9c624d))
* **release:** drop NPM_TOKEN, publish via OIDC only ([22afbd6](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/22afbd69dc29e63ceed311fae92997a3a6b8aebe))
* **release:** guard against non-human release commit authors ([53a149e](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/commit/53a149ebc47a726193c706781730ed23ee3eb581))

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

### Changed

- Label expressions now resolve in O(1) per node — linear time on
  arbitrarily large models (previously O(n²)).
- Zip entries are verified against their CRC-32 before parsing — a
  corrupted model archive throws `archimate-zip-crc-mismatch` instead of
  producing garbage.

### Security

- npm package publishes with SLSA provenance and registry signature via
  trusted publishing (OIDC).
- CI hardened per the OWASP NPM Security Cheat Sheet: `ignore-scripts`,
  prod-only audit gate, pinned third-party actions, weekly dependency
  health check.

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
