import type { ArchiModel } from '../domain/model.js';
import type { ArchiElement } from '../domain/element.js';
import type { ArchiRelationship } from '../domain/relationship.js';
import type { ArchiDiagramObject, ArchiDiagramConnection, ArchiNote } from '../domain/diagram.js';
import type { ArchiFeature } from '../domain/feature.js';
import type { ArchiProperty } from '../domain/property.js';

const LABEL_EXPRESSION_FEATURE_NAME = 'labelExpression';

/**
 * Id → entity indexes over the model's semantic collections, built once per
 * {@link ArchiModel} and cached (WeakMap) so repeated per-node resolution
 * stays O(1) per lookup instead of O(n) `Array.find()` scans per node.
 */
interface ModelIndexes {
  elementsById: Map<string, ArchiElement>;
  relationshipsById: Map<string, ArchiRelationship>;
}

const modelIndexes = new WeakMap<ArchiModel, ModelIndexes>();

function getModelIndexes(model: ArchiModel): ModelIndexes {
  let indexes = modelIndexes.get(model);
  if (!indexes) {
    indexes = {
      elementsById: new Map(model.elements.map((entry) => [entry.id, entry])),
      relationshipsById: new Map(model.relationships.map((entry) => [entry.id, entry])),
    };
    modelIndexes.set(model, indexes);
  }
  return indexes;
}

/**
 * Returns the raw Label Expression string (Archi's own `${...}` template
 * syntax, e.g. `"${name}\n${property:First}"`) stored on a diagram object,
 * connection, or note's `features`, or `null` if none is set.
 *
 * See {@link resolveLabelExpression} to evaluate it against the model.
 */
export function getLabelExpression(features: ArchiFeature[]): string | null {
  const feature = features.find((entry) => entry.name === LABEL_EXPRESSION_FEATURE_NAME);
  return feature ? feature.value : null;
}

/** The subset of Label Expression "core" placeholders resolvable from a single object, with no model-graph traversal. */
interface LabelExpressionContext {
  name: string | null;
  documentation: string | null;
  content: string | null;
  type: string | null;
  strength: string | null;
  accessType: string | null;
  properties: ArchiProperty[];
}

const EMPTY_CONTEXT: LabelExpressionContext = {
  name: null,
  documentation: null,
  content: null,
  type: null,
  strength: null,
  accessType: null,
  properties: [],
};

function stripNamespacePrefix(xsiType: string): string {
  const index = xsiType.indexOf(':');
  return index >= 0 ? xsiType.slice(index + 1) : xsiType;
}

function buildContext(model: ArchiModel, node: ArchiDiagramObject | ArchiDiagramConnection | ArchiNote): LabelExpressionContext {
  // Note: has its own `content`, never an underlying semantic element.
  if ('content' in node) {
    return { ...EMPTY_CONTEXT, name: node.name, content: node.content, type: 'Note' };
  }

  // DiagramConnection: resolves against its underlying ArchiRelationship, if any.
  if ('sourceId' in node) {
    if (node.archimateRelationshipId === null) {
      return { ...EMPTY_CONTEXT, type: stripNamespacePrefix(node.xsiType) };
    }
    const indexes = getModelIndexes(model);
    const relationship = indexes.relationshipsById.get(node.archimateRelationshipId);
    if (!relationship) {
      return { ...EMPTY_CONTEXT, type: stripNamespacePrefix(node.xsiType) };
    }
    return {
      name: relationship.name,
      documentation: relationship.documentation,
      content: null,
      type: relationship.type,
      strength: relationship.strength,
      accessType: relationship.accessType,
      properties: relationship.properties,
    };
  }

  // DiagramObject: resolves against its underlying ArchiElement, if any —
  // otherwise (Group, DiagramModelReference, ...) only its own `name` is
  // available; `${documentation}`/`${property:*}` are not captured for
  // those in this version and resolve to empty string.
  if (node.archimateElementId === null) {
    return { ...EMPTY_CONTEXT, name: node.name, type: stripNamespacePrefix(node.xsiType) };
  }
  const element = getModelIndexes(model).elementsById.get(node.archimateElementId);
  if (!element) {
    return { ...EMPTY_CONTEXT, name: node.name, type: stripNamespacePrefix(node.xsiType) };
  }
  return {
    name: element.name,
    documentation: element.documentation,
    content: null,
    type: element.type,
    strength: null,
    accessType: null,
    properties: element.properties,
  };
}

/**
 * Evaluates Archi's Label Expression syntax (see
 * https://github.com/archimatetool/archi/wiki/Label-Expressions) against a
 * diagram object, connection, or note.
 *
 * Supports the "core" placeholders that resolve from the object itself:
 * `${name}`, `${documentation}`, `${content}`, `${type}`, `${strength}`,
 * `${accessType}`, `${property:key}`, `${properties}`,
 * `${propertiesvalues}`, `${properties:separator:key}`,
 * `${wordwrap:count:expression}`, `${if:cond:val}`,
 * `${if:cond:val1:val2}`, `${nvl:cond:val}` — including expressions nested
 * inside another expression's arguments.
 *
 * Does NOT support the "Reference Prefix" forms (`$parent{...}`,
 * `$source{...}`, `$model{...}`, `$<relationship>:source{...}`, etc.),
 * which need to traverse the model graph (parent view/folder, connected
 * relationships) rather than just read the object itself — those are left
 * verbatim, unresolved, in the output. `${specialization}` and
 * `${viewpoint}` are likewise left unresolved (not yet captured by the
 * parser).
 *
 * Returns `null` if the object has no `labelExpression` feature — there is
 * nothing to evaluate, as opposed to evaluating to an empty string.
 */
export function resolveLabelExpression(
  model: ArchiModel,
  node: ArchiDiagramObject | ArchiDiagramConnection | ArchiNote,
): string | null {
  const raw = getLabelExpression(node.features);
  if (raw === null) {
    return null;
  }
  return evaluateText(raw, buildContext(model, node));
}

function evaluateText(input: string, context: LabelExpressionContext): string {
  let result = '';
  let i = 0;
  while (i < input.length) {
    if (input.startsWith('${', i)) {
      const bodyStart = i + 2;
      const bodyEnd = findMatchingBrace(input, bodyStart);
      result += evaluateExpression(input.slice(bodyStart, bodyEnd), context);
      i = bodyEnd + 1;
    } else {
      result += input[i];
      i += 1;
    }
  }
  return result;
}

/** Index of the `}` matching the `${` whose body starts at `start`, accounting for `${...}` nesting. Returns `input.length` if unmatched (defensive — never throws on malformed input). */
function findMatchingBrace(input: string, start: number): number {
  let depth = 1;
  let i = start;
  while (i < input.length) {
    if (input.startsWith('${', i)) {
      depth += 1;
      i += 2;
      continue;
    }
    if (input[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
    i += 1;
  }
  return input.length;
}

/** Splits an expression body on top-level `:` — a `:` inside a nested `${...}` is not a delimiter. */
function splitTopLevel(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  let i = 0;
  while (i < body.length) {
    if (body.startsWith('${', i)) {
      depth += 1;
      current += '${';
      i += 2;
      continue;
    }
    if (body[i] === '}' && depth > 0) {
      depth -= 1;
      current += '}';
      i += 1;
      continue;
    }
    if (body[i] === ':' && depth === 0) {
      parts.push(current);
      current = '';
      i += 1;
      continue;
    }
    current += body[i];
    i += 1;
  }
  parts.push(current);
  return parts;
}

function evaluateExpression(body: string, context: LabelExpressionContext): string {
  const parts = splitTopLevel(body);
  const command = parts[0];

  switch (command) {
    case 'name':
      return context.name ?? '';
    case 'documentation':
      return context.documentation ?? '';
    case 'content':
      return context.content ?? '';
    case 'type':
      return context.type ?? '';
    case 'strength':
      return context.strength ?? '';
    case 'accessType':
      return context.accessType ?? '';
    case 'property': {
      const key = evaluateText(parts[1] ?? '', context);
      const property = context.properties.find((entry) => entry.key === key);
      return property ? property.value : '';
    }
    case 'properties': {
      // Two shapes share this command name: `${properties}` (no args) lists
      // everything; `${properties:separator:key}` (2 args) filters by key.
      if (parts.length >= 3) {
        const separator = evaluateText(parts[1] ?? '', context);
        const key = evaluateText(parts[2] ?? '', context);
        return context.properties
          .filter((entry) => entry.key === key)
          .map((entry) => entry.value)
          .join(separator);
      }
      return context.properties.map((entry) => `${entry.key}: ${entry.value}`).join('\n');
    }
    case 'propertiesvalues':
      return context.properties.map((entry) => entry.value).join('\n');
    case 'wordwrap': {
      const count = Number.parseInt(evaluateText(parts[1] ?? '', context), 10);
      const text = evaluateText(parts[2] ?? '', context);
      if (!Number.isFinite(count) || count <= 0) {
        return text;
      }
      const lines: string[] = [];
      for (let index = 0; index < text.length; index += count) {
        lines.push(text.slice(index, index + count));
      }
      return lines.join('\n');
    }
    case 'if': {
      const condition = evaluateText(parts[1] ?? '', context);
      if (condition !== '') {
        return evaluateText(parts[2] ?? '', context);
      }
      return parts.length >= 4 ? evaluateText(parts[3] ?? '', context) : '';
    }
    case 'nvl': {
      const condition = evaluateText(parts[1] ?? '', context);
      return condition !== '' ? condition : evaluateText(parts[2] ?? '', context);
    }
    default:
      // Unrecognized command (including v1-unsupported reference-prefixed
      // forms that happen to use this bracket shape) — leave it verbatim
      // rather than silently dropping content the caller might recognize.
      return `\${${body}}`;
  }
}
