import type { ArchiProperty } from './property.js';

/**
 * A folder node from the Archi model tree (e.g. the standard "Business",
 * "Application", "Relations", "Views" buckets, plus any user-created
 * sub-folders).
 */
export interface ArchiFolder {
  id: string;
  name: string | null;
  /**
   * Raw `type` attribute, e.g. "business" | "application" | "technology" |
   * "motivation" | "strategy" | "implementation_migration" | "other" |
   * "relations" | "diagrams". Left as a plain string (not a hardcoded
   * union) so folder types Archi introduces later are preserved as-is.
   */
  type: string;
  parentId: string | null;
  /** Slash-joined folder names from the model root down to this folder. */
  path: string;
  /**
   * Ids of elements/relationships/views directly inside this folder.
   * Does NOT include sub-folder ids — subfolder hierarchy is expressed via
   * each subfolder's own `parentId`.
   */
  containedIds: string[];
  documentation: string | null;
  properties: ArchiProperty[];
}
