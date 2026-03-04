## ADDED Requirements

### Requirement: df-ff command validates prerequisites before starting
The `/df-ff` command SHALL verify the same prerequisites as `/df-iterate` before invoking any skill: `deepfield/` directory exists, Run 0 is complete (`deepfield/wip/run-0/run-0.config.json` exists), and `deepfield/wip/learning-plan.md` exists.

#### Scenario: Missing deepfield directory
- **WHEN** user runs `/df-ff` and no `deepfield/` directory exists in cwd
- **THEN** command prints "No deepfield/ directory found. Run /df-init first." and exits without invoking the skill

#### Scenario: Bootstrap not complete
- **WHEN** user runs `/df-ff` and `deepfield/wip/run-0/run-0.config.json` does not exist
- **THEN** command prints "Bootstrap (Run 0) not complete. Run /df-continue first." and exits

#### Scenario: No learning plan
- **WHEN** user runs `/df-ff` and `deepfield/wip/learning-plan.md` does not exist
- **THEN** command prints "No learning plan found. Bootstrap may have failed. Check /df-status." and exits

#### Scenario: All prerequisites satisfied
- **WHEN** user runs `/df-ff` and all prerequisites exist
- **THEN** command prints starting message and invokes the `deepfield-ff` skill

### Requirement: df-ff command accepts configurable arguments
The `/df-ff` command SHALL accept the following optional arguments and pass them to the `deepfield-ff` skill:

- `--max-runs <n>`: Maximum number of iterations to execute (default: 10, hard cap: 50)
- `--min-confidence <n>`: Minimum confidence percentage threshold to achieve (default: 80)
- `--domains <list>`: Comma-separated domain names to focus on (default: all domains)
- `--stop-on-blocked`: Flag that stops execution if any run is blocked (default: false)
- `--feedback-at-end`: Flag controlling whether to prompt for feedback after all runs (default: true)

#### Scenario: Default arguments
- **WHEN** user runs `/df-ff` with no arguments
- **THEN** skill is invoked with max-runs=10, min-confidence=80, domains=all, stop-on-blocked=false, feedback-at-end=true

#### Scenario: Custom max-runs
- **WHEN** user runs `/df-ff --max-runs 5`
- **THEN** skill is invoked with max-runs=5

#### Scenario: Max runs exceeds hard cap
- **WHEN** user runs `/df-ff --max-runs 100`
- **THEN** command warns "max-runs capped at 50" and invokes skill with max-runs=50

#### Scenario: Domain filter specified
- **WHEN** user runs `/df-ff --domains auth,api`
- **THEN** skill is invoked with domains filter set to ["auth", "api"]

#### Scenario: Unknown argument
- **WHEN** user runs `/df-ff --unknown-flag`
- **THEN** command prints usage help and exits with error

### Requirement: df-ff command shows start summary before delegating
The `/df-ff` command SHALL print a brief start summary showing the configuration before invoking the skill, so the user knows what will run.

#### Scenario: Start summary printed
- **WHEN** all prerequisites pass and valid arguments are parsed
- **THEN** command prints: max-runs, min-confidence target, domain filter (or "all"), and then "Invoking fast-forward learning..." before delegating to skill
