## ADDED Requirements

### Requirement: Domain learner agents launched via explicit Agent tool calls
The skill SHALL instruct Claude to launch `deepfield-domain-learner` agents using the Agent tool with `run_in_background: true`, not via prose launch instructions.

#### Scenario: Agent tool invocation with inline context
- **WHEN** the skill launches a domain learner for domain "auth"
- **THEN** the skill instructs Claude to call the Agent tool with `run_in_background: true` and a prompt string that embeds: domain name, file list, previousFindingsPath, findingsOutputPath, unknownsOutputPath, open questions, and currentDraftPath

#### Scenario: No external agent file reference in prompt
- **WHEN** the skill constructs the agent prompt
- **THEN** the prompt does NOT tell the agent to read an agent definition file; all role and instruction content is inline in the prompt string

#### Scenario: Batch launched in a single message
- **WHEN** a batch of N domains (N ≤ maxAgents) is ready to launch
- **THEN** the skill instructs Claude to issue all N Agent tool calls in a single message (one tool-call block), so they execute concurrently

#### Scenario: Wait for batch completion before next batch
- **WHEN** a batch of agents has been launched
- **THEN** the skill instructs Claude to wait for all agents in that batch to complete before launching the next batch
