# Receta: nueva librería / repo GitHub

Checklist end-to-end para levantar un repo de `Continuous-DrivenArchitecture`
con releases automáticos, gobernanza de identidad y `main` protegido.
~45 minutos una vez por repo. Esta receta se aplicó por primera vez en
`archi-semantic-core` (ver su historial para ejemplos reales).

[![English](../.github/assets/badges/lang-en.svg)](create-new-repo.md) [![Español](../.github/assets/badges/lang-es-active.svg)](create-new-repo.es.md)

---

## Fase 0 — Definiciones

- Org: `Continuous-DrivenArchitecture` · Paquete: `@cda/<nombre>` · Default branch: `main`
- Convención: **Conventional Commits** (`feat:` = minor, `fix:` = patch, `!` = breaking)
- Decidir y documentar el alcance: qué expone la librería y qué *no* ("What this is not" en el README)

## Fase 1 — En GitHub (UI, una vez por repo)

1. **Crear el repo** en la org, público, default branch `main`, **sin README** (evita el commit inicial del bot).
2. **Secrets del repo**: ninguno es necesario — npm publica por **OIDC**
   (Trusted Publishing) y el workflow de release usa el `GITHUB_TOKEN`
   ordinario y efímero. Sin GitHub App, sin credencial de larga duración
   que aprovisionar.
3. **Ruleset sobre `main`** (Settings → Rules → Rulesets → New branch ruleset):
   - Target: `main` · Bypass list: **vacío** (ninguna identidad necesita
     pushear directo a `main`, tampoco la automatización de release)
   - ✅ Require a pull request before merging (1 approval)
   - ✅ Require status checks: `ci-required` (un único job estable,
     independiente de la matriz — ver Fase 2 paso 4)
   - ✅ Block force pushes · ✅ Block branch deletion
4. **Dependabot**: `.github/dependabot.yml` (version updates) + Settings → Code security → **enable alerts y security updates** (esto es manual, no va por archivo).
5. **npm trusted publishing** (cuando el paquete exista publicado): npmjs.com → Settings del paquete → "Publish from GitHub Actions" → agregar `Continuous-DrivenArchitecture/<repo>`. Revocar tokens viejos y activar 2FA obligatoria en la cuenta npm.

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
       ["@semantic-release/npm", { "provenance": true }],
       "@semantic-release/github"
     ]
   }
   ```
   Sin `@semantic-release/git` ni `@semantic-release/changelog`: nunca se
   commitea nada de vuelta a `main` durante un release (CDA Model B). Las
   notas del GitHub Release son el changelog de referencia.
4. **Workflows** (`.github/workflows/`), con **toda acción pineada a SHA** (nunca tags flotantes):
   - `ci.yml`: `on: pull_request` + `push` (todos los branches). Jobs:
     `validate` (npm ci, typecheck, build, test), `audit`
     (`npm audit --omit=dev --audit-level=high`), `sbom` (npm sbom →
     upload artifact), más un job estable **`ci-required`**
     (`needs: [validate, audit, sbom]`, `if: always()`, falla salvo que
     el `.result` de cada job necesario sea `success`) — es el único
     nombre de job que exige el ruleset de `main`, así que agregar/quitar
     una versión de Node en la matriz de `validate` nunca toca el ruleset.
   - `release.yml`: `on: push` a `main`. `actions/checkout` ordinario +
     `semantic-release`, usando `secrets.GITHUB_TOKEN` directo — sin App,
     sin installation token, sin identidad de bypass, porque no se pushea
     nada de vuelta a `main`. `permissions: contents: write, id-token: write`
     (agregar `issues`/`pull-requests: write` solo si el comportamiento de
     comentarios en issues/PRs de `@semantic-release/github` realmente
     hace falta).
   - `dependency-health.yml`: scorecard / auditoría de dependencias (como en `archi-semantic-core`).
   - Resolver SHA de una acción: `https://api.github.com/repos/<owner>/<action>/releases/latest` → `target_commitish` (o por tag vía API).
5. **`.github/dependabot.yml`**: `github-actions` + `npm`, semanal,
   `open-pull-requests-limit: 3`. Omitir `target-branch` — usa por defecto
   el branch por defecto del repo (`main`).
6. **`CONTRIBUTING.md`**: Conventional Commits, no tocar `package.json` a
   mano, regla del SHA, ramas solo-main (branches de vida corta
   `feature/*`, `fix/*`, `chore/*`, ... squash-mergeados a `main`).
7. **README** (7 idiomas) + `.github/assets/badges`. El script
   `scripts/generate-badges.mjs` regenera los SVG, pero bajo Model B nada
   commitea los archivos regenerados de vuelta al repo (no hay commit de
   release) — los badges se refrescan a mano (re-ejecutar el script y
   commitear) cuando quedan desactualizados, no automáticamente en cada
   release. `docs/` queda reservado para el futuro sitio público Starlight
   (separado de las recetas de `.github/`).
8. **Ramas**: trabajar directo en branches de vida corta a partir de
   `main`; `main` solo recibe PRs.

## Fase 3 — Verificación del primer release

1. Abrir un PR desde un branch de vida corta (primer commit: `chore(init)`
   o `docs:`) hacia `main` → merge (el ruleset exige `ci-required`).
2. El merge dispara el release 0.1.0. Verificar:
   - Tag `v0.1.0` apuntando al commit mergeado en `main` (no se agregó
     ningún commit extra)
   - npm 0.1.0 publicado con **provenance** (OIDC, sin token)
   - GitHub Release con notas generadas

## Fase 4 — Mantenimiento

- Mergear PRs de Dependabot tras revisar (cuidado con los **majors**, v4→v7 cambia compat).
- Cada release es automático: versión, npm, GitHub Release. `package.json`
  en `main` y `CHANGELOG.md` no los toca el release en sí.
- Regla de oro: **jamás reutilizar un tag o versión fallida** — subir de versión.

## Trampas conocidas (lecciones de `archi-semantic-core`)

- **No borrar `NPM_TOKEN`** antes de enrolar trusted publishing en npmjs.com, o el próximo release falla al publicar.
- Si semantic-release publica sin tag/commit (versión duplicada por historia huérfana): apuntar el tag a main y **recrear la release manualmente** para que el autor sea el humano.
- El bot puede dejar `refs/notes/semantic-release-*` que ensucian el gráfico de contribuidores: borrarlas con `git push origin --delete refs/notes/<ref>`.
- Las acciones de GitHub tienen tags v4/v7 **lightweight** (móviles): por eso se pinean a SHA.