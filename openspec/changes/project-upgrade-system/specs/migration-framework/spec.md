## ADDED Requirements

### Requirement: Migration script interface
Each migration script SHALL export a CJS module with fields: `from` (semver string), `to` (semver string), `description` (human-readable summary), `check(projectPath)` (async function returning boolean — true if migration is needed), `migrate(projectPath, options)` (async function performing the migration, returning `{ success, changes[], filesCreated, filesUpdated }`), and `rollback(projectPath)` (async function reverting changes, returning `{ success }`).

#### Scenario: Migration reports changes
- **WHEN** `migrate()` completes successfully
- **THEN** it returns an object with `success: true` and a `changes` array listing human-readable descriptions of each change made

#### Scenario: Migration rollback reverts changes
- **WHEN** `rollback()` is called after a failed or unwanted migration
- **THEN** all files created or modified by `migrate()` are removed or restored to their prior state

### Requirement: Migration orchestrator chains migrations
The orchestrator in `cli/migrations/index.js` SHALL implement `getRequiredMigrations(fromVersion, toVersion)` that returns the ordered array of migration modules needed to go from `fromVersion` to `toVersion`. It SHALL implement `runMigrations(projectPath, migrations, options)` that executes each migration in sequence and rolls back all applied migrations in the batch if any single migration throws.

#### Scenario: Full chain from old to latest
- **WHEN** `getRequiredMigrations('1.0.0', '2.5.0')` is called
- **THEN** it returns the array of all intermediate migration modules in order

#### Scenario: Partial chain for incremental upgrade
- **WHEN** `getRequiredMigrations('2.1.0', '2.3.0')` is called
- **THEN** it returns only the migration modules covering that range

#### Scenario: No migration needed for same version
- **WHEN** `getRequiredMigrations('2.5.0', '2.5.0')` is called
- **THEN** it returns an empty array

#### Scenario: Missing migration throws
- **WHEN** no migration module exists from the current version
- **THEN** `getRequiredMigrations` throws an error identifying the gap

#### Scenario: Rollback on failure
- **WHEN** migration N in a batch throws an error
- **THEN** the orchestrator rolls back migration N and all previously applied migrations in that batch, then rethrows the error

### Requirement: Migration history recorded
After a successful migration chain, the orchestrator SHALL update `project.config.json` with `deepfieldVersion` set to the target version, `lastUpgraded` set to the current ISO timestamp, and a new entry appended to `migrationHistory` for each migration that ran.

#### Scenario: History entry appended per migration
- **WHEN** a chain of 3 migrations runs successfully
- **THEN** `migrationHistory` in `project.config.json` gains exactly 3 new entries each containing `from`, `to`, `date`, and `changes`
