import type { ArchiProperty } from './property.js';

/**
 * A semantic ArchiMate element (e.g. BusinessActor, ApplicationComponent,
 * TechnologyService). Covers any Archi element type generically — the
 * parser does not hardcode a fixed catalogue of type names.
 */
export interface ArchiElement {
  id: string;
  name: string | null;
  /** Verbatim `xsi:type` attribute, e.g. "archimate:BusinessActor". */
  xsiType: string;
  /** Namespace-prefix-stripped semantic type, e.g. "BusinessActor". */
  type: string;
  folderId: string;
  folderPath: string;
  documentation: string | null;
  properties: ArchiProperty[];
}
