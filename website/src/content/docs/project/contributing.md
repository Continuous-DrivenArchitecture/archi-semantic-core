---
title: Contributing
description: How to contribute to archi-semantic-core.
---

Contributions are welcome. The project follows a small set of conventions so
that every change is reviewable, testable, and releasable.

## Development setup

```sh
npm ci
npm run typecheck
npm test
```

## Branch and release flow

The repository uses two long-lived branches:

- `develop` — integration branch; all PRs target it.
- `main` — release branch; updated **only** by semantic-release on
  publish.

Releases are automated with semantic-release: commits must follow the
[Conventional Commits](https://www.conventionalcommits.org/) specification.
Every commit to `develop` lands in the changelog and release notes — write
commit messages for human readers, not for the tool.

## What to add a test for

Any behavior change to the parser, validator, or archive handling must ship
with fixture-backed tests. The fixture layout follows the source layout:

- `tests/fixtures/` — plain XML and zip `.archimate` samples;
- `tests/parser/` — parsing behavior, raw vs. semantic values, defaults;
- `tests/validator/` — every issue code the validator can emit;
- `tests/archive/` — zip handling, including embedded-image archives;
- `examples/` — runnable usage samples, each with a `tests/examples.test.ts`
  harness.

## Public API changes

`src/index.ts` and `src/archive.ts` are the entire public contract (see
[Design principles](/project/design-principles/)). Changes to them:

1. are documented in JSDoc on the source, since the API reference on this
   site is generated from it;
2. bump the version according to semantic-release rules (fix/feat/BREAKING
   CHANGE);
3. never land silently — the PR description must call them out.

## Documentation

Site pages live in `website/src/content/docs/`; the API reference group is
generated from JSDoc (`npm run gen:api` inside `website/`) at build and
deploy time — it is not committed. When a PR changes public API, the JSDoc
on the source is the documentation; the generated pages follow it
automatically.

## Before opening a PR

```sh
npm run typecheck
npm test
npm run test:published   # exercises the archive pipeline end-to-end
```

Then open the PR against `develop`. If the change is user-visible, the
release notes/changelog entries are produced automatically at publish time
— no manual changelog editing.
