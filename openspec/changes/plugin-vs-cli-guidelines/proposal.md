## Why

Deepfield spans two execution environments — the Claude Code plugin (AI-driven, conversational) and the CLI (deterministic, scriptable) — but CLAUDE.md provides no guidance on which environment owns a given feature. As the project grows, ambiguous cases lead to inconsistent decisions, duplicated logic, and integration debt.

## What Changes

- Add a "Plugin vs CLI Guidelines" section to `CLAUDE.md` with a decision tree and classification rules
- Add inline comments to existing ambiguous cases in `plugin/` and `cli/` directories to demonstrate correct attribution
- Document hybrid patterns (where both layers participate) with clear ownership boundaries

## Capabilities

### New Capabilities

- `plugin-vs-cli-decision-tree`: A structured decision tree in CLAUDE.md that helps contributors classify any feature as Plugin-only, CLI-only, or hybrid, based on criteria such as AI involvement, determinism, user interaction mode, and trust requirements

### Modified Capabilities

- None

## Impact

- `CLAUDE.md` — primary target, receives the new guidelines section
- `plugin/commands/` — selected commands get inline rationale comments
- `cli/commands/` — selected CLI commands get inline rationale comments
- No runtime behavior changes; documentation and comment-only impact
