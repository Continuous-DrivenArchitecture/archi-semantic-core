import type { ArchiFolder } from './folder.js';
import type { ArchiElement } from './element.js';
import type { ArchiRelationship } from './relationship.js';
import type { ArchiView } from './view.js';
import type { ArchiDiagramObject, ArchiDiagramConnection, ArchiNote } from './diagram.js';
import type { ArchiProperty } from './property.js';
import type { ArchiProfile } from './profile.js';

/** Top-level metadata read from the `<archimate:model>` root element. */
export interface ArchiModelMetadata {
  id: string;
  name: string;
  version: string;
  /**
   * The model's native `<purpose>` element — Archi's own name for its
   * model-level narrative field (there is no separate, generic
   * "documentation" concept at the model root, unlike elements,
   * relationships, views, and folders, which all have one).
   */
  purpose: string | null;
  properties: ArchiProperty[];
}

/**
 * The parsed, semantic representation of an Archi `.archimate` model file.
 *
 * Every collection is flat (not nested) and preserves the order entities
 * appear in the source XML. Cross-references between entities (e.g. a
 * relationship's `sourceId`, a diagram object's `archimateElementId`) are
 * plain string ids — look them up in the relevant array, or build a `Map`
 * keyed by `id` if repeated lookups are needed.
 */
export interface ArchiModel {
  metadata: ArchiModelMetadata;
  folders: ArchiFolder[];
  elements: ArchiElement[];
  relationships: ArchiRelationship[];
  views: ArchiView[];
  diagramObjects: ArchiDiagramObject[];
  diagramConnections: ArchiDiagramConnection[];
  notes: ArchiNote[];
  /** Specializations and generic Profiles declared at the model root — see {@link ArchiProfile}. */
  profiles: ArchiProfile[];
}
