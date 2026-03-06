## MODIFIED Requirements

### Requirement: deepfield-iterate skill parallel mode section uses Agent tool launch pattern
The `deepfield-iterate` skill's parallel execution section (Step 4d) SHALL instruct Claude to launch domain learner agents using the Agent tool with `run_in_background: true` and inline context, not prose launch instructions.

#### Scenario: Skill instructs Agent tool usage
- **WHEN** the deepfield-iterate skill reaches Step 4d (Launch Agents in Batches)
- **THEN** the skill contains explicit instructions to call the Agent tool (not `Launch (background): ...` prose)
- **THEN** the skill specifies `run_in_background: true` for each agent call
- **THEN** each agent prompt includes domain name, file list, all input/output paths, and open questions inline

#### Scenario: Skill instructs single-message batch launch
- **WHEN** the skill describes how to launch a batch
- **THEN** the instructions explicitly state all agents in the batch SHALL be launched in a single message containing multiple Agent tool calls

### Requirement: deepfield-iterate skill mode selection uses sequential opt-out logic
The `deepfield-iterate` skill's mode selection step SHALL default to parallel when `domain-index.md` is present and run sequential only when `--sequential` was explicitly passed or domain index is absent.

#### Scenario: Mode selection at Step 4
- **WHEN** the skill reaches Step 4 (mode selection)
- **THEN** skill checks for `--sequential` flag first
- **THEN** if not sequential, checks for `domain-index.md`
- **THEN** if domain index exists, proceeds to parallel mode
- **THEN** if domain index absent, falls back to sequential with warning message
