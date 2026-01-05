# @mackerel/parser

Production-quality schema parser for Mackerel SDL (Schema Definition Language).

## Installation

```bash
npm install @mackerel/parser
# or
pnpm add @mackerel/parser
```

## Usage

```typescript
import { parseSchema } from '@mackerel/parser';

const source = `
entity Restaurant {
  id: ID
  required name: String
  optional hours: String
  query cuisine: String
  relation reviews: [Review] via restaurantId
}

entity Review {
  id: ID
  required rating: Int
  optional comment: String
}
`;

const result = parseSchema(source);

if (result.success) {
  console.log('Schema:', result.schema);
} else {
  console.error('Errors:', result.errors);
}
```

## Syntax

### Entity Definition

```mackerel
entity EntityName {
  // fields and relations
}
```

### Fields

Fields can have modifiers that control their visibility and usage:

```mackerel
entity Restaurant {
  // Hidden (default) - not exposed to LLM
  id: ID
  createdAt: DateTime

  // Required - always fetched
  required name: String
  required cuisine: String

  // Optional - fetched on demand
  optional hours: String
  optional address: String

  // Queryable - can filter by (implies optional)
  query priceRange: String
  query tags: [String]
}
```

### Types

**Built-in Scalar Types:**
- `String`
- `Int`
- `Float`
- `Boolean`
- `ID`
- `DateTime`

**Array Types:**
```mackerel
tags: [String]
scores: [Int]
```

### Relations

Relations define connections between entities:

```mackerel
entity Restaurant {
  // Many-to-one (singular)
  relation owner: User via ownerId

  // One-to-many (array)
  relation reviews: [Review] via restaurantId
}
```

Alternative arrow syntax:

```mackerel
entity Restaurant {
  -> reviews: [Review] via restaurantId
}
```

## API

### `parseSchema(source: string): ParseResult`

Parses a Mackerel schema from source code.

**Returns:**
```typescript
{
  success: boolean;
  schema?: Schema;    // Present if success is true
  errors: string[];   // Error messages if success is false
}
```

### AST Types

The parser exports TypeScript types for the AST:

```typescript
import { Schema, Entity, Field, Relation } from '@mackerel/parser';
```

## Testing

```bash
pnpm test
```

## License

MIT

