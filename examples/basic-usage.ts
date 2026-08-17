import { readFile } from 'node:fs/promises';
import { extractArchiModelXml } from '../src/archive.js';
import { parseArchiModel, type ArchiElement, type ArchiModel, type ArchiRelationship } from '../src/index.js';

/**
 * Reads an `.archimate` file from disk — either the plain-XML variant or
 * the zip-archive variant — and parses it into an {@link ArchiModel}.
 *
 * The library handles both input shapes: `extractArchiModelXml` unwraps
 * the zip (it also verifies CRC-32 of the stored entries), and
 * `parseArchiModel` parses the XML string itself.
 */
export async function parseArchiFile(filePath: string): Promise<ArchiModel> {
  const bytes = await readFile(filePath);
  const isZipArchive = bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK"
  const xml = isZipArchive
    ? extractArchiModelXml(bytes)
    : new TextDecoder().decode(bytes);
  return parseArchiModel(xml);
}

/**
 * Id → entity indexes over a model's semantic collections.
 *
 * The model's collections are flat arrays; every cross-reference
 * (`sourceId`, `targetId`, `archimateElementId`, ...) is a plain string
 * id. Building these Maps once turns repeated lookups from O(n) array
 * scans into O(1) map reads — the same technique the parser itself uses
 * internally.
 */
export interface ArchiModelIndex {
  elementsById: Map<string, ArchiElement>;
  relationshipsById: Map<string, ArchiRelationship>;
  relationshipsBySource: Map<string, ArchiRelationship[]>;
  relationshipsByTarget: Map<string, ArchiRelationship[]>;
}

export function indexModel(model: ArchiModel): ArchiModelIndex {
  const relationshipsBySource = new Map<string, ArchiRelationship[]>();
  const relationshipsByTarget = new Map<string, ArchiRelationship[]>();
  for (const relationship of model.relationships) {
    pushTo(relationshipsBySource, relationship.sourceId, relationship);
    pushTo(relationshipsByTarget, relationship.targetId, relationship);
  }
  return {
    elementsById: new Map(model.elements.map((element) => [element.id, element])),
    relationshipsById: new Map(model.relationships.map((relationship) => [relationship.id, relationship])),
    relationshipsBySource,
    relationshipsByTarget,
  };
}

function pushTo<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const bucket = map.get(key);
  if (bucket) bucket.push(value);
  else map.set(key, [value]);
}

/** All elements whose namespace-stripped semantic type matches exactly (e.g. "BusinessActor"). */
export function elementsOfType(model: ArchiModel, type: string): ArchiElement[] {
  return model.elements.filter((element) => element.type === type);
}

/** The relationships touching a given element id (either direction). */
export function relationshipsOf(model: ArchiModel, index: ArchiModelIndex, elementId: string): ArchiRelationship[] {
  return [...(index.relationshipsBySource.get(elementId) ?? []), ...(index.relationshipsByTarget.get(elementId) ?? [])];
}