import { test, describe } from 'node:test';
import assert from 'node:assert';
import { Lexer, TokenType, LexerError } from '../src/lexer';

describe('Lexer', () => {
  test('should tokenize entity keyword', () => {
    const lexer = new Lexer('entity');
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens.length, 2); // entity + EOF
    assert.strictEqual(tokens[0].type, TokenType.ENTITY);
    assert.strictEqual(tokens[0].value, 'entity');
    assert.strictEqual(tokens[1].type, TokenType.EOF);
  });

  test('should tokenize modifiers', () => {
    const lexer = new Lexer('required optional query');
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.REQUIRED);
    assert.strictEqual(tokens[1].type, TokenType.OPTIONAL);
    assert.strictEqual(tokens[2].type, TokenType.QUERY);
  });

  test('should tokenize symbols', () => {
    const lexer = new Lexer(': -> { } [ ]');
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.COLON);
    assert.strictEqual(tokens[1].type, TokenType.ARROW);
    assert.strictEqual(tokens[2].type, TokenType.LEFT_BRACE);
    assert.strictEqual(tokens[3].type, TokenType.RIGHT_BRACE);
    assert.strictEqual(tokens[4].type, TokenType.LEFT_BRACKET);
    assert.strictEqual(tokens[5].type, TokenType.RIGHT_BRACKET);
  });

  test('should tokenize identifiers', () => {
    const lexer = new Lexer('Restaurant name_field ID123');
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[0].value, 'Restaurant');
    assert.strictEqual(tokens[1].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[1].value, 'name_field');
    assert.strictEqual(tokens[2].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[2].value, 'ID123');
  });

  test('should skip comments', () => {
    const lexer = new Lexer('entity // this is a comment\nRestaurant');
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens.length, 3); // entity, Restaurant, EOF
    assert.strictEqual(tokens[0].type, TokenType.ENTITY);
    assert.strictEqual(tokens[1].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[1].value, 'Restaurant');
  });

  test('should handle complete entity definition', () => {
    const source = `
entity Restaurant {
  required name: String
  optional hours: String
}`;
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const types = tokens.map((t) => t.type);
    assert.ok(types.includes(TokenType.ENTITY));
    assert.ok(types.includes(TokenType.REQUIRED));
    assert.ok(types.includes(TokenType.OPTIONAL));
    assert.ok(types.includes(TokenType.COLON));
    assert.ok(types.includes(TokenType.LEFT_BRACE));
    assert.ok(types.includes(TokenType.RIGHT_BRACE));
  });

  test('should track line and column numbers', () => {
    const lexer = new Lexer('entity\nRestaurant');
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].start.line, 1);
    assert.strictEqual(tokens[0].start.column, 1);
    assert.strictEqual(tokens[1].start.line, 2);
    assert.strictEqual(tokens[1].start.column, 1);
  });

  test('should throw error on unexpected character', () => {
    const lexer = new Lexer('entity @Invalid');

    assert.throws(
      () => lexer.tokenize(),
      (error: any) => {
        return error instanceof LexerError && error.message.includes('Unexpected character');
      }
    );
  });

  test('should handle relation arrow', () => {
    const lexer = new Lexer('-> reviews');
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.ARROW);
    assert.strictEqual(tokens[0].value, '->');
    assert.strictEqual(tokens[1].type, TokenType.IDENTIFIER);
  });
});

