import {
  getLabelExpression,
  resolveLabelExpression,
  type ArchiDiagramConnection,
  type ArchiDiagramObject,
  type ArchiModel,
  type ArchiNote,
} from '../src/index.js';

/**
 * Resolves Archi Label Expressions for every visual node of one view.
 *
 * `getLabelExpression` reads the raw template (e.g. `${name}\n${property:First}`)
 * off the node's `<feature>` entries; `resolveLabelExpression` evaluates it
 * against the model (core placeholders: `${name}`, `${documentation}`,
 * `${content}`, `${type}`, `${strength}`, `${accessType}`, `${property:key}`,
 * `${properties}`, `${propertiesvalues}`, `${wordwrap:count:expr}`,
 * `${if:cond:val[:val2]}`, `${nvl:cond:val}`).
 */

export type ViewLabelKind = 'object' | 'connection' | 'note';

export interface ViewLabel {
  id: string;
  kind: ViewLabelKind;
  /** Raw label expression template, or null if the node has none. */
  expression: string | null;
  /** Evaluated label; the plain `name`/`content` when no expression is set. */
  label: string;
}

type VisualNode = ArchiDiagramObject | ArchiDiagramConnection | ArchiNote;

export function viewLabels(model: ArchiModel, viewId: string): ViewLabel[] {
  const objects: Array<[ViewLabelKind, VisualNode]> = [
    ...model.diagramObjects
      .filter((object) => object.viewId === viewId)
      .map((object): [ViewLabelKind, VisualNode] => ['object', object]),
    ...model.diagramConnections
      .filter((connection) => connection.viewId === viewId)
      .map((connection): [ViewLabelKind, VisualNode] => ['connection', connection]),
    ...model.notes.filter((note) => note.viewId === viewId).map((note): [ViewLabelKind, VisualNode] => ['note', note]),
  ];

  return objects.map(([kind, node]) => ({
    id: node.id,
    kind,
    expression: getLabelExpression(node.features),
    label: resolveLabelExpression(model, node) ?? defaultLabel(node),
  }));
}

function defaultLabel(node: VisualNode): string {
  if ('content' in node) return node.content ?? '';
  if ('name' in node && node.name !== null && node.name !== '') return node.name;
  return node.xsiType.replace(/^.*:/, '');
}