/**
 * Internal helpers for walking fast-xml-parser's output. Not part of the
 * public API — consumers should never need to know these exist.
 */

/** A parsed XML element as produced by fast-xml-parser (attributes prefixed `@_`). */
export type XmlNode = Record<string, unknown>;

const ARCHIMATE_NAMESPACE_URI = 'http://www.archimatetool.com/archimate';
const DEFAULT_ARCHIMATE_PREFIX = 'archimate';

/** Normalizes a fast-xml-parser field that may be absent, a single node, or an array of nodes. */
export function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

/** Reads the `@_<name>` attribute off a node, or `undefined` if the node or attribute is absent. */
export function attr(node: XmlNode | null | undefined, name: string): unknown {
  return node == null ? undefined : node[`@_${name}`];
}

const NUMERIC_CHAR_REF = /&#(\d+);|&#[xX]([0-9a-fA-F]+);/g;

function isValidCodePoint(codePoint: number): boolean {
  return (
    Number.isFinite(codePoint) &&
    codePoint >= 0 &&
    codePoint <= 0x10ffff &&
    !(codePoint >= 0xd800 && codePoint <= 0xdfff)
  );
}

/**
 * Decodes numeric XML character references (`&#68;`, `&#x44;`) that
 * fast-xml-parser's configured options leave untouched. Named entities
 * (`&amp;`, `&lt;`, ...) are already decoded upstream and are left alone
 * here. Malformed or out-of-range references are left as-is rather than
 * throwing.
 */
export function decodeNumericCharRefs(value: string): string {
  if (!value.includes('&#')) return value;
  return value.replace(NUMERIC_CHAR_REF, (match, dec: string | undefined, hex: string | undefined) => {
    const codePoint = dec !== undefined ? Number.parseInt(dec, 10) : Number.parseInt(hex as string, 16);
    return isValidCodePoint(codePoint) ? String.fromCodePoint(codePoint) : match;
  });
}

/** Decodes numeric character references and trims. Missing/nullish input becomes `''`. */
export function text(value: unknown): string {
  if (value == null) return '';
  return decodeNumericCharRefs(String(value)).trim();
}

/**
 * Same as {@link text}, but returns `null` instead of `''` for missing or
 * blank values — used for every domain field that is honestly optional
 * rather than fabricating a placeholder.
 */
export function readOptionalText(value: unknown): string | null {
  const result = text(value);
  return result === '' ? null : result;
}

/** Reads a numeric attribute value, returning `null` when missing, blank, or not a finite number. */
export function readOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

const XMLNS_ATTRIBUTE_PATTERN = /^@_xmlns:(.+)$/;

/**
 * Resolves which XML namespace prefix on the model root element maps to
 * Archi's own namespace URI (typically "archimate"), so that semantic type
 * derivation works generically even if a source file used a different
 * prefix. Falls back to the literal "archimate" prefix if no matching
 * `xmlns:*` declaration is found.
 */
export function resolveArchimateNamespacePrefix(root: XmlNode): string {
  for (const key of Object.keys(root)) {
    const match = XMLNS_ATTRIBUTE_PATTERN.exec(key);
    if (match && root[key] === ARCHIMATE_NAMESPACE_URI) {
      return match[1];
    }
  }
  return DEFAULT_ARCHIMATE_PREFIX;
}

/**
 * Derives a semantic type (e.g. "BusinessActor") from a verbatim `xsi:type`
 * (e.g. "archimate:BusinessActor"). Leaves the value untouched if it doesn't
 * start with the resolved namespace prefix (e.g. a Sketch/Canvas element),
 * rather than mangling an unrecognized type.
 */
export function deriveSemanticType(xsiType: string, namespacePrefix: string): string {
  const prefix = `${namespacePrefix}:`;
  return xsiType.startsWith(prefix) ? xsiType.slice(prefix.length) : xsiType;
}
