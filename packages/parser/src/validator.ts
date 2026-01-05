/**
 * Semantic validator for Mackerel schemas
 */

import {
  Schema,
  Entity,
  Field,
  Relation,
  TypeAnnotation,
  ScalarType,
  isScalarType,
  isListType,
} from './ast';

export interface ValidationError {
  message: string;
  entity?: string;
  field?: string;
  line?: number;
  column?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const BUILT_IN_TYPES = new Set([
  'String',
  'Int',
  'Float',
  'Boolean',
  'ID',
  'DateTime',
]);

export class Validator {
  private errors: ValidationError[] = [];
  private entityNames: Set<string> = new Set();

  validate(schema: Schema): ValidationResult {
    this.errors = [];
    this.entityNames = new Set();

    // First pass: collect all entity names
    for (const entity of schema.entities) {
      if (this.entityNames.has(entity.name)) {
        this.addError(`Duplicate entity name '${entity.name}'`, entity.name);
      }
      this.entityNames.add(entity.name);
    }

    // Second pass: validate each entity
    for (const entity of schema.entities) {
      this.validateEntity(entity);
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
    };
  }

  private validateEntity(entity: Entity): void {
    const fieldNames = new Set<string>();
    const relationNames = new Set<string>();

    // Validate fields
    for (const field of entity.fields) {
      if (fieldNames.has(field.name)) {
        this.addError(
          `Duplicate field name '${field.name}'`,
          entity.name,
          field.name,
          field.loc?.start.line,
          field.loc?.start.column
        );
      }
      fieldNames.add(field.name);

      this.validateField(field, entity.name);
    }

    // Validate relations
    for (const relation of entity.relations) {
      if (relationNames.has(relation.name)) {
        this.addError(
          `Duplicate relation name '${relation.name}'`,
          entity.name,
          relation.name,
          relation.loc?.start.line,
          relation.loc?.start.column
        );
      }

      // Check that relation names don't clash with field names
      if (fieldNames.has(relation.name)) {
        this.addError(
          `Relation name '${relation.name}' conflicts with field name`,
          entity.name,
          relation.name,
          relation.loc?.start.line,
          relation.loc?.start.column
        );
      }

      relationNames.add(relation.name);

      this.validateRelation(relation, entity.name);
    }
  }

  private validateField(field: Field, entityName: string): void {
    this.validateType(field.fieldType, entityName, field.name);

    // Validate modifier combinations
    // 'query' fields should probably be 'optional' or explicitly set
    // but we allow any combination for now
  }

  private validateRelation(relation: Relation, entityName: string): void {
    // Check that target entity exists
    if (!this.entityNames.has(relation.targetEntity)) {
      this.addError(
        `Relation '${relation.name}' references unknown entity '${relation.targetEntity}'`,
        entityName,
        relation.name,
        relation.loc?.start.line,
        relation.loc?.start.column
      );
    }

    // Via field name should be a valid identifier (basic check)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(relation.via)) {
      this.addError(
        `Invalid foreign key field name '${relation.via}' in relation '${relation.name}'`,
        entityName,
        relation.name,
        relation.loc?.start.line,
        relation.loc?.start.column
      );
    }
  }

  private validateType(
    typeAnnotation: TypeAnnotation,
    entityName: string,
    fieldName: string
  ): void {
    if (isScalarType(typeAnnotation)) {
      this.validateScalarType(typeAnnotation, entityName, fieldName);
    } else if (isListType(typeAnnotation)) {
      // Recursively validate element type
      this.validateType(typeAnnotation.elementType, entityName, fieldName);
    }
  }

  private validateScalarType(
    scalarType: ScalarType,
    entityName: string,
    fieldName: string
  ): void {
    const typeName = scalarType.name;

    // Check if it's a built-in type or a reference to another entity
    if (!BUILT_IN_TYPES.has(typeName) && !this.entityNames.has(typeName)) {
      this.addError(
        `Unknown type '${typeName}' in field '${fieldName}'`,
        entityName,
        fieldName,
        scalarType.loc?.start.line,
        scalarType.loc?.start.column
      );
    }
  }

  private addError(
    message: string,
    entity?: string,
    field?: string,
    line?: number,
    column?: number
  ): void {
    this.errors.push({
      message,
      entity,
      field,
      line,
      column,
    });
  }
}

/**
 * Convenience function to validate a schema
 */
export function validate(schema: Schema): ValidationResult {
  const validator = new Validator();
  return validator.validate(schema);
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors
    .map((error) => {
      let msg = error.message;
      
      if (error.entity) {
        msg = `In entity '${error.entity}': ${msg}`;
      }
      
      if (error.line && error.column) {
        msg = `Line ${error.line}, column ${error.column}: ${msg}`;
      }
      
      return msg;
    })
    .join('\n');
}

