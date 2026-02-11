## ADDED Requirements

### Requirement: Project SHALL use npm workspaces

The monorepo MUST use npm workspaces to manage cli/ and plugin/ packages.

#### Scenario: Workspace configuration
- **WHEN** root package.json is examined
- **THEN** workspaces field includes ["cli", "plugin"]
- **THEN** both packages are linked automatically

#### Scenario: Dependency installation
- **WHEN** npm install runs at root
- **THEN** all workspace dependencies are installed
- **THEN** packages can import from each other

### Requirement: CLI SHALL be independently buildable

The cli/ package MUST be buildable and publishable as standalone npm package.

#### Scenario: Build CLI
- **WHEN** npm run build executes in cli/
- **THEN** TypeScript compiles to dist/
- **THEN** binary is created at dist/cli.js
- **THEN** package is ready for npm publish

#### Scenario: Test CLI independently
- **WHEN** CLI tests run
- **THEN** no plugin dependencies are required
- **THEN** all tests pass without plugin

### Requirement: Plugin SHALL depend on CLI

The plugin MUST reference CLI package as dependency for bundling or peer dependency for external install.

#### Scenario: Plugin references CLI
- **WHEN** plugin/package.json is examined
- **THEN** CLI package is listed as dependency or peer dependency
- **THEN** version constraint matches CLI version

### Requirement: Shared configuration SHALL be centralized

TypeScript config and other shared settings MUST be defined at root level.

#### Scenario: TypeScript configuration
- **WHEN** tsconfig.json exists at root
- **THEN** cli/tsconfig.json extends root config
- **THEN** plugin/tsconfig.json extends root config (if needed)

### Requirement: Build process SHALL be coordinated

The build process MUST build both CLI and plugin with proper dependency order.

#### Scenario: Root build script
- **WHEN** npm run build executes at root
- **THEN** CLI builds first
- **THEN** plugin builds after CLI is ready
- **THEN** both are ready for use

### Requirement: Version SHALL be synchronized

CLI and plugin MUST share the same version number defined at root.

#### Scenario: Version consistency
- **WHEN** root package.json has version "1.0.0"
- **THEN** cli/package.json inherits or matches this version
- **THEN** plugin/package.json references this version
- **THEN** single source of truth for versioning
