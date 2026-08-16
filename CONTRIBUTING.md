# Contributing

Thank you for helping improve `archi-semantic-core`.

## Scope

This repository parses Archi's **native** `.archimate` XML format into a
typed `ArchiModel`. Per the README's [Design principle](README.md#design-principle):

> `archi-semantic-core` should understand **Archi's native model semantics**.
> It should not know how another format, renderer, editor, or exchange
> standard chooses to represent those semantics.

In practice this means:

- No ArchiMate® Model Exchange File Format conversion here — that lives in
  [`archi-open-exchange`](https://github.com/Continuous-DrivenArchitecture/archi-open-exchange),
  which consumes this package's `ArchiModel` output.
- No rendering, diagramming, UI, or editing features.
- No lookup helpers, caching layers, or convenience APIs beyond a faithful,
  typed read of what Archi itself stores.

If a change sounds like it belongs to conversion, rendering, or an
end-user tool instead, it likely belongs in a sibling
[Continuous-DrivenArchitecture](https://github.com/Continuous-DrivenArchitecture) repo,
not here.

## Before contributing

Read the README's [Design principle](README.md#design-principle) and
["What's out of scope"](README.md#whats-out-of-scope) sections first — they
define the boundary this package won't cross, and save you from building
something that will be declined for being out of scope.

## Development setup

```sh
git clone https://github.com/Continuous-DrivenArchitecture/archi-semantic-core.git
cd archi-semantic-core
npm install

npm run typecheck
npm test
npm run build
```

Node.js `^20.0.0 || ^22.0.0 || >=24.0.0` is required (see `engines` in
`package.json`). There is no lint/format tooling configured — `tsc --strict`
and the test suite are the checks that matter.

## Coding conventions

This codebase follows a few rules consistently — match them rather than
introducing a new style:

- **Preserve native values verbatim, never guess.** When a native attribute
  can't be confidently decoded, expose the raw string/number alongside (or
  instead of) an interpreted field, and return `null` rather than coercing
  to a default. See `ArchiElement.rawJunctionType` or `ArchiStyle.font`
  (kept verbatim even when `fontName`/`fontSize`/`fontStyle` can't be
  decoded from it) for the pattern.
- **Verify against Archi's own source, not just sample files.** Before
  adding a new native attribute, check it against Archi's actual model —
  the `.ecore` schema and Java interfaces at
  [`archimatetool/archi`](https://github.com/archimatetool/archi), under
  `com.archimatetool.model/model/archimate.ecore` and
  `com.archimatetool.model/src/com/archimatetool/model/`. Several JSDoc
  comments in this codebase cite the exact interface/constant they were
  checked against (e.g. `IJunction`, `IAccessRelationship`) — do the same.
- **No comments unless the WHY is non-obvious.** Don't restate what a field
  is; explain a hidden constraint, a native default, or a discrepancy
  between Archi's Java API and its XML serialization, when that's the
  reason the code looks the way it does.
- **No speculative abstractions, no unrequested error handling.** Match the
  scope of the actual native attribute being added — see
  ["What this package is for"](README.md#what-this-package-is-for).
- **Never scan a model-wide collection inside a per-item loop.** Code that
  runs once per element/relationship/diagram object (e.g.
  `resolveLabelExpression`, the validator, id derivation) must not do
  `Array.find()`, `Array.filter()`, `indexOf`, or `includes` over
  `model.elements`/`model.relationships`/view children — that is O(n²) on
  real models. Build a `Map` index once (see the `getModelIndexes` pattern
  in `src/parser/label-expression.ts`) and look up by id, keeping every
  per-node path O(1). `test/performance.test.ts` enforces this with a
  large-model time budget and a scaling-ratio check — if your change makes
  the parser or validator noticeably slower on big models, it will fail
  there.

## Adding a new native attribute

This is the most common contribution shape. The checklist below mirrors how
every existing field was added:

1. Confirm the attribute exists in Archi's own model (ecore/Java source, per
   above) — note its native default, if any.
2. Add the field to the relevant `src/domain/*.ts` interface, with a JSDoc
   comment stating the native attribute name and its default behavior.
3. Parse it in `src/parser/archi-parser.ts` (or `style-utils.ts` for visual
   styling), reusing `readOptionalText`/`readOptionalNumber` from
   `xml-utils.ts`.
4. Extend an existing fixture in `test/fixtures/` with both a set and an
   absent/default case — avoid adding a new fixture file if an existing one
   already covers the right element/view/object.
5. Add tests in `test/parser.test.ts` — prefer exact `toEqual` over partial
   `toMatchObject` for style/geometry objects, so a future field addition
   can't silently go unasserted.
6. Update `README.md` **and every translation** (see below).
7. There is **no manual changelog step** — `CHANGELOG.md` is generated
   automatically from commit messages at release time (see
   `.releaserc.json`), so write commits that read well as release notes.

## Translations

This package maintains `README.md` (English, source of truth) plus six
translations: `README.de.md`, `README.es.md`, `README.fr.md`,
`README.nl.md`, `README.pt.md`, `README.zh.md`. When you change
`README.md`, propagate the same change to all six — a PR that updates the
English README without its mirrors will be asked to complete the set.

Rules for translated content (already applied consistently across the six
files — follow the existing pattern rather than re-deriving it):

- Translate prose, headings, and table cells.
- Never translate: TypeScript identifiers, function signatures, the npm
  package name, shell/npm commands, URLs, file paths, JSON, XML attribute
  names, `.archimate`, or ArchiMate concept/relationship type names. The
  "Access"/"Influence"/"Association" subheadings stay in English in every
  translation.
- Do translate inline `//` comments inside ```ts code fences.
- Rebuild the Table of Contents anchors to match GitHub's heading-slug
  algorithm for the translated headings — don't just copy the English
  anchors.
- Keep the language-switcher line (local badge per language, pointing at
  `.github/assets/badges/lang-<code>.svg`) identical, byte-for-byte, across
  all seven files. Run `npm run badges` after bumping the version in
  `package.json` so `.github/assets/badges/version.svg` stays in sync — the
  script also bumps the `?v=<version>` cache-busting key on the version
  badge link in all seven READMEs (browsers otherwise serve the stale SVG
  after a release).

CONTRIBUTING.md itself is English-only, matching the convention used across
the other Continuous-DrivenArchitecture repos.

## Commits and pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/) prefixes
  (`feat:`, `fix:`, `docs:`, `chore:`, ...), matching this repo's existing
  history.
- Keep `npm run typecheck` and `npm test` passing before opening a PR.
- Pin every third-party GitHub Action to its **full commit SHA** (never a
  floating tag) — a moved tag is a supply-chain vector with the
  workflow's token. Resolve the SHA from the action's release, then use
  `actions/foo@<40-char-sha>`.
- Describe *why* the change is needed, not just what changed — especially
  for a new native attribute, cite what you checked in Archi's source.
- Don't bump the version in `package.json` or edit `CHANGELOG.md` — both
  are handled automatically at release time by semantic-release
  (`.releaserc.json`); every release is a tag-triggered push to `main`.

## License

By contributing, you agree your contribution is licensed under this
project's [MIT license](./LICENSE).
