## Why

Interactive CLI commands like `deepfield start` require stdin input and block when invoked from Claude Code plugin commands, skills, or agents. The Bash tool cannot provide interactive input, causing commands to hang (exit code 130). This prevents the plugin from working correctly and forces users to run CLI commands directly in their terminal as a workaround.

## What Changes

- Add non-interactive execution modes to plugin commands using Claude Code's `AskUserQuestion` tool
- Keep CLI interactive capabilities for direct terminal use unchanged
- Add CLI flags for non-interactive invocation (e.g., `--non-interactive`, `--answers-json`)
- Update skills and agents to never invoke blocking interactive CLI commands
- Create interaction abstraction layer that switches between AskUserQuestion (plugin) and stdin prompts (CLI)

## Capabilities

### New Capabilities
- `plugin-interaction`: Plugin commands and skills use AskUserQuestion tool for user interaction instead of CLI stdin prompts
- `cli-non-interactive-mode`: CLI supports non-interactive flags for scripting and plugin invocation

### Modified Capabilities
- `interactive-setup`: df-start command flow changes from CLI stdin to AskUserQuestion-based interaction

## Impact

**Commands Affected:**
- `commands/df-init.md` - Optional start trigger (currently commented out invocation code)
- `commands/df-start.md` - Q&A flow for project setup
- `commands/df-continue.md` - May invoke skills that call CLI

**Skills Affected:**
- `skills/deepfield-bootstrap.md` - Invokes CLI tools
- `skills/deepfield-iterate.md` - Invokes CLI tools

**CLI Affected:**
- `deepfield` CLI tool needs non-interactive mode flags
- Add `--answers-json` flag to accept structured input
- Add `--non-interactive` flag to disable prompts

**User Experience:**
- Plugin users: Interaction through Claude Code's native prompts (better UX)
- CLI users: No change, still interactive
- Automation: CLI can now be scripted with flags
