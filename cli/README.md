# Deepfield CLI

Standalone command-line tool for AI-driven knowledge base building.

## Installation

### Global Installation

```bash
npm install -g deepfield
```

### Local Installation

```bash
npm install --save-dev deepfield
```

## Usage

### Initialize Knowledge Base

```bash
deepfield init
```

Creates the deepfield/ directory structure with templates.

**Options:**
- `-f, --force` - Overwrite existing files
- `-y, --yes` - Skip confirmation prompts

### Configure Project

```bash
deepfield start
```

Interactive setup that collects project information and creates configuration.

### Check Status

```bash
deepfield status
```

Display current workflow state and project information.

**Options:**
- `-v, --verbose` - Show detailed information

### Aliases

The `df` command is an alias for `deepfield`:

```bash
df init
df start
df status
```

## Development

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev -- <command> [options]
```

Example:

```bash
npm run dev -- init
npm run dev -- status --verbose
```

### Link Globally

```bash
npm link
```

Makes `deepfield` available globally for testing.

## Architecture

### Directory Structure

```
cli/
├── src/
│   ├── commands/          # Command implementations
│   │   ├── init.ts        # Initialize command
│   │   ├── start.ts       # Start command
│   │   └── status.ts      # Status command
│   ├── core/              # Core logic
│   │   ├── errors.ts      # Error classes
│   │   ├── file-ops.ts    # Atomic file operations
│   │   ├── hash.ts        # File hashing (git/MD5)
│   │   ├── scaffold.ts    # Directory scaffolding
│   │   ├── schemas.ts     # Zod schemas
│   │   └── state.ts       # State management
│   └── cli.ts             # CLI entry point
├── templates/             # Knowledge base templates
└── package.json
```

### Technology Stack

- **TypeScript** - Type-safe development
- **Commander.js** - CLI framework
- **Inquirer.js** - Interactive prompts
- **Chalk** - Terminal styling
- **Zod** - Runtime validation
- **fs-extra** - Enhanced file operations
- **tsup** - Build tooling

## Exit Codes

- **0** - Success
- **1** - General error
- **2** - Invalid arguments
- **3** - State file error (missing/corrupted)
- **4** - Permission error

## Error Handling

Errors include helpful messages and suggestions:

```bash
deepfield init
# ❌ Error: Permission denied: /path/to/directory
# 💡 Suggestion: Try running with sudo or check directory permissions
```

Use `--debug` flag to see stack traces:

```bash
deepfield init --debug
```

## Templates

The CLI includes templates for knowledge base files:

- `project.config.json` - Project configuration
- `run.config.json` - Run configuration
- `brief.md` - Project brief
- `project-map.md` - Structural map
- `domain-index.md` - Domain organization
- `unknowns.md` - Questions and uncertainties
- `_changelog.md` - Run history

Templates are bundled with the CLI during build.

## State Management

### ProjectConfig Schema

```typescript
{
  version: string,
  projectName: string,
  goal: string,
  projectType?: string,
  focusAreas: string[],
  repositories: Repository[],
  createdAt: string (ISO datetime),
  lastModified: string (ISO datetime)
}
```

### RunConfig Schema

```typescript
{
  runNumber: number,
  status: 'initialized' | 'scanning' | 'analyzing' | 'learning' | 'completed' | 'paused' | 'failed',
  startedAt: string (ISO datetime),
  completedAt: string | null (ISO datetime),
  sourceSnapshot: Record<string, string>,
  changesDetected: boolean,
  learningGenerated: boolean
}
```

## License

MIT
