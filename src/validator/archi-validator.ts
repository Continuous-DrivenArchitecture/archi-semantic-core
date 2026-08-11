import type { ArchiModel } from '../domain/model.js';

export interface ArchiValidationIssue {
  code: string;
  message: string;
  /** Locator into the returned ArchiModel (array name + id/index + field), not the original XML. */
  path: string;
}

export interface ArchiValidationResult {
  valid: boolean;
  errors: ArchiValidationIssue[];
}

interface IdBearing {
  id: string;
}

/**
 * Builds the global id set used for every reference check below, while
 * also recording missing-id/duplicate-id issues. Spans all seven id-bearing
 * collections (including folders and the visual layer), not just the
 * semantic ones, since Archi draws every id — semantic and visual — from
 * one global pool.
 */
function collectIds(model: ArchiModel, errors: ArchiValidationIssue[]): Set<string> {
  const collections: Array<[string, readonly IdBearing[]]> = [
    ['folders', model.folders],
    ['elements', model.elements],
    ['relationships', model.relationships],
    ['views', model.views],
    ['diagramObjects', model.diagramObjects],
    ['diagramConnections', model.diagramConnections],
    ['notes', model.notes],
  ];

  const ids = new Set<string>();
  for (const [name, items] of collections) {
    items.forEach((item, index) => {
      if (!item.id) {
        errors.push({ code: 'missing-id', message: `Missing id for ${name}[${index}].`, path: `${name}[${index}]` });
        return;
      }
      if (ids.has(item.id)) {
        errors.push({ code: 'duplicate-id', message: `Duplicate id: ${item.id}`, path: `${name}[${index}].id` });
        return;
      }
      ids.add(item.id);
    });
  }
  return ids;
}

/**
 * Checks the structural integrity of an already-parsed {@link ArchiModel}:
 * missing/duplicate ids, and dangling references between entities. This is
 * a check of internal consistency, not of enterprise-architecture quality —
 * a model can be perfectly "valid" here and still be a poor architecture.
 */
export function validateArchiModel(model: ArchiModel): ArchiValidationResult {
  const errors: ArchiValidationIssue[] = [];
  const ids = collectIds(model, errors);

  for (const relationship of model.relationships) {
    if (relationship.sourceId && !ids.has(relationship.sourceId)) {
      errors.push({
        code: 'broken-relationship-source',
        message: `Relationship ${relationship.id} references a missing source: ${relationship.sourceId}`,
        path: `relationships[${relationship.id}].sourceId`,
      });
    }
    if (relationship.targetId && !ids.has(relationship.targetId)) {
      errors.push({
        code: 'broken-relationship-target',
        message: `Relationship ${relationship.id} references a missing target: ${relationship.targetId}`,
        path: `relationships[${relationship.id}].targetId`,
      });
    }
  }

  for (const element of model.elements) {
    if (element.type === 'Junction' && element.junctionType === null) {
      errors.push({
        code: 'unrecognized-junction-type',
        message: `Junction ${element.id} has an unrecognized native type attribute: "${element.rawJunctionType}"`,
        path: `elements[${element.id}].junctionType`,
      });
    }
  }

  for (const diagramObject of model.diagramObjects) {
    if (diagramObject.archimateElementId !== null && !ids.has(diagramObject.archimateElementId)) {
      errors.push({
        code: 'broken-diagram-object-element',
        message: `Diagram object ${diagramObject.id} references a missing element: ${diagramObject.archimateElementId}`,
        path: `diagramObjects[${diagramObject.id}].archimateElementId`,
      });
    }
    if (diagramObject.referencedModelId !== null && !ids.has(diagramObject.referencedModelId)) {
      errors.push({
        code: 'broken-diagram-object-model-reference',
        message: `Diagram object ${diagramObject.id} references a missing model: ${diagramObject.referencedModelId}`,
        path: `diagramObjects[${diagramObject.id}].referencedModelId`,
      });
    }
  }

  for (const connection of model.diagramConnections) {
    if (connection.archimateRelationshipId !== null && !ids.has(connection.archimateRelationshipId)) {
      errors.push({
        code: 'broken-diagram-connection-relationship',
        message: `Diagram connection ${connection.id} references a missing relationship: ${connection.archimateRelationshipId}`,
        path: `diagramConnections[${connection.id}].archimateRelationshipId`,
      });
    }
    if (connection.sourceId && !ids.has(connection.sourceId)) {
      errors.push({
        code: 'broken-diagram-connection-source',
        message: `Diagram connection ${connection.id} references a missing source visual object: ${connection.sourceId}`,
        path: `diagramConnections[${connection.id}].sourceId`,
      });
    }
    if (connection.targetId && !ids.has(connection.targetId)) {
      errors.push({
        code: 'broken-diagram-connection-target',
        message: `Diagram connection ${connection.id} references a missing target visual object: ${connection.targetId}`,
        path: `diagramConnections[${connection.id}].targetId`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
