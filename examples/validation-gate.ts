import { validateArchiModel, type ArchiModel, type ArchiValidationIssue } from '../src/index.js';

/**
 * Validation as a pipeline gate: turn {@link ArchiModel} into a
 * human-readable report, and a hard check that throws on invalid models —
 * the shape a CI step or a pre-commit hook can consume.
 *
 * `validateArchiModel` checks structural integrity (missing/duplicate
 * ids, dangling references between entities), not architecture quality.
 */

/** Human-readable multi-line report of every validation issue. */
export function validationReport(model: ArchiModel): string {
  const { valid, errors } = validateArchiModel(model);
  if (valid) return 'Model is structurally valid.';
  return ['Model is INVALID:', ...errors.map((issue) => `- [${issue.code}] ${issue.message} (${issue.path})`)].join('\n');
}

/** Throws with the full report when the model has structural issues — a gate, not a linter. */
export function assertValidModel(model: ArchiModel): void {
  const { valid } = validateArchiModel(model);
  if (!valid) {
    throw new Error(validationReport(model));
  }
}

/** Groups issues by code so a gate can summarize (e.g. fail on duplicate ids only). */
export function issuesByCode(model: ArchiModel): Map<string, ArchiValidationIssue[]> {
  const { errors } = validateArchiModel(model);
  const byCode = new Map<string, ArchiValidationIssue[]>();
  for (const issue of errors) {
    const bucket = byCode.get(issue.code);
    if (bucket) bucket.push(issue);
    else byCode.set(issue.code, [issue]);
  }
  return byCode;
}