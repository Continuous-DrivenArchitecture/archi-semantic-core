/**
 * A native Archi `<profile>` element — either a Specialization (a named
 * sub-type of `conceptType`, e.g. a custom "Web Application" specialization
 * of `ApplicationComponent`, shown in Archi's UI as `<<Web Application>>`)
 * or a generic Profile (a reusable named set of properties with no
 * sub-typing meaning). Both serialize to the same native `<profile>`
 * element; {@link ArchiProfile.specialization} is the only thing telling
 * them apart. Referenced by elements/relationships via their own
 * `profiles` id list.
 *
 * Confirmed against Archi's own source (`archimate.ecore`'s `Profile`
 * EClass and `IProfile.java`), not just observed sample files — a
 * specialization/profile with no example in any sample file this package
 * was developed against.
 */
export interface ArchiProfile {
  id: string;
  name: string | null;
  /**
   * The ArchiMate concept type (semantic type, e.g. `"ApplicationComponent"`)
   * this profile/specialization restricts to. `null` if the native
   * `conceptType` attribute is absent.
   */
  conceptType: string | null;
  /**
   * `true` for a Specialization, `false` for a generic Profile. Defaults to
   * `true` (Archi's own documented EMF default) when the native
   * `specialization` attribute is absent.
   */
  specialization: boolean;
  /**
   * Native `imagePath` attribute — a reference to a custom icon image
   * (e.g. `"images/abc123.png"`), typically only resolvable when the
   * source `.archimate` file is the zip-archive variant (see
   * `extractArchiModelXml`) that bundles an `images/` entry alongside
   * `model.xml`. `null` if none is set. Not resolved to image bytes; this
   * package only preserves the reference.
   */
  imagePath: string | null;
}
