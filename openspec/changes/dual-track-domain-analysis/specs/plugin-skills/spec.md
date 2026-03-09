## MODIFIED Requirements

### Requirement: deepfield-bootstrap generates dual domain indexes
The `deepfield-bootstrap` skill SHALL generate both `wip/behavior-index.md` and `wip/tech-index.md` during Run 0, replacing the previous single `wip/domain-index.md`.

#### Scenario: Bootstrap completes Run 0
- **WHEN** the bootstrap skill finishes all steps
- **THEN** `wip/behavior-index.md` exists (from Q&A or detected docs), `wip/tech-index.md` exists (from source code scan), and `wip/domain-index.md` does NOT exist

#### Scenario: Bootstrap step order
- **WHEN** Run 0 bootstrap executes domain detection
- **THEN** steps run in order: (1) scan source code → write `tech-index.md`; (2) scan reference docs → run `detect-behavior-domains.js`; (3) interactive Q&A → write `behavior-index.md`; (4) invoke domain-linker → write `domain-links.md`

### Requirement: deepfield-iterate uses --track to scope learning runs
The `deepfield-iterate` skill SHALL read the `--track` argument and scope agent invocations accordingly.

#### Scenario: Track-scoped parallel batch
- **WHEN** iterate runs with `--track tech`
- **THEN** only agents for tech domains are included in the parallel batch; behavior domains are skipped

#### Scenario: Default both-track run
- **WHEN** iterate runs without `--track`
- **THEN** behavior and tech domain agents are included in the same parallel batch (up to the configured max-concurrent limit)

#### Scenario: Output path construction
- **WHEN** iterate constructs the output path for a domain agent
- **THEN** path is `drafts/behavior/{name}/` for behavior domains and `drafts/tech/{name}/` for tech domains

### Requirement: deepfield-iterate invokes domain-linker after learning batch
After each learning batch that discovers new domains, `deepfield-iterate` SHALL invoke `deepfield-domain-linker` to update `domain-links.md`.

#### Scenario: New domain discovered during learning
- **WHEN** a domain-learner agent identifies a new domain not in either index
- **THEN** after the batch completes, the iterate skill invokes the linker agent to extend `domain-links.md`
