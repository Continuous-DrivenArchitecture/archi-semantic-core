---
title: Structural validation in CI
description: Gate your merge pipeline on model integrity with human-readable reports.
---

`validateArchiModel` is a natural pipeline gate: run it in a pre-commit hook
or a CI step and let the exit code block merges.

## A reusable check script

```ts
// scripts/validate-model.mts
import { readFile } from 'node:fs/promises';
import { parseArchiModel, validateArchiModel } from '@cda/archi-semantic-core';
import { extractArchiModelXml } from '@cda/archi-semantic-core/archive';

const filePath = process.argv[2];
if (!filePath) {
  console.error('usage: node validate-model.mts <model.archimate>');
  process.exit(2);
}

const bytes = await readFile(filePath);
const model = parseArchiModel(extractArchiModelXml(bytes));
const { valid, errors } = validateArchiModel(model);

for (const issue of errors) {
  console.error(`[${issue.code}] ${issue.path} — ${issue.message}`);
}

if (!valid) {
  console.error(`Model is not valid: ${errors.length} issue(s).`);
  process.exit(1);
}

console.log(`Model OK: ${model.elements.length} elements, ` +
  `${model.relationships.length} relationships, ${model.views.length} views.`);
```

## Wire it into your pipeline

Pre-commit hook (e.g. via lefthook, husky or a plain git hook):

```sh
node scripts/validate-model.mts "models/CoreModel.archimate"
```

CI step (GitHub Actions example):

```yaml
- name: Validate architecture model
  run: node scripts/validate-model.mts models/CoreModel.archimate
```

## Why `extractArchiModelXml` first

The `.archimate` file may be a zip archive (see
[Working with .archimate archives](/getting-started/archives/)); reading raw
bytes and passing them through `extractArchiModelXml` covers both shapes
before parsing. The `/archive` subpath import is fine here — CI runs on
Node.

## Output conventions

Use the exit code for gating and the report for humans: every
[`ArchiValidationIssue`](/reference/generated/index/interfaces/ArchiValidationIssue/)
already carries a `path` locator into the model
(e.g. `relationships[rel-3].sourceId`) plus a `code` you can match on
(`broken-relationship-source`, `duplicate-id`, …). Print them all — the
pipeline may fail, but the developer should know exactly what to fix.
