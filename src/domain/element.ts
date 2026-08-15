import type { ArchiProperty } from './property.js';

/**
 * Junction's native AND/OR discriminator (Archi's own `IJunction` constants:
 * `AND_JUNCTION_TYPE = ""`, `OR_JUNCTION_TYPE = "or"`).
 */
export type ArchiJunctionType = 'And' | 'Or';

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
  /** Ids of `ArchiProfile` entries (Specializations/Profiles) this element references, via the native `profiles` attribute. Empty when none are set. */
  profiles: string[];
  /**
   * Junction's native AND/OR discriminator, decoded from the native `type`
   * attribute: absent/`""` -> `'And'` (Archi's documented default), `"or"`
   * -> `'Or'`. `null` for every non-Junction element, AND for a Junction
   * whose native `type` attribute holds neither of these two recognized
   * values — never guessed. See {@link rawJunctionType} to recover the
   * original value in that case.
   */
  junctionType: ArchiJunctionType | null;
  /**
   * Verbatim native `type` attribute value for a Junction element (`""`
   * when absent, matching Archi's own declared EMF default literal).
   * `null` for every non-Junction element. Always populated when the
   * element is a Junction, regardless of whether `junctionType` was
   * resolved — nothing about the native value is ever lost, even when it
   * isn't understood.
   */
  rawJunctionType: string | null;
}
