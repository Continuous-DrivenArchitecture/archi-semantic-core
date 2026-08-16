# Runbooks

Operational procedures for maintaining `Continuous-DrivenArchitecture`
repositories: step-by-step recipes, one per file, named after the action
they perform (kebab-case, imperative where it reads naturally).

| Runbook | Description |
|---|---|
| [`create-new-repo.md`](create-new-repo.md) / [`create-new-repo.es.md`](create-new-repo.es.md) | Stand up a new library repository end-to-end: sentinel GitHub App, main ruleset, OIDC publishing, pinned actions, first release verification |

## Conventions

- One runbook per operational task; name it for the action (`create-…`, `rotate-…`, `recover-…`).
- Kebab-case filenames; language variants with the standard `.es.md` suffix.
- Add the entry to the index table above when a new runbook lands.
