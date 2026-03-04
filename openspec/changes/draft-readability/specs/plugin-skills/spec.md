## MODIFIED Requirements

### Requirement: Iterate skill executes post-run document generation
The `deepfield-iterate` skill SHALL invoke the three document generation scripts (`generate-drafts-index.js`, `generate-domain-readme.js`, `generate-run-review-guide.js`) at the end of each run's synthesis phase, after domain drafts and the changelog have been updated but before reporting completion to the user.

#### Scenario: All three documents generated after iterate run
- **WHEN** a `deepfield-iterate` run completes its synthesis phase
- **THEN** `drafts/README.md`, all per-domain companion READMEs, and `wip/run-N/review-guide.md` are generated before the skill reports completion

#### Scenario: Generation failure does not abort the run
- **WHEN** one of the document generation scripts fails
- **THEN** the iterate skill logs a warning and continues, because the generation documents are supplementary and must not block core learning output

### Requirement: Bootstrap skill executes post-run document generation
The `deepfield-bootstrap` skill SHALL invoke the three document generation scripts at the end of Run 0, after initial drafts and the learning plan have been created.

#### Scenario: All three documents generated after bootstrap
- **WHEN** `deepfield-bootstrap` completes Run 0
- **THEN** `drafts/README.md`, per-domain companion READMEs, and `wip/run-0/review-guide.md` are generated before the skill reports completion
