/** Visual position/size of a diagram object or note within a view. */
export interface ArchiBounds {
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

/** A single intermediate waypoint on a diagram connection. */
export interface ArchiBendpoint {
  startX: number | null;
  startY: number | null;
  endX: number | null;
  endY: number | null;
}

/**
 * A visual node within a view: an Archi `DiagramObject` (a visual
 * representation of an `ArchiElement`) or any other non-Note visual
 * container Archi may place in a diagram (e.g. a `Group`, which has no
 * underlying semantic element). Any such node is preserved generically —
 * the parser does not require it to be a recognized "DiagramObject" type.
 */
export interface ArchiDiagramObject {
  id: string;
  name: string | null;
  /** Verbatim `xsi:type` attribute, e.g. "archimate:DiagramObject" or "archimate:Group". */
  xsiType: string;
  viewId: string;
  /** Id of the parent diagram object, or null if directly owned by the view. */
  parentId: string | null;
  /** Id of the referenced semantic element, or null for pure visual containers (e.g. Group). */
  archimateElementId: string | null;
  /**
   * Id of the referenced `IDiagramModel` (native `model` attribute),
   * present only on a `DiagramModelReference` node — Archi's "insert view
   * as reference" visual object. `null` for every other diagram-object
   * type, including `Group` — `xsiType`, not `archimateElementId`, is the
   * correct discriminator between the two: both have a null
   * `archimateElementId`, but only a `DiagramModelReference` has a
   * `referencedModelId`. The referenced id may point at any `IDiagramModel`
   * (an ArchiMate diagram, or a Sketch/Canvas view), not only another
   * `ArchiView`.
   */
  referencedModelId: string | null;
  bounds: ArchiBounds | null;
  /** Raw `textPosition` attribute (a coded value, not parsed to a number). */
  textPosition: string | null;
  /** Raw `textAlignment` attribute (a coded value, not parsed to a number). */
  textAlignment: string | null;
  /** Ids of diagram objects nested directly inside this one. */
  childrenIds: string[];
  /** Ids of diagram connections whose source is this diagram object. */
  connectionIds: string[];
}

/**
 * A visual connection between two diagram objects (an Archi
 * `sourceConnection`), typically representing an underlying ArchiMate
 * relationship.
 */
export interface ArchiDiagramConnection {
  id: string;
  /** Verbatim `xsi:type` attribute, e.g. "archimate:Connection". */
  xsiType: string;
  viewId: string;
  /** Id of the source ArchiDiagramObject — a VISUAL id, not a semantic element id. */
  sourceId: string;
  /** Id of the target ArchiDiagramObject — a VISUAL id, not a semantic element id. */
  targetId: string;
  /**
   * Id of the referenced semantic relationship (from `archimateRelationship`,
   * falling back to the legacy `relationship` attribute). Legitimately null
   * for a plain visual link with no semantic meaning (e.g. a Note-to-Note
   * connector).
   */
  archimateRelationshipId: string | null;
  bendpoints: ArchiBendpoint[];
}

/** A free-text diagram note (an Archi `Note`). */
export interface ArchiNote {
  id: string;
  name: string | null;
  viewId: string;
  /** Id of the parent diagram object, or null if directly owned by the view. */
  parentId: string | null;
  content: string | null;
  bounds: ArchiBounds | null;
  /** Raw `textAlignment` attribute (a coded value, not parsed to a number). */
  textAlignment: string | null;
  borderType: string | null;
}
