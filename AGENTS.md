# AGENTS.md - Polish Bonds Addon

## Project Overview

This is a **Wealthfolio addon** for importing Polish government bonds (obligacje skarbowe) transactions. It's a React-based plugin that integrates with the Wealthfolio personal finance application.

## Tech Stack

### Core Technologies

- **Language**: TypeScript (ES2020 target, ESNext modules)
- **UI Framework**: React 19
- **Build Tool**: Vite 7
- **Package Manager**: pnpm (with workspace support)
- **Styling**: TailwindCSS 4

### Key Libraries

- **@wealthfolio/addon-sdk** - SDK for building Wealthfolio addons
- **@wealthfolio/ui** - UI component library (Button, Card, Select, Icons, etc.)
- **@tanstack/react-query** - Server state management
- **xlsx** - Excel file parsing (for reading .xls bond data and transaction history)
- **motion** (Framer Motion) - Animations

### Development Dependencies

- **vitest** - Testing framework
- **typescript** - Type checking
- **@vitejs/plugin-react** - React plugin for Vite
- **rollup-plugin-external-globals** - External globals for production build

## Project Structure

```
src/
├── addon.tsx              # Main addon entry point
├── components/            # Reusable React components
│   └── file-dropzone.tsx  # File upload component with drag & drop
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and shared types
│   └── index.ts           # Transaction types, enums, services
├── pages/                 # Page components
├── service/               # Business logic services
│   ├── banks/
│   │   └── mbank/         # mBank integration (in progress)
│   ├── bond-rate/         # Bond rate reading from XLS files
│   │   ├── bonds-reader.ts
│   │   └── bonds-reader.test.ts
│   └── transaction-log/   # Transaction history parsing
│       ├── transaction-reader.ts
│       └── transaction-reader.test.ts
└── types/                 # TypeScript type definitions
```

## Testing

### Testing Framework

- **Vitest** - Fast unit testing framework (Vite-native)

### Running Tests

```bash
pnpm test          # Run tests in watch mode. DO NOT USE IN AGENT
pnpm test --run    # Run tests once
```

### Test Organization

- Tests are co-located with source files using `.test.ts` suffix
- Test assets stored in `__test-assets__/` directories
- Snapshots stored in `__snapshots__/` directories

### Testing Patterns Used

- **Snapshot testing** for complex object comparisons (bond values, transactions)
- **File-based testing** - loading real XLS files from `__test-assets__/`
- **describe/it** pattern for test organization

### Example Test Structure

```typescript
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("service-name", () => {
    const loadTestFile = (): Uint8Array => {
        const filePath = path.join(__dirname, "__test-assets__/file.xls");
        return new Uint8Array(fs.readFileSync(filePath));
    };

    it("should do something", () => {
        const result = myFunction(loadTestFile());
        expect(result).toMatchSnapshot();
    });
});
```

## Type Checking

```bash
pnpm type-check    # Run TypeScript type checking without emitting files
pnpm lint          # Alias for type-check
```

### TypeScript Configuration

- Strict mode enabled
- JSX: react-jsx (automatic runtime)
- Module resolution: Bundler

## Code Style & Conventions

### File Naming

- React components: `kebab-case.tsx`
- Services/utilities: `kebab-case.ts`
- Tests: `*.test.ts`

### Import Style

- Named imports preferred
- Path aliases not configured (use relative imports)

### Types

- Use interfaces for data structures
- Use `type` for unions and computed types
- Export types from `lib/index.ts` or `types/index.ts`

### React Patterns

- Functional components with hooks
- `useState` and `useQuery` for state management
- Props destructuring in function parameters

### New brokers

- Create a new service under `service/brokers/`
- Implement transaction reader and parser
- Add unit tests in the same directory
- Add broker to `SupportedService` enum in `types/index.ts`
- If you are not sure, check existing implementations

## Build Commands

```bash
pnpm build         # Production build
pnpm dev           # Watch mode build
pnpm dev:server    # Start Wealthfolio dev server
pnpm bundle        # Clean, build, and package addon
```

## Notes for AI Agents

1. **Don't modify test assets** - XLS files in `__test-assets__/` are real data samples
2. **Update snapshots** when changing output format: `pnpm test --run --update`
3. **Excel parsing** uses SheetJS (xlsx) - data comes as arrays of arrays
4. **External React** - React is externalized in production build (provided by host)
5. **Currency** - All amounts are in PLN (Polish Złoty)
6. **Dates** - Bond dates come from Excel as JS Date objects
