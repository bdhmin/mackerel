/**
 * AST (Abstract Syntax Tree) node types for Mackerel SDL
 */

export interface Position {
  line: number;
  column: number;
  offset: number;
}

export interface Location {
  start: Position;
  end: Position;
}

export interface BaseNode {
  type: string;
  loc?: Location;
}

// ============================================================================
// Schema
// ============================================================================

export interface Schema extends BaseNode {
  type: 'Schema';
  entities: Entity[];
}

// ============================================================================
// Entity
// ============================================================================

export interface Entity extends BaseNode {
  type: 'Entity';
  name: string;
  fields: Field[];
  relations: Relation[];
}

// ============================================================================
// Field Types
// ============================================================================

export type FieldModifier = 'required' | 'optional' | 'query';

export interface Field extends BaseNode {
  type: 'Field';
  name: string;
  fieldType: TypeAnnotation;
  modifier?: FieldModifier; // undefined = hidden by default
}

// ============================================================================
// Type Annotations
// ============================================================================

export type TypeAnnotation = ScalarType | ListType;

export interface ScalarType extends BaseNode {
  type: 'ScalarType';
  name: string; // 'String', 'Int', 'Float', 'Boolean', 'ID', 'DateTime'
}

export interface ListType extends BaseNode {
  type: 'ListType';
  elementType: TypeAnnotation;
}

// ============================================================================
// Relations
// ============================================================================

export interface Relation extends BaseNode {
  type: 'Relation';
  name: string;
  targetEntity: string;
  via: string; // foreign key field name
  isArray: boolean;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isScalarType(node: TypeAnnotation): node is ScalarType {
  return node.type === 'ScalarType';
}

export function isListType(node: TypeAnnotation): node is ListType {
  return node.type === 'ListType';
}

export function isField(node: Field | Relation): node is Field {
  return node.type === 'Field';
}

export function isRelation(node: Field | Relation): node is Relation {
  return node.type === 'Relation';
}

// ============================================================================
// Visitor Pattern (for traversing AST)
// ============================================================================

export interface Visitor {
  visitSchema?(node: Schema): void;
  visitEntity?(node: Entity): void;
  visitField?(node: Field): void;
  visitRelation?(node: Relation): void;
  visitTypeAnnotation?(node: TypeAnnotation): void;
}

export function traverse(node: Schema, visitor: Visitor): void {
  if (visitor.visitSchema) {
    visitor.visitSchema(node);
  }

  for (const entity of node.entities) {
    if (visitor.visitEntity) {
      visitor.visitEntity(entity);
    }

    for (const field of entity.fields) {
      if (visitor.visitField) {
        visitor.visitField(field);
      }
      if (visitor.visitTypeAnnotation) {
        visitor.visitTypeAnnotation(field.fieldType);
      }
    }

    for (const relation of entity.relations) {
      if (visitor.visitRelation) {
        visitor.visitRelation(relation);
      }
    }
  }
}

