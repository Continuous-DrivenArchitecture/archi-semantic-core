import type { ArchiElement, ArchiModel, ArchiRelationship } from '../src/index.js';

/**
 * Impact analysis over a parsed {@link ArchiModel}: who depends on whom,
 * through the relationship graph.
 *
 * The traversal space includes relationship ids alongside element ids —
 * the domain model allows a relationship to be the source or target of
 * another relationship — so resolution looks in both collections.
 */

export interface ImpactNode {
  id: string;
  name: string | null;
  type: string;
}

/** Everything transitively reachable from `startId` following relationships from source to target. */
export function downstreamImpact(model: ArchiModel, startId: string): ImpactNode[] {
  return traverse(model, startId, (relationship) => relationship.targetId, downstreamAdjacency);
}

/** Everything transitively reaching `startId` following relationships from target back to source. */
export function upstreamDependents(model: ArchiModel, startId: string): ImpactNode[] {
  return traverse(model, startId, (relationship) => relationship.sourceId, upstreamAdjacency);
}

function traverse(
  model: ArchiModel,
  startId: string,
  nextId: (relationship: ArchiRelationship) => string,
  adjacency: (
    current: string,
    bySource: Map<string, ArchiRelationship[]>,
    byTarget: Map<string, ArchiRelationship[]>,
  ) => ArchiRelationship[],
): ImpactNode[] {
  const elements = new Map(model.elements.map((element) => [element.id, element]));
  const relationships = new Map(model.relationships.map((relationship) => [relationship.id, relationship]));
  const bySource = new Map<string, ArchiRelationship[]>();
  const byTarget = new Map<string, ArchiRelationship[]>();
  for (const relationship of model.relationships) {
    pushTo(bySource, relationship.sourceId, relationship);
    pushTo(byTarget, relationship.targetId, relationship);
  }

  const visited = new Set<string>([startId]);
  const queue = [startId];
  const result: ImpactNode[] = [];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    for (const relationship of adjacency(current, bySource, byTarget)) {
      const next = nextId(relationship);
      if (visited.has(next)) continue;
      visited.add(next);
      const node = describe(next, elements, relationships);
      if (node) result.push(node);
      queue.push(next);
    }
  }
  return result;
}

function downstreamAdjacency(
  current: string,
  bySource: Map<string, ArchiRelationship[]>,
): ArchiRelationship[] {
  return bySource.get(current) ?? [];
}

function upstreamAdjacency(
  current: string,
  _bySource: Map<string, ArchiRelationship[]>,
  byTarget: Map<string, ArchiRelationship[]>,
): ArchiRelationship[] {
  return byTarget.get(current) ?? [];
}

function describe(
  id: string,
  elements: Map<string, ArchiElement>,
  relationships: Map<string, ArchiRelationship>,
): ImpactNode | null {
  const element = elements.get(id);
  if (element) return { id: element.id, name: element.name, type: element.type };
  const relationship = relationships.get(id);
  if (relationship) return { id: relationship.id, name: relationship.name, type: relationship.type };
  return null;
}

function pushTo<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const bucket = map.get(key);
  if (bucket) bucket.push(value);
  else map.set(key, [value]);
}