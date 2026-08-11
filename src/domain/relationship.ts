import type { ArchiProperty } from './property.js';

/**
 * A semantic ArchiMate relationship (e.g. Serving, Assignment, Realization,
 * Access, Composition, Aggregation, Association). Covers any Archi
 * relationship type generically.
 */
export interface ArchiRelationship {
  id: string;
  name: string | null;
  /** Verbatim `xsi:type` attribute, e.g. "archimate:ServingRelationship". */
  xsiType: string;
  /** Namespace-prefix-stripped semantic type, e.g. "ServingRelationship". */
  type: string;
  /** Id of the source element (occasionally another relationship). */
  sourceId: string;
  /** Id of the target element (occasionally another relationship). */
  targetId: string;
  folderId: string;
  folderPath: string;
  documentation: string | null;
  properties: ArchiProperty[];
}
