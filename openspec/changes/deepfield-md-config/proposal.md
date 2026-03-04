## Why

Users currently have no way to configure HOW Deepfield learns and documents their project — language, priorities, exclusions, domain quirks, and output style are all hardcoded defaults. Adding `DEEPFIELD.md` lets teams express project-specific learning instructions that persist across runs.

## What Changes

- New `DEEPFIELD.md` template in `plugin/templates/` that users optionally create in `deepfield/`
- New script `plugin/scripts/parse-deepfield-config.js` that reads and parses `DEEPFIELD.md` into structured config
- `/df-init` command updated to optionally scaffold `DEEPFIELD.md`
- Learning agents and skills updated to read config and inject relevant instructions into their prompts
- All operations remain backward-compatible when `DEEPFIELD.md` is absent

## Capabilities

### New Capabilities
- `deepfield-md-config`: Parse and expose `DEEPFIELD.md` configuration (language, priorities, exclusions, domain instructions, output preferences, trust hierarchy) to skills and agents

### Modified Capabilities
- `plugin-commands`: `/df-init` gains optional DEEPFIELD.md scaffolding step
- `plugin-skills`: Learning skills gain config injection — priorities, exclusions, language, domain instructions

## Impact

- New file: `plugin/templates/DEEPFIELD.md`
- New script: `plugin/scripts/parse-deepfield-config.js`
- Modified: `plugin/commands/df-init.md` (optional DEEPFIELD.md creation)
- Modified: `plugin/skills/` learning skills (read and use config)
- No breaking changes — all changes are additive, works without DEEPFIELD.md
