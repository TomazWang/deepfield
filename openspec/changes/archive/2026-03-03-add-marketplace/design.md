## Context

Deepfield is a Claude Code plugin hosted at `TomazWang/deepfield` on GitHub. The plugin lives in `./plugin/` with a valid `plugin.json`. Currently there is no `marketplace.json`, so users cannot install it via the Claude Code plugin system.

The Claude Code marketplace spec requires a `.claude-plugin/marketplace.json` at the repo root. Once present, users can add the marketplace and install the plugin with two commands.

## Goals / Non-Goals

**Goals:**
- Enable installation via `/plugin marketplace add TomazWang/deepfield`
- Enable plugin install via `/plugin install deepfield@deepfield`
- Document installation in README

**Non-Goals:**
- Distributing via npm or pip
- Multiple plugins in the marketplace (just `deepfield` for now)
- Pinning to a specific ref/sha (latest main is fine)

## Decisions

**Marketplace name: `deepfield`**
The marketplace name matches the plugin name. This keeps the install command simple: `deepfield@deepfield`. Alternative of `deepfield-marketplace` was rejected as redundant.

**Plugin source: `"./plugin"`**
The plugin code lives at `./plugin/` in the repo. Using a relative path works correctly because users add the marketplace via git (the whole repo is cloned), not via a direct URL to `marketplace.json`.

**`strict` mode: default (true)**
The plugin already has its own `plugin.json` at `./plugin/.claude-plugin/plugin.json`. Strict mode means that file is the authority. No need to override.

**Version: not set in marketplace entry**
Per docs: for plugins with their own `plugin.json`, set the version there (not in the marketplace entry) to avoid silent conflicts. The existing `plugin.json` already has `"version": "1.0.0"`.

## Risks / Trade-offs

- **Relative path only works with git-based install** → Acceptable; the repo is on GitHub and git-based install is the expected path. If URL-based distribution is needed later, switch sources to `{"source": "github", "repo": "TomazWang/deepfield"}`.

## Open Questions

None.
