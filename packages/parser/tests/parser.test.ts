import { test, describe } from 'node:test';
import assert from 'node:assert';
import { tokenize } from '../src/lexer';
import { Parser, ParseError } from '../src/parser';
import { Schema, Entity, Field } from '../src/ast';

describe('Parser', () => {
  test('should parse empty schema', () => {
    const tokens = tokenize('');
    const parser = new Parser(tokens);
    const schema = parser.parse();

    assert.strictEqual(schema.type, 'Schema');
    assert.strictEqual(schema.entities.length, 0);
  });

  test('should parse entity with no fields', () => {
    const tokens = tokenize('entity Restaurant {}');
    const parser = new Parser(tokens);
    const schema = parser.parse();

    assert.strictEqual(schema.entities.length, 1);
    assert.strictEqual(schema.entities[0].name, 'Restaurant');
    assert.strictEqual(schema.entities[0].fields.length, 0);
  });

  test('should parse entity with required field', () => {
    const tokens = tokenize(`
entity Restaurant {
  required name: String
}
    `);
    const parser = new Parser(tokens);
    const schema = parser.parse();

    const entity = schema.entities[0];
    assert.strictEqual(entity.fields.length, 1);
    
    const field = entity.fields[0];
    assert.strictEqual(field.name, 'name');
    assert.strictEqual(field.modifier, 'required');
    assert.strictEqual(field.fieldType.type, 'ScalarType');
    if (field.fieldType.type === 'ScalarType') {
      assert.strictEqual(field.fieldType.name, 'String');
    }
  });

  test('should parse entity with optional field', () => {
    const tokens = tokenize(`
entity Restaurant {
  optional hours: String
}
    `);
    const parser = new Parser(tokens);
    const schema = parser.parse();

    const field = schema.entities[0].fields[0];
    assert.strictEqual(field.modifier, 'optional');
  });

  test('should parse entity with query field', () => {
    const tokens = tokenize(`
entity Restaurant {
  query cuisine: String
}
    `);
    const parser = new Parser(tokens);
    const schema = parser.parse();

    const field = schema.entities[0].fields[0];
    assert.strictEqual(field.modifier, 'query');
  });

  test('should parse entity with hidden field (no modifier)', () => {
    const tokens = tokenize(`
entity Restaurant {
  id: ID
}
    `);
    const parser = new Parser(tokens);
    const schema = parser.parse();

    const field = schema.entities[0].fields[0];
    assert.strictEqual(field.name, 'id');
    assert.strictEqual(field.modifier, undefined);
  });

  test('should parse array type', () => {
    const tokens = tokenize(`
entity Restaurant {
  query tags: [String]
}
    `);
    const parser = new Parser(tokens);
    const schema = parser.parse();

    const field = schema.entities[0].fields[0];
    assert.strictEqual(field.fieldType.type, 'ListType');
    if (field.fieldType.type === 'ListType') {
      assert.strictEqual(field.fieldType.elementType.type, 'ScalarType');
      if (field.fieldType.elementType.type === 'ScalarType') {
        assert.strictEqual(field.fieldType.elementType.name, 'String');
      }
    }
  });

  test('should parse relation', () => {
    const tokens = tokenize(`
entity Restaurant {
  relation reviews: [Review] via restaurantId
}
    `);
    const parser = new Parser(tokens);
    const schema = parser.parse();

    const entity = schema.entities[0];
    assert.strictEqual(entity.relations.length, 1);
    
    const relation = entity.relations[0];
    assert.strictEqual(relation.name, 'reviews');
    assert.strictEqual(relation.targetEntity, 'Review');
    assert.strictEqual(relation.via, 'restaurantId');
    assert.strictEqual(relation.isArray, true);
  });

  test('should parse singular relation', () => {
    const tokens = tokenize(`
entity Review {
  relation restaurant: Restaurant via restaurantId
}
    `);
    const parser = new Parser(tokens);
    const schema = parser.parse();

    const relation = schema.entities[0].relations[0];
    assert.strictEqual(relation.isArray, false);
    assert.strictEqual(relation.targetEntity, 'Restaurant');
  });

  test('should parse relation with arrow syntax', () => {
    const tokens = tokenize(`
entity Restaurant {
  -> reviews: [Review] via restaurantId
}
    `);
    const parser = new Parser(tokens);
    const schema = parser.parse();

    const relation = schema.entities[0].relations[0];
    assert.strictEqual(relation.name, 'reviews');
  });

  test('should parse multiple entities', () => {
    const tokens = tokenize(`
entity Restaurant {
  required name: String
}

entity Review {
  required rating: Int
}
    `);
    const parser = new Parser(tokens);
    const schema = parser.parse();

    assert.strictEqual(schema.entities.length, 2);
    assert.strictEqual(schema.entities[0].name, 'Restaurant');
    assert.strictEqual(schema.entities[1].name, 'Review');
  });

  test('should parse complex schema', () => {
    const tokens = tokenize(`
entity Restaurant {
  id: ID
  createdAt: DateTime
  required name: String
  required cuisine: String
  optional hours: String
  optional address: String
  query priceRange: String
  query tags: [String]
  relation reviews: [Review] via restaurantId
}

entity Review {
  id: ID
  required rating: Int
  optional comment: String
  relation restaurant: Restaurant via restaurantId
}
    `);
    const parser = new Parser(tokens);
    const schema = parser.parse();

    assert.strictEqual(schema.entities.length, 2);
    
    const restaurant = schema.entities[0];
    assert.strictEqual(restaurant.fields.length, 8);
    assert.strictEqual(restaurant.relations.length, 1);
    
    const review = schema.entities[1];
    assert.strictEqual(review.fields.length, 3);
    assert.strictEqual(review.relations.length, 1);
  });

  test('should throw error on missing colon', () => {
    const tokens = tokenize('entity Restaurant { name String }');
    const parser = new Parser(tokens);

    assert.throws(
      () => parser.parse(),
      (error: any) => {
        return error instanceof ParseError && error.message.includes("Expected ':'");
      }
    );
  });

  test('should throw error on missing brace', () => {
    const tokens = tokenize('entity Restaurant {');
    const parser = new Parser(tokens);

    assert.throws(
      () => parser.parse(),
      (error: any) => {
        return error instanceof ParseError && error.message.includes("Expected '}'");
      }
    );
  });
});

