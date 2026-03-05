## MODIFIED Requirements

### Requirement: df-iterate command exposes --sequential flag instead of --parallel
The `df-iterate` command SHALL define `--sequential` as an opt-out flag and SHALL NOT define `--parallel` as a valid flag.

#### Scenario: --sequential flag defined
- **WHEN** the df-iterate command definition is read
- **THEN** `--sequential` appears in the arguments list with description "Run in sequential mode instead of the parallel default (one domain at a time)"
- **THEN** `--parallel` does NOT appear in the arguments list

#### Scenario: --parallel flag rejected
- **WHEN** user passes `--parallel` to `/df-iterate`
- **THEN** the command reports `--parallel` is not recognized
- **THEN** the command informs the user that parallel is now the default

#### Scenario: Command passes sequential flag to skill
- **WHEN** user runs `/df-iterate --sequential`
- **THEN** the command passes `sequentialMode: true` to the deepfield-iterate skill
- **THEN** the command passes `parallelMode: false` (or omits parallelMode) to the skill

#### Scenario: Command passes parallel default to skill
- **WHEN** user runs `/df-iterate` with no mode flags
- **THEN** the command passes `parallelMode: true` (default) to the deepfield-iterate skill
- **THEN** the skill will determine actual mode based on domain-index.md presence

### Requirement: df-iterate command help text reflects parallel default
The command help text and Tips section SHALL mention that parallel is the default (not opt-in) when domain index exists.

#### Scenario: Updated output documentation
- **WHEN** the command runs in default mode
- **THEN** status line reads "Parallel mode: X domains, max Y agents concurrent" without requiring any flag
- **THEN** the Tips section recommends `--sequential` only when debugging or when targeting a single domain
