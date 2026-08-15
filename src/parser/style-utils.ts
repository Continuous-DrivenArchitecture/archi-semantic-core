import type { ArchiFontStyle, ArchiStyle } from '../domain/diagram.js';
import { attr, readOptionalText, readOptionalNumber, type XmlNode } from './xml-utils.js';

/** SWT `FontData` style bitmask bits (`org.eclipse.swt.SWT.BOLD` / `.ITALIC`). */
const SWT_BOLD_BIT = 1;
const SWT_ITALIC_BIT = 2;

/**
 * Decodes Archi's native `font` attribute — a verbatim serialization of
 * SWT's `FontData.toString()` (e.g. `"1|Segoe UI|9.0|1|WINDOWS|1|-15|...|700|..."`):
 * format-version | name | height(pt) | style(bitmask) | platform | ...native LOGFONT fields.
 *
 * Only the first four fields are decoded — the rest is platform-specific
 * native font data (confirmed redundant on Windows: its `lfWeight` field
 * independently matches the decoded bold bit, e.g. `700` = `FW_BOLD` when
 * bit 0 of the style mask is set). Returns `null` for any field that
 * doesn't parse cleanly rather than guessing.
 */
function decodeFontData(raw: string): { name: string | null; size: number | null; style: ArchiFontStyle | null } {
  const fields = raw.split('|');
  const name = readOptionalText(fields[1]);

  const rawSize = fields[2];
  const size = rawSize !== undefined && rawSize.trim() !== '' && Number.isFinite(Number(rawSize)) ? Number(rawSize) : null;

  const rawStyleMask = fields[3];
  const styleMask = rawStyleMask !== undefined && /^\d+$/.test(rawStyleMask.trim()) ? Number(rawStyleMask) : null;
  const style: ArchiFontStyle | null =
    styleMask === null
      ? null
      : {
          bold: (styleMask & SWT_BOLD_BIT) !== 0,
          italic: (styleMask & SWT_ITALIC_BIT) !== 0,
        };

  return { name, size, style };
}

/**
 * Reads `fillColor`/`lineColor`/`fontColor`/`font` off a diagram object,
 * connection, or note node. Returns `null` (not a style object with every
 * field `null`) when none of those attributes are present, so callers can
 * cheaply tell "no styling recorded" from "styling recorded, all unset".
 */
export function extractStyle(node: XmlNode): ArchiStyle | null {
  const fillColor = readOptionalText(attr(node, 'fillColor'));
  const lineColor = readOptionalText(attr(node, 'lineColor'));
  const fontColor = readOptionalText(attr(node, 'fontColor'));
  const font = readOptionalText(attr(node, 'font'));
  const lineWidth = readOptionalNumber(attr(node, 'lineWidth'));
  const alpha = readOptionalNumber(attr(node, 'alpha'));

  if (fillColor === null && lineColor === null && fontColor === null && font === null && lineWidth === null && alpha === null) {
    return null;
  }

  const decoded = font !== null ? decodeFontData(font) : { name: null, size: null, style: null };

  return {
    fillColor,
    lineColor,
    fontColor,
    font,
    fontName: decoded.name,
    fontSize: decoded.size,
    fontStyle: decoded.style,
    lineWidth,
    alpha,
  };
}
