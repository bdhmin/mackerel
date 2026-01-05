/**
 * @mackerel/parser - Schema parser for Mackerel SDL
 *
 * Main entry point for parsing .mcrl schema files
 */

export * from './ast';
export * from './lexer';
export * from './parser';
export * from './validator';
export * from './runtime';

import { tokenize } from './lexer';
import { parse } from './parser';
import { validate, formatValidationErrors } from './validator';
import { Schema } from './ast';

/**
 * Result of parsing a schema
 */
export interface ParseResult {
  success: boolean;
  schema?: Schema;
  errors: string[];
}

/**
 * Parse a Mackerel schema from source code
 *
 * @param source - The source code of the schema
 * @returns ParseResult with schema or errors
 *
 * @example
 * ```typescript
 * const result = parseSchema(`
 *   entity Restaurant {
 *     required name: String
 *     optional hours: String
 *   }
 * `);
 *
 * if (result.success) {
 *   console.log('Schema:', result.schema);
 * } else {
 *   console.error('Errors:', result.errors);
 * }
 * ```
 */
export function parseSchema(source: string): ParseResult {
  try {
    // Tokenize
    const tokens = tokenize(source);

    // Parse
    const schema = parse(tokens);

    // Validate
    const validationResult = validate(schema);

    if (!validationResult.valid) {
      return {
        success: false,
        errors: [formatValidationErrors(validationResult.errors)],
      };
    }

    return {
      success: true,
      schema,
      errors: [],
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.toString() : String(error)],
    };
  }
}

