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
  /** Ids of diagram objects that are direct children of the view (not nested). */
  diagramObjectIds: string[];
  /** Ids of every diagram connection anywhere within this view, regardless of nesting depth. */
  diagramConnectionIds: string[];
  /** Ids of notes that are direct children of the view (not nested). */
  noteIds: string[];
}
