# Getting Started with Mackerel

This guide will help you set up and run the Mackerel project.

## Prerequisites

- Node.js 20+ 
- pnpm (recommended) or npm

## Installation

1. **Install pnpm** (if not already installed):
```bash
npm install -g pnpm
```

2. **Install dependencies**:
```bash
pnpm install
```

This will install dependencies for both the parser package and the example site.

## Building the Parser

The `@mackerel/parser` package needs to be built before running the example site:

```bash
cd packages/parser
pnpm build
```

This compiles the TypeScript source to JavaScript in the `dist/` directory.

## Running the Example Site

1. **Set up environment variables**:

Create a `.env` file in the `example-site` directory:

```bash
cd example-site
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=your_api_key_here
```

Get your API key from: https://platform.openai.com/api-keys

2. **Run the development server**:

```bash
pnpm dev
```

3. **Open your browser**:

Visit http://localhost:3000

## Exploring the Demo

### Home Page (/)

The landing page with an overview of Mackerel and a link to the visualizer.

### Schema Visualizer (/visualizer)

An interactive tool to explore schemas and test LLM query expansion:

1. **Select an entity** from the dropdown (Restaurant, Review, or User)
2. **View the schema tree** with color-coded field modifiers:
   - 🔒 Hidden - Not exposed to LLM
   - ✅ Required - Always fetched
   - 💤 Optional - On-demand
   - 🔍 Queryable - Can filter by
3. **Try the query simulator**:
   - Start with default required fields
   - Enter a natural language prompt
   - Watch the LLM expand the query shape
   - See which fields are added

### Example Prompts

Try these in the Query Simulator:

- "Show me their hours and address"
- "What are the tags and price range?"
- "Include the description and photos"
- "Show reviews for this restaurant"

## Running Tests

To run the parser test suite:

```bash
cd packages/parser
pnpm test
```

## Project Structure

```
mackerel/
├── packages/parser/          # Parser package
│   ├── src/
│   │   ├── lexer.ts         # Tokenization
│   │   ├── parser.ts        # AST generation
│   │   ├── validator.ts     # Schema validation
│   │   └── runtime.ts       # Query validation
│   └── tests/
├── example-site/            # Next.js demo
│   ├── schemas/
│   │   └── restaurant.mcrl
│   └── src/
│       ├── app/
│       │   ├── visualizer/  # Visualizer UI
│       │   └── api/mackerel/ # API routes
│       └── lib/
│           └── mackerel.ts  # Schema utilities
└── README.md
```

## Modifying the Schema

The example schema is located at:
```
example-site/schemas/restaurant.mcrl
```

Edit this file to:
- Add new entities
- Modify field modifiers
- Add relations
- Test different access patterns

The schema will be automatically reloaded when you refresh the visualizer.

## API Endpoints

### POST /api/mackerel/expand
Expand query shape based on user prompt.

### GET /api/mackerel/schema
Get parsed schema with statistics.

## Development Workflow

1. **Make changes to parser** (`packages/parser/src/`)
2. **Rebuild**: `cd packages/parser && pnpm build`
3. **Restart dev server** (if needed)
4. **Test in visualizer**

## Troubleshooting

### "Module not found: @mackerel/parser"

Make sure you've built the parser package:
```bash
cd packages/parser
pnpm build
```

### "OPENAI_API_KEY is not defined"

Create a `.env` file in `example-site/` with your API key:
```
OPENAI_API_KEY=your_key_here
```

### Parser build errors

Make sure you have TypeScript installed:
```bash
pnpm install -w typescript
```

### Port 3000 already in use

Run on a different port:
```bash
pnpm dev -- -p 3001
```

## Next Steps

- Explore the schema syntax in `example-site/schemas/restaurant.mcrl`
- Try creating your own entity definitions
- Test different query patterns in the simulator
- Read the API documentation in README.md

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review the parser [README.md](packages/parser/README.md) for parser-specific docs
- Look at the example schema for syntax reference

Happy building! 🚀

