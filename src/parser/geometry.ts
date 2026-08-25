import type { ArchiModel } from '../domain/model.js';
import type { ArchiBounds, ArchiDiagramObject } from '../domain/diagram.js';

/**
 * A diagram object's bounds fully resolved: the "omitted x/y means 0"
 * convention has already been applied (see {@link resolveAbsoluteBounds}),
 * and every field is a real, finite number — unlike {@link ArchiBounds},
 * whose `x`/`y` may be `null`.
 */
export interface ArchiResolvedBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Id → `ArchiDiagramObject` index, built once per {@link ArchiModel} and
 * cached (WeakMap) so repeated per-object parent-chain resolution stays
 * O(1) per lookup instead of O(n) `Array.find()` scans per object — same
 * pattern as `getModelIndexes` in `label-expression.ts`.
 */
const diagramObjectIndexes = new WeakMap<ArchiModel, Map<string, ArchiDiagramObject>>();

function getDiagramObjectsById(model: ArchiModel): Map<string, ArchiDiagramObject> {
  let index = diagramObjectIndexes.get(model);
  if (!index) {
    index = new Map(model.diagramObjects.map((entry) => [entry.id, entry]));
    diagramObjectIndexes.set(model, index);
  }
  return index;
}

/**
 * Applies Archi's own "an omitted x/y bounds coordinate means 0" convention
 * to a single object's own (not ancestor-summed) bounds. Confirmed across
 * every fixture with an omitted coordinate (always exactly one of x/y,
 * never alongside a missing width/height) per the ArchiMate Exchange Format
 * convention. `width`/`height` are required — there is no fixture evidence
 * of Archi ever omitting either — so a missing or non-finite width/height
 * means genuinely incomplete geometry, returned as `null`, not "resolves to
 * 0" the way a missing x/y does.
 */
function resolveLocalBounds(bounds: ArchiBounds | null): ArchiResolvedBounds | null {
  if (bounds === null) return null;
  if (bounds.width === null || bounds.height === null) return null;
  if (!Number.isFinite(bounds.width) || !Number.isFinite(bounds.height)) return null;
  if (bounds.x !== null && !Number.isFinite(bounds.x)) return null;
  if (bounds.y !== null && !Number.isFinite(bounds.y)) return null;
  return { x: bounds.x ?? 0, y: bounds.y ?? 0, width: bounds.width, height: bounds.height };
}

/**
 * Resolves a diagram object's ABSOLUTE position within its view.
 *
 * Archi stores a nested diagram object's `bounds` relative to its immediate
 * visual parent ({@link ArchiDiagramObject.parentId}), not the view itself —
 * reading `bounds.x`/`bounds.y` directly only gives the true view-relative
 * position for a top-level (non-nested) object. This walks the parent chain
 * (via the model's flat `diagramObjects`) summing each ancestor's own
 * offset, applying the same "omitted x/y means 0" convention at every step
 * (see {@link resolveLocalBounds}).
 *
 * Returns `null` if this object's own bounds, or any ancestor's, is
 * incomplete (missing/non-finite width or height) — absolute position
 * cannot be computed without a complete chain.
 *
 * Defends against a parent cycle (a malformed model) rather than looping
 * forever: resolution stops at the repeated id and returns the sum
 * accumulated so far.
 */
export function resolveAbsoluteBounds(model: ArchiModel, object: ArchiDiagramObject): ArchiResolvedBounds | null {
  const own = resolveLocalBounds(object.bounds);
  if (!own) return null;

  const objectsById = getDiagramObjectsById(model);
  let absolute = own;
  let parentId = object.parentId;
  const visited = new Set<string>([object.id]);

  while (parentId !== null) {
    if (visited.has(parentId)) return absolute;
    visited.add(parentId);
    const parent = objectsById.get(parentId);
    if (!parent) return absolute;
    const parentLocal = resolveLocalBounds(parent.bounds);
    if (!parentLocal) return null;
    absolute = { ...absolute, x: absolute.x + parentLocal.x, y: absolute.y + parentLocal.y };
    parentId = parent.parentId;
  }

  return absolute;
}
