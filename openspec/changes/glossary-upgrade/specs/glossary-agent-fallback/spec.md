## ADDED Requirements

### Requirement: deepfield-iterate skill guards terminology.md existence before Step 5.6
The `deepfield-iterate` skill SHALL check whether `deepfield/drafts/cross-cutting/terminology.md` exists immediately before executing Step 5.6 (terminology extraction). If the file is absent, the skill SHALL create it from the plugin template via `upgrade:scaffold-cross-cutting` before calling `extract-terminology.js`.

#### Scenario: terminology.md missing at start of Step 5.6
- **WHEN** Step 5.6 begins and `deepfield/drafts/cross-cutting/terminology.md` does not exist
- **THEN** the skill runs `upgrade:scaffold-cross-cutting` to create the file from template
- **THEN** the skill logs: `Warning: terminology.md was missing — created from template before extraction`
- **THEN** `extract-terminology.js` proceeds normally with the newly created file
- **THEN** the run is NOT aborted

#### Scenario: terminology.md present at start of Step 5.6
- **WHEN** Step 5.6 begins and `deepfield/drafts/cross-cutting/terminology.md` already exists
- **THEN** the skill skips the scaffold step
- **THEN** `extract-terminology.js` proceeds normally

### Requirement: deepfield-knowledge-synth agent guards unknowns.md existence
The `deepfield-knowledge-synth` agent SHALL check whether `deepfield/drafts/cross-cutting/unknowns.md` exists before writing to it. If the file is absent, the agent SHALL create it from the plugin template via `upgrade:scaffold-cross-cutting`.

#### Scenario: unknowns.md missing when synthesizer runs
- **WHEN** the `deepfield-knowledge-synth` agent attempts to update `unknowns.md` and the file does not exist
- **THEN** the agent invokes the CLI scaffold command to create `unknowns.md` from template
- **THEN** the agent logs: `Warning: unknowns.md was missing — created from template`
- **THEN** the agent proceeds to write unknowns normally

#### Scenario: unknowns.md present when synthesizer runs
- **WHEN** the `deepfield-knowledge-synth` agent attempts to update `unknowns.md` and the file exists
- **THEN** the agent proceeds without scaffolding
