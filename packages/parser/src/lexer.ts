/**
 * Lexer for Mackerel SDL - converts source text into tokens
 */

import { Position } from './ast';

export enum TokenType {
  // Keywords
  ENTITY = 'ENTITY',
  REQUIRED = 'REQUIRED',
  OPTIONAL = 'OPTIONAL',
  QUERY = 'QUERY',
  RELATION = 'RELATION',
  VIA = 'VIA',

  // Identifiers and Literals
  IDENTIFIER = 'IDENTIFIER',

  // Symbols
  COLON = 'COLON',           // :
  ARROW = 'ARROW',           // ->
  LEFT_BRACE = 'LEFT_BRACE', // {
  RIGHT_BRACE = 'RIGHT_BRACE', // }
  LEFT_BRACKET = 'LEFT_BRACKET', // [
  RIGHT_BRACKET = 'RIGHT_BRACKET', // ]

  // Special
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
  COMMENT = 'COMMENT',
}

export interface Token {
  type: TokenType;
  value: string;
  start: Position;
  end: Position;
}

export class LexerError extends Error {
  constructor(
    message: string,
    public position: Position
  ) {
    super(message);
    this.name = 'LexerError';
  }

  toString(): string {
    return `${this.name} at line ${this.position.line}, column ${this.position.column}:\n  ${this.message}`;
  }
}

const KEYWORDS: Record<string, TokenType> = {
  entity: TokenType.ENTITY,
  required: TokenType.REQUIRED,
  optional: TokenType.OPTIONAL,
  query: TokenType.QUERY,
  relation: TokenType.RELATION,
  via: TokenType.VIA,
};

export class Lexer {
  private source: string;
  private position = 0;
  private line = 1;
  private column = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
  }

  /**
   * Tokenize the entire source
   */
  tokenize(): Token[] {
    while (this.position < this.source.length) {
      this.scanToken();
    }

    // Add EOF token
    this.tokens.push({
      type: TokenType.EOF,
      value: '',
      start: this.currentPosition(),
      end: this.currentPosition(),
    });

    return this.tokens;
  }

  private scanToken(): void {
    const char = this.peek();

    // Skip whitespace (except newlines)
    if (char === ' ' || char === '\t' || char === '\r') {
      this.advance();
      return;
    }

    // Handle newlines
    if (char === '\n') {
      this.advance();
      this.line++;
      this.column = 1;
      return;
    }

    // Comments (// style)
    if (char === '/' && this.peekNext() === '/') {
      this.scanComment();
      return;
    }

    // Arrow ->
    if (char === '-' && this.peekNext() === '>') {
      this.addToken(TokenType.ARROW, '->');
      this.advance();
      this.advance();
      return;
    }

    // Single character tokens
    switch (char) {
      case ':':
        this.addToken(TokenType.COLON, ':');
        this.advance();
        return;
      case '{':
        this.addToken(TokenType.LEFT_BRACE, '{');
        this.advance();
        return;
      case '}':
        this.addToken(TokenType.RIGHT_BRACE, '}');
        this.advance();
        return;
      case '[':
        this.addToken(TokenType.LEFT_BRACKET, '[');
        this.advance();
        return;
      case ']':
        this.addToken(TokenType.RIGHT_BRACKET, ']');
        this.advance();
        return;
    }

    // Identifiers and keywords
    if (this.isAlpha(char)) {
      this.scanIdentifier();
      return;
    }

    // Unknown character
    throw new LexerError(
      `Unexpected character '${char}'`,
      this.currentPosition()
    );
  }

  private scanComment(): void {
    const start = this.currentPosition();
    
    // Skip //
    this.advance();
    this.advance();

    const commentStart = this.position;
    
    // Read until end of line
    while (this.peek() !== '\n' && this.position < this.source.length) {
      this.advance();
    }

    const value = this.source.substring(commentStart, this.position);
    
    // We don't add comment tokens to the stream (they're ignored)
    // but we could if we wanted to preserve them for formatting
  }

  private scanIdentifier(): void {
    const start = this.currentPosition();
    const startPos = this.position;

    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const value = this.source.substring(startPos, this.position);
    const type = KEYWORDS[value] || TokenType.IDENTIFIER;

    this.tokens.push({
      type,
      value,
      start,
      end: this.currentPosition(),
    });
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private peek(): string {
    if (this.position >= this.source.length) {
      return '\0';
    }
    return this.source[this.position];
  }

  private peekNext(): string {
    if (this.position + 1 >= this.source.length) {
      return '\0';
    }
    return this.source[this.position + 1];
  }

  private advance(): void {
    this.position++;
    this.column++;
  }

  private currentPosition(): Position {
    return {
      line: this.line,
      column: this.column,
      offset: this.position,
    };
  }

  private addToken(type: TokenType, value: string): void {
    const start = this.currentPosition();
    this.tokens.push({
      type,
      value,
      start,
      end: {
        line: start.line,
        column: start.column + value.length,
        offset: start.offset + value.length,
      },
    });
  }
}

/**
 * Convenience function to tokenize source
 */
export function tokenize(source: string): Token[] {
  const lexer = new Lexer(source);
  return lexer.tokenize();
}

