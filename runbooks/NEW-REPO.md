# Recipe: new library / GitHub repo

End-to-end checklist for standing up a `Continuous-DrivenArchitecture`
repository with automated releases, identity governance, and a protected
`main` branch. ~45 minutes once per repo. This recipe was first applied
to `archi-semantic-core` (see its history for real-world examples).

[![English](./.github/assets/badges/lang-en-active.svg)](NEW-REPO.md) [![Español](./.github/assets/badges/lang-es.svg)](NEW-REPO.es.md)

---

## Phase 0 — Definitions

- Org: `Continuous-DrivenArchitecture` · Package: `@cda/<name>` · Default branch: `main`
- Convention: **Conventional Commits** (`feat:` = minor, `fix:` = patch, `!` = breaking)
- Decide and document scope: what the library exposes and what it does
  *not* ("What this is not" in the README)

## Phase 1 — On GitHub (UI, once per repo)

1. **Create the repo** in the org, public, default branch `main`, **no README**
   (avoids the initial bot-authored commit).
2. **The sentinel** (once per org, reused across repos): your account/org →
   Developer settings → GitHub Apps → New:
   - Name: `cda-release-sentinel` · Homepage: `https://github.com/Continuous-DrivenArchitecture/<repo>`
   - Permissions → Repository → **Contents: Read and write** (everything else default)
   - **No webhook, no events, no OAuth** (Callback URL empty)
   - *Only on this account* · Save the **App ID** + **private key** (`.pem`,
     downloadable only once)
3. **Install the app** on the new repo.
4. **Repo secrets** (Settings → Secrets and variables → Actions):
   - `RELEASE_APP_ID` → the number
   - `RELEASE_APP_PRIVATE_KEY` → full `.pem` content (BEGIN/END lines included)
   - Nothing else: npm publishes via **OIDC**, no tokens
5. **Ruleset on `main`** (Settings → Rules → Rulesets → New branch ruleset):
   - Target: `main` · Bypass list: **the sentinel app only**
   - ✅ Require a pull request before merging (1 approval)
   - ✅ Require status checks: `validate`, `audit`, `sbom`
   - ✅ Block force pushes
6. **Dependabot**: `.github/dependabot.yml` (version updates) + Settings →
   Code security → **enable alerts and security updates** (manual, no file).
7. **npm trusted publishing** (once the package exists on npm): npmjs.com →
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
       ["@semantic-release/changelog", { "changelogFile": "CHANGELOG.md" }],
       ["@semantic-release/npm", { "provenance": true }],
       ["@semantic-release/git", {
         "assets": ["package.json", "package-lock.json", "CHANGELOG.md", "README*.md", ".github/assets/badges"],
         "message": "chore(release): ${nextRelease.version} [skip ci]"
       }],
       "@semantic-release/github"
     ]
   }
   ```
4. **Workflows** (`.github/workflows/`), with **every action pinned to a full
   commit SHA** (never floating tags):
   - `ci.yml`: `on: pull_request` + `push` (all branches). Jobs: `validate`
     (npm ci, typecheck, build, test, `npm run badges`), `audit`
     (`npm audit --omit=dev --audit-level=high`), `sbom` (npm sbom →
     upload artifact).
   - `release.yml`: `on: push` to `main`. Mint a sentinel token with
     `actions/create-github-app-token@<sha>` (secrets `RELEASE_APP_ID` /
     `RELEASE_APP_PRIVATE_KEY`), pass it to `actions/checkout` and to
     semantic-release as `GITHUB_TOKEN`. Set the **human commit identity**:
     `GIT_AUTHOR_NAME` / `GIT_AUTHOR_EMAIL` / `GIT_COMMITTER_*` = maintainer
     (not the bot). `permissions: contents: write, issues: write,
     pull-requests: write, id-token: write`.
   - `dependency-health.yml`: scorecard / dependency audit (as in
     `archi-semantic-core`).
   - Resolve an action's SHA: `https://api.github.com/repos/<owner>/<action>/releases/latest`
     → `target_commitish` (or by tag via API).
5. **`.github/dependabot.yml`**: `github-actions` + `npm`, weekly,
   `open-pull-requests-limit: 3`.
6. **`CONTRIBUTING.md`**: Conventional Commits, never touch
   `package.json`/`CHANGELOG.md` manually, SHA rule, branching strategy
   (develop/main, post-release sync).
7. **README** (7 languages) + `.github/assets/badges` (the
   `scripts/generate-badges.mjs` script regenerates badges and the `?v=`
   cache-busting key in the READMEs; they refresh automatically in the CI
   run on the release commit). `docs/` is reserved for the future public
   Starlight site (kept separate from `.github/` recipes).
8. **Branches**: `git checkout -b develop` — work lives there; `main` only
   receives PRs.

## Phase 3 — First release verification

1. `git push -u origin develop` → CI green on develop.
2. PR `develop → main` (first commit: `chore(init)` or `docs:`) → merge
   (the ruleset enforces CI).
3. The merge triggers the 0.1.0 release. Verify:
   - `chore(release): 0.1.0` commit **authored by a human**, tag `v0.1.0`
     pointing at main
   - npm 0.1.0 published with **provenance** (OIDC, no token)
   - GitHub Release with generated notes
   - Contributor graph: humans only
4. Sync: `git checkout develop && git merge main && git push origin develop`.

## Phase 4 — Maintenance

- Merge Dependabot PRs after review (watch out for **majors**, v4→v7
  changes compatibility).
- Every release is automatic: version, CHANGELOG, badges, npm, GitHub Release.
- After each release: sync `develop` (Phase 3, step 4).
- Golden rule: **never reuse a failed tag or version** — bump instead.

## Known pitfalls (lessons from `archi-semantic-core`)

- **There is no "GitHub Actions" entry in the ruleset bypass list**, and the
  `GITHUB_TOKEN` **cannot** bypass rulesets (GH006/GH013): the
  `chore(release)` push to `main` fails unless a GitHub App is the bypass
  actor. That is why the sentinel exists.
- Sentinel pushes **do trigger workflows** (unlike `GITHUB_TOKEN`): the
  `[skip ci]` marker in the release message prevents recursion.
- **Do not delete `NPM_TOKEN`** before enrolling trusted publishing on
  npmjs.com, or the next release fails at publish time.
- If semantic-release publishes without a tag/commit (duplicate version due
  to orphaned history): point the tag at `main` and **recreate the release
  manually** so the author is the human.
- The bot may leave `refs/notes/semantic-release-*` that pollute the
  contributor graph: remove them with `git push origin --delete refs/notes/<ref>`.
- GitHub action tags (v4/v7) are **lightweight** (mutable): that is why
  actions are pinned to SHAs.