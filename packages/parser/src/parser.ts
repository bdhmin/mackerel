/**
 * Parser for Mackerel SDL - converts tokens into AST
 */

import {
  Schema,
  Entity,
  Field,
  Relation,
  TypeAnnotation,
  ScalarType,
  ListType,
  FieldModifier,
  Location,
} from './ast';
import { Token, TokenType, LexerError } from './lexer';

export class ParseError extends Error {
  constructor(
    message: string,
    public token: Token
  ) {
    super(message);
    this.name = 'ParseError';
  }

  toString(): string {
    const pos = this.token.start;
    return `${this.name} at line ${pos.line}, column ${pos.column}:\n  ${this.message}\n  Found: '${this.token.value}'`;
  }
}

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  /**
   * Parse tokens into a Schema AST
   */
  parse(): Schema {
    const entities: Entity[] = [];

    while (!this.isAtEnd()) {
      if (this.check(TokenType.EOF)) {
        break;
      }
      entities.push(this.parseEntity());
    }

    return {
      type: 'Schema',
      entities,
    };
  }

  // ============================================================================
  // Entity Parsing
  // ============================================================================

  private parseEntity(): Entity {
    const start = this.peek();
    
    this.consume(TokenType.ENTITY, "Expected 'entity' keyword");
    const name = this.consume(TokenType.IDENTIFIER, 'Expected entity name');
    this.consume(TokenType.LEFT_BRACE, "Expected '{' after entity name");

    const fields: Field[] = [];
    const relations: Relation[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      // Check if it's a relation (starts with ->)
      if (this.check(TokenType.ARROW)) {
        relations.push(this.parseRelation());
      } else {
        // It's a field (might have modifier)
        const field = this.parseField();
        fields.push(field);
      }
    }

    const end = this.consume(TokenType.RIGHT_BRACE, "Expected '}' after entity body");

    return {
      type: 'Entity',
      name: name.value,
      fields,
      relations,
      loc: this.location(start, end),
    };
  }

  // ============================================================================
  // Field Parsing
  // ============================================================================

  private parseField(): Field {
    const start = this.peek();
    
    // Check for optional modifier (required, optional, query)
    let modifier: FieldModifier | undefined;
    
    if (this.check(TokenType.REQUIRED)) {
      modifier = 'required';
      this.advance();
    } else if (this.check(TokenType.OPTIONAL)) {
      modifier = 'optional';
      this.advance();
    } else if (this.check(TokenType.QUERY)) {
      modifier = 'query';
      this.advance();
    }

    const name = this.consume(TokenType.IDENTIFIER, 'Expected field name');
    this.consume(TokenType.COLON, "Expected ':' after field name");
    const fieldType = this.parseType();

    return {
      type: 'Field',
      name: name.value,
      fieldType,
      modifier,
      loc: this.location(start, this.previous()),
    };
  }

  // ============================================================================
  // Relation Parsing
  // ============================================================================

  private parseRelation(): Relation {
    const start = this.peek();
    
    this.consume(TokenType.ARROW, "Expected '->' for relation");
    const name = this.consume(TokenType.IDENTIFIER, 'Expected relation name');
    this.consume(TokenType.COLON, "Expected ':' after relation name");

    // Check if it's an array [EntityName]
    let isArray = false;
    let targetEntity: string;

    if (this.check(TokenType.LEFT_BRACKET)) {
      isArray = true;
      this.advance(); // consume [
      const entityToken = this.consume(TokenType.IDENTIFIER, 'Expected entity name in array type');
      targetEntity = entityToken.value;
      this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after entity name");
    } else {
      const entityToken = this.consume(TokenType.IDENTIFIER, 'Expected entity name');
      targetEntity = entityToken.value;
    }

    this.consume(TokenType.VIA, "Expected 'via' keyword in relation");
    const via = this.consume(TokenType.IDENTIFIER, 'Expected foreign key field name after via');

    return {
      type: 'Relation',
      name: name.value,
      targetEntity,
      via: via.value,
      isArray,
      loc: this.location(start, this.previous()),
    };
  }

  // ============================================================================
  // Type Parsing
  // ============================================================================

  private parseType(): TypeAnnotation {
    const start = this.peek();

    // Check for array type [Type]
    if (this.check(TokenType.LEFT_BRACKET)) {
      this.advance(); // consume [
      const elementType = this.parseType(); // recursive for nested arrays
      this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after array element type");

      return {
        type: 'ListType',
        elementType,
        loc: this.location(start, this.previous()),
      };
    }

    // Scalar type
    const typeName = this.consume(TokenType.IDENTIFIER, 'Expected type name');

    return {
      type: 'ScalarType',
      name: typeName.value,
      loc: this.location(start, typeName),
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();

    throw new ParseError(message, this.peek());
  }

  private location(start: Token, end: Token): Location {
    return {
      start: start.start,
      end: end.end,
    };
  }
}

/**
 * Convenience function to parse tokens into Schema AST
 */
export function parse(tokens: Token[]): Schema {
  const parser = new Parser(tokens);
  return parser.parse();
}

