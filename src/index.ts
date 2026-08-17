export { parseArchiModel } from './parser/archi-parser.js';
export { getLabelExpression, resolveLabelExpression } from './parser/label-expression.js';
export { validateArchiModel } from './validator/archi-validator.js';
export type { ArchiValidationResult, ArchiValidationIssue } from './validator/archi-validator.js';

export type { ArchiModel, ArchiModelMetadata } from './domain/model.js';
export type { ArchiFolder } from './domain/folder.js';
export type { ArchiElement, ArchiJunctionType } from './domain/element.js';
export type { ArchiRelationship, ArchiAccessType } from './domain/relationship.js';
export type { ArchiView } from './domain/view.js';
export type {
  ArchiDiagramObject,
  ArchiDiagramConnection,
  ArchiBendpoint,
  ArchiBounds,
  ArchiNote,
  ArchiStyle,
  ArchiFontStyle,
} from './domain/diagram.js';
export type { ArchiProperty } from './domain/property.js';
export type { ArchiFeature } from './domain/feature.js';
export type { ArchiProfile } from './domain/profile.js';
