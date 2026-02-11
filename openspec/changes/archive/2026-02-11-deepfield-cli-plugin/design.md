## Context

Deepfield is an AI-driven knowledge base builder for understanding brownfield projects. The system requires both universal CLI access (terminal, editors, CI/CD) and Claude Code integration (AI-assisted workflows). Previous design had scripts and commands mixed, lacking proper CLI structure.

**Current State:**
- Exploration analysis complete (`EXPLORATION-ANALYSIS.md`)
- Original implementation attempted in `.claude/plugins/` (wrong location)
- Need proper separation: universal CLI + Claude-specific plugin

**Constraints:**
- Must work standalone without Claude Code
- Must integrate seamlessly with Claude Code when plugin installed
- TypeScript for type safety and maintainability
- Follow OpenSpec patterns (proven architecture)
- Atomic file operations required (prevent state corruption)

**Stakeholders:**
- CLI users: Developers using Deepfield in any environment
- Plugin users: Developers using Claude Code for AI-assisted KB building

## Goals / Non-Goals

**Goals:**
- Build standalone TypeScript CLI tool installable via npm
- Create Claude Code plugin as thin wrapper around CLI
- Share core logic between CLI and plugin (DRY)
- Support three foundational commands: init, start, status
- Implement robust state management and file operations
- Enable interactive Q&A for project setup
- Structure project as monorepo for maintainability

**Non-Goals:**
- AI learning capabilities (Phase 2+)
- Autonomous iteration (Phase 3+)
- Source classification or input handling (Phase 2)
- Web UI or other interfaces (future consideration)
- IDE-specific features beyond Claude Code

## Decisions

### 1. Monorepo Structure vs Separate Repositories

**Decision:** Use monorepo with `cli/` and `plugin/` directories.

**Rationale:**
- Shared core logic (state management, templates, file operations)
- Single version number, synchronized releases
- Easier testing and CI/CD
- Plugin automatically gets CLI updates
- Simpler maintenance (one repo to manage)

**Structure:**
```
deepfield/
├── cli/                    # Standalone CLI tool
│   ├── src/
│   │   ├── commands/       # Command implementations
│   │   ├── core/           # Core logic (reusable)
│   │   └── cli.ts          # CLI entry point
│   ├── templates/          # KB templates
│   ├── package.json        # CLI package
│   └── tsconfig.json
│
├── plugin/                 # Claude Code plugin
│   ├── .claude-plugin/
│   │   └── plugin.json     # Plugin manifest
│   ├── commands/           # Thin CLI wrappers
│   ├── skills/             # Claude-specific knowledge
│   └── package.json        # Plugin metadata
│
├── package.json            # Root workspace
└── README.md
```

**Alternatives Considered:**
- **Separate repos**: More isolation but duplicates code and complicates versioning
- **Plugin only**: Limits usability to Claude Code users

### 2. TypeScript vs JavaScript

**Decision:** Use TypeScript for all code.

**Rationale:**
- Type safety prevents runtime errors
- Better IDE support and autocomplete
- Matches OpenSpec's proven approach
- Self-documenting code (types as documentation)
- Easier refactoring as codebase grows

**Alternatives Considered:**
- **JavaScript**: Simpler but loses type safety benefits
- **Mixed**: Confusing, inconsistent codebase

### 3. CLI Framework: Commander vs Others

**Decision:** Use Commander.js for CLI parsing.

**Rationale:**
- Industry standard (used by OpenSpec, many CLIs)
- Simple, declarative API
- Built-in help generation
- Subcommand support
- Active maintenance

**Usage:**
```typescript
program
  .name('deepfield')
  .description('AI-driven knowledge base builder')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize deepfield/ structure')
  .action(initCommand);
```

**Alternatives Considered:**
- **Yargs**: More verbose, less intuitive
- **Oclif**: Heavy framework, overkill for 3 commands
- **Custom parsing**: Reinventing the wheel

### 4. Interactive Prompts: Inquirer vs Prompts

**Decision:** Use Inquirer.js for interactive Q&A.

**Rationale:**
- Rich question types (list, confirm, input, checkbox)
- Well-established, used by major tools
- Good TypeScript support
- Validation built-in
- Matches OpenSpec patterns

**Usage:**
```typescript
const answers = await inquirer.prompt([
  {
    type: 'list',
    name: 'projectType',
    message: 'What is this project?',
    choices: ['Legacy codebase', 'New team onboarding', ...]
  }
]);
```

**Alternatives Considered:**
- **Prompts**: Lighter but less feature-rich
- **Custom prompts**: Complex, error-prone

### 5. File Operations: fs vs fs-extra

**Decision:** Use fs-extra for file operations.

**Rationale:**
- Promise-based API (better with async/await)
- Extra utilities (copy, move, ensureDir)
- Drop-in replacement for native fs
- Widely used, battle-tested

**Alternatives Considered:**
- **Native fs**: Lacks convenient utilities
- **Custom wrappers**: Reinventing the wheel

### 6. Schema Validation: Zod vs Others

**Decision:** Use Zod for runtime validation.

**Rationale:**
- TypeScript-first design
- Runtime + compile-time validation
- Used by OpenSpec (proven choice)
- Excellent error messages
- Type inference (DRY)

**Usage:**
```typescript
const ProjectConfigSchema = z.object({
  version: z.string(),
  projectName: z.string(),
  goal: z.string(),
  repositories: z.array(RepoSchema),
  createdAt: z.string().datetime(),
  lastModified: z.string().datetime()
});
```

**Alternatives Considered:**
- **Joi**: Not TypeScript-native
- **Yup**: Less TypeScript integration
- **Manual validation**: Error-prone, verbose

### 7. Plugin Commands: Direct Implementation vs CLI Wrapper

**Decision:** Plugin commands are thin wrappers calling CLI.

**Rationale:**
- Single source of truth (CLI implementation)
- CLI remains fully testable independently
- Plugin adds Claude-specific features (skills, agents)
- Changes to CLI logic automatically available in plugin
- Clear separation of concerns

**Plugin command pattern:**
```markdown
# commands/df-init.md
---
name: df-init
description: Initialize deepfield/ directory structure
---

```bash
# Call CLI tool
deepfield init

# Handle result
if [ $? -eq 0 ]; then
  echo "✅ Initialized! Next: /df-start"
fi
```
```

**Alternatives Considered:**
- **Duplicate logic in plugin**: Maintenance nightmare
- **Plugin-only implementation**: CLI users left behind

### 8. Template System: Embedded vs Separate Files

**Decision:** Store templates as separate files in `cli/templates/`.

**Rationale:**
- Easy to edit and maintain
- Can be version controlled clearly
- Users can inspect templates
- No escaping/quoting issues
- CLI bundles them at build time

**Templates:**
- `project.config.json`
- `run.config.json`
- `brief.md`
- `project-map.md`
- `domain-index.md`
- `unknowns.md`
- `_changelog.md`

**Alternatives Considered:**
- **Embedded strings**: Hard to maintain, ugly code
- **Template engine**: Overkill for static templates

### 9. State Management: JSON Files vs Database

**Decision:** Use JSON files for state.

**Rationale:**
- Simple, human-readable
- Easy to version control
- No additional dependencies
- Sufficient for Phase 1 scale
- Easy to debug and inspect
- Atomic writes via temp-then-rename pattern

**State files:**
- `deepfield/project.config.json` - Project metadata
- `deepfield/wip/run-N/run-N.config.json` - Per-run state
- Validated with Zod schemas

**Alternatives Considered:**
- **SQLite**: Overkill for simple config, adds complexity
- **YAML**: Less tooling support in Node.js

### 10. Error Handling Strategy

**Decision:** Structured error handling with exit codes.

**Rationale:**
- CLI tools must return meaningful exit codes
- Errors should be user-friendly
- Stack traces only in debug mode
- Consistent error format across commands

**Exit codes:**
- 0: Success
- 1: General error
- 2: Invalid arguments
- 3: State file error (missing/corrupted)
- 4: Permission error

**Pattern:**
```typescript
try {
  await initCommand();
  process.exit(0);
} catch (error) {
  if (error instanceof PermissionError) {
    console.error('❌ Permission denied:', error.message);
    process.exit(4);
  }
  // ... other error types
}
```

## Risks / Trade-offs

### Risk 1: Node.js Version Dependency

**Risk:** Users without Node.js 18+ cannot use CLI.

**Mitigation:**
- Document requirement clearly in README
- Provide installation instructions for Node.js
- Consider bundled binary in future (pkg, nexe)

### Risk 2: Monorepo Complexity

**Risk:** Managing two packages in one repo adds complexity.

**Mitigation:**
- Use npm workspaces (built-in, simple)
- Clear separation of concerns (cli vs plugin)
- Shared `tsconfig.json` for consistency
- Single CI/CD pipeline

### Risk 3: CLI/Plugin Version Sync

**Risk:** Plugin and CLI versions might drift.

**Mitigation:**
- Plugin specifies CLI as peer dependency
- Single version number for project
- CI checks for version consistency
- Release both together always

### Risk 4: Breaking Changes

**Risk:** CLI changes might break plugin wrappers.

**Mitigation:**
- CLI follows semantic versioning
- Breaking changes require major version bump
- Plugin integration tests against CLI
- Document CLI API stability guarantees

### Trade-off 1: TypeScript Compilation Step

**Trade-off:** TypeScript requires build step (slower development iteration).

**Accepted Because:**
- Type safety worth the tradeoff
- Modern tooling makes it fast (tsx, tsup)
- Production bundles are optimized

### Trade-off 2: npm Dependency

**Trade-off:** Users must have npm/Node.js installed.

**Accepted Because:**
- Target audience (developers) already has Node
- Benefits outweigh installation friction
- Can bundle as binary later if needed

### Trade-off 3: Plugin Size

**Trade-off:** Plugin includes CLI wrapper code.

**Accepted Because:**
- Plugin is still small (<1MB)
- User gets full standalone tool
- No network dependency (doesn't fetch CLI separately)

## Migration Plan

Not applicable (greenfield implementation).

**Installation:**

1. **CLI Only (npm)**
```bash
npm install -g deepfield
deepfield init
```

2. **Plugin (for Claude Code)**
```bash
# CLI automatically included
git clone https://github.com/user/deepfield
cd deepfield
npm install
npm run build

# Link plugin
ln -s $(pwd)/plugin ~/.claude/plugins/deepfield
```

**No migration** needed from deepfield-foundation change - different architecture.

## Open Questions

### Q1: Should CLI be published to npm immediately?

**Options:**
- Publish on v1.0.0 release (recommended)
- Publish early for testing (@deepfield/cli@0.1.0-alpha)
- Delay until Phase 2+ adds more features

**Recommendation:** Publish v1.0.0 after Phase 1 complete and tested.

### Q2: Package scoping - @deepfield/cli or deepfield?

**Options:**
- `deepfield` - Simple, requires npm name availability
- `@deepfield/cli` - Scoped, guaranteed available

**Recommendation:** Try to claim `deepfield`, fallback to `@deepfield/cli`.

### Q3: CLI command prefix - `deepfield` or `df`?

**Options:**
- `deepfield init` - Clear, descriptive
- `df init` - Shorter, faster to type

**Recommendation:** Use `deepfield` as main, add `df` as alias.

### Q4: Should plugin bundle CLI or install as dependency?

**Options:**
- Bundle: Plugin includes compiled CLI code
- Dependency: Plugin requires global `deepfield` install

**Recommendation:** Bundle CLI with plugin (simpler, no external dependency).
