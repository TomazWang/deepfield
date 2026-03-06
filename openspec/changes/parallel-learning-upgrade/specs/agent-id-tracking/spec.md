## ADDED Requirements

### Requirement: Agent IDs recorded in run config
After each batch of domain agents completes, the skill SHALL record the agent IDs returned by Agent tool calls in the run config under the `agentIds` key.

#### Scenario: Agent IDs stored per domain
- **WHEN** Agent tool calls return IDs for a completed batch
- **THEN** the run config is updated with `agentIds: { "<domain>": "<agent-id>", ... }` entries for each domain in the batch

#### Scenario: Agent IDs recorded for failed agents
- **WHEN** an agent is launched (Agent tool returns an ID) but subsequently fails to produce a findings file
- **THEN** the agent ID is still recorded in `agentIds` with the domain key, alongside recording the domain in `domainsFailed`

#### Scenario: Missing agent ID is tolerated
- **WHEN** the Agent tool does not return an ID for a given call
- **THEN** the domain is omitted from the `agentIds` map (no null/undefined entries written); the skill does not abort

#### Scenario: Run config shape after parallel run
- **WHEN** a parallel run completes (with or without failures)
- **THEN** the run config contains: `parallelMode: true`, `domainsAnalyzed: [...]`, `domainsFailed: [...]`, and `agentIds: { ... }`
