# plugin-structure Specification

## Purpose
TBD - created by archiving change deepfield-foundation. Update Purpose after archive.
## Requirements
### Requirement: Plugin manifest SHALL define metadata

The plugin MUST provide a `plugin.json` manifest file at the plugin root that includes:
- Plugin name: "deepfield"
- Plugin version (semantic versioning)
- Description
- Author
- Commands list with names and file paths

#### Scenario: Valid manifest enables plugin loading
- **WHEN** Claude Code loads plugins
- **THEN** deepfield plugin is discovered via plugin.json
- **THEN** all commands are registered and available

#### Scenario: Missing manifest prevents plugin loading
- **WHEN** plugin.json does not exist
- **THEN** plugin is not loaded
- **THEN** commands are not available

### Requirement: Plugin SHALL follow Claude Code directory conventions

The plugin directory structure MUST be:
```
.claude/plugins/deepfield/
├── plugin.json
├── commands/
│   ├── df-init.md
│   ├── df-start.md
│   └── df-status.md
├── scripts/
│   ├── mkdir-recursive.sh
│   ├── scaffold-kb.sh
│   ├── update-json.js
│   ├── read-state.js
│   └── hash-files.js
└── templates/
    ├── project.config.json
    ├── run.config.json
    └── brief.md
```

#### Scenario: Standard layout enables component discovery
- **WHEN** commands are invoked
- **THEN** command files are found in commands/ directory
- **THEN** scripts are accessible from scripts/ directory
- **THEN** templates are accessible from templates/ directory

### Requirement: Commands SHALL be defined as markdown files

Each command MUST be a markdown file with:
- YAML frontmatter with command metadata (name, description)
- Command implementation in markdown body
- Bash code blocks for script invocation

#### Scenario: Command markdown enables Claude Code execution
- **WHEN** user invokes /df-init
- **THEN** Claude Code reads commands/df-init.md
- **THEN** command logic executes per markdown instructions

### Requirement: Plugin SHALL use CLAUDE_PLUGIN_ROOT variable

Scripts and commands MUST reference the plugin root directory using `${CLAUDE_PLUGIN_ROOT}` variable for portability.

#### Scenario: Plugin root variable enables portability
- **WHEN** scripts need to reference plugin files
- **THEN** ${CLAUDE_PLUGIN_ROOT} resolves to plugin directory
- **THEN** paths work regardless of installation location

