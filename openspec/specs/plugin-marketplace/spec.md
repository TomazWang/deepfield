# Spec: plugin-marketplace

## Purpose

Defines requirements for the Claude Code marketplace catalog that enables users to discover and install the Deepfield plugin via the plugin system.

## Requirements

### Requirement: Marketplace catalog file exists
The repository SHALL contain a `.claude-plugin/marketplace.json` file at the root that conforms to the Claude Code marketplace schema.

#### Scenario: File exists at correct path
- **WHEN** a user clones or inspects the repository root
- **THEN** `.claude-plugin/marketplace.json` SHALL be present

#### Scenario: Valid marketplace JSON
- **WHEN** `claude plugin validate .` is run from the repo root
- **THEN** the command SHALL succeed with no errors

### Requirement: Marketplace catalogs the deepfield plugin
The marketplace.json SHALL list the `deepfield` plugin with source pointing to `./plugin`.

#### Scenario: Plugin is discoverable
- **WHEN** a user adds the marketplace via `/plugin marketplace add TomazWang/deepfield`
- **THEN** the `deepfield` plugin SHALL appear in the marketplace listing

#### Scenario: Plugin is installable
- **WHEN** a user runs `/plugin install deepfield@deepfield`
- **THEN** Claude Code SHALL successfully install the plugin from `./plugin`

### Requirement: README documents marketplace installation
The repository README SHALL include instructions for installing via the marketplace.

#### Scenario: Install instructions present
- **WHEN** a user visits the repository README
- **THEN** they SHALL find the `/plugin marketplace add` and `/plugin install` commands to install Deepfield
