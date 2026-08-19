import type { ArchiFeature } from './feature.js';

/** Visual position/size of a diagram object or note within a view. */
export interface ArchiBounds {
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

/**
 * Bold/italic flags decoded from a native `font` attribute's SWT style
 * bitmask (bit 0 = bold, bit 1 = italic). Only produced when the `font`
 * string is in the recognized shape — never guessed.
 */
export interface ArchiFontStyle {
  bold: boolean;
  italic: boolean;
}

/**
 * Native visual styling of a diagram object, connection, or note — Archi's
 * own `fillColor`/`lineColor`/`fontColor`/`font` attributes, verbatim where
 * possible. `null` fields mean the source XML did not set that attribute,
 * not that parsing failed.
 */
export interface ArchiStyle {
  /** Native `fillColor` attribute, e.g. `"#ffffff"`. */
  fillColor: string | null;
  /** Native `lineColor` attribute, e.g. `"#ff0000"`. */
  lineColor: string | null;
  /** Native `fontColor` attribute, e.g. `"#000000"`. */
  fontColor: string | null;
  /**
   * Verbatim native `font` attribute — Archi's own SWT `FontData` string
   * serialization (e.g. `"1|Segoe UI|9.0|1|WINDOWS|..."`), preserved as-is
   * even when {@link fontName}/{@link fontSize}/{@link fontStyle} could not
   * be decoded from it.
   */
  font: string | null;
  /** Font family name decoded from {@link font}, or `null` if undecodable. */
  fontName: string | null;
  /** Font size in points decoded from {@link font}, or `null` if undecodable. */
  fontSize: number | null;
  /** Bold/italic flags decoded from {@link font}, or `null` if undecodable. */
  fontStyle: ArchiFontStyle | null;
  /** Native `lineWidth` attribute (line thickness in pixels), or `null` if not set. */
  lineWidth: number | null;
  /**
   * Native `alpha` attribute — fill opacity, `0`-`255` (Archi's own EMF
   * default is `255`, fully opaque). Only ever set on a `DiagramObject`,
   * `Group`, `DiagramModelReference`, or `Note` — a `Connection` has no
   * fill, so this is always `null` on connection styles. `null` here means
   * the attribute was absent, not that opacity is `0`.
   */
  alpha: number | null;
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
  /**
   * Raw native `type` attribute — Archi's alternate figure/icon selector for
   * element types that support more than one visual representation (e.g.
   * `"0"`/`"1"`). Not decoded to a named enum: its meaning is
   * figure-specific and only Archi's own UI knows how to interpret it per
   * element type: preserved verbatim, like {@link textPosition}.
   */
  figureType: string | null;
  /**
   * `<documentation>` set directly on this visual object — only meaningful
   * for a Group/DiagramModelReference (`archimateElementId === null`),
   * which has no underlying semantic element to carry documentation
   * instead. `null` when absent (the common case for an element-backed
   * DiagramObject, whose documentation lives on the element itself).
   */
  documentation: string | null;
  /** Native visual styling (fill/line/font color, font), or `null` if none of those attributes were set. */
  style: ArchiStyle | null;
  /** Native `<feature>` entries (e.g. `labelExpression`) — see {@link ArchiFeature}. */
  features: ArchiFeature[];
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
  /**
   * Verbatim `xsi:type` attribute, e.g. "archimate:Connection". `null` when
   * absent — Archi emits some purely visual connections (e.g. a link between
   * two `DiagramModelReference`s) without one. Never fabricated.
   */
  xsiType: string | null;
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
  /** Native visual styling (line/font color, font), or `null` if none of those attributes were set. */
  style: ArchiStyle | null;
  /** Native `<feature>` entries (e.g. `labelExpression`) — see {@link ArchiFeature}. */
  features: ArchiFeature[];
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
  /** Native visual styling (fill/font color, font), or `null` if none of those attributes were set. */
  style: ArchiStyle | null;
  /** Native `<feature>` entries (e.g. `labelExpression`) — see {@link ArchiFeature}. */
  features: ArchiFeature[];
}
