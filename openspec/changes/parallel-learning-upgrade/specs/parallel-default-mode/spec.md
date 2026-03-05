## ADDED Requirements

### Requirement: Parallel mode is default after bootstrap
When `domain-index.md` exists and no mode flag is provided, the skill SHALL execute in parallel domain learning mode without requiring any flag.

#### Scenario: Default parallel when domain index exists
- **WHEN** user runs `/df-iterate` with no mode flags and `deepfield/wip/domain-index.md` exists
- **THEN** the skill runs in parallel mode (multiple domain agents concurrently)

#### Scenario: Sequential opt-out overrides default
- **WHEN** user runs `/df-iterate --sequential`
- **THEN** the skill runs in sequential mode regardless of whether `domain-index.md` exists

#### Scenario: Graceful fallback when domain index missing
- **WHEN** user runs `/df-iterate` with no mode flags and `deepfield/wip/domain-index.md` does NOT exist
- **THEN** the skill falls back to sequential mode and logs: "domain-index.md not found — falling back to sequential learning. Run /df-bootstrap first to enable parallel learning."

#### Scenario: `--parallel` flag is no longer accepted
- **WHEN** user runs `/df-iterate --parallel`
- **THEN** the command reports that `--parallel` is not a recognized flag and suggests removing it (parallel is now the default)
