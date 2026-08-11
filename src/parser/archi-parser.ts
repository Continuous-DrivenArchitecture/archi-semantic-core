import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type { ArchiModel, ArchiModelMetadata } from '../domain/model.js';
import type { ArchiFolder } from '../domain/folder.js';
import type { ArchiElement } from '../domain/element.js';
import type { ArchiRelationship } from '../domain/relationship.js';
import type { ArchiView } from '../domain/view.js';
import type { ArchiDiagramObject, ArchiDiagramConnection, ArchiNote, ArchiBounds, ArchiBendpoint } from '../domain/diagram.js';
import type { ArchiProperty } from '../domain/property.js';
import {
  asArray,
  attr,
  text,
  readOptionalText,
  readOptionalNumber,
  resolveArchimateNamespacePrefix,
  deriveSemanticType,
  type XmlNode,
} from './xml-utils.js';

const VIEW_TYPE_PATTERN = /ArchimateDiagramModel$/i;
const RELATIONSHIP_TYPE_PATTERN = /Relationship$/i;
const NOTE_TYPE_PATTERN = /Note$/i;
const CONNECTION_TYPE_PATTERN = /Connection$/i;

function extractBounds(node: XmlNode): ArchiBounds | null {
  const bounds = node.bounds;
  if (!bounds || typeof bounds !== 'object') return null;
  const boundsNode = bounds as XmlNode;
  return {
    x: readOptionalNumber(attr(boundsNode, 'x')),
    y: readOptionalNumber(attr(boundsNode, 'y')),
    width: readOptionalNumber(attr(boundsNode, 'width')),
    height: readOptionalNumber(attr(boundsNode, 'height')),
  };
}

function extractBendpoints(node: XmlNode): ArchiBendpoint[] {
  return (asArray(node.bendpoint) as XmlNode[]).map((bp) => ({
    startX: readOptionalNumber(attr(bp, 'startX')),
    startY: readOptionalNumber(attr(bp, 'startY')),
    endX: readOptionalNumber(attr(bp, 'endX')),
    endY: readOptionalNumber(attr(bp, 'endY')),
  }));
}

function extractDocumentation(node: XmlNode): string | null {
  const values = asArray(node.documentation)
    .map((doc) => text(typeof doc === 'object' && doc !== null ? (doc as XmlNode)['#text'] : doc))
    .filter((value) => value.length > 0);
  return values.length > 0 ? values.join('\n') : null;
}

function extractProperties(node: XmlNode): ArchiProperty[] {
  return (asArray(node.property) as XmlNode[])
    .map((prop) => ({ key: text(attr(prop, 'key')), value: text(attr(prop, 'value')) }))
    .filter((prop) => prop.key.length > 0);
}

/** Appends `id` to the bucket for `key`, creating the bucket on first use. */
function pushToIndex(index: Map<string, string[]>, key: string, id: string): void {
  const bucket = index.get(key);
  if (bucket) {
    bucket.push(id);
  } else {
    index.set(key, [id]);
  }
}

/**
 * Parses native Archi `.archimate` XML text into a clean, semantic
 * {@link ArchiModel}. Accepts XML text only — reading a file from disk, the
 * browser File API, or over the network is the caller's responsibility.
 *
 * Throws if `xmlText` is not a string, or if it is not well-formed XML.
 * Does not throw for a semantically broken model (missing ids, dangling
 * references, etc.) — use {@link validateArchiModel} for that.
 */
export function parseArchiModel(xmlText: string): ArchiModel {
  if (typeof xmlText !== 'string') {
    throw new TypeError('parseArchiModel expects a string of XML text');
  }

  const validation = XMLValidator.validate(xmlText);
  if (validation !== true) {
    const { msg, line, col } = validation.err;
    throw new Error(`Invalid XML: ${msg} (line ${line}, col ${col})`);
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true,
    trimValues: false,
  });
  const doc = parser.parse(xmlText) as XmlNode;
  const root = (doc.model ?? doc['archimate:model'] ?? doc) as XmlNode;
  const namespacePrefix = resolveArchimateNamespacePrefix(root);

  const folders: ArchiFolder[] = [];
  const elements: ArchiElement[] = [];
  const relationships: ArchiRelationship[] = [];
  const views: ArchiView[] = [];
  const diagramObjects: ArchiDiagramObject[] = [];
  const diagramConnections: ArchiDiagramConnection[] = [];
  const notes: ArchiNote[] = [];

  function deriveType(xsiType: string): string {
    return deriveSemanticType(xsiType, namespacePrefix);
  }

  /** Records this node's own `sourceConnection` children (its visual outgoing connections). */
  function walkConnections(containerNode: XmlNode, viewId: string): void {
    for (const conn of asArray(containerNode.sourceConnection) as XmlNode[]) {
      const xsiType = text(attr(conn, 'xsi:type'));
      if (!xsiType || !CONNECTION_TYPE_PATTERN.test(xsiType)) continue;
      diagramConnections.push({
        id: text(attr(conn, 'id')),
        xsiType,
        viewId,
        sourceId: text(attr(conn, 'source')),
        targetId: text(attr(conn, 'target')),
        archimateRelationshipId: readOptionalText(attr(conn, 'archimateRelationship')) ?? readOptionalText(attr(conn, 'relationship')),
        bendpoints: extractBendpoints(conn),
      });
    }
  }

  /**
   * Recursively walks a view (or a diagram object within one), recording
   * every diagram object/connection/note it finds — at any depth — into the
   * shared flat arrays above, with `parentId`/`viewId`/`sourceId` set
   * correctly. `childrenIds`/`connectionIds`/the view's own id-list fields
   * are deliberately left as placeholders here and derived in a single
   * pass once the whole model has been walked (see below) — since parent
   * and child are both fully known by then, there is no forward-reference
   * ordering problem to work around.
   */
  function walkContainer(containerNode: XmlNode, viewId: string, ownerId: string | null): void {
    for (const child of asArray(containerNode.child) as XmlNode[]) {
      const xsiType = text(attr(child, 'xsi:type'));
      if (!xsiType) continue;

      if (NOTE_TYPE_PATTERN.test(xsiType)) {
        notes.push({
          id: text(attr(child, 'id')),
          name: readOptionalText(attr(child, 'name')),
          viewId,
          parentId: ownerId,
          content: readOptionalText(child.content),
          bounds: extractBounds(child),
          textAlignment: readOptionalText(attr(child, 'textAlignment')),
          borderType: readOptionalText(attr(child, 'borderType')),
        });
        continue;
      }

      // Generic: any non-Note diagram child is a visual object (an Archi
      // "DiagramObject", a "Group" container, or any other/future visual
      // type) — preserved with its own xsiType rather than requiring a
      // recognized type, so nothing is silently dropped.
      const id = text(attr(child, 'id'));
      diagramObjects.push({
        id,
        name: readOptionalText(attr(child, 'name')),
        xsiType,
        viewId,
        parentId: ownerId,
        archimateElementId: readOptionalText(attr(child, 'archimateElement')),
        bounds: extractBounds(child),
        textPosition: readOptionalText(attr(child, 'textPosition')),
        textAlignment: readOptionalText(attr(child, 'textAlignment')),
        childrenIds: [],
        connectionIds: [],
      });
      walkConnections(child, viewId);
      walkContainer(child, viewId, id);
    }
  }

  function walkFolder(folderNode: XmlNode, parentPath: string, parentId: string | null): void {
    const id = text(attr(folderNode, 'id'));
    const name = readOptionalText(attr(folderNode, 'name'));
    const type = text(attr(folderNode, 'type'));
    const path = parentPath ? `${parentPath}/${name ?? id}` : (name ?? id);
    const folder: ArchiFolder = { id, name, type, parentId, path, containedIds: [] };
    folders.push(folder);

    for (const childFolder of asArray(folderNode.folder) as XmlNode[]) {
      walkFolder(childFolder, path, id);
    }

    for (const element of asArray(folderNode.element) as XmlNode[]) {
      const elementId = text(attr(element, 'id'));
      const xsiType = text(attr(element, 'xsi:type'));
      const semanticType = deriveType(xsiType);
      const name2 = readOptionalText(attr(element, 'name'));
      const documentation = extractDocumentation(element);
      const properties = extractProperties(element);

      if (VIEW_TYPE_PATTERN.test(xsiType)) {
        views.push({
          id: elementId,
          name: name2,
          xsiType,
          type: semanticType,
          folderId: id,
          folderPath: path,
          documentation,
          properties,
          diagramObjectIds: [],
          diagramConnectionIds: [],
          noteIds: [],
        });
        walkConnections(element, elementId);
        walkContainer(element, elementId, null);
      } else if (RELATIONSHIP_TYPE_PATTERN.test(xsiType)) {
        relationships.push({
          id: elementId,
          name: name2,
          xsiType,
          type: semanticType,
          sourceId: text(attr(element, 'source')),
          targetId: text(attr(element, 'target')),
          folderId: id,
          folderPath: path,
          documentation,
          properties,
        });
      } else {
        elements.push({
          id: elementId,
          name: name2,
          xsiType,
          type: semanticType,
          folderId: id,
          folderPath: path,
          documentation,
          properties,
        });
      }
      folder.containedIds.push(elementId);
    }
  }

  for (const folderNode of asArray(root.folder) as XmlNode[]) {
    walkFolder(folderNode, '', null);
  }

  // Derivation phase: every diagram object/connection/note has already been
  // fully recorded above (parentId/viewId/sourceId all set), so the
  // convenience id-list fields can now be derived — no execution-order
  // hazard, unlike a second pass that depends on a first pass still in
  // progress. Rather than re-filtering the complete collections once per
  // object/view (O(n^2) on large models), build each grouping as a
  // Map<ownerId, id[]> in a single pass over its source collection, then
  // look up each object's/view's bucket directly. Every collection is
  // still visited in its original push (i.e. document) order, so the
  // resulting id lists preserve the same ordering the previous
  // filter-based implementation produced.
  const childrenByParentId = new Map<string, string[]>();
  const rootObjectIdsByViewId = new Map<string, string[]>();
  for (const diagramObject of diagramObjects) {
    if (diagramObject.parentId !== null) {
      pushToIndex(childrenByParentId, diagramObject.parentId, diagramObject.id);
    } else {
      pushToIndex(rootObjectIdsByViewId, diagramObject.viewId, diagramObject.id);
    }
  }

  const connectionIdsBySourceId = new Map<string, string[]>();
  const connectionIdsByViewId = new Map<string, string[]>();
  for (const connection of diagramConnections) {
    pushToIndex(connectionIdsBySourceId, connection.sourceId, connection.id);
    pushToIndex(connectionIdsByViewId, connection.viewId, connection.id);
  }

  const rootNoteIdsByViewId = new Map<string, string[]>();
  for (const note of notes) {
    if (note.parentId === null) {
      pushToIndex(rootNoteIdsByViewId, note.viewId, note.id);
    }
  }

  for (const diagramObject of diagramObjects) {
    diagramObject.childrenIds = childrenByParentId.get(diagramObject.id) ?? [];
    diagramObject.connectionIds = connectionIdsBySourceId.get(diagramObject.id) ?? [];
  }
  for (const view of views) {
    view.diagramObjectIds = rootObjectIdsByViewId.get(view.id) ?? [];
    view.noteIds = rootNoteIdsByViewId.get(view.id) ?? [];
    view.diagramConnectionIds = connectionIdsByViewId.get(view.id) ?? [];
  }

  const metadata: ArchiModelMetadata = {
    id: text(attr(root, 'id')),
    name: text(attr(root, 'name')),
    version: text(attr(root, 'version')),
  };

  return { metadata, folders, elements, relationships, views, diagramObjects, diagramConnections, notes };
}
