/**
 * Runtime query validator - validates queries against schemas at runtime
 */

import { Schema, Entity, Field, FieldModifier, isScalarType } from './ast';

/**
 * Represents a query for data
 */
export interface Query {
  entity: string;
  fields: string[];
  filters?: QueryFilter[];
}

export interface QueryFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: any;
}

/**
 * Result of query validation
 */
export interface QueryValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Query shape - represents what fields are currently fetched
 */
export interface QueryShape {
  [entityName: string]: {
    [fieldName: string]: boolean | QueryShape; // true for scalar, nested object for relations
  };
}

/**
 * Runtime query validator
 */
export class RuntimeValidator {
  private schema: Schema;
  private entityMap: Map<string, Entity> = new Map();

  constructor(schema: Schema) {
    this.schema = schema;
    
    // Build entity lookup map
    for (const entity of schema.entities) {
      this.entityMap.set(entity.name, entity);
    }
  }

  /**
   * Validate a query against the schema
   */
  validateQuery(query: Query): QueryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check entity exists
    const entity = this.entityMap.get(query.entity);
    if (!entity) {
      errors.push(`Unknown entity: ${query.entity}`);
      return { valid: false, errors, warnings };
    }

    // Build field lookup
    const fieldMap = new Map<string, Field>();
    const relationMap = new Map<string, any>();
    
    for (const field of entity.fields) {
      fieldMap.set(field.name, field);
    }
    
    for (const relation of entity.relations) {
      relationMap.set(relation.name, relation);
    }

    // Validate requested fields
    for (const fieldName of query.fields) {
      const field = fieldMap.get(fieldName);
      const relation = relationMap.get(fieldName);

      if (!field && !relation) {
        errors.push(`Unknown field or relation: ${fieldName} on entity ${query.entity}`);
        continue;
      }

      // Check if field is hidden (no modifier)
      if (field && field.modifier === undefined) {
        warnings.push(
          `Field ${fieldName} is hidden (no modifier). LLM should not access this field.`
        );
      }
    }

    // Validate filters
    if (query.filters) {
      for (const filter of query.filters) {
        const field = fieldMap.get(filter.field);

        if (!field) {
          errors.push(`Cannot filter by unknown field: ${filter.field}`);
          continue;
        }

        // Only 'query' fields should be filterable
        if (field.modifier !== 'query') {
          errors.push(
            `Field ${filter.field} is not queryable. Only fields with 'query' modifier can be filtered.`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get accessible fields for an entity (excludes hidden fields)
   */
  getAccessibleFields(entityName: string): string[] {
    const entity = this.entityMap.get(entityName);
    if (!entity) {
      return [];
    }

    return entity.fields
      .filter((field) => field.modifier !== undefined) // Exclude hidden fields
      .map((field) => field.name);
  }

  /**
   * Get required fields for an entity (must be included in any query)
   */
  getRequiredFields(entityName: string): string[] {
    const entity = this.entityMap.get(entityName);
    if (!entity) {
      return [];
    }

    return entity.fields
      .filter((field) => field.modifier === 'required')
      .map((field) => field.name);
  }

  /**
   * Get queryable fields (can be used in filters)
   */
  getQueryableFields(entityName: string): string[] {
    const entity = this.entityMap.get(entityName);
    if (!entity) {
      return [];
    }

    return entity.fields
      .filter((field) => field.modifier === 'query')
      .map((field) => field.name);
  }

  /**
   * Validate a query shape expansion
   * Used when LLM wants to add fields to current shape
   */
  validateShapeExpansion(
    entityName: string,
    currentShape: string[],
    newFields: string[]
  ): QueryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const entity = this.entityMap.get(entityName);
    if (!entity) {
      errors.push(`Unknown entity: ${entityName}`);
      return { valid: false, errors, warnings };
    }

    const fieldMap = new Map<string, Field>();
    for (const field of entity.fields) {
      fieldMap.set(field.name, field);
    }

    // Validate new fields
    for (const fieldName of newFields) {
      if (currentShape.includes(fieldName)) {
        warnings.push(`Field ${fieldName} is already in current shape`);
        continue;
      }

      const field = fieldMap.get(fieldName);
      if (!field) {
        errors.push(`Unknown field: ${fieldName} on entity ${entityName}`);
        continue;
      }

      // Check accessibility
      if (field.modifier === undefined) {
        errors.push(
          `Cannot add hidden field ${fieldName} to query shape. Field has no modifier.`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Estimate token count for a query
   * (Simple heuristic for demo purposes)
   */
  estimateTokens(query: Query): number {
    const entity = this.entityMap.get(query.entity);
    if (!entity) {
      return 0;
    }

    const fieldMap = new Map<string, Field>();
    for (const field of entity.fields) {
      fieldMap.set(field.name, field);
    }

    let tokens = 0;

    for (const fieldName of query.fields) {
      const field = fieldMap.get(fieldName);
      if (!field) continue;

      // Simple estimation based on type
      if (isScalarType(field.fieldType)) {
        switch (field.fieldType.name) {
          case 'String':
            tokens += 20; // Average string field
            break;
          case 'Int':
          case 'Float':
          case 'Boolean':
            tokens += 5;
            break;
          case 'ID':
            tokens += 10;
            break;
          case 'DateTime':
            tokens += 8;
            break;
          default:
            tokens += 15;
        }
      } else {
        // Array type - estimate higher
        tokens += 50;
      }
    }

    return tokens;
  }

  /**
   * Get schema statistics
   */
  getStats() {
    const stats = {
      entities: this.schema.entities.length,
      totalFields: 0,
      totalRelations: 0,
      fieldsByModifier: {
        hidden: 0,
        required: 0,
        optional: 0,
        query: 0,
      },
    };

    for (const entity of this.schema.entities) {
      stats.totalFields += entity.fields.length;
      stats.totalRelations += entity.relations.length;

      for (const field of entity.fields) {
        if (field.modifier === undefined) {
          stats.fieldsByModifier.hidden++;
        } else if (field.modifier === 'required') {
          stats.fieldsByModifier.required++;
        } else if (field.modifier === 'optional') {
          stats.fieldsByModifier.optional++;
        } else if (field.modifier === 'query') {
          stats.fieldsByModifier.query++;
        }
      }
    }

    return stats;
  }
}

