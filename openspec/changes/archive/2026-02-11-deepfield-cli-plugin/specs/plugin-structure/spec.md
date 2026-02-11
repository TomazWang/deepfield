## ADDED Requirements

### Requirement: Plugin SHALL follow Claude Code directory conventions

The plugin MUST be structured according to Claude Code plugin specifications with .claude-plugin/ manifest.

#### Scenario: Valid plugin structure
- **WHEN** plugin is loaded by Claude Code
- **THEN** .claude-plugin/plugin.json manifest is found
- **THEN** commands/ directory contains command files
- **THEN** skills/ directory contains skill subdirectories

#### Scenario: Manifest includes metadata
- **WHEN** reading plugin.json
- **THEN** name, version, and description are present
- **THEN** author information is included

### Requirement: Plugin SHALL use proper naming conventions

All plugin components MUST use kebab-case naming and proper file extensions.

#### Scenario: Command naming
- **WHEN** examining commands/ directory
- **THEN** command files are named df-*.md
- **THEN** command names match frontmatter

#### Scenario: Skill naming
- **WHEN** examining skills/ directory
- **THEN** skill directories use kebab-case
- **THEN** each skill has SKILL.md file

### Requirement: Plugin SHALL be installable as Claude Code plugin

The plugin MUST be installable via symlink or copy to Claude plugins directory.

#### Scenario: Plugin installation
- **WHEN** plugin is symlinked to ~/.claude/plugins/
- **THEN** Claude Code discovers plugin
- **THEN** commands become available as /df-*
- **THEN** skills load automatically
