## Context

Deepfield has two distinct runtime environments:

- **Plugin** (`./plugin/`): Runs inside Claude Code. Has direct access to AI capabilities. Entry points are slash commands (`/df-*`), orchestrated by skills, and executed by agents. Designed for conversational, context-rich, AI-driven workflows.
- **CLI** (`./cli/`): Runs as a standalone Node.js process. No AI access. Entry points are terminal commands (`deepfield <cmd>`). Designed for deterministic, scriptable, repeatable operations.

Currently CLAUDE.md describes each component in isolation but provides no classification heuristic. Contributors facing an ambiguous feature (e.g., "validate config on startup") have no framework for deciding which layer owns it or how a hybrid should be split.

## Goals / Non-Goals

**Goals:**
- Define clear, testable criteria for classifying any feature as Plugin-only, CLI-only, or hybrid
- Provide a decision tree that any contributor can follow without prior project knowledge
- Document at least three concrete examples covering each classification category
- Add inline rationale comments to two existing ambiguous cases (one per layer) to demonstrate the pattern in practice

**Non-Goals:**
- Changing any runtime behavior of the plugin or CLI
- Moving existing features between layers
- Defining testing strategies for either layer
- Covering third-party plugin integrations

## Architectural Constraint: One-Way Dependency Rule

**The Plugin MAY invoke the CLI. The CLI MUST NEVER invoke or depend on the Plugin.**

This is not a guideline — it is an architectural invariant. The CLI is a standalone Node.js process with no AI access and no knowledge of Claude Code internals. Allowing the CLI to call into the plugin would:

- Create a circular dependency between layers
- Break CLI usage in headless/CI environments (where Claude Code is absent)
- Couple a deterministic layer to a non-deterministic AI runtime

**Enforcement:**

- Any hybrid feature that crosses the boundary MUST be implemented as: Plugin calls CLI helpers (scripts, commands). Never the reverse.
- Code review MUST reject any CLI code that imports, shells out to, or otherwise depends on plugin-layer artifacts.
- The decision tree explicitly models the hybrid pattern as "Plugin calls CLI helpers", with no path where CLI calls plugin.

## Decisions

### Decision 1: Guidelines live in CLAUDE.md, not a separate doc

**Chosen**: Extend CLAUDE.md with a new "Plugin vs CLI Guidelines" section.

**Rationale**: CLAUDE.md is the single authoritative reference Claude Code reads at session start. Placing guidelines here ensures they are always in context when contributors ask architectural questions. A separate doc risks being overlooked.

**Alternative considered**: A standalone `ARCHITECTURE.md`. Rejected because it is not auto-loaded into context and duplicates the role CLAUDE.md already plays.

### Decision 2: Decision tree uses four criteria in fixed order

**Chosen**: Classify based on: (1) AI involvement required?, (2) must survive without Claude Code?, (3) is the operation deterministic and repeatable?, (4) does it write files atomically?

**Rationale**: These four criteria cover all existing cases and map directly to current architectural properties. Order matters — if AI is required, the answer is always Plugin; if the tool must run headlessly, the answer is always CLI.

**Alternative considered**: Free-form prose rules. Rejected because prose leaves room for ambiguity and requires judgment at every step; a tree forces a single path.

### Decision 3: Hybrid pattern documented separately from pure cases

**Chosen**: Hybrid features get their own subsection with an explicit ownership boundary table (CLI owns setup/validation, Plugin owns AI interpretation).

**Rationale**: The most common real-world confusion is not "is this plugin or CLI?" but "who does what in a feature that touches both?" The boundary table makes the split explicit.

## Risks / Trade-offs

- [Risk] Decision tree may not cover future feature types (e.g., a web dashboard). → Mitigation: Add an "If none of the above" escape hatch that defaults to CLI for deterministic work and Plugin for AI work, and notes that new criteria should be proposed via an openspec change.
- [Risk] Inline comments in code are easy to write but hard to keep in sync with guidelines as they evolve. → Mitigation: Inline comments reference the CLAUDE.md section by name, making staleness visible.
- [Risk] "Hybrid" classification could become a catch-all that avoids hard decisions. → Mitigation: Hybrid requires an explicit ownership table; vague splits are rejected by the criteria.

## Open Questions

- Should the decision tree be expressed as a Mermaid diagram in addition to prose? (Mermaid renders in GitHub but not in Claude's context window — prose may be more useful in practice.)
