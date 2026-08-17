---
title: Changelog and releases
description: Where release notes live and how versions are published.
---

## The changelog

Every release is documented in the repository's
[`CHANGELOG.md`](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/blob/develop/CHANGELOG.md),
generated from Conventional Commits at publish time. There is no manual
changelog editing: what the commit message says is what the release notes
say.

## Versioning

Versions follow semantic versioning:

- `fix(...)` commits → patch releases (`0.4.1`);
- `feat(...)` commits → minor releases (`0.4.0`);
- `BREAKING CHANGE` → major releases (`1.0.0`).

## The release pipeline

1. Commits land on `develop` via PRs.
2. At release time, `main` is updated **only** by semantic-release — a
   workflow triggered on push to `main` runs the release job with an
   OIDC-issued npm token, a branch-movement guard, and a
   verify-published-consumption check that installs the just-published
   package and exercises the archive pipeline end-to-end.

## npm

The package is published to the npm registry as
[`@cda/archi-semantic-core`](https://www.npmjs.com/package/@cda/archi-semantic-core)
with provenance attestation (OIDC). The latest published version is always:

```sh
npm view @cda/archi-semantic-core version
```

## GitHub releases

Each version also produces a GitHub Release with the same notes, tagged
`v<version>`. The releases list:
[releases](https://github.com/Continuous-DrivenArchitecture/archi-semantic-core/releases).
