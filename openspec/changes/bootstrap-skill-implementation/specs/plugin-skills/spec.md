## MODIFIED Requirements

### Requirement: Bootstrap skill SHALL orchestrate script-based Run 0
The deepfield-bootstrap skill MUST invoke `bootstrap-runner.js` to execute all Run 0 steps using scripts and templates, without requiring AI agents. The skill describes the workflow and delegates execution to the script orchestrator.

#### Scenario: Skill invokes bootstrap runner
- **WHEN** the bootstrap skill is triggered
- **THEN** skill instructs Claude to run `node plugin/scripts/bootstrap-runner.js`
- **THEN** all Run 0 steps execute via the script

#### Scenario: Skill validates prerequisites
- **WHEN** bootstrap skill is triggered
- **THEN** skill checks that deepfield/source/baseline/brief.md exists
- **THEN** skill checks that no run-0 has already been completed
- **THEN** if prerequisites fail, appropriate error message is shown

#### Scenario: Skill reports state transition
- **WHEN** bootstrap-runner.js completes successfully
- **THEN** skill reports transition from BRIEF_READY to RUN_0_COMPLETE
- **THEN** user is told to run /df-continue for Run 1
