## Context

The Deepfield plugin has two execution paths:
1. **Claude Code plugin** - User invokes `/df-*` commands which execute markdown files with embedded bash
2. **Standalone CLI** - User runs `deepfield <command>` directly in terminal

Currently, plugin commands call the CLI (`deepfield start`, etc.), which uses interactive stdin prompts. Claude Code's Bash tool cannot provide stdin input, causing commands to hang.

**Current State:**
- Plugin commands are markdown files that invoke CLI via bash
- CLI commands use interactive prompts (readline, inquirer, etc.)
- No abstraction layer separates "ask user" from "how to ask"

**Constraints:**
- Cannot modify Claude Code's Bash tool (external dependency)
- Must maintain backward compatibility for CLI direct use
- Plugin commands are markdown with embedded bash, not full TypeScript/JS

**Stakeholders:**
- Plugin users (interact via Claude Code)
- CLI users (interact via terminal)
- Skill/agent developers (need non-blocking invocations)

## Goals / Non-Goals

**Goals:**
- Plugin commands use AskUserQuestion for all user interaction
- CLI remains fully interactive for direct terminal use
- Skills and agents never block on interactive prompts
- CLI supports non-interactive mode for scripting/automation
- Solution works with markdown-based plugin commands

**Non-Goals:**
- Rewriting plugin commands as executable scripts (keep markdown)
- Changing CLI's interactive UX for terminal users
- Supporting all possible CLI frameworks (focus on current implementation)
- Real-time streaming/progress bars in non-interactive mode

## Decisions

### Decision 1: Dual-Path Implementation Strategy

**Choice:** Plugin commands implement interaction directly using AskUserQuestion, CLI remains separate

**Rationale:**
- **Independence**: Plugin and CLI can evolve separately
- **Simplicity**: No complex abstraction layer needed
- **Markdown-friendly**: AskUserQuestion works in markdown bash blocks
- **Type safety**: No need to serialize/deserialize complex prompts

**Alternatives considered:**
- **Option A: CLI abstraction layer** (stdin vs AskUserQuestion)
  - Rejected: Complex, requires CLI to know about Claude Code
  - Would need environment detection and conditional logic
- **Option B: CLI JSON input/output mode**
  - Rejected: Still requires plugin to format questions, parse answers
  - Adds serialization overhead
- **Option C: Separate plugin implementation** (no CLI calls)
  - **SELECTED**: Cleanest separation of concerns

**Implementation:**
```yaml
# df-start.md implements Q&A directly
questions:
  - question: "What is this project?"
    header: "Project Type"
    options:
      - label: "Legacy codebase I'm taking over"
      - label: "New team onboarding target"
      # ... etc

# CLI remains unchanged
deepfield start
  → Uses inquirer/readline for terminal prompts
```

### Decision 2: CLI Non-Interactive Mode for Skills/Agents

**Choice:** Add `--non-interactive` and `--answers-json` flags to CLI commands

**Rationale:**
- **Flexibility**: Enables automation and testing
- **Graceful degradation**: Skills can fall back to CLI when needed
- **Standard pattern**: Common in CLI tools (apt-get, npm, etc.)

**Implementation:**
```bash
# CLI with flags
deepfield start --non-interactive \
  --answers-json '{"projectType":"legacy","goal":"understand",...}'

# Or answers file
deepfield start --non-interactive --answers-file answers.json
```

**Flag behavior:**
- `--non-interactive`: Skip all prompts, use defaults or fail if required input missing
- `--answers-json <json>`: Provide answers as JSON string
- `--answers-file <path>`: Read answers from file
- Exit code 1 if required input missing in non-interactive mode

### Decision 3: Skills Invoke CLI with Non-Interactive Flags

**Choice:** Skills pass answers collected from AskUserQuestion to CLI via JSON flags

**Rationale:**
- **Reuse CLI logic**: Don't duplicate setup/validation code
- **Maintain CLI as source of truth**: All actual operations in CLI
- **Type safety**: Skills validate answers before passing to CLI

**Implementation:**
```bash
# In skills/deepfield-bootstrap.md
# Step 1: Collect answers via AskUserQuestion
# (Already in Claude Code context)

# Step 2: Format as JSON
ANSWERS_JSON=$(cat <<EOF
{
  "projectType": "$PROJECT_TYPE",
  "goal": "$GOAL",
  "focusAreas": ["$FOCUS_1", "$FOCUS_2"],
  "maxRuns": $MAX_RUNS
}
EOF
)

# Step 3: Call CLI with answers
deepfield start --non-interactive --answers-json "$ANSWERS_JSON"
```

### Decision 4: Keep Commented Code in df-init

**Choice:** Keep the commented-out auto-invocation code in df-init.md as-is

**Rationale:**
- Documents intended future behavior
- Shows the design consideration
- Can be uncommented when `/df-start` becomes non-blocking

**Note:** This change enables uncommenting those lines:
```bash
# Currently commented:
# if [ "$CHOICE" = "Yes, let's start" ]; then
#   exec "${CLAUDE_PLUGIN_ROOT}/commands/df-start.md"

# After this change, can uncomment because df-start won't block
```

## Risks / Trade-offs

### Risk: Duplicate Q&A logic between plugin and CLI

**Mitigation:**
- Keep CLI as single source of truth for validation logic
- Plugin Q&A focuses on collection, passes to CLI for processing
- Document question format in spec for consistency
- Future: Consider generating plugin Q&A from CLI schema

### Risk: JSON serialization errors in bash

**Mitigation:**
- Use heredoc with proper quoting for multi-line JSON
- Validate JSON before passing to CLI
- CLI validates and returns clear errors for malformed JSON

### Risk: CLI flag proliferation (--answers-json, --answers-file, etc.)

**Mitigation:**
- Start with minimal flags (`--non-interactive`, `--answers-json`)
- Only add `--answers-file` if needed for large configs
- Document flag precedence clearly

### Risk: Users accidentally run interactive commands from skills

**Mitigation:**
- Update skill documentation with clear warnings
- Add examples showing correct non-interactive usage
- Linter rule (future): Detect interactive CLI calls in skills

### Trade-off: Some code duplication vs complex abstraction

**Choice:** Accept duplication (plugin Q&A + CLI Q&A)
**Benefit:** Simple, maintainable, no cross-dependencies
**Cost:** Must keep Q&A in sync manually (documented in specs)

## Migration Plan

### Phase 1: Add CLI Non-Interactive Flags

1. Add `--non-interactive` flag to CLI commands
2. Add `--answers-json` flag support
3. Update CLI to accept JSON answers and skip prompts
4. Test CLI non-interactive mode

**Validation:**
```bash
# Test non-interactive CLI
deepfield start --non-interactive \
  --answers-json '{"projectType":"legacy","goal":"understand","maxRuns":5}'
# Should complete without prompts
```

### Phase 2: Update Plugin Commands

1. Update `df-start.md` to use AskUserQuestion directly
2. Format answers and pass to CLI with `--non-interactive`
3. Remove direct CLI invocations that would block
4. Update `df-init.md` (uncomment auto-invocation if desired)

**Validation:**
```bash
# Test plugin command
/df-start
# Should show Claude Code's AskUserQuestion prompts
# Should call CLI non-interactively after collecting answers
```

### Phase 3: Update Skills

1. Update `deepfield-bootstrap.md` to use non-interactive CLI
2. Update any other skills calling CLI
3. Add documentation about non-interactive requirement

**Validation:**
- Run full bootstrap workflow
- Verify no hanging/blocking on prompts

### Rollback Strategy

If issues arise:
1. **Plugin only**: Revert markdown files (git revert)
2. **CLI flags**: Flags are additive, can ignore if broken
3. **Both**: Independent changes, can rollback separately

No database migrations or breaking changes - purely additive.

## Open Questions

1. **Should CLI emit progress/status in non-interactive mode?**
   - Current: No progress output
   - Option A: Silent (only final result/errors)
   - Option B: Structured output (JSON progress events)
   - **Recommendation**: Start with silent, add structured output if needed

2. **How should skills handle CLI errors in non-interactive mode?**
   - Current: Exit codes only
   - Option A: Parse stderr for error messages
   - Option B: CLI returns structured error JSON
   - **Recommendation**: Start with exit codes, improve error messages

3. **Should we validate answers in plugin before passing to CLI?**
   - Current: No validation in plugin
   - Pro: Catch errors earlier, better UX
   - Con: Duplicates validation logic
   - **Recommendation**: CLI validates, plugin shows clear errors from CLI

4. **Future: Generate plugin Q&A from CLI question schema?**
   - Not in scope for this change
   - Consider for future enhancement
   - Would eliminate duplication risk
