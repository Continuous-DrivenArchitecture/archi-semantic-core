# Receta: nueva librería / repo GitHub

Checklist end-to-end para levantar un repo de `Continuous-DrivenArchitecture`
con releases automáticos, gobernanza de identidad y `main` protegido.
~45 minutos una vez por repo. Esta receta se aplicó por primera vez en
`archi-semantic-core` (ver su historial para ejemplos reales).

[![English](./.github/assets/badges/lang-en.svg)](create-new-repo.md) [![Español](./.github/assets/badges/lang-es-active.svg)](create-new-repo.es.md)

---

## Fase 0 — Definiciones

- Org: `Continuous-DrivenArchitecture` · Paquete: `@cda/<nombre>` · Default branch: `main`
- Convención: **Conventional Commits** (`feat:` = minor, `fix:` = patch, `!` = breaking)
- Decidir y documentar el alcance: qué expone la librería y qué *no* ("What this is not" en el README)

## Fase 1 — En GitHub (UI, una vez por repo)

1. **Crear el repo** en la org, público, default branch `main`, **sin README** (evita el commit inicial del bot).
2. **El sentinel** (una vez por org, se reutiliza en todos los repos): tu cuenta/org → Developer settings → GitHub Apps → New:
   - Nombre: `cda-release-sentinel` · Homepage: `https://github.com/Continuous-DrivenArchitecture/<repo>`
   - Permissions → Repository → **Contents: Read and write** (todo lo demás en default)
   - **Sin webhook, sin eventos, sin OAuth** (Callback URL vacío)
   - *Only on this account* · Guardar **App ID** + **private key** (`.pem`, se descarga una sola vez)
3. **Instalar la app** en el repo nuevo.
4. **Secrets del repo** (Settings → Secrets and variables → Actions):
   - `RELEASE_APP_ID` → el número
   - `RELEASE_APP_PRIVATE_KEY` → contenido completo del `.pem` (líneas BEGIN/END incluidas)
   - Nada más: npm publica por **OIDC**, sin tokens
5. **Ruleset sobre `main`** (Settings → Rules → Rulesets → New branch ruleset):
   - Target: `main` · Bypass list: **solo la app sentinel**
   - ✅ Require a pull request before merging (1 approval)
   - ✅ Require status checks: `validate`, `audit`, `sbom`
   - ✅ Block force pushes
6. **Dependabot**: `.github/dependabot.yml` (version updates) + Settings → Code security → **enable alerts y security updates** (esto es manual, no va por archivo).
7. **npm trusted publishing** (cuando el paquete exista publicado): npmjs.com → Settings del paquete → "Publish from GitHub Actions" → agregar `Continuous-DrivenArchitecture/<repo>`. Revocar tokens viejos y activar 2FA obligatoria en la cuenta npm.

## Fase 2 — En local

1. `git init`; fijar identidad (`git config user.name` / `user.email`); branch `main`.
2. `npm init` → `name: @cda/<nombre>`, `repository.url: https://github.com/Continuous-DrivenArchitecture/<repo>.git`.
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
4. **Workflows** (`.github/workflows/`), con **toda acción pineada a SHA** (nunca tags flotantes):
   - `ci.yml`: `on: pull_request` + `push` (todos los branches). Jobs: `validate` (npm ci, typecheck, build, test, `npm run badges`), `audit` (`npm audit --omit=dev --audit-level=high`), `sbom` (npm sbom → upload artifact).
   - `release.yml`: `on: push` a `main`. Mintear token del sentinel con `actions/create-github-app-token@<sha>` (secrets `RELEASE_APP_ID`/`RELEASE_APP_PRIVATE_KEY`), pasarlo a `actions/checkout` y a semantic-release como `GITHUB_TOKEN`. Fijar la **identidad humana** del commit: `GIT_AUTHOR_NAME`/`GIT_AUTHOR_EMAIL`/`GIT_COMMITTER_*` = mantenedor (no bot). `permissions: contents: write, issues: write, pull-requests: write, id-token: write`.
   - `dependency-health.yml`: scorecard / auditoría de dependencias (como en `archi-semantic-core`).
   - Resolver SHA de una acción: `https://api.github.com/repos/<owner>/<action>/releases/latest` → `target_commitish` (o por tag vía API).
5. **`.github/dependabot.yml`**: `github-actions` + `npm`, semanal, `open-pull-requests-limit: 3`.
6. **`CONTRIBUTING.md`**: Conventional Commits, no tocar `package.json`/`CHANGELOG.md` a mano, regla del SHA, estrategia de ramas (develop/main, sync post-release).
7. **README** (7 idiomas) + `.github/assets/badges` (el script `scripts/generate-badges.mjs` regenera badges y el cache-busting `?v=` de los README; se actualizan solos en el CI del commit de release). `docs/` queda reservado para el futuro sitio público Starlight (separado de las recetas de `.github/`).
8. **Ramas**: `git checkout -b develop` — el trabajo vive ahí; `main` solo recibe PRs.

## Fase 3 — Verificación del primer release

1. `git push -u origin develop` → CI verde en develop.
2. PR `develop → main` (primer commit: `chore(init)` o `docs:`) → merge (te exige CI por el ruleset).
3. El merge dispara el release 0.1.0. Verificar:
   - Commit `chore(release): 0.1.0` **autor = humano**, tag `v0.1.0` apuntando a main
   - npm 0.1.0 publicado con **provenance** (OIDC, sin token)
   - GitHub Release con notas generadas
   - Contributor graph: solo humanos
4. Sync: `git checkout develop && git merge main && git push origin develop`.

## Fase 4 — Mantenimiento

- Mergear PRs de Dependabot tras revisar (cuidado con los **majors**, v4→v7 cambia compat).
- Cada release es automático: versión, CHANGELOG, badges, npm, GitHub Release.
- Tras cada release: sync de `develop` (Fase 3, paso 4).
- Regla de oro: **jamás reutilizar un tag o versión fallida** — subir de versión.

## Trampas conocidas (lecciones de `archi-semantic-core`)

- **No existe "GitHub Actions" en el bypass list** del ruleset, y el `GITHUB_TOKEN` **no puede** bypasear rulesets (GH006/GH013): el push del `chore(release)` falla a menos que uses una GitHub App como bypass actor. Es el motivo del sentinel.
- El push del sentinel **sí dispara workflows** (a diferencia del GITHUB_TOKEN): el `[skip ci]` en el mensaje del release evita recursión.
- **No borrar `NPM_TOKEN`** antes de enrolar trusted publishing en npmjs.com, o el próximo release falla al publicar.
- Si semantic-release publica sin tag/commit (versión duplicada por historia huérfana): apuntar el tag a main y **recrear la release manualmente** para que el autor sea el humano.
- El bot puede dejar `refs/notes/semantic-release-*` que ensucian el gráfico de contribuidores: borrarlas con `git push origin --delete refs/notes/<ref>`.
- Las acciones de GitHub tienen tags v4/v7 **lightweight** (móviles): por eso se pinean a SHA.