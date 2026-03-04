## ADDED Requirements

### Requirement: Domain-learner agent SHALL analyze a single domain in isolation
The system SHALL provide a `deepfield-domain-learner` agent that accepts a domain name, file list, and previous findings path, then writes domain-scoped findings and unknowns to specified output paths.

#### Scenario: Agent receives domain inputs and produces findings
- **WHEN** the agent is launched with domain name, file list, and output paths
- **THEN** it reads only the files in the provided list
- **THEN** it writes findings to `deepfield/wip/run-N/domains/<domain>-findings.md`
- **THEN** it writes unknowns to `deepfield/wip/run-N/domains/<domain>-unknowns.md`
- **THEN** it includes a confidence score in the findings

#### Scenario: Agent does not read cross-domain files
- **WHEN** the agent analyzes a domain
- **THEN** it SHALL NOT read files outside the provided file list
- **THEN** it does not synthesize cross-cutting concerns (that is the orchestrator's job)

### Requirement: Parallel orchestration SHALL spawn one domain-learner agent per domain concurrently
The `deepfield-iterate` skill in parallel mode SHALL launch all domain-learner agents as background Tasks simultaneously (up to `--max-agents` limit), then wait for all to complete before proceeding.

#### Scenario: Multiple agents launched in parallel
- **WHEN** parallel mode is active and there are N domains (N <= max-agents)
- **THEN** N domain-learner agents are launched concurrently as background Tasks
- **THEN** the skill waits until all N agents have completed
- **THEN** findings consolidation runs only after all agents finish

#### Scenario: Batching when domains exceed max-agents cap
- **WHEN** parallel mode is active and domain count exceeds max-agents
- **THEN** domains are split into batches of size max-agents
- **THEN** each batch runs fully in parallel
- **THEN** batches are processed sequentially

### Requirement: gather-domain-findings.js script SHALL consolidate per-domain findings
A script at `plugin/scripts/gather-domain-findings.js` SHALL read all `<domain>-findings.md` files from a run's domains directory and concatenate them into the canonical `findings.md` for that run.

#### Scenario: Successful consolidation
- **WHEN** the script is called with a run directory path
- **THEN** it reads all `*.md` files from `<run-dir>/domains/`
- **THEN** it writes a consolidated `<run-dir>/findings.md`
- **THEN** each domain's findings section is clearly delimited with a header

#### Scenario: Missing domain findings are reported
- **WHEN** a domain's findings file does not exist
- **THEN** the script logs a warning for the missing domain
- **THEN** it continues consolidating available findings
- **THEN** it exits with a non-zero code only if NO domain findings exist

### Requirement: df-iterate command SHALL accept --parallel and --max-agents flags
The `/df-iterate` command SHALL document and pass `--parallel` and `--max-agents=N` arguments to the skill.

#### Scenario: --parallel flag enables concurrent mode
- **WHEN** user runs `/df-iterate --parallel`
- **THEN** the skill uses parallel agent execution
- **THEN** a message indicates parallel mode is active and how many agents will run

#### Scenario: --max-agents limits concurrency
- **WHEN** user runs `/df-iterate --parallel --max-agents=3`
- **THEN** no more than 3 domain agents run concurrently at once

#### Scenario: Default (no --parallel) uses sequential mode unchanged
- **WHEN** user runs `/df-iterate` without --parallel
- **THEN** existing sequential learning workflow executes
- **THEN** no behavioral change from pre-feature behavior

### Requirement: Parallel run SHALL handle partial agent failure gracefully
If one or more domain agents fail to produce findings, the orchestration SHALL continue with available results and report failures clearly.

#### Scenario: One agent fails, others succeed
- **WHEN** agent for domain "auth" fails during a parallel run
- **THEN** findings from other domains are still consolidated
- **THEN** synthesis proceeds on available findings
- **THEN** a warning is displayed listing which domains did not produce findings
- **THEN** the run is marked completed (not failed) with a partial-results note in run config
