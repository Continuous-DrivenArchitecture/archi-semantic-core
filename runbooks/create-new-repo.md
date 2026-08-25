# Recipe: new library / GitHub repo

End-to-end checklist for standing up a `Continuous-DrivenArchitecture`
repository with automated releases, identity governance, and a protected
`main` branch. ~45 minutes once per repo. This recipe was first applied
to `archi-semantic-core` (see its history for real-world examples).

[![English](../.github/assets/badges/lang-en-active.svg)](create-new-repo.md) [![Español](../.github/assets/badges/lang-es.svg)](create-new-repo.es.md)

---

## Phase 0 — Definitions

- Org: `Continuous-DrivenArchitecture` · Package: `@cda/<name>` · Default branch: `main`
- Convention: **Conventional Commits** (`feat:` = minor, `fix:` = patch, `!` = breaking)
- Decide and document scope: what the library exposes and what it does
  *not* ("What this is not" in the README)

## Phase 1 — On GitHub (UI, once per repo)

1. **Create the repo** in the org, public, default branch `main`, **no README**
   (avoids the initial bot-authored commit).
2. **Repo secrets**: none required — npm publishes via **OIDC** (Trusted
   Publishing) and the release workflow uses the ordinary, ephemeral
   `GITHUB_TOKEN`. No GitHub App, no long-lived credential to provision.
3. **Ruleset on `main`** (Settings → Rules → Rulesets → New branch ruleset):
   - Target: `main` · Bypass list: **empty** (no identity ever needs to push
     directly to `main`, including release automation)
   - ✅ Require a pull request before merging (1 approval)
   - ✅ Require status checks: `ci-required` (a single, stable,
     matrix-independent job — see Phase 2 step 4)
   - ✅ Block force pushes · ✅ Block branch deletion
4. **Dependabot**: `.github/dependabot.yml` (version updates) + Settings →
   Code security → **enable alerts and security updates** (manual, no file).
5. **npm trusted publishing** (once the package exists on npm): npmjs.com →
   package Settings → "Publish from GitHub Actions" → add
   `Continuous-DrivenArchitecture/<repo>`. Revoke old tokens and enforce
   2FA on the npm account.

## Phase 2 — Locally

1. `git init`; set identity (`git config user.name` / `user.email`); branch `main`.
2. `npm init` → `name: @cda/<name>`, `repository.url: https://github.com/Continuous-DrivenArchitecture/<repo>.git`.
3. **`.releaserc.json`**:
   ```json
   {
     "branches": ["main"],
     "plugins": [
       "@semantic-release/commit-analyzer",
       "@semantic-release/release-notes-generator",
       ["@semantic-release/npm", { "provenance": true }],
       "@semantic-release/github"
     ]
   }
   ```
   No `@semantic-release/git` and no `@semantic-release/changelog`: nothing
   is ever committed back to `main` during a release (CDA Model B). The
   GitHub Release notes are the changelog of record.
4. **Workflows** (`.github/workflows/`), with **every action pinned to a full
   commit SHA** (never floating tags):
   - `ci.yml`: `on: pull_request` + `push` (all branches). Jobs: `validate`
     (npm ci, typecheck, build, test), `audit`
     (`npm audit --omit=dev --audit-level=high`), `sbom` (npm sbom →
     upload artifact), plus a stable **`ci-required`** job (`needs: [validate,
     audit, sbom]`, `if: always()`, fails unless every needed job's
     `.result` is `success`) — this is the one job name the `main` ruleset
     requires, so adding/removing a Node version in the `validate` matrix
     never touches the ruleset.
   - `release.yml`: `on: push` to `main`. Ordinary `actions/checkout` +
     `semantic-release`, using `secrets.GITHUB_TOKEN` directly — no App, no
     installation token, no bypass identity, because nothing is pushed back
     to `main`. `permissions: contents: write, id-token: write` (add
     `issues`/`pull-requests: write` only if `@semantic-release/github`'s
     issue/PR-comment behavior is genuinely needed).
   - `dependency-health.yml`: scorecard / dependency audit (as in
     `archi-semantic-core`).
   - Resolve an action's SHA: `https://api.github.com/repos/<owner>/<action>/releases/latest`
     → `target_commitish` (or by tag via API).
5. **`.github/dependabot.yml`**: `github-actions` + `npm`, weekly,
   `open-pull-requests-limit: 3`. Omit `target-branch` — it defaults to the
   repository's default branch (`main`).
6. **`CONTRIBUTING.md`**: Conventional Commits, never touch `package.json`
   manually, SHA rule, main-only branching (short-lived `feature/*`,
   `fix/*`, `chore/*`, ... branches, squash-merged into `main`).
7. **README** (7 languages) + `.github/assets/badges`. The
   `scripts/generate-badges.mjs` script regenerates the SVGs, but under
   Model B nothing commits the regenerated files back to the repo (no
   release commit) — badges are refreshed manually (re-run the script and
   commit) when they drift, not automatically at release time. `docs/` is
   reserved for the future public Starlight site (kept separate from
   `.github/` recipes).
8. **Branches**: work directly on short-lived branches off `main`; `main`
   only receives PRs.

## Phase 3 — First release verification

1. Open a PR from a short-lived branch (first commit: `chore(init)` or
   `docs:`) into `main` → merge (the ruleset enforces `ci-required`).
2. The merge triggers the 0.1.0 release. Verify:
   - Tag `v0.1.0` pointing at the merged commit on `main` (no extra commit
     was added)
   - npm 0.1.0 published with **provenance** (OIDC, no token)
   - GitHub Release with generated notes

## Phase 4 — Maintenance

- Merge Dependabot PRs after review (watch out for **majors**, v4→v7
  changes compatibility).
- Every release is automatic: version, npm, GitHub Release. `package.json`
  on `main` and `CHANGELOG.md` are not touched by the release itself.
- Golden rule: **never reuse a failed tag or version** — bump instead.

## Known pitfalls (lessons from `archi-semantic-core`)

- **Do not delete `NPM_TOKEN`** before enrolling trusted publishing on
  npmjs.com, or the next release fails at publish time.
- If semantic-release publishes without a tag/commit (duplicate version due
  to orphaned history): point the tag at `main` and **recreate the release
  manually** so the author is the human.
- The bot may leave `refs/notes/semantic-release-*` that pollute the
  contributor graph: remove them with `git push origin --delete refs/notes/<ref>`.
- GitHub action tags (v4/v7) are **lightweight** (mutable): that is why
  actions are pinned to SHAs.