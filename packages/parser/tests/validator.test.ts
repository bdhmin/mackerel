import { test, describe } from 'node:test';
import assert from 'node:assert';
import { parseSchema } from '../src/index';

describe('Validator', () => {
  test('should validate correct schema', () => {
    const result = parseSchema(`
entity Restaurant {
  required name: String
  optional hours: String
}
    `);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.errors.length, 0);
  });

  test('should detect duplicate entity names', () => {
    const result = parseSchema(`
entity Restaurant {
  required name: String
}

entity Restaurant {
  required title: String
}
    `);

    assert.strictEqual(result.success, false);
    assert.ok(result.errors[0].includes('Duplicate entity'));
  });

  test('should detect duplicate field names', () => {
    const result = parseSchema(`
entity Restaurant {
  required name: String
  optional name: String
}
    `);

    assert.strictEqual(result.success, false);
    assert.ok(result.errors[0].includes('Duplicate field'));
  });

  test('should detect duplicate relation names', () => {
    const result = parseSchema(`
entity Restaurant {
  relation reviews: [Review] via restaurantId
  relation reviews: [Review] via id
}
    `);

    assert.strictEqual(result.success, false);
    assert.ok(result.errors[0].includes('Duplicate relation'));
  });

  test('should detect field/relation name conflicts', () => {
    const result = parseSchema(`
entity Restaurant {
  required reviews: String
  relation reviews: [Review] via restaurantId
}
    `);

    assert.strictEqual(result.success, false);
    assert.ok(result.errors[0].includes('conflicts with field name'));
  });

  test('should detect unknown type', () => {
    const result = parseSchema(`
entity Restaurant {
  required name: UnknownType
}
    `);

    assert.strictEqual(result.success, false);
    assert.ok(result.errors[0].includes('Unknown type'));
  });

  test('should detect unknown target entity in relation', () => {
    const result = parseSchema(`
entity Restaurant {
  relation reviews: [NonExistent] via restaurantId
}
    `);

    assert.strictEqual(result.success, false);
    assert.ok(result.errors[0].includes('unknown entity'));
  });

  test('should allow all built-in types', () => {
    const result = parseSchema(`
entity Test {
  field1: String
  field2: Int
  field3: Float
  field4: Boolean
  field5: ID
  field6: DateTime
}
    `);

    assert.strictEqual(result.success, true);
  });

  test('should validate array types correctly', () => {
    const result = parseSchema(`
entity Restaurant {
  query tags: [String]
  query numbers: [Int]
}
    `);

    assert.strictEqual(result.success, true);
  });

  test('should detect unknown type in array', () => {
    const result = parseSchema(`
entity Restaurant {
  query items: [UnknownType]
}
    `);

    assert.strictEqual(result.success, false);
    assert.ok(result.errors[0].includes('Unknown type'));
  });
});

