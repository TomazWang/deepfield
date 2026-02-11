# Deepfield Plugin for Claude Code

Claude Code plugin providing AI-assisted knowledge base management through Deepfield CLI.

## Installation

### Prerequisites

1. **Install Deepfield CLI** (globally or locally)

```bash
npm install -g deepfield
```

2. **Clone/navigate to Deepfield repository**

```bash
cd deepfield
```

3. **Build the project**

```bash
npm install
npm run build
```

4. **Link plugin to Claude Code**

```bash
ln -s $(pwd)/plugin ~/.claude/plugins/deepfield
```

5. **Restart Claude Code** to load the plugin

## Commands

### /df-init

Initialize deepfield/ directory structure.

**What it does:**
- Creates four-space directory architecture
- Copies template files
- Sets up knowledge base workspace

**Usage:**

```
/df-init
```

### /df-start

Start interactive project setup.

**What it does:**
- Asks questions about your project
- Creates project.config.json
- Pre-fills brief.md template

**Usage:**

```
/df-start
```

### /df-status

Display current project state.

**What it does:**
- Shows workflow state
- Displays project information
- Suggests next actions

**Usage:**

```
/df-status
```

## Skills

### Knowledge Base Management

**Triggers:**
- knowledge base
- kb setup
- deepfield
- brownfield project
- legacy codebase
- documentation

**What it provides:**
- Guidance on Deepfield workflow
- Best practices for KB building
- Common use cases
- Troubleshooting help

**When it activates:**
- When you ask about knowledge base creation
- When discussing brownfield projects
- When exploring legacy codebases

## Plugin Architecture

```
plugin/
├── .claude-plugin/
│   └── plugin.json        # Plugin manifest
├── commands/              # Plugin commands
│   ├── df-init.md         # Initialize command
│   ├── df-start.md        # Start command
│   └── df-status.md       # Status command
├── skills/                # Skills
│   └── kb-management/     # KB Management skill
│       ├── SKILL.md       # Skill definition
│       └── examples/      # Usage examples
└── package.json
```

## How It Works

The plugin is a thin wrapper around the Deepfield CLI:

1. **Commands** call CLI tools via bash
2. **Skills** provide Claude with Deepfield knowledge
3. **Examples** show concrete usage patterns

This architecture keeps the CLI fully functional standalone while adding Claude Code integration.

## Workflow

### Complete Workflow Example

```
1. /df-init
   ↓
2. /df-start (answer questions)
   ↓
3. Fill out deepfield/brief.md
   ↓
4. /df-status (check progress)
   ↓
5. Phase 2+: Run exploration commands
```

## Workflow States

| State | Description | Next Step |
|-------|-------------|-----------|
| EMPTY | No deepfield/ directory | Run /df-init |
| INITIALIZED | Directory exists, no config | Run /df-start |
| CONFIGURED | Config exists, brief needs filling | Fill brief.md |
| READY | Brief complete, ready for exploration | Phase 2+ features |
| IN_PROGRESS | Exploration running | Wait |
| COMPLETED | Exploration done | Review outputs |

## Examples

See `skills/kb-management/examples/` for:

- **complete-workflow.md** - Full workflow walkthrough
- **brief-example.md** - Well-filled-out brief

## Tips for Using with Claude

1. **Start with /df-init** to create structure
2. **Use /df-start** for interactive setup
3. **Fill out the brief thoroughly** - it guides exploration
4. **Check /df-status** anytime to see where you are
5. **Ask questions** - the KB management skill can help

## Troubleshooting

### Plugin not loading

```bash
# Verify plugin is linked
ls -la ~/.claude/plugins/deepfield

# Check plugin.json exists
cat ~/.claude/plugins/deepfield/.claude-plugin/plugin.json

# Restart Claude Code
```

### Commands not found

Verify Deepfield CLI is installed:

```bash
deepfield --version
```

If not installed:

```bash
npm install -g deepfield
```

### CLI not in PATH

If Claude can't find the `deepfield` command, add npm global bin to PATH:

```bash
# Add to ~/.zshrc or ~/.bashrc
export PATH="$PATH:$(npm config get prefix)/bin"
```

## Development

### Update Plugin

After changes, rebuild the project:

```bash
npm run build
```

No need to relink - the symlink stays valid.

### Test Commands

Test commands directly in Claude Code:

```
/df-init
/df-start
/df-status
```

### Validate Plugin Structure

Ensure all required files exist:

```bash
# Check structure
ls -R plugin/

# Validate plugin.json
cat plugin/.claude-plugin/plugin.json | jq .
```

## License

MIT
