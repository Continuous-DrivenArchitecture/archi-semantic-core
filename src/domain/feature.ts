/**
 * A native Archi `<feature name="..." value="..."/>` entry — Archi's own
 * open-ended extensibility mechanism for attaching new data to a diagram
 * object, connection, or note without changing the underlying XSD. Label
 * Expressions (`name="labelExpression"`) are the best-known use of this,
 * but the parser captures every feature generically rather than special-
 * casing that one name.
 */
export interface ArchiFeature {
  name: string;
  value: string;
}
