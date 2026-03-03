## Why

Users currently can't install Deepfield via the Claude Code plugin system — there's no marketplace catalog pointing to it. Adding a `marketplace.json` at the repo root lets anyone install with a single command: `/plugin marketplace add TomazWang/deepfield`.

## What Changes

- Add `.claude-plugin/marketplace.json` at the repository root, cataloging the `deepfield` plugin
- The plugin source points to `./plugin` (the existing plugin directory)
- Update README with installation instructions via marketplace

## Capabilities

### New Capabilities

- `plugin-marketplace`: Marketplace catalog that enables Claude Code users to discover and install Deepfield via `/plugin marketplace add` and `/plugin install deepfield@deepfield`

### Modified Capabilities

## Impact

- New file: `/.claude-plugin/marketplace.json`
- Updated: `README.md` (add install instructions)
- No changes to existing plugin code or behavior
