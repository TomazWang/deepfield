## ADDED Requirements

### Requirement: df-iterate supports --track flag
The `/df-iterate` command SHALL accept a `--track` argument to narrow learning to one domain type.

#### Scenario: --track behavior
- **WHEN** user runs `/df-iterate --track behavior`
- **THEN** only behavior domains from `behavior-index.md` are queued for learning; source file scope is limited to reference docs

#### Scenario: --track tech
- **WHEN** user runs `/df-iterate --track tech`
- **THEN** only tech domains from `tech-index.md` are queued for learning; source file scope is limited to source code

#### Scenario: --track both (default)
- **WHEN** user runs `/df-iterate` with no `--track` flag
- **THEN** both behavior and tech domains are queued; parallel batch mode runs agents from both tracks concurrently

### Requirement: Draft output routes to correct subtree by track
Agents writing output SHALL use `drafts/behavior/{name}/` for behavior domains and `drafts/tech/{name}/` for tech domains.

#### Scenario: Behavior domain spec written
- **WHEN** a domain-learner agent runs for a behavior domain
- **THEN** its output spec file is written to `drafts/behavior/{name}/spec.md`

#### Scenario: Tech domain spec written
- **WHEN** a domain-learner agent runs for a tech domain
- **THEN** its output spec file is written to `drafts/tech/{name}/spec.md`

#### Scenario: Legacy drafts/domains/ path not used
- **WHEN** any learning run completes on a workspace version >= 0.7.0
- **THEN** no files are written to `drafts/domains/` (the old path is not used)

### Requirement: Domain-learner agent receives track context
The `deepfield-domain-learner` agent invocation SHALL include a `track` parameter (`behavior` or `tech`).

#### Scenario: Behavior track learner
- **WHEN** a domain-learner agent is launched with `track: behavior`
- **THEN** the agent focuses on user-facing concerns: user stories, product features, business rules; it avoids recording implementation details

#### Scenario: Tech track learner
- **WHEN** a domain-learner agent is launched with `track: tech`
- **THEN** the agent focuses on implementation concerns: architecture, APIs, data models, dependencies; it avoids recording business justifications

### Requirement: Multiple spec files per domain supported
A single domain SHALL support multiple spec files under its folder.

#### Scenario: Behavior domain with multiple specs
- **WHEN** a behavior domain has distinct concerns (e.g. user-stories, security-rules, error-scenarios)
- **THEN** each concern is written as a separate file: `drafts/behavior/{name}/user-stories.md`, `drafts/behavior/{name}/security-rules.md`, etc.

#### Scenario: Default spec file
- **WHEN** a domain has only one spec
- **THEN** it is named `spec.md`: `drafts/behavior/{name}/spec.md`
