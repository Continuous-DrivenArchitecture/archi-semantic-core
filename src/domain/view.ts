import type { ArchiProperty } from './property.js';

/** An Archi diagram/view definition (an `archimate:ArchimateDiagramModel`). */
export interface ArchiView {
  id: string;
  name: string | null;
  /** Verbatim `xsi:type` attribute, e.g. "archimate:ArchimateDiagramModel". */
  xsiType: string;
  /** Namespace-prefix-stripped semantic type, e.g. "ArchimateDiagramModel". */
  type: string;
  folderId: string;
  folderPath: string;
  documentation: string | null;
  properties: ArchiProperty[];
  /**
   * Native Archi viewpoint code (e.g. `"layered"`, `"organization"`) from
   * the `viewpoint` attribute — an internal lowercase code, not a
   * human-readable name. `null` when unset (Archi's own default is an
   * empty string, meaning "no viewpoint restriction").
   */
  viewpoint: string | null;
  /**
   * Native `connectionRouterType` attribute — Archi's own numeric code for
   * how connections are routed in this view (`IDiagramModel.CONNECTION_ROUTER_BENDPOINT
   * = 0`, the default, manual bendpoints; `CONNECTION_ROUTER_MANHATTAN = 2`,
   * orthogonal routing; Archi's source reserves `1` as a removed, unused
   * option). Preserved as the raw number rather than decoded to a named
   * enum, like `ArchiDiagramObject.figureType` — its meaning is
   * Archi-UI-specific and the numbering has already changed once. `null`
   * when absent (Archi's own default is `0`, meaning "manual bendpoints").
   */
  connectionRouterType: number | null;
  /** Ids of diagram objects that are direct children of the view (not nested). */
  diagramObjectIds: string[];
  /** Ids of every diagram connection anywhere within this view, regardless of nesting depth. */
  diagramConnectionIds: string[];
  /** Ids of notes that are direct children of the view (not nested). */
  noteIds: string[];
}
