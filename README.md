# Mackerel

> A protocol for malleable data querying in LLM-driven interfaces

Mackerel is a Schema Definition Language (SDL) that enables LLMs to safely and efficiently query data with progressive disclosure. Instead of fetching everything upfront or building rigid APIs, Mackerel lets you define what data is accessible and how, then allows LLMs to expand queries based on user needs.

## Features

- **Safe Defaults**: Fields are hidden by default unless explicitly exposed
- **Progressive Disclosure**: Fetch only what you need, when you need it
- **LLM-Aware**: Designed for natural language query expansion
- **Type-Safe**: Full TypeScript support with validated schemas
- **Developer-Friendly**: Clear syntax with excellent error messages

## Project Structure

```
mackerel/
├── packages/
│   └── parser/          # @mackerel/parser - Production schema parser
│       ├── src/
│       │   ├── lexer.ts      # Tokenization
│       │   ├── parser.ts     # AST generation
│       │   ├── validator.ts  # Semantic validation
│       │   └── runtime.ts    # Query validation
│       └── tests/
├── example-site/        # Next.js demo application
│   ├── schemas/
│   │   └── restaurant.mcrl  # Example schema
│   └── src/
│       └── app/
│           ├── visualizer/      # Schema visualizer UI
│           └── api/mackerel/    # LLM query expansion API
└── schema/              # Documentation
```

## Quick Start

### Installation

```bash
# Install dependencies
pnpm install

# Build the parser
cd packages/parser
pnpm build

# Run the example site
cd ../../example-site
pnpm dev
```

Visit http://localhost:3000 to see the demo.

### Schema Syntax

```mackerel
entity Restaurant {
  // Hidden by default (internal use only)
  id: ID
  createdAt: DateTime

  // Required - always included in queries
  required name: String
  required cuisine: String

  // Optional - fetched on demand
  optional hours: String
  optional address: String

  // Queryable - can filter by
  query priceRange: String
  query tags: [String]

  // Relations - traversable
  relation reviews: [Review] via restaurantId
}
```

## The Problem

Current approaches to LLM data access have issues:

1. **Over-fetching**: Fetch all data upfront → expensive, slow
2. **Under-fetching**: Rigid APIs → poor UX, can't adapt
3. **Security**: Hard to control what LLMs can access
4. **Performance**: No optimization for LLM token usage

## The Mackerel Solution

Mackerel introduces **malleable data querying** where:

1. Developers define schemas with explicit access control
2. LLMs start with minimal required data
3. Users ask for more through natural language
4. LLMs expand queries safely within schema bounds
5. UI updates with new data progressively

### Example Flow

```
Initial Query: { name, cuisine, rating }
                     ↓
User: "Show me their hours too"
                     ↓
LLM expands: { name, cuisine, rating, hours }
                     ↓
UI updates with new data
```

## Schema Modifiers

| Modifier | Visibility | Fetching | Filtering |
|----------|-----------|----------|-----------|
| *(none)* | Hidden | Never | Never |
| `required` | Visible | Always | No |
| `optional` | Visible | On-demand | No |
| `query` | Visible | On-demand | Yes |

## Development

### Running Tests

```bash
cd packages/parser
pnpm test
```

### Building

```bash
# Build parser package
cd packages/parser
pnpm build

# Build example site
cd ../../example-site
pnpm build
```

## Schema Visualizer

The example site includes an interactive schema visualizer at `/visualizer`:

- **Schema Tree**: Visual representation of entities, fields, and relations
- **Query Simulator**: Test natural language queries with LLM expansion
- **Token Estimation**: See token usage for different query shapes
- **Access Control**: Color-coded field visibility

## API Routes

### `POST /api/mackerel/expand`

Expand query shape based on user prompt.

**Request:**
```json
{
  "prompt": "Show me their hours and address",
  "entity": "Restaurant",
  "currentFields": ["name", "cuisine", "rating"]
}
```

**Response:**
```json
{
  "fieldsToAdd": ["hours", "address"],
  "reasoning": "User requested hours and address",
  "updatedFields": ["name", "cuisine", "rating", "hours", "address"]
}
```

### `GET /api/mackerel/schema`

Get parsed schema with statistics.

**Response:**
```json
{
  "schema": { ... },
  "stats": {
    "entities": 3,
    "totalFields": 24,
    "fieldsByModifier": { ... }
  }
}
```

## Environment Variables

```bash
# Required for LLM query expansion
OPENAI_API_KEY=your_api_key_here
```

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys).

## Use Cases

- **Internal tools**: Dashboards that adapt to user questions
- **Data exploration**: Let users discover data through conversation
- **Research interfaces**: Progressive disclosure for complex datasets
- **Admin panels**: Context-aware data views

## Research Context

Mackerel is designed for HCI research on:

- Malleable interfaces in AI-driven systems
- Developer mental models for LLM data access
- User trust in AI data handling
- Progressive disclosure patterns

## Contributing

This is a research project. Feedback and contributions welcome!

## License

MIT

## Acknowledgments

Inspired by:
- GraphQL's type system
- Hasura's PromptQL
- A2UI protocol for agent-to-UI communication

---

Built with ❤️ for the future of malleable interfaces

# mackerel
