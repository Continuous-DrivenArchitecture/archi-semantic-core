import type { ArchiProperty } from './property.js';

/**
 * Native Archi access-mode enumeration for `AccessRelationship`, decoded
 * from the raw `accessType` attribute (`0`-`3`). Named after Archi's own
 * `IAccessRelationship` constants (`WRITE_ACCESS`, `READ_ACCESS`,
 * `UNSPECIFIED_ACCESS`, `READ_WRITE_ACCESS`) rather than the ArchiMate Open
 * Exchange `AccessTypeEnum` vocabulary, which uses "Access" for the
 * unspecified case — a different format's naming, not this one's.
 */
export type ArchiAccessType = 'Write' | 'Read' | 'Unspecified' | 'ReadWrite';

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
  /** Ids of `ArchiProfile` entries (Specializations/Profiles) this relationship references, via the native `profiles` attribute. Empty when none are set. */
  profiles: string[];
  /**
   * `AccessRelationship`'s access mode. `null` for every other relationship
   * type; always resolved to a value (defaulting to `'Write'`, Archi's own
   * documented default) when the relationship is an `AccessRelationship`.
   */
  accessType: ArchiAccessType | null;
  /**
   * `InfluenceRelationship`'s free-text modifier (native `strength`
   * attribute, e.g. `"+"`, `"-"`). `null` for every other relationship
   * type, and also `null` when the attribute is blank or absent (the
   * native default is genuinely "no modifier set", unlike `accessType`).
   */
  strength: string | null;
  /**
   * `AssociationRelationship`'s directedness. `null` for every other
   * relationship type; always resolved to a boolean (defaulting to
   * `false`, Archi's own type default) when the relationship is an
   * `AssociationRelationship`.
   */
  directed: boolean | null;
}
